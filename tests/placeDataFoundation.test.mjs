import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { boundingBox, haversineDistanceKm, isInsideBounds, parseCoordinate } from '../lib/places/geo.ts'
import {
  mergeUniquePlaces,
  normalizeProviderPlace,
  placeMatchConfidence,
} from '../lib/places/normalizePlace.ts'
import { OlaPlacesProvider } from '../lib/places/olaPlacesProvider.ts'
import { createPlaceSearchService, matchesEveryWord } from '../lib/places/placeSearchService.ts'
import { FilePlaceRepository } from '../lib/places/filePlaceRepository.ts'
import { WikimediaImageProvider } from '../lib/places/wikimediaImageProvider.ts'
import { AnakinImageProvider, extractPageImage, safePublicUrl } from '../lib/places/anakinImageProvider.ts'
import { imageCandidateFromWikimedia } from '../lib/places/imageCandidate.ts'
import { presentLivePlace } from '../lib/livePlaces.ts'
import { FallbackPlaceRepository } from '../lib/places/filePlaceRepository.ts'
import {
  RequestValidationError,
  createPlacesRouteHandler,
  parseNearbyQuery,
  parseBoundsQuery,
  parseSearchQuery,
} from '../lib/places/request.ts'
import { categories, categoryFromProviderTypes, findCategory, providerTypesForCategory } from '../lib/places/taxonomy.ts'

function place(overrides = {}) {
  return {
    provider: 'mykolkata',
    providerPlaceId: 'local-1',
    name: 'Flurys',
    category: 'Cafés',
    categorySlug: 'cafes',
    latitude: 22.5527,
    longitude: 88.3526,
    rating: 4.7,
    ratingCount: 100,
    sourceConfidence: 1,
    tags: ['cafe'],
    ...overrides,
  }
}

function request(url) {
  return new Request(url)
}

test('taxonomy maps UI labels and provider aliases to stable category slugs', () => {
  assert.equal(findCategory('Café').slug, 'cafes')
  assert.equal(findCategory('street food').slug, 'food')
  assert.equal(findCategory('museums').slug, 'culture')
  assert.deepEqual(providerTypesForCategory('Outdoors'), ['park', 'zoo', 'natural_feature'])
  assert.equal(findCategory('not-a-category'), null)
})

test('taxonomy never sends Ola a type it rejects — one unknown type empties the whole request', () => {
  /* each of these returns zero_results from Ola Places */
  const rejected = new Set(['garden', 'theatre', 'heritage', 'event_venue', 'market', 'coffee_shop', 'food', 'meal_takeaway'])
  for (const category of categories) {
    const types = providerTypesForCategory(category.slug)
    assert.ok(types.length, `${category.slug} has provider types`)
    assert.deepEqual(types.filter((type) => rejected.has(type)), [], category.slug)
  }
})

test('provider types label places by their most specific kind', () => {
  assert.equal(categoryFromProviderTypes(['cafe', 'restaurant']).slug, 'cafes')
  assert.equal(categoryFromProviderTypes(['tourist_attraction', 'natural_feature']).slug, 'outdoors')
  assert.equal(categoryFromProviderTypes(['bar']).slug, 'food')
  assert.equal(categoryFromProviderTypes(['metro_station']).slug, 'places')
  /* whole words only: "department" is not "art" */
  assert.equal(categoryFromProviderTypes(['apartment complex']).slug, 'places')
})

test('geographic helpers validate coordinates and calculate Kolkata distances', () => {
  assert.equal(parseCoordinate('22.5726', 'latitude'), 22.5726)
  assert.equal(parseCoordinate('181', 'longitude'), null)
  const distance = haversineDistanceKm(
    { lat: 22.5527, lng: 88.3526 },
    { lat: 22.5576, lng: 88.3510 }
  )
  assert.equal(distance > 0.5 && distance < 0.7, true)
  const bounds = boundingBox({ lat: 22.5527, lng: 88.3526 }, 1)
  assert.equal(isInsideBounds({ lat: 22.5576, lng: 88.3510 }, bounds), true)
})

test('provider records normalize varying place response shapes', () => {
  const normalized = normalizeProviderPlace({
    place_id: 'ola-123',
    name: 'Indian Museum',
    formatted_address: '27 Jawaharlal Nehru Road, Kolkata',
    geometry: { location: { lat: 22.5576, lng: 88.3510 } },
    types: ['museum'],
    rating: '4.6',
    user_ratings_total: '2500',
  }, 'ola')

  assert.equal(normalized.providerPlaceId, 'ola-123')
  assert.equal(normalized.categorySlug, 'culture')
  assert.equal(normalized.latitude, 22.5576)
  assert.equal(normalized.ratingCount, 2500)
})

test('Ola predictions lose their placeholders and keep a tidy address and neighbourhood', () => {
  const normalized = normalizeProviderPlace({
    place_id: 'ola-platform:5000047274683',
    description: 'Flurys, 18A, Park St, Park Street Area, Kolkata, West Bengal, 700071, India',
    structured_formatting: {
      main_text: 'Flurys',
      secondary_text: '18A, Park St, Park Street Area, Kolkata, West Bengal, 700071, India',
    },
    geometry: { location: { lat: 22.5528, lng: 88.3524 } },
    types: ['bakery'],
    rating: -1,
    user_ratings_total: 0,
    formatted_phone_number: 'NA',
    website: 'NA',
    business_status: 'NA',
    opening_hours: { open_now: false, weekday_text: [] },
    distance_meters: 2501,
  }, 'ola')

  assert.equal(normalized.name, 'Flurys')
  assert.equal(normalized.description, null)
  assert.equal(normalized.address, '18A, Park St, Park Street Area, Kolkata')
  assert.equal(normalized.area, 'Park Street Area')
  assert.equal(normalized.categorySlug, 'cafes')
  assert.equal(normalized.rating, null)
  assert.equal(normalized.ratingCount, null)
  assert.equal(normalized.phone, null)
  assert.equal(normalized.website, null)
  assert.equal(normalized.status, null)
  assert.equal(normalized.openingHours, null)
  assert.equal(normalized.distanceKm, 2.501)
})

test('entity matching merges the same real place across providers', () => {
  const local = place({ providerPlaceId: 'local-flurys', address: '18A Park Street' })
  const provider = place({
    provider: 'ola',
    providerPlaceId: 'ola-flurys',
    latitude: 22.55272,
    longitude: 88.35261,
    tags: ['bakery'],
    sourceConfidence: 0.9,
  })
  assert.equal(placeMatchConfidence(local, provider) >= 0.85, true)
  const merged = mergeUniquePlaces([local], [provider])
  assert.equal(merged.length, 1)
  assert.equal(merged[0].provider, 'mykolkata')
  assert.deepEqual(merged[0].tags.sort(), ['bakery', 'cafe'])

  const filled = mergeUniquePlaces([place({ phone: null })], [place({ provider: 'ola', providerPlaceId: 'x', phone: '+91 33 2229 7664' })])
  assert.equal(filled[0].provider, 'mykolkata')
  assert.equal(filled[0].phone, '+91 33 2229 7664')
})

test('Ola adapter remains disabled without a private server key', async () => {
  const provider = new OlaPlacesProvider({ apiKey: '', fetchImpl: async () => { throw new Error('must not run') } })
  assert.equal(provider.configured, false)
  assert.deepEqual(await provider.searchText({ query: 'coffee' }), [])
})

test('Ola adapter sends bounded nearby parameters and normalizes results', async () => {
  let requestedUrl
  let requestedOptions
  const provider = new OlaPlacesProvider({
    apiKey: 'private-test-key',
    baseUrl: 'https://example.test',
    requestOrigin: 'https://mykolkata.example',
    fetchImpl: async (url, options) => {
      requestedUrl = new URL(url)
      requestedOptions = options
      return {
        ok: true,
        json: async () => ({ results: [{ place_id: '1', name: 'Coffee House', lat: 22.576, lng: 88.364, types: ['cafe'] }] }),
      }
    },
  })
  const results = await provider.nearby({ lat: 22.57, lng: 88.36, radiusKm: 3, category: 'cafes' })
  assert.equal(requestedUrl.pathname, '/places/v1/nearbysearch')
  assert.equal(requestedUrl.searchParams.get('radius'), '3000')
  assert.equal(requestedUrl.searchParams.get('types').includes('cafe'), true)
  assert.equal(requestedOptions.headers.Origin, 'https://mykolkata.example')
  assert.equal(requestedOptions.headers.Referer, 'https://mykolkata.example/')
  assert.equal(typeof requestedOptions.headers['X-Request-Id'], 'string')
  assert.equal(results[0].provider, 'ola')
})

test('Ola detail enrichment name-matches an Overture place before requesting advanced details', async () => {
  const requestedPaths = []
  const provider = new OlaPlacesProvider({
    apiKey: 'private-test-key',
    baseUrl: 'https://example.test',
    fetchImpl: async (url) => {
      const requested = new URL(url)
      requestedPaths.push(requested.pathname)
      if (requested.pathname.endsWith('/autocomplete')) {
        return { ok: true, json: async () => ({ predictions: [
          { place_id: 'wrong', structured_formatting: { main_text: 'Science City' }, geometry: { location: { lat: 22.54, lng: 88.39 } }, types: ['museum'] },
          { place_id: 'correct', structured_formatting: { main_text: 'Indian Museum' }, geometry: { location: { lat: 22.5576, lng: 88.351 } }, types: ['museum'] },
        ] }) }
      }
      return { ok: true, json: async () => ({ result: { place_id: requested.searchParams.get('place_id'), name: 'Indian Museum, Kolkata', lat: 22.5576, lng: 88.351 } }) }
    },
  })
  const details = await provider.resolveDetails({ name: 'Indian Museum', lat: 22.5576, lng: 88.351 })
  assert.equal(details.providerPlaceId, 'correct')
  assert.deepEqual(requestedPaths, ['/places/v1/autocomplete', '/places/v1/details/advanced'])
})

function olaFetch(routes, calls = []) {
  return async (url) => {
    const requested = new URL(url)
    calls.push(requested)
    const route = Object.keys(routes).find((path) => requested.pathname.endsWith(path))
    if (!route) return { ok: false, status: 404, json: async () => ({}) }
    return routes[route](requested)
  }
}

test('Ola nearby asks for coordinates and covers every category when none is chosen', async () => {
  const calls = []
  const provider = new OlaPlacesProvider({
    apiKey: 'private-test-key',
    baseUrl: 'https://example.test',
    fetchImpl: olaFetch({
      '/nearbysearch': (requested) => ({ ok: true, json: async () => ({ predictions: [{
        place_id: `id-${requested.searchParams.get('types')}`,
        structured_formatting: { main_text: `Near ${requested.searchParams.get('types')}` },
        geometry: { location: { lat: 22.553, lng: 88.352 } },
        types: requested.searchParams.get('types').split(','),
      }, {
        place_id: 'no-coordinates', structured_formatting: { main_text: 'Nowhere' }, types: ['cafe'],
      }] }) }),
    }, calls),
  })

  const all = await provider.nearby({ lat: 22.5526, lng: 88.3524, radiusKm: 2, limit: 70 })
  assert.equal(calls.length, categories.length)
  assert.ok(calls.every((url) => url.searchParams.get('withCentroid') === 'true'))
  assert.ok(calls.every((url) => Number(url.searchParams.get('limit')) === 10))
  assert.equal(all.length, categories.length)
  assert.ok(all.every((place) => Number.isFinite(place.latitude)))

  calls.length = 0
  const outdoors = await provider.nearby({ lat: 22.5526, lng: 88.3524, radiusKm: 2, category: 'Outdoors', limit: 20 })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].searchParams.get('types'), 'park,zoo,natural_feature')
  assert.equal(outdoors[0].categorySlug, 'outdoors')
})

test('Ola search finds venues by name through autocomplete and survives text search failing', async () => {
  const provider = new OlaPlacesProvider({
    apiKey: 'private-test-key',
    baseUrl: 'https://example.test',
    fetchImpl: olaFetch({
      '/autocomplete': (requested) => {
        assert.equal(requested.searchParams.get('strictbounds'), 'true')
        return { ok: true, json: async () => ({ predictions: [
          { place_id: 'flurys', structured_formatting: { main_text: 'Flurys', secondary_text: '18A, Park St, Kolkata' }, geometry: { location: { lat: 22.5528, lng: 88.3524 } }, types: ['bakery'] },
          { place_id: 'hyderabad', structured_formatting: { main_text: 'Flurys Hyderabad' }, geometry: { location: { lat: 17.38, lng: 78.48 } }, types: ['bakery'] },
          { place_id: 'fragment', structured_formatting: { main_text: '47, Near Flurys' }, geometry: { location: { lat: 22.55, lng: 88.35 } }, types: [] },
        ] }) }
      },
      '/textsearch': () => ({ ok: false, status: 500, json: async () => ({}) }),
    }),
  })
  const results = await provider.search({ query: 'flurys', lat: 22.5726, lng: 88.3639 })
  assert.deepEqual(results.map((result) => result.providerPlaceId), ['flurys'])
  assert.equal(results[0].matchedBy, 'autocomplete')
})

test('the map endpoint falls back to live places inside the viewport when the catalogue is empty', async () => {
  let nearbyParams
  const service = createPlaceSearchService({
    repository: { withinBounds: async () => ({ places: [], nextCursor: null, total: 0 }) },
    provider: {
      name: 'ola',
      configured: true,
      nearby: async (params) => {
        nearbyParams = params
        return [
          place({ provider: 'ola', providerPlaceId: 'inside', latitude: 22.555, longitude: 88.355 }),
          place({ provider: 'ola', providerPlaceId: 'outside', name: 'Far', latitude: 22.7, longitude: 88.5 }),
        ]
      },
    },
  })
  const bounds = { west: 88.33, south: 22.53, east: 88.39, north: 22.58 }
  const result = await service.withinBounds({ bounds, limit: 100 })
  assert.deepEqual(result.places.map((entry) => entry.providerPlaceId), ['inside'])
  assert.equal(result.meta.source, 'ola')
  assert.ok(Math.abs(nearbyParams.lat - 22.555) < 1e-9 && nearbyParams.radiusKm > 3 && nearbyParams.radiusKm < 5)
})

test('search turns a neighbourhood into an anchor and keeps loose text matches out', async () => {
  const service = createPlaceSearchService({
    repository: { search: async () => [] },
    provider: {
      name: 'ola',
      configured: true,
      search: async () => [
        place({ provider: 'ola', providerPlaceId: 'area', name: 'Park Street Area', tags: ['borough'], matchedBy: 'autocomplete', latitude: 22.549, longitude: 88.3547 }),
        place({ provider: 'ola', providerPlaceId: 'social', name: 'Park Street Social', tags: ['restaurant'], category: 'Food', categorySlug: 'food', matchedBy: 'autocomplete' }),
        place({ provider: 'ola', providerPlaceId: 'maidan', name: 'Millennium Park', tags: ['park'], address: 'Strand Rd', matchedBy: 'text' }),
      ],
    },
  })
  const result = await service.search({ query: 'Park Street', lat: 22.5726, lng: 88.3639, limit: 20 })
  assert.equal(result.meta.area.name, 'Park Street Area')
  assert.deepEqual(result.places.map((entry) => entry.providerPlaceId), ['social'])
})

test('text results must mention every word of the query somewhere', () => {
  const roastery = place({ name: 'Roastery Coffee House', address: 'Golpark, Gariahat, Kolkata', category: 'Cafés', tags: ['cafe'] })
  assert.equal(matchesEveryWord(roastery, 'cafes in Gariahat'), true)
  assert.equal(matchesEveryWord(roastery, 'cafes in Salt Lake'), false)
  assert.equal(matchesEveryWord(place({ name: "Flury's Confectionery" }), 'flurys'), true)
})

test('a bare category word searches that category around the visitor as well as by name', async () => {
  let nearbyCategory
  const service = createPlaceSearchService({
    repository: { search: async () => [] },
    provider: {
      name: 'ola',
      configured: true,
      search: async () => [place({ provider: 'ola', providerPlaceId: 'coffee-house', name: 'Coffee House', matchedBy: 'autocomplete' })],
      nearby: async (params) => {
        nearbyCategory = params.category
        return [place({ provider: 'ola', providerPlaceId: 'mintelaa', name: 'Mintelaa', latitude: 22.542, longitude: 88.3526 })]
      },
    },
  })
  const result = await service.search({ query: 'coffee', lat: 22.5526, lng: 88.3524, limit: 20 })
  assert.equal(nearbyCategory, 'cafes')
  assert.equal(result.meta.categoryIntent.slug, 'cafes')
  assert.deepEqual(result.places.map((entry) => entry.providerPlaceId), ['coffee-house', 'mintelaa'])
})

test('Wikimedia enrichment accepts a nearby name match and preserves licence attribution', async () => {
  const provider = new WikimediaImageProvider({
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ query: { pages: [
        { title: 'File:Unrelated building.jpg', coordinates: [{ lat: 22.5576, lon: 88.351 }], imageinfo: [{ mime: 'image/jpeg', thumburl: 'https://upload.wikimedia.org/unrelated.jpg', extmetadata: {} }] },
        { title: 'File:Indian Museum Kolkata.jpg', coordinates: [{ lat: 22.5577, lon: 88.3511 }], imageinfo: [{ mime: 'image/jpeg', thumburl: 'https://upload.wikimedia.org/museum.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:Indian_Museum_Kolkata.jpg', extmetadata: { Artist: { value: '<b>Photographer</b>' }, LicenseShortName: { value: 'CC BY-SA 4.0' } } }] },
      ] } }),
    }),
  })
  const image = await provider.findImage({ name: 'Indian Museum', lat: 22.5576, lng: 88.351 })
  assert.equal(image.image, 'https://upload.wikimedia.org/museum.jpg')
  assert.equal(image.imageAttribution, 'Photographer')
  assert.equal(image.imageLicense, 'CC BY-SA 4.0')
  assert.equal(image.imageMatchConfidence, 1)
})

test('Wikimedia enrichment rejects unrelated nearby photography', async () => {
  const provider = new WikimediaImageProvider({
    fetchImpl: async () => ({ ok: true, json: async () => ({ query: { pages: [
      { title: 'File:Traffic on Chowringhee.jpg', imageinfo: [{ mime: 'image/jpeg', thumburl: 'https://upload.wikimedia.org/traffic.jpg', extmetadata: {} }] },
    ] } }) }),
  })
  const image = await provider.findImage({ name: 'Indian Museum', lat: 22.5575, lng: 88.3512 })
  assert.equal(image, null)
})

test('places without an exact photo keep an honest empty image state', () => {
  const presented = presentLivePlace(place({ image: null }))
  assert.equal(presented.image, null)
  assert.equal(presented.hasRealImage, false)
  assert.equal(presented.markerCategory, 'cafes')
})

test('repository falls back to the local catalogue when the database schema is unavailable', async () => {
  const repository = new FallbackPlaceRepository(
    { available: true, search: async () => { throw Object.assign(new Error('missing table'), { code: 'P2021' }) } },
    { available: true, search: async () => [place({ providerPlaceId: 'fallback' })] }
  )
  const originalError = console.error
  console.error = () => {}
  try {
    const results = await repository.search({ query: 'cafe' })
    assert.equal(results[0].providerPlaceId, 'fallback')
  } finally {
    console.error = originalError
  }
})

test('search uses local data first and calls the provider only when results are sparse', async () => {
  let providerCalls = 0
  const repository = {
    search: async () => [place()],
    nearby: async () => [],
  }
  const provider = {
    name: 'ola',
    configured: true,
    searchText: async () => {
      providerCalls += 1
      return [place({ provider: 'ola', providerPlaceId: '2', name: 'Mocambo' })]
    },
  }
  const service = createPlaceSearchService({ repository, provider, minimumLocalResults: 2 })
  const result = await service.search({ query: 'food', limit: 10 })
  assert.equal(providerCalls, 1)
  assert.equal(result.places.length, 2)

  const localOnly = createPlaceSearchService({ repository, provider, minimumLocalResults: 1 })
  await localOnly.search({ query: 'flurys', limit: 10 })
  assert.equal(providerCalls, 1)
})

test('provider failure degrades to local results without failing the request', async () => {
  const service = createPlaceSearchService({
    repository: { search: async () => [place()], nearby: async () => [] },
    provider: { name: 'ola', configured: true, searchText: async () => { throw new Error('private-key-value') } },
    minimumLocalResults: 8,
  })
  const originalError = console.error
  console.error = () => {}
  try {
    const result = await service.search({ query: 'cafe', limit: 10 })
    assert.equal(result.places.length, 1)
    assert.equal(result.meta.providerStatus, 'unavailable')
    assert.equal(JSON.stringify(result).includes('private-key-value'), false)
  } finally {
    console.error = originalError
  }
})

test('database failure degrades to provider results without touching the schema', async () => {
  const service = createPlaceSearchService({
    repository: {
      search: async () => { throw Object.assign(new Error('old schema'), { code: 'P2022' }) },
      nearby: async () => { throw Object.assign(new Error('old schema'), { code: 'P2022' }) },
    },
    provider: {
      name: 'ola',
      configured: true,
      searchText: async () => [place({ provider: 'ola', providerPlaceId: 'live-1' })],
      nearby: async () => [place({ provider: 'ola', providerPlaceId: 'live-1', latitude: 22.57, longitude: 88.36 })],
    },
  })
  const originalError = console.error
  console.error = () => {}
  try {
    const search = await service.search({ query: 'cafe', limit: 10 })
    assert.equal(search.places.length, 1)
    assert.equal(search.meta.localStatus, 'unavailable')
    assert.equal(search.meta.providerStatus, 'ok')

    const nearby = await service.nearby({ lat: 22.57, lng: 88.36, radiusKm: 2, limit: 10 })
    assert.equal(nearby.places.length, 1)
    assert.equal(nearby.meta.localStatus, 'unavailable')
    assert.equal(nearby.meta.providerStatus, 'ok')
  } finally {
    console.error = originalError
  }
})

test('file catalogue returns only places inside the requested viewport with a cursor', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'mykolkata-catalog-'))
  context.after(() => rm(directory, { recursive: true, force: true }))
  await mkdir(join(directory, 'tiles'))
  const places = [
    { id: 'in-1', name: 'Coffee House', category: 'cafes', latitude: 22.575, longitude: 88.365, area: 'College Street', confidence: .9, primaryType: 'cafe' },
    { id: 'in-2', name: 'Indian Museum', category: 'culture', latitude: 22.558, longitude: 88.351, area: 'Esplanade', confidence: .8, primaryType: 'museum' },
    { id: 'out-1', name: 'Outside Place', category: 'places', latitude: 22.7, longitude: 88.5, area: 'Kolkata', confidence: .9, primaryType: 'landmark' },
  ]
  await writeFile(join(directory, 'manifest.json'), JSON.stringify({ tileSize: 1, tiles: [{ key: '88_22', count: 3 }] }))
  await writeFile(join(directory, 'tiles', '88_22.json'), JSON.stringify(places))

  const repository = new FilePlaceRepository({ directory })
  const first = await repository.withinBounds({ bounds: { west: 88.3, south: 22.5, east: 88.4, north: 22.6 }, limit: 1 })
  assert.equal(first.places.length, 1)
  assert.equal(first.total, 2)
  assert.equal(first.nextCursor, '1')
  const second = await repository.withinBounds({ bounds: { west: 88.3, south: 22.5, east: 88.4, north: 22.6 }, limit: 1, cursor: first.nextCursor })
  assert.equal(second.places.length, 1)
  assert.notEqual(second.places[0].id, first.places[0].id)
})

test('request parsers reject unsafe inputs and clamp result sizes', () => {
  assert.throws(() => parseSearchQuery({ q: 'a' }), RequestValidationError)
  assert.throws(() => parseSearchQuery({ q: 'coffee', lat: '22.5' }), RequestValidationError)
  assert.throws(() => parseNearbyQuery({ lat: '200', lng: '88' }), RequestValidationError)
  assert.equal(parseSearchQuery({ q: ' coffee ', limit: '500' }).limit, 50)
  assert.equal(parseNearbyQuery({ lat: '22.57', lng: '88.36', radiusKm: '100' }).radiusKm, 25)
  assert.equal(parseBoundsQuery({ west: '88.3', south: '22.5', east: '88.4', north: '22.6', limit: '999' }).limit, 500)
  assert.throws(() => parseBoundsQuery({ west: '88.4', south: '22.5', east: '88.3', north: '22.6' }), RequestValidationError)
})

test('API handler returns a stable envelope and private cache policy', async () => {
  const GET = createPlacesRouteHandler({
    parse: parseSearchQuery,
    service: async () => ({ places: [place()], meta: { providerStatus: 'not-needed' } }),
  })
  const res = await GET(request('http://localhost/api/explore/search?q=Flurys'))
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.meta.count, 1)
  assert.match(res.headers.get('cache-control') || '', /^private/)
})

test('API handler exposes validation errors but hides service failures', async () => {
  const service = async () => { throw new Error('DATABASE_URL contains a secret') }
  const GET = createPlacesRouteHandler({ parse: parseSearchQuery, service })

  const validation = await GET(request('http://localhost/api/explore/search?q='))
  assert.equal(validation.status, 400)

  const originalError = console.error
  console.error = () => {}
  let failure
  try {
    failure = await GET(request('http://localhost/api/explore/search?q=coffee'))
  } finally {
    console.error = originalError
  }
  assert.equal(failure.status, 503)
  const body = await failure.json()
  assert.equal(JSON.stringify(body).includes('DATABASE_URL'), false)
})

test('database foundation includes provenance, editorial data, and indexed geography', async () => {
  const schema = await readFile(new URL('../prisma/schema.prisma', import.meta.url), 'utf8')
  const migration = await readFile(
    new URL('../prisma/migrations/20260910010000_explore_data_foundation/migration.sql', import.meta.url),
    'utf8'
  )
  assert.match(schema, /model PlaceSource/)
  assert.match(schema, /model Collection/)
  assert.match(schema, /model PlaceInteraction/)
  assert.match(schema, /verification\s+String\s+@default\("VERIFIED"\)/)
  assert.match(schema, /sourceUrl\s+String\?/)
  assert.match(schema, /lastVerifiedAt\s+DateTime\?/)
  assert.match(schema, /Unsupported\("geography\(Point, 4326\)"\)/)
  assert.match(migration, /CREATE EXTENSION IF NOT EXISTS postgis/)
  assert.match(migration, /USING GIST \("geo"\)/)
  assert.match(migration, /CREATE EXTENSION IF NOT EXISTS pg_trgm/)
})

test('environment template separates the public map key from private Places credentials', async () => {
  const template = await readFile(new URL('../.env.example', import.meta.url), 'utf8')
  assert.match(template, /NEXT_PUBLIC_OLA_MAPS_API_KEY=/)
  assert.match(template, /\nOLA_MAPS_API_KEY=/)
  assert.match(template, /EXPLORE_DATABASE_ENABLED="false"/)
  assert.match(template, /ANAKIN_API_KEY=/)
  assert.doesNotMatch(template, /NEXT_PUBLIC_OLA_MAPS_PLACES/)
})

test('licensed high-confidence Wikimedia images can be verified automatically', () => {
  const candidate = imageCandidateFromWikimedia({
    image: 'https://upload.wikimedia.org/example.jpg',
    imageSourceUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
    imageProvider: 'wikimedia-commons',
    imageAttribution: 'Example Author',
    imageLicense: 'CC BY-SA 4.0',
    imageMatchConfidence: 0.82,
  })
  assert.equal(candidate.verification, 'VERIFIED')
  assert.equal(candidate.kind, 'PHOTO')
})

test('official-site discovery keeps images as review candidates', async () => {
  const calls = []
  const provider = new AnakinImageProvider({
    apiKey: 'test-key',
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return {
        ok: true,
        json: async () => ({
          status: 'completed',
          cleanedHtml: '<html><head><meta property="og:title" content="Flurys Kolkata"><meta property="og:image" content="/venue.jpg"></head></html>',
        }),
      }
    },
  })
  const candidate = await provider.findImage({ name: 'Flurys', website: 'https://www.flurys.com' })
  assert.equal(candidate.verification, 'CANDIDATE')
  assert.equal(candidate.sourceUrl, 'https://www.flurys.com/')
  assert.equal(candidate.url, 'https://www.flurys.com/venue.jpg')
  assert.equal(calls.length, 1)
})

test('image extraction rejects local and private URLs', () => {
  assert.equal(safePublicUrl('http://localhost:3000/image.jpg'), null)
  assert.equal(safePublicUrl('http://192.168.1.5/image.jpg'), null)
  assert.equal(extractPageImage('<meta property="og:image" content="http://127.0.0.1/private.jpg">', 'https://example.com'), null)
})

test('data scripts require explicit write confirmations', async () => {
  const importer = await readFile(new URL('../scripts/import-place-catalog-to-db.mjs', import.meta.url), 'utf8')
  const enrichment = await readFile(new URL('../scripts/enrich-place-images.mjs', import.meta.url), 'utf8')
  assert.match(importer, /--confirm=IMPORT_EXPLORE_CATALOG/)
  assert.match(importer, /No database connection was opened/)
  assert.match(enrichment, /--confirm=WRITE_IMAGE_CANDIDATES/)
  assert.match(enrichment, /No network or database connection was opened/)
})
