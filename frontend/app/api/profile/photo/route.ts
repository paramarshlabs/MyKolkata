import { currentUserId } from '@/lib/auth'
import { readPhoto, removePhoto, writePhoto } from '@/lib/profile/photoStore'

export const dynamic = 'force-dynamic'

/* your photo, for your own profile and share cards: yours if you put one up, else Google's */
export async function GET() {
  return readPhoto(await currentUserId())
}

/* a photo of your own, as multipart form data; metadata is stripped before it is stored */
export async function POST(request: Request) {
  return writePhoto(request, await currentUserId())
}

/* back to the Google photo */
export async function DELETE() {
  return removePhoto(await currentUserId())
}
