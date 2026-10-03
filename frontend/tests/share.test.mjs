// A shared Instagram post → the place it's about (lib/share). Real captions, fixture places.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { captionFrom, findInstagramPost, metaContent, placeCandidates, splitHandle } from '../lib/share/instagram.ts'
import { createShareResolver, matchPlace, matchPujo } from '../lib/share/resolve.ts'

/* the head of a real reel page, as Instagram serves it to a link preview */
const HOWRAH_REEL = '<head><meta property="og:description" content="285K likes, 479 comments - ig.sandyy19 on July 25, 2026: &quot;That&#x2019;s how &#x995;&#x9b2;&#x995;&#x9be;&#x9a4;&#x9be; sounds to me &#x1f90c;&#x2764;&#xfe0f;\n.\n.\n.\nFollow &#064;ig.sandyy19 for more such contents &#x2764;&#xfe0f;\n.\n.\n.\n#kolkata #fyp #explore #relatable #instagram \n.\n.\n.\n[ Kolkata , Howrah Bridge , Victoria Memorial , Calcutta , Bengali song , Dev Song , Nostalgic, Aesthetic , Sunset , Rain , North Kolkata , Couple , Love , Explore , Fyp ]&quot;. " /></head>'

const page = (author, caption) =>
  `<meta property="og:description" content="1,204 likes, 33 comments - ${author} on October 2, 2026: &quot;${caption.replaceAll('"', '&quot;')}&quot;. " />`

const PUJOS = [
  { slug: 'bagbazar-sarbojanin', name: 'Bagbazar Sarbojanin', fullName: 'Bagbazar Sarbojanin Durgotsab O Pradarshani', famous: true },
  { slug: 'bagbazar-pally', name: 'Bagbazar Pally', fullName: 'Bagbazar Pally Durgotsab Committee', famous: false },
  { slug: 'santosh-mitra-square', name: 'Santosh Mitra Square', fullName: 'Santosh Mitra Square Sarbojanin', famous: true },
]
const PLACES = {
  'howrah bridge': [{ id: 'howrah-bridge', name: 'Howrah Bridge' }],
  'peter cat': [{ id: 'peter-cat', name: 'Peter Cat' }, { id: 'peter-cat-lane-cafe', name: 'Cafe on Peter Cat Lane' }],
}

function resolver({ html = null, places = PLACES } = {}) {
  const searched = []
  const resolve = createShareResolver({
    fetchPostHtml: async () => html,
    pujos: async () => PUJOS,
    searchPlaces: async (query) => { searched.push(query); return places[query.toLowerCase()] ?? [] },
    placeHref: (query, place) => `/near-you?q=${encodeURIComponent(query)}&select=${place.id}`,
  })
  return { resolve, searched }
}

test('finds the post in whatever the share sheet sends', () => {
  assert.equal(findInstagramPost('https://www.instagram.com/reel/DbOMx8kzWcB/?igsh=abc')?.code, 'DbOMx8kzWcB')
  assert.equal(findInstagramPost(null, 'Look at this! https://instagram.com/p/DcNnQ82B7hb/ 😍')?.url, 'https://www.instagram.com/p/DcNnQ82B7hb/')
  assert.equal(findInstagramPost('https://www.instagram.com/ig.sandyy19/reel/DbOMx8kzWcB/')?.kind, 'reel')
  assert.equal(findInstagramPost('https://www.instagram.com/reels/DbOMx8kzWcB')?.kind, 'reel')
  assert.equal(findInstagramPost('https://www.instagram.com/mykolkata._/'), null, 'a profile is not a post')
  assert.equal(findInstagramPost('https://evil.example/instagram.com/p/AAAAAA'), null)
  assert.equal(findInstagramPost(undefined, '', null), null)
})

test('reads the caption out of a link preview', () => {
  const { author, caption } = captionFrom(metaContent(HOWRAH_REEL, 'og:description'))
  assert.equal(author, 'ig.sandyy19')
  assert.match(caption, /^That’s how কলকাতা sounds/)
  assert.match(caption, /Howrah Bridge , Victoria Memorial/)
})

test('place names from a caption, best first, nothing generic', () => {
  const { author, caption } = captionFrom(metaContent(HOWRAH_REEL, 'og:description'))
  const names = placeCandidates({ caption, author })
  assert.deepEqual(names.slice(0, 2), ['Howrah Bridge', 'Victoria Memorial'])
  for (const generic of ['Kolkata', 'Calcutta', 'Fyp', 'Explore', 'ig sandyy19']) assert.ok(!names.includes(generic), generic)

  assert.deepEqual(placeCandidates({ caption: 'Best kosha mangsho 🤤\n📍 Peter Cat, Park Street\n#kolkatafood' }).slice(0, 2), ['Peter Cat, Park Street', 'Peter Cat'])
  assert.deepEqual(placeCandidates({ caption: 'Location: Flurys' }), ['Flurys'])
  assert.deepEqual(placeCandidates({ caption: 'Brunch at @PeterCatKolkata! #ParkStreet #foodie', author: 'someone' }), ['Peter Cat', 'Park Street'])
  assert.equal(splitHandle('flurys_official'), 'flurys')
  assert.equal(splitHandle('petercat.kol'), 'petercat')
  assert.equal(splitHandle('BagbazarSarbojanin'), 'Bagbazar Sarbojanin')
  assert.equal(splitHandle('#Musical'), 'Musical')
})

test('a pujo by its name, or its tag run together; the famous one first', () => {
  assert.equal(matchPujo('Bagbazar', PUJOS)?.slug, 'bagbazar-sarbojanin')
  assert.equal(matchPujo('Bagbazar Pally', PUJOS)?.slug, 'bagbazar-pally')
  assert.equal(matchPujo('bagbazarsarbojanin', PUJOS)?.slug, 'bagbazar-sarbojanin')
  assert.equal(matchPujo('Santosh Mitra Square', PUJOS)?.slug, 'santosh-mitra-square')
  assert.equal(matchPujo('Sarbojanin', PUJOS), null, 'every committee has the word')
  assert.equal(matchPujo('Howrah Bridge', PUJOS), null)
})

test('a place by its name, never by a street named after it', () => {
  assert.equal(matchPlace('Peter Cat', PLACES['peter cat'])?.id, 'peter-cat')
  assert.equal(matchPlace('Peter Cat, Park Street', PLACES['peter cat'])?.id, 'peter-cat')
  assert.equal(matchPlace('Peter Cat', [{ id: 'x', name: 'Cafe on Peter Cat Lane' }]), null)
})

test('the Howrah Bridge reel opens Howrah Bridge on the map', async () => {
  const { resolve, searched } = resolver({ html: HOWRAH_REEL })
  const result = await resolve(findInstagramPost('https://www.instagram.com/reel/DbOMx8kzWcB/'))
  assert.deepEqual(result, { kind: 'place', href: '/near-you?q=Howrah%20Bridge&select=howrah-bridge', name: 'Howrah Bridge', from: 'Howrah Bridge' })
  assert.deepEqual(searched, ['Howrah Bridge'], 'stops at the first place found')
})

test('a pandal reel opens the pujo, before any café of the same name', async () => {
  const html = page('pandalhopper', 'Ashtami night at #BagbazarSarbojanin 🙏 the thakur this year! #durgapuja #pandalhopping')
  const { resolve, searched } = resolver({ html })
  const result = await resolve(findInstagramPost('https://www.instagram.com/p/Bagbz12345/'))
  assert.deepEqual(result, { kind: 'pujo', href: '/pujo?pandal=bagbazar-sarbojanin', name: 'Bagbazar Sarbojanin', from: 'Bagbazar Sarbojanin' })
  assert.deepEqual(searched, [], 'the places provider was never asked')
})

test('when Instagram says nothing, the shared text is used', async () => {
  const { resolve } = resolver({ html: null })
  const post = findInstagramPost('https://www.instagram.com/p/PeterC1234/')
  const result = await resolve(post, { text: 'Lunch 📍 Peter Cat https://www.instagram.com/p/PeterC1234/' })
  assert.equal(result.kind, 'place')
  assert.equal(result.name, 'Peter Cat')
})

test('a post that names nowhere offers its names to search', async () => {
  const html = page('someone', 'Golden hour 🌇 [ Sunset , Ghats Of Old Town ]')
  const { resolve } = resolver({ html })
  assert.deepEqual(await resolve(findInstagramPost('https://www.instagram.com/p/Nowhere123/')), { kind: 'none', guesses: ['Ghats Of Old Town'] })
  const silent = resolver({ html: page('someone', '🥹❤️') })
  assert.deepEqual(await silent.resolve(findInstagramPost('https://www.instagram.com/p/Nowhere123/')), { kind: 'none', guesses: [] })
})

test('Android lists the app in its share sheet: the manifest shares to /share', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/manifest.json', import.meta.url), 'utf8'))
  assert.deepEqual(manifest.share_target, { action: '/share', method: 'GET', params: { title: 'title', text: 'text', url: 'url' } })
  /* install needs a 192 and a 512 icon that really are those sizes */
  for (const { src, sizes } of manifest.icons) {
    const png = await readFile(new URL(`../public${src}`, import.meta.url))
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, sizes, src)
  }
  assert.deepEqual(manifest.icons.map((icon) => icon.sizes).sort(), ['192x192', '512x512'])
})
