import type { ActiveEvent, NewsFeed } from './events'

/* Search subjects per feed. Each is paired with a recency qualifier below, so
   one subject yields several focused queries rather than one giant prompt. */
const SUBJECTS: Record<NewsFeed, string[]> = {
  CITY: [
    'Kolkata news',
    'Kolkata city news',
    'Kolkata events',
    'Kolkata culture news',
    'Kolkata important news',
    'Kolkata Metro news',
  ],
  SPORTS: [
    'Kolkata sports news',
    'Kolkata football',
    'East Bengal',
    'Mohun Bagan',
    'Mohammedan Sporting',
    'Kolkata cricket',
    'Eden Gardens',
    'Bengal cricket',
  ],
}

const QUALIFIERS = ['today', 'latest']

/* Anakin searches are paid and slow; this bounds one feed's ingestion. Event
   queries come first so they survive the cut on a busy day. */
export const MAX_QUERIES_PER_FEED = 10
/* the week's rising Kolkata searches that become city news queries */
export const TRENDING_QUERIES = 2

/* "kolkata metro timing" → "kolkata metro timing news"; "durga puja" → "Kolkata durga puja news" */
function trendingQuery(search: string) {
  return /\b(kolkata|calcutta)\b/i.test(search) ? `${search} news` : `Kolkata ${search} news`
}

/* `trending` is what the city is searching this week (lib/live/searching.ts):
   whatever it is about — a festival, a flood, a final — the news follows it,
   so a season reaches the news because people are asking about it. */
export function buildNewsQueries(feed: NewsFeed, events: ActiveEvent[] = [], trending: string[] = []) {
  const eventQueries = events.filter((event) => event.feed === feed).flatMap((event) => event.queries)
  const trendingQueries = feed === 'CITY' ? trending.slice(0, TRENDING_QUERIES).map(trendingQuery) : []
  /* alternate qualifiers across subjects: "Kolkata news today", "Kolkata city news latest", … */
  const subjectQueries = SUBJECTS[feed].map((subject, index) => `${subject} ${QUALIFIERS[index % QUALIFIERS.length]}`)
  /* the two broadest subjects also get the other qualifier */
  const extra = SUBJECTS[feed].slice(0, 2).map((subject, index) => `${subject} ${QUALIFIERS[(index + 1) % QUALIFIERS.length]}`)
  const seen = new Set<string>()
  return [...eventQueries, ...trendingQueries, ...subjectQueries, ...extra]
    .filter((query) => {
      const key = query.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, MAX_QUERIES_PER_FEED)
}
