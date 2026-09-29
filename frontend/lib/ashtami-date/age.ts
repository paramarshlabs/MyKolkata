import { MIN_AGE } from './config'

/*
 * Dates of birth, and what they allow. We store the date and never an age:
 * an age is worked out on the day, by the Kolkata calendar (IST, which has no
 * daylight saving), so nobody is shown as 17 at midnight in one place and 18
 * in another. Someone born on 29 February comes of age on 1 March in a year
 * with no 29th — the later of the two days, because this is a gate.
 */

export type Ymd = { y: number; m: number; d: number }

const IST_OFFSET_MS = 330 * 60 * 1000

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
const daysIn = (y: number, m: number) => [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
const compare = (a: Ymd, b: Ymd) => a.y - b.y || a.m - b.m || a.d - b.d
const pad = (n: number, width = 2) => String(n).padStart(width, '0')

/* today, in Kolkata */
export function istDay(now: Date): Ymd {
  const t = new Date(now.getTime() + IST_OFFSET_MS)
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }
}

export const formatYmd = ({ y, m, d }: Ymd) => `${pad(y, 4)}-${pad(m)}-${pad(d)}`

/* "2026-10-19": the key a daily allowance (one shiuli, one aajker special) is counted by */
export const istDayKey = (now: Date) => formatYmd(istDay(now))

/* A strict YYYY-MM-DD that is a real calendar date. */
export function parseYmd(value: unknown): Ymd | null {
  if (typeof value !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  const [y, m, d] = match.slice(1).map(Number)
  if (m < 1 || m > 12 || d < 1 || d > daysIn(y, m)) return null
  return { y, m, d }
}

/* The birthday that falls in `year`. */
function birthdayIn(birth: Ymd, year: number): Ymd {
  if (birth.m === 2 && birth.d === 29 && !isLeap(year)) return { y: year, m: 3, d: 1 }
  return { y: year, m: birth.m, d: birth.d }
}

/* completed years on `today` */
export function ageOn(birth: Ymd, today: Ymd): number {
  const years = today.y - birth.y
  return compare(today, birthdayIn(birth, today.y)) < 0 ? years - 1 : years
}

export const ageAt = (birth: Ymd, now: Date) => ageOn(birth, istDay(now))

export function isAdult(birth: Ymd, now: Date, minAge: number = MIN_AGE): boolean {
  return ageAt(birth, now) >= minAge
}

/*
 * The latest date of birth that is `minAge` today, for the deck's database
 * filter (birthDate <= this). It agrees with isAdult for every date,
 * 29 February included; tests/ashtamiDate.test.mjs checks that.
 */
export function adultCutoff(now: Date, minAge: number = MIN_AGE): Ymd {
  const today = istDay(now)
  const y = today.y - minAge
  /* today is 29 Feb and the cutoff year has none: the 28th is the last birthday that has come.
     (On 1 March of a year with no 29th, the plain answer already lets a 29 Feb birthday in.) */
  if (today.m === 2 && today.d === 29 && !isLeap(y)) return { y, m: 2, d: 28 }
  return { y, m: today.m, d: today.d }
}

export type BirthCheck =
  | { ok: true; birth: Ymd }
  | { ok: false; reason: 'invalid' | 'future' | 'implausible' | 'under-age' }

/* The gate itself. Under 18 is its own answer, so the page can be kind about it. */
export function checkBirthDate(value: unknown, now: Date, minAge: number = MIN_AGE): BirthCheck {
  const birth = parseYmd(value)
  if (!birth) return { ok: false, reason: 'invalid' }
  const today = istDay(now)
  if (compare(birth, today) > 0) return { ok: false, reason: 'future' }
  const age = ageOn(birth, today)
  if (age > 100) return { ok: false, reason: 'implausible' }
  if (age < minAge) return { ok: false, reason: 'under-age' }
  return { ok: true, birth }
}

/* the Date Prisma stores in a DATE column: midnight UTC of that calendar day */
export const ymdToDate = ({ y, m, d }: Ymd) => new Date(Date.UTC(y, m - 1, d))
export const dateToYmd = (date: Date): Ymd => ({ y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() })
