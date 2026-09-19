import type { ActiveEvent, NewsFeed } from './events'
import { titleSimilarity } from './sources'

/* ==========================================================================
   Ranking and rotation for the Home news cards.

     score = freshness + Kolkata relevance + source quality + event relevance
           + importance + category relevance
           - duplicate penalty - stale penalty - recently-featured penalty

   The parts that do not change with time (relevance, source, importance,
   category) are computed once at ingestion and stored as News.score. The
   parts that do (freshness, event, penalties) are applied when selecting.
   All weights are in points; a fresh, local, well-sourced story on an
   ordinary day scores roughly 80–95.
   ========================================================================== */

const HOUR_MS = 3_600_000

/* --- stored (base) score ------------------------------------------------- */

/* Relevance is the heaviest static factor: a well-sourced story that is not
   really about Kolkata should lose to a modest one that is. */
export const RELEVANCE_POINTS = 25
/* A good source is worth a lot, but never more than being on-topic. */
export const SOURCE_POINTS = 15
/* "Opens", "announces", "wins" — something happened. */
export const IMPORTANCE_POINTS = 10
/* A small nudge between kinds of story; see CATEGORY_WEIGHT. */
export const CATEGORY_POINTS = 5

/* Civic, transport and the two big sports are what the city follows most;
   weather and uncategorised stories are useful but rarely the headline. */
export const CATEGORY_WEIGHT: Record<string, number> = {
  civic: 1, transport: 1, culture: 0.9, weather: 0.7, general: 0.5,
  football: 1, cricket: 1, other: 0.7,
}

export function baseScore(input: { relevance: number; sourceQuality: number; importance: number; category: string }) {
  const category = CATEGORY_WEIGHT[input.category] ?? 0.5
  return round(
    input.relevance * RELEVANCE_POINTS
    + input.sourceQuality * SOURCE_POINTS
    + input.importance * IMPORTANCE_POINTS
    + category * CATEGORY_POINTS,
  )
}

/* --- time-dependent parts ------------------------------------------------ */

/* Freshness dominates: up to 40 points, halving every 24 hours, so a story
   from this morning beats yesterday's unless yesterday's is clearly better
   (40 → 20 → 10 → 5 at 0 / 24 / 48 / 72 hours). */
export const FRESHNESS_POINTS = 40
export const FRESHNESS_HALF_LIFE_HOURS = 24
/* With no publish date we only know when we found the story, not when it
   happened — a months-old page can surface in today's search. Such stories
   get half the freshness, so any dated fresh story beats them. */
export const UNDATED_FRESHNESS_FACTOR = 0.5

/* Past three days a story is old news: an extra 10 off on top of decay.
   Past seven it is not a candidate at all (the fallbacks in home.ts may still
   show it if nothing else exists). */
export const STALE_AFTER_HOURS = 72
export const STALE_PENALTY = 10
export const MAX_AGE_HOURS = 7 * 24

/* A story about the event that is on today gets a lift that keeps the event
   on the card for its whole run — and a little more if it is about today's
   phase (Ashtami coverage on Ashtami). */
export const EVENT_ACTIVE_POINTS = 15
export const EVENT_PHASE_POINTS = 8

/* A featured story owns its card for a day, then cools down for two more.
   While cooling it loses 30 points: enough for any comparable fresh story to
   take over, not so much that a lone major story is pulled with nothing to
   replace it. */
export const FEATURE_TURN_HOURS = 24
export const COOLDOWN_HOURS = 72
export const RECENTLY_FEATURED_PENALTY = 30

/* The same story from a second outlet should not reclaim the card the day
   after the first outlet's version cooled down. */
export const DUPLICATE_SIMILARITY = 0.6
export const DUPLICATE_PENALTY = 20

/* During its turn a featured story is only displaced by something far bigger
   (genuine breaking news), so the card does not flicker between runs. */
export const BREAKING_MARGIN = 25

export type RankableStory = {
  id: string
  type: string
  title: string
  score?: number | null
  publishedAt?: Date | string | null
  discoveredAt?: Date | string | null
  createdAt?: Date | string | null
  eventSlug?: string | null
  eventPhase?: string | null
  featuredAt?: Date | string | null
  cooldownUntil?: Date | string | null
  expiresAt?: Date | string | null
  isActive?: boolean | null
}

type RankContext = { now: Date; events?: ActiveEvent[]; peers?: RankableStory[] }

function time(value: Date | string | null | undefined) {
  if (!value) return null
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? ms : null
}

/* When the story happened: its publish date, unless missing or in the future. */
export function storyTime(story: RankableStory, now: Date) {
  const published = time(story.publishedAt)
  if (published !== null && published <= now.getTime() + HOUR_MS) return published
  return time(story.discoveredAt) ?? time(story.createdAt) ?? now.getTime()
}

export function ageHours(story: RankableStory, now: Date) {
  return Math.max(0, (now.getTime() - storyTime(story, now)) / HOUR_MS)
}

export function isEligible(story: RankableStory, now: Date) {
  if (story.isActive === false) return false
  const expires = time(story.expiresAt)
  if (expires !== null && expires <= now.getTime()) return false
  return ageHours(story, now) <= MAX_AGE_HOURS
}

export function isHoldingCard(story: RankableStory, now: Date) {
  const featured = time(story.featuredAt)
  return featured !== null && now.getTime() - featured < FEATURE_TURN_HOURS * HOUR_MS
}

function isCooling(story: RankableStory, now: Date) {
  const until = time(story.cooldownUntil)
  return until !== null && until > now.getTime() && !isHoldingCard(story, now)
}

export function rankStory(story: RankableStory, { now, events = [], peers = [] }: RankContext) {
  const age = ageHours(story, now)
  const event = story.eventSlug ? events.find((entry) => entry.slug === story.eventSlug) : undefined
  const duplicateOfCooling = peers.some((peer) => peer.id !== story.id
    && isCooling(peer, now)
    && titleSimilarity(peer.title, story.title) >= DUPLICATE_SIMILARITY)

  const parts = {
    base: Number(story.score) || 0,
    freshness: FRESHNESS_POINTS * 0.5 ** (age / FRESHNESS_HALF_LIFE_HOURS) * (time(story.publishedAt) === null ? UNDATED_FRESHNESS_FACTOR : 1),
    event: event ? EVENT_ACTIVE_POINTS + (event.phase && story.eventPhase === event.phase ? EVENT_PHASE_POINTS : 0) : 0,
    stale: age > STALE_AFTER_HOURS ? -STALE_PENALTY : 0,
    featured: isCooling(story, now) ? -RECENTLY_FEATURED_PENALTY : 0,
    duplicate: duplicateOfCooling ? -DUPLICATE_PENALTY : 0,
  }
  const total = round(Object.values(parts).reduce((sum, value) => sum + value, 0))
  return { total, parts }
}

/* Pick the story for one card. Only stories of that card's type are ever
   considered — a sports card never shows a city story, and vice versa. */
export function selectHomeStory<T extends RankableStory>(rows: T[], type: NewsFeed, { now, events = [] }: { now: Date; events?: ActiveEvent[] }): T | null {
  const candidates = rows.filter((row) => row.type === type && isEligible(row, now))
  if (!candidates.length) return null

  const ranked = candidates
    .map((story) => ({ story, total: rankStory(story, { now, events, peers: candidates }).total }))
    .sort((left, right) => right.total - left.total || storyTime(right.story, now) - storyTime(left.story, now))

  const holder = ranked
    .filter(({ story }) => isHoldingCard(story, now))
    .sort((left, right) => (time(right.story.featuredAt) ?? 0) - (time(left.story.featuredAt) ?? 0))[0]

  if (holder && ranked[0].total - holder.total < BREAKING_MARGIN) return holder.story
  return ranked[0].story
}

/* What to write when a story takes the card. */
export function featureStamp(now: Date) {
  return { featuredAt: now, cooldownUntil: new Date(now.getTime() + COOLDOWN_HOURS * HOUR_MS) }
}

function round(value: number) {
  return Math.round(value * 100) / 100
}
