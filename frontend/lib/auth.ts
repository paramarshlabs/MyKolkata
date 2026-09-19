import 'server-only'
import { auth } from '@clerk/nextjs/server'

/*
 * Who is signed in, decided next to the thing being protected. proxy.ts only
 * attaches the session so auth() works — it gates nothing — so every page under
 * app/(main) and every route handler that writes calls one of these itself.
 * tests/authBoundary.test.mjs keeps that true as routes are added.
 */

/* Pages and Server Functions: a signed-out visitor is sent to /login. */
export async function requireUser(): Promise<string> {
  const { userId } = await auth.protect({ unauthenticatedUrl: '/login' })
  return userId
}

/* Route handlers: the caller answers 401 itself rather than redirecting a fetch. */
export async function currentUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}
