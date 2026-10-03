import { NextResponse, type NextRequest } from 'next/server'
import { loginPath } from '@/lib/returnTo'
import { needsSignIn } from '@/lib/signedIn'
import { updateSession } from '@/lib/supabase/proxy'

/*
 * Every request: Supabase refreshes the session so pages, route handlers and
 * Server Functions read a live one.
 *
 * The app's pages (app/(main)) are behind a sign-in wall, held here rather
 * than in each page (lib/signedIn.ts). A page that reads no session renders the
 * same for everyone, so it can be prerendered and served from the CDN — and on
 * Vercel the proxy runs before the CDN, so a cached page still only reaches
 * someone signed in. What those pages show is the city's public data; anything
 * that is someone's own (their profile, the swipe deck, their matches and
 * chats, every write) still checks the verified session itself through
 * lib/auth.ts, so a path that slipped past the wall would expose nothing
 * personal.
 */
export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request)
  if (userId || !needsSignIn(request.nextUrl.pathname)) return response

  const login = new URL(loginPath(request.nextUrl.pathname + request.nextUrl.search), request.url)
  const redirect = NextResponse.redirect(login)
  /* a session that just ended still has its cookies cleared */
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
  redirect.headers.set('Cache-Control', 'private, no-store')
  return redirect
}

export const config = {
  matcher: [
    /* everything but Next internals, static files, and the public pages that
       never read a session (app/(open), the share images, robots and sitemap),
       so those are served without a Supabase round-trip in front of them */
    '/((?!_next|privacy$|terms$|kaash-phool$|experience/(?:personality|archetypes|you|guess|ashtami-date)(?:/|$)|opengraph-image|twitter-image|robots\.txt$|sitemap\.xml$|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|avif|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4)).*)',
    /* route handlers always, so they see a refreshed session */
    '/(api|trpc)(.*)',
  ],
}
