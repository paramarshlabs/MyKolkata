// Tests for the single-flight in-memory cache that fronts the list endpoints.
// Run: node --test tests/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cached } from '../lib/cache.ts'

test('single-flight: concurrent misses trigger exactly one load', async () => {
  let calls = 0
  const loader = async () => { calls++; await new Promise(r => setTimeout(r, 50)); return ['row'] }
  const results = await Promise.all(Array.from({ length: 25 }, () => cached('sf', 5000, loader)))
  assert.equal(calls, 1, 'loader should run once for concurrent identical keys')
  assert.equal(results.length, 25)
  for (const r of results) assert.deepEqual(r, ['row'])
})

test('cache hit avoids re-running the loader', async () => {
  let calls = 0
  const loader = async () => { calls++; return calls }
  await cached('hit', 5000, loader)
  await cached('hit', 5000, loader)
  await cached('hit', 5000, loader)
  assert.equal(calls, 1)
})

test('entry expires after its ttl', async () => {
  let calls = 0
  const loader = async () => { calls++; return calls }
  await cached('ttl', 20, loader)
  await new Promise(r => setTimeout(r, 40))
  await cached('ttl', 20, loader)
  assert.equal(calls, 2, 'expired entry should reload')
})

test('distinct keys are cached independently', async () => {
  const a = await cached('k:a', 5000, async () => 'A')
  const b = await cached('k:b', 5000, async () => 'B')
  assert.equal(a, 'A')
  assert.equal(b, 'B')
})

test('loader rejection propagates when there is no stale value', async () => {
  await assert.rejects(
    () => cached('err', 5000, async () => { throw new Error('boom') }),
    /boom/,
  )
})

test('stale value is served when a refresh fails', async () => {
  let ok = true
  const loader = async () => { if (!ok) throw new Error('db down'); return 'good' }
  assert.equal(await cached('stale', 20, loader), 'good')
  await new Promise(r => setTimeout(r, 40)) // let it expire
  ok = false
  assert.equal(await cached('stale', 20, loader), 'good', 'should fall back to stale data')
})

test('a failed load does not wedge the key', async () => {
  let attempt = 0
  const loader = async () => { attempt++; if (attempt === 1) throw new Error('transient'); return 'recovered' }
  await assert.rejects(() => cached('recover', 5000, loader))
  assert.equal(await cached('recover', 5000, loader), 'recovered', 'inflight entry must be cleared on failure')
})
