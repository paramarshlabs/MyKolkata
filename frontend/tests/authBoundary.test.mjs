import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * The proxy attaches the session and gates nothing, so protection lives on each
 * resource. These keep that true as pages and route handlers are added.
 */

const root = new URL('../', import.meta.url)
const read = (relativePath) => readFile(new URL(relativePath, root), 'utf8')

async function filesNamed(dir, name) {
  const entries = await readdir(new URL(dir, root), { recursive: true })
  return entries
    .filter((entry) => entry === name || entry.endsWith(`/${name}`))
    .map((entry) => `${dir}${entry}`)
}

test('every signed-in page checks the session on the server itself', async () => {
  const pages = await filesNamed('app/(main)/', 'page.tsx')
  assert.ok(pages.length >= 9, `expected the (main) pages, found ${pages.length}`)

  for (const page of pages) {
    const source = await read(page)
    assert.doesNotMatch(source, /^['"]use client['"]/m, `${page} must be a Server Component — move UI into a *Client.tsx`)
    assert.match(source, /await requireUser\(\)/, `${page} must call requireUser()`)
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

test('the proxy runs Clerk on pages and API routes but makes no path-based auth decisions', async () => {
  const proxy = await read('proxy.ts')

  assert.match(proxy, /export default clerkMiddleware\(\)/)
  assert.doesNotMatch(proxy, /createRouteMatcher|auth\.protect/)
  assert.match(proxy, /'\/\(api\|trpc\)\(\.\*\)'/)
})

test('the session helpers stay server-only', async () => {
  const helpers = await read('lib/auth.ts')

  assert.match(helpers, /^import 'server-only'/)
  assert.match(helpers, /auth\.protect\(\{ unauthenticatedUrl: '\/login' \}\)/)
})
