import { currentUserId } from '@/lib/auth'
import { ashtamiDate } from '@/lib/ashtami-date/server'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

/* the chat, only for the two people in the match; messages go after 24 hours */
export async function GET(_request: Request, context: Context) {
  const { id } = await context.params
  return ashtamiDate.messages(await currentUserId(), id)
}

/* text only, no links; the first-move rule is checked on the server */
export async function POST(request: Request, context: Context) {
  const { id } = await context.params
  return ashtamiDate.send(request, await currentUserId(), id)
}
