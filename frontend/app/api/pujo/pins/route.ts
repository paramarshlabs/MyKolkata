import { currentUserId } from '@/lib/auth'
import { pinReports } from '@/lib/pujo/server'

export const dynamic = 'force-dynamic'

/* "Pin in the wrong place?": one line about where a pujo really is */
export async function POST(request: Request) {
  return pinReports.post(request, await currentUserId())
}
