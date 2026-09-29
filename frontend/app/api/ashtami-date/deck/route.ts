import { currentUserId } from '@/lib/auth'
import { ashtamiDate } from '@/lib/ashtami-date/server'

export const dynamic = 'force-dynamic'

/* the next cards: only people the deck's rules let this user see */
export async function GET() {
  return ashtamiDate.deck(await currentUserId())
}
