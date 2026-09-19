import { NextResponse } from 'next/server'
import { parseCoordinate } from './geo'
import { findCategory } from './taxonomy'

export class RequestValidationError extends Error {}

function single(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value
}

export function parseLimit(value: unknown, fallback = 20, maximum = 50): number {
  const parsed = Number.parseInt(String(single(value) ?? ''), 10)
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), maximum) : fallback
}

function boundedNumber(value: unknown, name: string, minimum: number, maximum: number): number {
  const parsed = Number(single(value))
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
    throw new RequestValidationError(`Invalid ${name}`)
  }
  return parsed
}

function parseCategory(value: unknown): string | undefined {
  const raw = String(single(value) ?? '').trim()
  if (!raw || raw.toLocaleLowerCase('en-IN') === 'all') return undefined
  const category = findCategory(raw)
  if (!category) throw new RequestValidationError('Unknown category')
  return category.slug
}

function optionalOrigin(query: Record<string, unknown>) {
  const hasLat = single(query.lat) !== undefined && single(query.lat) !== null && single(query.lat) !== ''
  const hasLng = single(query.lng) !== undefined && single(query.lng) !== null && single(query.lng) !== ''
  if (hasLat !== hasLng) throw new RequestValidationError('Latitude and longitude must be provided together')
  if (!hasLat) return { lat: undefined as number | undefined, lng: undefined as number | undefined }

  const lat = parseCoordinate(single(query.lat), 'latitude')
  const lng = parseCoordinate(single(query.lng), 'longitude')
  if (lat === null || lng === null) throw new RequestValidationError('Invalid coordinates')
  return { lat, lng }
}

export function searchParamsToQuery(searchParams: URLSearchParams): Record<string, string> {
  const query: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    query[key] = value
  })
  return query
}

export function parseSearchQuery(query: Record<string, unknown> = {}) {
  const text = String(single(query.q) ?? '').trim().slice(0, 120)
  if (text.length < 2) throw new RequestValidationError('Search query must contain at least 2 characters')
  return {
    query: text,
    category: parseCategory(query.category),
    ...optionalOrigin(query),
    cursor: Math.max(0, Number.parseInt(String(single(query.cursor) ?? ''), 10) || 0),
    limit: parseLimit(query.limit),
  }
}

export function parseNearbyQuery(query: Record<string, unknown> = {}) {
  const { lat, lng } = optionalOrigin(query)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new RequestValidationError('Latitude and longitude are required')
  }
  const requestedRadius = Number(single(query.radiusKm) ?? 5)
  const radiusKm = Number.isFinite(requestedRadius)
    ? Math.min(Math.max(requestedRadius, 0.1), 25)
    : 5

  return {
    lat: lat as number,
    lng: lng as number,
    radiusKm,
    category: parseCategory(query.category),
    /* a map fills with up to 300 markers; lists ask for far fewer */
    limit: parseLimit(query.limit, 20, 300),
  }
}

export function parseBoundsQuery(query: Record<string, unknown> = {}) {
  const bounds = {
    west: boundedNumber(query.west, 'west bound', -180, 180),
    south: boundedNumber(query.south, 'south bound', -90, 90),
    east: boundedNumber(query.east, 'east bound', -180, 180),
    north: boundedNumber(query.north, 'north bound', -90, 90),
  }
  if (bounds.west >= bounds.east || bounds.south >= bounds.north) {
    throw new RequestValidationError('Map bounds are reversed')
  }
  if ((bounds.east - bounds.west) * (bounds.north - bounds.south) > 1) {
    throw new RequestValidationError('Map bounds are too large')
  }
  const rawQuery = String(single(query.q) ?? '').trim().slice(0, 120)
  const cursor = Number.parseInt(String(single(query.cursor) ?? ''), 10)
  return {
    bounds,
    category: parseCategory(query.category),
    query: rawQuery || undefined,
    cursor: Number.isFinite(cursor) ? Math.max(0, cursor) : 0,
    limit: parseLimit(query.limit, 250, 500),
  }
}

type PlacesResult = { places: unknown[]; meta?: Record<string, unknown> }

export function createPlacesRouteHandler({
  service,
  parse,
}: {
  service: (params: never) => Promise<PlacesResult>
  parse: (query: Record<string, unknown>) => unknown
}) {
  return async function GET(request: Request) {
    try {
      const { searchParams } = new URL(request.url)
      const params = parse(searchParamsToQuery(searchParams)) as never
      const result = await service(params)
      return NextResponse.json(
        { data: result.places, meta: { ...result.meta, count: result.places.length } },
        { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } },
      )
    } catch (error) {
      if (error instanceof RequestValidationError) {
        return NextResponse.json(
          { error: { code: 'INVALID_REQUEST', message: error.message } },
          { status: 400 },
        )
      }
      console.error(error)
      return NextResponse.json(
        { error: { code: 'PLACES_UNAVAILABLE', message: 'Places are temporarily unavailable' } },
        { status: 503 },
      )
    }
  }
}
