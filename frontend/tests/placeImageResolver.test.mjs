import assert from 'node:assert/strict'
import test from 'node:test'
import { createPlaceImageResolver } from '../lib/places/placeImageResolver.ts'
import { WikimediaImageProvider } from '../lib/places/wikimediaImageProvider.ts'

const place = (overrides = {}) => ({
  name: 'Indian Museum', provider: 'ola', providerPlaceId: 'ola-platform:1',
  latitude: 22.558, longitude: 88.351, image: null, ...overrides,
})

function fakes({ olaPhoto = false, commonsImage = true } = {}) {
  const calls = { ola: 0, commons: 0 }
  return {
    calls,
    olaProvider: {
      configured: true,
      async details() {
        calls.ola += 1
        return olaPhoto
          ? { image: '/api/explore/photo?ref=abc', imageProvider: 'ola', imageAttribution: 'Ola Maps' }
          : { image: null, imageProvider: null }
      },
    },
    commonsProvider: {
      configured: true,
      async lookupImage() {
        calls.commons += 1
        return commonsImage ? { image: 'https://upload.wikimedia.org/x.jpg', imageProvider: 'wikimedia-commons', imageLicense: 'CC BY-SA 4.0' } : null
      },
    },
  }
}

test('prefers the Ola photo and skips Commons when Ola has one', async () => {
  const { calls, ...providers } = fakes({ olaPhoto: true })
  const [result] = await createPlaceImageResolver(providers).withImages([place()])
  assert.equal(result.image, '/api/explore/photo?ref=abc')
  assert.equal(result.imageProvider, 'ola')
  assert.deepEqual(calls, { ola: 1, commons: 0 })
})

test('falls back to Commons, and remembers the answer per place', async () => {
  const { calls, ...providers } = fakes()
  const resolver = createPlaceImageResolver(providers)
  const [first] = await resolver.withImages([place()])
  const [second] = await resolver.withImages([place()])
  assert.equal(first.image, 'https://upload.wikimedia.org/x.jpg')
  assert.equal(second.image, first.image)
  assert.deepEqual(calls, { ola: 1, commons: 1 })
})

test('remembers misses too, and leaves places that already have an image alone', async () => {
  const { calls, ...providers } = fakes({ commonsImage: false })
  const resolver = createPlaceImageResolver(providers)
  const withImage = place({ providerPlaceId: 'ola-platform:2', image: 'https://example.com/a.jpg' })
  await resolver.withImages([place(), withImage])
  const [missing, kept] = await resolver.withImages([place(), withImage])
  assert.equal(missing.image, null)
  assert.equal(kept.image, 'https://example.com/a.jpg')
  assert.deepEqual(calls, { ola: 1, commons: 1 })
})

test('an Ola failure still tries Commons', async () => {
  const { calls, ...providers } = fakes()
  providers.olaProvider.details = async () => { throw new Error('Ola Places rate limit reached') }
  const [result] = await createPlaceImageResolver(providers).withImages([place()])
  assert.equal(result.image, 'https://upload.wikimedia.org/x.jpg')
  assert.equal(calls.commons, 1)
})

test('a slow lookup does not hold the list past the budget, and serves the next request', async () => {
  const { ...providers } = fakes()
  let release
  providers.commonsProvider.lookupImage = () => new Promise((resolve) => { release = () => resolve({ image: 'https://upload.wikimedia.org/slow.jpg' }) })
  const resolver = createPlaceImageResolver({ ...providers, budgetMs: 20 })
  const [first] = await resolver.withImages([place()])
  assert.equal(first.image, null)
  release()
  await new Promise((resolve) => setTimeout(resolve, 5))
  const [second] = await resolver.withImages([place()])
  assert.equal(second.image, 'https://upload.wikimedia.org/slow.jpg')
})

test('a Commons outage is retried soon rather than remembered as no photo', async () => {
  const { calls, ...providers } = fakes()
  let down = true
  const lookup = providers.commonsProvider.lookupImage
  providers.commonsProvider.lookupImage = async (params) => {
    if (down) { calls.commons += 1; throw new Error('Wikimedia Commons request timed out') }
    return lookup(params)
  }
  const realNow = Date.now
  try {
    const resolver = createPlaceImageResolver(providers)
    const [first] = await resolver.withImages([place()])
    assert.equal(first.image, null)
    down = false
    Date.now = () => realNow() + 6 * 60 * 1000
    const [second] = await resolver.withImages([place()])
    assert.equal(second.image, 'https://upload.wikimedia.org/x.jpg')
  } finally {
    Date.now = realNow
  }
})

test('after a 429, Commons is left alone until Retry-After passes, and the miss is not cached', async () => {
  let requests = 0
  const provider = new WikimediaImageProvider({
    fetchImpl: async () => {
      requests += 1
      return { ok: false, status: 429, headers: new Headers({ 'retry-after': '30' }) }
    },
  })
  await assert.rejects(provider.lookupImage({ name: 'Metcalfe Hall', lat: 22.5701, lng: 88.3491 }), /rate limited/)
  await assert.rejects(provider.lookupImage({ name: 'Indian Museum', lat: 22.5577, lng: 88.3511 }), /rate limited/)
  assert.equal(await provider.findImage({ name: 'Metcalfe Hall', lat: 22.5701, lng: 88.3491 }), null)
  assert.equal(requests, 1)
})
