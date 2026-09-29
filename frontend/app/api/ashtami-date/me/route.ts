import { currentUserId } from '@/lib/auth'
import { ashtamiDate } from '@/lib/ashtami-date/server'

export const dynamic = 'force-dynamic'

/* your own dating profile, and only yours */
export async function GET() {
  return ashtamiDate.getMe(await currentUserId())
}

/* one onboarding step at a time; step 1 is the 18+ gate */
export async function PUT(request: Request) {
  return ashtamiDate.putMe(request, await currentUserId())
}

/* delete the dating profile and everything that hangs off it */
export async function DELETE() {
  return ashtamiDate.deleteMe(await currentUserId())
}
