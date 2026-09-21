import { safePublicUrl } from '@/lib/places/anakinImageProvider'
import { activeEvents, detectEvent, kolkataDay, type ActiveEvent, type NewsFeed } from './events'
import { resolveStoryImage } from './images'
import { buildNewsQueries } from './queries'
import { baseScore, featureStamp, isHoldingCard, MAX_AGE_HOURS, rankStory, selectHomeStory } from './ranking'
import { assessStory } from './relevance'
import type { NewsRecord, NewsRepository, NewsWrite } from './repository'
import {
  canonicalUrl, contentHash, isBlockedSource, normalizeTitle, sourceDomain, sourceName, sourceTier,
  SOURCE_QUALITY, titleKey,
} from './sources'

/* ==========================================================================
   ingestKolkataNews(): Anakin → candidates → PostgreSQL, then rotate the
   Home cards. Runs from the cron route only; the Home page never calls it.
   Idempotent: every story is matched to an existing row before it is written.
   ========================================================================== */

const HOUR_MS = 3_600_000
const FEEDS: NewsFeed[] = ['CITY', 'SPORTS']

/* results asked of Anakin per query */
const RESULTS_PER_QUERY = 8
/* parallel Anakin calls — polite to the API, quick enough for one cron run */
const CONCURRENCY = 4
/* Only the best new stories per feed are stored; lower ones would never
   reach the card, and each costs an article fetch for its image. */
const MAX_NEW_STORIES_PER_FEED = 12
/* the paid related-coverage image search is spent on the top few only */
const RELATED_IMAGE_SEARCHES_PER_FEED = 3
/* stored stories re-checked per run (dates, images, current rules) */
const MAX_STORED_TO_RECHECK = 40
/* card description length, in characters */
const DESCRIPTION_LENGTH = 180

export type SearchResult = {
  url?: string
  title?: string
  snippet?: string
  description?: string
  date?: string
  published_date?: string
  publishedAt?: string
  age?: string
  image?: string
  thumbnail?: string
}

export type NewsSearchClient = {
  hasApiKey: boolean
  search: (prompt: string, options?: { limit?: number; timeoutMs?: number }) => Promise<SearchResult[]>
  scrapeHtml?: (url: string, options?: { timeoutMs?: number }) => Promise<string | null>
}

export type IngestOptions = {
  repository: NewsRepository
  anakin: NewsSearchClient | null
  /* direct article fetch; defaults to fetchArticleHtml (with Anakin scrape as a fallback) */
  fetchHtml?: (url: string) => Promise<string | null>
  now?: Date
  log?: (message: string) => void
}

export type IngestSummary = {
  date: string
  events: Array<{ slug: string; phase: string | null }>
  queries: number
  results: number
  accepted: number
  rejected: number
  duplicates: number
  created: number
  updated: number
  deactivated: number
  retired: number
  searchFailures: number
  selected: Record<NewsFeed, { id: string; title: string } | null>
}

type Candidate = NewsWrite & {
  title: string
  link: string
  type: NewsFeed
  searchImage: string | null
}

/* ---------- small helpers ------------------------------------------------ */

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await fn(items[index])
    }
  }))
  return results
}

function parseDate(value: string | undefined, now: Date) {
  if (!value) return null
  const relative = String(value).match(/(\d+)\s*(minute|min|hour|hr|day|week)s?\s+ago/i)
  if (relative) {
    const unit = relative[2].toLowerCase()
    const hours = unit.startsWith('min') ? 1 / 60 : unit.startsWith('h') ? 1 : unit === 'day' ? 24 : 168
    return new Date(now.getTime() - Number(relative[1]) * hours * HOUR_MS)
  }
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

const PUBLISHED_META = ['article:published_time', 'og:published_time', 'datepublished', 'pubdate', 'publishdate', 'publish-date', 'date']

/* the article's own publish date, from its meta tags or JSON-LD */
export function extractPublishedAt(html: string) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const key = (tag.match(/\b(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i)?.[1] || '').toLowerCase()
    const content = tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1]
    if (content && PUBLISHED_META.includes(key)) {
      const date = new Date(content)
      if (Number.isFinite(date.getTime())) return date
    }
  }
  const candidates = [
    html.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1],
    html.match(/<time\b[^>]*\bdatetime\s*=\s*["']([^"']+)["']/i)?.[1],
    /* last resort, a date printed on the page: "March 14, 2026 9:10 AM", "14 March 2026" */
    html.match(new RegExp(`\\b(${MONTHS})\\s+\\d{1,2},?\\s+20\\d{2}(\\s+\\d{1,2}:\\d{2}\\s*[AP]M)?`, 'i'))?.[0],
    html.match(new RegExp(`\\b\\d{1,2}\\s+(${MONTHS}),?\\s+20\\d{2}`, 'i'))?.[0],
  ]
  for (const value of candidates) {
    const date = value ? new Date(value.replace(/,/g, '')) : null
    if (date && Number.isFinite(date.getTime())) return date
  }
  return null
}

const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December'

/* "Headline | The Telegraph" → "Headline" */
function cleanTitle(title: string, publication: string) {
  let clean = title.replace(/\s+/g, ' ').trim().replace(/\s+\|\s+[^|]{2,60}$/, '')
  const suffix = ` - ${publication}`
  if (clean.toLowerCase().endsWith(suffix.toLowerCase())) clean = clean.slice(0, -suffix.length)
  return clean.trim()
}

function shorten(text: string, length = DESCRIPTION_LENGTH) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= length) return clean
  return `${clean.slice(0, length).replace(/\s+\S*$/, '')}…`
}

/* an article from a year before this one is not today's news */
function isOldArticleUrl(url: string, now: Date) {
  const year = url.match(/\/(20\d{2})\/(?:\d{1,2}\/)?/)?.[1]
  return Boolean(year && Number(year) < kolkataDay(now).year)
}

/* Real browser UA: several Indian news/gov hosts (and ticket sites) soft-block
   unidentified bots. 20s: ddnews.gov.in and similar often exceed 8s from cloud IPs. */
const ARTICLE_FETCH_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const ARTICLE_FETCH_MS = 20_000

function looksLikeHtml(contentType: string | null, body: string) {
  if ((contentType || '').includes('html')) return true
  if (contentType && !/^(text\/plain|application\/octet-stream)\b/i.test(contentType)) return false
  return /<html[\s>]|<head[\s>]|<meta\s|<img\s/i.test(body.slice(0, 4000))
}

export async function fetchArticleHtml(url: string, anakin?: NewsSearchClient | null) {
  if (!safePublicUrl(url)) return null
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ARTICLE_FETCH_MS)
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': ARTICLE_FETCH_UA,
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
      redirect: 'follow',
      signal: controller.signal,
    })
    if (response.ok) {
      const body = (await response.text()).slice(0, 1_500_000)
      if (looksLikeHtml(response.headers.get('content-type'), body)) return body
    }
  } catch {
    /* fall through to Anakin */
  } finally {
    clearTimeout(timeout)
  }
  if (!anakin?.scrapeHtml) return null
  return anakin.scrapeHtml(url, { timeoutMs: 60000 }).catch(() => null)
}

/* How often ingestion should run: daily, or every six hours while an event is
   on. The cron route may fire more often; it skips runs that are not due. The
   hour of slack stops a daily cron from skipping itself by a few seconds. */
export function ingestionDue(lastRun: Date | null, events: ActiveEvent[], now: Date) {
  if (!lastRun) return true
  const intervalHours = events.length ? 6 : 24
  return now.getTime() - lastRun.getTime() >= (intervalHours - 1) * HOUR_MS
}

/* ---------- candidates ---------------------------------------------------- */

function toCandidate(result: SearchResult, events: ActiveEvent[], now: Date):
  { candidate: Candidate } | { rejected: string } {
  const link = result.url && safePublicUrl(result.url)?.toString()
  if (!link) return { rejected: 'invalid url' }
  const domain = sourceDomain(link)
  if (!domain || isBlockedSource(domain)) return { rejected: `blocked source ${domain}` }
  if (isOldArticleUrl(link, now)) return { rejected: 'old article' }

  const publication = sourceName(domain)
  const title = cleanTitle(result.title || '', publication)
  const snippet = result.snippet || result.description || ''
  const assessment = assessStory({ title, description: snippet, url: link }, now)
  if (!assessment.accepted) return { rejected: assessment.reason }

  const publishedAt = parseDate(result.date || result.published_date || result.publishedAt || result.age, now)
  if (publishedAt && now.getTime() - publishedAt.getTime() > MAX_AGE_HOURS * HOUR_MS) return { rejected: 'too old' }

  const { eventSlug, eventPhase } = detectEvent(`${title} ${snippet}`, events)
  return {
    candidate: {
      title,
      description: snippet ? shorten(snippet) : null,
      link,
      canonicalUrl: canonicalUrl(link),
      titleKey: titleKey(title, domain),
      contentHash: contentHash(title, snippet),
      sourceName: sourceName(domain, publication),
      sourceDomain: domain,
      publishedAt,
      type: assessment.type,
      category: assessment.category,
      eventSlug,
      eventPhase,
      score: baseScore({
        relevance: assessment.relevance,
        sourceQuality: SOURCE_QUALITY[sourceTier(domain)],
        importance: assessment.importance,
        category: assessment.category,
      }),
      searchImage: result.image || result.thumbnail || null,
    },
  }
}

/* Collapse repeats within one run. Keys, in order: canonical URL, headline +
   source, content hash — and the bare headline across sources, keeping the
   better-scored copy (the same wire story syndicated by two outlets). */
function dedupeBatch(candidates: Candidate[]) {
  const kept: Candidate[] = []
  const byKey = new Map<string, number>()
  let duplicates = 0
  for (const candidate of candidates) {
    const keys = [candidate.canonicalUrl, candidate.titleKey, candidate.contentHash, `title::${normalizeTitle(candidate.title)}`]
      .filter(Boolean) as string[]
    const existing = keys.map((key) => byKey.get(key)).find((index) => index !== undefined)
    if (existing === undefined) {
      keys.forEach((key) => byKey.set(key, kept.length))
      kept.push(candidate)
      continue
    }
    duplicates++
    if ((candidate.score ?? 0) > (kept[existing].score ?? 0)) kept[existing] = candidate
    keys.forEach((key) => byKey.set(key, existing))
  }
  return { kept, duplicates }
}

/* ---------- the run ------------------------------------------------------- */

export async function ingestKolkataNews({ repository, anakin, fetchHtml, now = new Date(), log = console.log }: IngestOptions): Promise<IngestSummary> {
  const day = kolkataDay(now)
  const events = activeEvents(now)
  const summary: IngestSummary = {
    date: day.iso,
    events: events.map(({ slug, phase }) => ({ slug, phase })),
    queries: 0, results: 0, accepted: 0, rejected: 0, duplicates: 0,
    created: 0, updated: 0, deactivated: 0, retired: 0, searchFailures: 0,
    selected: { CITY: null, SPORTS: null },
  }
  log(`[news] ingest ${day.iso} — active events: ${events.map((event) => `${event.slug}${event.phase ? `/${event.phase}` : ''}`).join(', ') || 'none'}`)

  /* 1–5: search both feeds */
  const raw: SearchResult[] = []
  if (!anakin?.hasApiKey) {
    log('[news] Anakin is not configured (ANAKIN_API_KEY); keeping persisted stories')
  } else {
    const queries = FEEDS.flatMap((feed) => buildNewsQueries(feed, events))
    summary.queries = queries.length
    await mapLimit(queries, CONCURRENCY, async (query) => {
      try {
        const results = await anakin.search(query, { limit: RESULTS_PER_QUERY, timeoutMs: 30000 })
        log(`[news] query "${query}" → ${results.length} results`)
        raw.push(...results)
      } catch (err) {
        summary.searchFailures++
        log(`[news] query "${query}" failed: ${(err as Error).message}`)
      }
    })
  }
  summary.results = raw.length

  /* 6–7, 10–11: extract, validate, classify, score */
  const accepted: Candidate[] = []
  for (const result of raw) {
    const outcome = toCandidate(result, events, now)
    if ('candidate' in outcome) accepted.push(outcome.candidate)
    else {
      summary.rejected++
      log(`[news] rejected "${result.title || result.url}": ${outcome.rejected}`)
    }
  }

  /* 9: deduplicate within the run */
  const { kept, duplicates } = dedupeBatch(accepted)
  summary.duplicates += duplicates
  summary.accepted = kept.length

  /* best first per feed, by the same ranking the cards use */
  const pages = new Map<string, Promise<string | null>>()
  const getHtml = (url: string) => {
    if (!pages.has(url)) pages.set(url, (fetchHtml ?? ((target) => fetchArticleHtml(target, anakin)))(url).catch(() => null))
    return pages.get(url)!
  }

  for (const feed of FEEDS) {
    const ranked = kept
      .filter((candidate) => candidate.type === feed)
      .map((candidate) => ({
        candidate,
        rank: rankStory({ id: candidate.link, ...candidate, discoveredAt: now }, { now, events }).total,
      }))
      .sort((left, right) => right.rank - left.rank)
      .slice(0, MAX_NEW_STORIES_PER_FEED)

    /* 8, 12: images for new stories, then persist */
    await mapLimit(ranked.map((entry, index) => ({ ...entry, index })), CONCURRENCY, async ({ candidate, index }) => {
      const { searchImage, ...story } = candidate
      try {
        const existing = await repository.findDuplicate(story)
        if (existing) {
          summary.duplicates++
          await repository.update(existing.id, refreshExisting(existing, story, now))
          summary.updated++
          log(`[news] duplicate of ${existing.id}: "${story.title}"`)
          return
        }

        const image = await resolveStoryImage(
          { title: story.title, link: story.link, type: feed, eventSlug: story.eventSlug, searchImage },
          {
            fetchHtml: getHtml,
            search: index < RELATED_IMAGE_SEARCHES_PER_FEED && anakin?.hasApiKey
              ? (prompt) => anakin.search(prompt, { limit: 5, timeoutMs: 20000 })
              : undefined,
            log: (message) => log(`[news] ${message}`),
          },
        )
        log(`[news] image ${image.imageSource === 'fallback' ? 'not found (fallback)' : `found (${image.imageSource})`} for "${story.title}"`)

        if (!story.publishedAt) {
          const html = await getHtml(story.link)
          story.publishedAt = html ? extractPublishedAt(html) : null
          if (story.publishedAt && now.getTime() - story.publishedAt.getTime() > MAX_AGE_HOURS * HOUR_MS) {
            summary.rejected++
            log(`[news] rejected "${story.title}": too old (${story.publishedAt.toISOString()})`)
            return
          }
        }

        const storyTime = (story.publishedAt ?? now).getTime()
        await repository.create({
          ...story,
          ...image,
          discoveredAt: now,
          lastSeenAt: now,
          isActive: true,
          expiresAt: new Date(storyTime + MAX_AGE_HOURS * HOUR_MS),
        })
        summary.created++
        log(`[news] stored ${feed} "${story.title}" (${story.sourceDomain}, score ${story.score})`)
      } catch (err) {
        /* a unique-key race with a concurrent run is a duplicate, not a failure */
        if ((err as { code?: string }).code === 'P2002') {
          summary.duplicates++
          return
        }
        log(`[news] could not store "${story.title}": ${(err as Error).message}`)
      }
    })
  }

  /* 13a: re-check what is already stored. Rules improve and pages change: a
     story that no longer passes is retired, a missing publish date is looked
     up (and a months-old story retired), a missing image is retried. */
  try {
    const stored = (await repository.listRecent(FEEDS, new Date(now.getTime() - MAX_AGE_HOURS * HOUR_MS)))
      .filter((row) => row.sourceDomain && row.link && row.discoveredAt.getTime() !== now.getTime())
      .slice(0, MAX_STORED_TO_RECHECK)
    await mapLimit(stored, CONCURRENCY, async (row) => {
      const verdict = assessStory({ title: row.title, description: row.description, url: row.link! }, now)
      if (!verdict.accepted || verdict.type !== row.type) {
        await repository.update(row.id, { isActive: false })
        summary.retired++
        log(`[news] retired "${row.title}": ${verdict.accepted ? `now ${verdict.type}` : verdict.reason}`)
        return
      }
      const data: NewsWrite = {}
      if (!row.publishedAt) {
        const html = await getHtml(row.link!)
        const publishedAt = html ? extractPublishedAt(html) : null
        if (publishedAt && now.getTime() - publishedAt.getTime() > MAX_AGE_HOURS * HOUR_MS) {
          await repository.update(row.id, { isActive: false, publishedAt })
          summary.retired++
          log(`[news] retired "${row.title}": published ${publishedAt.toISOString()}`)
          return
        }
        if (publishedAt) {
          data.publishedAt = publishedAt
          data.expiresAt = new Date(publishedAt.getTime() + MAX_AGE_HOURS * HOUR_MS)
        }
      }
      if (row.imageSource === 'fallback' || !row.image) {
        /* Recheck with related-coverage search: Anakin Search never returns
           image/thumbnail fields, so when the own page is unreachable the only
           recovery is another outlet's HTML (or a successful direct fetch). */
        const image = await resolveStoryImage(
          { title: row.title, link: row.link!, type: row.type as NewsFeed, eventSlug: row.eventSlug },
          {
            fetchHtml: getHtml,
            search: anakin?.hasApiKey
              ? (prompt) => anakin.search(prompt, { limit: 5, timeoutMs: 20000 })
              : undefined,
            log: (message) => log(`[news] ${message}`),
          },
        )
        if (image.imageSource !== 'fallback') {
          Object.assign(data, image)
          log(`[news] image found (${image.imageSource}) for stored "${row.title}"`)
        }
      }
      if (Object.keys(data).length) await repository.update(row.id, data)
    })
    if (summary.retired) log(`[news] retired ${summary.retired} stored stories`)
  } catch (err) {
    log(`[news] could not re-check stored stories: ${(err as Error).message}`)
  }

  /* 13b: retire expired stories */
  try {
    summary.deactivated = await repository.deactivateExpired(now)
    if (summary.deactivated) log(`[news] deactivated ${summary.deactivated} expired stories`)
  } catch (err) {
    log(`[news] could not deactivate expired stories: ${(err as Error).message}`)
  }

  /* 14: rotate the cards — runs even when Anakin failed, so persisted stories still take turns */
  for (const feed of FEEDS) {
    summary.selected[feed] = await rotateHomeCard(repository, feed, now, events, log)
  }

  log(`[news] done: ${summary.queries} queries, ${summary.results} results, ${summary.accepted} accepted, ${summary.rejected} rejected, ${summary.duplicates} duplicates, ${summary.created} new`)
  return summary
}

/* A story seen again keeps its history (discoveredAt, featuredAt, cooldown);
   only facts that were missing are filled in. */
function refreshExisting(existing: NewsRecord, story: NewsWrite, now: Date): NewsWrite {
  const data: NewsWrite = { lastSeenAt: now }
  if (!existing.publishedAt && story.publishedAt) data.publishedAt = story.publishedAt
  if (!existing.description && story.description) data.description = story.description
  if (!existing.eventSlug && story.eventSlug) {
    data.eventSlug = story.eventSlug
    data.eventPhase = story.eventPhase
  }
  return data
}

export async function rotateHomeCard(
  repository: NewsRepository, feed: NewsFeed, now: Date, events: ActiveEvent[], log: (message: string) => void,
) {
  try {
    const rows = await repository.listRecent([feed], new Date(now.getTime() - MAX_AGE_HOURS * HOUR_MS))
    const chosen = selectHomeStory(rows, feed, { now, events })
    if (!chosen) {
      log(`[news] no eligible ${feed} story; Home keeps its fallback`)
      return null
    }
    if (!isHoldingCard(chosen, now)) await repository.update(chosen.id, featureStamp(now))
    log(`[news] selected ${feed}: "${chosen.title}" (${chosen.sourceDomain ?? 'unknown source'}${chosen.eventSlug ? `, event ${chosen.eventSlug}` : ''})`)
    return { id: chosen.id, title: chosen.title }
  } catch (err) {
    log(`[news] could not rotate ${feed}: ${(err as Error).message}`)
    return null
  }
}
