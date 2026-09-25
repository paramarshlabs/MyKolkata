/*
 * Parameter sweep for the scoring method and temperatures.
 *   node product-design/pujo-personality/model/tune.mjs
 * Prints one line per setting. Pick the setting that keeps recovery high while
 * spreading random respondents evenly and keeping 'pure' results rare.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { indexQuestions, estimateVector, classify, pickTiebreaker, classificationPrototypes, MODEL_DEFAULTS } from './scoring.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const load = (f) => JSON.parse(readFileSync(join(here, f), 'utf8'))
const dimensionsDoc = load('dimensions.json')
const archetypesDoc = load('archetypes.json')
const questionsDoc = load('questions.json')
const DIMS = dimensionsDoc.dimensions.map((d) => d.id)
const ARCH = archetypesDoc.archetypes
const QI = indexQuestions(questionsDoc)
const FLOW = [...questionsDoc.flow.core, ...questionsDoc.flow.rapid].map((id) => QI.get(id))
const N = Number(process.env.SIM_N ?? 500)

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
let rand
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const align = (o, a) => Object.entries(o.evidence ?? {}).reduce((s, [d, [v, w]]) => s + w * a.importance[d] * (1 - 2 * Math.abs(v - a.prototype[d])), 0)
const ranked = (q, a) => q.options.map((o) => ({ id: o.id, a: align(o, a) })).sort((x, y) => y.a - x.a)
function randomAnswer(q) {
  if (q.type === 'multi' && rand() < 0.6) {
    const a = pick(q.options).id; let b = pick(q.options).id
    while (b === a) b = pick(q.options).id
    return { questionId: q.id, optionIds: [a, b] }
  }
  return { questionId: q.id, optionIds: [pick(q.options).id] }
}
function answerAs(q, a, p) {
  if (rand() >= p) return randomAnswer(q)
  const r = ranked(q, a)
  return { questionId: q.id, optionIds: q.type === 'multi' && r[1].a > 0 ? [r[0].id, r[1].id] : [r[0].id] }
}
function run(answers, opts, tb) {
  let e = estimateVector(answers, QI, DIMS, opts)
  let r = classify(e, ARCH, DIMS, opts)
  let used = false
  if (r.needsTiebreak && tb) {
    const t = pickTiebreaker(e, r.ranked[0].id, r.ranked[1].id, ARCH, QI, DIMS)
    if (t) { e = estimateVector([...answers, tb(QI.get(t.questionId))], QI, DIMS, opts); r = classify(e, ARCH, DIMS, opts); used = true }
  }
  return { ...r, used }
}

function evaluateSetting(opts) {
  rand = mulberry32(7)
  const per = {}
  let acc75 = 0, acc60 = 0, pure = 0, tb = 0, same = 0
  for (const a of ARCH) {
    let c60 = 0
    for (let i = 0; i < N; i++) {
      const r = run(FLOW.map((q) => answerAs(q, a, 0.75)), opts, (q) => answerAs(q, a, 0.75))
      if (r.primary === a.id) acc75++
      if (r.pure) pure++
      if (r.used) tb++
      const r2 = run(FLOW.map((q) => answerAs(q, a, 0.75)), opts, (q) => answerAs(q, a, 0.75))
      if (r2.primary === r.primary) same++
      const r6 = run(FLOW.map((q) => answerAs(q, a, 0.6)), opts, (q) => answerAs(q, a, 0.6))
      if (r6.primary === a.id) { acc60++; c60++ }
    }
    per[a.id] = c60 / N
  }
  const dist = Object.fromEntries(ARCH.map((a) => [a.id, 0]))
  const R = N * 4
  for (let i = 0; i < R; i++) dist[run(FLOW.map(randomAnswer), opts, randomAnswer).primary]++
  const shares = Object.values(dist).map((v) => v / R)
  const M = N * ARCH.length
  return {
    acc75: acc75 / M, acc60: acc60 / M, minAcc60: Math.min(...Object.values(per)),
    worst: Object.entries(per).sort((x, y) => x[1] - y[1])[0][0],
    randMax: Math.max(...shares), randMin: Math.min(...shares),
    pure: pure / M, tb: tb / M, retest: same / M, dist,
  }
}

const f = (x) => (100 * x).toFixed(1).padStart(5)
const settings = []
for (const iw of [0.35, 0.5]) {
  for (const r of [0.2, 0.28, 0.4]) {
    for (const ct of [0.3, 0.45, 0.6, 0.8]) settings.push({ centerEvidence: true, implicitWeight: iw, prototypeFrame: 'absolute', method: 'hybrid', temperature: +(r * ct).toFixed(3), cosineTemperature: ct })
  }
}

console.log('ctr  iw   frame    method    T     cT   | acc75 acc60 min60 (worst)        | rand max  min | pure  tieb  retest')
for (const s of settings) {
  const merged = { ...MODEL_DEFAULTS, ...s }
  const opts = { ...merged, prototypes: classificationPrototypes(ARCH, DIMS, merged) }
  const m = evaluateSetting(opts)
  console.log(`${String(s.centerEvidence).slice(0,1)}    ${String(s.implicitWeight ?? '-').padEnd(4)} ${s.prototypeFrame.padEnd(8)} ${s.method.padEnd(9)} ${String(s.temperature ?? '-').padEnd(5)} ${String(s.cosineTemperature ?? '-').padEnd(5)}| ${f(m.acc75)} ${f(m.acc60)} ${f(m.minAcc60)} (${m.worst.padEnd(13)}) | ${f(m.randMax)} ${f(m.randMin)} | ${f(m.pure)} ${f(m.tb)} ${f(m.retest)}`)
  if (process.env.SHOW_DIST) console.log('   ', Object.entries(m.dist).map(([k, v]) => `${k}:${f(v / (N * 4))}`).join(' '))
}
