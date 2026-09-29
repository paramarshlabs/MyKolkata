import type { Feed } from './refresh'
import { clip, findDeep, findList, httpsUrl, isObj, isUnfit, str } from './shape'
import { WireOutOfCredits, WireRateLimited } from './wire'

/* ==========================================================================
   Tonight in the city: what is on in Kolkata this week, from BookMyShow's
   events page (Anakin's crawl) and Meetup (Anakin Wire). Both are
   asked at once, so a refresh fits in the minute a page view has.

   Wire's own BookMyShow action (bms_discover_home) returns only the home
   page's section headings, never the events in them, and Luma has no
   Kolkata page (its nearest is Bengaluru); both were dropped on 30 Sep 2026.
   ========================================================================== */

export type Show = {
  title: string
  kind: string | null
  venue: string | null
  /* ISO when the source gives a time; YYYY-MM-DD when it gives only the day */
  when: string | null
  image: string | null
  url: string | null
  /* the site it is listed on, named on the stub */
  source: string
}

export type Tonight = { shows: Show[] }

export const BMS_EVENTS = 'https://in.bookmyshow.com/explore/events-kolkata'

const HOUR_MS = 3_600_000
const DAY_MS = 24 * HOUR_MS
const kolkataDay = (date: Date) => date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

/* Every listed event happens in Kolkata, so its wall-clock time is Kolkata
   time. Meetup writes a group's events in the group's timezone, so a group
   set up in New York lists its Kolkata dinner at 7 pm -04:00 (4:30 am here). */
export function kolkataTime(raw: string | null) {
  if (!raw) return null
  const local = raw.match(/^(\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?)(?:\.\d+)?[+-]\d\d:\d\d$/)
  const date = new Date(local ? `${local[1]}+05:30` : raw)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/* BookMyShow prints an event's date on its poster, and the poster's URL
   carries that text in base64 (…,ie-U2F0LCAzIE9jdA%3D%3D,… is "Sat, 3 Oct").
   It has no year: the year is the one that puts the day ahead, or at most
   two months behind for a run that has already begun. */
export function posterDate(image: string | null, now: Date) {
  const code = image?.match(/[,:]ie-([A-Za-z0-9%+/=]+)/)?.[1]
  if (!code) return null
  let text: string
  try {
    text = atob(decodeURIComponent(code))
  } catch {
    return null
  }
  const found = text.match(/\b(\d{1,2})\s+([A-Za-z]{3})/)
  const month = found ? MONTHS.indexOf(found[2].toLowerCase()) : -1
  if (!found || month < 0) return null
  const today = kolkataDay(now)
  const day = (year: number) => `${year}-${String(month + 1).padStart(2, '0')}-${found[1].padStart(2, '0')}`
  const year = Number(today.slice(0, 4))
  return Date.parse(day(year)) < Date.parse(today) - 60 * DAY_MS ? day(year + 1) : day(year)
}

const CARD = /\*\*([^*\n]+)\*\*\]\((https:\/\/in\.bookmyshow\.com\/events\/[^\s)]+)\)/g
const POSTER = /!\[[^\]]*\]\((https:\/\/assets-in\.bmscdn\.com\/[^\s)]+)\)/

/* BookMyShow's events page as the scraper's markdown, as it was on 30 Sep
   2026: each event is a link whose text is its card's lines (poster, title,
   venue, category, price) and which ends with the title in bold. Only the
   first rows carry a poster, and so a date; the rest load theirs as you
   scroll, and are left out rather than listed without a day. */
export function readBookMyShow(markdown: string, now: Date): Show[] {
  const out: Show[] = []
  const titles = new Set<string>()
  let from = 0
  for (const card of markdown.matchAll(CARD)) {
    const body = markdown.slice(from, card.index)
    from = card.index + card[0].length
    const title = card[1].trim()
    const image = httpsUrl(body.match(POSTER)?.[1])
    const when = posterDate(image, now)
    if (!when || titles.has(title.toLowerCase()) || isUnfit(title)) continue
    titles.add(title.toLowerCase())
    const lines = body.split(/\\?\n/).map((line) => line.replace(/^\[/, '').trim()).filter(Boolean)
    const at = lines.lastIndexOf(title)
    const line = (offset: number) => (at >= 0 && lines[at + offset] && !lines[at + offset].startsWith('₹') ? lines[at + offset] : null)
    out.push({
      title: clip(title, 90)!,
      kind: clip(line(2), 40),
      venue: clip(line(1)?.replace(/[:,]\s*Kolkata$/i, '') ?? null, 60),
      when,
      image,
      url: card[2],
      source: 'BookMyShow',
    })
  }
  return out
}

const outOfTown = (city: string | null) => Boolean(city) && !/kolkata|calcutta|howrah|salt ?lake|bidhannagar|new ?town|rajarhat|dum ?dum/i.test(city!)

/* Meetup's mu_search_events, as Wire returned it on 30 Sep 2026:
     { events: [{ title, date_time, event_type, event_url, photo_url,
       venue: { name, city, country } | null, group: { name, photo_url } }] }
   A recurring event can come back as a stub with no title or link. */
export function readMeetup(raw: unknown, max = 12): Show[] {
  const events = findList(raw, (item) => 'event_url' in item || 'date_time' in item)
  const out: Show[] = []
  const titles = new Set<string>()
  for (const event of events) {
    const title = str(event, 'title')
    const url = httpsUrl(event.event_url)
    if (!title || !url || out.length >= max) continue
    if (String(event.event_type).toUpperCase() === 'ONLINE' || outOfTown(str(event.venue, 'city'))) continue
    if (titles.has(title.toLowerCase())) continue
    titles.add(title.toLowerCase())
    out.push({
      title: clip(title, 90)!,
      kind: null,
      venue: clip(str(event.venue, 'name'), 60),
      when: kolkataTime(str(event, 'date_time')),
      image: httpsUrl(event.photo_url) ?? (isObj(event.group) ? httpsUrl(event.group.photo_url) : null),
      url,
      source: 'Meetup',
    })
  }
  return out
}

/* a listing with only a day runs the whole Kolkata day */
const DAY_ONLY = /^\d{4}-\d\d-\d\d$/
const startOf = (when: string) => Date.parse(DAY_ONLY.test(when) ? `${when}T00:00:00+05:30` : when)
const endOf = (when: string) => Date.parse(DAY_ONLY.test(when) ? `${when}T23:59:59+05:30` : when)

/* upcoming within a week, soonest first; undated listings after the dated ones */
export function upcoming(shows: Show[], now: Date, days = 7) {
  const from = now.getTime() - 2 * HOUR_MS
  const to = now.getTime() + days * DAY_MS
  return shows
    .filter((show) => !show.when || (endOf(show.when) >= from && startOf(show.when) <= to))
    .sort((a, b) => (a.when ? startOf(a.when) : Infinity) - (b.when ? startOf(b.when) : Infinity))
}

const reason = (outcome: PromiseSettledResult<unknown>) =>
  outcome.status === 'rejected' ? (outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason)) : ''

export const tonightFeed: Feed<Tonight> = {
  key: 'tonight',
  async fetch({ wire, scrape, now, last }) {
    const [bms, meetup] = await Promise.allSettled([
      (async () => {
        if (!scrape) throw new Error('no scraper')
        const shows = readBookMyShow(await scrape(BMS_EVENTS), now)
        if (!shows.length) throw new Error('no dated events on the page')
        return shows
      })(),
      wire('mu_search_events', { location: 'in--kolkata', event_type: 'inPerson' }).then((found) => {
        if (!findDeep(found, (value) => isObj(value) && Array.isArray(value.events))) throw new Error('no events list')
        return readMeetup(found)
      }),
    ])
    for (const outcome of [bms, meetup]) {
      if (outcome.status === 'rejected' && (outcome.reason instanceof WireOutOfCredits || outcome.reason instanceof WireRateLimited)) throw outcome.reason
    }
    if (bms.status === 'rejected' && meetup.status === 'rejected') throw new Error(`BookMyShow: ${reason(bms)}; Meetup: ${reason(meetup)}`)

    /* a source that failed this time keeps what it listed last time; a quiet
       week is an answer, kept like any other rather than asked again */
    const previous = isObj(last) && Array.isArray(last.shows) ? (last.shows as Show[]) : []
    const listed = (outcome: PromiseSettledResult<Show[]>, source: string) =>
      outcome.status === 'fulfilled' ? outcome.value : previous.filter((show) => show.source === source)
    return { shows: upcoming([...listed(bms, 'BookMyShow'), ...listed(meetup, 'Meetup')], now).slice(0, 12) }
  },
}
