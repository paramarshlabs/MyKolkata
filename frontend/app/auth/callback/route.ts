import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/*
 * Google hands the visitor back here with a one-time code. Exchanging it (PKCE —
 * the verifier was left in a cookie by signInWithOAuth) writes the session cookie.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const requested = searchParams.get('next') ?? '/home'
  /* same-origin paths only — '//host' would be an open redirect */
  const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/home'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      if (process.env.NODE_ENV !== 'development' && forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
