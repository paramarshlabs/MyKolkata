import { NextResponse } from 'next/server'
import { cached } from '@/lib/cache'
import { toClient } from '@/lib/serialize'

export const CATALOGUE_CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=3600'
export const MEMORY_TTL_MS = 30_000
export const DEFAULT_LIMIT = 100
export const MAX_LIMIT = 500

type FindManyDelegate = {
  findMany: (args: { orderBy: { createdAt: 'desc' }; take: number }) => Promise<unknown[]>
}

export function parseLimit(searchParams: URLSearchParams): number {
  const requested = Number.parseInt(searchParams.get('limit') ?? '', 10)
  return Number.isFinite(requested)
    ? Math.min(Math.max(requested, 1), MAX_LIMIT)
    : DEFAULT_LIMIT
}

export async function listCatalogue(delegate: FindManyDelegate, cacheKey: string, take: number) {
  return cached(`${cacheKey}:${take}`, MEMORY_TTL_MS, async () => {
    const rows = await delegate.findMany({ orderBy: { createdAt: 'desc' }, take })
    return toClient(rows)
  })
}

export async function catalogueJsonResponse(
  delegate: FindManyDelegate,
  cacheKey: string,
  searchParams: URLSearchParams,
) {
  try {
    const take = parseLimit(searchParams)
    const payload = await listCatalogue(delegate, cacheKey, take)
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': CATALOGUE_CACHE_CONTROL },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
