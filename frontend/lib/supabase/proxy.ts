import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/*
 * Refreshes the Supabase session cookie on the way in and hands the new one to
 * both the request (for this render) and the response (for the browser), and
 * says who is signed in (the verified JWT's subject) so proxy.ts can hold the
 * sign-in wall. Anything personal still checks for itself — see lib/auth.ts.
 */
export async function updateSession(request: NextRequest): Promise<{ response: NextResponse; userId: string | null }> {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          /* keeps a CDN from caching one visitor's refreshed session for another */
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
        },
      },
    },
  )

  /* Nothing may run between creating the client and this call, or sessions drop at random. */
  const { data, error } = await supabase.auth.getClaims()

  return { response, userId: error ? null : data?.claims.sub ?? null }
}
