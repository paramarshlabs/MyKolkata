import { findList, num, str } from './shape'

/* ==========================================================================
   Google Trends timelines, read from gt_interest_over_time through Anakin
   Wire: how much a search was made, on Google's 0–100 scale, day by day or
   week by week. The searching feed (lib/live/searching.ts) draws the week's
   fastest-rising Kolkata search this way.
   ========================================================================== */

export type TrendPoint = { d: string; v: number }
export type Trend = { keyword: string; geo: string; points: TrendPoint[] }
export type PujoTrend = Trend

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

export function normalizeTrend(raw: unknown, keyword: string, geo: string): Trend | null {
  const rows = findList(raw, (item) => (item.value !== undefined || item.values !== undefined || item.interest !== undefined)
    && (item.time !== undefined || item.date !== undefined || item.formattedTime !== undefined || item.week !== undefined), 8)
  const points = rows
    .map((item) => ({ d: dateOf(item), v: num(item.value ?? item.values ?? item.interest) }))
    .filter((point): point is TrendPoint => Boolean(point.d) && point.v != null && point.v >= 0 && point.v <= 100)
    .sort((a, b) => a.d.localeCompare(b.d))
  return points.length >= 8 ? { keyword, geo, points } : null
}

/* For a year of "Durga Puja" searches (components/home/PujoPulse.tsx): last
   Pujo's peak (the highest week more than four months back) and this week,
   and whether the line is still rising. */
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

const DAY_MS = 86_400_000

/* A rising search, read off its line: whether the points are days or weeks,
   the last week against the four before it, and the highest point, named
   only when it isn't the last week (the end of the line is labelled anyway). */
export function readPulse(trend: Trend) {
  const { points } = trend
  const n = points.length
  const gaps = points.slice(1).map((point, i) => (Date.parse(point.d) - Date.parse(points[i].d)) / DAY_MS).sort((a, b) => a - b)
  const daily = (gaps[Math.floor(gaps.length / 2)] ?? 7) <= 2
  const week = daily ? 7 : 1
  const mean = (list: TrendPoint[]) => (list.length ? list.reduce((sum, point) => sum + point.v, 0) / list.length : 0)
  const recent = mean(points.slice(-week))
  const before = mean(points.slice(Math.max(0, n - 5 * week), n - week))
  let peak = 0
  points.forEach((point, i) => { if (point.v > points[peak].v) peak = i })
  return {
    daily,
    current: points[n - 1],
    peakIndex: peak < n - week && points[peak].v > 0 ? peak : null,
    /* null when almost nobody searched for it before */
    ratio: before >= 1 ? recent / before : null,
    recent,
  }
}
