import type { Feed } from './refresh'
import { clip, eachObject, isoOf, isUnfit, str } from './shape'

/* ==========================================================================
   Adda: what r/kolkata talked about most this week, from Reddit through
   Anakin Wire (rt_subreddit_posts, top of the week). Titles only, each one
   linking to its thread; /home sets them beside the stories people posted
   on My Kolkata today. NSFW and stickied posts never make it in, and nor do
   explicit titles, whatever the source says about them.
   ========================================================================== */

export type Thread = { id: string; title: string; url: string; flair: string | null; at: string | null }
export type Adda = { subreddit: string; threads: Thread[] }

export const SUBREDDIT = 'kolkata'

const POST_ID = /^[a-z0-9]{4,12}$/i
const TRUE = new Set([true, 'true', 1, '1'])
const flagged = (item: Record<string, unknown>, ...keys: string[]) => keys.some((key) => TRUE.has(item[key] as never))

/* the thread itself, never the article or image a link post points at, and
   only in this subreddit (a crosspost nests its original from elsewhere) */
function threadUrl(item: Record<string, unknown>, id: string | null, subreddit: string) {
  const inSub = new RegExp(`^/r/${subreddit}/comments/[a-z0-9]+`, 'i')
  const link = item.link
  const candidates = [
    str(item, 'permalink'),
    typeof link === 'string' ? link : link && typeof link === 'object' ? str(link, 'href', 'url') : null,
    str(item, 'url', 'comments_url', 'commentsUrl'),
  ]
  let elsewhere = false
  for (const candidate of candidates) {
    if (!candidate) continue
    try {
      const url = new URL(candidate, 'https://www.reddit.com')
      if (!/(^|\.)reddit\.com$/.test(url.hostname) || !/\/comments\//.test(url.pathname)) continue
      if (inSub.test(url.pathname)) return `https://www.reddit.com${url.pathname}`
      elsewhere = true
    } catch {
      /* not a URL; try the next */
    }
  }
  return id && !elsewhere ? `https://www.reddit.com/r/${subreddit}/comments/${id}/` : null
}

export function normalizeAdda(raw: unknown, subreddit = SUBREDDIT, max = 8): Thread[] {
  const out: Thread[] = []
  const seen = new Set<string>()
  eachObject(raw, (item) => {
    if (out.length >= max) return
    const title = str(item, 'title')
    if (!title || title.length < 8 || /^\[(removed|deleted)\]$/i.test(title)) return
    const rawId = str(item, 'id', 'post_id', 'postId', 'name')
    const id = rawId ? rawId.replace(/^t3_/, '') : null
    const url = threadUrl(item, id && POST_ID.test(id) ? id : null, subreddit)
    /* a post is something with a title that lives at a thread; anything else is page furniture */
    if (!url) return
    const key = url.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)

    if (flagged(item, 'over_18', 'over18', 'nsfw', 'is_nsfw', 'isNsfw', 'stickied', 'pinned', 'is_pinned', 'isPinned', 'isStickied', 'spoiler')) return
    const flair = clip(str(item, 'link_flair_text', 'flair', 'flair_text', 'linkFlairText'), 30)
    if (isUnfit(title) || isUnfit(flair)) return

    out.push({
      id: url.match(/\/comments\/([a-z0-9]+)/i)?.[1] ?? key,
      title: clip(title, 140)!,
      url,
      flair,
      at: isoOf(item.created_utc ?? item.created ?? item.published ?? item.created_at ?? item.createdAt),
    })
  })
  return out
}

export const addaFeed: Feed<Adda> = {
  key: 'adda',
  ttlMs: 3 * 3_600_000,
  async fetch({ wire }) {
    const threads = normalizeAdda(await wire('rt_subreddit_posts', { subreddit: SUBREDDIT, sort: 'top', time: 'week', limit: 25 }))
    return threads.length ? { subreddit: SUBREDDIT, threads } : null
  },
}
