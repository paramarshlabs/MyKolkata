import { KOLKATA } from '@/lib/home/astro'
import type { Feed } from './refresh'
import { clip, eachObject, findList, httpsUrl, isObj, str } from './shape'
import { optional } from './wire'

/* ==========================================================================
   Tonight in the city: what is on in Kolkata, from BookMyShow (films and
   events), Meetup and Luma, through Anakin Wire. Each source wraps its site
   differently, so a listing is anything with a title and either a picture or
   a link; dates are kept when the source gives one.
   ========================================================================== */

export type ShowSource = 'BookMyShow' | 'Meetup' | 'Luma'

export type Show = {
  title: string
  kind: string | null
  venue: string | null
  /* ISO, when the source says when */
  when: string | null
  image: string | null
  url: string | null
  source: ShowSource
}

export type Tonight = { shows: Show[]; lumaPlace: string | null; lumaCheckedAt: string | null }

const TITLE = ['title', 'name', 'eventName', 'event_name', 'eventTitle', 'label']
const IMAGE = ['image', 'imageUrl', 'image_url', 'poster', 'posterUrl', 'poster_url', 'cover', 'coverUrl', 'cover_url', 'thumbnail', 'banner', 'highResUrl', 'photo', 'featuredEventPhoto']
const LINK = ['url', 'link', 'eventUrl', 'event_url', 'href', 'deeplink', 'webUrl', 'permalink']
const WHEN = ['dateTime', 'startsAt', 'starts_at', 'start_at', 'startTime', 'start_time', 'start', 'startDate', 'date', 'showtime']
const VENUE = ['venue', 'venueName', 'venue_name', 'location', 'address', 'place', 'group']
const KIND = ['genre', 'genres', 'category', 'type', 'eventType', 'language']

const IMAGE_FILE = /\.(jpe?g|png|webp|avif)(\?|$)|bmscdn|secure\.meetupstatic|images\.lumacdn|img\.evbuc/i

function imageOf(item: Record<string, unknown>) {
  for (const key of IMAGE) {
    const value = item[key]
    const direct = httpsUrl(value)
    if (direct && IMAGE_FILE.test(direct)) return direct
    if (isObj(value)) {
      const nested = httpsUrl(str(value, 'highResUrl', 'url', 'src', 'baseUrl'))
      if (nested) return nested
    }
  }
  return null
}

function whenOf(item: Record<string, unknown>) {
  const raw = str(item, ...WHEN)
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/* every listing-shaped object in what a source returned */
export function extractShows(raw: unknown, source: ShowSource, max = 10): Show[] {
  const out: Show[] = []
  const titles = new Set<string>()
  eachObject(raw, (item) => {
    if (out.length >= max) return
    const title = str(item, ...TITLE)
    if (!title || title.length < 3 || title.length > 140) return
    const image = imageOf(item)
    const url = httpsUrl(str(item, ...LINK))
    if (!image && !url) return
    const key = title.toLowerCase()
    if (titles.has(key)) return
    titles.add(key)
    const kind = Array.isArray(item.genres) ? (item.genres as unknown[]).filter((g) => typeof g === 'string').slice(0, 2).join(', ') || null : str(item, ...KIND)
    out.push({ title: clip(title, 90)!, kind: clip(kind, 40), venue: clip(str(item, ...VENUE), 60), when: whenOf(item), image, url, source })
  })
  return out
}

/* upcoming within a week, soonest first; undated listings (films showing
   all week) after the dated ones */
export function upcoming(shows: Show[], now: Date, days = 7) {
  const from = now.getTime() - 2 * 3_600_000
  const to = now.getTime() + days * 86_400_000
  return shows
    .filter((show) => !show.when || (Date.parse(show.when) >= from && Date.parse(show.when) <= to))
    .sort((a, b) => (a.when ? Date.parse(a.when) : Infinity) - (b.when ? Date.parse(b.when) : Infinity))
}

const WEEK_MS = 7 * 86_400_000

export const tonightFeed: Feed<Tonight> = {
  key: 'tonight',
  ttlMs: 6 * 3_600_000,
  async fetch({ wire, now, last }) {
    const previous = (isObj(last) ? last : {}) as Partial<Tonight>
    const coords = { lat: String(KOLKATA.lat), lon: String(KOLKATA.lon) }

    const bms = await optional(wire('bms_discover_home', { region_code: 'KOLK', region_slug: 'kolkata', ...coords }))
    const meetup = await optional(wire('mu_search_events', { location: 'Kolkata, India', query: 'Kolkata' }))

    /* Luma lists only some cities; look Kolkata up once a week, not every time */
    let lumaPlace = previous.lumaPlace ?? null
    let lumaCheckedAt = previous.lumaCheckedAt ?? null
    if (!lumaCheckedAt || now.getTime() - Date.parse(lumaCheckedAt) > WEEK_MS) {
      const places = await optional(wire('lu_list_places', { continent: 'Asia & Pacific' }))
      const kolkata = findList(places, (item) => Boolean(str(item, 'name', 'city')))
        .find((item) => /kolkata|calcutta/i.test(`${str(item, 'name')} ${str(item, 'city')} ${str(item, 'slug')}`))
      lumaPlace = kolkata ? str(kolkata, 'api_id', 'place_id', 'id') : null
      lumaCheckedAt = now.toISOString()
    }
    const luma = lumaPlace ? await optional(wire('lu_discover_events', { place_id: lumaPlace, ...coords })) : null

    const shows = upcoming([
      ...extractShows(bms, 'BookMyShow', 8),
      ...extractShows(meetup, 'Meetup', 6),
      ...extractShows(luma, 'Luma', 6),
    ], now).slice(0, 12)
    return shows.length ? { shows, lumaPlace, lumaCheckedAt } : null
  },
}
