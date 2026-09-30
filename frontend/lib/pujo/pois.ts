/* ==========================================================================
   The places around the pujos, from kolkata_puja_pois: Metro stations and the
   lines they're on, landmarks, and where to find help. Phone numbers in that
   table are not shown anywhere: several look made up ("033-2555-1234"), and
   every number the app offers to call is checked by hand (lib/pujo/help.ts).
   ========================================================================== */

import { straightKm, type LatLng } from './geo'

export const METRO_LINES = {
  /* official line colours: the one approved exception to the palette */
  blue: { name: 'Blue Line', colour: '#2f6fd0' },
  green: { name: 'Green Line', colour: '#1f9a58' },
  purple: { name: 'Purple Line', colour: '#8a4fb8' },
  yellow: { name: 'Yellow Line', colour: '#e8c21c' },
  orange: { name: 'Orange Line', colour: '#ec7d22' },
} as const

export type MetroLineId = keyof typeof METRO_LINES

export type Station = LatLng & { id: string; name: string; lines: MetroLineId[] }
export type Landmark = LatLng & { id: string; name: string }
export type HelpKind = 'police' | 'hospital' | 'help-desk'
export type HelpPoint = LatLng & { id: string; name: string; kind: HelpKind; address: string | null }

export type PoiRow = {
  id: string
  name: string
  category: string | null
  address: string | null
  lat: number | null
  lng: number | null
}

/* "Blue/Yellow Line Interchange, Kolkata Metro" → ['blue', 'yellow'] */
export function linesFromText(text: string | null | undefined): MetroLineId[] {
  const match = text?.match(/((?:blue|green|purple|yellow|orange)(?:\/(?:blue|green|purple|yellow|orange))*)\s+line/i)
  if (!match) return []
  return match[1].toLowerCase().split('/') as MetroLineId[]
}

const located = (row: PoiRow): row is PoiRow & LatLng => Number.isFinite(row.lat) && Number.isFinite(row.lng)

export type Places = { stations: Station[]; landmarks: Landmark[]; help: HelpPoint[] }

const HELP_KINDS: Record<string, HelpKind> = { 'police-station': 'police', hospital: 'hospital', 'help-desk': 'help-desk' }

export function placesFromRows(rows: PoiRow[]): Places {
  const stations: Station[] = []
  const landmarks: Landmark[] = []
  const help: HelpPoint[] = []
  for (const row of rows.filter(located)) {
    const point = { lat: row.lat, lng: row.lng }
    if (row.category === 'metro-station') {
      const lines = linesFromText(row.address)
      if (lines.length) stations.push({ id: row.id, name: row.name, lines, ...point })
    } else if (row.category === 'popular-landmark') {
      landmarks.push({ id: row.id, name: row.name.replace(/\s*\(.*\)$/, ''), ...point })
    } else if (row.category && HELP_KINDS[row.category]) {
      help.push({ id: row.id, name: row.name, kind: HELP_KINDS[row.category], address: row.address, ...point })
    }
  }
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)
  return { stations: stations.sort(byName), landmarks: landmarks.sort(byName), help: help.sort(byName) }
}

export function nearest<T extends LatLng>(point: LatLng, places: readonly T[]): { place: T; km: number } | null {
  let best: { place: T; km: number } | null = null
  for (const place of places) {
    const km = straightKm(point, place)
    if (!best || km < best.km) best = { place, km }
  }
  return best
}

export const stationLabel = (station: Station) => `${station.name} Metro`

export const sharedLine = (a: Station, b: Station): MetroLineId | null => a.lines.find((line) => b.lines.includes(line)) ?? null

export const lineNames = (station: Station) => station.lines.map((line) => METRO_LINES[line].name).join(' and ')
