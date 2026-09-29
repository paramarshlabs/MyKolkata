import { kolkataDay } from '@/lib/news/events'
import type { Sky, SkyHour } from '@/lib/live/sky'
import { formatMinutes, moonPhase, sunTimes, type MoonPhase } from './astro'

/* ==========================================================================
   The hero's one line about the sky right now, and the photograph that goes
   with it. The sun and moon are always known; the weather and the air come
   from the sky feed when there is one, and the line simply leaves them out
   when there is not.
   ========================================================================== */

export type HeroMood = 'day' | 'rain' | 'night'

export type SkyReport = {
  sentence: string
  moon: MoonPhase
  mood: HeroMood
}

/* WMO weather codes, in the words someone in Kolkata would use */
export function weatherWords(code: number | null): string | null {
  if (code == null) return null
  if (code === 0) return 'Clear'
  if (code <= 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (code === 45 || code === 48) return 'Hazy'
  if (code >= 51 && code <= 57) return 'Drizzle'
  if (code === 61 || code === 80) return 'Light rain'
  if (code === 63 || code === 81) return 'Rain'
  if (code === 65 || code === 82 || code === 66 || code === 67) return 'Heavy rain'
  if (code >= 95) return 'Thunderstorms'
  return null
}

const isWet = (code: number | null) => code != null && ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95)

function airWords(aqi: number) {
  if (aqi <= 50) return 'good'
  if (aqi <= 100) return 'moderate'
  if (aqi <= 150) return 'poor for some'
  if (aqi <= 200) return 'unhealthy'
  return 'very unhealthy'
}

/* 'YYYY-MM-DDTHH' for the Kolkata hour `offset` hours from now */
function hourKey(now: Date, offset = 0) {
  const shifted = new Date(now.getTime() + offset * 3_600_000)
  const day = kolkataDay(shifted).iso
  const hour = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hourCycle: 'h23' }).format(shifted)
  return `${day}T${hour}`
}

function hourLabel(key: string) {
  const h = Number(key.slice(11, 13))
  return h === 12 ? 'noon' : `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'am' : 'pm'}`
}

export function skyReport(sky: Sky | null, now: Date = new Date()): SkyReport {
  const moon = moonPhase(now)
  const { sunrise, sunset } = sunTimes(now)
  const minutes = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hourCycle: 'h23' }).format(now)) * 60
    + Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', minute: '2-digit' }).format(now))
  const dark = minutes >= sunset + 30 || minutes < sunrise - 20

  const byKey = new Map((sky?.hours ?? []).map((hour) => [hour.t, hour]))
  const current: SkyHour | undefined = byKey.get(hourKey(now))
  const next = [1, 2, 3, 4, 5, 6].map((h) => byKey.get(hourKey(now, h))).filter((hour): hour is SkyHour => Boolean(hour))
  const parts: string[] = []

  if (current) {
    const words = weatherWords(current.code)
    const temp = current.temp != null ? `${Math.round(current.temp)}°` : null
    if (words || temp) parts.push(`${[words, temp].filter(Boolean).join(', ')}.`)
    const wetSoon = !isWet(current.code) && next.find((hour) => (hour.rain ?? 0) >= 60)
    if (wetSoon) parts.push(`Rain likely by ${hourLabel(wetSoon.t)}.`)
  }

  if (!dark && minutes < sunset) parts.push(`Sunset ${formatMinutes(sunset)}.`)
  else if (dark && minutes < sunrise) parts.push(`Sunrise ${formatMinutes(sunrise)}.`)
  else parts.push(moon.name === 'new moon' ? 'No moon tonight.' : `A ${moon.name} tonight.`)

  const aqi = sky?.aqi.find((hour) => hour.t === hourKey(now))?.v
  if (aqi != null) parts.push(`Air ${airWords(aqi)}.`)

  const mood: HeroMood = current && isWet(current.code) ? 'rain' : dark ? 'night' : 'day'
  return { sentence: parts.join(' '), moon, mood }
}
