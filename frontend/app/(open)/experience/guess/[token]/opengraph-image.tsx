import { guessImage, OG_SIZE } from '@/lib/pujo-personality/og'

export const alt = 'Guess my Pujo: nine ways to do Pujo, from My Kolkata.'
export const size = OG_SIZE
export const contentType = 'image/png'

/* never reads the card: the preview must not give the answer away */
export default function Image() {
  return guessImage()
}
