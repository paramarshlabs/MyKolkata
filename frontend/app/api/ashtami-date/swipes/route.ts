import { currentUserId } from '@/lib/auth'
import { ashtamiDate } from '@/lib/ashtami-date/server'

export const dynamic = 'force-dynamic'

/* for me, not for me, or a shiuli; answers with the match when one is made */
export async function POST(request: Request) {
  return ashtamiDate.swipe(request, await currentUserId())
}
