/* ==========================================================================
   Where to send someone after they sign in: back where they were. `next`
   rides through /login and Google to /auth/callback, so it's checked at each
   end: a path on this site only. "//host" and "/\host" are other sites to a
   browser; a path into the sign-in pages themselves would loop.
   ========================================================================== */

export const DEFAULT_AFTER_SIGN_IN = '/home'

export function safeNext(value: unknown, fallback = DEFAULT_AFTER_SIGN_IN): string {
  if (typeof value !== 'string') return fallback
  const next = value.trim()
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  if (next.length > 512 || /[\u0000-\u001f\u007f\\]/.test(next)) return fallback
  if (/^\/(?:login|signup|auth)(?:[/?#]|$)/.test(next)) return fallback
  return next
}

/* "/login?next=%2Fpujo%2Fjoin%2Fabc": sign in, then come back */
export function loginPath(next?: string | null): string {
  const target = safeNext(next, '')
  return target && target !== DEFAULT_AFTER_SIGN_IN ? `/login?next=${encodeURIComponent(target)}` : '/login'
}
