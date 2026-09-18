// @ts-nocheck
import { haversineDistanceKm, isInsideBounds } from './geo'
import { mergeUniquePlaces } from './normalizePlace'
import { findCategory, normalizeText } from './taxonomy'

/* results that name a part of the city rather than a place to go */
const AREA_TYPES = new Set([
  'borough', 'locality', 'sublocality', 'sublocality level 1', 'neighborhood', 'neighbourhood',
  'street address', 'route', 'administrative area level 3', 'postal code',
])
/* real places, but rarely what someone exploring is after unless they name them */
const UTILITY_TYPES = new Set([
  'bus station', 'transit station', 'police', 'hospital', 'local government office', 'atm', 'bank',
  'post office', 'pharmacy', 'doctor', 'school', 'lawyer', 'real estate agency', 'insurance agency',
])
/* how far a category word looks around the searcher, e.g. "coffee" */
const CATEGORY_INTENT_RADIUS_KM = 4
const STOP_WORDS = new Set(['in', 'at', 'near', 'around', 'the', 'of', 'and', 'best', 'top', 'good', 'kolkata', 'calcutta'])

const tagsOf = (place) => (place.tags ?? []).map((tag) => normalizeText(tag).replaceAll('_', ' '))
const isArea = (place) => tagsOf(place).some((tag) => AREA_TYPES.has(tag))
const isUtility = (place) => tagsOf(place).some((tag) => UTILITY_TYPES.has(tag))

const matchable = (value) => normalizeText(value).replace(/['’]/g, '')

/* Text search answers "cafes in Gariahat" loosely, so its results must mention
   every word of the query somewhere; autocomplete already matched the name. */
export function matchesEveryWord(place, query) {
  const words = matchable(query).split(/[^a-z0-9]+/).filter((word) => word.length > 1 && !STOP_WORDS.has(word))
  const haystack = matchable([place.name, place.address, place.area, place.category, ...(place.tags ?? [])].filter(Boolean).join(' '))
  return words.every((word) => haystack.includes(word) || (word.length > 3 && word.endsWith('s') && haystack.includes(word.slice(0, -1))))
}

function searchScore(place, query) {
  const normalizedQuery = normalizeText(query)
  const name = normalizeText(place.name)
  const searchable = normalizeText([
    place.name,
    place.category,
    place.area,
    place.address,
    ...(place.tags ?? []),
  ].filter(Boolean).join(' '))

  let score = 0
  if (name === normalizedQuery) score += 100
  else if (name.startsWith(normalizedQuery)) score += 60
  else if (name.includes(normalizedQuery)) score += 40
  else if (searchable.includes(normalizedQuery)) score += 20
  score += Math.min(place.ratingCount ?? 0, 1000) / 100
  score += (place.rating ?? 0) * 2
  score += (place.sourceConfidence ?? 0) * 5
  if (isUtility(place) && name !== normalizedQuery) score -= 25
  if (Number.isFinite(place.distanceKm)) score -= Math.min(place.distanceKm, 30) / 2
  return score
}

function withDistances(places, origin) {
  if (!origin) return places
  return places.map((place) => {
    if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) return place
    return {
      ...place,
      distanceKm: haversineDistanceKm(origin, { lat: place.latitude, lng: place.longitude }),
    }
  })
}

/* "Park Street" → Park Street Area, so the visitor can look around it */
export function findAreaAnchor(query, places) {
  const needle = normalizeText(query)
  if (needle.length < 3) return null
  const area = places.find((place) => {
    if (!isArea(place) || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) return false
    const name = normalizeText(place.name)
    return name === needle || name.startsWith(`${needle} `) || needle.startsWith(`${name} `)
  })
  return area ? {
    name: area.name,
    address: area.address ?? null,
    latitude: area.latitude,
    longitude: area.longitude,
  } : null
}

export function boundsCentre(bounds) {
  return { lat: (bounds.north + bounds.south) / 2, lng: (bounds.east + bounds.west) / 2 }
}

export function boundsRadiusKm(bounds) {
  const centre = boundsCentre(bounds)
  const corner = haversineDistanceKm(centre, { lat: bounds.north, lng: bounds.east })
  return Math.min(Math.max(corner, 0.3), 15)
}

export function createPlaceSearchService({ repository, provider, minimumLocalResults = 8 }) {
  if (!repository) throw new Error('A place repository is required')

  async function localResults(method, params, emptyValue = []) {
    try {
      return { places: await repository[method](params), localStatus: 'ok' }
    } catch (error) {
      console.error(`[places:database] ${error?.code || error?.name || 'unavailable'}`)
      return { places: emptyValue, localStatus: 'unavailable' }
    }
  }

  async function providerFallback(method, params) {
    if (!provider?.configured || typeof provider[method] !== 'function') {
      return { places: [], providerStatus: 'not-configured' }
    }
    try {
      return { places: await provider[method](params), providerStatus: 'ok' }
    } catch (error) {
      console.error(`[places:${provider.name ?? 'provider'}] ${error.message}`)
      return { places: [], providerStatus: 'unavailable' }
    }
  }

  return {
    async withinBounds({ bounds, category, query, limit = 250, cursor = 0 }) {
      const local = await localResults(
        'withinBounds',
        { bounds, category, query, limit, cursor },
        { places: [], nextCursor: null, total: 0 },
      )
      const localResult = local.places
      if (cursor !== 0 || localResult.total >= minimumLocalResults) {
        return {
          places: localResult.places,
          meta: { source: 'catalog', total: localResult.total, nextCursor: localResult.nextCursor, localStatus: local.localStatus },
        }
      }

      const centre = boundsCentre(bounds)
      const external = await providerFallback('nearby', {
        lat: centre.lat, lng: centre.lng, radiusKm: boundsRadiusKm(bounds), category, limit,
      })
      const needle = query ? normalizeText(query) : ''
      const places = mergeUniquePlaces(localResult.places, external.places)
        .filter((place) => isInsideBounds({ lat: place.latitude, lng: place.longitude }, bounds))
        .filter((place) => !needle || normalizeText(`${place.name} ${place.address ?? ''} ${place.area ?? ''}`).includes(needle))
        .slice(0, limit)
      return {
        places,
        meta: {
          source: external.places.length ? (provider?.name ?? 'provider') : 'catalog',
          total: places.length,
          nextCursor: null,
          localStatus: local.localStatus,
          providerStatus: external.providerStatus,
        },
      }
    },

    async search({ query, category, lat, lng, limit = 20, cursor = 0 }) {
      const local = await localResults('search', { query, category, limit, cursor })
      const localPlaces = local.places
      const origin = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
      /* a bare category word — "coffee", "museums" — means that category nearby */
      const intent = category ? null : findCategory(query)

      let external = { places: [], providerStatus: 'not-needed' }
      let categoryNearby = { places: [], providerStatus: 'not-needed' }
      if (cursor === 0 && localPlaces.length < Math.min(limit, minimumLocalResults)) {
        const method = typeof provider?.search === 'function' ? 'search' : 'searchText'
        ;[external, categoryNearby] = await Promise.all([
          providerFallback(method, { query, category, lat, lng, limit }),
          intent && origin
            ? providerFallback('nearby', { lat, lng, radiusKm: CATEGORY_INTENT_RADIUS_KM, category: intent.slug, limit })
            : Promise.resolve(categoryNearby),
        ])
      }

      const categorySlug = category ? findCategory(category)?.slug : null
      const candidates = withDistances(mergeUniquePlaces(localPlaces, external.places, categoryNearby.places), origin)
      const area = cursor === 0 ? findAreaAnchor(query, candidates) : null
      const places = candidates
        .filter((place) => !isArea(place))
        .filter((place) => place.matchedBy !== 'text' || matchesEveryWord(place, query))
        .filter((place) => !categorySlug || place.categorySlug === categorySlug)
        .sort((a, b) => searchScore(b, query) - searchScore(a, query))
        .slice(0, limit)

      const providerStatus = [external.providerStatus, categoryNearby.providerStatus].includes('ok')
        ? 'ok'
        : external.providerStatus

      return {
        places,
        meta: {
          localCount: localPlaces.length,
          localStatus: local.localStatus,
          provider: provider?.name ?? null,
          providerStatus,
          area,
          categoryIntent: intent ? { slug: intent.slug, name: intent.name } : null,
          nextCursor: external.places.length ? null : (localPlaces.length === limit ? String(cursor + localPlaces.length) : null),
        },
      }
    },

    async nearby({ lat, lng, radiusKm = 5, category, limit = 20 }) {
      const local = await localResults('nearby', { lat, lng, radiusKm, category, limit })
      const localPlaces = local.places
      let external = { places: [], providerStatus: 'not-needed' }
      if (localPlaces.length < Math.min(limit, minimumLocalResults)) {
        external = await providerFallback('nearby', { lat, lng, radiusKm, category, limit })
      }

      const places = withDistances(mergeUniquePlaces(localPlaces, external.places), { lat, lng })
        .filter((place) => Number.isFinite(place.distanceKm) && place.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm || (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, limit)

      return {
        places,
        meta: {
          localCount: localPlaces.length,
          localStatus: local.localStatus,
          provider: provider?.name ?? null,
          providerStatus: external.providerStatus,
          radiusKm,
        },
      }
    },
  }
}
