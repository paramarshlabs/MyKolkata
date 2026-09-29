import { currentUserId } from '@/lib/auth'
import { ashtamiDate } from '@/lib/ashtami-date/server'

export const dynamic = 'force-dynamic'

/* stored for a person to review; the reporter is blocked from the reported straight away */
export async function POST(request: Request) {
  return ashtamiDate.report(request, await currentUserId())
}
