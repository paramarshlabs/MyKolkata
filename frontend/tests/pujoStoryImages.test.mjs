import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const content = JSON.parse(await readFile(new URL('lib/pujo-personality/content.json', root), 'utf8')).archetypes
const photos = JSON.parse(await readFile(new URL('components/pujo-personality/storyPhotos.json', root), 'utf8'))

test('every story paragraph has a distinct, credited local visual matched to its current copy', async () => {
  assert.deepEqual(Object.keys(photos).sort(), Object.keys(content).sort())
  const sources = new Set()
  const assets = new Set()
  const bytes = new Set()
  for (const [id, rows] of Object.entries(photos)) {
    assert.equal(rows.length, content[id].lore.length, `${id}: paragraph coverage`)
    for (const [index, photo] of rows.entries()) {
      assert.equal(photo.paragraphHash, createHash('sha256').update(content[id].lore[index]).digest('hex'), `${id} paragraph ${index + 1}: recurate after copy changes`)
      for (const key of ['alt', 'caption', 'author', 'title', 'license']) {
        assert.ok(photo[key]?.trim(), `${id}: ${key}`)
        assert.ok(!photo[key].includes('\uFFFD'), `${id}: corrupted ${key}`)
      }
      assert.match(photo.source, /^https:\/\/(?:commons\.wikimedia\.org\/wiki\/File:|unsplash\.com\/photos\/|www\.pexels\.com\/photo\/|www\.prokerala\.com\/news\/photos\/)/)
      if (photo.source.startsWith('https://www.prokerala.com/')) {
        assert.equal(photo.publicationPermissionRequired, true, 'Agency preview must retain its pending publication permission flag')
        assert.equal(photo.license, 'Copyright IANS — permission required for publication')
        assert.equal(photo.licenseUrl, 'https://www.ians.in/terms-of-use')
      }
      if (photo.source.startsWith('https://unsplash.com/')) {
        assert.equal(photo.license, 'Unsplash License')
        assert.equal(photo.licenseUrl, 'https://unsplash.com/license')
      }
      if (photo.source.startsWith('https://www.pexels.com/')) {
        assert.equal(photo.license, 'Pexels License')
        assert.equal(photo.licenseUrl, 'https://www.pexels.com/license/')
      }
      assert.match(photo.licenseUrl, /^https?:\/\//)
      assert.match(photo.image, /^\/personality-story\/passages\/[a-z_]+-\d{2}(?:-[a-f0-9]{8})?\.webp$/)
      assert.ok(photo.aspect > 0)
      assert.ok(['cover', 'contain'].includes(photo.fit))
      assert.ok(['portrait', 'landscape'].includes(photo.shape))
      assert.ok(!sources.has(photo.source), `Repeated source: ${photo.source}`)
      assert.ok(!assets.has(photo.image), `Repeated asset: ${photo.image}`)
      sources.add(photo.source)
      assets.add(photo.image)
      const url = new URL(`public${photo.image}`, root)
      assert.ok((await stat(url)).size > 1000, `Missing or empty ${photo.image}`)
      const hash = createHash('sha256').update(await readFile(url)).digest('hex')
      assert.ok(!bytes.has(hash), `Identical image content: ${photo.image}`)
      bytes.add(hash)
    }
  }
  assert.equal(assets.size, 66)
  const files = await readdir(new URL('public/personality-story/passages/', root))
  assert.deepEqual(files.sort(), [...assets].map((asset) => asset.split('/').at(-1)).sort(), 'Keep only images referenced by the story data')
})
