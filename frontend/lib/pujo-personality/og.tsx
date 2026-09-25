import { ImageResponse } from 'next/og'
import { ARCHETYPE_IDS } from './config'
import { PATHS as BENGALI, UNITS_PER_EM } from './bengali-paths'
import { CONTENT, HEX, PALETTES, STATUS_LABELS, TAGLINE_LINES, streakLine, type Palette } from './content'
import { OG_TEXT, type Face } from './og-lines'
import { PATHS as LATIN } from './og-latin-paths'
import { sigilBody, type SigilColours } from './sigils'
import type { ShareCard } from './token'
import type { ArchetypeId } from './types'

/*
 * Link previews, 1200 × 630 (08-visual-bible.md §6.1). Each is one SVG built
 * from the same parts as the share cards: the palette's ground, the sigil and
 * type as pre-shaped outlines (see og-lines.ts for why), then rasterised by
 * next/og. No personal data: a preview shows an archetype, never a person.
 */

export const OG_SIZE = { width: 1200, height: 630 }
const W = OG_SIZE.width
const H = OG_SIZE.height
const M = 72

function outline(face: Face, text: string) {
  const line = face === 'bengali' ? BENGALI[text] : LATIN[`${face}:${text}`]
  if (!line) throw new Error(`No outline for ${face} "${text}": run scripts/pujo/generate-paths.py`)
  return line
}

/* the largest size up to `size` at which the line fits `width` */
function fit(face: Face, text: string, size: number, width: number) {
  return Math.min(size, (width * UNITS_PER_EM) / outline(face, text).advance)
}

/* a line of type with its origin at (x, baseline); returns the markup and the width it takes */
function type(face: Face, text: string, x: number, baseline: number, size: number, colour: string) {
  const line = outline(face, text)
  const s = size / UNITS_PER_EM
  return {
    svg: `<path transform="translate(${x} ${baseline}) scale(${s})" d="${line.d}" fill="${colour}"/>`,
    width: line.advance * s,
  }
}

function sigil(id: ArchetypeId, colours: SigilColours, x: number, y: number, size: number) {
  return `<g transform="translate(${x} ${y}) scale(${size / 64})">${sigilBody(id, colours)}</g>`
}

function ground(palette: Palette) {
  if (palette.tone !== 'dark') return `<rect width="${W}" height="${H}" fill="${palette.ground}"/>`
  return `<defs>
    <radialGradient id="wash" cx="0.84" cy="0.02" r="0.9"><stop offset="0" stop-color="${HEX.ruby}" stop-opacity="0.2"/><stop offset="1" stop-color="${HEX.ruby}" stop-opacity="0"/></radialGradient>
    <radialGradient id="grade" cx="0.04" cy="0.98" r="0.8"><stop offset="0" stop-color="${HEX.monsoon}" stop-opacity="0.6"/><stop offset="1" stop-color="${HEX.monsoon}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${palette.ground}"/>
  <rect width="${W}" height="${H}" fill="url(#wash)"/>
  <rect width="${W}" height="${H}" fill="url(#grade)"/>`
}

function lockup(palette: Palette) {
  return type('display', OG_TEXT.lockup, M, 88, 19, palette.body).svg
    + type('bengali', OG_TEXT.lockupBn, M, 116, 16, palette.muted).svg
}

function render(svg: string) {
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${svg}</svg>`
  const src = `data:image/svg+xml;base64,${Buffer.from(doc).toString('base64')}`
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img src={src} width={W} height={H} />,
    { ...OG_SIZE, headers: { 'Cache-Control': 'public, max-age=86400, immutable' } },
  )
}

/* the nine sigils in a row, on a dark ground */
function nine(y: number, size: number) {
  const colours = { body: HEX.pearl, accent: HEX.crimson, yellow: HEX.taxi, ground: HEX.obsidian }
  const gap = (W - M * 2 - size * 9) / 8
  return ARCHETYPE_IDS.map((id, i) => sigil(id, colours, M + i * (size + gap), y, size)).join('')
}

/* An archetype, and optionally the streak, hour and status from a shared card. */
export function archetypeImage(id: ArchetypeId, card?: ShareCard | null) {
  const palette = PALETTES[id]
  const content = CONTENT[id]
  const [line1, line2] = TAGLINE_LINES[id]
  const textWidth = 700
  let svg = ground(palette) + lockup(palette)

  svg += sigil(id, palette.sigil, W - M - 300, 150, 300)

  const bnSize = fit('bengali', content.bn, 92, textWidth)
  svg += type('bengali', content.bn, M, 300, bnSize, palette.text).svg
  svg += type('display', content.name, M, 384, fit('display', content.name, 72, textWidth), palette.text).svg

  /* the caption device */
  svg += `<rect x="${M}" y="424" width="4" height="96" fill="${palette.tick}"/>`
  svg += type('text', line1, M + 28, 458, 27, palette.body).svg
  svg += type('display', line2, M + 64, 506, fit('display', line2, 38, textWidth - 64), palette.second).svg

  if (card) {
    let x = M
    if (card.secondary) {
      const streak = type('text', streakLine(card.secondary), x, 572, 23, palette.muted)
      svg += streak.svg
      x += streak.width + 36
    }
    const hour = type('text', content.hour, x, 572, 23, palette.accent)
    svg += hour.svg + type('text', OG_TEXT.hourTail, x + hour.width + 7, 572, 23, palette.body).svg
    if (card.status) svg += type('text', STATUS_LABELS[card.status], W - M - 300, 572, 23, palette.muted).svg
  } else {
    svg += type('display', OG_TEXT.question, M, 574, 26, palette.muted).svg
  }
  return render(svg)
}

/* /pujo/personality: the question, and the nine answers */
export function landingImage() {
  const palette = PALETTES.night_owl
  let svg = ground(palette) + lockup(palette)
  svg += type('bengali', OG_TEXT.questionBn, M, 262, 76, HEX.blush).svg
  svg += type('display', OG_TEXT.landing, M, 350, 64, HEX.white).svg
  svg += type('text', OG_TEXT.landingSub, M, 404, 26, HEX.ash).svg
  svg += nine(466, 88)
  return render(svg)
}

/* a Guess my Pujo link: the challenge, and never the answer */
export function guessImage() {
  const palette = PALETTES.night_owl
  let svg = ground(palette) + lockup(palette)
  svg += type('display', OG_TEXT.guess, M, 300, 88, HEX.white).svg
  svg += type('text', OG_TEXT.guessSub, M, 364, 28, HEX.ash).svg
  svg += nine(452, 88)
  return render(svg)
}
