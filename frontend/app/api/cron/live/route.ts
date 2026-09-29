import { NextResponse } from 'next/server'
import { runLiveRefresh } from '@/lib/live/server'
import { refreshIntervalMs } from '@/lib/live/refresh'

export const dynamic = 'force-dynamic'
/* Wire jobs are polled and the rate limit is ten requests a minute */
export const maxDuration = 300

/* Vercel fires a daily cron anywhere in its hour, so yesterday's run can be a
   little under a day ago: take what falls due within this much of now */
const EARLY_MS = 90 * 60_000

/*
 * Refreshes /home's live feeds (lib/live), called by Vercel Cron (vercel.json)
 * with `Authorization: Bearer $CRON_SECRET`. Between runs, /home refreshes a
 * couple of stale feeds after a view, so this is the catch-up, not the clock.
 * `?only=sky,adda` limits the run to those feeds.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const only = new URL(request.url).searchParams.get('only')?.split(',').map((key) => key.trim()).filter(Boolean)
  try {
    const intervalMs = Math.max(0, refreshIntervalMs() - EARLY_MS)
    const outcomes = await runLiveRefresh({ max: 20, budgetMs: 270_000, only, intervalMs })
    return NextResponse.json({ outcomes })
  } catch (err) {
    console.error('[live] cron refresh failed', err)
    return NextResponse.json({ message: 'Refresh failed' }, { status: 500 })
  }
}
