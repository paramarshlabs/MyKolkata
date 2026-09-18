import assert from 'node:assert/strict'
import test from 'node:test'
import { KOLKATA, exploreRequest, mapHref, presentLivePlace } from '../lib/livePlaces.ts'

test('a query searches by name, and no query lists what is around the origin', () => {
  const search = new URL(exploreRequest({ query: ' flurys ', origin: KOLKATA, limit: 40 }), 'http://localhost')
  assert.equal(search.pathname, '/api/explore/search')
  assert.equal(search.searchParams.get('q'), 'flurys')
  assert.equal(search.searchParams.get('lat'), '22.57260')
  assert.equal(search.searchParams.has('radiusKm'), false)

  const nearby = new URL(exploreRequest({ category: 'Cafés', origin: { lat: 22.55, lng: 88.35 }, radiusKm: 2.5 }), 'http://localhost')
  assert.equal(nearby.pathname, '/api/explore/nearby')
  assert.equal(nearby.searchParams.get('category'), 'Cafés')
  assert.equal(nearby.searchParams.get('radiusKm'), '2.5')

  const everything = new URL(exploreRequest({ category: 'All' }), 'http://localhost')
  assert.equal(everything.searchParams.has('category'), false)
})

test('map links reopen the same context', () => {
  const href = new URL(mapHref({ query: 'biryani', category: 'Food', origin: { lat: 22.5, lng: 88.3 }, label: 'Park Street Area', select: 'ola-platform:1' }), 'http://localhost')
  assert.equal(href.pathname, '/near-you')
  assert.equal(href.searchParams.get('view'), 'map')
  assert.equal(href.searchParams.get('q'), 'biryani')
  assert.equal(href.searchParams.get('category'), 'Food')
  assert.equal(href.searchParams.get('near'), 'Park Street Area')
  assert.equal(href.searchParams.get('select'), 'ola-platform:1')
  assert.equal(new URL(mapHref({ locate: true }), 'http://localhost').searchParams.get('locate'), '1')
  const withYou = new URL(mapHref({ origin: { lat: 22.57, lng: 88.36 }, locate: true }), 'http://localhost')
  assert.equal(withYou.searchParams.get('locate'), '1')
  assert.equal(withYou.searchParams.get('lat'), '22.57000')
  assert.equal(withYou.searchParams.get('lng'), '88.36000')
})

test('live places carry no invented description and use their category icon', () => {
  const presented = presentLivePlace({
    providerPlaceId: 'ola-platform:1', name: 'Princep Ghat', categorySlug: 'outdoors', category: 'Outdoors',
    latitude: 22.555, longitude: 88.33, distanceKm: 0.42, address: 'Strand Rd, Hastings, Kolkata',
  })
  assert.equal(presented.description, null)
  assert.equal(presented.icon, 'boat')
  assert.equal(presented.markerCategory, 'outdoors')
  assert.equal(presented.distance, '400 m')
  assert.equal(presented.area, 'Hastings')
})
