import { currentUserId } from '@/lib/auth'
import { ashtamiDate } from '@/lib/ashtami-date/server'

export const dynamic = 'force-dynamic'

/* one photo, as multipart form data; metadata is stripped before it is stored */
export async function POST(request: Request) {
  return ashtamiDate.addPhoto(request, await currentUserId())
}
