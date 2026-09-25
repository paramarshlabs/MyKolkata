import { ARCHETYPES, CALIBRATION, DIMENSION_IDS, MODEL_VERSION, QUESTION_INDEX } from './config'
import type {
  Answer, Archetype, ArchetypeId, Because, Classification, DimensionId, Estimate, Evidence,
  Neutral, PujoResult, Question, RankedRow, Tiebreak, Vector,
} from './types'

/*
 * The Pujo Personality scoring engine. A typed port of
 * product-design/pujo-personality/model/scoring.mjs, which is where the model
 * is simulated and validated (see that folder's SIMULATION.md).
 *
 * Interpretable on purpose: every answer moves named dimensions by a stated
 * amount; every archetype is a point in the same space with stated weights.
 * Pure functions, safe on the client (instant reveal) and the server.
 *
 * Two corrections make it fair:
 * 1. Balanced evidence. Choosing one answer is also a small signal about the
 *    answers not chosen, and each question is centred so random tapping lands
 *    at the neutral point instead of drifting towards any archetype.
 * 2. Calibration. Small per-archetype offsets (model/calibration.json) keep a
 *    random respondent equally likely to land in any of the nine.
 */

export const MODEL_DEFAULTS = {
  priorMean: 0.5,
  priorStrength: 1.0,
  centerEvidence: true,
  implicitWeight: 0.5,
  temperature: 0.12,
  cosineTemperature: 0.6,
  secondaryMin: 0.12,
  tieMargin: 0.06,
  clearMargin: 0.2,
} as const

export type ModelOptions = Partial<typeof MODEL_DEFAULTS> & { bias?: Partial<Record<ArchetypeId, number>> }

const zeros = (): Vector => Object.fromEntries(DIMENSION_IDS.map((d) => [d, 0])) as Vector

const balancedCache = new WeakMap<Question, { implicitWeight: number; table: Record<string, Evidence> }>()

/* Correction 1: the not-chosen signal, centred so a random choice averages to 0.5. */
export function balancedEvidence(question: Question, implicitWeight: number = MODEL_DEFAULTS.implicitWeight) {
  const cached = balancedCache.get(question)
  if (cached && cached.implicitWeight === implicitWeight) return cached.table
  const dims = new Set(question.options.flatMap((o) => Object.keys(o.evidence ?? {}) as DimensionId[]))
  const table: Record<string, Evidence> = Object.fromEntries(question.options.map((o) => [o.id, {}]))
  for (const d of dims) {
    const maxW = Math.max(...question.options.map((o) => o.evidence?.[d]?.[1] ?? 0))
    const rows = question.options.map((o) => {
      const [v, w] = o.evidence?.[d] ?? [0.5, implicitWeight * maxW]
      return { id: o.id, v, w }
    })
    const meanW = rows.reduce((s, r) => s + r.w, 0) / rows.length
    const shift = rows.reduce((s, r) => s + r.w * (r.v - 0.5), 0) / rows.length / meanW
    for (const r of rows) table[r.id][d] = [Math.min(1, Math.max(0, r.v - shift)), r.w]
  }
  balancedCache.set(question, { implicitWeight, table })
  return table
}

/* Multi-select answers split one question's weight, so two picks never count double. */
export function estimateVector(
  answers: Answer[],
  questionIndex: ReadonlyMap<string, Question> = QUESTION_INDEX,
  opts: ModelOptions = {},
): Estimate {
  const o = { ...MODEL_DEFAULTS, ...opts }
  const sum = zeros()
  const mass = zeros()
  for (const d of DIMENSION_IDS) sum[d] = o.priorMean * o.priorStrength
  const flags = new Set<string>()

  for (const answer of answers) {
    const question = questionIndex.get(answer.questionId)
    if (!question || !answer.optionIds?.length) continue
    const table = o.centerEvidence ? balancedEvidence(question, o.implicitWeight) : null
    const share = 1 / answer.optionIds.length
    for (const optionId of answer.optionIds) {
      const option = question.options.find((x) => x.id === optionId)
      if (!option) continue
      for (const flag of option.flags ?? []) flags.add(flag)
      const evidence = table ? table[option.id] : option.evidence ?? {}
      for (const [dim, pair] of Object.entries(evidence) as [DimensionId, [number, number]][]) {
        if (!(dim in sum)) continue
        sum[dim] += pair[0] * pair[1] * share
        mass[dim] += pair[1] * share
      }
    }
  }

  const value = zeros()
  const confidence = zeros()
  for (const d of DIMENSION_IDS) {
    value[d] = sum[d] / (o.priorStrength + mass[d])
    confidence[d] = mass[d] / (mass[d] + o.priorStrength)
  }
  return { value, mass, confidence, flags: [...flags] }
}

export function archetypeDistance(estimate: Estimate, archetype: Archetype): number {
  let num = 0
  let den = 0
  for (const d of DIMENSION_IDS) {
    const w = archetype.importance[d] * estimate.confidence[d]
    const diff = estimate.value[d] - archetype.prototype[d]
    num += w * diff * diff
    den += w
  }
  return den > 0 ? num / den : 1
}

export function archetypeCosine(estimate: Estimate, archetype: Archetype, neutral = 0.5): number {
  let dot = 0
  let uu = 0
  let vv = 0
  for (const d of DIMENSION_IDS) {
    const w = archetype.importance[d] * estimate.confidence[d]
    const u = estimate.value[d] - neutral
    const v = archetype.prototype[d] - neutral
    dot += w * u * v
    uu += w * u * u
    vv += w * v * v
  }
  return uu > 0 && vv > 0 ? dot / Math.sqrt(uu * vv) : 0
}

export function scoreArchetypes(estimate: Estimate, archetypes: Archetype[] = ARCHETYPES, opts: ModelOptions = {}): RankedRow[] {
  const o = { ...MODEL_DEFAULTS, ...opts }
  const bias = opts.bias ?? CALIBRATION.bias
  const rows = archetypes.map((a) => {
    const distance = archetypeDistance(estimate, a)
    const cosine = archetypeCosine(estimate, a, o.priorMean)
    const score = -distance / o.temperature + cosine / o.cosineTemperature + (bias[a.id] ?? 0)
    return { id: a.id, distance, cosine, score, p: 0 }
  })
  const max = Math.max(...rows.map((r) => r.score))
  const exp = rows.map((r) => Math.exp(r.score - max))
  const total = exp.reduce((s, v) => s + v, 0)
  rows.forEach((r, i) => { r.p = exp[i] / total })
  return rows.sort((x, y) => y.p - x.p)
}

export function classify(estimate: Estimate, archetypes: Archetype[] = ARCHETYPES, opts: ModelOptions = {}): Classification {
  const o = { ...MODEL_DEFAULTS, ...opts }
  const ranked = scoreArchetypes(estimate, archetypes, opts)
  const [first, second] = ranked
  const margin = first.p - second.p
  const pure = second.p < o.secondaryMin
  return {
    primary: first.id,
    secondary: pure ? null : second.id,
    pure,
    margin,
    needsTiebreak: margin < o.tieMargin,
    band: margin >= o.clearMargin ? 'clear' : margin < o.tieMargin ? 'close' : 'leaning',
    ranked,
  }
}

/* One more question about the dimension that best separates the two leaders,
   favouring what we know least about. */
export function pickTiebreaker(
  estimate: Estimate,
  firstId: ArchetypeId,
  secondId: ArchetypeId,
  archetypes: Archetype[] = ARCHETYPES,
  questionIndex: ReadonlyMap<string, Question> = QUESTION_INDEX,
): Tiebreak | null {
  const a = archetypes.find((x) => x.id === firstId)
  const b = archetypes.find((x) => x.id === secondId)
  if (!a || !b) return null
  let best: Tiebreak | null = null
  for (const d of DIMENSION_IDS) {
    const separation = Math.max(a.importance[d], b.importance[d]) * (a.prototype[d] - b.prototype[d]) ** 2
    const gain = separation * (1 - estimate.confidence[d] * 0.5)
    const question = questionIndex.get(`tb_${d}`)
    if (question && (!best || gain > best.gain)) best = { dim: d, questionId: question.id, gain }
  }
  return best
}

/* The dimensions that pulled hardest towards the primary: "why you got this". */
export function explain(estimate: Estimate, archetype: Archetype, limit = 3): Because[] {
  return DIMENSION_IDS
    .map((d) => {
      const closeness = 1 - Math.abs(estimate.value[d] - archetype.prototype[d])
      return { dim: d, weight: archetype.importance[d] * estimate.confidence[d] * closeness, value: estimate.value[d] }
    })
    .sort((x, y) => y.weight - x.weight)
    .slice(0, limit)
}

/* The Pujo DNA petals: drawn relative to where a typical respondent lands,
   because balanced estimates cluster near 0.5. */
export function dnaPetals(vector: Vector, neutral: Neutral = CALIBRATION.neutral, spread = 0.12): Vector {
  const out = zeros()
  for (const d of DIMENSION_IDS) {
    const n = neutral[d] ?? { mean: 0.5, sd: 0.07 }
    const z = (vector[d] - n.mean) / (n.sd || 0.07)
    out[d] = Math.min(0.98, Math.max(0.05, 0.5 + spread * z))
  }
  return out
}

export function evaluate(answers: Answer[], opts: ModelOptions = {}): PujoResult {
  const estimate = estimateVector(answers, QUESTION_INDEX, opts)
  const result = classify(estimate, ARCHETYPES, opts)
  const tiebreak = result.needsTiebreak
    ? pickTiebreaker(estimate, result.ranked[0].id, result.ranked[1].id)
    : null
  const primary = ARCHETYPES.find((a) => a.id === result.primary)!
  return {
    modelVersion: MODEL_VERSION,
    ...result,
    tiebreak,
    vector: estimate.value,
    confidence: estimate.confidence,
    flags: estimate.flags,
    because: explain(estimate, primary),
  }
}
