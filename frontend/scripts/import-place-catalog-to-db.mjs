import { readPlaceCatalog } from './lib/catalog.mjs'
import { loadEnvFile } from './lib/load-env.mjs'

loadEnvFile()

const args = new Map(process.argv.slice(2).map((value) => {
  const [key, inlineValue] = value.split('=', 2)
  return [key.replace(/^--/, ''), inlineValue ?? true]
}))
const directory = String(args.get('catalog') || process.env.EXPLORE_CATALOG_DIR || 'data/explore/catalog')
const requestedLimit = Number(args.get('limit') || Infinity)
const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.floor(requestedLimit)) : Infinity
const batchSize = Math.min(500, Math.max(10, Number(args.get('batch-size')) || 150))
const write = args.has('write')
const confirmation = args.get('confirm')

if (write && process.env.EXPLORE_DATABASE_ENABLED !== 'true') {
  throw new Error('Write refused. Set EXPLORE_DATABASE_ENABLED=true only after the Explore migration is applied.')
}
if (write && confirmation !== 'IMPORT_EXPLORE_CATALOG') {
  throw new Error('Write refused. Pass --confirm=IMPORT_EXPLORE_CATALOG after reviewing the dry-run report.')
}

const { manifest, places } = await readPlaceCatalog(directory, { limit })
const categoryCounts = places.reduce((counts, place) => {
  counts[place.category] = (counts[place.category] || 0) + 1
  return counts
}, {})
const report = {
  mode: write ? 'write' : 'dry-run',
  catalogVersion: manifest.version,
  catalogGeneratedAt: manifest.generatedAt,
  selectedPlaces: places.length,
  availablePlaces: manifest.count,
  placesWithOfficialWebsite: places.filter((place) => place.website).length,
  categoryCounts,
}

if (!write) {
  console.log(JSON.stringify(report, null, 2))
  console.log('No database connection was opened. Add --write --confirm=IMPORT_EXPLORE_CATALOG only after staging approval.')
  process.exit(0)
}

const { PrismaClient } = await import('@prisma/client')
const prisma = new PrismaClient()
const categoryNames = {
  cafes: 'Cafés', food: 'Food', places: 'Places', culture: 'Culture',
  shopping: 'Shopping', experiences: 'Experiences', outdoors: 'Outdoors',
}

try {
  for (const [position, slug] of Object.keys(categoryNames).entries()) {
    await prisma.category.upsert({
      where: { slug },
      create: { slug, name: categoryNames[slug], sortOrder: position },
      update: { name: categoryNames[slug], sortOrder: position, isActive: true },
    })
  }
  const categories = await prisma.category.findMany({ select: { id: true, slug: true } })
  const categoryIds = new Map(categories.map((category) => [category.slug, category.id]))

  for (let offset = 0; offset < places.length; offset += batchSize) {
    const batch = places.slice(offset, offset + batchSize)
    const operations = []
    for (const place of batch) {
      const placeId = `overture:${place.id}`
      const common = {
        name: place.name,
        address: place.address || null,
        location: place.area || 'Kolkata',
        area: place.area || 'Kolkata',
        type: categoryNames[place.category] || 'Places',
        tags: [place.primaryType].filter(Boolean),
        latitude: place.latitude,
        longitude: place.longitude,
        website: place.website || null,
        editorialStatus: 'AUTO',
        sourceConfidence: place.confidence || 0,
        lastVerifiedAt: new Date(manifest.generatedAt),
      }
      operations.push(prisma.place.upsert({
        where: { id: placeId },
        create: { id: placeId, ...common },
        update: common,
      }))
      operations.push(prisma.placeSource.upsert({
        where: { provider_externalId: { provider: 'overture', externalId: place.id } },
        create: {
          placeId,
          provider: 'overture',
          externalId: place.id,
          attribution: 'Overture Maps Foundation',
          license: manifest.license,
          raw: { brandName: place.brandName || null, brandWikidata: place.brandWikidata || null, socials: place.socials || [] },
        },
        update: {
          placeId,
          attribution: 'Overture Maps Foundation',
          license: manifest.license,
          fetchedAt: new Date(),
          raw: { brandName: place.brandName || null, brandWikidata: place.brandWikidata || null, socials: place.socials || [] },
        },
      }))
      const categoryId = categoryIds.get(place.category)
      if (categoryId) {
        operations.push(prisma.placeCategory.upsert({
          where: { placeId_categoryId: { placeId, categoryId } },
          create: { placeId, categoryId, source: 'overture', confidence: place.confidence || 0 },
          update: { source: 'overture', confidence: place.confidence || 0 },
        }))
      }
    }
    await prisma.$transaction(operations)
    console.log(`Imported ${Math.min(offset + batch.length, places.length)} of ${places.length}`)
  }
  console.log(JSON.stringify({ ...report, importedPlaces: places.length }, null, 2))
} finally {
  await prisma.$disconnect()
}
