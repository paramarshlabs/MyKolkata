// Tests for /home: the season line, the day's structure and the live feeds.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { seasonLine } from '../lib/home/season.ts'
import { displayTitle } from '../lib/news/home.ts'
import { normalizeSky } from '../lib/live/sky.ts'
import { skyReport } from '../lib/home/sky.ts'
import { moonPhase, sunTimes } from '../lib/home/astro.ts'

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

test('home news titles lose the site talking about itself, and nothing else', () => {
  assert.equal(
    displayTitle('Upside Down House Kolkata | amusement-parks,tourist-attractions Tickets Kolkata - BookMyShow'),
    'Upside Down House Kolkata',
  )
  assert.equal(displayTitle('Metro extends Blue Line hours for Pujo - The Telegraph'), 'Metro extends Blue Line hours for Pujo')
  assert.equal(displayTitle('Tram route returns to Esplanade – getbengal.com'), 'Tram route returns to Esplanade')
  assert.equal(displayTitle('Durga Puja 2026 - Kolkata\'s top pandals'), 'Durga Puja 2026 - Kolkata\'s top pandals')
  assert.equal(displayTitle('Kolkata Derby: EB vs MB'), 'Kolkata Derby: EB vs MB')
  assert.equal(displayTitle('Short | Site'), 'Short | Site')
  assert.equal(displayTitle('Book fair dates announced - Anandabazar', 'Anandabazar'), 'Book fair dates announced')
})

test('the sky feed reads Open-Meteo hour by hour, wherever Wire nests it', () => {
  const forecast = { data: { latitude: 22.5, hourly: {
    time: ['2026-09-29T18:00', '2026-09-29T19:00', '2026-09-29T20:00'],
    temperature_2m: [29.4, 28.8, 28.1], precipitation_probability: [10, 20, 75], weather_code: [2, 3, 61],
  } } }
  const air = JSON.stringify({ hourly: { time: ['2026-09-29T18:00'], us_aqi: [88] } })
  const sky = normalizeSky(forecast, air)
  assert.deepEqual(sky.hours[0], { t: '2026-09-29T18', temp: 29.4, rain: 10, code: 2 })
  assert.deepEqual(sky.aqi, [{ t: '2026-09-29T18', v: 88 }])
  assert.equal(normalizeSky({ nothing: true }, null), null)
})

test('the hero says what the sky is doing now, and falls back to the sun and moon', () => {
  const sky = { hours: [
    { t: '2026-09-29T16', temp: 30.6, rain: 20, code: 2 },
    { t: '2026-09-29T17', temp: 30, rain: 20, code: 3 },
    { t: '2026-09-29T18', temp: 29, rain: 70, code: 3 },
  ], aqi: [{ t: '2026-09-29T16', v: 88 }] }
  const afternoon = skyReport(sky, new Date('2026-09-29T16:10:00+05:30'))
  assert.equal(afternoon.sentence, 'Partly cloudy, 31°. Rain likely by 6 pm. Sunset 5:27 pm. Air moderate.')
  assert.equal(afternoon.mood, 'day')
  const night = skyReport(null, new Date('2026-09-29T21:00:00+05:30'))
  assert.equal(night.mood, 'night')
  assert.match(night.sentence, /^A waning gibbous tonight\.$/)
  const raining = skyReport({ hours: [{ t: '2026-09-29T11', temp: 27, rain: 90, code: 63 }], aqi: [] }, new Date('2026-09-29T11:30:00+05:30'))
  assert.equal(raining.mood, 'rain')
  assert.match(raining.sentence, /^Rain, 27°\./)
})

test('Mahalaya is a new moon and Lakshmi Puja a full one', () => {
  assert.equal(moonPhase(new Date('2026-10-10T12:00:00+05:30')).name, 'new moon')
  assert.equal(moonPhase(new Date('2026-10-26T20:00:00+05:30')).name, 'full moon')
  const { sunrise, sunset } = sunTimes(new Date('2026-09-29T12:00:00+05:30'))
  assert.ok(Math.abs(sunrise - (5 * 60 + 27)) <= 3 && Math.abs(sunset - (17 * 60 + 27)) <= 3)
})
