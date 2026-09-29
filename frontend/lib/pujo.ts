/* ==========================================================================
   Durga Puja 2026.
   These Gregorian dates shift every year with the lunar calendar — confirm
   against the panjika before each season. This is the only place they live.
   ========================================================================== */
export const MAHALAYA = '2026-10-10T00:00:00+05:30'

export type PujoDay = {
  bn: string
  en: string
  /* the day's first date */
  iso: string
  /* its last date, when the tithi runs one day over two dates */
  lastIso?: string
}

/* In 2026 Saptami runs over two dates, 17 and 18 October */
export const PUJO_DAYS: readonly PujoDay[] = [
  { bn: 'ষষ্ঠী', en: 'Shashthi', iso: '2026-10-16T00:00:00+05:30' },
  { bn: 'সপ্তমী', en: 'Saptami', iso: '2026-10-17T00:00:00+05:30', lastIso: '2026-10-18T00:00:00+05:30' },
  { bn: 'অষ্টমী', en: 'Ashtami', iso: '2026-10-19T00:00:00+05:30' },
  { bn: 'নবমী', en: 'Navami', iso: '2026-10-20T00:00:00+05:30' },
  { bn: 'দশমী', en: 'Dashami', iso: '2026-10-21T00:00:00+05:30' },
]

export function formatPujoDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
}

/* "16 Oct", or "17–18 Oct" for a day that runs over two dates (both in one month) */
export function formatPujoDay(day: PujoDay) {
  if (!day.lastIso) return formatPujoDate(day.iso)
  const first = new Date(day.iso).toLocaleDateString('en-GB', { day: 'numeric', timeZone: 'Asia/Kolkata' })
  return `${first}–${formatPujoDate(day.lastIso)}`
}

/* "10 October": for sentences, where the short month reads as a table */
export function formatPujoDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' })
}
