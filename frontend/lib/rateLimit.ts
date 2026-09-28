/*
 * A sliding-window limit per key (usually a user id), held in memory.
 *
 * Each server instance keeps its own count, so on Vercel this is a speed bump,
 * not a wall: it stops a script or a stuck button from hammering one instance.
 * Anything that must hold across instances counts rows in the database
 * instead (see the story wall's hourly cap in lib/stories/stories.ts).
 */

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number }

/* keys kept before the oldest are dropped, so the map can't grow without bound */
const MAX_KEYS = 10_000

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>()

  return function check(key: string, now = Date.now()): RateLimitResult {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
    if (recent.length >= limit) {
      hits.set(key, recent)
      return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) }
    }
    recent.push(now)
    hits.delete(key)
    hits.set(key, recent)
    if (hits.size > MAX_KEYS) hits.delete(hits.keys().next().value as string)
    return { ok: true }
  }
}
