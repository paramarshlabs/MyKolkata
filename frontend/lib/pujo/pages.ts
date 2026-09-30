import 'server-only'
import { prisma } from '@/lib/db/prisma'
import { findPujo, type Pujo } from './build'
import { nearestPujos } from './client'
import { loadPujoIndex } from './pandals'
import type { Station } from './pois'

/* ==========================================================================
   What a pujo's own page needs, gathered on the server: the pujo, its
   neighbours, its nearest station, and whatever verified detail has been
   filled in (PujoPandalDetail). Everything here is real data.
   ========================================================================== */

export type PandalPhoto = { url: string; alt: string; credit: string | null }
export type PandalDetail = { description: string | null; theme: string | null; artist: string | null; photos: PandalPhoto[] }

export type PandalPage = {
  pujo: Pujo
  /* false when the slug is an old one, merged into this pujo */
  canonical: boolean
  areaName: string | null
  station: Station | null
  nearby: { slug: string; name: string; famous: boolean; minutes: number; lat: number; lng: number }[]
  detail: PandalDetail | null
}

function photosFrom(value: unknown): PandalPhoto[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const photo = item as Record<string, unknown>
    return typeof photo?.url === 'string' && photo.url.startsWith('https://') && typeof photo.alt === 'string'
      ? [{ url: photo.url, alt: photo.alt, credit: typeof photo.credit === 'string' ? photo.credit : null }]
      : []
  })
}

async function loadDetail(slug: string): Promise<PandalDetail | null> {
  try {
    const row = await prisma.pujoPandalDetail.findUnique({ where: { slug } })
    if (!row) return null
    const detail = { description: row.description, theme: row.theme, artist: row.artist, photos: photosFrom(row.photos) }
    return detail.description || detail.theme || detail.artist || detail.photos.length ? detail : null
  } catch {
    /* the table arrives with npm run db:push; until then there's no detail to show */
    return null
  }
}

export async function loadPandalPage(slug: string): Promise<PandalPage | null> {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null
  const index = await loadPujoIndex()
  const found = findPujo(index, slug)
  if (!found) return null
  const { pujo, canonical } = found
  const station = pujo.metro ? index.stations.find((s) => s.id === pujo.metro?.id) ?? null : null
  const nearby = pujo.lat !== null && pujo.lng !== null
    ? nearestPujos(index.pujos, { lat: pujo.lat, lng: pujo.lng }, { exclude: [pujo.slug], limit: 5 }).map(({ pujo: near, minutes }) => ({
      slug: near.slug, name: near.name, famous: near.famous, minutes, lat: near.lat as number, lng: near.lng as number,
    }))
    : []
  return {
    pujo,
    canonical,
    areaName: index.areas.find((a) => a.id === pujo.area)?.name ?? null,
    station,
    nearby,
    detail: canonical ? await loadDetail(pujo.slug) : null,
  }
}

/* every pujo's slug, for the sitemap */
export async function pujoSlugs(): Promise<string[]> {
  return (await loadPujoIndex()).pujos.map((pujo) => pujo.slug)
}
