import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { ARCHETYPES, CALIBRATION, CORE_FLOW, DIMENSION_IDS, PAIR_KINDS, QUESTIONS, QUESTION_INDEX, RAPID_FLOW, PREFERENCE_FLOW } from '../lib/pujo-personality/config.ts'
import { balancedEvidence, evaluate, MODEL_DEFAULTS } from '../lib/pujo-personality/scoring.ts'
import * as reference from '../../product-design/pujo-personality/model/scoring.mjs'

/*
 * The Pujo Personality model, as the app runs it. The model is designed and
 * simulated in product-design/pujo-personality/model; the app carries a copy
 * of its JSON and a typed port of its engine. These keep the three in step:
 * the copy, the port, and the behaviour the simulation signed off.
 */

const root = new URL('../', import.meta.url)
const design = new URL('../product-design/pujo-personality/model/', root)
const json = async (url) => JSON.parse(await readFile(url, 'utf8'))

test('the app runs the same model JSON the design folder validated', async () => {
  for (const file of ['dimensions.json', 'archetypes.json', 'questions.json', 'calibration.json']) {
    assert.deepEqual(
      await json(new URL(`lib/pujo-personality/model/${file}`, root)),
      await json(new URL(file, design)),
      `lib/pujo-personality/model/${file} has drifted: copy it from product-design/pujo-personality/model`,
    )
  }
})

test('every archetype defines every dimension, within range', () => {
  for (const a of ARCHETYPES) {
    for (const d of DIMENSION_IDS) {
      assert.ok(a.prototype[d] >= 0 && a.prototype[d] <= 1, `${a.id}.${d} prototype`)
      assert.ok(a.importance[d] > 0, `${a.id}.${d} importance`)
    }
  }
})

test('evidence only names real dimensions, with values and weights in range', () => {
  for (const q of QUESTIONS) {
    for (const o of q.options) {
      for (const [d, [v, w]] of Object.entries(o.evidence ?? {})) {
        assert.ok(DIMENSION_IDS.includes(d), `${q.id}/${o.id} names unknown dimension ${d}`)
        assert.ok(v >= 0 && v <= 1 && w > 0 && w <= 1.5, `${q.id}/${o.id}/${d} out of range`)
      }
    }
  }
})

test('the flow is thirteen questions, five quick ones and three preferences the launch uses', () => {
  assert.equal(CORE_FLOW.length, 13)
  assert.equal(RAPID_FLOW.length, 5)
  for (const id of ['pref_status', 'pref_diet', 'pref_age']) assert.ok(PREFERENCE_FLOW.some((q) => q.id === id), id)
  assert.deepEqual(PREFERENCE_FLOW.find((q) => q.id === 'pref_age').options.map((o) => o.id)[0], 'under_18')
  for (const d of DIMENSION_IDS) assert.ok(QUESTION_INDEX.has(`tb_${d}`), `missing tie-breaker for ${d}`)
})

test('the mirror question offers exactly one frame per archetype', () => {
  assert.deepEqual(QUESTION_INDEX.get('q_frame').options.map((o) => o.id).sort(), ARCHETYPES.map((a) => a.id).sort())
})

test('pair lists use known archetypes and never repeat a pair', () => {
  const seen = new Set()
  for (const kind of ['kin', 'complement', 'spark']) {
    for (const [x, y] of PAIR_KINDS[kind]) {
      const key = [x, y].sort().join('+')
      assert.ok(!seen.has(key), `pair listed twice: ${key}`)
      seen.add(key)
    }
  }
})

test('balanced evidence is neutral: a random choice averages to the middle', () => {
  for (const q of QUESTIONS.filter((x) => x.block !== 'preference')) {
    const table = balancedEvidence(q, MODEL_DEFAULTS.implicitWeight)
    const dims = new Set(q.options.flatMap((o) => Object.keys(o.evidence ?? {})))
    for (const d of dims) {
      const rows = q.options.map((o) => table[o.id][d])
      const weight = rows.reduce((s, [, w]) => s + w, 0)
      const mean = rows.reduce((s, [v, w]) => s + v * w, 0) / weight
      assert.ok(Math.abs(mean - 0.5) < 0.06, `${q.id}/${d} leans ${mean.toFixed(3)}`)
    }
  }
})

/* one clear example of each archetype: the reveal must agree */
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

const toAnswers = (picks) => Object.entries(picks).map(([questionId, optionId]) => ({ questionId, optionIds: [optionId] }))

for (const [archetype, picks] of Object.entries(canonical)) {
  test(`a clear ${archetype} is revealed as ${archetype}`, () => {
    const result = evaluate(toAnswers(picks))
    assert.equal(result.primary, archetype, `got ${result.ranked.slice(0, 3).map((r) => `${r.id} ${r.p.toFixed(2)}`).join(', ')}`)
  })
}

test('an empty quiz does not pretend to know anyone', () => {
  const result = evaluate([])
  assert.equal(result.band, 'close')
  assert.ok(result.ranked[0].p < 0.2)
})

test('two soundtracks count as one answer, not two', () => {
  const mass = (r) => Object.values(r.confidence).reduce((s, c) => s + c, 0)
  const one = evaluate([{ questionId: 'q_soundtrack', optionIds: ['c'] }])
  const two = evaluate([{ questionId: 'q_soundtrack', optionIds: ['c', 'a'] }])
  assert.ok(mass(two) <= mass(one) * 1.6, 'multi-select inflated the evidence')
})

/* a small seeded generator, so a failure names a reproducible case */
function random(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

test('the typed port scores exactly like the reference engine the simulation validated', async () => {
  const ctx = {
    questionsDoc: await json(new URL('questions.json', design)),
    archetypesDoc: await json(new URL('archetypes.json', design)),
    dimensionsDoc: await json(new URL('dimensions.json', design)),
    opts: { bias: CALIBRATION.bias },
  }
  const next = random(2026)
  const pick = (q) => q.options[Math.floor(next() * q.options.length)].id
  for (let run = 0; run < 400; run += 1) {
    const answers = [...CORE_FLOW, ...RAPID_FLOW]
      .filter(() => next() > 0.08)
      .map((q) => ({ questionId: q.id, optionIds: q.type === 'multi' && next() > 0.5 ? [...new Set([pick(q), pick(q)])] : [pick(q)] }))
    const mine = evaluate(answers)
    const theirs = reference.evaluate(answers, ctx)
    assert.equal(mine.primary, theirs.primary, `run ${run}`)
    assert.equal(mine.secondary, theirs.secondary, `run ${run}`)
    assert.equal(mine.band, theirs.band, `run ${run}`)
    assert.ok(Math.abs(mine.margin - theirs.margin) < 1e-9, `run ${run}: margin`)
    assert.equal(mine.tiebreak?.questionId ?? null, theirs.tiebreak?.questionId ?? null, `run ${run}: tie-breaker`)
    for (const d of DIMENSION_IDS) assert.ok(Math.abs(mine.vector[d] - theirs.vector[d]) < 1e-9, `run ${run}: ${d}`)
  }
})
