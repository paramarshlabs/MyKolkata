import { KOLKATA } from '@/lib/home/astro'
import type { Feed } from './refresh'
import { findDeep, isObj, num } from './shape'

/* ==========================================================================
   The sky feed: the next day of Kolkata weather and air, from Open-Meteo
   through Anakin Wire (om_forecast, om_air_quality). Stored hour by hour, so
   the page picks the hour it is when it renders and a three-hour-old fetch
   still answers "what is it like now".
   ========================================================================== */

export type SkyHour = { t: string; temp: number | null; rain: number | null; code: number | null }
export type Sky = { hours: SkyHour[]; aqi: { t: string; v: number }[] }

type Hourly = { time: unknown[]; [series: string]: unknown[] }

function hourly(raw: unknown): Hourly | null {
  const found = findDeep(raw, (value) => isObj(value) && isObj(value.hourly) && Array.isArray((value.hourly as Hourly).time))
  return found && isObj(found) ? (found.hourly as Hourly) : null
}

const series = (block: Hourly, name: string, i: number) => (Array.isArray(block[name]) ? num(block[name][i]) : null)

/* Open-Meteo's own shape: { hourly: { time: ['2026-09-29T18:00', …], temperature_2m: […], … } } */
export function normalizeSky(forecastRaw: unknown, airRaw: unknown): Sky | null {
  const weather = hourly(forecastRaw)
  if (!weather) return null
  const hours = weather.time.slice(0, 48).map((t, i) => ({
    t: String(t).slice(0, 13),
    temp: series(weather, 'temperature_2m', i),
    rain: series(weather, 'precipitation_probability', i),
    code: series(weather, 'weather_code', i) ?? series(weather, 'weathercode', i),
  })).filter((hour) => /^\d{4}-\d\d-\d\dT\d\d$/.test(hour.t))
  if (!hours.length) return null

  const air = hourly(airRaw)
  const aqi = air
    ? air.time.slice(0, 48).map((t, i) => ({ t: String(t).slice(0, 13), v: series(air, 'us_aqi', i) }))
      .filter((hour): hour is { t: string; v: number } => hour.v != null)
    : []
  return { hours, aqi }
}

export const skyFeed: Feed<Sky> = {
  key: 'sky',
  ttlMs: 3 * 3_600_000,
  async fetch({ wire }) {
    const place = { latitude: String(KOLKATA.lat), longitude: String(KOLKATA.lon), timezone: 'Asia/Kolkata' }
    const forecast = await wire('om_forecast', {
      ...place,
      hourly: 'temperature_2m,precipitation_probability,weather_code',
      forecast_days: '2',
    })
    /* air quality is a nice-to-have: a failed call still leaves the weather */
    const air = await wire('om_air_quality', { ...place, hourly: 'us_aqi' }).catch(() => null)
    return normalizeSky(forecast, air)
  },
}
