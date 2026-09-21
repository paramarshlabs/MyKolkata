// @ts-nocheck
import { normalizeText } from './taxonomy'

const SEARCH_URL = 'https://api.anakin.io/v1/search'
const SCRAPE_URL = 'https://api.anakin.io/v1/url-scraper/scrape'
const DIRECTORY_HOSTS = /(^|\.)(facebook|instagram|x|twitter|zomato|swiggy|tripadvisor|justdial|yelp|google)\./i

function tokens(value) {
  return new Set(normalizeText(value).split(' ').filter((word) => word.length > 2 && word !== 'kolkata'))
}

export function nameSimilarity(name, value) {
  const expected = tokens(name)
  const actual = tokens(value)
  if (!expected.size) return 0
  return [...expected].filter((word) => actual.has(word)).length / expected.size
}

export function safePublicUrl(value) {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    const host = url.hostname.toLowerCase()
    if (host === 'localhost' || host === '0.0.0.0' || host === '::1' || host.endsWith('.local')) return null
    if (/^(10\.|127\.|169\.254\.|192\.168\.)/.test(host)) return null
    const match172 = host.match(/^172\.(\d+)\./)
    if (match172 && Number(match172[1]) >= 16 && Number(match172[1]) <= 31) return null
    return url
  } catch {
    return null
  }
}

function attributes(tag) {
  const values = {}
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)) {
    values[match[1].toLowerCase()] = match[2]
  }
  return values
}

function decodeHtml(value = '') {
  return String(value)
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

export function extractPageImage(html, sourceUrl) {
  const source = safePublicUrl(sourceUrl)
  if (!source || !html) return null
  let image = null
  let title = ''
  let kind = 'meta'
  for (const tag of String(html).match(/<meta\b[^>]*>/gi) || []) {
    const attrs = attributes(tag)
    const key = String(attrs.property || attrs.name || '').toLowerCase()
    if (!image && ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src'].includes(key)) image = attrs.content
    if (!title && ['og:title', 'twitter:title'].includes(key)) title = attrs.content
  }
  if (!title) title = String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ''
  if (!image) {
    kind = 'json-ld'
    for (const script of String(html).match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || []) {
      const raw = script.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>$/i, '')
      try {
        const data = JSON.parse(raw)
        const item = Array.isArray(data) ? data[0] : data
        image = Array.isArray(item?.image) ? item.image[0] : (item?.image?.url || item?.image)
        if (image) break
      } catch {}
    }
  }
  if (!image) return null
  const imageUrl = safePublicUrl(new URL(decodeHtml(image), source).toString())
  return imageUrl ? {
    imageUrl: imageUrl.toString(),
    title: decodeHtml(title).replace(/<[^>]*>/g, ' ').trim(),
    /* 'meta' = og:/twitter:image, 'json-ld' = the structured-data image */
    kind,
  } : null
}

export class AnakinImageProvider {
  constructor({ apiKey = process.env.ANAKIN_API_KEY, fetchImpl = globalThis.fetch } = {}) {
    this.apiKey = apiKey
    this.fetchImpl = fetchImpl
    this.name = 'anakin-official-site'
  }

  get configured() {
    return Boolean(this.fetchImpl)
  }

  get hasApiKey() {
    return Boolean(this.apiKey)
  }

  headers() {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(this.apiKey ? { 'X-API-Key': this.apiKey } : {}),
    }
  }

  async post(url, body, timeoutMs) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await this.fetchImpl(url, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`Anakin request failed (${response.status})`)
      return response.json()
    } finally {
      clearTimeout(timeout)
    }
  }

  /* web search: [{ url, title, snippet, ... }] */
  async search(prompt, { limit = 8, timeoutMs = 30000 } = {}) {
    const payload = await this.post(SEARCH_URL, { prompt, limit }, timeoutMs)
    return Array.isArray(payload?.results) ? payload.results : []
  }

  /* a page's HTML, or null when the scrape did not complete.
     Prefer raw `html` over `cleanedHtml`: cleaning often strips <img> tags,
     which are what news image discovery needs (og:image / headline photos). */
  async scrapeHtml(url, { timeoutMs = 95000, useBrowser = false } = {}) {
    const payload = await this.post(SCRAPE_URL, {
      url,
      country: 'in',
      useBrowser,
      generateJson: false,
    }, timeoutMs)
    if (payload.status && payload.status !== 'completed') return null
    return payload.html || payload.cleanedHtml || null
  }

  async findOfficialWebsite(place) {
    const results = await this.search(
      `Official website for ${place.name}, ${place.address || place.area || 'Kolkata, India'}`,
      { limit: 8 },
    )
    const candidates = results.map((result) => {
      const url = safePublicUrl(result.url)
      const similarity = nameSimilarity(place.name, `${result.title || ''} ${result.snippet || ''} ${url?.hostname || ''}`)
      return { url, similarity }
    }).filter(({ url, similarity }) => url && !DIRECTORY_HOSTS.test(url.hostname) && similarity >= 0.5)
      .sort((left, right) => right.similarity - left.similarity)
    return candidates[0]?.url?.toString() || null
  }

  async findImage(place) {
    if (!this.configured || !place?.name) return null
    const knownWebsite = safePublicUrl(place.website)?.toString() || null
    const website = knownWebsite || await this.findOfficialWebsite(place)
    if (!website) return null
    const html = await this.scrapeHtml(website)
    if (!html) return null
    const extracted = extractPageImage(html, website)
    if (!extracted) return null
    const similarity = nameSimilarity(place.name, `${extracted.title} ${website}`)
    if (similarity < 0.5) return null
    return {
      url: extracted.imageUrl,
      sourceUrl: website,
      provider: this.name,
      attribution: place.name,
      license: null,
      confidence: Math.min(0.9, (knownWebsite ? 0.65 : 0.5) + similarity * 0.25),
      verification: 'CANDIDATE',
      kind: 'PHOTO',
    }
  }
}
