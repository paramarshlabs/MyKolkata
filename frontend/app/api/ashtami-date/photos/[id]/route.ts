import { currentUserId } from '@/lib/auth'
import { ashtamiDate } from '@/lib/ashtami-date/server'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

/* only your own photo */
export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params
  return ashtamiDate.removePhoto(await currentUserId(), id)
}
