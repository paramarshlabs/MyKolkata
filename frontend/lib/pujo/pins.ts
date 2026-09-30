import { NextResponse } from 'next/server'
import { createRateLimiter } from '@/lib/rateLimit'

/* ==========================================================================
   "Pin in the wrong place?" 432 pins came from Google Places and nobody has
   checked them. A signed-in visitor can say where a pujo really is, in one
   line; someone reads the reports and fixes the pin in lib/pujo/curation.ts.
   The database comes in as an argument, so tests run this in memory.
   ========================================================================== */

export type PinReportInput = { pandalSlug: string; userId: string; note: string; createdAt: Date }

export interface PinReportRepository {
  add(report: PinReportInput): Promise<void>
  /* reports this person sent since then, across every server */
  countSince(userId: string, since: Date): Promise<number>
}

export const NOTE_MAX = 280
const HOUR = 60 * 60 * 1000
const PER_DAY = 20

const NO_STORE = { 'Cache-Control': 'no-store' }
const say = (message: string, status: number, headers: Record<string, string> = {}) =>
  NextResponse.json({ message }, { status, headers: { ...NO_STORE, ...headers } })

/* one line of plain text: no control characters, no runs of space */
export function cleanNote(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const note = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
  return note.length >= 3 && note.length <= NOTE_MAX ? note : null
}

export function createPinReports({
  repo, pujoExists, clock = () => new Date(),
}: {
  repo: PinReportRepository
  pujoExists: (slug: string) => Promise<boolean>
  clock?: () => Date
}) {
  const limit = createRateLimiter({ limit: 6, windowMs: HOUR })

  return {
    async post(request: Request, userId: string | null) {
      if (!userId) return say('Sign in to tell us where the pujo really is.', 401)
      const now = clock()
      const limited = limit(userId, now.getTime())
      if (!limited.ok) return say('That’s plenty for now. Try again in a while.', 429, { 'Retry-After': String(limited.retryAfterSeconds) })

      const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
      const slug = typeof body?.slug === 'string' ? body.slug : ''
      const note = cleanNote(body?.note)
      if (!note) return say('Say where it is in a few words: a street, a landmark, a lane.', 400)
      if (!/^[a-z0-9-]{1,120}$/.test(slug)) return say('That pujo isn’t on our list.', 404)

      try {
        if (!(await pujoExists(slug))) return say('That pujo isn’t on our list.', 404)
        if (await repo.countSince(userId, new Date(now.getTime() - 24 * HOUR)) >= PER_DAY) {
          return say('That’s plenty for today. Thank you.', 429)
        }
        await repo.add({ pandalSlug: slug, userId, note, createdAt: now })
        return say('Thank you. Someone will check it against the map.', 201)
      } catch (error) {
        console.error('[pujo] pin report failed', error)
        return say('That didn’t send. Try again in a moment.', 500)
      }
    },
  }
}
