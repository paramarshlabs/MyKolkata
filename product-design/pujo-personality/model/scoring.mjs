/*
 * Pujo Personality: reference scoring engine.
 *
 * Interpretable on purpose. Every answer moves named dimensions by a stated
 * amount; every archetype is a point in the same space with stated weights.
 * No training data, no black box, nothing that can't be explained to a user
 * in one sentence ("you answered like a Night Owl on 9 of 13 questions").
 *
 * Pure functions, no dependencies. Safe to run on the client (instant reveal)
 * and on the server (authoritative result, city statistics).
 *
 * Two corrections make it fair, and both came out of the simulation:
 *
 * 1. Balanced evidence. Quiz answers mostly say what people DO ("I dance",
 *    "I plan"), so a person tapping at random drifts high on everything.
 *    Each question's evidence is therefore centred: choosing one option is
 *    also a small signal about the options not chosen. Random tapping now
 *    lands at the neutral point instead of leaning towards any archetype.
 *
 * 2. Relative prototypes. Archetype prototypes describe behaviour in absolute
 *    terms (the Dhunuchi's spotlight is 0.97). For classification they are
 *    compared relative to the centre of all nine, so a dimension where most
 *    archetypes are low does not make the one high archetype a magnet.
 *    Recommendations and explanations still use the absolute values.
 */

export const MODEL_DEFAULTS = Object.freeze({
  priorMean: 0.5, // where every dimension starts before any answer
  priorStrength: 1.0, // how many answers' worth of weight the prior carries
  centerEvidence: true, // correction 1
  implicitWeight: 0.5, // weight of the 'not chosen' signal, as a share of the question's strongest evidence
  prototypeFrame: 'absolute', // 'absolute' | 'relative' (relative tested worse; kept for experiments)
  method: 'hybrid', // 'distance' | 'cosine' | 'hybrid'
  temperature: 0.12, // softmax temperature over weighted distances
  cosineTemperature: 0.6, // softmax temperature over centred cosine similarity
  secondaryMin: 0.12, // below this, the result is 'pure' (no secondary shown)
  tieMargin: 0.06, // top-two probability gap that triggers the tie-breaker
  clearMargin: 0.2, // gap at or above which the result is called 'clear'
  bias: {}, // per-archetype calibration offsets, in score units (see calibration.json)
})

export function indexQuestions(questionsDoc) {
  const index = new Map()
  for (const q of questionsDoc.questions) index.set(q.id, q)
  return index
}

/* The centre of the archetype space: the average of the nine prototypes. */
export function prototypeCentroid(archetypes, dimensionIds) {
  return Object.fromEntries(
    dimensionIds.map((d) => [d, archetypes.reduce((s, a) => s + a.prototype[d], 0) / archetypes.length]),
  )
}

const balancedCache = new WeakMap()

/*
 * Correction 1. For every dimension a question talks about, options that
 * don't mention it carry a small implicit signal (the person chose something
 * else), and all values are shifted so a uniformly random choice averages to
 * the neutral point. Authors keep writing intuitive absolute values in
 * questions.json; this runs once per question.
 */
export function balancedEvidence(question, implicitWeight) {
  const cached = balancedCache.get(question)
  if (cached && cached.implicitWeight === implicitWeight) return cached.table
  const dims = new Set(question.options.flatMap((o) => Object.keys(o.evidence ?? {})))
  const table = Object.fromEntries(question.options.map((o) => [o.id, {}]))
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

/*
 * answers: [{ questionId, optionIds: ['a'] }]
 * Multi-select answers split one question's weight across the chosen options,
 * so picking two soundtracks never counts double.
 */
export function estimateVector(answers, questionIndex, dimensionIds, opts = {}) {
  const { priorMean, priorStrength, centerEvidence, implicitWeight } = { ...MODEL_DEFAULTS, ...opts }
  const sum = Object.fromEntries(dimensionIds.map((d) => [d, priorMean * priorStrength]))
  const mass = Object.fromEntries(dimensionIds.map((d) => [d, 0]))
  const flags = new Set()

  for (const answer of answers) {
    const question = questionIndex.get(answer.questionId)
    if (!question || !answer.optionIds?.length) continue
    const table = centerEvidence ? balancedEvidence(question, implicitWeight) : null
    const share = 1 / answer.optionIds.length
    for (const optionId of answer.optionIds) {
      const option = question.options.find((o) => o.id === optionId)
      if (!option) continue
      for (const flag of option.flags ?? []) flags.add(flag)
      const evidence = table ? table[option.id] : option.evidence ?? {}
      for (const [dim, [value, weight]] of Object.entries(evidence)) {
        if (!(dim in sum)) continue
        sum[dim] += value * weight * share
        mass[dim] += weight * share
      }
    }
  }

  const value = {}
  const confidence = {}
  for (const d of dimensionIds) {
    value[d] = sum[d] / (priorStrength + mass[d])
    confidence[d] = mass[d] / (mass[d] + priorStrength)
  }
  return { value, mass, confidence, flags: [...flags] }
}

/* Correction 2: prototypes as used for classification. */
export function classificationPrototypes(archetypes, dimensionIds, opts = {}) {
  const { prototypeFrame, priorMean } = { ...MODEL_DEFAULTS, ...opts }
  if (prototypeFrame !== 'relative') return archetypes
  const centre = prototypeCentroid(archetypes, dimensionIds)
  return archetypes.map((a) => ({
    ...a,
    prototype: Object.fromEntries(dimensionIds.map((d) => [d, a.prototype[d] - centre[d] + priorMean])),
  }))
}

/* Weighted squared distance, normalised by the weight actually in play. */
export function archetypeDistance(estimate, archetype, dimensionIds) {
  let num = 0
  let den = 0
  for (const d of dimensionIds) {
    const w = archetype.importance[d] * estimate.confidence[d]
    const diff = estimate.value[d] - archetype.prototype[d]
    num += w * diff * diff
    den += w
  }
  return den > 0 ? num / den : 1
}

/*
 * Direction, not position: does the person lean away from neutral in the same
 * direction this archetype leans away from the centre of all nine?
 */
export function archetypeCosine(estimate, archetype, dimensionIds, neutral) {
  let dot = 0
  let uu = 0
  let vv = 0
  for (const d of dimensionIds) {
    const w = archetype.importance[d] * estimate.confidence[d]
    const u = estimate.value[d] - neutral
    const v = archetype.prototype[d] - neutral
    dot += w * u * v
    uu += w * u * u
    vv += w * v * v
  }
  return uu > 0 && vv > 0 ? dot / Math.sqrt(uu * vv) : 0
}

export function scoreArchetypes(estimate, archetypes, dimensionIds, opts = {}) {
  const o = { ...MODEL_DEFAULTS, ...opts }
  const frame = o.prototypes ?? classificationPrototypes(archetypes, dimensionIds, o)
  const rows = frame.map((a) => {
    const distance = archetypeDistance(estimate, a, dimensionIds)
    const cosine = archetypeCosine(estimate, a, dimensionIds, o.priorMean)
    const fromDistance = o.method === 'cosine' ? 0 : -distance / o.temperature
    const fromCosine = o.method === 'distance' ? 0 : cosine / o.cosineTemperature
    return { id: a.id, distance, cosine, score: fromDistance + fromCosine + (o.bias[a.id] ?? 0) }
  })
  const max = Math.max(...rows.map((r) => r.score))
  const exp = rows.map((r) => Math.exp(r.score - max))
  const total = exp.reduce((s, v) => s + v, 0)
  rows.forEach((r, i) => { r.p = exp[i] / total })
  return rows.sort((x, y) => y.p - x.p)
}

export function classify(estimate, archetypes, dimensionIds, opts = {}) {
  const o = { ...MODEL_DEFAULTS, ...opts }
  const ranked = scoreArchetypes(estimate, archetypes, dimensionIds, o)
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

/*
 * The tie-breaker asks about the dimension that best separates the two
 * leading archetypes, favouring dimensions we know least about.
 */
export function pickTiebreaker(estimate, firstId, secondId, archetypes, questionIndex, dimensionIds) {
  const a = archetypes.find((x) => x.id === firstId)
  const b = archetypes.find((x) => x.id === secondId)
  let best = null
  for (const d of dimensionIds) {
    const separation = Math.max(a.importance[d], b.importance[d]) * (a.prototype[d] - b.prototype[d]) ** 2
    const uncertainty = 1 - estimate.confidence[d] * 0.5
    const gain = separation * uncertainty
    const question = questionIndex.get(`tb_${d}`)
    if (question && (!best || gain > best.gain)) best = { dim: d, questionId: question.id, gain }
  }
  return best
}

/* Dimensions that pulled hardest towards the primary: used for 'why you got this'. */
export function explain(estimate, archetype, dimensionIds, limit = 3) {
  return dimensionIds
    .map((d) => {
      const closeness = 1 - Math.abs(estimate.value[d] - archetype.prototype[d])
      return { dim: d, weight: archetype.importance[d] * estimate.confidence[d] * closeness, value: estimate.value[d] }
    })
    .sort((x, y) => y.weight - x.weight)
    .slice(0, limit)
}

/*
 * The Pujo DNA petals. Raw dimension values sit close to 0.5 for most people,
 * because every question is balanced, so they are drawn relative to where a
 * typical respondent lands: 0.5 is typical, longer is stronger than typical.
 * Swap `neutral` for real city statistics once there are enough results.
 */
export function dnaPetals(vector, neutral, spread = 0.12) {
  return Object.fromEntries(Object.entries(vector).map(([d, v]) => {
    const n = neutral?.[d] ?? { mean: 0.5, sd: 0.07 }
    const z = (v - n.mean) / (n.sd || 0.07)
    return [d, Math.min(0.98, Math.max(0.05, 0.5 + spread * z))]
  }))
}

/* One call from answers to a result object the UI can render. */
export function evaluate(answers, { questionsDoc, archetypesDoc, dimensionsDoc, opts = {} }) {
  const o = { ...MODEL_DEFAULTS, ...opts }
  const dimensionIds = dimensionsDoc.dimensions.map((d) => d.id)
  const questionIndex = indexQuestions(questionsDoc)
  const estimate = estimateVector(answers, questionIndex, dimensionIds, o)
  const result = classify(estimate, archetypesDoc.archetypes, dimensionIds, o)
  const tiebreak = result.needsTiebreak
    ? pickTiebreaker(estimate, result.ranked[0].id, result.ranked[1].id, archetypesDoc.archetypes, questionIndex, dimensionIds)
    : null
  const primary = archetypesDoc.archetypes.find((a) => a.id === result.primary)
  return {
    modelVersion: archetypesDoc.version,
    ...result,
    tiebreak,
    vector: estimate.value,
    confidence: estimate.confidence,
    flags: estimate.flags,
    because: explain(estimate, primary, dimensionIds),
  }
}
