import { currentUserId } from '@/lib/auth'
import { ashtamiDate } from '@/lib/ashtami-date/server'

export const dynamic = 'force-dynamic'

/* hides both people from each other everywhere, and ends any match between them */
export async function POST(request: Request) {
  return ashtamiDate.block(request, await currentUserId())
}
