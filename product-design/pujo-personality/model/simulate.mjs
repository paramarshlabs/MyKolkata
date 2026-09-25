/*
 * Validates the Pujo Personality model before a single real person takes it.
 *
 *   node product-design/pujo-personality/model/simulate.mjs          # print report
 *   node product-design/pujo-personality/model/simulate.mjs --write  # also write SIMULATION.md
 *
 * Synthetic respondents only. This proves the model is internally coherent
 * (each archetype is reachable, recoverable and not a catch-all). It does not
 * prove real people will feel seen; that is what the 'That's me' feedback
 * button and the launch calibration are for.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { indexQuestions, estimateVector, classify, pickTiebreaker, MODEL_DEFAULTS } from './scoring.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const load = (f) => JSON.parse(readFileSync(join(here, f), 'utf8'))
const dimensionsDoc = load('dimensions.json')
const archetypesDoc = load('archetypes.json')
const questionsDoc = load('questions.json')
const calibration = (() => { try { return load('calibration.json') } catch { return { bias: {} } } })()

const DIMS = dimensionsDoc.dimensions.map((d) => d.id)
const ARCH = archetypesDoc.archetypes
const QI = indexQuestions(questionsDoc)
const FLOW = [...questionsDoc.flow.core, ...questionsDoc.flow.rapid].map((id) => QI.get(id))
const OPTS = { ...MODEL_DEFAULTS, bias: calibration.bias ?? {} }
const N = Number(process.env.SIM_N ?? 4000)

/* deterministic RNG so every run of this report is reproducible */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
let rand = mulberry32(20261010)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]

function align(option, archetype) {
  let s = 0
  for (const [d, [value, weight]] of Object.entries(option.evidence ?? {})) {
    s += weight * archetype.importance[d] * (1 - 2 * Math.abs(value - archetype.prototype[d]))
  }
  return s
}

function inCharacter(question, archetype, k = 1) {
  return [...question.options]
    .map((o) => ({ id: o.id, a: align(o, archetype) }))
    .sort((x, y) => y.a - x.a)
    .slice(0, k)
}

function answerAs(question, archetype, p) {
  const multi = question.type === 'multi'
  if (rand() < p) {
    const top = inCharacter(question, archetype, multi ? 2 : 1)
    const ids = multi && top[1] && top[1].a > 0 ? [top[0].id, top[1].id] : [top[0].id]
    return { questionId: question.id, optionIds: ids }
  }
  return randomAnswer(question)
}

function randomAnswer(question) {
  if (question.type === 'multi' && rand() < 0.6) {
    const a = pick(question.options).id
    let b = pick(question.options).id
    while (b === a) b = pick(question.options).id
    return { questionId: question.id, optionIds: [a, b] }
  }
  return { questionId: question.id, optionIds: [pick(question.options).id] }
}

function run(answers, answerTiebreak) {
  let estimate = estimateVector(answers, QI, DIMS, OPTS)
  let result = classify(estimate, ARCH, DIMS, OPTS)
  let tiebroken = false
  if (result.needsTiebreak && answerTiebreak) {
    const tb = pickTiebreaker(estimate, result.ranked[0].id, result.ranked[1].id, ARCH, QI, DIMS)
    if (tb) {
      answers = [...answers, answerTiebreak(QI.get(tb.questionId))]
      estimate = estimateVector(answers, QI, DIMS, OPTS)
      result = classify(estimate, ARCH, DIMS, OPTS)
      tiebroken = true
    }
  }
  return { ...result, tiebroken }
}

function persona(archetype, p) {
  const answers = FLOW.map((q) => answerAs(q, archetype, p))
  return run(answers, (q) => answerAs(q, archetype, p))
}

function blendPersona(a, b, p) {
  const answers = FLOW.map((q) => answerAs(q, rand() < 0.5 ? a : b, p))
  return run(answers, (q) => answerAs(q, rand() < 0.5 ? a : b, p))
}

const pct = (x) => `${(100 * x).toFixed(1)}%`
const lines = []
const out = (s = '') => { lines.push(s); console.log(s) }

out('# Pujo Personality model: simulation report')
out()
out(`Model ${archetypesDoc.version}. ${FLOW.length} questions in the flow (${questionsDoc.flow.core.length} core + ${questionsDoc.flow.rapid.length} rapid-fire), plus the tie-breaker when needed. ${N} synthetic respondents per cell, fixed seed.`)
out()
out('Synthetic respondents only. This checks that the model is coherent: every archetype is reachable, recoverable from in-character answers, and none of them is a catch-all. It does not check that real people feel seen. That is measured at launch with the "That\'s me" button.')
out()

/* 1. Coverage: does every archetype have a natural answer in most questions? */
out('## 1. Coverage: the answer each archetype would give')
out()
out(`| Question | ${ARCH.map((a) => a.name).join(' | ')} |`)
out(`|---|${ARCH.map(() => '---').join('|')}|`)
const homeCount = Object.fromEntries(ARCH.map((a) => [a.id, 0]))
for (const q of FLOW) {
  const cells = ARCH.map((a) => {
    const [top] = inCharacter(q, a, 1)
    const own = q.options.filter((o) => inCharacter(q, a, 1)[0].id === o.id)
    const exclusive = ARCH.filter((b) => inCharacter(q, b, 1)[0].id === top.id).length === 1
    if (top.a > 0.6) homeCount[a.id] += 1
    return `${top.id}${exclusive ? '' : '*'} (${top.a.toFixed(2)})`
  })
  out(`| ${q.id} | ${cells.join(' | ')} |`)
}
out()
out('Cells show the option an in-character respondent picks and its alignment score. `*` means another archetype picks the same option. Strong homes (alignment above 0.6) per archetype:')
out()
out(ARCH.map((a) => `${a.name} ${homeCount[a.id]}`).join(', ') + '.')
out()

/* 2. Evidence budget per dimension */
out('## 2. Evidence budget per dimension')
out()
out('Maximum and average weight each dimension can receive across the flow. A dimension with a thin budget is measured weakly and should not carry an archetype on its own.')
out()
out('| Dimension | Max possible | Average (uniform answers) |')
out('|---|---|---|')
for (const d of DIMS) {
  let max = 0
  let avg = 0
  for (const q of FLOW) {
    const ws = q.options.map((o) => (o.evidence?.[d]?.[1] ?? 0))
    max += Math.max(...ws)
    avg += ws.reduce((s, w) => s + w, 0) / ws.length
  }
  out(`| ${d} | ${max.toFixed(2)} | ${avg.toFixed(2)} |`)
}
out()

/* 3. Recovery at different levels of consistency */
out('## 3. Recovery: do in-character respondents get their own archetype?')
out()
out('`p` is the chance a respondent answers in character on each question; otherwise they answer at random. Real people are somewhere around p = 0.6 to 0.8.')
out()
out('| Archetype | p = 0.9 | p = 0.75 | p = 0.6 | top-2 at 0.6 | tie-breaker shown at 0.75 | pure at 0.75 |')
out('|---|---|---|---|---|---|---|')
const confusion = Object.fromEntries(ARCH.map((a) => [a.id, Object.fromEntries(ARCH.map((b) => [b.id, 0]))]))
const overall = { p90: 0, p75: 0, p60: 0, top2: 0 }
for (const a of ARCH) {
  let c90 = 0, c75 = 0, c60 = 0, t2 = 0, tb = 0, pure = 0
  for (let i = 0; i < N; i++) {
    if (persona(a, 0.9).primary === a.id) c90++
    const r75 = persona(a, 0.75)
    if (r75.primary === a.id) c75++
    if (r75.tiebroken) tb++
    if (r75.pure) pure++
    confusion[a.id][r75.primary]++
    const r60 = persona(a, 0.6)
    if (r60.primary === a.id) c60++
    if (r60.ranked[0].id === a.id || r60.ranked[1].id === a.id) t2++
  }
  overall.p90 += c90; overall.p75 += c75; overall.p60 += c60; overall.top2 += t2
  out(`| ${a.name} | ${pct(c90 / N)} | ${pct(c75 / N)} | ${pct(c60 / N)} | ${pct(t2 / N)} | ${pct(tb / N)} | ${pct(pure / N)} |`)
}
const M = N * ARCH.length
out(`| **All** | **${pct(overall.p90 / M)}** | **${pct(overall.p75 / M)}** | **${pct(overall.p60 / M)}** | **${pct(overall.top2 / M)}** | | |`)
out()

out('### Confusion matrix at p = 0.75 (rows: who they are, columns: what they got)')
out()
out(`| | ${ARCH.map((a) => a.name).join(' | ')} |`)
out(`|---|${ARCH.map(() => '---').join('|')}|`)
for (const a of ARCH) {
  out(`| ${a.name} | ${ARCH.map((b) => pct(confusion[a.id][b.id] / N)).join(' | ')} |`)
}
out()

/* 4. Random respondents: is anything a catch-all? */
out('## 4. Random respondents: is any archetype a catch-all?')
out()
out('People who tap at random should scatter across all nine. If one archetype collects them, it is too central and needs a narrower prototype or a negative bias.')
out()
const dist = Object.fromEntries(ARCH.map((a) => [a.id, 0]))
let rTb = 0, rPure = 0
for (let i = 0; i < N * 3; i++) {
  const answers = FLOW.map(randomAnswer)
  const r = run(answers, randomAnswer)
  dist[r.primary]++
  if (r.tiebroken) rTb++
  if (r.pure) rPure++
}
out('| Archetype | Share of random respondents |')
out('|---|---|')
for (const a of ARCH) out(`| ${a.name} | ${pct(dist[a.id] / (N * 3))} |`)
out()
out(`Tie-breaker shown to ${pct(rTb / (N * 3))} of random respondents; ${pct(rPure / (N * 3))} got a pure result.`)
out()

/* 5. Stability */
out('## 5. Stability: same person, taken twice')
out()
out('Each synthetic person answers twice with independent noise at p = 0.75. Personality tests built on hard cut-offs are notorious for flipping on retest; this checks ours does not.')
out()
let same = 0, total = 0
for (const a of ARCH) {
  for (let i = 0; i < N / 2; i++) {
    if (persona(a, 0.75).primary === persona(a, 0.75).primary) same++
    total++
  }
}
out(`Same primary on retest: **${pct(same / total)}**.`)
out()

/* 6. Blends */
out('## 6. Blends: people who are two things at once')
out()
out('Half their answers come from one archetype, half from another (p = 0.85 in character). A good model puts both archetypes in the primary and secondary slots.')
out()
let inPair = 0, bothSlots = 0, bt = 0
const worst = []
for (let i = 0; i < ARCH.length; i++) {
  for (let j = i + 1; j < ARCH.length; j++) {
    let ip = 0, bs = 0
    const n = Math.floor(N / 8)
    for (let k = 0; k < n; k++) {
      const r = blendPersona(ARCH[i], ARCH[j], 0.85)
      const top2 = new Set([r.ranked[0].id, r.ranked[1].id])
      if (r.primary === ARCH[i].id || r.primary === ARCH[j].id) ip++
      if (top2.has(ARCH[i].id) && top2.has(ARCH[j].id)) bs++
    }
    inPair += ip; bothSlots += bs; bt += n
    worst.push({ pair: `${ARCH[i].name} + ${ARCH[j].name}`, both: bs / n })
  }
}
out(`Primary is one of the two: **${pct(inPair / bt)}**. Both appear as primary and secondary: **${pct(bothSlots / bt)}**.`)
out()
out('Hardest blends to resolve (both-slot rate):')
out()
worst.sort((x, y) => x.both - y.both).slice(0, 5).forEach((w) => out(`- ${w.pair}: ${pct(w.both)}`))
out()

out('## 7. Settings used')
out()
out('```json')
out(JSON.stringify({ ...OPTS, n: N }, null, 2))
out('```')

if (process.argv.includes('--write')) {
  writeFileSync(join(here, 'SIMULATION.md'), lines.join('\n') + '\n')
  console.error('\nWrote SIMULATION.md')
}
