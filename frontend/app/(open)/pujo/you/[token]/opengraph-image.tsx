import { archetypeImage, landingImage, OG_SIZE } from '@/lib/pujo-personality/og'
import { decodeCard } from '@/lib/pujo-personality/token'

export const alt = 'A Pujo Personality card from My Kolkata.'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const card = decodeCard(token)
  return card ? archetypeImage(card.primary, card) : landingImage()
}
