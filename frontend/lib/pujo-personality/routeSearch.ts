import { RECOMMENDATIONS, type Route } from './recommendations'
import type { ArchetypeId } from './types'

/*
 * Search every Pujo route (the Pujo Personality's editorial routes) by a
 * pandal, a para, a day, an hour or a word. The query is a regular expression
 * when it parses as one ("sapt|ashtami", "^north", "ghat$"), and plain text
 * when it doesn't, so a stray bracket never breaks the search. Matching is
 * case-insensitive, over the route's title, day and time, zone and reason,
 * and every stop's name, area and note.
 */

export type RouteHit = {
  route: Route
  /* the archetypes this route was written for */
  archetypes: ArchetypeId[]
  /* indexes of the stops that matched, for highlighting */
  stops: number[]
}

export type RouteSearch = { hits: RouteHit[]; mode: 'pattern' | 'text' }

/* long enough for any real search; short enough that a pattern stays cheap */
export const QUERY_MAX = 80

/* One entry per route: some routes are shared by more than one archetype. */
const ROUTES: { route: Route; archetypes: ArchetypeId[] }[] = (() => {
  const byId = new Map<string, { route: Route; archetypes: ArchetypeId[] }>()
  for (const [archetype, recs] of Object.entries(RECOMMENDATIONS) as [ArchetypeId, (typeof RECOMMENDATIONS)[ArchetypeId]][]) {
    for (const route of recs.routes) {
      const seen = byId.get(route.id)
      if (seen) seen.archetypes.push(archetype)
      else byId.set(route.id, { route, archetypes: [archetype] })
    }
  }
  return [...byId.values()]
})()

export const ROUTE_COUNT = ROUTES.length

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/* The query as a case-insensitive pattern, or as literal text if it isn't one. */
export function toMatcher(query: string): { test: (text: string) => boolean; mode: RouteSearch['mode'] } | null {
  const q = query.trim().slice(0, QUERY_MAX)
  if (!q) return null
  let pattern: RegExp
  let mode: RouteSearch['mode'] = 'pattern'
  try {
    pattern = new RegExp(q, 'i')
    /* a pattern that matches nothing-at-all (like "|" or "a*") would list every route */
    if (pattern.test('')) throw new Error('matches empty text')
  } catch {
    pattern = new RegExp(escape(q), 'i')
    mode = 'text'
  }
  return { test: (text) => pattern.test(text), mode }
}

export function searchRoutes(query: string): RouteSearch {
  const matcher = toMatcher(query)
  if (!matcher) return { hits: [], mode: 'text' }

  const hits: RouteHit[] = []
  for (const { route, archetypes } of ROUTES) {
    const stops = route.stops.flatMap((stop, i) => (matcher.test(`${stop.name} ${stop.area} ${stop.note}`) ? [i] : []))
    const routeMatch = [route.title, route.when, route.zone, route.why].some((field) => matcher.test(field))
    if (routeMatch || stops.length) hits.push({ route, archetypes, stops })
  }
  /* routes that match on their stops first: that's usually what someone searching a pandal wants */
  hits.sort((a, b) => b.stops.length - a.stops.length)
  return { hits, mode: matcher.mode }
}
