/* ==========================================================================
   The sign-in wall: the app's pages (app/(main)) that need someone signed in.
   proxy.ts holds it, before the CDN, so a page that reads no session can be
   prerendered and cached and still only reach someone signed in.
   tests/authBoundary.test.mjs keeps these lists in step with app/(main).
   ========================================================================== */

/* these and everything under them */
export const SIGNED_IN_SECTIONS = ['/home', '/pujo', '/places', '/near-you', '/community', '/profile', '/about-creator', '/transport', '/share', '/experience/swipe']

/* only these exact paths: /experience/personality and the share pages under
   /experience are public (app/(open)) */
export const SIGNED_IN_PAGES = ['/experience']

export function needsSignIn(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return SIGNED_IN_PAGES.includes(path) || SIGNED_IN_SECTIONS.some((section) => path === section || path.startsWith(`${section}/`))
}
