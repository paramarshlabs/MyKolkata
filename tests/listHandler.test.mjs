// Tests for the shared catalogue list helpers: limit clamping, cache headers, error hygiene.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { catalogueJsonResponse, listCatalogue, parseLimit } from '../lib/catalogue/list.ts'

let n = 0
const delegateReturning = (rows) => ({
  findMany: async (args) => {
    delegateReturning.lastArgs = args
    return rows
  },
})

test('parseLimit applies a default when none is given', () => {
  assert.equal(parseLimit(new URLSearchParams()), 100)
})

test('parseLimit clamps an oversized limit to the maximum', () => {
  assert.equal(parseLimit(new URLSearchParams('limit=99999')), 500)
})

test('parseLimit rejects a nonsense limit by falling back to the default', () => {
  assert.equal(parseLimit(new URLSearchParams('limit=abc')), 100)
})

test('listCatalogue orders newest first and applies take', async () => {
  const d = delegateReturning([])
  await listCatalogue(d, `k${n++}`, 42)
  assert.equal(delegateReturning.lastArgs.take, 42)
  assert.deepEqual(delegateReturning.lastArgs.orderBy, { createdAt: 'desc' })
})

test('listCatalogue adds the _id alias the client expects', async () => {
  const payload = await listCatalogue(delegateReturning([{ id: 'abc', name: 'x' }]), `k${n++}`, 10)
  assert.equal(payload[0]._id, 'abc')
  assert.equal(payload[0].id, 'abc')
})

test('catalogueJsonResponse sets a CDN cache-control header on success', async () => {
  const res = await catalogueJsonResponse(
    delegateReturning([{ id: 'a' }]),
    `k${n++}`,
    new URLSearchParams(),
  )
  assert.equal(res.status, 200)
  const cacheControl = res.headers.get('cache-control') || ''
  assert.match(cacheControl, /s-maxage=\d+/)
  assert.match(cacheControl, /stale-while-revalidate=\d+/)
})

test('catalogueJsonResponse does not leak internal error details', async () => {
  const failing = {
    findMany: async () => {
      throw new Error('connect ECONNREFUSED 10.0.0.1:5432')
    },
  }
  const res = await catalogueJsonResponse(failing, `k${n++}`, new URLSearchParams())
  assert.equal(res.status, 500)
  const body = await res.json()
  assert.equal(body.message, 'Internal server error')
  assert.doesNotMatch(JSON.stringify(body), /ECONNREFUSED|5432/)
})
