import type { Feed } from './refresh'
import { findList, num, str } from './shape'

/* ==========================================================================
   The Pujo pulse: how much West Bengal has searched for "Durga Puja" over the
   last twelve months, week by week, from Google Trends through Anakin Wire
   (gt_interest_over_time). Twelve months takes in last year's Pujo, so one
   request puts last year's peak and this year's climb on the same 0–100 scale.
   ========================================================================== */

export type TrendPoint = { d: string; v: number }
export type PujoTrend = { keyword: string; geo: string; points: TrendPoint[] }

export const PUJO_KEYWORD = 'Durga Puja'
export const PUJO_GEO = 'IN-WB'

function dateOf(item: Record<string, unknown>) {
  /* Google's own timeline uses unix seconds in `time`; wrappers tend to use a date string */
  const seconds = num(item.time)
  if (seconds && seconds > 1e9 && seconds < 1e11) return new Date(seconds * 1000).toISOString().slice(0, 10)
  const text = str(item, 'date', 'formattedAxisTime', 'formattedTime', 'week', 'time')
  if (!text) return null
  /* "Sep 21 – 27, 2025" → the first day */
  if (/^\d{4}-\d\d-\d\d/.test(text)) return text.slice(0, 10)
  const cleaned = text.replace(/\s*[–-]\s*\d+(?=,)/, '').replace(/\s*[–-].*$/, '')
  /* a calendar date, not an instant: read it as UTC so no timezone moves it a day */
  const date = new Date(`${cleaned} UTC`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

export function normalizeTrend(raw: unknown): PujoTrend | null {
  const rows = findList(raw, (item) => (item.value !== undefined || item.values !== undefined || item.interest !== undefined)
    && (item.time !== undefined || item.date !== undefined || item.formattedTime !== undefined || item.week !== undefined), 8)
  const points = rows
    .map((item) => ({ d: dateOf(item), v: num(item.value ?? item.values ?? item.interest) }))
    .filter((point): point is TrendPoint => Boolean(point.d) && point.v != null && point.v >= 0 && point.v <= 100)
    .sort((a, b) => a.d.localeCompare(b.d))
  return points.length >= 8 ? { keyword: PUJO_KEYWORD, geo: PUJO_GEO, points } : null
}

export const pujoTrendFeed: Feed<PujoTrend> = {
  key: 'pujo-trend',
  ttlMs: 12 * 3_600_000,
  async fetch({ wire }) {
    return normalizeTrend(await wire('gt_interest_over_time', { keyword: PUJO_KEYWORD, geo: PUJO_GEO, timeframe: 'today 12-m' }))
  },
}

/* The two points worth naming: last Pujo's peak (the highest week more than
   four months back) and this week, and whether the line is still rising. */
export function readTrend(trend: PujoTrend) {
  const { points } = trend
  const last = points[points.length - 1]
  const cutoff = new Date(Date.parse(last.d) - 120 * 86_400_000).toISOString().slice(0, 10)
  let peak = -1
  points.forEach((point, i) => { if (point.d <= cutoff && (peak < 0 || point.v > points[peak].v)) peak = i })
  const before = points[Math.max(0, points.length - 3)]
  return {
    peakIndex: peak >= 0 && points[peak].v > 0 ? peak : null,
    current: last,
    rising: last.v > before.v,
    ofPeak: peak >= 0 && points[peak].v > 0 ? Math.round((last.v / points[peak].v) * 100) : null,
  }
}
