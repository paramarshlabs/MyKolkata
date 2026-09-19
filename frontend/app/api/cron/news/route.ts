import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { invalidate } from '@/lib/cache'
import { AnakinImageProvider } from '@/lib/places/anakinImageProvider'
import { activeEvents } from '@/lib/news/events'
import { HOME_NEWS_CACHE_KEY } from '@/lib/news/home'
import { ingestionDue, ingestKolkataNews, type NewsSearchClient } from '@/lib/news/ingest'
import { newsRepository } from '@/lib/news/server'

export const dynamic = 'force-dynamic'
/* dozens of searches and article fetches; well past the default limit */
export const maxDuration = 300

/*
 * News ingestion, called by Vercel Cron (vercel.json) with
 * `Authorization: Bearer $CRON_SECRET`. Runs daily; while an event is on it is
 * due every six hours, so a more frequent schedule only adds runs when they
 * matter. `?force=1` runs regardless.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const force = new URL(request.url).searchParams.get('force') === '1'
  try {
    if (!force && !ingestionDue(await newsRepository.lastIngestedAt(), activeEvents(now), now)) {
      console.log('[news] ingestion not due yet; skipping')
      return NextResponse.json({ skipped: true })
    }

    const summary = await ingestKolkataNews({
      repository: newsRepository,
      anakin: new AnakinImageProvider() as unknown as NewsSearchClient,
      now,
    })

    invalidate(HOME_NEWS_CACHE_KEY)
    revalidatePath('/home')
    revalidatePath('/api/news')
    return NextResponse.json(summary)
  } catch (err) {
    console.error('[news] ingestion failed', err)
    return NextResponse.json({ message: 'Ingestion failed' }, { status: 500 })
  }
}
