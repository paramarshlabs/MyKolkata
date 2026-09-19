import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

/*
 * Supabase refreshes the session on every request so pages, route handlers and
 * Server Functions read a live one. It deliberately gates nothing: path matching
 * here can drift from how Next routes a request, so each protected resource
 * checks for itself through lib/auth.ts.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /* everything but Next internals and static files */
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|avif|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4)).*)',
    /* route handlers always, so they see a refreshed session */
    '/(api|trpc)(.*)',
  ],
}
