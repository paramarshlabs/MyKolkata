import { NextResponse } from 'next/server'
import { safePublicUrl } from '@/lib/places/anakinImageProvider'
import { createRateLimiter } from '@/lib/rateLimit'
import { HONEYPOT_FIELD, STORY_MAX, TITLE_MAX, URL_MAX } from './limits'

/* ==========================================================================
   Ephemeral stories for /community: validation, and the handlers for the
   wall (GET/POST) and for one story (PATCH/DELETE, its author only).
   The handlers take their database and the signed-in user as arguments, so
   app/api/stories/route.ts stays a thin wiring layer and this stays testable.
   ========================================================================== */

export { HONEYPOT_FIELD, STORY_MAX, TITLE_MAX, URL_MAX }

/* a story lives for a day */
export const STORY_TTL_MS = 24 * 60 * 60 * 1000
/* the feed shows the newest stories; a day of posts rarely needs more */
export const FEED_LIMIT = 100
/* spam limits: new stories per author per hour (counted in the database, so
   it holds across server instances), and edits per author per hour */
export const POSTS_PER_HOUR = 5
export const EDITS_PER_HOUR = 30
const HOUR_MS = 60 * 60 * 1000

export type StoryRecord = {
  id: string
  title: string
  story: string
  externalUrl: string | null
  authorId: string | null
  createdAt: Date
  expiresAt: Date
  /* set by an edit; createdAt and expiresAt never move, so the day runs from the first post */
  editedAt?: Date | null
}

export type PublicStory = {
  id: string
  title: string
  story: string
  externalUrl: string | null
  createdAt: string
  expiresAt: string
  editedAt: string | null
  /* the viewer wrote it, so the page offers edit and delete */
  mine: boolean
}

export interface StoryRepository {
  /* only stories with expiresAt > now, newest first */
  listActive(now: Date, take: number): Promise<StoryRecord[]>
  create(data: Omit<StoryRecord, 'id'>): Promise<StoryRecord>
  /* the author's stories posted since `since`, for the hourly cap and the repeat check */
  recentByAuthor(authorId: string, since: Date): Promise<Pick<StoryRecord, 'title' | 'story' | 'createdAt'>[]>
  /* the author's own story, still live: null when there is no such story */
  updateOwn(id: string, authorId: string, now: Date, data: Input & { editedAt: Date }): Promise<StoryRecord | null>
  /* the author's own story: false when there is no such story */
  deleteOwn(id: string, authorId: string): Promise<boolean>
}

export type Input = { title: string; story: string; externalUrl: string | null }

/* collapse runs of spaces, keep paragraph breaks, trim */
function cleanText(value: unknown) {
  return typeof value === 'string'
    ? value.replace(/\r\n?/g, '\n').replace(/[^\S\n]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
    : ''
}

export function validateStoryInput(body: unknown): { ok: true; value: Input } | { ok: false; message: string } {
  const input = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const title = cleanText(input.title)
  const story = cleanText(input.story)
  const link = typeof input.link === 'string' ? input.link.trim() : ''

  if (!title) return { ok: false, message: 'Give your story a title.' }
  if (title.length > TITLE_MAX) return { ok: false, message: `Keep the title under ${TITLE_MAX} characters.` }
  if (!story) return { ok: false, message: 'Write a few words of your story.' }
  if (story.length > STORY_MAX) return { ok: false, message: `Keep the story under ${STORY_MAX} characters.` }

  let externalUrl: string | null = null
  if (link) {
    const url = link.length <= URL_MAX ? safePublicUrl(link) : null
    /* http(s) only, a public host, and no user:password@ tricks */
    if (!url || url.username || url.password) return { ok: false, message: 'That link doesn’t look right. Use a full https:// address.' }
    externalUrl = url.toString()
  }
  return { ok: true, value: { title, story, externalUrl } }
}

/* what the page may see: never the author's id, only whether the viewer is the author */
export function toPublicStory(row: StoryRecord, viewerId: string | null = null): PublicStory {
  return {
    id: row.id,
    title: row.title,
    story: row.story,
    externalUrl: row.externalUrl,
    createdAt: new Date(row.createdAt).toISOString(),
    expiresAt: new Date(row.expiresAt).toISOString(),
    editedAt: row.editedAt ? new Date(row.editedAt).toISOString() : null,
    mine: Boolean(viewerId && row.authorId === viewerId),
  }
}

const NO_STORE = { 'Cache-Control': 'no-store' }

const serverError = (err: unknown) => {
  console.error(err)
  return NextResponse.json({ message: 'Internal server error' }, { status: 500, headers: NO_STORE })
}

/* the honeypot (CommunityClient's hidden "website" input) */
const trippedHoneypot = (body: unknown) => {
  const value = body && typeof body === 'object' ? (body as Record<string, unknown>)[HONEYPOT_FIELD] : null
  return typeof value === 'string' && value.trim() !== ''
}

const tooMany = (message: string, retryAfterSeconds: number) => NextResponse.json(
  { message },
  { status: 429, headers: { ...NO_STORE, 'Retry-After': String(retryAfterSeconds) } },
)

export function createStoryHandlers(repository: StoryRepository, clock: () => Date = () => new Date()) {
  const editLimit = createRateLimiter({ limit: EDITS_PER_HOUR, windowMs: HOUR_MS })

  return {
    async GET(viewerId: string | null = null) {
      try {
        const now = clock()
        const rows = await repository.listActive(now, FEED_LIMIT)
        /* the query already excludes expired stories; this makes sure of it */
        const stories = rows.filter((row) => new Date(row.expiresAt) > now).map((row) => toPublicStory(row, viewerId))
        return NextResponse.json({ stories }, { headers: NO_STORE })
      } catch (err) {
        return serverError(err)
      }
    },

    async POST(request: Request, userId: string | null) {
      if (!userId) return NextResponse.json({ message: 'Sign in to share a story' }, { status: 401, headers: NO_STORE })

      const body = await request.json().catch(() => null)
      if (trippedHoneypot(body)) return NextResponse.json({ message: 'Your story didn’t post. Try again.' }, { status: 400, headers: NO_STORE })
      const checked = validateStoryInput(body)
      if (!checked.ok) return NextResponse.json({ message: checked.message }, { status: 400, headers: NO_STORE })

      try {
        const createdAt = clock()
        const recent = await repository.recentByAuthor(userId, new Date(createdAt.getTime() - STORY_TTL_MS))
        const lastHour = recent.filter((row) => createdAt.getTime() - new Date(row.createdAt).getTime() < HOUR_MS)
        if (lastHour.length >= POSTS_PER_HOUR) {
          const oldest = Math.min(...lastHour.map((row) => new Date(row.createdAt).getTime()))
          return tooMany(
            `That’s ${POSTS_PER_HOUR} stories in an hour. Give the wall a little time, then post again.`,
            Math.max(1, Math.ceil((oldest + HOUR_MS - createdAt.getTime()) / 1000)),
          )
        }
        if (recent.some((row) => row.title === checked.value.title && row.story === checked.value.story)) {
          return NextResponse.json({ message: 'You’ve already posted this story today.' }, { status: 409, headers: NO_STORE })
        }
        const row = await repository.create({
          ...checked.value,
          authorId: userId,
          createdAt,
          expiresAt: new Date(createdAt.getTime() + STORY_TTL_MS),
        })
        return NextResponse.json({ story: toPublicStory(row, userId) }, { status: 201, headers: NO_STORE })
      } catch (err) {
        return serverError(err)
      }
    },

    /* an edit replaces the words and the link; the story still leaves 24 hours after it was first posted */
    async PATCH(request: Request, userId: string | null, id: string) {
      if (!userId) return NextResponse.json({ message: 'Sign in to edit your story' }, { status: 401, headers: NO_STORE })
      const limited = editLimit(userId, clock().getTime())
      if (!limited.ok) return tooMany('That’s a lot of edits. Try again in a little while.', limited.retryAfterSeconds)

      const checked = validateStoryInput(await request.json().catch(() => null))
      if (!checked.ok) return NextResponse.json({ message: checked.message }, { status: 400, headers: NO_STORE })

      try {
        const now = clock()
        const row = await repository.updateOwn(id, userId, now, { ...checked.value, editedAt: now })
        /* someone else's story, a gone one and an expired one all look the same from outside */
        if (!row) return NextResponse.json({ message: 'That story is gone, or it isn’t yours to edit.' }, { status: 404, headers: NO_STORE })
        return NextResponse.json({ story: toPublicStory(row, userId) }, { headers: NO_STORE })
      } catch (err) {
        return serverError(err)
      }
    },

    async DELETE(userId: string | null, id: string) {
      if (!userId) return NextResponse.json({ message: 'Sign in to delete your story' }, { status: 401, headers: NO_STORE })

      try {
        const deleted = await repository.deleteOwn(id, userId)
        if (!deleted) return NextResponse.json({ message: 'That story is gone, or it isn’t yours to delete.' }, { status: 404, headers: NO_STORE })
        return new NextResponse(null, { status: 204, headers: NO_STORE })
      } catch (err) {
        return serverError(err)
      }
    },
  }
}
