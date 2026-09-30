/* ==========================================================================
   Distances for walking between pujos. Straight-line, then × 1.3 for the
   lanes: close enough to order a route and say "12 min" on the device, with
   no API. The real path comes from Ola once the order is set.
   ========================================================================== */

export type LatLng = { lat: number; lng: number }

const EARTH_RADIUS_KM = 6371.0088
/* lanes wind; a crow's kilometre is about 1.3 on foot */
export const WALK_FACTOR = 1.3
/* a Pujo crowd walks slower than a weekday: 4.5 km an hour */
export const WALK_KMH = 4.5

const rad = (degrees: number) => (degrees * Math.PI) / 180

export function straightKm(a: LatLng, b: LatLng) {
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export const walkKm = (a: LatLng, b: LatLng) => straightKm(a, b) * WALK_FACTOR

/* whole minutes, never 0 for a real walk */
export const walkMinutes = (km: number) => Math.max(1, Math.round((km / WALK_KMH) * 60))

export function hasPosition<T extends { lat: number | null; lng: number | null }>(value: T): value is T & LatLng {
  return Number.isFinite(value.lat) && Number.isFinite(value.lng)
}

/* "350 m", "1.2 km", "12 km": what a person reads, not what was measured */
export function formatKm(km: number) {
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`
  if (km < 10) return `${(Math.round(km * 10) / 10).toFixed(1)} km`
  return `${Math.round(km)} km`
}

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export function centroid(points: LatLng[]): LatLng | null {
  if (!points.length) return null
  return {
    lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
    lng: points.reduce((sum, p) => sum + p.lng, 0) / points.length,
  }
}

/* the middle of the set, robust to a stray pin or two */
export function medianPoint(points: LatLng[]): LatLng | null {
  if (!points.length) return null
  const middle = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b)
    const i = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[i] : (sorted[i - 1] + sorted[i]) / 2
  }
  return { lat: middle(points.map((p) => p.lat)), lng: middle(points.map((p) => p.lng)) }
}

/* the points near the middle of a set, so a stray pin 30 km out doesn't stretch a map's frame */
export function corePoints<T extends LatLng>(points: T[], { minKm = 6, factor = 2.5 } = {}): T[] {
  const middle = medianPoint(points)
  if (!middle || points.length < 4) return points
  const distances = points.map((p) => straightKm(p, middle)).sort((a, b) => a - b)
  const typical = distances[Math.floor(distances.length / 2)]
  const reach = Math.max(minKm, typical * factor)
  return points.filter((p) => straightKm(p, middle) <= reach)
}

export const KOLKATA_CENTRE: LatLng = { lat: 22.5726, lng: 88.3639 }
