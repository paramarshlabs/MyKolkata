import { currentUserId } from '@/lib/auth'
import { ashtamiDate } from '@/lib/ashtami-date/server'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

/* one extra day for a match nobody has written in yet, once */
export async function POST(_request: Request, context: Context) {
  const { id } = await context.params
  return ashtamiDate.extend(await currentUserId(), id)
}
