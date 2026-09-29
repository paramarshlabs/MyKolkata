// Tests for /home's live feeds: the Wire client, the refresh loop and the
// normalizers that read each Anakin action.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createWire, WireOutOfCredits, WireRateLimited } from '../lib/live/wire.ts'
import { dueFeeds, refreshLive, RETRY_MS, snapshotOf } from '../lib/live/refresh.ts'
import { findList, str, num, parseMaybe } from '../lib/live/shape.ts'
import { extractShows, upcoming } from '../lib/live/tonight.ts'
import { normalizeTrend, readTrend } from '../lib/live/trend.ts'
import { showWhen } from '../lib/home/when.ts'

const json = (status, body) => ({ ok: status < 400, status, json: async () => body })

test('wire submits a task, polls the job and returns its data', async () => {
  const calls = []
  const replies = [
    json(200, { job_id: 'j1', status: 'queued' }),
    json(200, { job_id: 'j1', status: 'running' }),
    json(200, { job_id: 'j1', status: 'completed', data: { ok: 1 } }),
  ]
  const run = createWire({ apiKey: 'k', fetchImpl: async (url, init) => { calls.push([url, init?.method ?? 'GET']); return replies.shift() }, sleep: async () => {} })
  assert.deepEqual(await run('gt_trending', { geo: 'IN' }), { ok: 1 })
  assert.equal(calls[0][0], 'https://api.anakin.io/v1/wire/task')
  assert.equal(calls[0][1], 'POST')
  assert.equal(calls[2][0], 'https://api.anakin.io/v1/wire/jobs/j1')
})

test('wire turns no credits and the rate limit into errors that stop a run', async () => {
  const broke = createWire({ apiKey: 'k', fetchImpl: async () => json(402, { error: { code: 'INSUFFICIENT_CREDITS', message: 'You need 1 credits' } }), sleep: async () => {} })
  await assert.rejects(broke('x'), WireOutOfCredits)
  const busy = createWire({ apiKey: 'k', fetchImpl: async () => json(429, { error: { code: 'RATE_LIMIT_EXCEEDED', retry_after_seconds: 30 } }), sleep: async () => {} })
  await assert.rejects(busy('x'), (err) => err instanceof WireRateLimited && err.retryAfterMs === 30000)
  assert.equal(createWire({ apiKey: '' }), null)
})

function memoryRepo(rows = []) {
  const table = new Map(rows.map((row) => [row.key, { ...row }]))
  return {
    table,
    all: async () => [...table.values()],
    claim: async (key, now, leaseMs) => {
      const row = table.get(key) ?? { key, payload: null, fetchedAt: null, attemptedAt: null, error: null }
      if (row.attemptedAt && now - row.attemptedAt < leaseMs) return false
      table.set(key, { ...row, attemptedAt: now })
      return true
    },
    save: async (key, payload, now) => table.set(key, { ...table.get(key), payload, fetchedAt: now, error: null }),
    fail: async (key, error, now) => table.set(key, { ...table.get(key), error, attemptedAt: now }),
  }
}

const HOUR = 3_600_000
const at = new Date('2026-09-29T12:00:00Z')

test('stale feeds are due, stalest first; a feed that just failed waits', () => {
  const feeds = [{ key: 'a', ttlMs: HOUR }, { key: 'b', ttlMs: HOUR }, { key: 'c', ttlMs: HOUR }, { key: 'd', ttlMs: HOUR }]
  const rows = [
    { key: 'a', fetchedAt: new Date(at - 2 * HOUR), attemptedAt: new Date(at - 2 * HOUR), error: null },
    { key: 'b', fetchedAt: new Date(at - 10 * 60_000), attemptedAt: new Date(at - 10 * 60_000), error: null },
    { key: 'c', fetchedAt: new Date(at - 5 * HOUR), attemptedAt: new Date(at - 60_000), error: 'boom' },
  ]
  assert.deepEqual(dueFeeds(feeds, rows, at).map((f) => f.key), ['d', 'a'])
  rows[2].attemptedAt = new Date(at - RETRY_MS - 1)
  assert.deepEqual(dueFeeds(feeds, rows, at).map((f) => f.key), ['d', 'c', 'a'])
})

test('a refresh saves what it fetched and stops the run when credits run out', async () => {
  const repo = memoryRepo()
  const feeds = [
    { key: 'one', ttlMs: HOUR, fetch: async () => ({ n: 1 }) },
    { key: 'two', ttlMs: HOUR, fetch: async () => { throw new WireOutOfCredits() } },
    { key: 'three', ttlMs: HOUR, fetch: async () => ({ n: 3 }) },
  ]
  const outcomes = await refreshLive({ repository: repo, feeds, wire: async () => null, now: at, max: 5 })
  assert.deepEqual(outcomes.map((o) => o.status), ['saved', 'failed'])
  assert.deepEqual(repo.table.get('one').payload, { n: 1 })
  assert.equal(repo.table.has('three'), false)
  assert.deepEqual(Object.keys(snapshotOf([...repo.table.values()])), ['one'])
  assert.deepEqual(await refreshLive({ repository: repo, feeds, wire: null, now: at }), [])
})

test('shape helpers find the list a feed needs wherever the action nests it', () => {
  const raw = { data: JSON.stringify({ result: { items: [{ title: 'A', views: '1,204' }, { title: 'B', views: 9 }] } }) }
  const list = findList(raw, (item) => typeof item.title === 'string')
  assert.equal(list.length, 2)
  assert.equal(str(list[0], 'name', 'title'), 'A')
  assert.equal(num(list[0].views), 1204)
  assert.equal(parseMaybe('not json'), 'not json')
})

test('tonight finds listings however each source nests them, and keeps the week ahead', () => {
  const bms = { data: { sections: [{ title: 'Movies in Kolkata', cards: [
    { eventTitle: 'A Bengali Film', genres: ['Drama', 'Family', 'Musical'], imageUrl: 'https://assets-in.bmscdn.com/poster.jpg', url: 'https://in.bookmyshow.com/kolkata/movies/a/ET1' },
    { eventTitle: 'A Bengali Film', imageUrl: 'https://assets-in.bmscdn.com/poster.jpg' },
  ] }] } }
  const meetup = JSON.stringify({ results: [
    { title: 'Heritage walk', dateTime: '2026-09-30T07:00:00+05:30', venue: { name: 'Shobhabazar' }, eventUrl: 'https://www.meetup.com/x/events/1', featuredEventPhoto: { highResUrl: 'https://secure.meetupstatic.com/p.jpeg' } },
    { title: 'Last month', dateTime: '2026-08-01T07:00:00+05:30', eventUrl: 'https://www.meetup.com/x/events/0' },
  ] })
  const films = extractShows(bms, 'BookMyShow')
  assert.equal(films.length, 1)
  assert.equal(films[0].title, 'A Bengali Film')
  assert.equal(films[0].kind, 'Drama, Family')
  const walks = extractShows(meetup, 'Meetup')
  assert.equal(walks[0].venue, 'Shobhabazar')
  assert.equal(walks[0].image, 'https://secure.meetupstatic.com/p.jpeg')
  const soon = upcoming([...films, ...walks], new Date('2026-09-29T20:00:00+05:30'))
  assert.deepEqual(soon.map((s) => s.title), ['Heritage walk', 'A Bengali Film'])
})

test('show times read the way people say them', () => {
  const now = new Date('2026-09-29T16:00:00+05:30')
  assert.equal(showWhen('2026-09-29T19:30:00+05:30', now), 'Tonight, 7:30 pm')
  assert.equal(showWhen('2026-09-29T11:00:00+05:30', now), 'Today, 11 am')
  assert.equal(showWhen('2026-09-30T07:00:00+05:30', now), 'Tomorrow, 7 am')
  assert.equal(showWhen('2026-10-02T18:00:00+05:30', now), 'Fri 2 Oct, 6 pm')
  assert.equal(showWhen(null, now), 'Showing this week')
})

test('the Pujo pulse reads Google Trends timelines, native or flattened', () => {
  const weeks = Array.from({ length: 52 }, (_, i) => Date.UTC(2025, 8, 28) / 1000 + i * 7 * 86400)
  const native = { data: { default: { timelineData: weeks.map((time, i) => ({
    time: String(time), formattedTime: 'x', value: [i === 0 ? 100 : i > 44 ? 20 + (i - 44) * 6 : 4],
  })) } } }
  const trend = normalizeTrend(native)
  assert.equal(trend.points.length, 52)
  assert.equal(trend.points[0].d, '2025-09-28')
  const reading = readTrend(trend)
  assert.equal(reading.peakIndex, 0)
  assert.equal(reading.current.v, 62)
  assert.equal(reading.ofPeak, 62)
  assert.equal(reading.rising, true)

  const flat = [{ date: 'Sep 21 – 27, 2025', value: '80' }, ...Array.from({ length: 9 }, (_, i) => ({ date: `2026-0${1 + (i % 8)}-1${i % 9}`, value: 10 }))]
  assert.equal(normalizeTrend(flat).points[0].d, '2025-09-21')
  assert.equal(normalizeTrend({ nothing: [] }), null)
})
