import { extractPageImage, safePublicUrl } from '@/lib/places/anakinImageProvider'
import { eventImage, type NewsFeed } from './events'
import { isBlockedSource, sourceDomain, titleSimilarity } from './sources'

/* ==========================================================================
   An image for a story, in order of trust:
     1. the article's own og:/twitter:image
     2. the article's structured-data image (or the image the search returned)
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

async function imageFromPage(url: string, deps: ImageDeps) {
  const html = await deps.fetchHtml(url)
  const extracted = html ? extractPageImage(html, url) : null
  const image = usableImage(extracted?.imageUrl)
  return image ? { image, kind: extracted!.kind as 'meta' | 'json-ld' } : null
}

export async function resolveStoryImage(
  story: { title: string; link: string; type: NewsFeed; eventSlug?: string | null; searchImage?: string | null },
  deps: ImageDeps,
): Promise<StoryImage> {
  const log = deps.log ?? (() => {})

  const own = await imageFromPage(story.link, deps).catch(() => null)
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
        const found = await imageFromPage(result.url!, deps).catch(() => null)
        if (found) return { image: found.image, imageSource: 'anakin-related-coverage', imageSourceUrl: result.url! }
      }
    } catch (err) {
      log(`image discovery failed for "${story.title}": ${(err as Error).message}`)
    }
  }

  return { image: TRUSTED_FALLBACK_IMAGE[story.type], imageSource: 'fallback', imageSourceUrl: null }
}
