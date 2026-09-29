import { currentUserId } from '@/lib/auth'
import { ashtamiDate } from '@/lib/ashtami-date/server'

export const dynamic = 'force-dynamic'

/* your matches, and nobody else's */
export async function GET() {
  return ashtamiDate.matches(await currentUserId())
}
