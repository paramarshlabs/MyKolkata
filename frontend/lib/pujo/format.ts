/* ==========================================================================
   How a pujo's facts read. Commas and spacing, never middle dots
   (docs/DESIGN.md §4.6), and distances as a person says them.
   ========================================================================== */

import { formatKm, walkMinutes, WALK_FACTOR } from './geo'
import { METRO_LINES, type Station } from './pois'
import { zoneOf, type ZoneId } from './sectors'

/* "Hatibagan–Shyambazar, North Kolkata" */
export function whereLine(areaName: string | null | undefined, zone: ZoneId) {
  const long = zoneOf(zone).long
  const zonePart = zone === 'suburbs' ? 'the suburbs' : long
  return areaName ? `${areaName}, ${zonePart}` : `Somewhere in ${zonePart}`
}

/* the nearest Metro, on foot: "Shyambazar Metro, 6 min walk" */
export function metroLine(metro: { km: number } | null, station: Station | null | undefined) {
  if (!metro || !station) return null
  const walk = metro.km * WALK_FACTOR
  return `${station.name} Metro, ${walkMinutes(walk)} min walk`
}

export function lineLabel(station: Station) {
  return station.lines.map((line) => METRO_LINES[line].name).join(' and ')
}

/* "Para pujo", "Red Road Carnival #1", "Featured" */
export function tierText(pujo: { famous: boolean; rank: number | null }) {
  if (!pujo.famous) return 'Para pujo'
  return pujo.rank ? `Red Road Carnival #${pujo.rank}` : 'Featured'
}

/* "1.2 km away", "400 m from your last stop" */
export function distanceText(km: number | null, from: 'you' | 'route' | null) {
  if (km === null || from === null) return null
  const walk = formatKm(km * WALK_FACTOR)
  return from === 'you' ? `${walk} away` : `${walk} from your last stop`
}

export const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
