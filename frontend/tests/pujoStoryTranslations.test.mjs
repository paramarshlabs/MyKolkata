import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { BN } from '../lib/i18n/bn.ts'

const root = new URL('../', import.meta.url)
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'))
const content = (await readJson('lib/pujo-personality/content.json')).archetypes
const photos = await readJson('components/pujo-personality/storyPhotos.json')
const translations = await readJson('lib/i18n/pujo-stories.bn.json')

test('all nine stories have current Bengali copy available to the language switch', () => {
  assert.deepEqual(Object.keys(translations).sort(), Object.keys(content).sort())
  let paragraphs = 0
  for (const [id, bengali] of Object.entries(translations)) {
    const { philosophy, lore, light, shadow } = content[id]
    const captions = photos[id].map((photo) => photo.caption)
    const alts = photos[id].map((photo) => photo.alt)
    const hash = createHash('sha256').update(JSON.stringify({ philosophy, lore, light, shadow, captions, alts })).digest('hex')
    assert.equal(bengali.sourceHash, hash, `${id}: review translations when English copy or image text changes`)
    const pairs = [[philosophy, bengali.philosophy]]
    for (const field of ['light', 'shadow']) {
      const phrase = content[id][field]
      pairs.push([phrase.charAt(0).toUpperCase() + phrase.slice(1), bengali[field]])
    }
    for (const [field, originals] of [['lore', lore], ['captions', captions], ['alts', alts]]) {
      assert.equal(bengali[field].length, originals.length, `${id}: complete ${field}`)
      originals.forEach((original, index) => pairs.push([original, bengali[field][index]]))
    }
    for (const [english, translated] of pairs) {
      assert.match(translated, /[\u0980-\u09ff]/, `${id}: Bengali text required`)
      assert.ok(!translated.includes('\uFFFD'), `${id}: intact Unicode`)
      assert.notEqual(translated, english)
      assert.equal(BN[english], translated, `${id}: available to the existing switch`)
    }
    paragraphs += lore.length
  }
  assert.equal(paragraphs, 66)
})

test('shared story headings and credits also translate', () => {
  for (const phrase of ['Your story', 'The story', 'At your best', 'At your worst', 'At their best', 'At their worst', 'Photo credits', 'Resized to WebP; displayed crops vary by device. Each image retains its source license.']) {
    assert.match(BN[phrase], /[\u0980-\u09ff]/, phrase)
  }
})
