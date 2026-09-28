import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { OG_SIZE, siteImage } from '@/lib/pujo-personality/og'

export const alt = 'My Kolkata: a yellow Ambassador taxi and a blue bus on a rain-wet street by the Hooghly at dusk, Howrah Bridge and the Victoria Memorial behind them.'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  const photo = await readFile(join(process.cwd(), 'lib/site/og-photo.jpg'), 'base64')
  return siteImage(`data:image/jpeg;base64,${photo}`)
}
