// Tests for /home: news titles, the hero's sky line, and the sun and moon.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { displayTitle } from '../lib/news/home.ts'
import { normalizeSky } from '../lib/live/sky.ts'
import { skyReport } from '../lib/home/sky.ts'
import { moonPhase, sunTimes } from '../lib/home/astro.ts'

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

test('the hero sky line is about the sky, never a festival', () => {
  /* Ashtami evening, dry: the line used to add a pandal-hopping forecast */
  const hours = Array.from({ length: 8 }, (_, i) => ({ t: `2026-10-19T${String(16 + i).padStart(2, '0')}`, temp: 28, rain: 5, code: 1 }))
  const report = skyReport({ hours, aqi: [] }, new Date('2026-10-19T16:30:00+05:30'))
  assert.doesNotMatch(report.sentence, /pandal|pujo/i)
  assert.match(report.sentence, /^Partly cloudy, 28°\. Sunset/)
})
