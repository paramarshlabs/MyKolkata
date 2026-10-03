import { revalidateTag, unstable_cache } from 'next/cache'

type CacheEntry<T> = { value: T; expiresAt: number }

const store = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

/*
 * `shared` puts Next's data cache behind the in-memory one. On Vercel every
 * serverless instance has its own Map, so under a crowd each cold instance
 * would hit the database (or Ola) on its own; the data cache is shared by all
 * of them. Its values travel as JSON: Dates are wrapped on the way in and
 * come back as Dates, but Maps, Sets and class instances do not survive, so
 * share only loaders that return plain data. Outside a Next server — the
 * tests, scripts — there is no data cache and the loader simply runs.
 */
export type CacheOptions = { shared?: boolean }

const tagOf = (key: string) => `mk:${key}`

/* {"$date": "…"} in the stored JSON is a Date */
const DATE = '$date'

export function packDates(value: unknown): unknown {
  if (value instanceof Date) return { [DATE]: value.toISOString() }
  if (Array.isArray(value)) return value.map(packDates)
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, packDates(v)]))
  }
  return value
}

export function unpackDates(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(unpackDates)
  /* plain objects only: on a miss the loader's own result comes straight back,
     and a Prisma Decimal or the like must be left as it is */
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const entries = Object.entries(value)
    if (entries.length === 1 && entries[0][0] === DATE && typeof entries[0][1] === 'string') return new Date(entries[0][1])
    return Object.fromEntries(entries.map(([k, v]) => [k, unpackDates(v)]))
  }
  return value
}

function viaDataCache<T>(key: string, ttlMs: number, loader: () => T | Promise<T>): Promise<T> {
  let ran = false
  const run = async () => { ran = true; return packDates(await loader()) }
  return unstable_cache(run, ['mk-cache', key], {
    revalidate: Math.max(1, Math.round(ttlMs / 1000)),
    /* a tag past 256 characters is ignored; only short keys get invalidated */
    tags: tagOf(key).length <= 256 ? [tagOf(key)] : [],
  })().then(unpackDates, (err) => {
    /* no incremental cache here (not running inside Next): just load */
    if (!ran) return loader()
    throw err
  }) as Promise<T>
}

export function cached<T>(key: string, ttlMs: number, loader: () => T | Promise<T>, options: CacheOptions = {}): Promise<T> {
  const hit = store.get(key) as CacheEntry<T> | undefined
  if (hit && hit.expiresAt > Date.now()) return Promise.resolve(hit.value)

  const pending = inflight.get(key) as Promise<T> | undefined
  if (pending) return pending

  const load = options.shared ? () => viaDataCache(key, ttlMs, loader) : loader

  const promise = Promise.resolve()
    .then(load)
    .then((value) => {
      store.set(key, { value, expiresAt: Date.now() + ttlMs })
      return value
    })
    .catch((err) => {
      if (hit) return hit.value
      throw err
    })
    .finally(() => inflight.delete(key))

  inflight.set(key, promise)
  return promise
}

/* Drop a key so the next read reloads it — after a write. The shared copy is
   expired too; other instances' in-memory copies still run out their TTL. */
export function invalidate(key: string) {
  store.delete(key)
  try {
    revalidateTag(tagOf(key), { expire: 0 })
  } catch {
    /* outside a Next request (tests, scripts): there is no shared copy */
  }
}
