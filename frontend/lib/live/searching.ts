import type { Feed } from './refresh'
import { eachObject, findList, isObj, num, str } from './shape'

/* ==========================================================================
   What Kolkata is searching: the searches rising alongside "Kolkata" in West
   Bengal this week, and the derby fought in searches — Mohun Bagan against
   East Bengal — both from Google Trends through Anakin Wire.
   ========================================================================== */

export type Rising = { query: string; growth: string }
export type Derby = { a: { name: string; share: number }; b: { name: string; share: number } }
export type Searching = { rising: Rising[]; derby: Derby | null }

export const DERBY = ['Mohun Bagan', 'East Bengal'] as const

/* a home page for everyone: rising searches that are explicit stay off it */
const UNFIT = /\b(sex|sexy|porn|xxx|nude|naked|nsfw|escort|call ?girl|mms|leaked?)\b/i

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
      if (!item.query || item.query.length > 60 || UNFIT.test(item.query) || seen.has(key)) return false
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
  ttlMs: 6 * 3_600_000,
  async fetch({ wire }) {
    const rising = normalizeRising(await wire('gt_related_queries', { keyword: 'Kolkata', geo: 'IN-WB', timeframe: 'now 7-d' }))
    const derbyRaw = await wire('gt_compare', { keywords: DERBY.join(','), geo: 'IN-WB', timeframe: 'now 7-d' })
      .catch((err) => { if (err?.name === 'WireOutOfCredits' || err?.name === 'WireRateLimited') throw err; return null })
    const derby = normalizeDerby(derbyRaw)
    return rising.length || derby ? { rising, derby } : null
  },
}
