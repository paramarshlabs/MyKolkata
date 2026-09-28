import 'server-only'
import { prisma } from '@/lib/db/prisma'
import { createStoryHandlers, type StoryRepository } from './stories'

/* The Prisma side of the story wall, shared by /api/stories and /api/stories/[id]. */
const repository: StoryRepository = {
  listActive: (now, take) => prisma.story.findMany({
    where: { expiresAt: { gt: now } },
    orderBy: { createdAt: 'desc' },
    take,
  }),
  create: (data) => prisma.story.create({ data }),
  /* the owner and expiry checks sit in the same statement as the write, so there is no race */
  async updateOwn(id, authorId, now, data) {
    const { count } = await prisma.story.updateMany({ where: { id, authorId, expiresAt: { gt: now } }, data })
    return count ? prisma.story.findUnique({ where: { id } }) : null
  },
  async deleteOwn(id, authorId) {
    const { count } = await prisma.story.deleteMany({ where: { id, authorId } })
    return count > 0
  },
}

export const storyHandlers = createStoryHandlers(repository)
