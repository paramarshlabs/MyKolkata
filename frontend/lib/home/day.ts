/* ==========================================================================
   A day in Kolkata: /home is laid out as the city's day, morning at the top
   and night at the bottom, and the part of the day it is now is marked.
   Everything here is on the Kolkata clock, whatever the server's timezone.
   ========================================================================== */

export type DaypartId = 'sakal' | 'dupur' | 'bikel' | 'sandhe' | 'raat'

export type Daypart = {
  id: DaypartId
  bn: string
  en: string
  /* hours on the 24-hour Kolkata clock; raat wraps past midnight */
  from: number
  to: number
  /* one observant line about the city at this hour */
  line: string
}

export const DAYPARTS: readonly Daypart[] = [
  { id: 'sakal', bn: 'সকাল', en: 'Morning', from: 4, to: 11, line: 'The paper has come, and so has the first cha.' },
  { id: 'dupur', bn: 'দুপুর', en: 'Midday', from: 11, to: 15, line: 'The shutters are up and the lanes are selling.' },
  { id: 'bikel', bn: 'বিকেল', en: 'Afternoon', from: 15, to: 18, line: 'Adda hour. Everyone has an opinion.' },
  { id: 'sandhe', bn: 'সন্ধে', en: 'Evening', from: 18, to: 20, line: 'The conch sounds and the lights come on.' },
  { id: 'raat', bn: 'রাত', en: 'Night', from: 20, to: 4, line: 'The city stays up later than it says it will.' },
]

export type KolkataClock = { hour: number; minute: number; label: string }

export function kolkataClock(now: Date = new Date()): KolkataClock {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(now).map((part) => [part.type, part.value]),
  )
  const hour = Number(parts.hour)
  const minute = Number(parts.minute)
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return { hour, minute, label: `${h12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'am' : 'pm'}` }
}

export function daypartAt(hour: number): DaypartId {
  const found = DAYPARTS.find((part) => (part.from < part.to ? hour >= part.from && hour < part.to : hour >= part.from || hour < part.to))
  return found?.id ?? 'raat'
}

export function currentDaypart(now: Date = new Date()): DaypartId {
  return daypartAt(kolkataClock(now).hour)
}

/* "4 am to 11 am" */
export function daypartHours(part: Daypart) {
  const fmt = (h: number) => (h === 0 ? '12 am' : h === 12 ? 'noon' : h < 12 ? `${h} am` : `${h - 12} pm`)
  return `${fmt(part.from)} to ${fmt(part.to)}`
}
