import { MAHALAYA, PUJO_DAYS } from '@/lib/pujo'

/* ==========================================================================
   Event context for the news feed: what is happening in Kolkata today, and
   which phase of it. Ingestion uses it to steer Anakin queries and to tag
   stories; ranking uses it to lift stories about the event that is on now.

   The EVENT persists across days; the STORIES under it rotate (see ranking.ts).
   ========================================================================== */

export type NewsFeed = 'CITY' | 'SPORTS'

export type KolkataDay = {
  /* YYYY-MM-DD on the Kolkata calendar */
  iso: string
  year: number
  month: number
  day: number
  /* days since 1970-01-01 on the Kolkata calendar, for date arithmetic */
  epochDay: number
}

export type ActiveEvent = {
  slug: string
  name: string
  feed: NewsFeed
  phase: string | null
  queries: string[]
  image: string | null
}

type EventDefinition = {
  slug: string
  name: string
  feed: NewsFeed
  /* a story mentioning this belongs to the event */
  match: RegExp
  /* local, known-good artwork used only when the story has no image of its own */
  image?: string
  /* null when the event is not on; otherwise the phase ('' when it has none) */
  phaseOn: (day: KolkataDay) => string | null
  phaseFromText?: (text: string) => string | null
  queries: (phase: string) => string[]
}

const DAY_MS = 86_400_000

export function kolkataDay(now: Date = new Date()): KolkataDay {
  const iso = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)
  const [year, month, day] = iso.split('-').map(Number)
  return { iso, year, month, day, epochDay: Math.floor(Date.UTC(year, month - 1, day) / DAY_MS) }
}

function epochDayOf(iso: string) {
  return kolkataDay(new Date(iso)).epochDay
}

/* a recurring window by month/day; handles windows that wrap the new year */
function withinYearly(day: KolkataDay, from: [number, number], to: [number, number]) {
  const value = day.month * 100 + day.day
  const start = from[0] * 100 + from[1]
  const end = to[0] * 100 + to[1]
  return start <= end ? value >= start && value <= end : value >= start || value <= end
}

/* ---------- Durga Puja --------------------------------------------------- */

/* Build-up coverage (themes, pandal construction) starts about three weeks
   before Mahalaya; immersions run two days past Dashami; Bijoya greetings and
   visits carry on for roughly a week after that. */
const PUJO_BUILD_UP_DAYS = 21
const PUJO_IMMERSION_DAYS = 2
const PUJO_BIJOYA_DAYS = 8

function pujoPhase(day: KolkataDay): string | null {
  const mahalaya = epochDayOf(MAHALAYA)
  const days = PUJO_DAYS.map((pujoDay) => ({ phase: pujoDay.en.toLowerCase(), epochDay: epochDayOf(pujoDay.iso) }))
  const shashthi = days[0].epochDay
  const dashami = days[days.length - 1].epochDay
  const today = day.epochDay

  if (today < mahalaya - PUJO_BUILD_UP_DAYS) return null
  if (today < mahalaya) return 'build-up'
  if (today === mahalaya) return 'mahalaya'
  if (today < shashthi) return 'preparations'
  const pujoDay = days.find((entry) => entry.epochDay === today)
  if (pujoDay) return pujoDay.phase
  if (today <= dashami + PUJO_IMMERSION_DAYS) return 'immersion'
  if (today <= dashami + PUJO_IMMERSION_DAYS + PUJO_BIJOYA_DAYS) return 'bijoya'
  return null
}

const PUJO_PHASE_WORDS: Array<[string, RegExp]> = [
  ['immersion', /\b(immersion|visarjan|bisarjan|carnival)\b/i],
  ['dashami', /\b(dashami|dasami|sindoor khela|sindur khela|vijaya)\b/i],
  ['navami', /\bnavami\b/i],
  ['ashtami', /\b(ashtami|sandhi puja|kumari puja|anjali)\b/i],
  ['saptami', /\b(saptami|nabapatrika|kola bou)\b/i],
  ['shashthi', /\b(shashthi|shasthi|sasthi|bodhon)\b/i],
  ['mahalaya', /\b(mahalaya|mahishasuramardini|tarpan)\b/i],
  ['bijoya', /\bbijoya\b/i],
]

const PUJO_QUERIES: Record<string, string[]> = {
  'build-up': ['Durga Puja 2026 Kolkata theme', 'Kolkata pandal preparations', 'Kolkata Durga Puja news'],
  mahalaya: ['Mahalaya Kolkata', 'Durga Puja preparations Kolkata', 'Mahalaya tarpan Kolkata ghats'],
  preparations: ['Durga Puja preparations Kolkata', 'Kolkata pandal inauguration', 'Kolkata Puja crowd'],
  shashthi: ['Maha Shashthi Kolkata', 'Kolkata pandal news', 'Kolkata Puja crowd updates'],
  saptami: ['Maha Saptami Kolkata', 'Kolkata pandal news', 'Puja crowd updates Kolkata'],
  ashtami: ['Maha Ashtami Kolkata', 'Sandhi Puja Kolkata', 'Ashtami pandal news Kolkata'],
  navami: ['Maha Navami Kolkata', 'Kolkata pandal crowd Navami', 'Kolkata Puja night news'],
  dashami: ['Vijaya Dashami Kolkata', 'Durga Puja immersion Kolkata', 'Sindoor Khela Kolkata'],
  immersion: ['Durga Puja immersion Kolkata', 'Kolkata Puja carnival', 'Ganga ghats immersion Kolkata'],
  bijoya: ['Bijoya Dashami Kolkata', 'Bijoya Sammilani Kolkata', 'after Durga Puja Kolkata'],
}

/* ---------- Calendar ----------------------------------------------------- */

/* Windows for events without a fixed date are deliberately generous and
   approximate — they only steer searches and tag stories. A story about an
   event that is not on gets no event lift, so a loose window cannot promote
   stale coverage. Confirm the Book Fair and KIFF dates each season. */
const EVENTS: EventDefinition[] = [
  {
    slug: 'durga-puja',
    name: 'Durga Puja',
    feed: 'CITY',
    match: /\b(durga\s*puj[ao]|pujo|pandal|mahalaya|sindoor khela|sindur khela|bijoya|vijaya dashami)\b/i,
    image: '/durgaeyes.png',
    phaseOn: pujoPhase,
    phaseFromText: (text) => PUJO_PHASE_WORDS.find(([, pattern]) => pattern.test(text))?.[0] ?? null,
    queries: (phase) => PUJO_QUERIES[phase] ?? PUJO_QUERIES['build-up'],
  },
  {
    slug: 'christmas',
    name: 'Christmas',
    feed: 'CITY',
    match: /\b(christmas|x-?mas|park street (lights|illumination)|bow barracks)\b/i,
    phaseOn: (day) => {
      if (!withinYearly(day, [12, 18], [12, 27])) return null
      if (day.month === 12 && day.day === 24) return 'christmas-eve'
      if (day.month === 12 && day.day === 25) return 'christmas-day'
      return 'festive-season'
    },
    queries: (phase) => [
      phase === 'christmas-eve' ? 'Christmas Eve Park Street Kolkata' : 'Kolkata Christmas celebrations',
      'Park Street Christmas Kolkata',
      'Bow Barracks Christmas Kolkata',
    ],
  },
  {
    slug: 'new-year',
    name: 'New Year',
    feed: 'CITY',
    match: /\bnew year('s)?\b/i,
    phaseOn: (day) => {
      if (!withinYearly(day, [12, 28], [1, 2])) return null
      if (day.month === 12 && day.day === 31) return 'new-years-eve'
      if (day.month === 1 && day.day === 1) return 'new-years-day'
      return 'festive-season'
    },
    queries: (phase) => [
      phase === 'new-years-eve' ? "New Year's Eve Kolkata" : 'Kolkata New Year celebrations',
      'Park Street New Year Kolkata',
      'Kolkata New Year police arrangements',
    ],
  },
  {
    slug: 'kolkata-book-fair',
    name: 'International Kolkata Book Fair',
    feed: 'CITY',
    match: /\b(book\s*fair|boi\s*mela|boimela)\b/i,
    image: '/bkf.avif',
    phaseOn: (day) => (withinYearly(day, [1, 20], [2, 15]) ? '' : null),
    queries: () => ['International Kolkata Book Fair', 'Kolkata Book Fair today', 'Boi Mela Kolkata'],
  },
  {
    slug: 'kolkata-film-festival',
    name: 'Kolkata International Film Festival',
    feed: 'CITY',
    match: /\b(kolkata international film festival|kiff)\b/i,
    phaseOn: (day) => (withinYearly(day, [11, 1], [12, 15]) ? '' : null),
    queries: () => ['Kolkata International Film Festival', 'KIFF Kolkata news'],
  },
  {
    slug: 'durand-cup',
    name: 'Durand Cup',
    feed: 'SPORTS',
    match: /\bdurand cup\b/i,
    phaseOn: (day) => (withinYearly(day, [7, 20], [8, 31]) ? '' : null),
    queries: () => ['Durand Cup Kolkata', 'Durand Cup East Bengal Mohun Bagan'],
  },
  {
    slug: 'ipl',
    name: 'IPL at Eden Gardens',
    feed: 'SPORTS',
    match: /\b(kkr|kolkata knight riders)\b/i,
    phaseOn: (day) => (withinYearly(day, [3, 15], [6, 5]) ? '' : null),
    queries: () => ['Kolkata Knight Riders latest', 'KKR Eden Gardens'],
  },
]

export function activeEvents(now: Date = new Date()): ActiveEvent[] {
  const day = kolkataDay(now)
  return EVENTS.flatMap((event) => {
    const phase = event.phaseOn(day)
    if (phase === null) return []
    return [{
      slug: event.slug,
      name: event.name,
      feed: event.feed,
      phase: phase || null,
      queries: event.queries(phase),
      image: event.image ?? null,
    }]
  })
}

/* Which event, if any, a story belongs to — and which phase of it. The phase
   comes from the story's own words first, then from today's calendar. */
export function detectEvent(text: string, active: ActiveEvent[] = []) {
  for (const event of EVENTS) {
    if (!event.match.test(text)) continue
    const current = active.find((entry) => entry.slug === event.slug)
    return {
      eventSlug: event.slug,
      eventPhase: event.phaseFromText?.(text) ?? current?.phase ?? null,
    }
  }
  return { eventSlug: null, eventPhase: null }
}

export function eventImage(eventSlug: string | null | undefined) {
  return EVENTS.find((event) => event.slug === eventSlug)?.image ?? null
}
