type CacheEntry<T> = { value: T; expiresAt: number }

const store = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

export function cached<T>(key: string, ttlMs: number, loader: () => T | Promise<T>): Promise<T> {
  const hit = store.get(key) as CacheEntry<T> | undefined
  if (hit && hit.expiresAt > Date.now()) return Promise.resolve(hit.value)

  const pending = inflight.get(key) as Promise<T> | undefined
  if (pending) return pending

  const promise = Promise.resolve()
    .then(loader)
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

/* Drop a key so the next read reloads it — after a write this instance made.
   Other server instances still expire on their own TTL. */
export function invalidate(key: string) {
  store.delete(key)
}
