// @ts-nocheck
import { categoryFromProviderTypes, normalizeText } from './taxonomy'
import { haversineDistanceKm } from './geo'

/* Ola fills unknown fields with "NA", "" or -1 rather than leaving them out */
const PLACEHOLDER = /^(na|n\/a|null|undefined|-1)$/i

function present(value) {
  if (value === undefined || value === null) return false
  if (typeof value === 'string') return value.trim() !== '' && !PLACEHOLDER.test(value.trim())
  return true
}

function firstPresent(...values) {
  return values.find(present)
}

function numberOrNull(value) {
  if (!present(value)) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function extractCoordinates(raw) {
  const location = raw.geometry?.location ?? raw.coordinates ?? raw.location ?? raw.position ?? {}
  const latitude = numberOrNull(firstPresent(location.lat, location.latitude, raw.latitude, raw.lat))
  const longitude = numberOrNull(firstPresent(location.lng, location.lon, location.longitude, raw.longitude, raw.lng))
  return { latitude, longitude }
}

function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/* "Flurys, 18A, Park St, Park Street Area, Kolkata, West Bengal, 700071, India"
   → "18A, Park St, Park Street Area, Kolkata" */
export function tidyAddress(address, name = '') {
  if (!present(address)) return null
  let parts = String(address).split(',').map((part) => part.trim()).filter(Boolean)
  if (name && parts.length > 1 && normalizeText(parts[0]) === normalizeText(name)) parts = parts.slice(1)
  parts = parts.filter((part) => !/^(india|west bengal|\d{6}|west bengal \d{6})$/i.test(part))
  const tidy = parts.join(', ')
  return tidy || null
}

const AREA_COMPONENT_TYPES = ['neighborhood', 'sublocality_level_1', 'sublocality', 'postal_town']

export function inferArea(raw, address) {
  const components = Array.isArray(raw?.address_components) ? raw.address_components : []
  for (const type of AREA_COMPONENT_TYPES) {
    const component = components.find((entry) => entry.types?.includes(type) && present(entry.long_name))
    if (component && !/^kolkata$/i.test(component.long_name)) return component.long_name
  }
  const parts = String(address || '').split(',').map((part) => part.trim()).filter(Boolean)
  const kolkataIndex = parts.findIndex((part) => /^kolkata$/i.test(part))
  if (kolkataIndex > 0 && !/^\d/.test(parts[kolkataIndex - 1])) return parts[kolkataIndex - 1]
  return null
}

function openingHoursFrom(raw) {
  const text = firstPresent(raw.opening_hours?.weekday_text, raw.openingHours?.weekdayText)
  if (Array.isArray(text)) return text.filter(present).length ? text.filter(present) : null
  const hours = firstPresent(raw.opening_hours, raw.openingHours)
  if (Array.isArray(hours)) return hours.length ? hours : null
  return null
}

export function normalizeProviderPlace(raw, provider = 'unknown') {
  /* autocomplete and nearby predictions carry the address in `description` */
  const isPrediction = Boolean(raw.structured_formatting)
  const name = firstPresent(raw.name, raw.display_name, raw.displayName?.text, raw.structured_formatting?.main_text, isPrediction ? undefined : raw.description)
  if (!name) return null

  const providerPlaceId = String(firstPresent(raw.place_id, raw.placeId, raw.id, raw.reference, '') || '')
  const types = firstPresent(raw.types, raw.categories, raw.category, raw.type, [])
  const typeList = (Array.isArray(types) ? types : [types])
    .map((type) => typeof type === 'object' ? firstPresent(type.name, type.slug, type.id) : type)
    .filter(Boolean)
  const category = categoryFromProviderTypes(typeList)
  const { latitude, longitude } = extractCoordinates(raw)
  const address = tidyAddress(
    firstPresent(raw.formatted_address, raw.formattedAddress, raw.address, raw.vicinity, raw.structured_formatting?.secondary_text, isPrediction ? raw.description : undefined),
    name,
  )
  const area = firstPresent(raw.area, raw.neighbourhood, raw.neighborhood) ?? inferArea(raw, address)
  const rating = numberOrNull(raw.rating)
  const ratingCount = numberOrNull(firstPresent(raw.user_ratings_total, raw.ratingCount, raw.rating_count))
  const distanceMeters = numberOrNull(firstPresent(raw.distance_meters, raw.distanceMeters))
  const phone = firstPresent(raw.phone, raw.formatted_phone_number, raw.international_phone_number, raw.phones?.[0])
  const website = firstPresent(raw.website, raw.website_url, raw.url)

  return {
    provider,
    providerPlaceId,
    slug: `${slugify(name)}${providerPlaceId ? `-${slugify(providerPlaceId).slice(-8)}` : ''}`,
    name: String(name).trim(),
    description: (isPrediction ? firstPresent(raw.summary) : firstPresent(raw.description, raw.summary)) ?? null,
    address,
    area: area ? String(area).trim() : null,
    latitude,
    longitude,
    category: category.name,
    categorySlug: category.slug,
    tags: typeList.map(normalizeText).filter(Boolean),
    rating: rating !== null && rating > 0 ? rating : null,
    ratingCount: ratingCount === null || ratingCount <= 0 ? null : Math.round(ratingCount),
    status: firstPresent(raw.business_status, raw.status) ?? null,
    image: firstPresent(raw.image, raw.photoUrl, raw.photo_url) ?? null,
    phone: phone && /\d{6,}/.test(String(phone).replace(/\D/g, '')) ? String(phone) : null,
    website: website && /^https?:\/\//i.test(String(website)) ? String(website) : null,
    openingHours: openingHoursFrom(raw),
    sourceConfidence: provider === 'ola' ? 0.9 : 0.7,
    lastVerifiedAt: new Date().toISOString(),
    distanceKm: distanceMeters === null ? undefined : distanceMeters / 1000,
  }
}

export function placeIdentityKey(place) {
  if (place.provider && place.providerPlaceId) return `${place.provider}:${place.providerPlaceId}`
  const lat = Number.isFinite(place.latitude) ? place.latitude.toFixed(4) : ''
  const lng = Number.isFinite(place.longitude) ? place.longitude.toFixed(4) : ''
  return `${normalizeText(place.name)}:${lat}:${lng}`
}

function sameCoordinates(left, right) {
  if (![left.latitude, left.longitude, right.latitude, right.longitude].every(Number.isFinite)) return false
  return haversineDistanceKm(
    { lat: left.latitude, lng: left.longitude },
    { lat: right.latitude, lng: right.longitude }
  ) <= 0.12
}

function sameContact(left, right) {
  const phone = (value) => String(value ?? '').replace(/\D/g, '').slice(-10)
  const leftPhone = phone(left.phone)
  const rightPhone = phone(right.phone)
  if (leftPhone && rightPhone && leftPhone === rightPhone) return true

  try {
    return Boolean(left.website && right.website && new URL(left.website).hostname === new URL(right.website).hostname)
  } catch {
    return false
  }
}

export function placeMatchConfidence(left, right) {
  if (left.provider && right.provider && left.provider === right.provider
    && left.providerPlaceId && left.providerPlaceId === right.providerPlaceId) return 1

  let score = 0
  if (normalizeText(left.name) === normalizeText(right.name)) score += 0.55
  if (sameCoordinates(left, right)) score += 0.35
  if (sameContact(left, right)) score += 0.45
  return Math.min(score, 1)
}

/* A fuzzy match needs the same name (0.55) plus coordinates or contact, so
   only places sharing a normalised name are ever compared — linear, not n². */
export function mergeUniquePlaces(...groups) {
  const merged = []
  const byIdentity = new Map()
  const byName = new Map()

  for (const place of groups.flat()) {
    if (!place) continue
    const identity = placeIdentityKey(place)
    const name = normalizeText(place.name)
    let existingIndex = byIdentity.get(identity)
    if (existingIndex === undefined) {
      existingIndex = (byName.get(name) ?? []).find((index) => placeMatchConfidence(merged[index], place) >= 0.85)
    }

    if (existingIndex === undefined) {
      const index = merged.push(place) - 1
      byIdentity.set(identity, index)
      byName.set(name, [...(byName.get(name) ?? []), index])
      continue
    }

    const existing = merged[existingIndex]
    /* the first source wins, but its gaps are filled from the later one */
    const filled = Object.fromEntries(Object.entries(existing).filter(([, value]) => value !== null && value !== undefined))
    merged[existingIndex] = {
      ...place,
      ...filled,
      tags: [...new Set([...(existing.tags ?? []), ...(place.tags ?? [])])],
      sourceConfidence: Math.max(existing.sourceConfidence ?? 0, place.sourceConfidence ?? 0),
    }
    byIdentity.set(identity, existingIndex)
  }
  return merged
}
