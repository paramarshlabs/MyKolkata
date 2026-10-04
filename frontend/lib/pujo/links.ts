/* ==========================================================================
   Links out of the app: a pujo's own page, and Google Maps for directions.
   Our map is where a route lives; Google is for turn-by-turn, when someone
   wants it. Coordinates go into a link, never a name alone, so Google can't
   guess a different "Sarbojanin".
   ========================================================================== */

import type { LatLng } from './geo'

/* /pujo with that pujo's sheet open (PujoProvider reads ?pandal=) */
export const pujoPath = (slug: string) => `/pujo?pandal=${encodeURIComponent(slug)}`

const at = (point: LatLng) => `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`

export type TravelMode = 'walking' | 'transit' | 'driving'

/* directions to a point; with no origin, Google starts from wherever the phone is */
export function directionsUrl(destination: LatLng, { mode = 'walking', origin }: { mode?: TravelMode; origin?: LatLng } = {}) {
  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  if (origin) url.searchParams.set('origin', at(origin))
  url.searchParams.set('destination', at(destination))
  url.searchParams.set('travelmode', mode)
  return url.toString()
}

/* the place itself, for "show me where this is" */
export function placeUrl(point: LatLng) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(at(point))}`
}
