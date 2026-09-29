import 'server-only'
import { after } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { FEEDS } from './feeds'
import { dueFeeds, snapshotOf, type LiveRow, type LiveSnapshot } from './refresh'
import { liveRepository, runLiveRefresh } from './store'

/* The two ways the live feeds refresh: after a /home view when something is
   stale, and from /api/cron/live. The Prisma side is in store.ts. */
export { runLiveRefresh }

let refreshing = false
let warned = false

/* What /home shows. Never throws: no table yet, or a database outage, is
   simply no live data, and every section that uses it has its own fallback.
   When something is stale, one small refresh runs after the response. */
export async function loadLive(now: Date = new Date()): Promise<LiveSnapshot> {
  let rows: LiveRow[] = []
  try {
    rows = await liveRepository.all()
  } catch (err) {
    /* most often: the live_feeds migration hasn't been applied yet. Once is enough. */
    if (!warned) console.warn('[live] could not read live feeds; showing fallbacks', err instanceof Error ? err.message.split('\n').pop() : err)
    warned = true
    return {}
  }
  if (process.env.ANAKIN_API_KEY && !refreshing && dueFeeds(FEEDS, rows, now).length) {
    after(async () => {
      if (refreshing) return
      refreshing = true
      try {
        const outcomes = await runLiveRefresh({ max: 2, budgetMs: 40_000 })
        if (outcomes.length) console.log('[live] refreshed after a view', outcomes)
      } catch (err) {
        console.error('[live] refresh failed', err)
      } finally {
        refreshing = false
      }
    })
  }
  return snapshotOf(rows)
}

/* The week's rising Kolkata searches, as stored by the searching feed, for
   the news ingestion to follow. Empty when there are none or no table. */
export async function trendingSearches(): Promise<string[]> {
  try {
    const row = await prisma.liveFeed.findUnique({ where: { key: 'searching' }, select: { payload: true } })
    const rising = (row?.payload as { rising?: { query?: unknown }[] } | null)?.rising
    return Array.isArray(rising) ? rising.map((item) => item?.query).filter((query): query is string => typeof query === 'string') : []
  } catch {
    return []
  }
}
