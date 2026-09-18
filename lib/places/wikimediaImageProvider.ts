// @ts-nocheck
import { cached } from '@/lib/cache'
import { haversineDistanceKm } from './geo'
import { normalizeText } from './taxonomy'

const API_URL = 'https://commons.wikimedia.org/w/api.php'
const CACHE_MS = 24 * 60 * 60 * 1000

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

  async findImage({ name, lat, lng }) {
    if (!this.configured || !name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
    const cacheKey = `commons:image:${normalizeText(name)}:${lat.toFixed(4)}:${lng.toFixed(4)}`
    return cached(cacheKey, CACHE_MS, async () => {
      const url = new URL(API_URL)
      const params = {
        action: 'query', format: 'json', formatversion: '2', generator: 'geosearch',
        ggsprimary: 'all', ggsnamespace: '6', ggsradius: String(this.radiusMeters),
        ggscoord: `${lat}|${lng}`, ggslimit: '30', prop: 'imageinfo|coordinates',
        iiprop: 'url|mime|extmetadata', iiurlwidth: '1200', origin: '*',
      }
      Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      try {
        const response = await this.fetchImpl(url, {
          headers: { Accept: 'application/json', 'User-Agent': 'MyKolkata/1.0 (place image enrichment)' },
          signal: controller.signal,
        })
        if (!response.ok) return null
        const payload = await response.json()
        const candidates = (payload.query?.pages || []).map((page) => {
          const image = page.imageinfo?.[0]
          const coordinate = page.coordinates?.[0]
          const similarity = titleSimilarity(name, page.title || '')
          const distanceKm = Number.isFinite(coordinate?.lat) && Number.isFinite(coordinate?.lon)
            ? haversineDistanceKm({ lat, lng }, { lat: coordinate.lat, lng: coordinate.lon })
            : this.radiusMeters / 1000
          return { page, image, similarity, distanceKm }
        }).filter(({ image, similarity }) => image?.thumburl && image.mime?.startsWith('image/') && similarity >= 0.5)
          .sort((left, right) => right.similarity - left.similarity || left.distanceKm - right.distanceKm)
        const match = candidates[0]
        if (!match) return null
        const metadata = match.image.extmetadata || {}
        return {
          image: match.image.thumburl,
          imageSourceUrl: match.image.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(match.page.title.replaceAll(' ', '_'))}`,
          imageAttribution: metadataValue(metadata, 'Artist') || metadataValue(metadata, 'Credit') || 'Wikimedia Commons contributor',
          imageLicense: metadataValue(metadata, 'LicenseShortName') || metadataValue(metadata, 'UsageTerms') || 'See source',
          imageProvider: this.name,
          imageMatchConfidence: Math.round(match.similarity * 100) / 100,
        }
      } catch {
        return null
      } finally {
        clearTimeout(timeout)
      }
    })
  }
}
