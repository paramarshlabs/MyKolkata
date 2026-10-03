import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * Two layers. The proxy holds the sign-in wall in front of every app page
 * (lib/signedIn.ts), which lets pages that show everyone the same public data
 * be cached. Anything personal — a page that reads who you are, and every
 * write — still checks the verified session itself. These keep both true as
 * pages and route handlers are added.
 */

const root = new URL('../', import.meta.url)
const read = (relativePath) => readFile(new URL(relativePath, root), 'utf8')

async function filesNamed(dir, name) {
  const entries = (await readdir(new URL(dir, root), { recursive: true })).map((entry) => entry.replaceAll('\\', '/'))
  return entries
    .filter((entry) => entry === name || entry.endsWith(`/${name}`))
    .map((entry) => `${dir}${entry}`)
}

/* app/(main)/experience/swipe/matches/[id]/page.tsx → /experience/swipe/matches/x */
const routeOf = (page) => '/' + page
  .replace(/^app\/\(main\)\//, '')
  .replace(/\/?page\.tsx$/, '')
  .split('/')
  .filter((segment) => !/^\(.*\)$/.test(segment))
  .map((segment) => (segment.startsWith('[') ? 'x' : segment))
  .join('/')

/* the pages that are someone's own: they read who you are on the server */
const PERSONAL_PAGES = [
  'app/(main)/profile/page.tsx',
  'app/(main)/experience/swipe/page.tsx',
  'app/(main)/experience/swipe/matches/page.tsx',
  'app/(main)/experience/swipe/matches/[id]/page.tsx',
]

test('every app page is behind the sign-in wall, and every personal page checks the session itself', async () => {
  const { needsSignIn } = await import('../lib/signedIn.ts')
  const pages = await filesNamed('app/(main)/', 'page.tsx')
  assert.ok(pages.length >= 9, `expected the (main) pages, found ${pages.length}`)

  for (const page of pages) {
    const source = await read(page)
    assert.doesNotMatch(source, /^['"]use client['"]/m, `${page} must be a Server Component — move UI into a *Client.tsx`)
    assert.ok(needsSignIn(routeOf(page)), `${routeOf(page)} (${page}) is missing from lib/signedIn.ts`)
    if (PERSONAL_PAGES.includes(page) || /requireUser|currentUserId|cookies\(|headers\(/.test(source)) {
      /* with the path to come back to after signing in (lib/returnTo.ts) */
      assert.match(source, /await requireUser\(['`]\/[^)]*\)/, `${page} must call requireUser('/its/path')`)
    }
  }
  for (const page of PERSONAL_PAGES) assert.ok(pages.includes(page), `${page} moved — update PERSONAL_PAGES`)
})

test('the wall covers the app and leaves the public pages open', async () => {
  const { needsSignIn } = await import('../lib/signedIn.ts')
  for (const path of ['/home', '/home/', '/pujo', '/places', '/near-you', '/community', '/profile', '/experience', '/experience/swipe', '/experience/swipe/matches/abc']) {
    assert.ok(needsSignIn(path), `${path} should need sign-in`)
  }
  for (const path of ['/', '/login', '/signup', '/auth/callback', '/privacy', '/terms', '/kaash-phool', '/experience/personality', '/experience/archetypes/x', '/experience/you/t', '/experience/guess/t', '/experience/ashtami-date/t', '/homes', '/api/news']) {
    assert.ok(!needsSignIn(path), `${path} should stay open`)
  }
})

test('route handlers that write require a signed-in user', async () => {
  const handlers = await filesNamed('app/api/', 'route.ts')
  const writers = []

  for (const handler of handlers) {
    const source = await read(handler)
    if (!/export (async function|const) (POST|PUT|PATCH|DELETE)\b/.test(source)) continue
    writers.push(handler)
    assert.match(source, /await (currentUserId|requireUser)\(\)/, `${handler} writes without checking the session`)
  }

  assert.ok(writers.length > 0)
})

test('the proxy refreshes the session, and its only decision is sending the signed-out to /login', async () => {
  const proxy = await read('proxy.ts')
  const update = await read('lib/supabase/proxy.ts')

  assert.match(proxy, /export async function proxy\(request: NextRequest\)/)
  assert.match(proxy, /await updateSession\(request\)/)
  assert.match(proxy, /'\/\(api\|trpc\)\(\.\*\)'/)
  /* who is signed in comes from the verified JWT, never the bare cookie */
  assert.match(update, /await supabase\.auth\.getClaims\(\)/)
  assert.doesNotMatch(update, /getSession\(/)
  assert.match(proxy, /if \(userId \|\| !needsSignIn\(request\.nextUrl\.pathname\)\) return response/)
  assert.match(proxy, /NextResponse\.redirect\(login\)/)
  assert.match(proxy, /loginPath\(/)
  assert.doesNotMatch(proxy + update, /NextResponse\.rewrite/)
})

test('the session helpers stay server-only and verify the JWT', async () => {
  const helpers = await read('lib/auth.ts')

  assert.match(helpers, /^import 'server-only'/)
  assert.match(helpers, /auth\.getClaims\(\)/)
  assert.match(helpers, /redirect\(loginPath\(returnTo\)\)/)
  assert.match(helpers, /from '@\/lib\/returnTo'/)
})

test('the OAuth callback exchanges the PKCE code and only redirects same-origin', async () => {
  const callback = await read('app/auth/callback/route.ts')

  assert.match(callback, /exchangeCodeForSession\(code\)/)
  assert.match(callback, /safeNext\(searchParams\.get\('next'\)/)
  const returnTo = await read('lib/returnTo.ts')
  assert.match(returnTo, /next\.startsWith\('\/\/'\)/)
})

test('sign-in carries the path to come back to, through /login, Google and the callback', async () => {
  const [login, button, auth] = await Promise.all([
    read('app/(auth)/login/page.tsx'), read('components/auth/GoogleSignIn.tsx'), read('lib/auth.ts'),
  ])
  assert.match(login, /safeNext\(params\.next\)/)
  assert.match(login, /redirect\(next\)/)
  assert.match(login, /next=\{next\}/)
  assert.match(button, /signInWithGoogle\(safeNext\(next\)\)/)
  assert.match(auth, /redirect\(loginPath\(returnTo\)\)/)
})
