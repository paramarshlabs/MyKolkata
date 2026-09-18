import { clerkMiddleware } from '@clerk/nextjs/server'

/*
 * Clerk reads the session on every request so auth() works in pages, route
 * handlers and Server Functions. It deliberately gates nothing: path matching
 * here can drift from how Next routes a request, so each protected resource
 * checks for itself through lib/auth.ts.
 */
export default clerkMiddleware()

export const config = {
  matcher: [
    /* everything but Next internals and static files */
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|avif|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    /* route handlers always, so they can call auth() */
    '/(api|trpc)(.*)',
  ],
}
