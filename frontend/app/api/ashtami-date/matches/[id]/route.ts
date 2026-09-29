import { currentUserId } from '@/lib/auth'
import { ashtamiDate } from '@/lib/ashtami-date/server'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

/* unmatch: only a match you are in */
export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params
  return ashtamiDate.unmatch(await currentUserId(), id)
}
