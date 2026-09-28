import { ARCHETYPE_IDS, isArchetypeId } from '@/lib/pujo-personality/config'
import { archetypeImage, landingImage, OG_SIZE } from '@/lib/pujo-personality/og'

export const alt = 'One of the nine Pujo personalities, from My Kolkata.'
export const size = OG_SIZE
export const contentType = 'image/png'

export function generateStaticParams() {
  return ARCHETYPE_IDS.map((id) => ({ id }))
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return isArchetypeId(id) ? archetypeImage(id) : landingImage()
}
