import type { Feed } from './refresh'
import { clip, eachObject, isObj, isoOf, isUnfit } from './shape'
import { optional } from './wire'

/* ==========================================================================
   Kolkata on YouTube this week: what people uploaded about the city in the
   last seven days, most watched first, from YouTube search through Anakin
   Wire (yt_search). The searches are only the city's name, in English and
   in Bengali; a season shows up here only when the uploads are about it.
   ========================================================================== */

export type Video = {
  id: string
  title: string
  channel: string | null
  views: number | null
  /* roughly when it went up, worked out from "2 days ago" at fetch time */
  at: string
  duration: string | null
}
export type YouTube = { videos: Video[] }

export const QUERIES = ['Kolkata', 'কলকাতা'] as const

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/
const HOUR_MS = 3_600_000
const WEEK_H = 7 * 24

/* YouTube's own text fields come as a string, { simpleText } or { runs: [{ text }] } */
function textOf(value: unknown): string | null {
  if (typeof value === 'string') return value.replace(/\s+/g, ' ').trim() || null
  if (typeof value === 'number') return String(value)
  if (!isObj(value)) return null
  if (typeof value.simpleText === 'string') return textOf(value.simpleText)
  if (Array.isArray(value.runs)) return textOf(value.runs.map((run) => (isObj(run) && typeof run.text === 'string' ? run.text : '')).join(''))
  return textOf(value.text ?? value.name ?? value.title ?? null)
}

const first = (item: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    const text = textOf(item[key])
    if (text) return text
  }
  return null
}

const UNITS: Record<string, number> = { second: 1 / 3600, minute: 1 / 60, hour: 1, day: 24, week: 24 * 7, month: 24 * 30, year: 24 * 365 }

/* "2 days ago", "Streamed 5 hours ago" → hours; an ISO date → hours before now */
export function ageHours(value: string | null, now: Date): number | null {
  if (!value) return null
  const relative = value.match(/(\d+)\s*(second|minute|hour|day|week|month|year)s?\s+ago/i)
  if (relative) return Number(relative[1]) * UNITS[relative[2].toLowerCase()]
  const iso = isoOf(value)
  return iso ? Math.max(0, (now.getTime() - Date.parse(iso)) / HOUR_MS) : null
}

/* "12,345 views", "1.2K views", "3 lakh views", 4821 → a number */
export function viewsOf(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const text = textOf(value)
  if (!text) return null
  if (/^no views/i.test(text)) return 0
  const match = text.replace(/,/g, '').match(/([\d.]+)\s*(k|m|b|lakh|crore)?\b/i)
  if (!match) return null
  const scale = { k: 1e3, m: 1e6, b: 1e9, lakh: 1e5, crore: 1e7 }[match[2]?.toLowerCase() as 'k'] ?? 1
  return Math.round(Number(match[1]) * scale)
}

export function extractVideos(raw: unknown, now: Date): Video[] {
  const out: Video[] = []
  const seen = new Set<string>()
  eachObject(raw, (item) => {
    const id = first(item, 'videoId', 'video_id', 'id')
    if (!id || !VIDEO_ID.test(id) || seen.has(id)) return
    const title = first(item, 'title', 'name')
    if (!title) return
    seen.add(id)
    const age = ageHours(first(item, 'publishedTimeText', 'published_time', 'publishedTime', 'published', 'uploaded', 'publishedAt', 'published_at', 'uploadDate', 'upload_date'), now)
    /* undated (a live stream, a channel) or older than a week: not this week */
    if (age == null || age > WEEK_H || isUnfit(title)) return
    out.push({
      id,
      title: clip(title, 110)!,
      channel: clip(first(item, 'channel', 'channelTitle', 'channel_title', 'channelName', 'channel_name', 'author', 'ownerText', 'longBylineText', 'uploader'), 50),
      views: viewsOf(item.viewCountText ?? item.view_count ?? item.viewCount ?? item.views ?? null),
      at: new Date(now.getTime() - age * HOUR_MS).toISOString(),
      duration: first(item, 'lengthText', 'duration', 'length'),
    })
  })
  return out
}

/* the week's most watched, and the unknowns after them, newest first */
export function rankVideos(videos: Video[], max = 6) {
  return [...videos]
    .sort((a, b) => (b.views ?? -1) - (a.views ?? -1) || Date.parse(b.at) - Date.parse(a.at))
    .slice(0, max)
}

export const youtubeFeed: Feed<YouTube> = {
  key: 'youtube',
  ttlMs: 12 * HOUR_MS,
  async fetch({ wire, now }) {
    /* the English search must work; the Bengali one only adds to it */
    const english = await wire('yt_search', { query: QUERIES[0], limit: 40 })
    const bengali = await optional(wire('yt_search', { query: QUERIES[1], limit: 40 }))
    const found = [...extractVideos(english, now), ...extractVideos(bengali, now)]
    const unique = [...new Map(found.map((video) => [video.id, video])).values()]
    const videos = rankVideos(unique)
    return videos.length ? { videos } : null
  },
}

/* 12400 → "12K views" */
export function viewsLabel(views: number | null) {
  if (views == null) return null
  if (views < 1000) return `${views} ${views === 1 ? 'view' : 'views'}`
  const [n, unit] = views >= 1e6 ? [views / 1e6, 'M'] : [views / 1e3, 'K']
  return `${n >= 10 ? Math.round(n) : Math.round(n * 10) / 10}${unit} views`
}
