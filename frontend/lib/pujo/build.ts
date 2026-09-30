/* ==========================================================================
   From the scraper's rows to the pujos the app shows. Pure: rows in, index
   out, so the tests run it on fixtures and lib/pujo/pandals.ts runs it on the
   live tables. Only real columns are read. rating, view_count, crowd_level,
   theme_description, sculpted_by, established, nearby_slugs, bus_routes and
   categories are scraper filler and never leave the database.
   ========================================================================== */

import { DUPLICATES, EXCLUDED, FAMOUS_OVERRIDES, NAME_OVERRIDES, PIN_FIXES, UNPINNED } from './curation'
import { KOLKATA_CENTRE, medianPoint, straightKm, type LatLng } from './geo'
import { fullName, shortName, titleCase } from './names'
import { nearest, placesFromRows, type HelpPoint, type Landmark, type PoiRow, type Station } from './pois'
import {
  AREAS, KEYWORD_AREA_KM, NEAREST_AREA_KM, PINCODE_TRUST_KM, areaForPincode, areaFromText, pincodeFromText, zoneFromData, type Area, type ZoneId,
} from './sectors'

export type PandalRow = {
  slug: string
  name: string
  zone: string | null
  locality: string | null
  address: string | null
  pincode: string | null
  lat: number | null
  lng: number | null
  is_hidden: boolean | null
  is_featured: boolean | null
  red_road_carnival_rank: number | null
  carnival_awards: string[] | null
}

export type Pujo = {
  slug: string
  /* "Hatibagan Sarbojonin" */
  name: string
  /* "Hatibagan Sarbojonin Durgotsab Committee" */
  fullName: string
  zone: ZoneId
  area: string | null
  /* "Fariapukur, Shyambazar": where it is, in two names */
  place: string | null
  address: string | null
  pincode: string | null
  lat: number | null
  lng: number | null
  famous: boolean
  featured: boolean
  /* Red Road carnival rank */
  rank: number | null
  awards: string[]
  /* the nearest Metro station and how far it is in a straight line */
  metro: { id: string; km: number } | null
  /* slugs merged into this one */
  aliases: string[]
}

export type AreaSummary = { id: string; name: string; zone: ZoneId; centre: LatLng | null; count: number }

export type PujoIndex = {
  pujos: Pujo[]
  areas: AreaSummary[]
  stations: Station[]
  landmarks: Landmark[]
  help: HelpPoint[]
  /* a merged slug → the slug it now lives under */
  aliases: Record<string, string>
}

/* nearest Metro is only worth naming within this */
const METRO_KM = 3
/* a pujo this far from the centre with no area is out of the city */
const SUBURB_KM = 18

type Merged = PandalRow & { aliases: string[]; visible: boolean }

function merge(rows: PandalRow[]): { merged: Merged[]; aliases: Record<string, string> } {
  const bySlug = new Map(rows.map((row) => [row.slug, row]))
  const absorbed = new Set<string>()
  const aliases: Record<string, string> = {}
  const merged: Merged[] = []

  for (const [canonical, others] of Object.entries(DUPLICATES)) {
    const members = [canonical, ...others].map((slug) => bySlug.get(slug)).filter((row): row is PandalRow => Boolean(row))
    if (members.length < 2) continue
    /* the chosen row leads; if the scraper dropped it, the first that's left does */
    const [lead, ...rest] = members
    const withPosition = members.find((row) => row.lat !== null && row.lng !== null)
    const ranks = members.map((row) => row.red_road_carnival_rank).filter((rank): rank is number => rank !== null)
    merged.push({
      ...lead,
      pincode: lead.pincode ?? rest.find((row) => row.pincode)?.pincode ?? null,
      locality: lead.locality ?? rest.find((row) => row.locality)?.locality ?? null,
      address: lead.address ?? rest.find((row) => row.address)?.address ?? null,
      lat: lead.lat ?? withPosition?.lat ?? null,
      lng: lead.lng ?? withPosition?.lng ?? null,
      is_featured: members.some((row) => row.is_featured),
      red_road_carnival_rank: ranks.length ? Math.min(...ranks) : null,
      carnival_awards: [...new Set(members.flatMap((row) => row.carnival_awards ?? []))],
      aliases: rest.map((row) => row.slug),
      visible: members.some((row) => !row.is_hidden),
    })
    for (const row of members) absorbed.add(row.slug)
    for (const row of rest) aliases[row.slug] = lead.slug
  }

  for (const row of rows) {
    if (!absorbed.has(row.slug)) merged.push({ ...row, aliases: [], visible: !row.is_hidden })
  }
  return { merged, aliases }
}

const NOT_A_PLACE = /\b(?:kolkata|calcutta|west bengal|india|ffd member)\b/i

/* "25A/C Mohini Mohan Rd, Jadubabur Bazar, Bhowanipore, Kolkata 700020" → "Jadubabur Bazar, Bhowanipore" */
export function placeFrom(locality: string | null, rawName: string): string | null {
  if (!locality) return null
  const name = rawName.trim().toUpperCase()
  const parts = locality
    .split(',')
    .map((part) => part.replace(/\s*\b7[0-4]\d{4}\b/g, '').replace(/\s+(?:HO|SO|BO)$/, '').trim())
    .filter((part) => part && !NOT_A_PLACE.test(part) && part.toUpperCase() !== name)
    /* plus codes, house numbers and directions aren't places */
    .filter((part) => !/^[A-Z0-9]{4}\+[A-Z0-9]{2,}/.test(part) && !/^near\b/i.test(part) && !/^\d/.test(part))
    .map((part) => (part === part.toUpperCase() && /[A-Z]{3}/.test(part) ? titleCase(part) : part))
  if (!parts.length) return null
  return [...new Set(parts.slice(-2))].join(', ')
}

function cleanAddress(value: string | null, rawName: string): string | null {
  if (!value) return null
  const cleaned = value.replace(/\s*\((?:FFD Member[^)]*)\)/i, '').trim()
  if (!cleaned || cleaned.split(',')[0].trim().toUpperCase() === rawName.trim().toUpperCase()) return null
  return cleaned
}

/* the bracketed place in a name, "MALLICK BARI (BHOWANIPORE)" → "Bhowanipore" */
function bracketOf(rawName: string): string | null {
  const match = rawName.match(/\(([^)]+)\)/)
  return match ? titleCase(match[1].split(/[,/]/)[0].trim()) : null
}

export type BuildInput = {
  pandals: PandalRow[]
  pois: PoiRow[]
  /* PujoPandalDetail.famous, when that table has a say */
  famous?: Record<string, boolean>
}

export function buildIndex({ pandals, pois, famous = {} }: BuildInput): PujoIndex {
  const { stations, landmarks, help } = placesFromRows(pois)
  const { merged, aliases } = merge(pandals.filter((row) => !EXCLUDED.has(row.slug)))

  type Draft = Omit<Pujo, 'area' | 'zone' | 'metro'> & { dataZone: ZoneId | null; pincodeArea: Area | null }
  const visible = merged.filter((row) => row.visible)
  const rawNames = new Map(visible.map((row) => [row.slug, row.name]))
  const drafts: Draft[] = visible
    .map((row) => {
      const fix = PIN_FIXES[row.slug]
      const unpinned = UNPINNED.has(row.slug)
      const lat = unpinned ? null : fix?.lat ?? row.lat
      const lng = unpinned ? null : fix?.lng ?? row.lng
      const pincode = fix?.pincode ?? row.pincode ?? pincodeFromText(row.address) ?? pincodeFromText(row.locality)
      const override = NAME_OVERRIDES[row.slug] ?? {}
      const featured = Boolean(row.is_featured)
      const rank = row.red_road_carnival_rank
      const promoted = famous[row.slug] ?? FAMOUS_OVERRIDES[row.slug]
      return {
        slug: row.slug,
        name: override.name ?? shortName(row.name),
        fullName: override.fullName ?? fullName(row.name),
        place: placeFrom(row.locality ?? row.address, row.name),
        address: cleanAddress(row.address ?? row.locality, row.name),
        pincode,
        lat: Number.isFinite(lat) ? (lat as number) : null,
        lng: Number.isFinite(lng) ? (lng as number) : null,
        featured,
        rank,
        famous: promoted ?? (featured || rank !== null),
        awards: row.carnival_awards ?? [],
        aliases: row.aliases,
        dataZone: zoneFromData(row.zone),
        pincodeArea: areaForPincode(pincode),
      }
    })

  /* each area's centre is the middle of the pujos its pincodes place there */
  const centres = new Map<string, LatLng>()
  for (const area of AREAS) {
    const points = drafts
      .filter((draft) => draft.pincodeArea?.id === area.id && draft.lat !== null && draft.lng !== null)
      .map((draft) => ({ lat: draft.lat as number, lng: draft.lng as number }))
    /* twice: the middle, then the middle of the pins near it, so a pincode's stray pins don't drag it */
    const rough = medianPoint(points)
    if (!rough) continue
    const near = points.filter((point) => straightKm(point, rough) <= PINCODE_TRUST_KM)
    centres.set(area.id, medianPoint(near) ?? rough)
  }
  const nearestArea = (point: LatLng) => {
    let best: { area: Area; km: number } | null = null
    for (const area of AREAS) {
      const centre = centres.get(area.id)
      if (!centre) continue
      const km = straightKm(point, centre)
      if (!best || km < best.km) best = { area, km }
    }
    return best && best.km <= NEAREST_AREA_KM ? best.area : null
  }

  const pujos: Pujo[] = drafts.map(({ dataZone, pincodeArea, ...draft }) => {
    const point = draft.lat !== null && draft.lng !== null ? { lat: draft.lat, lng: draft.lng } : null
    let area: Area | null = pincodeArea
    if (point) {
      const centre = pincodeArea ? centres.get(pincodeArea.id) : null
      /* trust the pin over a pincode it contradicts */
      if (!pincodeArea || !centre || straightKm(point, centre) > PINCODE_TRUST_KM) area = nearestArea(point) ?? pincodeArea
    }
    /* no pin and no pincode, but "Ultadanga Sangrami" says where it is; a pin has to agree */
    if (!area) {
      const named = areaFromText(rawNames.get(draft.slug), draft.place, draft.address)
      const centre = named ? centres.get(named.id) : null
      if (named && (!point || (centre && straightKm(point, centre) <= KEYWORD_AREA_KM))) area = named
    }
    const far = point && straightKm(point, KOLKATA_CENTRE) > SUBURB_KM
    const zone: ZoneId = area?.zone ?? (far ? 'suburbs' : dataZone ?? 'suburbs')
    const station = point ? nearest(point, stations) : null
    return {
      ...draft,
      area: area?.id ?? null,
      zone,
      metro: station && station.km <= METRO_KM ? { id: station.place.id, km: Math.round(station.km * 1000) / 1000 } : null,
    }
  })

  /* two pujos called "Mallick Bari": say which */
  const byName = new Map<string, Pujo[]>()
  for (const pujo of pujos) byName.set(pujo.name.toLowerCase(), [...(byName.get(pujo.name.toLowerCase()) ?? []), pujo])
  for (const same of byName.values()) {
    if (same.length < 2) continue
    for (const pujo of same) {
      const where = bracketOf(rawNames.get(pujo.slug) ?? '') ?? pujo.place?.split(', ').pop() ?? AREAS.find((a) => a.id === pujo.area)?.name
      if (where && !pujo.name.toLowerCase().includes(where.toLowerCase())) pujo.name = `${pujo.name}, ${where}`
    }
  }

  pujos.sort((a, b) => a.name.localeCompare(b.name, 'en'))

  const areas: AreaSummary[] = AREAS.map((area) => ({
    id: area.id,
    name: area.name,
    zone: area.zone,
    centre: centres.get(area.id) ?? null,
    count: pujos.filter((pujo) => pujo.area === area.id).length,
  }))

  return { pujos, areas, stations, landmarks, help, aliases }
}

/* ----------------------------------------------------------- reading it -- */

export const isRoutable = (pujo: Pujo): pujo is Pujo & LatLng => pujo.lat !== null && pujo.lng !== null

export function findPujo(index: Pick<PujoIndex, 'pujos' | 'aliases'>, slug: string): { pujo: Pujo; canonical: boolean } | null {
  const direct = index.pujos.find((pujo) => pujo.slug === slug)
  if (direct) return { pujo: direct, canonical: true }
  const target = index.aliases[slug]
  const merged = target ? index.pujos.find((pujo) => pujo.slug === target) : null
  return merged ? { pujo: merged, canonical: false } : null
}

/* "Red Road Carnival #1", "Featured", or nothing for a para pujo */
export function tierLabel(pujo: Pick<Pujo, 'famous' | 'rank'>): string | null {
  if (!pujo.famous) return null
  return pujo.rank ? `Red Road Carnival #${pujo.rank}` : 'Featured'
}
