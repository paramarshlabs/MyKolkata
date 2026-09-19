import { createHash } from 'node:crypto'
import { safePublicUrl } from '@/lib/places/anakinImageProvider'

/* ==========================================================================
   Where a story comes from, and whether two results are the same story.
   ========================================================================== */

export type SourceTier = 'OFFICIAL' | 'LOCAL' | 'NATIONAL' | 'OTHER'

/* Source quality as a 0–1 weight; ranking.ts turns it into points. Official
   bodies are the record itself; Kolkata/Bengal papers know the city best;
   national outlets are reliable but less local; anything else is unvetted. */
export const SOURCE_QUALITY: Record<SourceTier, number> = {
  OFFICIAL: 1,
  LOCAL: 0.9,
  NATIONAL: 0.75,
  OTHER: 0.35,
}

const OFFICIAL = [/\.gov\.in$/, /\.nic\.in$/, /^bcci\.tv$/, /^indiansuperleague\.com$/, /^the-aiff\.com$/, /^kolkatabookfair\.net$/, /^kkr\.in$/]

const PUBLICATIONS: Record<string, { name: string; tier: SourceTier }> = {
  'anandabazar.com': { name: 'Anandabazar Patrika', tier: 'LOCAL' },
  'telegraphindia.com': { name: 'The Telegraph', tier: 'LOCAL' },
  'thestatesman.com': { name: 'The Statesman', tier: 'LOCAL' },
  'millenniumpost.in': { name: 'Millennium Post', tier: 'LOCAL' },
  'sangbadpratidin.in': { name: 'Sangbad Pratidin', tier: 'LOCAL' },
  'bartamanpatrika.com': { name: 'Bartaman', tier: 'LOCAL' },
  'eisamay.com': { name: 'Ei Samay', tier: 'LOCAL' },
  'eisamay.indiatimes.com': { name: 'Ei Samay', tier: 'LOCAL' },
  'getbengal.com': { name: 'Get Bengal', tier: 'LOCAL' },
  'timesofindia.indiatimes.com': { name: 'The Times of India', tier: 'NATIONAL' },
  'economictimes.indiatimes.com': { name: 'The Economic Times', tier: 'NATIONAL' },
  'thehindu.com': { name: 'The Hindu', tier: 'NATIONAL' },
  'sportstar.thehindu.com': { name: 'Sportstar', tier: 'NATIONAL' },
  'indianexpress.com': { name: 'The Indian Express', tier: 'NATIONAL' },
  'newindianexpress.com': { name: 'The New Indian Express', tier: 'NATIONAL' },
  'hindustantimes.com': { name: 'Hindustan Times', tier: 'NATIONAL' },
  'ndtv.com': { name: 'NDTV', tier: 'NATIONAL' },
  'indiatoday.in': { name: 'India Today', tier: 'NATIONAL' },
  'livemint.com': { name: 'Mint', tier: 'NATIONAL' },
  'business-standard.com': { name: 'Business Standard', tier: 'NATIONAL' },
  'deccanherald.com': { name: 'Deccan Herald', tier: 'NATIONAL' },
  'news18.com': { name: 'News18', tier: 'NATIONAL' },
  'scroll.in': { name: 'Scroll', tier: 'NATIONAL' },
  'ptinews.com': { name: 'PTI', tier: 'NATIONAL' },
  'espncricinfo.com': { name: 'ESPNcricinfo', tier: 'NATIONAL' },
  'cricbuzz.com': { name: 'Cricbuzz', tier: 'NATIONAL' },
  'khelnow.com': { name: 'Khel Now', tier: 'OTHER' },
  'goal.com': { name: 'Goal', tier: 'OTHER' },
}

/* never a news source: social, video, reference, aggregators, directories, weather */
const BLOCKED = /(^|\.)(facebook|instagram|x|twitter|threads|youtube|youtu|linkedin|reddit|quora|pinterest|wikipedia|wikimedia|google|bing|msn|yahoo|dailyhunt|zomato|swiggy|tripadvisor|justdial|yelp|weather|timeanddate|accuweather|wunderground)\.[a-z.]+$/i

export function sourceDomain(url: string | URL) {
  const parsed = typeof url === 'string' ? safePublicUrl(url) : url
  if (!parsed) return null
  return parsed.hostname.toLowerCase().replace(/^(www|m|amp)\./, '')
}

function publicationFor(domain: string) {
  if (PUBLICATIONS[domain]) return PUBLICATIONS[domain]
  /* bengali.news18.com → news18.com; eisamay.indiatimes.com stays specific above */
  const parent = Object.keys(PUBLICATIONS).find((known) => domain.endsWith(`.${known}`))
  return parent ? PUBLICATIONS[parent] : null
}

export function sourceTier(domain: string): SourceTier {
  if (OFFICIAL.some((pattern) => pattern.test(domain))) return 'OFFICIAL'
  return publicationFor(domain)?.tier ?? 'OTHER'
}

export function isBlockedSource(domain: string) {
  return BLOCKED.test(domain)
}

export function sourceName(domain: string, fallback?: string | null) {
  if (publicationFor(domain)) return publicationFor(domain)!.name
  if (fallback?.trim()) return fallback.trim()
  return domain
}

/* ---------- Deduplication keys ------------------------------------------ */

const TRACKING_PARAM = /^(utm_\w+|fbclid|gclid|ref|ref_src|cmpid|from|source|amp|outputType)$/i

/* The same article reached through different searches collapses to one URL:
   no tracking params, no AMP variant, no fragment, no trailing slash. */
export function canonicalUrl(value: string) {
  const url = safePublicUrl(value)
  if (!url) return null
  url.protocol = 'https:'
  url.hostname = url.hostname.toLowerCase().replace(/^(www|m|amp)\./, '')
  url.hash = ''
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAM.test(key)) url.searchParams.delete(key)
  }
  url.searchParams.sort()
  url.pathname = url.pathname.replace(/\/amp\/?$/i, '/').replace(/\.amp(\.html)?$/i, '$1').replace(/\/+$/, '') || '/'
  return url.toString()
}

export function normalizeTitle(title: string) {
  return String(title || '')
    .toLowerCase()
    /* "Headline | The Telegraph", "Headline - Times of India" */
    .replace(/\s+[|\-–—]\s+[^|\-–—]{2,40}$/, '')
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function titleKey(title: string, domain: string) {
  const normalized = normalizeTitle(title)
  return normalized ? `${domain}::${normalized}` : null
}

export function contentHash(title: string, description?: string | null) {
  const body = `${normalizeTitle(title)}\n${normalizeTitle(description || '').slice(0, 280)}`
  return createHash('sha256').update(body).digest('hex').slice(0, 40)
}

/* word-overlap similarity of two headlines, 0–1 */
export function titleSimilarity(left: string, right: string) {
  const words = (value: string) => new Set(normalizeTitle(value).split(' ').filter((word) => word.length > 2))
  const a = words(left)
  const b = words(right)
  if (!a.size || !b.size) return 0
  const shared = [...a].filter((word) => b.has(word)).length
  return shared / Math.min(a.size, b.size)
}
