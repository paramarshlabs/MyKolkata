/* ==========================================================================
   The sky over Kolkata, worked out rather than fetched: sunrise, sunset and
   the moon's phase. NOAA's solar equations (good to a minute or two) and the
   mean synodic month (good to within a day of each phase) — enough to say
   "Sunset 5:32 pm" and to draw tonight's moon.
   ========================================================================== */

export const KOLKATA = { lat: 22.5726, lon: 88.3639 }
const IST_MINUTES = 330
const RAD = Math.PI / 180

function dayOfYear(date: Date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0)
  return Math.floor((date.getTime() - start) / 86_400_000)
}

/* minutes after midnight, Kolkata time, for sunrise and sunset on `date`'s Kolkata day */
export function sunTimes(date: Date = new Date(), { lat, lon } = KOLKATA) {
  const local = new Date(date.getTime() + IST_MINUTES * 60_000)
  const doy = dayOfYear(local)
  const gamma = (2 * Math.PI / 365) * (doy - 1)
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma))
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma)
    + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma)
  const cosH = Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(decl)) - Math.tan(lat * RAD) * Math.tan(decl)
  const ha = Math.acos(Math.min(1, Math.max(-1, cosH))) / RAD
  const noon = 720 - 4 * lon - eqTime + IST_MINUTES
  return { sunrise: Math.round(noon - 4 * ha), sunset: Math.round(noon + 4 * ha) }
}

export function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}

/* A known new moon (6 January 2000, 18:14 UTC) and the mean synodic month. */
const NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14)
const SYNODIC_DAYS = 29.530588853

export type MoonPhase = {
  /* 0 new → 0.5 full → 1 new */
  phase: number
  /* the lit fraction of the disc, 0–1 */
  illumination: number
  waxing: boolean
  name: string
}

export function moonPhase(date: Date = new Date()): MoonPhase {
  const days = (date.getTime() - NEW_MOON_MS) / 86_400_000
  const phase = (((days / SYNODIC_DAYS) % 1) + 1) % 1
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2
  /* the mean month drifts up to a day from the true one, so new and full
     get a day either side — the moon looks the same then anyway */
  const name = phase < 0.04 || phase > 0.96 ? 'new moon'
    : phase < 0.22 ? 'waxing crescent'
    : phase < 0.28 ? 'first quarter'
    : phase < 0.46 ? 'waxing gibbous'
    : phase < 0.54 ? 'full moon'
    : phase < 0.72 ? 'waning gibbous'
    : phase < 0.78 ? 'last quarter'
    : 'waning crescent'
  return { phase, illumination, waxing: phase < 0.5, name }
}
