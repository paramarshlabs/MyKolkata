import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isAllowedOlaMapsPath,
  proxiedOlaMapsUrl,
  rewriteOlaMapsUrls,
} from '../lib/places/olaMapsProxy.ts'

test('only Ola tile paths can be proxied', () => {
  assert.equal(isAllowedOlaMapsPath('tiles/vector/v1/styles/default-dark-standard/style.json'), true)
  assert.equal(isAllowedOlaMapsPath('tiles/raster/v1/styles/x'), true)
  assert.equal(isAllowedOlaMapsPath('places/v1/nearbysearch'), false)
  assert.equal(isAllowedOlaMapsPath('../tiles/vector/secret'), false)
})

test('style JSON rewrites absolute Ola hosts onto the local proxy', () => {
  const rewritten = rewriteOlaMapsUrls('{"url":"https://api.olamaps.io/tiles/vector/v1/data/planet.json"}')
  assert.equal(rewritten, '{"url":"/api/maps/ola/tiles/vector/v1/data/planet.json"}')
})

test('style JSON rewrites onto an absolute proxy origin when one is given', () => {
  const rewritten = rewriteOlaMapsUrls('{"sprite":"https://api.olamaps.io/tiles/vector/v1/styles/x/sprite"}', 'http://192.168.1.5:3000')
  assert.equal(rewritten, '{"sprite":"http://192.168.1.5:3000/api/maps/ola/tiles/vector/v1/styles/x/sprite"}')
})

test('browser transformRequest sends leftover Ola hosts through the proxy', () => {
  const proxied = proxiedOlaMapsUrl('https://api.olamaps.io/tiles/vector/v1/data/planet.json?api_key=secret')
  assert.match(proxied, /\/api\/maps\/ola\/tiles\/vector\/v1\/data\/planet\.json$/)
  assert.doesNotMatch(proxied, /api_key=secret/)
})
