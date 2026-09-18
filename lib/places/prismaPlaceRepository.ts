// @ts-nocheck
import { boundingBox, haversineDistanceKm } from './geo'
import { findCategory } from './taxonomy'

function categoryWhere(category) {
  const match = findCategory(category)
  if (!match) return null
  return {
    OR: [
      { categories: { some: { category: { slug: match.slug } } } },
      { type: { equals: match.name, mode: 'insensitive' } },
    ],
  }
}

function mapPlace(row) {
  const source = row.sources?.[0]
  const primaryPhoto = row.photos?.find((photo) => photo.isPrimary) ?? row.photos?.[0]
  const category = row.categories?.[0]?.category
  const fallbackCategory = findCategory(row.type) ?? { name: row.type ?? 'Places', slug: 'places' }
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    address: row.address ?? row.location,
    area: row.area ?? row.location,
    latitude: row.latitude === null || row.latitude === undefined ? null : Number(row.latitude),
    longitude: row.longitude === null || row.longitude === undefined ? null : Number(row.longitude),
    category: category?.name ?? fallbackCategory.name,
    categorySlug: category?.slug ?? fallbackCategory.slug,
    tags: row.tags ?? [],
    rating: row.rating,
    ratingCount: row.ratingCount,
    priceLevel: row.priceLevel,
    phone: row.phone,
    website: row.website,
    openingHours: row.openingHours,
    status: row.status,
    image: primaryPhoto?.url ?? row.image,
    imageSourceUrl: primaryPhoto?.sourceUrl ?? null,
    imageAttribution: primaryPhoto?.attribution ?? null,
    imageLicense: primaryPhoto?.license ?? null,
    imageConfidence: primaryPhoto?.confidence ?? null,
    provider: source?.provider ?? 'mykolkata',
    providerPlaceId: source?.externalId ?? row.id,
    attribution: primaryPhoto?.attribution ?? source?.attribution ?? null,
    sourceConfidence: row.sourceConfidence ?? 1,
    lastVerifiedAt: row.lastVerifiedAt?.toISOString?.() ?? row.lastVerifiedAt ?? null,
  }
}

const includes = {
  categories: { include: { category: true }, take: 3 },
  sources: { orderBy: { fetchedAt: 'desc' }, take: 1 },
  photos: {
    where: { verification: 'VERIFIED' },
    orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
    take: 3,
  },
}

export class PrismaPlaceRepository {
  constructor(prisma) {
    this.prisma = prisma
    // Opt in only after the Explore migration has been applied to this database.
    this.available = Boolean(prisma && process.env.EXPLORE_DATABASE_ENABLED === 'true')
  }

  async search({ query, category, limit = 20, cursor = 0 }) {
    const normalizedQuery = String(query || '').trim()
    const filters = [{ editorialStatus: { not: 'REJECTED' } }]
    if (normalizedQuery) {
      filters.push({
        OR: [
          { name: { contains: normalizedQuery, mode: 'insensitive' } },
          { description: { contains: normalizedQuery, mode: 'insensitive' } },
          { address: { contains: normalizedQuery, mode: 'insensitive' } },
          { area: { contains: normalizedQuery, mode: 'insensitive' } },
          { location: { contains: normalizedQuery, mode: 'insensitive' } },
          { type: { contains: normalizedQuery, mode: 'insensitive' } },
        ],
      })
    }
    const categoryFilter = categoryWhere(category)
    if (categoryFilter) filters.push(categoryFilter)

    const rows = await this.prisma.place.findMany({
      where: { AND: filters },
      include: includes,
      orderBy: [{ sourceConfidence: 'desc' }, { rating: 'desc' }, { updatedAt: 'desc' }],
      skip: Math.max(0, Number(cursor) || 0),
      take: Math.min(Math.max(limit, 1), 50),
    })
    return rows.map(mapPlace)
  }

  async withinBounds({ bounds, category, query, limit = 250, cursor = 0 }) {
    const normalizedQuery = String(query || '').trim()
    const filters = [
      { editorialStatus: { not: 'REJECTED' } },
      { latitude: { gte: bounds.south, lte: bounds.north } },
      { longitude: { gte: bounds.west, lte: bounds.east } },
    ]
    if (normalizedQuery) {
      filters.push({
        OR: [
          { name: { contains: normalizedQuery, mode: 'insensitive' } },
          { address: { contains: normalizedQuery, mode: 'insensitive' } },
          { area: { contains: normalizedQuery, mode: 'insensitive' } },
          { type: { contains: normalizedQuery, mode: 'insensitive' } },
        ],
      })
    }
    const categoryFilter = categoryWhere(category)
    if (categoryFilter) filters.push(categoryFilter)

    const where = { AND: filters }
    const offset = Math.max(0, Number(cursor) || 0)
    const take = Math.min(Math.max(Number(limit) || 250, 1), 500)
    const [rows, total] = await Promise.all([
      this.prisma.place.findMany({
        where,
        include: includes,
        orderBy: [{ sourceConfidence: 'desc' }, { rating: 'desc' }, { updatedAt: 'desc' }],
        skip: offset,
        take,
      }),
      this.prisma.place.count({ where }),
    ])
    const places = rows.map(mapPlace)
    const nextOffset = offset + places.length
    return {
      places,
      total,
      nextCursor: nextOffset < total ? String(nextOffset) : null,
    }
  }

  async nearby({ lat, lng, radiusKm = 5, category, limit = 20 }) {
    const bounds = boundingBox({ lat, lng }, radiusKm)
    const filters = [
      { editorialStatus: { not: 'REJECTED' } },
      { latitude: { gte: bounds.south, lte: bounds.north } },
      { longitude: { gte: bounds.west, lte: bounds.east } },
    ]
    const categoryFilter = categoryWhere(category)
    if (categoryFilter) filters.push(categoryFilter)

    const rows = await this.prisma.place.findMany({
      where: { AND: filters },
      include: includes,
      take: Math.min(Math.max(limit * 4, 40), 200),
    })

    return rows
      .map(mapPlace)
      .filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude))
      .map((place) => ({
        ...place,
        distanceKm: haversineDistanceKm(
          { lat, lng },
          { lat: place.latitude, lng: place.longitude }
        ),
      }))
      .filter((place) => place.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm || (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, limit)
  }
}
