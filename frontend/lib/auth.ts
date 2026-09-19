import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/*
 * Who is signed in, decided next to the thing being protected. proxy.ts only
 * refreshes the session cookie — it gates nothing — so every page under
 * app/(main) and every route handler that writes calls one of these itself.
 * tests/authBoundary.test.mjs keeps that true as routes are added.
 *
 * getClaims() verifies the JWT signature; getSession() would trust the cookie.
 */

/* Route handlers: the caller answers 401 itself rather than redirecting a fetch. */
export async function currentUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims.sub) return null
  return data.claims.sub
}

/* Pages and Server Functions: a signed-out visitor is sent to /login. */
export async function requireUser(): Promise<string> {
  const userId = await currentUserId()
  if (!userId) redirect('/login')
  return userId
}
