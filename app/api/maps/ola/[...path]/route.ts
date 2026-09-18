import {
  OLA_MAPS_HOST,
  isAllowedOlaMapsPath,
  olaMapsRequestOrigin,
  rewriteOlaMapsUrls,
} from '@/lib/places/olaMapsProxy'

export const runtime = 'nodejs'

function upstreamUrl(pathSegments: string[], searchParams: URLSearchParams) {
  const path = pathSegments.join('/')
  if (!isAllowedOlaMapsPath(path)) return null

  const target = new URL(`${OLA_MAPS_HOST}/${path}`)
  for (const [key, value] of searchParams.entries()) {
    if (key === 'api_key') continue
    target.searchParams.append(key, value)
  }

  const apiKey = process.env.OLA_MAPS_API_KEY
  if (!apiKey) return null
  target.searchParams.set('api_key', apiKey)
  return target
}

/* The origin the browser actually used (localhost, LAN IP, preview host) —
   MapLibre rejects relative sprite/glyph URLs inside a style. */
function publicOrigin(request: Request) {
  const url = new URL(request.url)
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || url.protocol.replace(':', '')
  return `${proto}://${host}`
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments = [] } = await context.params
  const target = upstreamUrl(pathSegments, new URL(request.url).searchParams)
  if (!target) {
    return Response.json({ error: 'Map tiles are not configured.' }, { status: 503 })
  }

  const origin = olaMapsRequestOrigin()
  const headers: Record<string, string> = {
    Accept: request.headers.get('Accept') || '*/*',
    'X-Request-Id': globalThis.crypto?.randomUUID?.() || `mykolkata-map-${Date.now()}`,
  }
  if (origin) {
    headers.Origin = origin
    headers.Referer = `${origin}/`
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)
    const upstream = await fetch(target, { headers, signal: controller.signal, redirect: 'follow' })
    clearTimeout(timeout)

    if (!upstream.ok) {
      return Response.json(
        { error: 'Ola Maps rejected the tile request.' },
        { status: upstream.status === 401 || upstream.status === 403 ? 502 : upstream.status },
      )
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
    const cacheControl = contentType.includes('json')
      ? 'public, max-age=300, stale-while-revalidate=3600'
      : 'public, max-age=86400, stale-while-revalidate=604800'

    if (contentType.includes('json') || contentType.includes('text')) {
      const body = rewriteOlaMapsUrls(await upstream.text(), publicOrigin(request))
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': contentType.includes('json') ? 'application/json; charset=utf-8' : contentType,
          'Cache-Control': cacheControl,
          Vary: 'Host, X-Forwarded-Host',
        },
      })
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
      },
    })
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError'
    return Response.json(
      { error: timedOut ? 'Ola Maps timed out.' : 'Ola Maps proxy failed.' },
      { status: timedOut ? 504 : 502 },
    )
  }
}
