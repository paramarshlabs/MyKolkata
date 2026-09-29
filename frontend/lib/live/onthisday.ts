import type { Feed } from './refresh'
import { clip, eachObject, findList, isObj, str } from './shape'

/* ==========================================================================
   On this day in Kolkata: the day's anniversaries from Wikipedia through
   Anakin Wire (wp_on_this_day), kept only when they are the city's or
   Bengal's. About half of all days have one; the rest have none, and the
   section stays away.

   What counts: the entry's own words, or its first pages' titles and short
   descriptions, naming Kolkata, Calcutta, Bengal, Bengali, Howrah, Hooghly
   or Tagore. For a birth or a death, a page summary naming Kolkata or
   Calcutta counts too (that is where someone was born). Anything looser
   pulls in half of India.
   ========================================================================== */

export type MomentKind = 'event' | 'birth' | 'death' | 'holiday'
export type Moment = { year: number | null; text: string; kind: MomentKind; url: string | null }
/* `day` is the MM-DD the anniversaries are for */
export type OnThisDay = { day: string; moments: Moment[] }

const OURS = /\b(Kolkata|Calcutta|Bengal|Bengali|Howrah|Hooghly|Tagore)\b/i
const CITY = /\b(Kolkata|Calcutta)\b/
/* the shorter event list before the longer selected one, so a repeated event keeps its plain wording */
const SECTIONS: [string, MomentKind][] = [['events', 'event'], ['selected', 'event'], ['births', 'birth'], ['deaths', 'death'], ['holidays', 'holiday']]

type Page = { title: string | null; description: string | null; extract: string | null; url: string | null }

function pagesOf(item: Record<string, unknown>): Page[] {
  return (Array.isArray(item.pages) ? item.pages : []).filter(isObj).slice(0, 2).map((page) => {
    const desktop = isObj(page.content_urls) && isObj(page.content_urls.desktop) ? str(page.content_urls.desktop, 'page') : null
    const title = str(page, 'normalizedtitle', 'title')
    return {
      title,
      description: str(page, 'description'),
      extract: str(page, 'extract'),
      url: desktop ?? (title ? `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}` : null),
    }
  })
}

function moment(item: Record<string, unknown>, kind: MomentKind): (Moment & { key: string; strong: boolean }) | null {
  const text = str(item, 'text')
  if (!text) return null
  const pages = pagesOf(item)
  const named = OURS.test(text) || pages.some((page) => OURS.test(`${page.title ?? ''} ${page.description ?? ''}`))
  const born = (kind === 'birth' || kind === 'death') && pages.some((page) => CITY.test(page.extract ?? ''))
  if (!named && !born) return null
  const year = Number(str(item, 'year'))
  /* the page that names us, else the first */
  const page = pages.find((p) => OURS.test(`${p.title ?? ''} ${p.description ?? ''}`)) ?? pages[0]
  return {
    year: Number.isInteger(year) && year !== 0 ? year : null,
    text: clip(text.replace(/\s+/g, ' '), 200)!,
    kind,
    url: page?.url ?? null,
    key: `${year}|${pages[0]?.title ?? text}`,
    strong: OURS.test(text),
  }
}

export function normalizeOnThisDay(raw: unknown, max = 3): Moment[] | null {
  let found = false
  const picked = new Map<string, Moment & { strong: boolean }>()
  eachObject(raw, (item) => {
    if (!SECTIONS.some(([name]) => Array.isArray(item[name]))) return
    found = true
    for (const [name, kind] of SECTIONS) {
      for (const entry of Array.isArray(item[name]) ? (item[name] as unknown[]) : []) {
        const m = isObj(entry) ? moment(entry, kind) : null
        if (m && !picked.has(m.key)) picked.set(m.key, m)
      }
    }
  })
  if (!found) {
    /* a wrapper that flattens the sections into one list, each entry with its type */
    const list = findList(raw, (item) => typeof item.text === 'string' && (item.year !== undefined || Array.isArray(item.pages)))
    if (!list.length) return null
    for (const entry of list) {
      const type = (str(entry, 'type', 'kind', 'category') ?? 'event').toLowerCase()
      const kind = SECTIONS.find(([name, k]) => type.startsWith(k) || type === name)?.[1] ?? 'event'
      const m = moment(entry, kind)
      if (m && !picked.has(m.key)) picked.set(m.key, m)
    }
  }
  /* the entry that says it in its own words before the one whose page does */
  return [...picked.values()]
    .sort((a, b) => Number(b.strong) - Number(a.strong))
    .slice(0, max)
    .map(({ year, text, kind, url }) => ({ year, text, kind, url }))
}

/* the MM-DD a date falls on in UTC, which is the day Wikipedia's feed serves */
export const utcDay = (now: Date) => now.toISOString().slice(5, 10)
export const kolkataMonthDay = (now: Date) => now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).slice(5, 10)

export const onThisDayFeed: Feed<OnThisDay> = {
  key: 'on-this-day',
  /* nothing changes until the date does */
  ttlMs: (now, last) => (last?.day === utcDay(now) ? 24 * 3_600_000 : 0),
  async fetch({ wire, now }) {
    const moments = normalizeOnThisDay(await wire('wp_on_this_day', {}))
    return moments ? { day: utcDay(now), moments } : null
  },
}
