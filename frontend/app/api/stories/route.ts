import { currentUserId } from '@/lib/auth'
import { storyHandlers } from '@/lib/stories/repository'

export const dynamic = 'force-dynamic'

/* anyone can read the active stories; a signed-in reader also learns which are theirs */
export async function GET() {
  return storyHandlers.GET(await currentUserId())
}

/* only a signed-in user can post one */
export async function POST(request: Request) {
  return storyHandlers.POST(request, await currentUserId())
}
