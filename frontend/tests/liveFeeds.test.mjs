// Tests for /home's live feeds: the Wire client, the refresh loop and the
// normalizers that read each Anakin action.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createWire, WireOutOfCredits, WireRateLimited } from '../lib/live/wire.ts'
import { dueFeeds, refreshLive, RETRY_MS, snapshotOf } from '../lib/live/refresh.ts'
import { findList, str, num, parseMaybe } from '../lib/live/shape.ts'
import { extractShows, upcoming } from '../lib/live/tonight.ts'
import { normalizeTrend, readPulse, readTrend } from '../lib/live/trend.ts'
import { normalizeDerby, normalizeRising, searchingFeed } from '../lib/live/searching.ts'
import { normalizeAdda } from '../lib/live/adda.ts'
import { ageHours, extractVideos, rankVideos, viewsLabel, viewsOf, youtubeFeed } from '../lib/live/youtube.ts'
import { cricketFeed, matchesNow, normalizeCricket } from '../lib/live/cricket.ts'
import { normalizeOnThisDay, onThisDayFeed } from '../lib/live/onthisday.ts'
import { createInstagramFeed, instagramConfig, normalizeGrams } from '../lib/live/instagram.ts'
import { isoOf, isUnfit } from '../lib/live/shape.ts'
import { ago, daysAgo, showWhen } from '../lib/home/when.ts'

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

test('Google Trends timelines read the same, native or flattened', () => {
  const weeks = Array.from({ length: 52 }, (_, i) => Date.UTC(2025, 8, 28) / 1000 + i * 7 * 86400)
  const native = { data: { default: { timelineData: weeks.map((time, i) => ({
    time: String(time), formattedTime: 'x', value: [i === 0 ? 100 : i > 44 ? 20 + (i - 44) * 6 : 4],
  })) } } }
  const trend = normalizeTrend(native, 'Durga Puja', 'IN-WB')
  assert.equal(trend.points.length, 52)
  assert.equal(trend.keyword, 'Durga Puja')
  assert.equal(trend.points[0].d, '2025-09-28')
  const reading = readTrend(trend)
  assert.equal(reading.peakIndex, 0)
  assert.equal(reading.current.v, 62)
  assert.equal(reading.ofPeak, 62)
  assert.equal(reading.rising, true)

  const flat = [{ date: 'Sep 21 – 27, 2025', value: '80' }, ...Array.from({ length: 9 }, (_, i) => ({ date: `2026-0${1 + (i % 8)}-1${i % 9}`, value: 10 }))]
  assert.equal(normalizeTrend(flat, 'x', 'IN-WB').points[0].d, '2025-09-21')
  assert.equal(normalizeTrend({ nothing: [] }, 'x', 'IN-WB'), null)
})

test('rising searches come from the rising list, with explicit ones kept off /home', () => {
  const google = { default: { rankedList: [
    { rankedKeyword: [{ query: 'kolkata', value: 100, formattedValue: '100' }] },
    { rankedKeyword: [
      { query: 'kolkata pandal 2026', value: 5000, formattedValue: 'Breakout' },
      { query: 'kolkata metro timing', value: 850, formattedValue: '+850%' },
      { query: 'kolkata mms leaked', value: 900, formattedValue: '+900%' },
      { query: 'Kolkata Metro Timing', value: 10, formattedValue: '+10%' },
    ] },
  ] } }
  assert.deepEqual(normalizeRising(google), [
    { query: 'kolkata pandal 2026', growth: 'Breakout' },
    { query: 'kolkata metro timing', growth: '+850%' },
  ])
  assert.deepEqual(normalizeRising({ rising: [{ query: 'kolkata rain', value: 250 }] }), [{ query: 'kolkata rain', growth: '+250%' }])
})

test('the derby is each club\'s share of the pair\'s searches over the week', () => {
  const timeline = { default: { timelineData: [
    { time: '1', value: [60, 40] }, { time: '2', value: [48, 52] },
  ] } }
  assert.deepEqual(normalizeDerby(timeline), { a: { name: 'Mohun Bagan', share: 54 }, b: { name: 'East Bengal', share: 46 } })
  const flat = [{ date: '2026-09-28', 'Mohun Bagan': 10, 'East Bengal': 30 }]
  assert.equal(normalizeDerby(flat).b.share, 75)
  assert.equal(normalizeDerby({}), null)
})

test('wire spaces its submissions to stay under the rate limit', async () => {
  let now = 0
  const sleeps = []
  const replies = () => json(200, { job_id: 'j', status: 'completed', data: {} })
  const run = createWire({
    apiKey: 'k', perMinute: 2, clock: () => now,
    sleep: async (ms) => { sleeps.push(ms); now += ms },
    fetchImpl: async () => replies(),
  })
  await run('a')
  now += 1_000
  await run('b')
  await run('c')
  /* the third waits until the first is a minute old */
  assert.equal(sleeps.length, 1)
  assert.ok(sleeps[0] >= 59_000 && sleeps[0] <= 60_100)
})

test('a rising search reads as a multiple of the month before, and the peak is named only before this week', () => {
  const days = (values) => values.map((v, i) => ({ d: new Date(Date.UTC(2026, 6, 1) + i * 86_400_000).toISOString().slice(0, 10), v }))
  const quiet = Array(28).fill(5)
  const reading = readPulse({ keyword: 'x', geo: 'IN-WB', points: days([...Array(40).fill(0), ...quiet, ...Array(7).fill(50)]) })
  assert.equal(reading.daily, true)
  assert.equal(reading.ratio, 10)
  assert.equal(reading.peakIndex, null)
  assert.equal(reading.current.v, 50)
  const bump = readPulse({ keyword: 'x', geo: 'IN-WB', points: days([...Array(20).fill(0), 90, ...Array(40).fill(0), ...Array(7).fill(30)]) })
  assert.equal(bump.peakIndex, 20)
  assert.equal(bump.ratio, null)
})

test('the searching feed charts the fastest riser and survives a failed chart', async () => {
  const calls = []
  const timeline = { default: { timelineData: Array.from({ length: 30 }, (_, i) => ({ time: String(1_780_000_000 + i * 86_400), value: [i] })) } }
  const wire = async (action, params) => {
    calls.push([action, params])
    if (action === 'gt_related_queries') return { rising: [{ query: 'kolkata metro timing', value: 850 }] }
    if (action === 'gt_interest_over_time') return timeline
    throw new Error('compare broke')
  }
  const feed = await searchingFeed.fetch({ wire, now: new Date(), last: null })
  assert.equal(feed.pulse.keyword, 'kolkata metro timing')
  assert.equal(feed.pulse.points.length, 30)
  assert.equal(feed.derby, null)
  assert.deepEqual(calls[1], ['gt_interest_over_time', { keyword: 'kolkata metro timing', geo: 'IN-WB', timeframe: 'today 3-m' }])
  const noChart = await searchingFeed.fetch({ wire: async (action) => {
    if (action === 'gt_related_queries') return { rising: [{ query: 'kolkata rain', value: 250 }] }
    throw new Error('down')
  }, now: new Date(), last: null })
  assert.equal(noChart.pulse, null)
  assert.equal(noChart.rising[0].query, 'kolkata rain')
})

test('adda reads Reddit listings and feeds, keeps only this subreddit, and drops NSFW, stickied and explicit posts', () => {
  const listing = { data: { kind: 'Listing', data: { children: [
    { kind: 't3', data: { id: 'aaa111', title: 'Where to eat after the metro closes?', permalink: '/r/kolkata/comments/aaa111/where_to_eat/', link_flair_text: 'Food', created_utc: 1790700000, url: 'https://i.redd.it/x.jpg' } },
    { kind: 't3', data: { id: 'bbb222', title: 'Weekly discussion thread', permalink: '/r/kolkata/comments/bbb222/weekly/', stickied: true } },
    { kind: 't3', data: { id: 'ccc333', title: 'Something for grown-ups only', permalink: '/r/kolkata/comments/ccc333/x/', over_18: true } },
    { kind: 't3', data: { id: 'ddd444', title: 'Leaked MMS going round', permalink: '/r/kolkata/comments/ddd444/x/' } },
    { kind: 't3', data: { id: 'eee555', title: 'Crossposted: the river at dawn', permalink: '/r/kolkata/comments/eee555/river/',
      crosspost_parent_list: [{ id: 'zzz999', title: 'The river at dawn, original post', permalink: '/r/india/comments/zzz999/river/' }] } },
  ] } } }
  const threads = normalizeAdda(listing)
  assert.deepEqual(threads.map((t) => t.id), ['aaa111', 'eee555'])
  assert.equal(threads[0].url, 'https://www.reddit.com/r/kolkata/comments/aaa111/where_to_eat/')
  assert.equal(threads[0].flair, 'Food')
  assert.equal(threads[0].at, new Date(1790700000 * 1000).toISOString())

  /* the Atom feed Reddit also serves, as a wrapper might hand it back */
  const feed = { entries: [
    { id: 't3_1wt1ntx', title: 'Good article by the Print', link: { href: 'https://www.reddit.com/r/kolkata/comments/1wt1ntx/good_article_by_the_print/' }, published: '2026-09-29T05:28:44+00:00' },
    { id: 't3_1ws4xnq', title: 'me_irl', link: { href: 'https://www.reddit.com/r/kolkata/comments/1ws4xnq/me_irl/' } },
  ] }
  const fromFeed = normalizeAdda(feed)
  assert.equal(fromFeed.length, 1)
  assert.equal(fromFeed[0].url, 'https://www.reddit.com/r/kolkata/comments/1wt1ntx/good_article_by_the_print/')
  assert.equal(fromFeed[0].at, '2026-09-29T05:28:44.000Z')
  assert.deepEqual(normalizeAdda({ title: 'top scoring links : kolkata', link: { href: 'https://www.reddit.com/r/kolkata/top/' } }), [])
})

test('youtube keeps this week\'s uploads, however the search nests them, most watched first', () => {
  const now = new Date('2026-09-30T12:00:00+05:30')
  const native = { contents: [
    { videoRenderer: { videoId: 'AAAAAAAAAA1', title: { runs: [{ text: 'Kumartuli before the idols leave' }] }, ownerText: { runs: [{ text: 'City Walks' }] },
      viewCountText: { simpleText: '48,213 views' }, publishedTimeText: { simpleText: '2 days ago' }, lengthText: { simpleText: '14:32' } } },
    { videoRenderer: { videoId: 'AAAAAAAAAA2', title: { runs: [{ text: 'An old favourite' }] }, viewCountText: { simpleText: '3.1M views' }, publishedTimeText: { simpleText: '3 years ago' } } },
    { videoRenderer: { videoId: 'AAAAAAAAAA3', title: { runs: [{ text: 'Live from the ghats' }] }, viewCountText: { simpleText: '1.2K watching' } } },
  ] }
  const flat = { results: [
    { id: 'AAAAAAAAAA4', title: 'College Street on a Sunday', channel: 'Boi Para', views: '1.2 lakh views', published: '5 hours ago', duration: '9:05' },
    { id: 'UCchannelidnotavideo123', title: 'A channel', published: '1 day ago' },
  ] }
  const videos = rankVideos([...extractVideos(native, now), ...extractVideos(flat, now)])
  assert.deepEqual(videos.map((v) => v.id), ['AAAAAAAAAA4', 'AAAAAAAAAA1'])
  assert.equal(videos[0].views, 120000)
  assert.equal(videos[1].channel, 'City Walks')
  assert.equal(videos[1].at, new Date(now.getTime() - 48 * 3_600_000).toISOString())
  assert.equal(ageHours('1 week ago', now), 168)
  assert.equal(viewsOf('No views'), 0)
  assert.equal(viewsLabel(48213), '48K views')
  assert.equal(viewsLabel(1_250_000), '1.3M views')
  assert.equal(viewsLabel(1), '1 view')
})

test('youtube needs its English search; the Bengali one is extra', async () => {
  const now = new Date('2026-09-30T12:00:00+05:30')
  const one = { results: [{ id: 'AAAAAAAAAA5', title: 'Rain at Sealdah', published: '1 day ago', views: 900 }] }
  const feed = await youtubeFeed.fetch({ wire: async (action, { query }) => { if (query === 'Kolkata') return one; throw new Error('down') }, now, last: null })
  assert.equal(feed.videos.length, 1)
  await assert.rejects(youtubeFeed.fetch({ wire: async () => { throw new Error('down') }, now, last: null }))
})

const cricinfo = (matches) => ({ data: { matches } })
const team = (name, score = null, scoreInfo = null) => ({ team: { name, longName: name }, score, scoreInfo })

test('the match strip reads Cricinfo\'s listing and keeps only India, Bengal and Kolkata', () => {
  const raw = cricinfo([
    { objectId: 101, slug: 'india-vs-australia-2nd-odi', title: '2nd ODI', state: 'LIVE', stage: 'RUNNING', statusText: 'India need 74 runs from 70 balls',
      startTime: '2026-09-30T08:00:00.000Z', series: { name: 'Australia tour of India', slug: 'australia-in-india-2026', objectId: 900 },
      teams: [team('India', '214/3', '38.2/50 ov'), team('Australia', '287/8')] },
    { objectId: 102, slug: 'west-indies-vs-sri-lanka', state: 'LIVE', teams: [team('West Indies'), team('Sri Lanka')] },
    { objectId: 103, state: 'PRE', statusText: 'Match starts tomorrow', startTime: '2026-10-01T04:00:00.000Z', series: { name: 'Ranji Trophy' },
      teams: [team('Bengal'), team('Mumbai')] },
    { objectId: 104, state: 'POST', statusText: 'Kolkata Knight Riders won by 5 wickets', teams: [team('Kolkata Knight Riders'), team('Mumbai Indians')] },
  ])
  const matches = normalizeCricket(raw)
  assert.deepEqual(matches.map((m) => [m.id, m.state]), [['101', 'live'], ['103', 'upcoming'], ['104', 'result']])
  assert.equal(matches[0].url, 'https://www.espncricinfo.com/series/australia-in-india-2026-900/india-vs-australia-2nd-odi-101/live-cricket-score')
  assert.deepEqual(matches[0].teams[0], { name: 'India', score: '214/3', overs: '38.2/50 ov' })
  assert.equal(matches[1].url, 'https://www.espncricinfo.com/live-cricket-score')
  /* a day with none of ours is an answer, not a failure; nothing to read is */
  assert.deepEqual(normalizeCricket(cricinfo([{ objectId: 5, state: 'LIVE', teams: [team('England'), team('Pakistan')] }])), [])
  assert.equal(normalizeCricket({ nothing: true }), null)
})

test('the match strip shows a fresh live score and what starts within a day, and refreshes faster while one is on', () => {
  const now = new Date('2026-09-30T15:00:00+05:30')
  const feed = { matches: [
    { id: 'later', state: 'upcoming', start: '2026-10-02T09:30:00+05:30', teams: [] },
    { id: 'soon', state: 'upcoming', start: '2026-10-01T09:30:00+05:30', teams: [] },
    { id: 'done', state: 'result', start: '2026-09-30T09:30:00+05:30', teams: [] },
    { id: 'on', state: 'live', start: '2026-09-30T09:30:00+05:30', teams: [] },
  ] }
  assert.deepEqual(matchesNow(feed, '2026-09-30T14:00:00+05:30', now).map((m) => m.id), ['on', 'soon'])
  /* a live score four hours old says nothing true */
  assert.deepEqual(matchesNow(feed, '2026-09-30T11:00:00+05:30', now).map((m) => m.id), ['soon'])
  assert.equal(cricketFeed.ttlMs(now, feed), 20 * 60_000)
  assert.equal(cricketFeed.ttlMs(now, { matches: [feed.matches[0]] }), 3 * HOUR)
  assert.equal(cricketFeed.ttlMs(now, null), 3 * HOUR)
})

const wikiPage = (title, description, extract = '') => ({
  title: title.replace(/ /g, '_'), normalizedtitle: title, description, extract,
  content_urls: { desktop: { page: `https://en.wikipedia.org/wiki/${title.replace(/ /g, '_')}` } },
})

test('on this day keeps the city\'s and Bengal\'s anniversaries, once each', () => {
  /* the shape of Wikimedia's onthisday feed */
  const raw = { data: {
    selected: [{ text: 'Authorities of the British Raj partitioned the Bengal Presidency.', year: 1905, pages: [wikiPage('Partition of Bengal (1905)', 'Partition of the Bengal Presidency')] }],
    events: [
      { text: 'The Partition of Bengal in India takes place.', year: 1905, pages: [wikiPage('Partition of Bengal (1905)', 'Partition of the Bengal Presidency')] },
      { text: 'A treaty is signed in Europe.', year: 1815, pages: [wikiPage('Some treaty', 'Treaty')] },
    ],
    births: [
      { text: 'Rabindranath Tagore, Indian author and poet (died 1941)', year: 1861, pages: [wikiPage('Rabindranath Tagore', 'Bengali polymath (1861–1941)')] },
      { text: 'Swami Abhedananda, Indian mystic (died 1939)', year: 1866, pages: [wikiPage('Swami Abhedananda', 'Indian mystic', 'He was born in Calcutta.')] },
      { text: 'Someone, Indian actor', year: 1950, pages: [wikiPage('Someone', 'Indian actor', 'Films in Tamil, Telugu and Bengali.')] },
    ],
    deaths: [],
    holidays: [{ text: "Netaji Subhas Chandra Bose's Jayanti (West Bengal, India)", pages: [wikiPage('Subhas Chandra Bose', 'Indian nationalist')] }],
  } }
  const moments = normalizeOnThisDay(raw, 5)
  assert.deepEqual(moments.map((m) => [m.year, m.kind]), [[1905, 'event'], [1861, 'birth'], [null, 'holiday'], [1866, 'birth']])
  assert.equal(moments[0].text, 'The Partition of Bengal in India takes place.')
  assert.equal(moments[1].url, 'https://en.wikipedia.org/wiki/Rabindranath_Tagore')
  assert.equal(normalizeOnThisDay(raw).length, 3)
  /* a day with nothing of ours is empty, not a failure */
  assert.deepEqual(normalizeOnThisDay({ events: [{ text: 'A treaty.', year: 1815, pages: [] }] }), [])
  assert.equal(normalizeOnThisDay({ nothing: [] }), null)
  const flat = [{ type: 'birth', text: 'Sarat Chandra Chattopadhyay, Bengali novelist (died 1938)', year: 1876, pages: [] }]
  assert.deepEqual(normalizeOnThisDay(flat).map((m) => m.kind), ['birth'])
})

test('on this day is fetched once a date', () => {
  const now = new Date('2026-09-30T10:00:00Z')
  assert.equal(onThisDayFeed.ttlMs(now, { day: '09-30', moments: [] }), 24 * HOUR)
  assert.equal(onThisDayFeed.ttlMs(now, { day: '09-29', moments: [] }), 0)
  assert.equal(onThisDayFeed.ttlMs(now, null), 0)
})

test('shape helpers read instants and keep explicit text off the page', () => {
  assert.equal(isoOf(1790700000), '2026-09-29T16:40:00.000Z')
  assert.equal(isoOf('1790700000000'), '2026-09-29T16:40:00.000Z')
  assert.equal(isoOf('2026-09-29T05:28:44+00:00'), '2026-09-29T05:28:44.000Z')
  assert.equal(isoOf('soon'), null)
  assert.ok(isUnfit('an 18+ party') && isUnfit('NSFW pics'))
  assert.ok(!isUnfit('Sussex cricket') && !isUnfit('Essex v Bengal'))
})

test('ages read the way people say them', () => {
  const now = new Date('2026-09-30T16:00:00+05:30')
  assert.equal(ago('2026-09-30T15:59:30+05:30', now), 'Just now')
  assert.equal(ago('2026-09-30T15:20:00+05:30', now), '40 minutes ago')
  assert.equal(ago('2026-09-30T11:00:00+05:30', now), '5 hours ago')
  assert.equal(ago('2026-09-29T09:00:00+05:30', now), 'Yesterday')
  assert.equal(daysAgo('2026-09-27T23:00:00+05:30', now), '3 days ago')
  assert.equal(daysAgo('2026-09-30T00:30:00+05:30', now), 'Today')
})

test('instagram is off until both Graph keys are set', () => {
  assert.equal(instagramConfig({}), null)
  assert.equal(instagramConfig({ INSTAGRAM_USER_ID: '17841400000000000' }), null)
  assert.equal(instagramConfig({ INSTAGRAM_USER_ID: 'not-an-id', INSTAGRAM_GRAPH_TOKEN: 't' }), null)
  assert.deepEqual(instagramConfig({ INSTAGRAM_USER_ID: ' 17841400000000000 ', INSTAGRAM_GRAPH_TOKEN: 't' }), { user: '17841400000000000', token: 't' })
})

test('instagram keeps embeddable posts and looks the hashtag up once', async () => {
  const media = { data: [
    { id: '1', caption: 'Rain on the tram lines', permalink: 'https://www.instagram.com/p/CODE12345/', timestamp: '2026-09-29T10:00:00+0000' },
    { id: '2', caption: 'Something nsfw', permalink: 'https://www.instagram.com/p/CODE22222/' },
    { id: '3', caption: 'No link' },
    { id: '4', caption: null, permalink: 'https://www.instagram.com/reel/CODE33333/' },
  ] }
  assert.deepEqual(normalizeGrams(media).map((post) => post.permalink), ['https://www.instagram.com/p/CODE12345/', 'https://www.instagram.com/reel/CODE33333/'])

  const calls = []
  const fetchImpl = async (url) => {
    calls.push(url.pathname)
    const body = url.pathname.endsWith('/ig_hashtag_search') ? { data: [{ id: '17843853986012965' }] } : media
    return { ok: true, status: 200, json: async () => body }
  }
  const feed = createInstagramFeed({ user: '17841400000000000', token: 'secret' }, fetchImpl)
  const first = await feed.fetch({ last: null })
  assert.equal(first.hashtagId, '17843853986012965')
  assert.equal(first.posts.length, 2)
  await feed.fetch({ last: first })
  assert.deepEqual(calls, ['/v23.0/ig_hashtag_search', '/v23.0/17843853986012965/top_media', '/v23.0/17843853986012965/top_media'])

  const denied = createInstagramFeed({ user: '1', token: 'secret' }, async () => ({ ok: false, status: 400, json: async () => ({ error: { code: 10 } }) }))
  await assert.rejects(denied.fetch({ last: null }), (err) => /\(400 10\)/.test(err.message) && !/secret/.test(err.message))
})
