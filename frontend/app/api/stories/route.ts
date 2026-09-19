import { currentUserId } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { createStoryHandlers, type StoryRepository } from '@/lib/stories/stories'

export const dynamic = 'force-dynamic'

const repository: StoryRepository = {
  listActive: (now, take) => prisma.story.findMany({
    where: { expiresAt: { gt: now } },
    orderBy: { createdAt: 'desc' },
    take,
  }),
  create: (data) => prisma.story.create({ data }),
}

const handlers = createStoryHandlers(repository)

/* anyone can read the active stories */
export async function GET() {
  return handlers.GET()
}

/* only a signed-in user can post one */
export async function POST(request: Request) {
  return handlers.POST(request, await currentUserId())
}
