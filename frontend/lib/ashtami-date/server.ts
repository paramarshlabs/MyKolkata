import 'server-only'
import { after } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createAshtamiDateHandlers } from './handlers'
import { supabasePhotoStore } from './photos'
import { prismaRepository } from './repository'
import { seasonOver } from './rules'

/* Find your Ashtami date, wired to Prisma and the private photo bucket. The
   route files under app/api/ashtami-date/ hand these the signed-in user. */
export const ashtamiDate = createAshtamiDateHandlers({
  repo: prismaRepository,
  photos: supabasePhotoStore,
  defer: (task) => after(task),
})

const REPORT_KEEP_DAYS = 180
const DAY_MS = 24 * 60 * 60 * 1000

/*
 * The daily sweep (app/api/cron/ashtami-date): chats past their 24 hours,
 * matches nobody wrote in, reports past review, and, a week after Dashami,
 * the whole season: every profile, photo, swipe, match and message. Blocks
 * stay, so a blocked person can't find anyone again next year.
 */
export async function sweep(now = new Date()) {
  const expired = await prismaRepository.purgeExpired(now)
  const reports = await prisma.dateReport.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - REPORT_KEEP_DAYS * DAY_MS) } } })

  let season = { photos: 0, profiles: 0, skipped: false }
  if (seasonOver(now)) {
    if (!supabasePhotoStore.ready) {
      /* without the key the photos can't be reached, so nothing is deleted half-way */
      season.skipped = true
    } else {
      for (;;) {
        const batch = await prisma.datePhoto.findMany({ take: 500, select: { id: true, storageKey: true } })
        if (!batch.length) break
        await supabasePhotoStore.remove(batch.map((p) => p.storageKey))
        await prisma.datePhoto.deleteMany({ where: { id: { in: batch.map((p) => p.id) } } })
        season.photos += batch.length
      }
      season = { ...season, profiles: (await prisma.dateProfile.deleteMany({})).count }
    }
  }
  return { ...expired, reports: reports.count, season }
}
