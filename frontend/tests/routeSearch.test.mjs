// Tests for the /pujo route search: plain text, patterns, and the ways a pattern can go wrong.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { QUERY_MAX, ROUTE_COUNT, searchRoutes, toMatcher } from '../lib/pujo-personality/routeSearch.ts'

const ids = (query) => searchRoutes(query).hits.map((hit) => hit.route.id)

test('an empty query finds nothing, rather than everything', () => {
  assert.deepEqual(searchRoutes('').hits, [])
  assert.deepEqual(searchRoutes('   ').hits, [])
})

test('a pandal finds the routes that stop there, and marks the stop', () => {
  const { hits } = searchRoutes('bagbazar sarbojanin')
  const night = hits.find((hit) => hit.route.id === 'nabami-nishi-north')
  assert.ok(night, 'the Navami night route passes Bagbazar')
  assert.ok(night.stops.length > 0)
  for (const i of night.stops) assert.match(night.route.stops[i].name, /bagbazar/i)
})

test('matching ignores case and reads the day, zone and title too', () => {
  assert.ok(ids('NAVAMI').includes('nabami-nishi-north'))
  assert.ok(ids('after the adda').includes('after-the-adda-south'))
})

test('a regular expression works as one', () => {
  const either = new Set(ids('saptami|ashtami'))
  assert.ok(either.has('after-the-adda-south'), 'Ashtami')
  assert.ok(either.has('three-am-central'), 'Saptami')
  assert.equal(searchRoutes('saptami|ashtami').mode, 'pattern')
  assert.ok(ids('^the south arc$').includes('south-arc'), 'anchors apply to a whole field')
})

test('a broken pattern is searched as plain text, never thrown', () => {
  for (const query of ['(', 'ghat[', '*', '+park']) {
    assert.doesNotThrow(() => searchRoutes(query))
    assert.equal(searchRoutes(query).mode, 'text', query)
  }
})

test('a pattern that matches empty text does not list every route', () => {
  for (const query of ['|', 'x*', '()']) {
    const { hits, mode } = searchRoutes(query)
    assert.equal(mode, 'text', query)
    assert.ok(hits.length < ROUTE_COUNT, query)
  }
})

test('a shared route appears once, with every archetype it was written for', () => {
  const all = searchRoutes('.').hits
  assert.equal(new Set(all.map((hit) => hit.route.id)).size, all.length)
  assert.equal(all.length, ROUTE_COUNT)
  assert.ok(all.every((hit) => hit.archetypes.length >= 1))
})

test('the query is capped', () => {
  const long = 'a'.repeat(QUERY_MAX + 50)
  assert.ok(toMatcher(long))
  assert.doesNotThrow(() => searchRoutes(long))
})
