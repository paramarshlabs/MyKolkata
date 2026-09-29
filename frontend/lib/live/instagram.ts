import { resolveStoryMedia } from '@/lib/stories/media'
import type { Feed } from './refresh'
import { clip, isObj, isoOf, isUnfit, str } from './shape'

/* ==========================================================================
   Kolkata on Instagram, by the official route only: the Instagram Graph
   API's hashtag search (ig_hashtag_search, then the hashtag's top media).
   Instagram is not in Anakin Wire, and scraping it is off the table.

   It needs a Meta app approved for Instagram Public Content Access, an
   Instagram professional account's id and a token for it, so the feed is
   off until INSTAGRAM_USER_ID and INSTAGRAM_GRAPH_TOKEN are set. Each
   hashtag counts against the account's 30 a week, so its id is looked up
   once and carried forward. Posts are shown as Instagram's own embeds
   (lib/stories/media.ts), never copied.
   ========================================================================== */

export type Gram = { permalink: string; caption: string | null; at: string | null }
export type Instagram = { hashtag: string; hashtagId: string | null; posts: Gram[] }

export const HASHTAG = 'kolkata'
const GRAPH = 'https://graph.facebook.com/v23.0'

export function instagramConfig(env: Record<string, string | undefined> = process.env) {
  const user = env.INSTAGRAM_USER_ID?.trim()
  const token = env.INSTAGRAM_GRAPH_TOKEN?.trim()
  return user && token && /^\d+$/.test(user) ? { user, token } : null
}

/* the Graph API's { data: [{ id, caption, permalink, timestamp }] }, as embeddable posts */
export function normalizeGrams(raw: unknown, max = 3): Gram[] {
  const list = isObj(raw) && Array.isArray(raw.data) ? raw.data.filter(isObj) : []
  const out: Gram[] = []
  for (const item of list) {
    if (out.length >= max) break
    const media = resolveStoryMedia(str(item, 'permalink'))
    const caption = str(item, 'caption')
    if (media?.kind !== 'instagram' || isUnfit(caption)) continue
    out.push({ permalink: media.url, caption: clip(caption, 140), at: isoOf(item.timestamp) })
  }
  return out
}

export function createInstagramFeed({ user, token }: { user: string; token: string }, fetchImpl: typeof fetch = globalThis.fetch): Feed<Instagram> {
  async function graph(path: string, params: Record<string, string>) {
    const url = new URL(`${GRAPH}/${path}`)
    for (const [key, value] of Object.entries({ ...params, access_token: token })) url.searchParams.set(key, value)
    const response = await fetchImpl(url, { headers: { Accept: 'application/json' } })
    const body: unknown = await response.json().catch(() => null)
    const code = isObj(body) && isObj(body.error) ? str(body.error, 'code') : null
    /* never the URL: it carries the token */
    if (!response.ok) throw new Error(`Instagram Graph request failed (${response.status}${code ? ` ${code}` : ''})`)
    return body
  }

  return {
    key: 'instagram',
    ttlMs: 12 * 3_600_000,
    async fetch({ last }) {
      const previous = (isObj(last) ? last : {}) as Partial<Instagram>
      let hashtagId = previous.hashtag === HASHTAG ? previous.hashtagId ?? null : null
      if (!hashtagId) {
        const found = await graph('ig_hashtag_search', { user_id: user, q: HASHTAG })
        const first = isObj(found) && Array.isArray(found.data) && isObj(found.data[0]) ? found.data[0] : null
        hashtagId = first ? str(first, 'id') : null
      }
      if (!hashtagId || !/^\d+$/.test(hashtagId)) return null
      const posts = normalizeGrams(await graph(`${hashtagId}/top_media`, {
        user_id: user, fields: 'id,caption,media_type,permalink,timestamp', limit: '25',
      }))
      return posts.length ? { hashtag: HASHTAG, hashtagId, posts } : null
    },
  }
}
