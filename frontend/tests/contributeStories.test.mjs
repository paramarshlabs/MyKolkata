// Tests for the /contribute story wall: link handling, validation, expiry and auth.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolveStoryMedia } from '../lib/stories/media.ts'
import {
  createStoryHandlers, STORY_MAX, STORY_TTL_MS, TITLE_MAX, validateStoryInput,
} from '../lib/stories/stories.ts'

const NOW = new Date('2026-09-20T10:00:00+05:30')
const HOUR = 3_600_000

function memoryRepository(rows = []) {
  let id = 0
  return {
    rows,
    /* deliberately returns everything: the handler must still drop expired rows */
    async listActive() {
      return [...rows].sort((a, b) => b.createdAt - a.createdAt)
    },
    async create(data) {
      const row = { id: `st${++id}`, ...data }
      rows.push(row)
      return row
    },
  }
}

const post = (body) => new Request('http://localhost/api/stories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

/* ---------- media resolver ------------------------------------------------ */

test('direct image URLs render from their own host', () => {
  assert.deepEqual(resolveStoryMedia('https://example.com/photos/tram.jpg?w=800'), {
    kind: 'image', src: 'https://example.com/photos/tram.jpg?w=800', url: 'https://example.com/photos/tram.jpg?w=800',
  })
  assert.equal(resolveStoryMedia('https://example.com/photos/tram.WEBP').kind, 'image')
})

test('Google Drive file links use the public thumbnail endpoint', () => {
  const id = '1AbCdEfGhIjKlMnOpQrStUv'
  for (const url of [
    `https://drive.google.com/file/d/${id}/view?usp=sharing`,
    `https://drive.google.com/open?id=${id}`,
    `https://drive.google.com/uc?export=view&id=${id}`,
  ]) {
    const media = resolveStoryMedia(url)
    assert.equal(media.kind, 'drive', url)
    assert.equal(media.src, `https://drive.google.com/thumbnail?id=${id}&sz=w1600`)
  }
  assert.equal(resolveStoryMedia('https://drive.google.com/drive/folders/abc').kind, 'link', 'folders are just links')
})

test('Instagram posts and reels use Instagram’s own embed page', () => {
  assert.equal(resolveStoryMedia('https://www.instagram.com/p/C8xYz12AbCd/').embedUrl, 'https://www.instagram.com/p/C8xYz12AbCd/embed/')
  assert.equal(resolveStoryMedia('https://instagram.com/reel/C9aBcDeFgHi/?igsh=abc').embedUrl, 'https://www.instagram.com/reel/C9aBcDeFgHi/embed/')
  assert.equal(resolveStoryMedia('https://www.instagram.com/kolkata_diaries/').kind, 'link', 'a profile is not a post')
})

test('X/Twitter posts use the official embed, from a numeric id only', () => {
  const media = resolveStoryMedia('https://x.com/someone/status/1834567890123456789?s=20')
  assert.equal(media.kind, 'x')
  assert.equal(media.embedUrl, 'https://platform.twitter.com/embed/Tweet.html?id=1834567890123456789&theme=dark&dnt=true')
  assert.equal(resolveStoryMedia('https://twitter.com/someone/status/1834567890123456789').kind, 'x')
  assert.equal(resolveStoryMedia('https://x.com/someone').kind, 'link')
})

test('embeds are only ever built on hardcoded provider domains', () => {
  const tricks = [
    'https://evil.example/instagram.com/p/C8xYz12AbCd/',
    'https://instagram.com.evil.example/p/C8xYz12AbCd/',
    'https://x.com.evil.example/a/status/1834567890123456789',
    'https://drive.google.com.evil.example/file/d/1AbCdEfGhIjKlMnOp/view',
    'https://www.instagram.com/p/%22%3E%3Cscript%3E/',
  ]
  for (const url of tricks) {
    const media = resolveStoryMedia(url)
    assert.ok(!media.embedUrl && media.kind !== 'drive', url)
  }
  assert.equal(resolveStoryMedia('javascript:alert(1)'), null)
  assert.equal(resolveStoryMedia('data:image/png;base64,AAAA'), null)
  assert.equal(resolveStoryMedia('https://example.com/some/article').kind, 'link')
})

test('embeds are sized from the height their provider reports', async () => {
  const { embedHeight } = await import('../lib/stories/media.ts')
  const x = { 'twttr.embed': { id: 'twitter-widget-0', method: 'twttr.private.resize', params: [{ width: 550, height: 612.4 }] } }
  assert.equal(embedHeight(x), 613)
  assert.equal(embedHeight(JSON.stringify(x)), 613, 'string messages too')
  assert.equal(embedHeight(JSON.stringify({ type: 'MEASURE', details: { height: 734 } })), 734)
  assert.equal(embedHeight({ 'twttr.embed': { method: 'twttr.private.trigger', params: [{ height: 600 }] } }), null, 'other X messages are ignored')
  for (const junk of [null, 'not json', 42, { type: 'MEASURE', details: { height: 99999 } }, { type: 'MEASURE', details: { height: 'tall' } }]) {
    assert.equal(embedHeight(junk), null)
  }
})

/* ---------- validation ------------------------------------------------------ */

test('input is trimmed and length-limited', () => {
  const ok = validateStoryInput({ title: '  The tram  ', story: 'Line one\r\n\r\n\r\n\r\nLine two', link: '' })
  assert.deepEqual(ok, { ok: true, value: { title: 'The tram', story: 'Line one\n\nLine two', externalUrl: null } })
  assert.equal(validateStoryInput({ title: '', story: 'x' }).ok, false)
  assert.equal(validateStoryInput({ title: 'x', story: '   ' }).ok, false)
  assert.equal(validateStoryInput({ title: 'x'.repeat(TITLE_MAX + 1), story: 'x' }).ok, false)
  assert.equal(validateStoryInput({ title: 'x', story: 'x'.repeat(STORY_MAX + 1) }).ok, false)
  assert.equal(validateStoryInput(null).ok, false)
})

test('links must be public http(s) URLs', () => {
  for (const link of ['javascript:alert(1)', 'data:text/html,hi', 'ftp://example.com/a.jpg', 'http://127.0.0.1/a.jpg', 'http://192.168.1.2/x', 'https://user:pass@example.com/', 'not a url']) {
    assert.equal(validateStoryInput({ title: 't', story: 's', link }).ok, false, link)
  }
  assert.equal(validateStoryInput({ title: 't', story: 's', link: 'https://x.com/a/status/1834567890123456789' }).value.externalUrl, 'https://x.com/a/status/1834567890123456789')
})

/* ---------- API ------------------------------------------------------------- */

test('signed-out visitors cannot post', async () => {
  const repository = memoryRepository()
  const res = await createStoryHandlers(repository, () => NOW).POST(post({ title: 't', story: 's' }), null)
  assert.equal(res.status, 401)
  assert.equal(repository.rows.length, 0)
})

test('a signed-in post is stored with a 24-hour expiry and no media', async () => {
  const repository = memoryRepository()
  const handlers = createStoryHandlers(repository, () => NOW)
  const res = await handlers.POST(post({ title: 'Tram day', story: 'Rode the 5 to Esplanade.', link: 'https://example.com/tram.jpg' }), 'user-1')
  assert.equal(res.status, 201)
  const { story } = await res.json()
  assert.equal(story.title, 'Tram day')
  assert.equal(story.externalUrl, 'https://example.com/tram.jpg')
  assert.equal(story.authorId, undefined, 'the author id stays on the server')
  assert.equal(new Date(story.expiresAt).getTime() - new Date(story.createdAt).getTime(), STORY_TTL_MS)
  assert.deepEqual(Object.keys(repository.rows[0]).sort(), ['authorId', 'createdAt', 'expiresAt', 'externalUrl', 'id', 'story', 'title'])
})

test('invalid posts are refused with a message', async () => {
  const res = await createStoryHandlers(memoryRepository(), () => NOW).POST(post({ title: 't', story: 's', link: 'javascript:alert(1)' }), 'user-1')
  assert.equal(res.status, 400)
  assert.match((await res.json()).message, /link/)
})

test('expired stories are excluded server-side, newest first', async () => {
  const repository = memoryRepository([
    { id: 'old', title: 'old', story: 's', externalUrl: null, authorId: 'a', createdAt: new Date(NOW - 25 * HOUR), expiresAt: new Date(NOW - HOUR) },
    { id: 'edge', title: 'edge', story: 's', externalUrl: null, authorId: 'a', createdAt: new Date(NOW - 24 * HOUR), expiresAt: new Date(NOW) },
    { id: 'a', title: 'a', story: 's', externalUrl: null, authorId: 'a', createdAt: new Date(NOW - 5 * HOUR), expiresAt: new Date(NOW.getTime() + 19 * HOUR) },
    { id: 'b', title: 'b', story: 's', externalUrl: null, authorId: 'a', createdAt: new Date(NOW - HOUR), expiresAt: new Date(NOW.getTime() + 23 * HOUR) },
  ])
  const res = await createStoryHandlers(repository, () => NOW).GET()
  assert.equal(res.headers.get('cache-control'), 'no-store')
  const { stories } = await res.json()
  assert.deepEqual(stories.map((story) => story.id), ['b', 'a'])
})

test('the route checks the session before writing and queries only unexpired rows', async () => {
  const route = await readFile(new URL('../app/api/stories/route.ts', import.meta.url), 'utf8')
  assert.match(route, /handlers\.POST\(request, await currentUserId\(\)\)/)
  assert.match(route, /expiresAt: \{ gt: now \}/)
  assert.match(route, /orderBy: \{ createdAt: 'desc' \}/)
})

test('submitted content is never rendered as HTML', async () => {
  for (const file of ['../app/(main)/contribute/ContributeClient.tsx', '../app/(main)/contribute/StoryMedia.tsx']) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /dangerouslySetInnerHTML/, file)
  }
  const media = await readFile(new URL('../app/(main)/contribute/StoryMedia.tsx', import.meta.url), 'utf8')
  assert.match(media, /src=\{media\.embedUrl\}/, 'iframes load only resolver-built embed URLs')
  assert.doesNotMatch(media, /src=\{media\.url\}/)
})
