import { NextResponse } from 'next/server'
import { OlaPlacesProvider } from '@/lib/places/olaPlacesProvider'
import { parseCoordinate } from '@/lib/places/geo'
import { WikimediaImageProvider } from '@/lib/places/wikimediaImageProvider'

const provider = new OlaPlacesProvider()
const imageProvider = new WikimediaImageProvider()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const source = String(searchParams.get('provider') || '').slice(0, 24)
  const id = String(searchParams.get('id') || '').slice(0, 240)
  const name = String(searchParams.get('name') || '').trim().slice(0, 160)
  const lat = parseCoordinate(searchParams.get('lat'), 'latitude')
  const lng = parseCoordinate(searchParams.get('lng'), 'longitude')

  if (!provider.configured || (!id && (!name || lat === null || lng === null))) {
    return NextResponse.json({ data: null, meta: { enriched: false } })
  }

  try {
    const place =
      source === 'ola' && id
        ? await provider.details(id)
        : await provider.resolveDetails({ name, lat, lng })
    const commonsImage = place?.image ? null : await imageProvider.findImage({ name, lat, lng })
    const enrichedPlace =
      place || commonsImage
        ? {
            ...(place || {
              name,
              latitude: lat,
              longitude: lng,
              provider: source || 'overture',
              providerPlaceId: id,
            }),
            ...(commonsImage || {}),
          }
        : null

    return NextResponse.json(
      {
        data: enrichedPlace,
        meta: {
          enriched: Boolean(enrichedPlace),
          provider: place ? 'ola' : commonsImage?.imageProvider || null,
        },
      },
      { headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=3600' } },
    )
  } catch (error) {
    console.error(`[places:details] ${(error as Error)?.message || 'unavailable'}`)
    return NextResponse.json({ data: null, meta: { enriched: false, providerStatus: 'unavailable' } })
  }
}
