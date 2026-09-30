/* ==========================================================================
   What the browser gets of the Pujo index: every pujo, the areas, the Metro
   stations, landmarks and help points. Addresses and merged slugs stay on the
   server (a pujo's page shows its address). About 35 KB over the wire.
   ========================================================================== */

import type { AreaSummary, Pujo, PujoIndex } from './build'
import { straightKm, walkKm, walkMinutes, type LatLng } from './geo'
import type { HelpPoint, Landmark, Station } from './pois'

export type ClientPujo = Omit<Pujo, 'address' | 'aliases' | 'featured'>

export type ClientIndex = {
  pujos: ClientPujo[]
  areas: AreaSummary[]
  stations: Station[]
  landmarks: Landmark[]
  help: HelpPoint[]
}

/* five decimals is a metre: plenty for a pin */
const round = (value: number | null) => (value === null ? null : Math.round(value * 1e5) / 1e5)

export function toClientIndex(index: PujoIndex): ClientIndex {
  return {
    pujos: index.pujos.map((pujo) => ({
      slug: pujo.slug,
      name: pujo.name,
      fullName: pujo.fullName,
      zone: pujo.zone,
      area: pujo.area,
      place: pujo.place,
      pincode: pujo.pincode,
      lat: round(pujo.lat),
      lng: round(pujo.lng),
      famous: pujo.famous,
      rank: pujo.rank,
      awards: pujo.awards,
      metro: pujo.metro,
    })),
    areas: index.areas,
    stations: index.stations,
    landmarks: index.landmarks,
    help: index.help,
  }
}

type Located = { slug: string; lat: number | null; lng: number | null }

/* the pujos nearest a point, with walking distance and minutes; famous ones are marked by the caller */
export function nearestPujos<T extends Located>(
  pujos: readonly T[],
  point: LatLng,
  { exclude = [], limit = 5, withinKm = Infinity }: { exclude?: readonly string[]; limit?: number; withinKm?: number } = {},
): { pujo: T; km: number; minutes: number }[] {
  const skip = new Set(exclude)
  return pujos
    .filter((pujo): pujo is T & LatLng => pujo.lat !== null && pujo.lng !== null && !skip.has(pujo.slug))
    .map((pujo) => ({ pujo, straight: straightKm(point, pujo) }))
    .filter(({ straight }) => straight <= withinKm)
    .sort((a, b) => a.straight - b.straight)
    .slice(0, limit)
    .map(({ pujo }) => {
      const km = walkKm(point, pujo)
      return { pujo, km, minutes: walkMinutes(km) }
    })
}
