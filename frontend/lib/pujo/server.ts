import 'server-only'
import { prisma } from '@/lib/db/prisma'
import { findPujo } from './build'
import { loadPujoIndex } from './pandals'
import { createPinReports } from './pins'

/* The /pujo handlers, wired to Prisma. The route files under app/api/pujo/
   hand these the signed-in user. */

export const pinReports = createPinReports({
  repo: {
    add: async (report) => {
      await prisma.pujoPinReport.create({ data: report })
    },
    countSince: (userId, since) => prisma.pujoPinReport.count({ where: { userId, createdAt: { gte: since } } }),
  },
  pujoExists: async (slug) => Boolean(findPujo(await loadPujoIndex(), slug)),
})
