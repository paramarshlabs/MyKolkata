// @ts-nocheck
const EARTH_RADIUS_KM = 6371.0088

export function parseCoordinate(value, kind) {
  if (value === undefined || value === null || value === '') return null
  const number = Number(value)
  const limit = kind === 'latitude' ? 90 : 180
  if (!Number.isFinite(number) || Math.abs(number) > limit) return null
  return number
}

export function haversineDistanceKm(origin, destination) {
  const toRadians = (degrees) => degrees * Math.PI / 180
  const lat1 = toRadians(origin.lat)
  const lat2 = toRadians(destination.lat)
  const deltaLat = toRadians(destination.lat - origin.lat)
  const deltaLng = toRadians(destination.lng - origin.lng)

  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function boundingBox({ lat, lng }, radiusKm) {
  const latitudeDelta = radiusKm / 110.574
  const longitudeDelta = radiusKm / (111.320 * Math.max(Math.cos(lat * Math.PI / 180), 0.01))

  return {
    north: lat + latitudeDelta,
    south: lat - latitudeDelta,
    east: lng + longitudeDelta,
    west: lng - longitudeDelta,
  }
}

export function isInsideBounds({ lat, lng }, bounds) {
  return lat <= bounds.north && lat >= bounds.south && lng <= bounds.east && lng >= bounds.west
}
