// @ts-nocheck
import { cached } from '@/lib/cache'
import { haversineDistanceKm } from './geo'
import { normalizeProviderPlace } from './normalizePlace'
import { categories, findCategory, normalizeText, providerTypesForCategory } from './taxonomy'

const DEFAULT_BASE_URL = 'https://api.olamaps.io'
const PROVIDER_CACHE_MS = 5 * 60 * 1000
/* Ola caps a nearby page at 50 */
const NEARBY_PAGE_LIMIT = 50

export const KOLKATA_CENTRE = Object.freeze({ lat: 22.5726, lng: 88.3639 })
/* the metro area: Howrah, Salt Lake, New Town, Dakshineswar, Garia, Behala */
export const KOLKATA_RADIUS_KM = 40

function createRequestId() {
  return globalThis.crypto?.randomUUID?.() || `mykolkata-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function extractResults(payload) {
  if (Array.isArray(payload)) return payload
  if (payload?.result && typeof payload.result === 'object') return [payload.result]
  return payload?.places ?? payload?.results ?? payload?.predictions ?? payload?.data?.places ?? payload?.data?.results ?? []
}

function publicError(status) {
  if (status === 401 || status === 403) return 'Ola Places credentials were rejected'
  if (status === 429) return 'Ola Places rate limit reached'
  return 'Ola Places request failed'
}

function hasCoordinates(place) {
  return Number.isFinite(place.latitude) && Number.isFinite(place.longitude)
}

/* untyped results named like an address are fragments — "47, Near Sienna Store" */
function isAddressFragment(place) {
  return !place.tags.length && /^\d/.test(place.name)
}

export function isInKolkata(place) {
  return hasCoordinates(place)
    && haversineDistanceKm(KOLKATA_CENTRE, { lat: place.latitude, lng: place.longitude }) <= KOLKATA_RADIUS_KM + 20
}

/* bias towards the visitor while they are in the city, otherwise the centre */
function searchOrigin(lat, lng) {
  if (Number.isFinite(lat) && Number.isFinite(lng)
    && haversineDistanceKm(KOLKATA_CENTRE, { lat, lng }) <= KOLKATA_RADIUS_KM) return { lat, lng }
  return KOLKATA_CENTRE
}

/* round so a small pan reuses the cached answer instead of a new request */
const coordinate = (value) => Number(value).toFixed(3)

export class OlaPlacesProvider {
  constructor({
    apiKey = process.env.OLA_MAPS_API_KEY,
    baseUrl = process.env.OLA_MAPS_BASE_URL || DEFAULT_BASE_URL,
    requestOrigin = process.env.OLA_MAPS_REQUEST_ORIGIN || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : ''),
    fetchImpl = globalThis.fetch,
    timeoutMs = 6000,
  } = {}) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.requestOrigin = requestOrigin.replace(/\/$/, '')
    this.fetchImpl = fetchImpl
    this.timeoutMs = timeoutMs
    this.name = 'ola'
  }

  get configured() {
    return Boolean(this.apiKey && this.fetchImpl)
  }

  async request(path, params) {
    if (!this.configured) return []

    const payload = await this.requestRaw(path, params)
    return extractResults(payload)
      .map((place) => normalizeProviderPlace(place, this.name))
      .filter(Boolean)
  }

  async requestRaw(path, params) {
    if (!this.configured) return null

    const url = new URL(path, `${this.baseUrl}/`)
    for (const [key, value] of Object.entries({ ...params, api_key: this.apiKey })) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
    }

    const cacheKey = `ola:${url.pathname}:${[...url.searchParams.entries()]
      .filter(([key]) => key !== 'api_key')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&')}`

    return cached(cacheKey, PROVIDER_CACHE_MS, async () => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs)
      try {
        const headers = {
          Accept: 'application/json',
          'X-Request-Id': createRequestId(),
        }
        if (this.requestOrigin) {
          headers.Origin = this.requestOrigin
          headers.Referer = `${this.requestOrigin}/`
        }

        const response = await this.fetchImpl(url, {
          headers,
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(publicError(response.status))
        return response.json()
      } catch (error) {
        if (error?.name === 'AbortError') throw new Error('Ola Places request timed out')
        throw new Error(error?.message?.includes(this.apiKey) ? 'Ola Places request failed' : error.message)
      } finally {
        clearTimeout(timeout)
      }
    })
  }

  async details(placeId) {
    if (!placeId) return null
    let payload
    try {
      payload = await this.requestRaw(process.env.OLA_MAPS_ADVANCED_DETAILS_PATH || '/places/v1/details/advanced', { place_id: placeId })
    } catch {
      payload = await this.requestRaw(process.env.OLA_MAPS_DETAILS_PATH || '/places/v1/details', { place_id: placeId })
    }
    const raw = extractResults(payload)[0]
    if (!raw) return null
    const normalized = normalizeProviderPlace(raw, this.name)
    if (!normalized) return null
    const photos = (raw.photos || raw.photo_references || [])
      .map((photo) => typeof photo === 'string' ? photo : photo.photo_reference || photo.photoReference || photo.reference)
      .filter(Boolean)
      .slice(0, 6)
      .map((reference) => `/api/explore/photo?ref=${encodeURIComponent(reference)}`)
    return {
      ...normalized,
      photos,
      image: photos[0] || normalized.image,
      imageAttribution: photos.length ? 'Ola Maps' : null,
      imageProvider: photos.length ? 'ola' : null,
    }
  }

  async resolveDetails({ name, lat, lng }) {
    const candidates = await this.autocomplete({ query: name, lat, lng })
    const targetTokens = new Set(normalizeText(name).split(' ').filter((token) => token.length > 2 && token !== 'kolkata'))
    const ranked = candidates
      .filter((place) => place.providerPlaceId)
      .map((place) => {
        const candidateName = normalizeText(place.name)
        const candidateTokens = new Set(candidateName.split(' ').filter((token) => token.length > 2 && token !== 'kolkata'))
        const matches = [...targetTokens].filter((token) => candidateTokens.has(token)).length
        const similarity = targetTokens.size ? matches / targetTokens.size : 0
        const exact = candidateName === normalizeText(name) ? 2 : 0
        return { place, score: exact + similarity }
      })
      .sort((left, right) => right.score - left.score)
    const candidate = ranked[0]?.score >= 0.5 ? ranked[0].place : null
    return candidate ? this.details(candidate.providerPlaceId) : null
  }

  /* Name search. Text search only answers "cafes in Gariahat"-style queries and
     returns nothing for a venue's own name, so names go through autocomplete. */
  async autocomplete({ query, lat, lng }) {
    const origin = searchOrigin(lat, lng)
    const places = await this.request(process.env.OLA_MAPS_AUTOCOMPLETE_PATH || '/places/v1/autocomplete', {
      input: query,
      location: `${coordinate(origin.lat)},${coordinate(origin.lng)}`,
      radius: KOLKATA_RADIUS_KM * 1000,
      strictbounds: 'true',
    })
    return places
      .filter((place) => isInKolkata(place) && !isAddressFragment(place))
      .map((place) => ({ ...place, matchedBy: 'autocomplete' }))
  }

  async searchText({ query, category, lat, lng, limit = 20 }) {
    const types = providerTypesForCategory(category)
    const origin = searchOrigin(lat, lng)
    const cityScopedQuery = /\b(kolkata|calcutta)\b/i.test(query) ? query : `${query} in Kolkata`
    const places = await this.request(process.env.OLA_MAPS_TEXT_SEARCH_PATH || '/places/v1/textsearch', {
      input: cityScopedQuery,
      location: `${coordinate(origin.lat)},${coordinate(origin.lng)}`,
      types: types.length ? types.join(',') : undefined,
    })
    return places
      .filter((place) => isInKolkata(place) && !isAddressFragment(place))
      .slice(0, limit)
      .map((place) => ({ ...place, matchedBy: 'text' }))
  }

  /* both searches run together; one failing still answers with the other */
  async search({ query, category, lat, lng, limit = 20 }) {
    const [suggested, text] = await Promise.allSettled([
      this.autocomplete({ query, lat, lng }),
      this.searchText({ query, category, lat, lng, limit }),
    ])
    if (suggested.status === 'rejected' && text.status === 'rejected') throw suggested.reason
    return [
      ...(suggested.status === 'fulfilled' ? suggested.value : []),
      ...(text.status === 'fulfilled' ? text.value : []),
    ]
  }

  async nearbyCategory({ lat, lng, radiusKm, slug, limit, relabel }) {
    const places = await this.request(process.env.OLA_MAPS_NEARBY_SEARCH_PATH || '/places/v1/nearbysearch', {
      layers: 'venue',
      location: `${coordinate(lat)},${coordinate(lng)}`,
      radius: Math.round(radiusKm * 1000),
      types: providerTypesForCategory(slug).join(','),
      limit: Math.min(Math.max(Math.round(limit), 1), NEARBY_PAGE_LIMIT),
      /* without it predictions come back with no coordinates at all */
      withCentroid: 'true',
    })
    const category = findCategory(slug)
    const located = places.filter(hasCoordinates)
    /* a filtered list reads as what was asked for — a café-restaurant under Cafés says Cafés */
    return relabel ? located.map((place) => ({ ...place, category: category.name, categorySlug: category.slug })) : located
  }

  /* One category, or every category in parallel so a mixed map isn't all restaurants */
  async nearby({ lat, lng, radiusKm = 5, category, limit = 20 }) {
    const requested = findCategory(category)
    const slugs = requested ? [requested.slug] : categories.map((entry) => entry.slug)
    const perCategory = requested ? limit : Math.max(6, Math.ceil(limit / slugs.length))
    const groups = await Promise.allSettled(
      slugs.map((slug) => this.nearbyCategory({ lat, lng, radiusKm, slug, limit: perCategory, relabel: Boolean(requested) })),
    )
    const fulfilled = groups.filter((group) => group.status === 'fulfilled')
    if (!fulfilled.length) throw groups[0].reason

    /* interleave so a truncated list still covers every category */
    const lists = fulfilled.map((group) => group.value)
    const interleaved = []
    for (let index = 0; lists.some((list) => index < list.length); index += 1) {
      for (const list of lists) if (index < list.length) interleaved.push(list[index])
    }
    return interleaved
  }
}
