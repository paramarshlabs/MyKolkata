/* Proxy Ola vector tiles through our origin so phone / LAN / preview hosts
   are not blocked by Ola's browser-domain allowlist. The server calls Ola with
   OLA_MAPS_REQUEST_ORIGIN (an allowlisted domain such as http://localhost:3000). */

export const OLA_MAPS_HOST = 'https://api.olamaps.io'
export const OLA_MAPS_PROXY_PREFIX = '/api/maps/ola'
export const OLA_STYLE_PATH = '/tiles/vector/v1/styles/default-dark-standard/style.json'

const ALLOWED_PREFIXES = [
  'tiles/vector/',
  'tiles/raster/',
]

export function isAllowedOlaMapsPath(path: string | null | undefined) {
  const normalized = String(path || '').replace(/^\/+/, '')
  if (!normalized || normalized.includes('..')) return false
  return ALLOWED_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}

export function olaMapsRequestOrigin() {
  return (process.env.OLA_MAPS_REQUEST_ORIGIN
    || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '')).replace(/\/$/, '')
}

export function rewriteOlaMapsUrls(body: string, proxyOrigin = '') {
  const prefix = `${proxyOrigin}${OLA_MAPS_PROXY_PREFIX}/`
  return String(body)
    .replaceAll(`${OLA_MAPS_HOST}/`, prefix)
    .replaceAll('http://api.olamaps.io/', prefix)
}

export function clientOlaStyleUrl() {
  if (typeof window === 'undefined') return `${OLA_MAPS_PROXY_PREFIX}${OLA_STYLE_PATH}?app=mykolkata-v1`
  return `${window.location.origin}${OLA_MAPS_PROXY_PREFIX}${OLA_STYLE_PATH}?app=mykolkata-v1`
}

/* MapLibre may still request absolute Ola URLs from cached style bits — send them through us. */
export function proxiedOlaMapsUrl(url: string) {
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    const parsed = new URL(url, base)
    if (parsed.hostname === 'api.olamaps.io') {
      parsed.searchParams.delete('api_key')
      return `${base}${OLA_MAPS_PROXY_PREFIX}${parsed.pathname}${parsed.search}`
    }
    if (parsed.pathname.startsWith(OLA_MAPS_PROXY_PREFIX)) {
      parsed.searchParams.delete('api_key')
      return parsed.toString()
    }
  } catch {
    /* keep the original URL */
  }
  return url
}
