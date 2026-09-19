import type { PrismaClient } from '@prisma/client'

/* ==========================================================================
   The news table, as the ingestion and Home read paths need it. Kept behind
   this small interface so both can be tested without a database.
   ========================================================================== */

export type NewsRecord = {
  id: string
  title: string
  description: string | null
  image: string | null
  imageSource: string | null
  imageSourceUrl: string | null
  link: string | null
  canonicalUrl: string | null
  titleKey: string | null
  contentHash: string | null
  sourceName: string | null
  sourceDomain: string | null
  publishedAt: Date | null
  discoveredAt: Date
  lastSeenAt: Date | null
  type: string
  category: string | null
  eventSlug: string | null
  eventPhase: string | null
  score: number
  isActive: boolean
  featuredAt: Date | null
  cooldownUntil: Date | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type NewsWrite = Partial<Omit<NewsRecord, 'id' | 'createdAt' | 'updatedAt'>>

export type DuplicateKeys = { canonicalUrl?: string | null; titleKey?: string | null; contentHash?: string | null }

export interface NewsRepository {
  /* an existing row matching any dedup key: canonical URL, then title+source, then content hash */
  findDuplicate(keys: DuplicateKeys): Promise<NewsRecord | null>
  create(data: NewsWrite & { title: string }): Promise<NewsRecord>
  update(id: string, data: NewsWrite): Promise<NewsRecord>
  /* switch off dynamic stories whose expiresAt has passed; returns how many */
  deactivateExpired(now: Date): Promise<number>
  /* active stories of these types discovered or published since `since` */
  listRecent(types: string[], since: Date): Promise<NewsRecord[]>
  /* newest row of a type, optionally only active ones — the fallbacks */
  latestOfType(type: string, options?: { activeOnly?: boolean }): Promise<NewsRecord | null>
  /* when ingestion last saw a story; null if never */
  lastIngestedAt(): Promise<Date | null>
}

export function createPrismaNewsRepository(prisma: PrismaClient): NewsRepository {
  const news = prisma.news
  return {
    async findDuplicate({ canonicalUrl, titleKey, contentHash }) {
      /* checked in priority order so the canonical URL wins when keys disagree */
      for (const where of [
        canonicalUrl ? { canonicalUrl } : null,
        titleKey ? { titleKey } : null,
        contentHash ? { contentHash } : null,
      ]) {
        if (!where) continue
        const row = await news.findUnique({ where })
        if (row) return row as NewsRecord
      }
      return null
    },
    async create(data) {
      return (await news.create({ data })) as NewsRecord
    },
    async update(id, data) {
      return (await news.update({ where: { id }, data })) as NewsRecord
    },
    async deactivateExpired(now) {
      const { count } = await news.updateMany({
        where: { type: { in: ['CITY', 'SPORTS'] }, isActive: true, expiresAt: { lte: now } },
        data: { isActive: false },
      })
      return count
    },
    async listRecent(types, since) {
      return (await news.findMany({
        where: {
          type: { in: types },
          isActive: true,
          OR: [{ publishedAt: { gte: since } }, { publishedAt: null, discoveredAt: { gte: since } }],
        },
        orderBy: [{ discoveredAt: 'desc' }],
        take: 200,
      })) as NewsRecord[]
    },
    async latestOfType(type, { activeOnly = false } = {}) {
      return (await news.findFirst({
        where: { type, ...(activeOnly ? { isActive: true } : {}) },
        orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
      })) as NewsRecord | null
    },
    async lastIngestedAt() {
      const row = await news.findFirst({
        where: { lastSeenAt: { not: null } },
        orderBy: { lastSeenAt: 'desc' },
        select: { lastSeenAt: true },
      })
      return row?.lastSeenAt ?? null
    },
  }
}
