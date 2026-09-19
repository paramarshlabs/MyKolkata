import { OlaPlacesProvider } from '@/lib/places/olaPlacesProvider'

const provider = new OlaPlacesProvider() as OlaPlacesProvider & {
  baseUrl: string
  apiKey: string
  requestOrigin?: string
  configured: boolean
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference = String(searchParams.get('ref') || '')
  if (!provider.configured || !reference || reference.length > 600) {
    return new Response(null, { status: 404 })
  }

  try {
    const url = new URL(process.env.OLA_MAPS_PHOTO_PATH || '/places/v1/photo', `${provider.baseUrl}/`)
    url.searchParams.set('photo_reference', reference)
    url.searchParams.set('api_key', provider.apiKey)
    const headers: Record<string, string> = {
      Accept: 'image/*',
      'X-Request-Id': globalThis.crypto?.randomUUID?.() || `mykolkata-${Date.now()}`,
    }
    if (provider.requestOrigin) {
      headers.Origin = provider.requestOrigin
      headers.Referer = `${provider.requestOrigin}/`
    }
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 7000)
    const response = await fetch(url, { headers, redirect: 'follow', signal: controller.signal })
    clearTimeout(timeout)
    if (!response.ok) return new Response(null, { status: 404 })
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) return new Response(null, { status: 404 })
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length > 8 * 1024 * 1024) return new Response(null, { status: 413 })
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch {
    return new Response(null, { status: 404 })
  }
}
