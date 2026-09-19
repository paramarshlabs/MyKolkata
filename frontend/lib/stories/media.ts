/* ==========================================================================
   What an external story link points at, and how (if at all) to show it.

   Nothing is fetched, downloaded or proxied: every result is either the
   user's own URL (an image shown straight from its host) or an embed URL
   built on a hardcoded provider domain from an ID we have validated. A user
   can never choose what an iframe loads.
   ========================================================================== */

export type StoryMedia =
  | { kind: 'image'; src: string; url: string }
  | { kind: 'drive'; src: string; url: string }
  | { kind: 'instagram'; embedUrl: string; url: string }
  | { kind: 'x'; embedUrl: string; url: string }
  | { kind: 'link'; url: string }

const IMAGE_PATH = /\.(jpe?g|png|gif|webp|avif)$/i
const DRIVE_ID = /^[A-Za-z0-9_-]{10,}$/
const INSTAGRAM_CODE = /^[A-Za-z0-9_-]{5,40}$/
const TWEET_ID = /^\d{5,25}$/

function parse(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null
  } catch {
    return null
  }
}

function hostIs(url: URL, ...domains: string[]) {
  const host = url.hostname.toLowerCase()
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`))
}

/* drive.google.com/file/d/ID/view, /open?id=ID, /uc?id=ID */
function driveFileId(url: URL) {
  if (!hostIs(url, 'drive.google.com', 'docs.google.com')) return null
  const id = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ?? url.searchParams.get('id')
  return id && DRIVE_ID.test(id) ? id : null
}

/* instagram.com/p/CODE, /reel/CODE, /tv/CODE (optionally under a username) */
function instagramPost(url: URL) {
  if (!hostIs(url, 'instagram.com')) return null
  const match = url.pathname.match(/\/(p|reel|tv)\/([^/]+)/)
  return match && INSTAGRAM_CODE.test(match[2]) ? { type: match[1] === 'tv' ? 'p' : match[1], code: match[2] } : null
}

/* x.com/USER/status/ID, twitter.com/USER/status/ID */
function tweetId(url: URL) {
  if (!hostIs(url, 'x.com', 'twitter.com')) return null
  const id = url.pathname.match(/\/status(?:es)?\/(\d+)/)?.[1]
  return id && TWEET_ID.test(id) ? id : null
}

/* The origin each embed reports its size from. */
export const EMBED_ORIGIN = {
  x: 'https://platform.twitter.com',
  instagram: 'https://www.instagram.com',
} as const

/* Embeds tell the page how tall their content is, so the frame can fit it
   instead of scrolling or trailing blank space:
     X:         { "twttr.embed": { method: "twttr.private.resize", params: [{ height }] } }
     Instagram: { type: "MEASURE", details: { height } }
   Either may arrive as an object or a JSON string. Anything else is ignored. */
export function embedHeight(data: unknown): number | null {
  let value = data
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return null
    }
  }
  if (!value || typeof value !== 'object') return null
  const message = value as {
    'twttr.embed'?: { method?: string; params?: Array<{ height?: unknown }> }
    type?: string
    details?: { height?: unknown }
  }
  const raw = message['twttr.embed']?.method === 'twttr.private.resize'
    ? message['twttr.embed'].params?.[0]?.height
    : message.type === 'MEASURE' ? message.details?.height : undefined
  const height = Number(raw)
  /* a real post is somewhere between a line of text and a very long thread */
  return Number.isFinite(height) && height >= 80 && height <= 4000 ? Math.ceil(height) : null
}

export function resolveStoryMedia(value: string | null | undefined): StoryMedia | null {
  if (!value) return null
  const url = parse(value)
  if (!url) return null
  const href = url.toString()

  const drive = driveFileId(url)
  if (drive) {
    /* Google's public thumbnail endpoint: serves the file only if it is shared publicly */
    return { kind: 'drive', src: `https://drive.google.com/thumbnail?id=${drive}&sz=w1600`, url: href }
  }

  const post = instagramPost(url)
  if (post) return { kind: 'instagram', embedUrl: `https://www.instagram.com/${post.type}/${post.code}/embed/`, url: href }

  const tweet = tweetId(url)
  if (tweet) return { kind: 'x', embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${tweet}&theme=dark&dnt=true`, url: href }

  if (IMAGE_PATH.test(url.pathname)) return { kind: 'image', src: href, url: href }

  return { kind: 'link', url: href }
}
