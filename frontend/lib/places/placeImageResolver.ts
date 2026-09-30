// @ts-nocheck
import { placeIdentityKey } from './normalizePlace'
import { normalizeText } from './taxonomy'

/* a found photo rarely changes; a miss is retried sooner in case a source fills in */
const FOUND_TTL_MS = 24 * 60 * 60 * 1000
const MISSING_TTL_MS = 6 * 60 * 60 * 1000
/* a failed lookup (timeout, rate limit) is retried on a later request */
const FAILED_TTL_MS = 5 * 60 * 1000
const MAX_ENTRIES = 5000

const IMAGE_FIELDS = ['image', 'imageSourceUrl', 'imageAttribution', 'imageLicense', 'imageProvider']

function imageFields(source) {
  if (!source?.image) return null
  return Object.fromEntries(IMAGE_FIELDS.filter((field) => source[field]).map((field) => [field, source[field]]))
}

/* runs at most `concurrency` tasks at once; the rest wait their turn */
function createLimiter(concurrency) {
  const queue = []
  let running = 0
  function drain() {
    while (running < concurrency && queue.length) {
      const { task, resolve, reject } = queue.shift()
      running += 1
      Promise.resolve().then(task).then(resolve, reject).finally(() => {
        running -= 1
        drain()
      })
    }
  }
  return (task) => new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject })
    drain()
  })
}

function cacheKey(place) {
  const identity = place.provider && place.providerPlaceId
    ? placeIdentityKey(place)
    : `${normalizeText(place.name)}:${place.latitude?.toFixed(4)}:${place.longitude?.toFixed(4)}`
  return `place-image:${identity}`
}

/* Lists come back from search without photos. This fills `image` server-side:
   the place's own Ola photo first, then a matching Wikimedia Commons photo.
   Answers are remembered per place, so a list only waits on places it has
   never seen — and never longer than `budgetMs`; lookups still running then
   finish in the background and serve the next request. */
export function createPlaceImageResolver({
  olaProvider,
  commonsProvider,
  olaConcurrency = 6,
  /* Commons answers a burst from one client with 429s, so it goes gently */
  commonsConcurrency = 4,
  budgetMs = 2500,
  maxLookups = 24,
} = {}) {
  const store = new Map()
  const inflight = new Map()
  const olaSlot = createLimiter(olaConcurrency)
  const commonsSlot = createLimiter(commonsConcurrency)

  function remember(key, value, ttlMs) {
    if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value)
    store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  function known(key) {
    const hit = store.get(key)
    if (!hit) return undefined
    if (hit.expiresAt > Date.now()) return hit.value
    store.delete(key)
    return undefined
  }

  async function lookup(place) {
    let failed = false
    if (place.provider === 'ola' && place.providerPlaceId && olaProvider?.configured) {
      try {
        const details = await olaSlot(() => olaProvider.details(place.providerPlaceId))
        if (details?.imageProvider === 'ola') return { value: imageFields(details), failed }
      } catch (error) {
        failed = true
        console.error(`[places:image] ola ${error?.message || 'unavailable'}`)
      }
    }
    if (commonsProvider?.configured) {
      try {
        const commons = await commonsSlot(() => commonsProvider.lookupImage({ name: place.name, lat: place.latitude, lng: place.longitude }))
        if (commons?.image) return { value: imageFields(commons), failed: false }
      } catch (error) {
        failed = true
        /* the 429 itself was logged once; the cool-down that follows needn't be */
        if (!/rate limited$/.test(error?.message || '')) console.error(`[places:image] commons ${error?.message || 'unavailable'}`)
      }
    }
    return { value: null, failed }
  }

  function resolveOne(place) {
    const key = cacheKey(place)
    const pending = inflight.get(key)
    if (pending) return pending
    const promise = lookup(place)
      .then(({ value, failed }) => {
        remember(key, value, value ? FOUND_TTL_MS : failed ? FAILED_TTL_MS : MISSING_TTL_MS)
        return value
      })
      .catch((error) => {
        console.error(`[places:image] ${error?.message || 'unavailable'}`)
        remember(key, null, FAILED_TTL_MS)
        return null
      })
      .finally(() => inflight.delete(key))
    inflight.set(key, promise)
    return promise
  }

  return {
    async withImages(places) {
      if (!places?.length) return places
      const resolved = new Map()
      const lookups = []
      for (const [index, place] of places.entries()) {
        if (place.image || !place.name || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) continue
        const key = cacheKey(place)
        const hit = known(key)
        if (hit !== undefined) {
          if (hit) resolved.set(index, hit)
        } else if (lookups.length < maxLookups) {
          lookups.push(resolveOne(place).then((value) => { if (value) resolved.set(index, value) }))
        }
      }

      if (lookups.length) {
        let timer
        const budget = new Promise((resolve) => { timer = setTimeout(resolve, budgetMs) })
        await Promise.race([Promise.allSettled(lookups), budget])
        clearTimeout(timer)
      }

      if (!resolved.size) return places
      return places.map((place, index) => (resolved.has(index) ? { ...place, ...resolved.get(index) } : place))
    },
  }
}
