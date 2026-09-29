import type { Feed } from './refresh'
import { clip, eachObject, isObj, isoOf, str } from './shape'

/* ==========================================================================
   The match strip: an India, Bengal or Kolkata cricket match that is live or
   starts within a day, from ESPNcricinfo's live listing through Anakin Wire
   (act_espncricinfo_live_matches_listing). Everything the listing has for
   those sides is stored; the page decides what is worth a line right now,
   and a live match brings the next fetch forward.
   ========================================================================== */

export type Side = { name: string; score: string | null; overs: string | null }
export type MatchState = 'live' | 'upcoming' | 'result'
export type Match = {
  id: string
  teams: [Side, Side]
  state: MatchState
  /* "India need 45 runs from 38 balls", "Match starts in 3 hrs" */
  status: string | null
  title: string | null
  series: string | null
  start: string | null
  url: string
}
export type Cricket = { matches: Match[] }

/* India's sides (men, women, A, under-19), Bengal and the Knight Riders; West Indies is not India */
const OURS = /\b(India|Bengal|Kolkata)\b/i
const HOUR_MS = 3_600_000
const LISTING = 'https://www.espncricinfo.com/live-cricket-score'

function side(value: unknown): Side | null {
  if (typeof value === 'string') return value.trim() ? { name: value.trim(), score: null, overs: null } : null
  if (!isObj(value)) return null
  const team = isObj(value.team) ? value.team : value
  const name = str(team, 'longName', 'name', 'team_name', 'teamName', 'fullName')
  if (!name) return null
  return { name: clip(name, 40)!, score: str(value, 'score', 'scores'), overs: str(value, 'scoreInfo', 'overs', 'score_info') }
}

function teamsOf(item: Record<string, unknown>): [Side, Side] | null {
  const list = Array.isArray(item.teams) ? item.teams.map(side) : [side(item.team1 ?? item.home), side(item.team2 ?? item.away)]
  return list.length === 2 && list[0] && list[1] ? [list[0], list[1]] : null
}

/* Cricinfo's own codes first (state LIVE/PRE/POST, stage RUNNING/SCHEDULED/FINISHED), then the words */
export function stateOf(item: Record<string, unknown>): MatchState | null {
  const codes = `${str(item, 'state') ?? ''} ${str(item, 'stage') ?? ''}`.toUpperCase()
  if (/\bLIVE\b|\bRUNNING\b/.test(codes)) return 'live'
  if (/\bPRE\b|\bSCHEDULED\b/.test(codes)) return 'upcoming'
  if (/\bPOST\b|\bFINISHED\b/.test(codes)) return 'result'
  const words = `${str(item, 'status', 'matchStatus', 'match_status') ?? ''} ${str(item, 'statusText', 'status_text') ?? ''}`
  if (/\b(won|drawn|tied|abandoned|no result)\b/i.test(words)) return 'result'
  if (/\b(live|need|trail|lead|innings break|stumps|lunch|tea|drinks|opt(ed)? to|chose to|rain)\b/i.test(words)) return 'live'
  if (/\b(starts?|scheduled|upcoming|preview)\b/i.test(words)) return 'upcoming'
  return null
}

function urlOf(item: Record<string, unknown>) {
  const series = isObj(item.series) ? item.series : null
  const slug = str(item, 'slug')
  const id = str(item, 'objectId')
  const seriesSlug = series && str(series, 'slug')
  const seriesId = series && str(series, 'objectId')
  if (slug && id && seriesSlug && seriesId && [slug, id, seriesSlug, seriesId].every((part) => /^[a-z0-9-]+$/i.test(part))) {
    return `https://www.espncricinfo.com/series/${seriesSlug}-${seriesId}/${slug}-${id}/live-cricket-score`
  }
  const given = str(item, 'url', 'link', 'matchUrl', 'match_url')
  try {
    const url = given ? new URL(given, 'https://www.espncricinfo.com') : null
    if (url && /(^|\.)espncricinfo\.com$/.test(url.hostname)) return `https://www.espncricinfo.com${url.pathname}`
  } catch {
    /* fall through to the listing */
  }
  return LISTING
}

export function normalizeCricket(raw: unknown): Match[] | null {
  let found = false
  const out: Match[] = []
  const seen = new Set<string>()
  eachObject(raw, (item) => {
    const teams = teamsOf(item)
    const state = teams && stateOf(item)
    if (!teams || !state) return
    found = true
    if (!teams.some((team) => OURS.test(team.name))) return
    const id = str(item, 'objectId', 'id', 'matchId', 'match_id') ?? teams.map((team) => team.name).join('-')
    if (seen.has(id)) return
    seen.add(id)
    const series = isObj(item.series) ? str(item.series, 'longName', 'name') : str(item, 'seriesName', 'series_name', 'series')
    const status = str(item, 'statusText', 'status_text', 'status')
    out.push({
      id,
      teams,
      state,
      /* a bare code is not a status a person can read */
      status: status && !/^(LIVE|PRE|POST|RESULT)$/i.test(status) ? clip(status, 90) : null,
      title: clip(str(item, 'title', 'description', 'matchDesc', 'match_desc'), 40),
      series: clip(series, 60),
      start: isoOf(item.startTime ?? item.start_time ?? item.startDate ?? item.start_date ?? item.date ?? null),
      url: urlOf(item),
    })
  })
  /* null only when there was no listing to read; an empty day is a real answer */
  return found ? out : null
}

/* What earns a line now: a live match whose score is under three hours
   old, then a match starting within the next day; live first, at most two. */
export function matchesNow(feed: Cricket | null, fetchedAt: string | null, now: Date) {
  if (!feed) return []
  const t = now.getTime()
  const fresh = fetchedAt ? t - Date.parse(fetchedAt) < 3 * HOUR_MS : false
  const live = feed.matches.filter((match) => match.state === 'live' && fresh)
  const soon = feed.matches.filter((match) => match.state === 'upcoming' && match.start
    && Date.parse(match.start) > t - HOUR_MS / 2 && Date.parse(match.start) <= t + 24 * HOUR_MS)
    .sort((a, b) => Date.parse(a.start!) - Date.parse(b.start!))
  return [...live, ...soon].slice(0, 2)
}

export const cricketFeed: Feed<Cricket> = {
  key: 'cricket',
  /* every twenty minutes while one of ours is on or about to start, else every three hours */
  ttlMs: (now, last) => {
    const busy = last?.matches.some((match) => match.state === 'live'
      || (match.start && Math.abs(Date.parse(match.start) - now.getTime()) < 3 * HOUR_MS))
    return busy ? 20 * 60_000 : 3 * HOUR_MS
  },
  async fetch({ wire }) {
    const matches = normalizeCricket(await wire('act_espncricinfo_live_matches_listing', { lang: 'en' }))
    return matches ? { matches } : null
  },
}
