import { prisma } from '@/lib/db/prisma'
import { AnakinImageProvider } from '@/lib/places/anakinImageProvider'
import { FEEDS } from './feeds'
import { refreshLive, type LiveRepository, type LiveRow, type RefreshOptions, type SearchFn } from './refresh'
import { createScraper, createWire } from './wire'

/* The Prisma side of the live feeds, and a refresh run against it. Kept out
   of server.ts (which is server-only and uses next/server) so that
   scripts/live-refresh.ts can run it from a terminal. */
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

export function runLiveRefresh(options: Partial<Omit<RefreshOptions, 'repository' | 'wire' | 'search' | 'scrape'>> = {}) {
  return refreshLive({ repository: liveRepository, feeds: FEEDS, wire: createWire(), search: anakinSearch(), scrape: createScraper(), ...options })
}
