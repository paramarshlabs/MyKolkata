import { readFile, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'

export async function readPlaceCatalog(directory = 'data/explore/catalog', { limit = Infinity } = {}) {
  const root = resolve(directory)
  const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'))
  const filenames = (await readdir(join(root, 'tiles')))
    .filter((name) => name.endsWith('.json'))
    .sort()
  const places = []
  for (const filename of filenames) {
    const records = JSON.parse(await readFile(join(root, 'tiles', filename), 'utf8'))
    places.push(...records.slice(0, Math.max(0, limit - places.length)))
    if (places.length >= limit) break
  }
  return { manifest, places }
}
