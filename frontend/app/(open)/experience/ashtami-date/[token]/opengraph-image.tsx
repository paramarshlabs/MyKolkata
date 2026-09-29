import { matchImage, OG_SIZE } from '@/lib/ashtami-date/og'
import { decodeMatchCard } from '@/lib/ashtami-date/token'

export const alt = 'It’s a match: an Ashtami date found on My Kolkata. Now pick a pandal.'
export const size = OG_SIZE
export const contentType = 'image/png'

/* the night, the area and two vibes from the link; never a name or a face */
export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return matchImage(decodeMatchCard(token))
}
