import { landingImage, OG_SIZE } from '@/lib/pujo-personality/og'

export const alt = 'What kind of Pujo are you? The nine Pujo personalities, from My Kolkata.'
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return landingImage()
}
