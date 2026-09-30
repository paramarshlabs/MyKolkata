// @ts-nocheck
import { cached } from '@/lib/cache'
import { SITE_URL } from '@/lib/site/site'
import { haversineDistanceKm } from './geo'
import { normalizeText } from './taxonomy'

const API_URL = 'https://commons.wikimedia.org/w/api.php'
const CACHE_MS = 24 * 60 * 60 * 1000
/* Wikimedia asks API clients to say who they are and how to reach them */
const USER_AGENT = `MyKolkata/1.0 (${SITE_URL}; place image enrichment)`
/* how long to leave Commons alone after a 429 that names no Retry-After */
const DEFAULT_BACKOFF_MS = 60 * 1000
const MAX_BACKOFF_MS = 10 * 60 * 1000

/* shared by every instance: once Commons says "slow down", nobody asks until it's over */
let rateLimitedUntil = 0

/* Wikimedia asks API clients not to burst, so requests from the whole app —
   list enrichment and /details alike — go out a couple at a time, spaced apart */
const MAX_IN_FLIGHT = 2
const MIN_GAP_MS = 150
const waiting = []
let inFlight = 0
let lastStartedAt = 0

function nextTurn() {
  if (inFlight >= MAX_IN_FLIGHT || !waiting.length) return
  const wait = lastStartedAt + MIN_GAP_MS - Date.now()
  if (wait > 0) {
    setTimeout(nextTurn, wait)
    return
  }
  inFlight += 1
  lastStartedAt = Date.now()
  waiting.shift()()
  nextTurn()
}

async function paced(request) {
  await new Promise((resolve) => {
    waiting.push(resolve)
    nextTurn()
  })
  try {
    return await request()
  } finally {
    inFlight -= 1
    nextTurn()
  }
}

/* Commons also geotags PDFs, audio and video; only photos make a card image */
const IMAGE_FILE = /\.(jpe?g|png|webp|gif|tiff?)$/i
/* a name-search photo geotagged further away than this is of somewhere else */
const NAMED_MATCH_RADIUS_KM = 2
const NAMED_MATCH_CONFIDENCE = 0.7

function backoffMs(response) {
  const seconds = Number(response.headers?.get?.('retry-after'))
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, MAX_BACKOFF_MS) : DEFAULT_BACKOFF_MS
}

function plainText(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function words(value) {
  return new Set(normalizeText(value)
    .replace(/\b(kolkata|calcutta|image|photo|file)\b/g, ' ')
    .split(' ')
    .filter((word) => word.length > 2))
}

function titleSimilarity(name, title) {
  const target = words(name)
  const candidate = words(title.replace(/^File:/i, '').replace(/\.[a-z0-9]{2,5}$/i, ''))
  if (!target.size) return 0
  return [...target].filter((word) => candidate.has(word)).length / target.size
}

/* name search titles read "Chelow Kabab, Peter Cat, Park Street" — commas and all */
const bareWords = (value) => words(String(value).replace(/[^\p{L}\p{N}\s]/gu, ' '))

/* what a business calls itself, not who it is: "Arsalan Restaurant & Caterer" is Arsalan */
const GENERIC_NAME_WORDS = new Set(['restaurant', 'restaurants', 'caterer', 'caterers', 'cafe', 'café', 'and', 'multi', 'cuisine', 'family', 'pvt', 'ltd'])

function distinctiveWords(name) {
  return new Set([...bareWords(name)].filter((word) => !GENERIC_NAME_WORDS.has(word)))
}

function hasEveryWord(target, title) {
  const candidate = bareWords(title.replace(/^File:/i, '').replace(/\.[a-z0-9]{2,5}$/i, ''))
  return target.size > 0 && [...target].every((word) => candidate.has(word))
}

/* every token, short ones too: "G Centre Mall" must not shrink to "Centre Mall" */
const tokens = (value) => normalizeText(String(value).replace(/[^\p{L}\p{N}\s]/gu, ' ')).split(' ').filter(Boolean)
const NAME_FILLER = new Set(['the', 'of', 'kolkata', 'calcutta', ...GENERIC_NAME_WORDS])

/* the whole name side by side in the title — "Peter Cat, Park Street", not "cat … peter" */
function namesInOrder(name, title) {
  const wanted = tokens(name).filter((token) => !NAME_FILLER.has(token)).join(' ')
  const candidate = ` ${tokens(title.replace(/^File:/i, '').replace(/\.[a-z0-9]{2,5}$/i, '')).join(' ')} `
  return Boolean(wanted) && candidate.includes(` ${wanted} `)
}

function metadataValue(metadata, key) {
  return plainText(metadata?.[key]?.value || '') || null
}

export class WikimediaImageProvider {
  constructor({ fetchImpl = globalThis.fetch, radiusMeters = 350 } = {}) {
    this.fetchImpl = fetchImpl
    this.radiusMeters = radiusMeters
    this.name = 'wikimedia-commons'
  }

  get configured() {
    return Boolean(this.fetchImpl)
  }

  /* null when nothing matches */
  async findImage(place) {
    return this.lookupImage(place).catch(() => null)
  }

  /* throws when Commons can't be reached, so an outage is never remembered as "no photo" */
  async lookupImage({ name, lat, lng }) {
    if (!this.configured || !name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
    const cacheKey = `commons:image:${normalizeText(name)}:${lat.toFixed(4)}:${lng.toFixed(4)}`
    return cached(cacheKey, CACHE_MS, async () => (
      await this.nearbyImage({ name, lat, lng }) || await this.namedImage({ name, lat, lng })
    ))
  }

  /* files geotagged beside the place whose titles name it */
  async nearbyImage({ name, lat, lng }) {
    /* titles first: most places have no matching file, and those need nothing more */
    const nearby = await this.query({
      generator: 'geosearch', ggsprimary: 'all', ggsnamespace: '6', ggsradius: String(this.radiusMeters),
      ggscoord: `${lat}|${lng}`, ggslimit: '30', prop: 'coordinates',
    })
    const ranked = (nearby.query?.pages || []).map((page) => {
      const coordinate = page.coordinates?.[0]
      const distanceKm = Number.isFinite(coordinate?.lat) && Number.isFinite(coordinate?.lon)
        ? haversineDistanceKm({ lat, lng }, { lat: coordinate.lat, lng: coordinate.lon })
        : this.radiusMeters / 1000
      return { title: page.title || '', similarity: titleSimilarity(name, page.title || ''), distanceKm }
    }).filter(({ title, similarity }) => IMAGE_FILE.test(title) && similarity >= 0.5)
      .sort((left, right) => right.similarity - left.similarity || left.distanceKm - right.distanceKm)
      .slice(0, 3)
    if (!ranked.length) return null

    /* then the licence and a thumbnail for the few best titles only */
    const details = await this.query({
      titles: ranked.map(({ title }) => title).join('|'),
      prop: 'imageinfo', iiprop: 'url|mime|extmetadata', iiurlwidth: '1200',
    })
    const byTitle = new Map((details.query?.pages || []).map((page) => [page.title, page.imageinfo?.[0]]))
    const match = ranked
      .map((candidate) => ({ ...candidate, image: byTitle.get(candidate.title) }))
      .find(({ image }) => image?.thumburl && image.mime?.startsWith('image/'))
    if (!match) return null
    return this.result(match, match.similarity)
  }

  /* Many photos of a well-known place (Flurys, Peter Cat) aren't geotagged
     beside it, so when nothing nearby matches, search Commons by name. A
     name alone can mislead — "Kasturi" is also a ferry — so every word of
     the name must be in the file's title, a file geotagged elsewhere is
     refused, and a file with no geotag must name the place word for word
     (a one-word name always needs a geotag near the place). */
  async namedImage({ name, lat, lng }) {
    const phrase = name
      .replace(/,?\s*\b(kolkata|calcutta)\b/gi, ' ')
      .replace(/["“”]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const target = distinctiveWords(phrase)
    if (!target.size) return null
    const found = await this.query({
      /* every distinctive word, in any order: "Arsalan Restaurant & Caterer" asks for Arsalan */
      list: 'search', srnamespace: '6', srlimit: '10', srsearch: `${[...target].join(' ')} Kolkata`,
    })
    const titles = (found.query?.search || [])
      .map(({ title }) => title || '')
      .filter((title) => IMAGE_FILE.test(title) && hasEveryWord(target, title))
      .slice(0, 3)
    if (!titles.length) return null

    const details = await this.query({
      titles: titles.join('|'),
      prop: 'imageinfo|coordinates', iiprop: 'url|mime|extmetadata', iiurlwidth: '1200',
    })
    const byTitle = new Map((details.query?.pages || []).map((page) => [page.title, page]))
    const match = titles.map((title) => {
      const page = byTitle.get(title)
      const coordinate = page?.coordinates?.[0]
      const distanceKm = Number.isFinite(coordinate?.lat) && Number.isFinite(coordinate?.lon)
        ? haversineDistanceKm({ lat, lng }, { lat: coordinate.lat, lng: coordinate.lon })
        : null
      return { title, image: page?.imageinfo?.[0], distanceKm }
    }).find(({ title, image, distanceKm }) => image?.thumburl && image.mime?.startsWith('image/')
      && (distanceKm === null ? target.size > 1 && namesInOrder(phrase, title) : distanceKm <= NAMED_MATCH_RADIUS_KM))
    /* a name match is less certain than a geotag beside the place, so it stays a review candidate */
    return match ? this.result(match, NAMED_MATCH_CONFIDENCE) : null
  }

  result(match, confidence) {
    const metadata = match.image.extmetadata || {}
    return {
      image: match.image.thumburl,
      imageSourceUrl: match.image.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(match.title.replaceAll(' ', '_'))}`,
      imageAttribution: metadataValue(metadata, 'Artist') || metadataValue(metadata, 'Credit') || 'Wikimedia Commons contributor',
      imageLicense: metadataValue(metadata, 'LicenseShortName') || metadataValue(metadata, 'UsageTerms') || 'See source',
      imageProvider: this.name,
      imageMatchConfidence: Math.round(confidence * 100) / 100,
    }
  }

  async query(params) {
    return paced(() => this.send(params))
  }

  async send(params) {
    /* checked after the wait too: the pause may have begun while this was queued */
    if (Date.now() < rateLimitedUntil) throw new Error('Wikimedia Commons rate limited')
    const url = new URL(API_URL)
    Object.entries({ action: 'query', format: 'json', formatversion: '2', origin: '*', ...params })
      .forEach(([key, value]) => url.searchParams.set(key, value))
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    try {
      const response = await this.fetchImpl(url, {
        headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
        signal: controller.signal,
      })
      if (response.status === 429) {
        /* requests already in flight get 429s too; the pause is announced once */
        if (Date.now() >= rateLimitedUntil) {
          const pauseMs = backoffMs(response)
          rateLimitedUntil = Date.now() + pauseMs
          console.warn(`[places:image] Wikimedia Commons asked us to slow down (429); pausing for ${Math.round(pauseMs / 1000)}s`)
        }
        throw new Error('Wikimedia Commons rate limited')
      }
      if (!response.ok) throw new Error(`Wikimedia Commons request failed (${response.status})`)
      return await response.json()
    } catch (error) {
      throw new Error(error?.name === 'AbortError' ? 'Wikimedia Commons request timed out' : error?.message || 'Wikimedia Commons unavailable')
    } finally {
      clearTimeout(timeout)
    }
  }
}
