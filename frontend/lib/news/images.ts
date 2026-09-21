import { extractPageImage, safePublicUrl } from '@/lib/places/anakinImageProvider'
import { eventImage, type NewsFeed } from './events'
import { isBlockedSource, sourceDomain, titleSimilarity } from './sources'

/* ==========================================================================
   An image for a story, in order of trust:
     1. the article's own og:/twitter:image
     2. the article's structured-data image, its headline photo (an <img>
        whose alt text is the headline), a CMS featured image, or — if the
        search provider supplies one — the result's image/thumbnail
        (Anakin Search does not; see SearchResultItem)
     3. the event's own artwork
     4. the same story's image on another outlet, found through Anakin
     5. a local Kolkata photograph for the card type
   Only images tied to *this story* reach 1, 2 and 4 — never a keyword match.
   ========================================================================== */

export type StoryImage = { image: string; imageSource: string; imageSourceUrl: string | null }

export type ImageDeps = {
  /* the page's HTML, or null; must not throw */
  fetchHtml: (url: string) => Promise<string | null>
  /* Anakin search results, or [] */
  search?: (prompt: string) => Promise<Array<{ url?: string; title?: string }>>
  log?: (message: string) => void
}

/* site chrome, not a photograph of the story */
const NOT_A_PHOTO = /(logo|favicon|placeholder|default[-_]?(image|img|thumb|og)|sprite|blank|spacer|1x1|pixel|avatar)|\.svg(\?|$)/i

/* Local photographs of the city, used only when nothing better exists: the
   card should still look like Kolkata rather than an empty frame. */
export const TRUSTED_FALLBACK_IMAGE: Record<NewsFeed, string> = {
  CITY: '/hwh.jpg',
  SPORTS: '/maidan.jpg',
}

/* the related-coverage search is paid; keep it to a couple of pages */
const RELATED_PAGES_TO_TRY = 2

export function usableImage(url: string | null | undefined) {
  if (!url) return null
  const parsed = safePublicUrl(url)
  if (!parsed || NOT_A_PHOTO.test(parsed.pathname)) return null
  return parsed.toString()
}

/* decode &#8217; / &apos; etc. so alt text can match the plain headline */
function decodeEntities(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

function imgAttr(tag: string, name: string) {
  return tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']+)["']`, 'i'))?.[1]
}

function absImage(src: string | undefined, pageUrl: string) {
  if (!src) return null
  try {
    return usableImage(new URL(src.replace(/&amp;/g, '&'), pageUrl).toString())
  } catch {
    return null
  }
}

/* Pages without og:image (newsonair.gov.in, many WordPress sites) still show
   the story's photo; it is the <img> captioned with the headline itself. */
export function extractHeadlineImage(html: string, pageUrl: string, title: string) {
  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    const alt = decodeEntities(imgAttr(tag, 'alt') || imgAttr(tag, 'title') || '')
    if (titleSimilarity(alt, title) < HEADLINE_MATCH) continue
    const image = absImage(imgAttr(tag, 'data-src') || imgAttr(tag, 'src'), pageUrl)
    if (image) return image
  }
  return null
}

/* WordPress (and similar CMSes) mark the featured photo even when alt is empty
   or generic — prefer that over falling through to a city landmark. */
const FEATURED_IMG = /\b(wp-post-image|attachment-full|size-full|featured[-_]?image)\b/i

export function extractFeaturedImage(html: string, pageUrl: string) {
  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    const cls = imgAttr(tag, 'class') || ''
    if (!FEATURED_IMG.test(cls)) continue
    const image = absImage(imgAttr(tag, 'data-src') || imgAttr(tag, 'src'), pageUrl)
    if (image) return image
  }
  return null
}

/* how closely an image caption must match the headline to count as its photo */
const HEADLINE_MATCH = 0.8

async function imageFromPage(url: string, title: string, deps: ImageDeps) {
  const html = await deps.fetchHtml(url)
  if (!html) return null
  const extracted = extractPageImage(html, url)
  const image = usableImage(extracted?.imageUrl)
  if (image) return { image, kind: extracted!.kind as 'meta' | 'json-ld' }
  const headline = extractHeadlineImage(html, url, title)
  if (headline) return { image: headline, kind: 'headline' as const }
  const featured = extractFeaturedImage(html, url)
  return featured ? { image: featured, kind: 'headline' as const } : null
}

export async function resolveStoryImage(
  story: { title: string; link: string; type: NewsFeed; eventSlug?: string | null; searchImage?: string | null },
  deps: ImageDeps,
): Promise<StoryImage> {
  const log = deps.log ?? (() => {})

  const own = await imageFromPage(story.link, story.title, deps).catch(() => null)
  if (own) {
    return { image: own.image, imageSource: own.kind === 'meta' ? 'article-og' : 'article', imageSourceUrl: story.link }
  }

  const searchImage = usableImage(story.searchImage)
  if (searchImage) return { image: searchImage, imageSource: 'article', imageSourceUrl: story.link }

  const event = eventImage(story.eventSlug)
  if (event) return { image: event, imageSource: 'event', imageSourceUrl: null }

  if (deps.search) {
    try {
      const ownDomain = sourceDomain(story.link)
      const related = (await deps.search(story.title))
        .filter((result) => {
          const domain = result.url ? sourceDomain(result.url) : null
          /* the same story (headline overlap) on a different, real outlet */
          return domain && domain !== ownDomain && !isBlockedSource(domain)
            && titleSimilarity(result.title || '', story.title) >= 0.6
        })
        .slice(0, RELATED_PAGES_TO_TRY)
      for (const result of related) {
        const found = await imageFromPage(result.url!, story.title, deps).catch(() => null)
        if (found) return { image: found.image, imageSource: 'anakin-related-coverage', imageSourceUrl: result.url! }
      }
    } catch (err) {
      log(`image discovery failed for "${story.title}": ${(err as Error).message}`)
    }
  }

  log(`no usable article image for "${story.title}" (${story.link}); using trusted ${story.type} fallback`)
  return { image: TRUSTED_FALLBACK_IMAGE[story.type], imageSource: 'fallback', imageSourceUrl: null }
}
