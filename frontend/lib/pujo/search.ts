/* ==========================================================================
   Search over every pujo, in the browser: instant, and it works on one bar of
   signal. It matches names, the area, the locality, the pincode, the zone and
   Metro stations ("Shyambazar metro"), forgiving spelling (normalise.ts).
   Food picks are searched alongside and come back in their own group.

   Order: pujos whose name matched come first, then pujos that matched on
   where they are; in each, famous first, then nearest when there's somewhere
   to measure from (the trip's route, or you), otherwise alphabetical.
   ========================================================================== */

import { straightKm, type LatLng } from './geo'
import { FILLER, fold, wordMatch } from './normalise'
import { zoneOf, type ZoneId } from './sectors'

/* what search needs to know about a pujo */
export type Searchable = {
  slug: string
  name: string
  fullName: string
  zone: ZoneId
  area: string | null
  place: string | null
  pincode: string | null
  lat: number | null
  lng: number | null
  famous: boolean
}

export type SearchableFood = { id: string; name: string; area: string; order: string; lat: number; lng: number }
export type SearchableStation = LatLng & { id: string; name: string }

type Field = { words: string[]; fuzzy: boolean; weight: number }
type Doc<T> = { item: T; name: Field; fields: Field[]; pincode: string | null }

export type SearchIndex<T extends Searchable = Searchable, F extends SearchableFood = SearchableFood> = {
  pujos: Doc<T>[]
  food: Doc<F>[]
  stations: { station: SearchableStation; words: string[] }[]
}

/* "Shyambazar metro": pujos within this of the station, in a straight line */
export const STATION_KM = 1
/* "metro" on its own: pujos this close to any station */
export const NEAR_METRO_KM = 0.5

export function buildSearchIndex<T extends Searchable, F extends SearchableFood>({
  pujos, food = [], stations, areas,
}: {
  pujos: readonly T[]
  food?: readonly F[]
  stations: readonly SearchableStation[]
  areas: readonly { id: string; name: string }[]
}): SearchIndex<T, F> {
  const areaName = new Map(areas.map((area) => [area.id, area.name]))
  return {
    pujos: pujos.map((pujo) => ({
      item: pujo,
      name: { words: fold(pujo.name), fuzzy: true, weight: 3 },
      fields: [
        { words: fold(pujo.fullName), fuzzy: true, weight: 2 },
        { words: fold([areaName.get(pujo.area ?? '') ?? '', pujo.place ?? ''].join(' ')), fuzzy: false, weight: 1 },
        { words: fold(`${zoneOf(pujo.zone).label} ${zoneOf(pujo.zone).long}`), fuzzy: false, weight: 1 },
      ],
      pincode: pujo.pincode,
    })),
    food: food.map((spot) => ({
      item: spot,
      name: { words: fold(spot.name), fuzzy: true, weight: 3 },
      fields: [{ words: fold(`${spot.area} ${spot.order}`), fuzzy: false, weight: 1 }],
      pincode: null,
    })),
    stations: stations.map((station) => ({ station, words: fold(station.name) })),
  }
}

export type Query = { words: string[]; pincode: string | null; metro: boolean; text: string }

export function parseQuery(raw: string): Query {
  const text = raw.trim().slice(0, 80)
  const folded = fold(text)
  const metro = folded.includes('metro')
  /* "700006", or its start */
  const pincode = folded.find((word) => /^7\d{2,5}$/.test(word)) ?? null
  const plain = folded.filter((word) => word !== 'metro' && word !== pincode)
  const meaningful = plain.filter((word) => !FILLER.has(word))
  /* filler words count only when they're all that was typed: "durga puja" */
  return { words: meaningful.length ? meaningful : plain, pincode, metro, text }
}

function best(typed: string, fields: Field[], fuzzy: boolean): number {
  let score = 0
  for (const field of fields) {
    for (const word of field.words) score = Math.max(score, wordMatch(typed, word, fuzzy && field.fuzzy) * field.weight)
  }
  return score
}

function scoreDoc<T>(doc: Doc<T>, query: Query, fuzzy: boolean): { score: number; nameMatch: boolean } | null {
  if (query.pincode && !(doc.pincode ?? '').startsWith(query.pincode)) return null
  let score = query.pincode ? 1 : 0
  let nameMatch = query.words.length > 0
  for (const typed of query.words) {
    const inName = best(typed, [doc.name], fuzzy)
    const top = Math.max(inName, best(typed, doc.fields, fuzzy))
    if (!top) return null
    if (!inName) nameMatch = false
    score += top
  }
  return { score, nameMatch }
}

/* the stations a query names: every typed word in the station's name */
export function matchStations(index: Pick<SearchIndex, 'stations'>, words: string[]): SearchableStation[] {
  if (!words.length) return []
  return index.stations
    .filter(({ words: names }) => words.every((typed) => names.some((word) => wordMatch(typed, word) > 0)))
    .map(({ station }) => station)
}

export type SearchOptions = {
  /* straight-line km from wherever the list is measured from, or null */
  distance?: (point: LatLng) => number | null
  limit?: number
}

export type Hit<T> = { item: T; km: number | null }
export type SearchResult<T, F> = {
  pujos: Hit<T>[]
  food: Hit<F>[]
  total: number
  /* the stations a "… metro" search was about, to say so */
  stations: SearchableStation[]
}

type Scored<T> = { item: T; nameMatch: boolean; km: number | null }

function order<T extends { name: string; famous?: boolean }>(hits: Scored<T>[]) {
  return hits.sort((a, b) =>
    Number(b.nameMatch) - Number(a.nameMatch)
    || Number(Boolean(b.item.famous)) - Number(Boolean(a.item.famous))
    || (a.km !== null && b.km !== null ? a.km - b.km : a.km !== null ? -1 : b.km !== null ? 1 : 0)
    || a.item.name.localeCompare(b.item.name, 'en'))
}

const located = (item: { lat: number | null; lng: number | null }): item is { lat: number; lng: number } =>
  item.lat !== null && item.lng !== null

export function search<T extends Searchable, F extends SearchableFood>(
  index: SearchIndex<T, F>,
  raw: string,
  { distance, limit = 60 }: SearchOptions = {},
): SearchResult<T, F> {
  const query = parseQuery(raw)
  const empty = { pujos: [], food: [], total: 0, stations: [] }
  if (!query.words.length && !query.pincode && !query.metro) return empty

  const measure = (item: { lat: number | null; lng: number | null }) => (distance && located(item) ? distance(item) : null)

  /* "Shyambazar metro": the pujos around that station, nearest to it first */
  if (query.metro) {
    const stations = query.words.length ? matchStations(index, query.words) : index.stations.map(({ station }) => station)
    const reach = query.words.length ? STATION_KM : NEAR_METRO_KM
    const hits: Scored<T>[] = []
    for (const { item } of index.pujos) {
      if (!located(item)) continue
      const km = Math.min(...stations.map((station) => straightKm(item, station)))
      if (km <= reach) hits.push({ item, nameMatch: false, km: query.words.length ? km : measure(item) })
    }
    const sorted = order(hits)
    return { pujos: sorted.slice(0, limit), food: [], total: sorted.length, stations: query.words.length ? stations : [] }
  }

  /* strict first; one edit of slack only when that finds nothing, so Bagbazar never brings Bowbazar */
  const collect = (fuzzy: boolean) => {
    const pujos: Scored<T>[] = []
    for (const doc of index.pujos) {
      const scored = scoreDoc(doc, query, fuzzy)
      if (scored) pujos.push({ item: doc.item, nameMatch: scored.nameMatch, km: measure(doc.item) })
    }
    const food: Scored<F>[] = []
    if (!query.pincode) {
      for (const doc of index.food) {
        const scored = scoreDoc(doc, query, fuzzy)
        if (scored?.nameMatch) food.push({ item: doc.item, nameMatch: true, km: measure(doc.item) })
      }
    }
    return { pujos, food }
  }
  let { pujos: pujoHits, food: foodHits } = collect(false)
  if (!pujoHits.length && !foodHits.length) ({ pujos: pujoHits, food: foodHits } = collect(true))

  const pujos = order(pujoHits)
  return {
    pujos: pujos.slice(0, limit).map(({ item, km }) => ({ item, km })),
    food: order(foodHits).slice(0, 8).map(({ item, km }) => ({ item, km })),
    total: pujos.length,
    stations: [],
  }
}

/* the empty state names what was typed */
export const noMatch = (text: string) => `No pujo called ‘${text.trim()}’. Try the para's name or a Metro station.`
