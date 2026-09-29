import type { Feed } from './refresh'
import { eachObject, findList, isObj, isUnfit, num, str } from './shape'
import { normalizeTrend, type Trend } from './trend'
import { optional } from './wire'

/* ==========================================================================
   What Kolkata is searching: the searches rising alongside "Kolkata" in West
   Bengal this week, the fastest riser's last three months drawn as a line,
   and the derby fought in searches — Mohun Bagan against East Bengal — all
   from Google Trends through Anakin Wire. Whatever the city is searching
   for leads the section, so a season shows up only when the searches do.
   ========================================================================== */

export type Rising = { query: string; growth: string }
export type Derby = { a: { name: string; share: number }; b: { name: string; share: number } }
/* `pulse` is missing from what was stored before the line was added */
export type Searching = { rising: Rising[]; derby: Derby | null; pulse?: Trend | null }

export const DERBY = ['Mohun Bagan', 'East Bengal'] as const
export const GEO = 'IN-WB'

function growthOf(item: Record<string, unknown>) {
  const formatted = str(item, 'formattedValue', 'growth', 'change')
  if (formatted) return /breakout/i.test(formatted) ? 'Breakout' : formatted.replace(/,/g, '')
  const value = num(item.value)
  return value != null ? `+${value}%` : ''
}

/* Google's related queries arrive as rankedList[0] = top, rankedList[1] =
   rising; wrappers flatten them to { top, rising }. Rising is the one that
   says what is new this week. */
export function normalizeRising(raw: unknown, max = 8): Rising[] {
  let list: Record<string, unknown>[] = []
  eachObject(raw, (item) => {
    if (list.length) return
    if (Array.isArray(item.rising)) list = (item.rising as unknown[]).filter(isObj)
    else if (Array.isArray(item.rankedList) && item.rankedList.length > 1 && isObj(item.rankedList[1])) {
      const rising = (item.rankedList[1] as Record<string, unknown>).rankedKeyword
      if (Array.isArray(rising)) list = rising.filter(isObj)
    }
  })
  if (!list.length) list = findList(raw, (item) => typeof item.query === 'string')
  const seen = new Set<string>()
  return list
    .map((item) => ({ query: str(item, 'query', 'title', 'keyword') ?? '', growth: growthOf(item) }))
    .filter((item) => {
      const key = item.query.toLowerCase()
      if (!item.query || item.query.length > 60 || isUnfit(item.query) || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, max)
}

/* The two teams' interest summed over the week, as shares of the pair. */
export function normalizeDerby(raw: unknown, [first, second]: readonly [string, string] = DERBY): Derby | null {
  let a = 0
  let b = 0
  eachObject(raw, (item) => {
    if (Array.isArray(item.value) && item.value.length === 2 && (item.time !== undefined || item.formattedTime !== undefined || item.date !== undefined)) {
      a += num(item.value[0]) ?? 0
      b += num(item.value[1]) ?? 0
    } else if (item[first] !== undefined && item[second] !== undefined && !isObj(item[first])) {
      a += num(item[first]) ?? 0
      b += num(item[second]) ?? 0
    }
  })
  const total = a + b
  if (!total) return null
  const shareA = Math.round((a / total) * 100)
  return { a: { name: first, share: shareA }, b: { name: second, share: 100 - shareA } }
}

export const searchingFeed: Feed<Searching> = {
  key: 'searching',
  async fetch({ wire }) {
    const rising = normalizeRising(await wire('gt_related_queries', { keyword: 'Kolkata', geo: GEO, timeframe: 'now 7-d' }))
    /* daily for three months: long enough to show where the rise began */
    const lead = rising[0]?.query
    const pulse = lead
      ? normalizeTrend(await optional(wire('gt_interest_over_time', { keyword: lead, geo: GEO, timeframe: 'today 3-m' })), lead, GEO)
      : null
    const derby = normalizeDerby(await optional(wire('gt_compare', { keywords: DERBY.join(','), geo: GEO, timeframe: 'now 7-d' })))
    return rising.length || derby ? { rising, derby, pulse } : null
  },
}
