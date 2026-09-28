import { currentUserId } from '@/lib/auth'
import { storyHandlers } from '@/lib/stories/repository'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

/* only the author can edit their story, and only while it is live */
export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params
  return storyHandlers.PATCH(request, await currentUserId(), id)
}

/* only the author can delete their story */
export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params
  return storyHandlers.DELETE(await currentUserId(), id)
}
