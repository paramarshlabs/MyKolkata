/*
 * Integrity and behaviour checks for the Pujo Personality model.
 *   node --test "product-design/pujo-personality/model/*.test.mjs"
 * Run after any edit to dimensions.json, archetypes.json, questions.json or
 * scoring.mjs. The launch build should copy these into frontend/tests.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { indexQuestions, balancedEvidence, evaluate, MODEL_DEFAULTS } from './scoring.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const load = (f) => JSON.parse(readFileSync(join(here, f), 'utf8'))
const dimensionsDoc = load('dimensions.json')
const archetypesDoc = load('archetypes.json')
const questionsDoc = load('questions.json')
const calibration = load('calibration.json')
const DIMS = dimensionsDoc.dimensions.map((d) => d.id)
const QI = indexQuestions(questionsDoc)
const ctx = { questionsDoc, archetypesDoc, dimensionsDoc, opts: { bias: calibration.bias } }

test('every archetype defines every dimension, within range', () => {
  assert.deepEqual(archetypesDoc.dimensionOrder, DIMS)
  for (const a of archetypesDoc.archetypes) {
    for (const d of DIMS) {
      assert.ok(a.prototype[d] >= 0 && a.prototype[d] <= 1, `${a.id}.${d} prototype`)
      assert.ok(a.importance[d] > 0, `${a.id}.${d} importance`)
    }
  }
})

test('evidence only names real dimensions, with values and weights in range', () => {
  for (const q of questionsDoc.questions) {
    for (const o of q.options) {
      for (const [d, pair] of Object.entries(o.evidence ?? {})) {
        assert.ok(DIMS.includes(d), `${q.id}/${o.id} names unknown dimension ${d}`)
        const [v, w] = pair
        assert.ok(v >= 0 && v <= 1 && w > 0 && w <= 1.5, `${q.id}/${o.id}/${d} out of range`)
      }
    }
  }
})

test('the flow only references questions that exist, and every dimension has a tie-breaker', () => {
  for (const id of [...questionsDoc.flow.core, ...questionsDoc.flow.rapid, ...questionsDoc.flow.preferences]) {
    assert.ok(QI.has(id), `missing question ${id}`)
  }
  for (const d of DIMS) assert.ok(QI.has(`tb_${d}`), `missing tie-breaker for ${d}`)
})

test('the mirror question offers exactly one frame per archetype', () => {
  const frame = QI.get('q_frame')
  assert.deepEqual(frame.options.map((o) => o.id).sort(), archetypesDoc.archetypes.map((a) => a.id).sort())
})

test('pair lists only use known archetypes and never repeat a pair', () => {
  const ids = new Set(archetypesDoc.archetypes.map((a) => a.id))
  const seen = new Set()
  for (const kind of ['kin', 'complement', 'spark']) {
    for (const [x, y] of archetypesDoc.pairs[kind]) {
      assert.ok(ids.has(x) && ids.has(y), `${kind}: ${x}, ${y}`)
      const key = [x, y].sort().join('+')
      assert.ok(!seen.has(key), `pair listed twice: ${key}`)
      seen.add(key)
    }
  }
})

test('balanced evidence is neutral: a random choice averages to the middle on every dimension', () => {
  for (const q of questionsDoc.questions.filter((x) => x.block !== 'preference')) {
    const table = balancedEvidence(q, MODEL_DEFAULTS.implicitWeight)
    const dims = new Set(q.options.flatMap((o) => Object.keys(o.evidence ?? {})))
    for (const d of dims) {
      const rows = q.options.map((o) => table[o.id][d])
      const w = rows.reduce((s, [, wt]) => s + wt, 0)
      const mean = rows.reduce((s, [v, wt]) => s + v * wt, 0) / w
      // clipping at 0 and 1 can leave a small residue
      assert.ok(Math.abs(mean - 0.5) < 0.06, `${q.id}/${d} leans ${mean.toFixed(3)}`)
    }
  }
})

/* The answer a clear example of each archetype gives: the reveal must agree. */
const canonical = {
  night_owl: { q_last_pandal: 'a', q_mahalaya: 'b', q_plan: 'e', q_queue: 'f', q_plate: 'b', q_ashtami_look: 'f', q_theme_pandal: 'b', q_crew: 'b', q_soundtrack: 'e', q_dhaak: 'f', q_love: 'b', q_dashami: 'f', q_frame: 'night_owl' },
  pandal_hunter: { q_last_pandal: 'c', q_mahalaya: 'd', q_plan: 'a', q_queue: 'b', q_plate: 'e', q_ashtami_look: 'd', q_theme_pandal: 'd', q_crew: 'b', q_soundtrack: 'e', q_dhaak: 'f', q_love: 'c', q_dashami: 'b', q_frame: 'pandal_hunter' },
  para_kid: { q_last_pandal: 'f', q_mahalaya: 'c', q_plan: 'f', q_queue: 'a', q_plate: 'a', q_ashtami_look: 'b', q_theme_pandal: 'e', q_crew: 'd', q_soundtrack: 'b', q_dhaak: 'b', q_love: 'f', q_dashami: 'a', q_frame: 'para_kid' },
  pujo_romantic: { q_last_pandal: 'e', q_mahalaya: 'd', q_plan: 'b', q_queue: 'c', q_plate: 'd', q_ashtami_look: 'e', q_theme_pandal: 'f', q_crew: 'a', q_soundtrack: 'c', q_dhaak: 'b', q_love: 'a', q_dashami: 'b', q_frame: 'pujo_romantic' },
  pet_pujari: { q_last_pandal: 'b', q_mahalaya: 'b', q_plan: 'c', q_queue: 'd', q_plate: 'c', q_ashtami_look: 'd', q_theme_pandal: 'd', q_crew: 'b', q_soundtrack: 'b', q_dhaak: 'e', q_love: 'e', q_dashami: 'e', q_frame: 'pet_pujari' },
  art_kid: { q_last_pandal: 'c', q_mahalaya: 'd', q_plan: 'b', q_queue: 'b', q_plate: 'e', q_ashtami_look: 'c', q_theme_pandal: 'a', q_crew: 'e', q_soundtrack: 'e', q_dhaak: 'c', q_love: 'c', q_dashami: 'b', q_frame: 'art_kid' },
  addabaaz: { q_last_pandal: 'd', q_mahalaya: 'b', q_plan: 'c', q_queue: 'a', q_plate: 'f', q_ashtami_look: 'f', q_theme_pandal: 'c', q_crew: 'c', q_soundtrack: 'b', q_dhaak: 'd', q_love: 'b', q_dashami: 'f', q_frame: 'addabaaz' },
  dhunuchi: { q_last_pandal: 'd', q_mahalaya: 'c', q_plan: 'c', q_queue: 'e', q_plate: 'f', q_ashtami_look: 'a', q_theme_pandal: 'c', q_crew: 'f', q_soundtrack: 'd', q_dhaak: 'a', q_love: 'd', q_dashami: 'c', q_frame: 'dhunuchi' },
  shiuli: { q_last_pandal: 'f', q_mahalaya: 'a', q_plan: 'd', q_queue: 'c', q_plate: 'a', q_ashtami_look: 'b', q_theme_pandal: 'e', q_crew: 'e', q_soundtrack: 'a', q_dhaak: 'b', q_love: 'b', q_dashami: 'b', q_frame: 'shiuli' },
}

for (const [archetype, picks] of Object.entries(canonical)) {
  test(`a clear ${archetype} is revealed as ${archetype}`, () => {
    const answers = Object.entries(picks).map(([questionId, optionId]) => ({ questionId, optionIds: [optionId] }))
    const result = evaluate(answers, ctx)
    assert.equal(result.primary, archetype, `got ${result.primary} (${result.ranked.slice(0, 3).map((r) => `${r.id} ${r.p.toFixed(2)}`).join(', ')})`)
  })
}

test('an empty quiz does not pretend to know anyone', () => {
  const result = evaluate([], ctx)
  assert.equal(result.band, 'close')
  assert.ok(result.ranked[0].p < 0.2)
})

test('two soundtracks count as one answer, not two', () => {
  const one = evaluate([{ questionId: 'q_soundtrack', optionIds: ['c'] }], ctx)
  const two = evaluate([{ questionId: 'q_soundtrack', optionIds: ['c', 'a'] }], ctx)
  const massOne = Object.values(one.confidence).reduce((s, c) => s + c, 0)
  const massTwo = Object.values(two.confidence).reduce((s, c) => s + c, 0)
  assert.ok(massTwo <= massOne * 1.6, 'multi-select inflated the evidence')
})
