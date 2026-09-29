import 'server-only'
import { after } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { AnakinImageProvider } from '@/lib/places/anakinImageProvider'
import { FEEDS } from './feeds'
import { dueFeeds, refreshLive, snapshotOf, type LiveRepository, type LiveRow, type LiveSnapshot, type SearchFn } from './refresh'
import { createWire } from './wire'

/* The Prisma side of the live feeds, and the two ways they refresh: after a
   /home view when something is stale, and from /api/cron/live. */
export const liveRepository: LiveRepository = {
  all: () => prisma.liveFeed.findMany() as Promise<LiveRow[]>,
  async claim(key, now, leaseMs) {
    await prisma.liveFeed.createMany({ data: [{ key }], skipDuplicates: true })
    const { count } = await prisma.liveFeed.updateMany({
      where: { key, OR: [{ attemptedAt: null }, { attemptedAt: { lt: new Date(now.getTime() - leaseMs) } }] },
      data: { attemptedAt: now },
    })
    return count === 1
  },
  async save(key, payload, now) {
    await prisma.liveFeed.update({ where: { key }, data: { payload: payload as object, fetchedAt: now, error: null } })
  },
  async fail(key, message, now) {
    await prisma.liveFeed.update({ where: { key }, data: { error: message, attemptedAt: now } })
  },
}

function anakinSearch(): SearchFn | null {
  if (!process.env.ANAKIN_API_KEY) return null
  const provider = new AnakinImageProvider() as unknown as { search: SearchFn }
  return (prompt, options) => provider.search(prompt, options)
}

export function runLiveRefresh(options: { max?: number; budgetMs?: number; only?: string[]; now?: Date } = {}) {
  return refreshLive({ repository: liveRepository, feeds: FEEDS, wire: createWire(), search: anakinSearch(), ...options })
}

let refreshing = false

/* What /home shows. Never throws: no table yet, or a database outage, is
   simply no live data, and every section that uses it has its own fallback.
   When something is stale, one small refresh runs after the response. */
export async function loadLive(now: Date = new Date()): Promise<LiveSnapshot> {
  let rows: LiveRow[] = []
  try {
    rows = await liveRepository.all()
  } catch (err) {
    console.error('[live] could not read live feeds', err instanceof Error ? err.message : err)
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
