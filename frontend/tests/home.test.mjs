// Tests for /home: the season line, the day's structure and the live feeds.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { seasonLine } from '../lib/home/season.ts'

const at = (iso) => new Date(iso)

test('the season line is drawn only from the build-up to Dashami', () => {
  assert.equal(seasonLine(at('2026-09-01T10:00:00+05:30')), null)
  assert.ok(seasonLine(at('2026-09-19T10:00:00+05:30')))
  assert.ok(seasonLine(at('2026-10-21T22:00:00+05:30')))
  assert.equal(seasonLine(at('2026-10-22T09:00:00+05:30')), null)
})

test('the season line counts down on the Kolkata calendar', () => {
  const line = seasonLine(at('2026-09-29T18:00:00+05:30'))
  assert.equal(line.status, '11 days to Mahalaya')
  /* 23:30 UTC on the 29th is already the 30th in Kolkata */
  assert.equal(seasonLine(at('2026-09-29T23:30:00Z')).status, '10 days to Mahalaya')
  assert.equal(seasonLine(at('2026-10-09T12:00:00+05:30')).status, '1 day to Mahalaya')
  assert.equal(seasonLine(at('2026-10-10T12:00:00+05:30')).status, 'Mahalaya today')
  assert.equal(seasonLine(at('2026-10-12T12:00:00+05:30')).status, '5 days to Shashthi')
  assert.equal(seasonLine(at('2026-10-19T12:00:00+05:30')).status, 'Ashtami today')
})

test('the season line keeps the five days apart and marks what has passed', () => {
  const line = seasonLine(at('2026-10-18T12:00:00+05:30'))
  const byKey = Object.fromEntries(line.nodes.map((node) => [node.key, node]))
  assert.equal(line.nodes.length, 6)
  assert.equal(byKey.mahalaya.at, 0.52)
  assert.equal(byKey.dashami.at, 1)
  /* each day gets a real step, not a sliver */
  assert.ok(byKey.saptami.at - byKey.shashthi.at > 0.08)
  assert.ok(byKey.mahalaya.past && byKey.shashthi.past)
  assert.ok(byKey.saptami.today && !byKey.saptami.past)
  assert.ok(!byKey.ashtami.past)
  assert.equal(line.todayAt, byKey.saptami.at)
})
