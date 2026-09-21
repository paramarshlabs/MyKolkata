// Tests for the Home "In the news" editorial system: relevance, ranking,
// rotation, events, deduplication, ingestion and the failsafes.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { activeEvents, detectEvent, kolkataDay } from '../lib/news/events.ts'
import { buildNewsQueries } from '../lib/news/queries.ts'
import { assessStory, kolkataRelevance } from '../lib/news/relevance.ts'
import { canonicalUrl, sourceTier } from '../lib/news/sources.ts'
import {
  COOLDOWN_HOURS, rankStory, selectHomeStory, STALE_PENALTY,
} from '../lib/news/ranking.ts'
import { resolveStoryImage, TRUSTED_FALLBACK_IMAGE } from '../lib/news/images.ts'
import { ingestKolkataNews, ingestionDue } from '../lib/news/ingest.ts'
import { FALLBACK_HOME_NEWS, getHomeNews, selectHomeNews } from '../lib/news/home.ts'

const HOUR = 3_600_000
const NOW = new Date('2026-09-19T06:00:00+05:30')
const hoursAgo = (hours, from = NOW) => new Date(from.getTime() - hours * HOUR)
const silent = () => {}

let seq = 0
function story(overrides = {}) {
  seq++
  return {
    id: `s${seq}`,
    type: 'CITY',
    title: `Kolkata story ${seq}`,
    description: null,
    image: `https://example.com/${seq}.jpg`,
    link: `https://www.telegraphindia.com/west-bengal/calcutta/story-number-${seq}/cid/20${seq}000`,
    sourceName: 'The Telegraph',
    sourceDomain: 'telegraphindia.com',
    score: 50,
    publishedAt: hoursAgo(2),
    discoveredAt: hoursAgo(2),
    isActive: true,
    featuredAt: null,
    cooldownUntil: null,
    expiresAt: null,
    eventSlug: null,
    eventPhase: null,
    ...overrides,
  }
}

/* ---------- an in-memory NewsRepository ---------------------------------- */

function memoryRepository(initial = []) {
  const rows = initial.map((row) => ({ createdAt: new Date(0), updatedAt: new Date(0), ...row }))
  let id = 0
  const copy = (row) => (row ? { ...row } : null)
  return {
    rows,
    async findDuplicate({ canonicalUrl, titleKey, contentHash }) {
      for (const [key, value] of [['canonicalUrl', canonicalUrl], ['titleKey', titleKey], ['contentHash', contentHash]]) {
        const row = value && rows.find((entry) => entry[key] === value)
        if (row) return copy(row)
      }
      return null
    },
    async create(data) {
      for (const key of ['canonicalUrl', 'titleKey', 'contentHash']) {
        if (data[key] && rows.some((row) => row[key] === data[key])) throw Object.assign(new Error('unique'), { code: 'P2002' })
      }
      const row = { id: `m${++id}`, score: 0, isActive: true, createdAt: new Date(), updatedAt: new Date(), ...data }
      rows.push(row)
      return copy(row)
    },
    async update(rowId, data) {
      const row = rows.find((entry) => entry.id === rowId)
      Object.assign(row, data)
      return copy(row)
    },
    async deactivateExpired(now) {
      let count = 0
      for (const row of rows) {
        if (['CITY', 'SPORTS'].includes(row.type) && row.isActive && row.expiresAt && row.expiresAt <= now) {
          row.isActive = false
          count++
        }
      }
      return count
    },
    async listRecent(types, since) {
      return rows.filter((row) => types.includes(row.type) && row.isActive
        && ((row.publishedAt ?? row.discoveredAt) >= since)).map(copy)
    },
    async latestOfType(type, { activeOnly = false } = {}) {
      const matches = rows.filter((row) => row.type === type && (!activeOnly || row.isActive))
      return copy(matches.sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt))[0])
    },
    async lastIngestedAt() {
      return rows.map((row) => row.lastSeenAt).filter(Boolean).sort((a, b) => b - a)[0] ?? null
    },
  }
}

const RESULTS = {
  metro: {
    url: 'https://www.telegraphindia.com/west-bengal/calcutta/kolkata-metro-announces-new-service-on-purple-line/cid/2101234?utm_source=x',
    title: 'Kolkata Metro announces new service on Purple Line | The Telegraph',
    snippet: 'Metro Railway Kolkata will run extra trains from Monday, officials said.',
    date: '2 hours ago',
  },
  derby: {
    url: 'https://timesofindia.indiatimes.com/sports/football/east-bengal-signs-new-striker-ahead-of-derby/articleshow/123456789.cms',
    title: 'East Bengal signs new striker ahead of derby',
    snippet: 'The Kolkata club confirmed the signing on Friday.',
    date: '5 hours ago',
  },
  economy: {
    url: 'https://www.livemint.com/economy/india-economy-grows-seven-percent-in-q1-11726712345678.html',
    title: "India's economy grows 7% in first quarter",
    snippet: 'Growth was broad-based across Mumbai, Delhi, Kolkata and Chennai.',
    date: '3 hours ago',
  },
}

function fakeAnakin(resultsByQuery = () => [RESULTS.metro, RESULTS.derby, RESULTS.economy]) {
  const calls = []
  return {
    calls,
    hasApiKey: true,
    async search(prompt) {
      calls.push(prompt)
      return resultsByQuery(prompt)
    },
  }
}

const ogPage = (image) => `<html><head><meta property="og:image" content="${image}"></head></html>`

/* ---------- 1, 11, 12: CITY and SPORTS stay separate --------------------- */

test('stories are classified by content into CITY or SPORTS', () => {
  const metro = assessStory({ title: 'Kolkata Metro announces new service', url: RESULTS.metro.url })
  assert.equal(metro.accepted && metro.type, 'CITY')
  const signing = assessStory({ title: 'East Bengal signs new player', url: RESULTS.derby.url })
  assert.equal(signing.accepted && signing.type, 'SPORTS')
  const test_ = assessStory({ title: 'India vs England at Eden Gardens', url: 'https://example.com/cricket/india-vs-england-at-eden-gardens' })
  assert.equal(test_.accepted && test_.type, 'SPORTS')
  const puja = assessStory({ title: 'Kolkata Puja committee announces theme', url: 'https://example.com/kolkata-puja-committee-announces-theme' })
  assert.equal(puja.accepted && puja.type, 'CITY')
})

test('a generic India story that mentions Kolkata once is rejected', () => {
  const verdict = assessStory({ title: RESULTS.economy.title, description: RESULTS.economy.snippet, url: RESULTS.economy.url })
  assert.equal(verdict.accepted, false)
  assert.ok(kolkataRelevance(RESULTS.economy.title, RESULTS.economy.snippet) < 0.2)
  const cricket = assessStory({ title: 'India beat Australia in Perth Test', url: 'https://example.com/cricket/india-beat-australia-in-perth-test' })
  assert.equal(cricket.accepted, false, 'sport without a Kolkata connection is not Kolkata sport')
})

test('the sports card never selects a CITY article, and the city card never a SPORTS one', () => {
  const city = story({ type: 'CITY', score: 90 })
  const sports = story({ type: 'SPORTS', score: 10, publishedAt: hoursAgo(60) })
  assert.equal(selectHomeStory([city, sports], 'SPORTS', { now: NOW }).id, sports.id)
  assert.equal(selectHomeStory([city, sports], 'CITY', { now: NOW }).id, city.id)
  assert.equal(selectHomeStory([city], 'SPORTS', { now: NOW }), null)
  assert.equal(selectHomeStory([sports], 'CITY', { now: NOW }), null)
})

test('Home falls back per card without borrowing across types', async () => {
  const onlyCity = memoryRepository([story({ type: 'CITY', title: 'Kolkata Metro news' })])
  const news = await selectHomeNews(onlyCity, NOW)
  assert.equal(news.city.title, 'Kolkata Metro news')
  assert.equal(news.sports.type, 'SPORTS')
  assert.equal(news.sports.id, FALLBACK_HOME_NEWS.sports.id)
  assert.equal(news.newspaper.title, 'Anandabazar Patrika today')
})

/* ---------- 2: deduplication --------------------------------------------- */

test('canonical URLs collapse tracking params, AMP and trailing slashes', () => {
  const base = 'https://telegraphindia.com/west-bengal/calcutta/story/cid/2101234'
  assert.equal(canonicalUrl(`${base}?utm_source=x&utm_medium=y`), base)
  assert.equal(canonicalUrl('https://www.telegraphindia.com/west-bengal/calcutta/story/cid/2101234/amp'), base)
  assert.equal(canonicalUrl(`${base}/#comments`), base)
})

test('the same article found by several searches is stored once', async () => {
  const repository = memoryRepository()
  const variants = [
    RESULTS.metro,
    { ...RESULTS.metro, url: RESULTS.metro.url.replace('?utm_source=x', '?utm_campaign=y') },
    { ...RESULTS.metro, url: RESULTS.metro.url.replace('www.', '') },
  ]
  await ingestKolkataNews({ repository, anakin: fakeAnakin(() => variants), fetchHtml: async () => null, now: NOW, log: silent })
  assert.equal(repository.rows.filter((row) => row.title.includes('Purple Line')).length, 1)
})

/* ---------- 3, 4: freshness ---------------------------------------------- */

test('fresh stories rank higher than older ones', () => {
  const fresh = story({ publishedAt: hoursAgo(1) })
  const yesterday = story({ publishedAt: hoursAgo(26) })
  assert.ok(rankStory(fresh, { now: NOW }).total > rankStory(yesterday, { now: NOW }).total)
  assert.equal(selectHomeStory([yesterday, fresh], 'CITY', { now: NOW }).id, fresh.id)
})

test('stale stories lose priority and old ones drop out', () => {
  const stale = rankStory(story({ publishedAt: hoursAgo(80) }), { now: NOW })
  assert.equal(stale.parts.stale, -STALE_PENALTY)
  const better = story({ score: 80, publishedAt: hoursAgo(100) })
  const modest = story({ score: 40, publishedAt: hoursAgo(3) })
  assert.equal(selectHomeStory([better, modest], 'CITY', { now: NOW }).id, modest.id)
  const ancient = story({ publishedAt: hoursAgo(24 * 9) })
  assert.equal(selectHomeStory([ancient], 'CITY', { now: NOW }), null)
})

/* ---------- 5: cooldown and rotation ------------------------------------- */

test('a featured story gets a cooldown and gives way the next day', async () => {
  const first = story({ title: 'Kolkata tram heritage ride returns', score: 60, publishedAt: hoursAgo(1) })
  const second = story({ title: 'New Town gets a new public library', score: 50, publishedAt: hoursAgo(3) })
  const repository = memoryRepository([first, second])

  await ingestKolkataNews({ repository, anakin: null, now: NOW, log: silent })
  const featured = repository.rows.find((row) => row.id === first.id)
  assert.deepEqual(featured.featuredAt, NOW)
  assert.deepEqual(featured.cooldownUntil, new Date(NOW.getTime() + COOLDOWN_HOURS * HOUR))

  const tomorrow = new Date(NOW.getTime() + 25 * HOUR)
  await ingestKolkataNews({ repository, anakin: null, now: tomorrow, log: silent })
  const news = await selectHomeNews(repository, tomorrow)
  assert.equal(news.city.id, second.id, 'another fresh story replaces yesterday’s')
})

test('a lone major story may stay on after its turn', () => {
  const only = story({ featuredAt: hoursAgo(30), cooldownUntil: new Date(NOW.getTime() + 40 * HOUR) })
  assert.equal(selectHomeStory([only], 'CITY', { now: NOW }).id, only.id)
})

test('during its turn a featured story is only displaced by far bigger news', () => {
  const holder = story({ score: 40, featuredAt: hoursAgo(3), cooldownUntil: new Date(NOW.getTime() + 60 * HOUR) })
  const slightlyBetter = story({ score: 50, publishedAt: hoursAgo(1) })
  assert.equal(selectHomeStory([holder, slightlyBetter], 'CITY', { now: NOW }).id, holder.id)
  const breaking = story({ score: 95, publishedAt: hoursAgo(0.2) })
  assert.equal(selectHomeStory([holder, breaking], 'CITY', { now: NOW }).id, breaking.id)
})

/* ---------- 6, 7: events --------------------------------------------------- */

const ASHTAMI = new Date('2026-10-19T09:00:00+05:30')

test('the Durga Puja phase follows the calendar and steers the searches', () => {
  const puja = activeEvents(ASHTAMI).find((event) => event.slug === 'durga-puja')
  assert.equal(puja.phase, 'ashtami')
  assert.ok(buildNewsQueries('CITY', activeEvents(ASHTAMI)).includes('Maha Ashtami Kolkata'))
  assert.equal(activeEvents(new Date('2026-10-11T09:00:00+05:30')).find((event) => event.slug === 'durga-puja').phase, 'mahalaya')
  assert.equal(activeEvents(new Date('2026-10-21T09:00:00+05:30')).find((event) => event.slug === 'durga-puja').phase, 'dashami')
  assert.equal(activeEvents(NOW).some((event) => event.slug === 'durga-puja'), false, 'not on three weeks before Mahalaya')
  assert.ok(buildNewsQueries('SPORTS', activeEvents(ASHTAMI)).every((query) => !/ashtami/i.test(query)), 'city events stay out of sports searches')
  assert.equal(kolkataDay(new Date('2026-10-18T20:00:00Z')).iso, '2026-10-19', 'dates are Kolkata dates')
})

test('stories are tagged with their event and phase', () => {
  assert.deepEqual(detectEvent('Sandhi Puja draws crowds at Bagbazar pandal', activeEvents(ASHTAMI)), { eventSlug: 'durga-puja', eventPhase: 'ashtami' })
  assert.deepEqual(detectEvent('Crowds throng the Boi Mela on its opening day'), { eventSlug: 'kolkata-book-fair', eventPhase: null })
  assert.deepEqual(detectEvent('KMC begins pothole repairs'), { eventSlug: null, eventPhase: null })
})

test('multi-day event stories stay relevant while the event is on', () => {
  const events = activeEvents(ASHTAMI)
  const pujaStory = story({ eventSlug: 'durga-puja', eventPhase: 'saptami', publishedAt: hoursAgo(40, ASHTAMI) })
  const ordinary = story({ publishedAt: hoursAgo(40, ASHTAMI) })
  assert.ok(rankStory(pujaStory, { now: ASHTAMI, events }).total > rankStory(ordinary, { now: ASHTAMI, events }).total)
  assert.equal(selectHomeStory([ordinary, pujaStory], 'CITY', { now: ASHTAMI, events }).id, pujaStory.id)
  const phaseStory = story({ eventSlug: 'durga-puja', eventPhase: 'ashtami', publishedAt: hoursAgo(40, ASHTAMI) })
  assert.ok(rankStory(phaseStory, { now: ASHTAMI, events }).total > rankStory(pujaStory, { now: ASHTAMI, events }).total, 'today’s phase gets a little more')
})

test('event stories rotate from day to day while the event persists', async () => {
  const saptami = new Date('2026-10-18T07:00:00+05:30')
  const opening = story({ title: 'Kolkata pandals open to huge Saptami crowds', eventSlug: 'durga-puja', eventPhase: 'saptami', score: 60, publishedAt: hoursAgo(2, saptami) })
  const repository = memoryRepository([opening])
  await ingestKolkataNews({ repository, anakin: null, now: saptami, log: silent })
  assert.equal((await selectHomeNews(repository, saptami)).city.id, opening.id)

  const ashtamiStory = story({ title: 'Sandhi Puja at Bagbazar draws record queue', eventSlug: 'durga-puja', eventPhase: 'ashtami', score: 55, publishedAt: hoursAgo(2, ASHTAMI) })
  repository.rows.push({ createdAt: new Date(), updatedAt: new Date(), ...ashtamiStory })
  const nextDay = new Date(saptami.getTime() + 25 * HOUR)
  await ingestKolkataNews({ repository, anakin: null, now: nextDay, log: silent })
  const news = await selectHomeNews(repository, nextDay)
  assert.equal(news.city.id, ashtamiStory.id)
})

/* ---------- 8: Anakin failure -------------------------------------------- */

test('an Anakin outage leaves persisted stories on Home', async () => {
  const kept = story({ title: 'Howrah Bridge gets new lighting', publishedAt: hoursAgo(20) })
  const repository = memoryRepository([kept])
  const broken = { hasApiKey: true, async search() { throw new Error('Anakin request failed (503)') } }
  const summary = await ingestKolkataNews({ repository, anakin: broken, now: NOW, log: silent })
  assert.ok(summary.searchFailures > 0)
  assert.equal(summary.created, 0)
  assert.equal(summary.selected.CITY.id, kept.id)
  const news = await getHomeNews(repository, { now: NOW, useCache: false })
  assert.equal(news.city.title, 'Howrah Bridge gets new lighting')
})

test('a database outage serves the seeded fallback instead of failing', async () => {
  const down = new Proxy({}, { get: () => async () => { throw new Error('connection refused') } })
  const news = await getHomeNews(down, { now: NOW, useCache: false })
  assert.deepEqual(news, FALLBACK_HOME_NEWS)
  for (const card of [news.newspaper, news.city, news.sports]) assert.ok(card.title && card.image)
})

/* ---------- 9: images ------------------------------------------------------ */

test('images come from the article first, then fall back without breaking', async () => {
  const fromArticle = await resolveStoryImage(
    { title: 'x', link: RESULTS.metro.url, type: 'CITY' },
    { fetchHtml: async () => ogPage('https://img.telegraphindia.com/metro.jpg') },
  )
  assert.deepEqual(fromArticle, { image: 'https://img.telegraphindia.com/metro.jpg', imageSource: 'article-og', imageSourceUrl: RESULTS.metro.url })

  const logoOnly = await resolveStoryImage(
    { title: 'x', link: RESULTS.metro.url, type: 'SPORTS' },
    { fetchHtml: async () => ogPage('https://www.telegraphindia.com/static/logo.png') },
  )
  assert.equal(logoOnly.image, TRUSTED_FALLBACK_IMAGE.SPORTS, 'a site logo is not a story photo')

  const event = await resolveStoryImage({ title: 'x', link: RESULTS.metro.url, type: 'CITY', eventSlug: 'kolkata-book-fair' }, { fetchHtml: async () => null })
  assert.equal(event.imageSource, 'event')
})

test('a story without any image still renders a picture', async () => {
  const repository = memoryRepository([story({ image: null, title: 'Salt Lake gets a new park' })])
  const news = await selectHomeNews(repository, NOW)
  assert.equal(news.city.image, TRUSTED_FALLBACK_IMAGE.CITY)
})

/* ---------- 10: idempotent ingestion ------------------------------------- */

test('running ingestion twice creates no duplicates and keeps the feature', async () => {
  const repository = memoryRepository()
  const fetchHtml = async (url) => ogPage(`https://cdn.example.com/${encodeURIComponent(url).length}.jpg`)
  const first = await ingestKolkataNews({ repository, anakin: fakeAnakin(), fetchHtml, now: NOW, log: silent })
  const count = repository.rows.length
  assert.equal(first.created, 2, 'metro (CITY) and the signing (SPORTS); the economy story is rejected')
  const city = repository.rows.find((row) => row.type === 'CITY')
  const sports = repository.rows.find((row) => row.type === 'SPORTS')
  assert.equal(city.title, 'Kolkata Metro announces new service on Purple Line')
  assert.equal(city.sourceName, 'The Telegraph')
  assert.equal(city.imageSource, 'article-og')
  assert.equal(sports.title, 'East Bengal signs new striker ahead of derby')
  assert.equal(sports.category, 'football')
  const featuredAt = city.featuredAt

  const later = new Date(NOW.getTime() + HOUR)
  const second = await ingestKolkataNews({ repository, anakin: fakeAnakin(), fetchHtml, now: later, log: silent })
  assert.equal(second.created, 0)
  assert.equal(repository.rows.length, count)
  assert.deepEqual(repository.rows.find((row) => row.id === city.id).featuredAt, featuredAt, 're-running does not re-feature')
  assert.deepEqual(repository.rows.find((row) => row.id === city.id).lastSeenAt, later)
})

test('ingestion is due daily, and every six hours during an event', () => {
  assert.equal(ingestionDue(null, [], NOW), true)
  assert.equal(ingestionDue(hoursAgo(10), [], NOW), false)
  assert.equal(ingestionDue(hoursAgo(23.9), [], NOW), true)
  assert.equal(ingestionDue(hoursAgo(6), activeEvents(ASHTAMI), NOW), true)
})

test('official and local sources outrank unknown ones', () => {
  assert.equal(sourceTier('wb.gov.in'), 'OFFICIAL')
  assert.equal(sourceTier('telegraphindia.com'), 'LOCAL')
  assert.equal(sourceTier('timesofindia.indiatimes.com'), 'NATIONAL')
  assert.equal(sourceTier('some-blog.example'), 'OTHER')
})

/* ---------- lessons from the first live run ------------------------------ */

test('real junk from the first live run is rejected', () => {
  const junk = [
    ['Eden Gardens State Park', 'https://www.floridastateparks.org/parks-and-trails/eden-gardens-state-park', 'Florida state park on Choctawhatchee Bay.'],
    ['Eden Gardens Residential Parking Permit Zone', 'http://www.hayward-ca.gov/documents/eden-gardens-residential-parking-permit-zone', 'City of Hayward, California.'],
    ['INS Kolkata collision: India rejects Pakistan allegations', 'https://www.indiatoday.in/india/story/ins-kolkata-collision-india-rejects-pakistan-allegations-2997722', 'The Navy said…'],
    ['Latest T20 World Cup 2021 News, Photos, Latest News Headlines about T20 World Cup 2021-Sportstar', 'https://sportstar.thehindu.com/newstag/t20-world-cup-2021', 'Eden Gardens Kolkata cricket'],
    ['Aizawl FC - latest team news & transfer rumours', 'https://www.goal.com/en-in/team/aizawl-fc/news/52oiz34tuvh22386o5gcgafiz', 'East Bengal'],
    ['East Bengal 3-2 Mohun Bagan (16 Dec, 2018) Final Score - ESPN (IN)', 'https://www.espn.in/football/match/_/gameId/527726/mohun-bagan-sc-east-bengal', ''],
    ['Mohun Bagan Super Giant clinches Indian Super League 2024', 'https://newsonair.gov.in/mohun-bagan-super-giant-clinches-indian-super-league-2024-25-title/', 'ISL football'],
    ['This day, that year: South Africa returns to international cricket after a 21', 'https://ddnews.gov.in/en/this-day-that-year-south-africa-returns-to-international-cricket-after-a-21-year-hiatus/', 'at Eden Gardens in Kolkata'],
    ['Who won toss today? – Sport-net', 'https://sport-net.org/who-won-toss-today-16/', 'KKR cricket match'],
  ]
  for (const [title, url, description] of junk) {
    assert.equal(assessStory({ title, url, description }, NOW).accepted, false, title)
  }
  /* while the real thing still passes */
  const eden = assessStory({ title: 'India vs England Test at Eden Gardens sold out', url: 'https://example.com/cricket/india-vs-england-test-at-eden-gardens-sold-out' }, NOW)
  assert.equal(eden.accepted && eden.type, 'SPORTS')
  const season = assessStory({ title: 'Mohun Bagan eye ISL 2026-27 title after derby win', url: 'https://example.com/football/mohun-bagan-eye-isl-title-after-derby-win' }, NOW)
  assert.equal(season.accepted, true)
})

test('publish dates are read from <time> tags and dates printed on the page', async () => {
  const { extractPublishedAt } = await import('../lib/news/ingest.ts')
  assert.equal(extractPublishedAt('<time datetime="2026-03-14T09:10:00+05:30">').toISOString(), '2026-03-14T03:40:00.000Z')
  const printed = extractPublishedAt('<div class="date">March 14, 2026 9:10 AM</div>')
  assert.equal(printed.getFullYear(), 2026)
  assert.equal(printed.getMonth(), 2)
  assert.equal(extractPublishedAt('<p>14 March 2026</p>').getDate(), 14)
  assert.equal(extractPublishedAt('<p>no date here</p>'), null)
})

test('an undated story cannot beat a dated fresh one on freshness alone', () => {
  const undated = story({ publishedAt: null, discoveredAt: NOW })
  const dated = story({ publishedAt: hoursAgo(6) })
  assert.ok(rankStory(dated, { now: NOW }).total > rankStory(undated, { now: NOW }).total)
})

test('pages without og:image use the photo captioned with the headline', async () => {
  const title = 'PM Modi to visit Kolkata today to inaugurate projects'
  const html = `
    <img src="/logo.png" alt="Newsonair">
    <img src="https://newsonair.gov.in/wp-content/uploads/2026/09/other.png" alt="DUSU elections: Polling concludes">
    <img src="https://newsonair.gov.in/wp-content/uploads/2026/03/modiji.png" alt="${title}">`
  const image = await resolveStoryImage({ title, link: 'https://newsonair.gov.in/pm-modi-to-visit-kolkata-today/', type: 'CITY' }, { fetchHtml: async () => html })
  assert.equal(image.image, 'https://newsonair.gov.in/wp-content/uploads/2026/03/modiji.png')
  assert.equal(image.imageSource, 'article')
})

/* ---------- lessons from production: fallback cards on Vercel --------------- */

test('HTML entity apostrophes in img alt still match the headline photo', async () => {
  const title = "IPL 2026: Chakravarthy overcomes surface tension to end KKR's losing streak"
  const html = `
    <img src="https://ddnews.gov.in/wp-content/themes/ddnews/assets/theme-assets/images/twitter-icon.svg" alt="Twitter">
    <img width="1600" height="900" src="https://ddnews.gov.in/wp-content/uploads/2026/04/Varun-Chakravarthy.jpg"
      class="attachment-full size-full" alt="IPL 2026: Chakravarthy overcomes surface tension to end KKR&#8217;s losing streak">`
  const image = await resolveStoryImage(
    { title, link: 'https://ddnews.gov.in/en/ipl-2026-chakravarthy-overcomes-surface-tension-to-end-kkrs-losing-streak', type: 'SPORTS' },
    { fetchHtml: async () => html },
  )
  assert.equal(image.image, 'https://ddnews.gov.in/wp-content/uploads/2026/04/Varun-Chakravarthy.jpg')
  assert.equal(image.imageSource, 'article')
})

test('WordPress featured images are used when the page has no og:image and no matching alt', async () => {
  const html = `
    <img src="https://ddnews.gov.in/wp-content/uploads/2024/04/dd-news-logo.png" class="custom-logo" alt="DD News">
    <img width="1600" height="900" src="https://ddnews.gov.in/wp-content/uploads/2026/04/Varun-Chakravarthy.jpg" class="attachment-full size-full wp-post-image" alt="">`
  const image = await resolveStoryImage(
    { title: 'IPL 2026: Chakravarthy ends KKR losing streak', link: 'https://ddnews.gov.in/en/ipl-2026-chakravarthy/', type: 'SPORTS' },
    { fetchHtml: async () => html },
  )
  assert.equal(image.image, 'https://ddnews.gov.in/wp-content/uploads/2026/04/Varun-Chakravarthy.jpg')
})

test('Anakin search results without image/thumbnail still resolve from article HTML', async () => {
  /* Anakin Search API returns url/title/snippet/date only — never image fields.
     searchImage must not be required for a correct photo. */
  const link = 'https://ddnews.gov.in/en/ipl-2026-chakravarthy-overcomes-surface-tension-to-end-kkrs-losing-streak'
  const title = "IPL 2026: Chakravarthy overcomes surface tension to end KKR's losing streak"
  const html = `<img class="wp-post-image" src="https://ddnews.gov.in/wp-content/uploads/2026/04/Varun-Chakravarthy.jpg" alt="${title}">`
  const image = await resolveStoryImage(
    { title, link, type: 'SPORTS', searchImage: null },
    { fetchHtml: async () => html },
  )
  assert.equal(image.imageSource, 'article')
  assert.ok(image.image.includes('Varun-Chakravarthy'))
})

test('recheck upgrades a fallback image via related coverage when the own page is unreachable', async () => {
  const broken = story({
    title: 'Chakravarthy spins KKR to IPL victory at Eden Gardens',
    link: 'https://ddnews.gov.in/en/chakravarthy-spins-kkr-to-ipl-victory-at-eden-gardens/',
    sourceDomain: 'ddnews.gov.in',
    type: 'SPORTS',
    category: 'cricket',
    image: '/maidan.jpg',
    imageSource: 'fallback',
    discoveredAt: hoursAgo(5),
  })
  const repository = memoryRepository([broken])
  const related = {
    url: 'https://www.telegraphindia.com/sports/cricket/chakravarthy-spins-kkr-to-ipl-victory-at-eden-gardens/cid/2101999',
    title: 'Chakravarthy spins KKR to IPL victory at Eden Gardens',
  }
  const anakin = {
    hasApiKey: true,
    async search() { return [related] },
    async scrapeHtml() { return null },
  }
  const pages = {
    [broken.link]: null,
    [related.url]: ogPage('https://img.telegraphindia.com/chakravarthy.jpg'),
  }
  await ingestKolkataNews({
    repository,
    anakin,
    fetchHtml: async (url) => pages[url] ?? null,
    now: NOW,
    log: silent,
  })
  assert.equal(repository.rows.find((row) => row.id === broken.id).image, 'https://img.telegraphindia.com/chakravarthy.jpg')
  assert.equal(repository.rows.find((row) => row.id === broken.id).imageSource, 'anakin-related-coverage')
})

test('ingestion re-checks stored stories: junk and old undated ones are retired, images retried', async () => {
  const junk = story({ title: 'Eden Gardens State Park', link: 'https://www.floridastateparks.org/parks-and-trails/eden-gardens-state-park', sourceDomain: 'floridastateparks.org', discoveredAt: hoursAgo(5), publishedAt: null })
  const old = story({ title: 'PM Modi to visit Kolkata today to inaugurate projects', link: 'https://newsonair.gov.in/pm-modi-to-visit-kolkata-today-to-inaugurate-projects/', sourceDomain: 'newsonair.gov.in', discoveredAt: hoursAgo(5), publishedAt: null })
  const noImage = story({ title: 'Kolkata Metro extends Purple Line hours', link: 'https://www.telegraphindia.com/west-bengal/calcutta/kolkata-metro-extends-purple-line-hours/cid/2101999', image: '/hwh.jpg', imageSource: 'fallback' })
  const repository = memoryRepository([junk, old, noImage])
  const pages = {
    [old.link]: '<div>March 14, 2026 9:10 AM</div>',
    [noImage.link]: ogPage('https://img.telegraphindia.com/purple.jpg'),
  }
  const summary = await ingestKolkataNews({ repository, anakin: null, fetchHtml: async (url) => pages[url] ?? null, now: NOW, log: silent })
  const byId = (id) => repository.rows.find((row) => row.id === id)
  assert.equal(summary.retired, 2)
  assert.equal(byId(junk.id).isActive, false)
  assert.equal(byId(old.id).isActive, false)
  assert.equal(byId(noImage.id).image, 'https://img.telegraphindia.com/purple.jpg')
  assert.equal((await selectHomeNews(repository, NOW)).city.id, noImage.id)
})
