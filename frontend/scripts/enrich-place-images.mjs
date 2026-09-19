import { readPlaceCatalog } from './lib/catalog.mjs'
import { loadEnvFile } from './lib/load-env.mjs'
import { AnakinImageProvider } from '../lib/places/anakinImageProvider.ts'
import { imageCandidateFromWikimedia } from '../lib/places/imageCandidate.ts'
import { WikimediaImageProvider } from '../lib/places/wikimediaImageProvider.ts'

loadEnvFile()

const args = new Map(process.argv.slice(2).map((value) => {
  const [key, inlineValue] = value.split('=', 2)
  return [key.replace(/^--/, ''), inlineValue ?? true]
}))
const limit = Math.min(100, Math.max(1, Number(args.get('limit')) || 10))
const category = String(args.get('category') || '').trim().toLowerCase()
const providers = new Set(String(args.get('providers') || 'wikimedia,anakin').split(',').map((value) => value.trim()))
const execute = args.has('execute')
const write = args.has('write')
const confirmation = args.get('confirm')

if (write && !execute) throw new Error('Write refused. Image discovery requires --execute.')
if (write && process.env.EXPLORE_DATABASE_ENABLED !== 'true') {
  throw new Error('Write refused. Set EXPLORE_DATABASE_ENABLED=true only after the Explore migration is applied.')
}
if (write && confirmation !== 'WRITE_IMAGE_CANDIDATES') {
  throw new Error('Write refused. Pass --confirm=WRITE_IMAGE_CANDIDATES after reviewing the discovery report.')
}

const catalogDirectory = String(args.get('catalog') || process.env.EXPLORE_CATALOG_DIR || 'data/explore/catalog')
const { places: catalogPlaces } = await readPlaceCatalog(catalogDirectory)
const places = catalogPlaces
  .filter((place) => !category || place.category === category)
  .sort((left, right) => Number(Boolean(right.website)) - Number(Boolean(left.website)) || right.confidence - left.confidence)
  .slice(0, limit)

const plan = {
  mode: execute ? (write ? 'discover-and-write' : 'discovery-dry-run') : 'plan-only',
  selectedPlaces: places.length,
  category: category || 'all',
  providers: [...providers],
  storesImageBytes: false,
}

if (!execute) {
  console.log(JSON.stringify(plan, null, 2))
  console.log('No network or database connection was opened. Add --execute to discover candidates without writing.')
  process.exit(0)
}

const wikimedia = providers.has('wikimedia') ? new WikimediaImageProvider() : null
const anakin = providers.has('anakin') ? new AnakinImageProvider() : null
const results = []

for (const place of places) {
  const candidates = []
  if (wikimedia) {
    const result = await wikimedia.findImage({ name: place.name, lat: place.latitude, lng: place.longitude })
    const candidate = imageCandidateFromWikimedia(result)
    if (candidate) candidates.push(candidate)
  }
  if (anakin && !candidates.some((candidate) => candidate.verification === 'VERIFIED')) {
    try {
      const candidate = await anakin.findImage(place)
      if (candidate) candidates.push(candidate)
    } catch (error) {
      console.error(`[images:anakin] ${error?.name || 'unavailable'} for ${place.id}`)
    }
  }
  candidates.sort((left, right) => (
    Number(right.verification === 'VERIFIED') - Number(left.verification === 'VERIFIED') ||
    right.confidence - left.confidence
  ))
  results.push({ place, candidate: candidates[0] || null })
  console.log(`${place.name}: ${candidates[0] ? `${candidates[0].verification} via ${candidates[0].provider}` : 'no trusted candidate'}`)
}

if (write) {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  try {
    for (const { place, candidate } of results) {
      if (!candidate) continue
      const placeId = `overture:${place.id}`
      const existing = await prisma.placePhoto.findFirst({
        where: { placeId, provider: candidate.provider, url: candidate.url },
        select: { id: true },
      })
      const data = {
        url: candidate.url,
        sourceUrl: candidate.sourceUrl,
        altText: `${place.name} venue photo`,
        kind: candidate.kind,
        provider: candidate.provider,
        attribution: candidate.attribution,
        license: candidate.license,
        confidence: candidate.confidence,
        verification: candidate.verification,
        isPrimary: candidate.verification === 'VERIFIED',
        lastVerifiedAt: candidate.verification === 'VERIFIED' ? new Date() : null,
      }
      if (existing) await prisma.placePhoto.update({ where: { id: existing.id }, data })
      else await prisma.placePhoto.create({ data: { placeId, ...data } })
    }
  } finally {
    await prisma.$disconnect()
  }
}

console.log(JSON.stringify({
  ...plan,
  found: results.filter(({ candidate }) => candidate).length,
  verified: results.filter(({ candidate }) => candidate?.verification === 'VERIFIED').length,
  needsReview: results.filter(({ candidate }) => candidate?.verification === 'CANDIDATE').length,
  missing: results.filter(({ candidate }) => !candidate).length,
}, null, 2))
