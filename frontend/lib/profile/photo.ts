/*
 * A person's photo: the one Google gave us when they signed in, until they put
 * up their own. Their own lives in a private bucket under a random name, kept
 * in app_metadata.photo (which only the server can write). Either way the
 * browser reads it from /api/profile/photo, same-origin, so a share card can
 * draw it onto a canvas without the canvas refusing to export.
 *
 * Shared by the server and the browser: nothing here touches a key.
 */

export const PHOTO_ROUTE = '/api/profile/photo'

export const PHOTO_LIMITS = {
  /* what the phone uploads: a square, redrawn as a fresh JPEG */
  edge: 640,
  quality: 0.88,
  minEdge: 160,
  maxEdge: 1200,
  maxBytes: 2 * 1024 * 1024,
}

/* random, so nothing about the person is in the path */
const KEY = /^[0-9a-f-]{36}\.jpg$/

export const isPhotoKey = (value: unknown): value is string => typeof value === 'string' && KEY.test(value)

/* The browser's address for a photo; the key changes with every upload, so it can be cached for long. */
export function photoSrc(custom: string | null, google: string | null): string | null {
  if (custom) return `${PHOTO_ROUTE}?v=${encodeURIComponent(custom.replace(/\.jpg$/, ''))}`
  return google
}

/* Google's avatar, at a size worth printing on a card. Only Google's own photo hosts. */
export function googlePhotoAt(raw: unknown, size = 512): string | null {
  if (typeof raw !== 'string') return null
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || !/(^|\.)googleusercontent\.com$/.test(url.hostname)) return null
  /* lh3.googleusercontent.com/a/…=s96-c: the suffix sets the size */
  url.pathname = /=s\d+(-c)?$/.test(url.pathname)
    ? url.pathname.replace(/=s\d+(-c)?$/, `=s${size}-c`)
    : `${url.pathname}=s${size}-c`
  return url.toString()
}

/* The first word of an account name, as a card's default name. */
export function firstName(fullName: string | null | undefined): string {
  return (fullName ?? '').trim().split(/\s+/)[0] ?? ''
}
