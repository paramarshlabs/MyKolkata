import { ImageResponse } from 'next/og'
import { petalPath } from '@/components/brand/kolka'
import { HEX } from '@/lib/pujo-personality/content'
import { NIGHT_DAYS, vibeLabel, zoneLabel } from './config'
import { OG_TEXT, nightLine, type Face } from './og-lines'
import { PATHS, UNITS_PER_EM } from './og-paths'
import type { MatchCard } from './token'

/*
 * The match card's link preview, 1200 × 630: the moment, and nobody in it.
 * The night, the area the plan meets in, and up to two shared vibes, drawn as
 * pre-shaped outlines (see og-lines.ts) with alpona pieces thrown round them.
 */

export const OG_SIZE = { width: 1200, height: 630 }
const W = OG_SIZE.width
const H = OG_SIZE.height
const M = 72

function outline(face: Face, text: string) {
  const line = PATHS[`${face}:${text}`]
  if (!line) throw new Error(`No outline for ${face} "${text}": run python3 scripts/pujo/generate-paths.py ashtami`)
  return line
}

/* the largest size up to `size` at which the line fits `width` */
const fit = (face: Face, text: string, size: number, width: number) =>
  Math.min(size, (width * UNITS_PER_EM) / outline(face, text).advance)

function type(face: Face, text: string, x: number, baseline: number, size: number, colour: string) {
  const line = outline(face, text)
  const s = size / UNITS_PER_EM
  return { svg: `<path transform="translate(${x} ${baseline}) scale(${s})" d="${line.d}" fill="${colour}"/>`, width: line.advance * s }
}

/* a chip: the vibe, in an outlined pill */
function chip(text: string, x: number, baseline: number) {
  const label = type('text', text, x + 22, baseline, 26, HEX.pearl)
  const w = label.width + 44
  return {
    svg: `<rect x="${x}" y="${baseline - 34}" width="${Math.round(w)}" height="48" rx="24" fill="none" stroke="${HEX.pearl}" stroke-opacity="0.45" stroke-width="2"/>${label.svg}`,
    width: w,
  }
}

/* alpona pieces round the right-hand side, fixed, so every card is the same picture */
const PIECES: [kind: 'petal' | 'dot', x: number, y: number, rot: number, scale: number, colour: keyof typeof HEX][] = [
  ['petal', 1146, 92, 30, 1.8, 'pearl'], ['dot', 1128, 196, 0, 1.4, 'taxi'], ['petal', 1044, 300, -40, 1.5, 'blush'],
  ['petal', 1128, 330, 110, 1.8, 'crimson'], ['dot', 1010, 392, 0, 1, 'pearl'], ['petal', 1086, 470, 200, 2.2, 'pearl'],
  ['dot', 948, 520, 0, 1.6, 'blush'], ['petal', 640, 96, -12, 1.2, 'taxi'], ['dot', 1150, 560, 0, 1.2, 'pearl'],
  ['petal', 840, 560, 150, 1.4, 'pearl'],
]

function pieces() {
  return PIECES.map(([kind, x, y, rot, scale, colour]) => kind === 'dot'
    ? `<circle cx="${x}" cy="${y}" r="${Math.round(9 * scale)}" fill="${HEX[colour]}" opacity="0.9"/>`
    : `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${scale})"><path transform="translate(0 16)" d="${petalPath(24, 8)}" fill="${HEX[colour]}" opacity="0.9"/></g>`).join('')
}

function ground() {
  return `<defs>
    <radialGradient id="warm" cx="0.8" cy="0" r="0.95"><stop offset="0" stop-color="${HEX.crimsonDepth}" stop-opacity="0.3"/><stop offset="1" stop-color="${HEX.crimsonDepth}" stop-opacity="0"/></radialGradient>
    <radialGradient id="grade" cx="0.05" cy="1" r="0.8"><stop offset="0" stop-color="${HEX.monsoon}" stop-opacity="0.7"/><stop offset="1" stop-color="${HEX.monsoon}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${HEX.bordeauxDeep}"/>
  <rect width="${W}" height="${H}" fill="url(#warm)"/>
  <rect width="${W}" height="${H}" fill="url(#grade)"/>`
}

const lockup = () =>
  type('display', OG_TEXT.lockup, M, 84, 19, HEX.pearl).svg + type('bengali', OG_TEXT.lockupBn, M, 112, 16, HEX.ash).svg

function render(svg: string) {
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${svg}</svg>`
  const src = `data:image/svg+xml;base64,${Buffer.from(doc).toString('base64')}`
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img src={src} width={W} height={H} />,
    { ...OG_SIZE, headers: { 'Cache-Control': 'public, max-age=86400, immutable' } },
  )
}

export function matchImage(card: MatchCard | null) {
  let svg = ground() + pieces() + lockup()
  const textWidth = 760

  if (!card) {
    svg += `<g transform="rotate(-2 ${M} 300)">${type('display', OG_TEXT.coming, M, 300, fit('display', OG_TEXT.coming, 104, textWidth), HEX.white).svg}</g>`
    svg += type('display', OG_TEXT.queue, M, 392, fit('display', OG_TEXT.queue, 52, textWidth), HEX.blush).svg
    svg += type('text', OG_TEXT.cta, M, 560, 26, HEX.ash).svg
    return render(svg)
  }

  const day = NIGHT_DAYS[card.night]
  svg += type('bengali', day.bn, 700, 250, fit('bengali', day.bn, 150, 420), HEX.blush).svg
  svg += `<g transform="rotate(-3 ${M} 290)">${type('display', OG_TEXT.title, M, 290, fit('display', OG_TEXT.title, 128, textWidth - 120), HEX.white).svg}</g>`
  svg += type('display', OG_TEXT.sub, M, 368, 50, HEX.blush).svg

  const night = type('text', nightLine(card.night), M, 440, 30, HEX.taxi)
  svg += night.svg + type('text', zoneLabel(card.zone), M + night.width + 28, 440, 30, HEX.pearl).svg

  let x = M
  for (const vibe of card.vibes) {
    const c = chip(vibeLabel(vibe), x, 510)
    svg += c.svg
    x += c.width + 14
  }
  svg += type('text', OG_TEXT.cta, M, 580, 24, HEX.ash).svg
  return render(svg)
}
