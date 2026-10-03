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

/* Panchami, the eve: pandals open and the city starts walking. Kept out of
   PUJO_DAYS, which the countdowns and the news read as the five days proper */
export const PANCHAMI: PujoDay = { bn: 'পঞ্চমী', en: 'Panchami', iso: '2026-10-15T00:00:00+05:30' }

/* the days the /pujo calendar offers: the eve, then the five */
export const CALENDAR_DAYS: readonly PujoDay[] = [PANCHAMI, ...PUJO_DAYS]

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

/* --------------------------------------------------------------------------
   What happens on each day, in panjika order. The same yearly caveat as the
   dates above. A day with no sittings yet shows a quiet "coming" line.
   -------------------------------------------------------------------------- */
export type PujoMoment = {
  name: string
  /* "6:00 AM", a window like "7:25–8:13 AM", or none for a moment with no clock time */
  time?: string
  /* the day's one unmissable moment, set apart in the list */
  key?: boolean
  /* a second reading of the same moment, e.g. another panjika's timing */
  note?: string
}

/* one date's rituals; a day over two dates (Saptami in 2026) has two sittings */
export type PujoSitting = { iso: string; moments: readonly PujoMoment[] }

export const PUJO_SCHEDULE: Readonly<Record<string, readonly PujoSitting[]>> = {
  Panchami: [],
  Shashthi: [
    { iso: '2026-10-16T00:00:00+05:30', moments: [
      { name: 'Bodhan', time: '6:00 PM', key: true },
      { name: 'Amantran', time: '6:30 PM' },
      { name: 'Adhibas', time: '7:00 PM' },
    ] },
  ],
  Saptami: [
    { iso: '2026-10-17T00:00:00+05:30', moments: [
      { name: 'Nabapatrika Snan', time: '6:00 AM', key: true },
      { name: 'Saptami Puja', time: '8:00 AM' },
    ] },
    { iso: '2026-10-18T00:00:00+05:30', moments: [
      { name: 'Saptami Puja', time: '6:00 AM' },
    ] },
  ],
  Ashtami: [
    { iso: '2026-10-19T00:00:00+05:30', moments: [
      { name: 'Ashtami Puja', time: '6:00 AM' },
      { name: 'Ashtami Anjali', time: '7:00 AM' },
      { name: 'Kumari Puja', time: '8:00 AM' },
      { name: 'Sandhi Puja', time: '7:25–8:13 AM', key: true, note: 'Alternative Vishuddha Siddhanta timing: 10:28–11:16 AM' },
    ] },
  ],
  Navami: [
    { iso: '2026-10-20T00:00:00+05:30', moments: [
      { name: 'Navami Puja', time: '6:00 AM' },
      { name: 'Navami Anjali', time: '7:00 AM' },
      { name: 'Homa', time: '9:00 AM' },
      { name: 'Dhunuchi Naach', time: '7:00 PM', key: true },
    ] },
  ],
  Dashami: [
    { iso: '2026-10-21T00:00:00+05:30', moments: [
      { name: 'Dashami Puja', time: '6:00 AM' },
      { name: 'Boron', time: '8:00 AM' },
      { name: 'Sindoor Khela', time: '9:00 AM', key: true },
      { name: 'Bisarjan', time: '10:00 AM onwards' },
      { name: 'Subho Bijoya' },
    ] },
  ],
}
