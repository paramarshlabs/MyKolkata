/*
 * What the Pujo Personality keeps on the phone, and nowhere else.
 *
 * sessionStorage holds a quiz in progress, so a refresh carries on where it
 * stopped. localStorage holds the result, so the reveal is still there
 * tomorrow. Under 18, the result stays in sessionStorage only. Every read and
 * write is wrapped: private windows and blocked storage just mean nothing is
 * remembered.
 */

type Store = 'local' | 'session'

const PREFIX = 'mk.pujo.'

function storage(store: Store): Storage | null {
  try {
    return store === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function readRaw(store: Store, key: string): string | null {
  try {
    return storage(store)?.getItem(PREFIX + key) ?? null
  } catch {
    return null
  }
}

export function readStored<T>(store: Store, key: string): T | null {
  try {
    const raw = readRaw(store, key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeStored(store: Store, key: string, value: unknown): void {
  try {
    storage(store)?.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* full, blocked or private: the quiz still works */
  }
}

export function removeStored(store: Store, key: string): void {
  try {
    storage(store)?.removeItem(PREFIX + key)
  } catch {
    /* nothing to remove */
  }
}

/* "Delete my Pujo": every key this feature has written, in both stores. */
export function clearAllStored(): void {
  for (const store of ['local', 'session'] as const) {
    const s = storage(store)
    if (!s) continue
    try {
      for (const key of Object.keys(s)) if (key.startsWith(PREFIX)) s.removeItem(key)
    } catch {
      /* as above */
    }
  }
}
