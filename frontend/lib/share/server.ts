import 'server-only'
import { cached } from '@/lib/cache'
import { mapHref, presentLivePlace } from '@/lib/livePlaces'
import { placeSearchService } from '@/lib/places/runtime'
import { loadPujoIndex } from '@/lib/pujo/pandals'
import type { InstagramPost } from './instagram'
import { createShareResolver, type Resolution } from './resolve'

/* Instagram gives a link preview the caption; a browser gets a login wall */
const PREVIEW_AGENT = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
const FETCH_TIMEOUT_MS = 5000
/* the caption is a few KB in; the rest of the page is 700 KB of script */
const MAX_HTML = 200_000
/* a post's caption doesn't change much, and a pandal doesn't move */
const RESOLVED_TTL_MS = 6 * 60 * 60 * 1000

async function fetchPostHtml(post: InstagramPost): Promise<string | null> {
  const response = await fetch(post.url, {
    headers: { 'user-agent': PREVIEW_AGENT, 'accept-language': 'en' },
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: 'no-store',
  })
  if (!response.ok || !response.body) return null

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let html = ''
  while (html.length < MAX_HTML) {
    const { done, value } = await reader.read()
    if (done) break
    html += decoder.decode(value, { stream: true })
    if (/<meta[^>]+og:description"[^>]*>/.test(html) || html.includes('</head>')) break
  }
  reader.cancel().catch(() => {})
  return html
}

const resolver = createShareResolver({
  fetchPostHtml,
  pujos: async () => (await loadPujoIndex()).pujos,
  /* with the id the map gives the same place (?select= picks it out) */
  searchPlaces: async (query) => {
    const { places } = await placeSearchService.search({ query, category: undefined, lat: undefined, lng: undefined, limit: 5 })
    return places.map((place: Parameters<typeof presentLivePlace>[0]) => ({ id: presentLivePlace(place).id, name: place.name }))
  },
  placeHref: (query, place) => mapHref({ query, select: place.id }),
})

/* Shared by everyone who shares the same post. A post Instagram wouldn't
   describe isn't kept, so the next share tries again. */
export function resolveSharedPost(post: InstagramPost, shared: { text?: string | null; title?: string | null }): Promise<Resolution> {
  return cached(`share:ig:${post.code}`, RESOLVED_TTL_MS, async () => {
    const result = await resolver(post, shared)
    if (result.kind === 'none') throw Object.assign(new Error('unplaced'), { result })
    return result
  }, { shared: true }).catch((error: { result?: Resolution }) => error.result ?? { kind: 'none', guesses: [] })
}
