import { RECOMMENDATIONS } from '@/lib/pujo-personality/recommendations'
import { NIGHTS, zoneLabel, type Night, type VibeId, type ZoneId } from './config'

/*
 * A match comes with a plan: one pandal, one night, one time. The pandals are
 * the Pujo Personality's curated list (lib/pujo-personality/recommendations.ts),
 * grouped by the same coarse zones people pick. The first date is a plan in
 * public (07-pujo-match.md §8): a busy pandal, starting before 9 pm, or in the
 * morning crowd for anjali.
 */

export type PlanPandal = { name: string; area: string; note: string; zone: ZoneId }
export type Plan = { night: Night; pandal: string; area: string; note: string; time: string; zone: ZoneId }
export type PlanInput = { id: string; night: Night; zone: ZoneId; vibes: readonly VibeId[] }

/* the recommendation areas, sorted into zones; anything unlisted (home, "any stall") is not a pandal to meet at */
const AREA_ZONES: Record<string, ZoneId> = {
  Ahiritola: 'north', Bagbazar: 'north', 'Beadon Street': 'north', Hatibagan: 'north', Jorasanko: 'north',
  Kumartuli: 'north', 'North Kolkata': 'north', Shobhabazar: 'north', Tala: 'north',
  Bowbazar: 'central', 'Central Avenue': 'central', 'College Street': 'central',
  Ballygunge: 'south', Gariahat: 'south', Kalighat: 'south', 'Lake View Road': 'south',
  Kasba: 'jadavpur', Santoshpur: 'jadavpur',
  Behala: 'behala',
  'Salt Lake': 'salt_lake',
  'Lake Town': 'dum_dum',
}

export const PLAN_PANDALS: PlanPandal[] = (() => {
  const seen = new Map<string, PlanPandal>()
  for (const recs of Object.values(RECOMMENDATIONS)) {
    for (const pick of recs.pandals) {
      const zone = AREA_ZONES[pick.area]
      if (zone && !seen.has(pick.name)) seen.set(pick.name, { name: pick.name, area: pick.area, note: pick.note, zone })
    }
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
})()

/* Zones with no pandal of their own meet where the Metro or a bridge takes them. */
const NEAREST: Record<ZoneId, ZoneId> = {
  north: 'north', central: 'central', south: 'south', jadavpur: 'jadavpur', behala: 'behala',
  salt_lake: 'salt_lake', dum_dum: 'dum_dum', new_town: 'salt_lake', howrah: 'central',
}

/* two people, two zones: where they meet */
export function meetingZone(a: ZoneId, b: ZoneId): ZoneId {
  const [x, y] = [NEAREST[a], NEAREST[b]]
  if (x === y) return x
  const pair = new Set([x, y])
  const both = (p: ZoneId, q: ZoneId) => pair.has(p) && pair.has(q)
  if (both('south', 'jadavpur') || both('south', 'behala') || both('jadavpur', 'behala')) return 'south'
  if (both('north', 'dum_dum')) return 'north'
  if (both('salt_lake', 'dum_dum')) return 'dum_dum'
  return 'central'
}

/* Both picked the same night: that one. Otherwise Ashtami if either did, or the earlier night. */
export function planNight(a: Night, b: Night): Night {
  if (a === b) return a
  if (a === 'ashtami' || b === 'ashtami') return 'ashtami'
  return NIGHTS.indexOf(a) < NIGHTS.indexOf(b) ? a : b
}

/* The time follows the vibes they share first, then the ones either of them picked. */
const TIMES: [VibeId, string][] = [
  ['anjali', '9 am, for anjali'],
  ['bhor', '9 am, before the queues'],
  ['bhog_first', '12:30 pm, in the bhog queue'],
  ['photo_walk', '5 pm, for the golden hour'],
  ['themes', '5:30 pm, while the light is on the themes'],
  ['dhaak', '7 pm, for the sandhya arati'],
  ['dhunuchi', '7 pm, for the dhunuchi circle'],
  ['bonedi', '6 pm, a thakur dalan at dusk'],
  ['adda', '7:30 pm, adda after'],
  ['roll', '7:30 pm, roll first, pandal after'],
  ['pandal_hopper', '6 pm, and then the next one'],
  ['after_midnight', '8:30 pm, and see how late it goes'],
]
const DEFAULT_TIME = '7 pm, as the lights come on'

export function planTime(a: readonly VibeId[], b: readonly VibeId[]): string {
  const shared = TIMES.find(([vibe]) => a.includes(vibe) && b.includes(vibe))
  const either = TIMES.find(([vibe]) => a.includes(vibe) || b.includes(vibe))
  return (shared ?? either)?.[1] ?? DEFAULT_TIME
}

/* a small, stable hash, so the same pair always gets the same pandal */
export function hashString(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function suggestPlan(a: PlanInput, b: PlanInput): Plan {
  const zone = meetingZone(a.zone, b.zone)
  const options = PLAN_PANDALS.filter((p) => p.zone === zone)
  const pool = options.length ? options : PLAN_PANDALS.filter((p) => p.zone === 'central')
  const key = [a.id, b.id].sort().join(':')
  const pandal = pool[hashString(key) % pool.length]
  return {
    night: planNight(a.night, b.night),
    pandal: pandal.name,
    area: pandal.area,
    note: pandal.note,
    time: planTime(a.vibes, b.vibes),
    zone,
  }
}

export const planLine = (plan: Pick<Plan, 'night' | 'time'>) => `${plan.night}, ${plan.time}`
export const planZoneLabel = (plan: Pick<Plan, 'zone'>) => zoneLabel(plan.zone)
