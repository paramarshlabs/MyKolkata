import { NextResponse } from 'next/server'
import { safePublicUrl } from '@/lib/places/anakinImageProvider'

/* ==========================================================================
   Ephemeral stories for /contribute: validation, and the GET/POST handlers.
   The handlers take their database and the signed-in user as arguments, so
   app/api/stories/route.ts stays a thin wiring layer and this stays testable.
   ========================================================================== */

export const TITLE_MAX = 120
export const STORY_MAX = 2000
export const URL_MAX = 2048
/* a story lives for a day */
export const STORY_TTL_MS = 24 * 60 * 60 * 1000
/* the feed shows the newest stories; a day of posts rarely needs more */
export const FEED_LIMIT = 100

export type StoryRecord = {
  id: string
  title: string
  story: string
  externalUrl: string | null
  authorId: string | null
  createdAt: Date
  expiresAt: Date
}

export type PublicStory = {
  id: string
  title: string
  story: string
  externalUrl: string | null
  createdAt: string
  expiresAt: string
}

export interface StoryRepository {
  /* only stories with expiresAt > now, newest first */
  listActive(now: Date, take: number): Promise<StoryRecord[]>
  create(data: Omit<StoryRecord, 'id'>): Promise<StoryRecord>
}

type Input = { title: string; story: string; externalUrl: string | null }

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

/* what the page may see: never the author's id */
export function toPublicStory(row: StoryRecord): PublicStory {
  return {
    id: row.id,
    title: row.title,
    story: row.story,
    externalUrl: row.externalUrl,
    createdAt: new Date(row.createdAt).toISOString(),
    expiresAt: new Date(row.expiresAt).toISOString(),
  }
}

const NO_STORE = { 'Cache-Control': 'no-store' }

export function createStoryHandlers(repository: StoryRepository, clock: () => Date = () => new Date()) {
  return {
    async GET() {
      try {
        const now = clock()
        const rows = await repository.listActive(now, FEED_LIMIT)
        /* the query already excludes expired stories; this makes sure of it */
        const stories = rows.filter((row) => new Date(row.expiresAt) > now).map(toPublicStory)
        return NextResponse.json({ stories }, { headers: NO_STORE })
      } catch (err) {
        console.error(err)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500, headers: NO_STORE })
      }
    },

    async POST(request: Request, userId: string | null) {
      if (!userId) return NextResponse.json({ message: 'Sign in to share a story' }, { status: 401, headers: NO_STORE })

      const checked = validateStoryInput(await request.json().catch(() => null))
      if (!checked.ok) return NextResponse.json({ message: checked.message }, { status: 400, headers: NO_STORE })

      try {
        const createdAt = clock()
        const row = await repository.create({
          ...checked.value,
          authorId: userId,
          createdAt,
          expiresAt: new Date(createdAt.getTime() + STORY_TTL_MS),
        })
        return NextResponse.json({ story: toPublicStory(row) }, { status: 201, headers: NO_STORE })
      } catch (err) {
        console.error(err)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500, headers: NO_STORE })
      }
    },
  }
}
