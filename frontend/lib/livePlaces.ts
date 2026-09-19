// @ts-nocheck
import { categories, categoryIcon, findCategory } from '@/lib/places/taxonomy'

export const KOLKATA = Object.freeze({ lat: 22.5726, lng: 88.3639 })

/* the chips every explore surface offers, in the order the city uses them */
export const exploreCategories = categories

const PLACE_CATEGORIES = new Set(categories.map((category) => category.slug))

function inferArea(address = '') {
  const parts = String(address).split(',').map((part) => part.trim()).filter(Boolean)
  const kolkataIndex = parts.findIndex((part) => /^kolkata$/i.test(part))
  if (kolkataIndex > 0) return parts[kolkataIndex - 1]
  return 'Kolkata'
}

export function formatDistance(distanceKm) {
  if (!Number.isFinite(distanceKm)) return null
  if (distanceKm < 1) return `${Math.max(50, Math.round(distanceKm * 1000 / 50) * 50)} m`
  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`
}

export function presentLivePlace(place) {
  const latitude = place.latitude === null || place.latitude === undefined ? Number.NaN : Number(place.latitude)
  const longitude = place.longitude === null || place.longitude === undefined ? Number.NaN : Number(place.longitude)
  const category = findCategory(place.categorySlug) ?? findCategory(place.category)
  const key = category?.slug ?? 'places'
  const area = place.area || inferArea(place.address)

  return {
    ...place,
    id: place.providerPlaceId || place.slug || place.id,
    category: category?.name ?? place.category ?? 'Places',
    area,
    address: place.address || `${area}, Kolkata`,
    distance: formatDistance(place.distanceKm === null || place.distanceKm === undefined ? Number.NaN : Number(place.distanceKm)),
    // Never present generic category artwork as a photo of a specific venue.
    image: place.image || null,
    hasRealImage: Boolean(place.image),
    markerCategory: PLACE_CATEGORIES.has(key) ? key : 'places',
    icon: categoryIcon(key),
    // No filler copy: a place without a description simply has none.
    description: place.description || null,
    rating: Number(place.rating) > 0 ? Number(place.rating) : null,
    coordinates: { lat: latitude, lng: longitude },
  }
}

export async function fetchLivePlaces(path, { signal } = {}) {
  const response = await fetch(path, { signal, headers: { Accept: 'application/json' } })
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.error?.message || 'Could not load Kolkata places')
  return {
    places: (payload?.data || [])
      .map(presentLivePlace)
      .filter((place) => Number.isFinite(place.coordinates.lat) && Number.isFinite(place.coordinates.lng)),
    meta: payload?.meta || {},
  }
}

export async function fetchPlaceDetails(place, { signal } = {}) {
  const params = new URLSearchParams({
    provider: place.provider || '',
    id: place.providerPlaceId || place.id || '',
    name: place.name || '',
    lat: String(place.coordinates.lat),
    lng: String(place.coordinates.lng),
  })
  const response = await fetch(`/api/explore/details?${params}`, { signal, headers: { Accept: 'application/json' } })
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error('Could not enrich this place')
  return payload?.data ? presentLivePlace(payload.data) : null
}

/* The request a live list makes: text search when there is a query, otherwise
   what is around the origin. One builder so /places and /near-you agree. */
export function exploreRequest({ query = '', category = 'All', origin = KOLKATA, radiusKm = 3, limit = 40 }) {
  const params = new URLSearchParams({
    lat: String(Number(origin.lat).toFixed(5)),
    lng: String(Number(origin.lng).toFixed(5)),
    limit: String(limit),
  })
  if (category && category !== 'All') params.set('category', category)
  const text = query.trim()
  if (text) {
    params.set('q', text)
    return `/api/explore/search?${params}`
  }
  params.set('radiusKm', String(radiusKm))
  return `/api/explore/nearby?${params}`
}

/* A link into the live map that reopens exactly this context */
export function mapHref({ view = 'map', query, category, origin, label, select, locate } = {}) {
  const params = new URLSearchParams({ view })
  if (query) params.set('q', query)
  if (category && category !== 'All') params.set('category', category)
  if (origin) {
    params.set('lat', Number(origin.lat).toFixed(5))
    params.set('lng', Number(origin.lng).toFixed(5))
  }
  if (label) params.set('near', label)
  if (select) params.set('select', select)
  if (locate) params.set('locate', '1')
  return `/near-you?${params}`
}
