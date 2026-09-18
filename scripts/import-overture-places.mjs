import { createReadStream, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { createInterface } from 'node:readline'

const EXCLUDED_PRIMARY_TYPES = [
  'bank', 'financial', 'atm', 'professional service', 'real estate', 'school', 'education',
  'government', 'hospital', 'medical', 'diagnostic', 'pharmacy', 'dentist', 'lawyer',
  'accountant', 'insurance', 'software', 'information technology', 'manufactur', 'industrial',
  'equipment', 'repair', 'construction', 'transportation', 'freight', 'gas station', 'police',
  'car dealer', 'auto parts', 'printing service', 'interior design', 'advertising', 'marketing agency',
]

const CATEGORY_RULES = [
  ['cafes', ['cafe', 'coffee', 'tea room', 'tea house', 'bakery', 'dessert', 'ice cream']],
  ['food', ['restaurant', 'fast food', 'street food', 'bar', 'pub', 'brewery', 'caterer']],
  ['culture', ['museum', 'gallery', 'theatre', 'theater', 'cultural', 'heritage', 'library', 'bookstore', 'arts center', 'temple', 'mosque', 'church', 'cathedral', 'synagogue']],
  ['outdoors', ['park', 'garden', 'nature', 'outdoor', 'beach', 'playground', 'lake', 'trail', 'zoo']],
  ['experiences', ['experience', 'event', 'entertainment', 'cinema', 'movie', 'amusement', 'recreation', 'sports', 'spa', 'gym', 'music venue', 'tour', 'dance school', 'club']],
  ['shopping', ['shopping', 'shop', 'store', 'retail', 'market', 'mall', 'boutique', 'clothing', 'jewelry', 'grocery', 'supermarket', 'fashion', 'electronics', 'furniture', 'flowers and gifts']],
  ['places', ['landmark', 'historical building', 'tourist attraction', 'monument', 'hotel', 'resort', 'hostel', 'accommodation']],
]

const args = new Map(process.argv.slice(2).map((value, index, values) => {
  const [key, inlineValue] = value.split('=', 2)
  return [key.replace(/^--/, ''), inlineValue ?? values[index + 1]]
}))
const input = resolve(args.get('input') || '')
const output = resolve(args.get('output') || 'data/explore/catalog')
const minimumConfidence = Number(args.get('min-confidence') || 0.45)
const tileSize = Number(args.get('tile-size') || 0.025)

if (!input || !existsSync(input)) {
  console.error('Usage: node scripts/import-overture-places.mjs --input <geojsonl> [--output data/explore/catalog]')
  process.exit(1)
}

function normalized(value = '') {
  return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function categoryFor(properties) {
  const primary = normalized(properties.categories?.primary || properties.basic_category || '')
  if (!primary || EXCLUDED_PRIMARY_TYPES.some((needle) => primary.includes(needle))) return null
  const words = new Set(primary.split(' '))
  for (const [category, needles] of CATEGORY_RULES) {
    if (needles.some((needle) => needle.includes(' ') ? primary.includes(needle) : words.has(needle))) return category
  }
  return null
}

function addressFor(properties) {
  const address = properties.addresses?.[0]
  if (!address) return null
  return [address.freeform, address.locality, address.region, address.postcode].filter(Boolean).join(', ')
}

function firstWebUrl(values) {
  for (const value of Array.isArray(values) ? values : []) {
    try {
      const url = new URL(typeof value === 'string' ? value : value?.url)
      if (['http:', 'https:'].includes(url.protocol)) return url.toString()
    } catch {}
  }
  return null
}

function tileKey(longitude, latitude) {
  return `${Math.floor(longitude / tileSize)}_${Math.floor(latitude / tileSize)}`
}

const tiles = new Map()
const identities = new Set()
const categoryCounts = {}
const bounds = { west: Infinity, south: Infinity, east: -Infinity, north: -Infinity }
let readCount = 0
let skippedCount = 0

const lines = createInterface({ input: createReadStream(input), crlfDelay: Infinity })
for await (const line of lines) {
  if (!line.trim()) continue
  readCount += 1
  let feature
  try { feature = JSON.parse(line) } catch { skippedCount += 1; continue }
  const properties = feature.properties || {}
  const name = properties.names?.primary?.trim()
  const [longitude, latitude] = feature.geometry?.coordinates || []
  const confidence = Number(properties.confidence || 0)
  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude) || confidence < minimumConfidence) {
    skippedCount += 1
    continue
  }

  const identity = `${normalized(name)}:${latitude.toFixed(4)}:${longitude.toFixed(4)}`
  if (identities.has(identity)) { skippedCount += 1; continue }
  identities.add(identity)

  const category = categoryFor(properties)
  if (!category) { skippedCount += 1; continue }
  const address = addressFor(properties)
  const locality = properties.addresses?.[0]?.locality || 'Kolkata'
  const place = {
    id: feature.id,
    name,
    category,
    latitude,
    longitude,
    address,
    area: locality,
    confidence: Math.round(confidence * 1000) / 1000,
    primaryType: properties.categories?.primary || properties.basic_category || null,
    website: firstWebUrl(properties.websites),
    socials: (Array.isArray(properties.socials) ? properties.socials : []).slice(0, 5),
    brandName: properties.brand?.names?.primary || null,
    brandWikidata: properties.brand?.wikidata || null,
  }
  const key = tileKey(longitude, latitude)
  if (!tiles.has(key)) tiles.set(key, [])
  tiles.get(key).push(place)
  categoryCounts[category] = (categoryCounts[category] || 0) + 1
  bounds.west = Math.min(bounds.west, longitude)
  bounds.south = Math.min(bounds.south, latitude)
  bounds.east = Math.max(bounds.east, longitude)
  bounds.north = Math.max(bounds.north, latitude)
}

rmSync(output, { recursive: true, force: true })
mkdirSync(join(output, 'tiles'), { recursive: true })
const tileEntries = [...tiles.entries()].sort(([left], [right]) => left.localeCompare(right))
for (const [key, places] of tileEntries) {
  places.sort((left, right) => right.confidence - left.confidence || left.name.localeCompare(right.name))
  writeFileSync(join(output, 'tiles', `${key}.json`), JSON.stringify(places))
}

const manifest = {
  version: 1,
  source: 'Overture Maps Foundation',
  sourceFile: basename(input),
  license: 'CDLA-Permissive-2.0',
  generatedAt: new Date().toISOString(),
  tileSize,
  minimumConfidence,
  bounds,
  count: tileEntries.reduce((total, [, places]) => total + places.length, 0),
  readCount,
  skippedCount,
  categoryCounts,
  tiles: tileEntries.map(([key, places]) => ({ key, count: places.length })),
}
writeFileSync(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(JSON.stringify(manifest, null, 2))
