/*
 * Neutral-prior calibration.
 *   node product-design/pujo-personality/model/calibrate.mjs
 *
 * Finds small per-archetype score offsets so that a person who answers at
 * random is equally likely to land in any of the nine. This is a fairness
 * floor, not a target distribution: real people are not random, and the real
 * city may well be 20% Night Owl. After launch, re-run this only as a sanity
 * check, and tune against 'That's me' feedback instead (see
 * 03-personality-system.md, section 8).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { indexQuestions, estimateVector, classify, pickTiebreaker, classificationPrototypes, MODEL_DEFAULTS } from './scoring.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const load = (f) => JSON.parse(readFileSync(join(here, f), 'utf8'))
const DIMS = load('dimensions.json').dimensions.map((d) => d.id)
const archetypesDoc = load('archetypes.json')
const ARCH = archetypesDoc.archetypes
const questionsDoc = load('questions.json')
const QI = indexQuestions(questionsDoc)
const FLOW = [...questionsDoc.flow.core, ...questionsDoc.flow.rapid].map((id) => QI.get(id))
const R = Number(process.env.CAL_N ?? 30000)

let seed = 99
const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
const pick = (a) => a[Math.floor(rand() * a.length)]
function randomAnswer(q) {
  if (q.type === 'multi' && rand() < 0.6) {
    const a = pick(q.options).id; let b = pick(q.options).id
    while (b === a) b = pick(q.options).id
    return { questionId: q.id, optionIds: [a, b] }
  }
  return { questionId: q.id, optionIds: [pick(q.options).id] }
}

// fixed random population, reused every iteration so the fit converges
const population = Array.from({ length: R }, () => ({ answers: FLOW.map(randomAnswer), tb: randomAnswer }))
const prototypes = classificationPrototypes(ARCH, DIMS, MODEL_DEFAULTS)
const bias = Object.fromEntries(ARCH.map((a) => [a.id, 0]))

function shares() {
  const opts = { ...MODEL_DEFAULTS, bias, prototypes }
  const count = Object.fromEntries(ARCH.map((a) => [a.id, 0]))
  for (const person of population) {
    let answers = person.answers
    let e = estimateVector(answers, QI, DIMS, opts)
    let r = classify(e, ARCH, DIMS, opts)
    if (r.needsTiebreak) {
      const t = pickTiebreaker(e, r.ranked[0].id, r.ranked[1].id, ARCH, QI, DIMS)
      if (t) { e = estimateVector([...answers, person.tb(QI.get(t.questionId))], QI, DIMS, opts); r = classify(e, ARCH, DIMS, opts) }
    }
    count[r.primary]++
  }
  return Object.fromEntries(Object.entries(count).map(([k, v]) => [k, v / R]))
}

const target = 1 / ARCH.length
let best = { off: Infinity, bias: { ...bias } }
for (let i = 0; i < 40; i++) {
  const s = shares()
  const off = Math.max(...Object.values(s).map((v) => Math.abs(v - target)))
  if (off < best.off) best = { off, bias: { ...bias } }
  if (i % 5 === 0 || off < 0.006) {
    console.log(`iteration ${i}: ` + Object.entries(s).map(([k, v]) => `${k} ${(100 * v).toFixed(1)}`).join('  ') + `  (max off ${(100 * off).toFixed(2)} pts)`)
  }
  if (off < 0.006) break
  // damped update: these offsets live on the same scale as the scores, so small steps
  for (const a of ARCH) bias[a.id] += 0.15 * Math.log(target / Math.max(s[a.id], 1e-4))
  const mean = Object.values(bias).reduce((x, y) => x + y, 0) / ARCH.length
  for (const a of ARCH) bias[a.id] -= mean
}
Object.assign(bias, best.bias)
console.log(`best max deviation: ${(100 * best.off).toFixed(2)} pts`)

const rounded = Object.fromEntries(Object.entries(bias).map(([k, v]) => [k, Math.round(v * 1000) / 1000]))

// Where a random respondent lands on each dimension: used to draw the Pujo DNA
// until enough real results exist to show city percentiles instead.
const neutral = Object.fromEntries(DIMS.map((d) => [d, { mean: 0, sd: 0 }]))
for (const person of population) {
  const e = estimateVector(person.answers, QI, DIMS, MODEL_DEFAULTS)
  for (const d of DIMS) { neutral[d].mean += e.value[d]; neutral[d].sd += e.value[d] ** 2 }
}
for (const d of DIMS) {
  const m = neutral[d].mean / R
  neutral[d] = { mean: Math.round(m * 1000) / 1000, sd: Math.round(Math.sqrt(neutral[d].sd / R - m * m) * 1000) / 1000 }
}
writeFileSync(join(here, 'calibration.json'), JSON.stringify({
  modelVersion: archetypesDoc.version,
  kind: 'neutral-prior',
  population: `${R} uniformly random respondents over the core and rapid-fire flow, with tie-breaker`,
  note: 'Offsets added to archetype scores so random answering favours no archetype. Regenerate whenever questions.json, archetypes.json or the scoring defaults change.',
  bias: rounded,
  neutral,
}, null, 2) + '\n')
console.log('\nWrote calibration.json', rounded)
