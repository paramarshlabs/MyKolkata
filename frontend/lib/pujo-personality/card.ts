import { getDimension } from './config'
import { CONTENT, HEX, PALETTES, STATUS_LABELS, TAGLINE_LINES, streakLine, type Palette } from './content'
import { PATHS as BENGALI_PATHS, UNITS_PER_EM } from './bengali-paths'
import { SIGILS, type SigilColours } from './sigils'
import type { ShareCard } from './token'
import type { ArchetypeId, DimensionId } from './types'

/*
 * The share cards, drawn on the phone (08-visual-bible.md §6). A canvas shapes
 * a typed first name in any script, works with no signal, and never sends the
 * card anywhere. The archetype names use the same pre-shaped Bengali paths as
 * the server's link previews, so a card and its preview always match.
 *
 * Browser only: call loadCardFonts() first, then drawCard().
 */

export type CardFormat = 'story' | 'feed'

export const CARD_SIZE: Record<CardFormat, [number, number]> = {
  story: [1080, 1920],
  feed: [1080, 1350],
}

export type CardInput = {
  card: ShareCard
  because: DimensionId[]
  name?: string | null
  host: string
}

const DISPLAY = '"Clear Sans Display", "Noto Sans Bengali", sans-serif'
const TEXT = '"Clear Sans Text", "Noto Sans Bengali", sans-serif'

export async function loadCardFonts(name?: string | null) {
  if (typeof document === 'undefined' || !document.fonts) return
  const loads = [
    document.fonts.load('400 64px "Clear Sans Display"'),
    document.fonts.load('400 32px "Clear Sans Text"'),
  ]
  if (name) loads.push(document.fonts.load('400 40px "Noto Sans Bengali"', name))
  await Promise.allSettled(loads)
}

/* ------------------------------------------------------------ drawing -- */

type Ctx = CanvasRenderingContext2D

function setFont(ctx: Ctx, family: string, size: number, tracking = 0) {
  ctx.font = `400 ${size}px ${family}`
  const styled = ctx as Ctx & { letterSpacing?: string }
  if ('letterSpacing' in ctx) styled.letterSpacing = `${Math.round(tracking * size * 10) / 10}px`
}

/* the largest size up to `size` at which the text fits `width` */
function fitFont(ctx: Ctx, text: string, family: string, size: number, width: number, tracking = 0): number {
  let s = size
  setFont(ctx, family, s, tracking)
  while (s > 14 && ctx.measureText(text).width > width) {
    s -= 2
    setFont(ctx, family, s, tracking)
  }
  return s
}

function text(ctx: Ctx, value: string, x: number, y: number, colour: string) {
  ctx.fillStyle = colour
  ctx.fillText(value, x, y)
  return ctx.measureText(value).width
}

/* SVG transform lists as the sigils write them: translate() and rotate() */
function applyTransform(ctx: Ctx, transform?: string) {
  if (!transform) return
  for (const [, op, args] of transform.matchAll(/(translate|rotate)\(([^)]*)\)/g)) {
    const n = args.trim().split(/[\s,]+/).map(Number)
    if (op === 'translate') {
      ctx.translate(n[0], n[1] ?? 0)
    } else {
      const [angle, cx = 0, cy = 0] = n
      ctx.translate(cx, cy)
      ctx.rotate((angle * Math.PI) / 180)
      ctx.translate(-cx, -cy)
    }
  }
}

export function drawSigil(ctx: Ctx, id: ArchetypeId, colours: SigilColours, x: number, y: number, size: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size / 64, size / 64)
  for (const shape of SIGILS[id]) {
    ctx.save()
    applyTransform(ctx, shape.transform)
    switch (shape.t) {
      case 'path':
        ctx.fillStyle = colours[shape.fill]
        ctx.fill(new Path2D(shape.d), shape.rule === 'evenodd' ? 'evenodd' : 'nonzero')
        break
      case 'circle':
        ctx.fillStyle = colours[shape.fill]
        ctx.beginPath()
        ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'ellipse':
        ctx.fillStyle = colours[shape.fill]
        ctx.beginPath()
        ctx.ellipse(shape.cx, shape.cy, shape.rx, shape.ry, 0, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'line':
        ctx.strokeStyle = colours[shape.stroke]
        ctx.lineWidth = shape.width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke(new Path2D(shape.d))
        break
    }
    ctx.restore()
  }
  ctx.restore()
}

export function bengaliWidth(line: string, size: number): number {
  const p = BENGALI_PATHS[line]
  return p ? ((p.box[2] - p.box[0]) * size) / UNITS_PER_EM : 0
}

/* Draws a pre-shaped line with its ink starting at x. */
export function drawBengali(ctx: Ctx, line: string, x: number, baseline: number, size: number, colour: string) {
  const p = BENGALI_PATHS[line]
  if (!p) return
  const s = size / UNITS_PER_EM
  ctx.save()
  ctx.translate(x - p.box[0] * s, baseline)
  ctx.scale(s, s)
  ctx.fillStyle = colour
  ctx.fill(new Path2D(p.d))
  ctx.restore()
}

function paintGround(ctx: Ctx, palette: Palette, w: number, h: number) {
  ctx.fillStyle = palette.ground
  ctx.fillRect(0, 0, w, h)
  if (palette.tone !== 'dark') return
  /* the house ground: a ruby wash high on the right, the monsoon grade low on the left */
  const wash = ctx.createRadialGradient(w * 0.84, h * 0.04, 0, w * 0.84, h * 0.04, w)
  wash.addColorStop(0, 'rgba(152, 17, 30, 0.18)')
  wash.addColorStop(1, 'rgba(152, 17, 30, 0)')
  ctx.fillStyle = wash
  ctx.fillRect(0, 0, w, h)
  const grade = ctx.createRadialGradient(w * 0.04, h * 0.96, 0, w * 0.04, h * 0.96, w * 0.95)
  grade.addColorStop(0, 'rgba(19, 42, 46, 0.55)')
  grade.addColorStop(1, 'rgba(19, 42, 46, 0)')
  ctx.fillStyle = grade
  ctx.fillRect(0, 0, w, h)
}

/* the red border of a white saree, as a bottom edge: Para Kid and Pujo Romantic only */
function laalPaar(ctx: Ctx, w: number, y: number, h: number) {
  ctx.fillStyle = HEX.pearl
  ctx.fillRect(0, y, w, h)
  ctx.fillStyle = HEX.ruby
  const rule = Math.max(2, h * 0.08)
  ctx.fillRect(0, y + h * 0.16, w, rule)
  ctx.fillRect(0, y + h - h * 0.16 - rule, w, rule)
  ctx.strokeStyle = HEX.ruby
  ctx.lineWidth = Math.max(1.5, h * 0.055)
  const step = h * 0.82
  const mid = y + h / 2
  for (let x = step * 0.2; x < w; x += step) {
    ctx.beginPath()
    ctx.moveTo(x, mid + h * 0.18)
    ctx.quadraticCurveTo(x, mid - h * 0.16, x + step * 0.27, mid - h * 0.16)
    ctx.quadraticCurveTo(x + step * 0.54, mid - h * 0.16, x + step * 0.54, mid + h * 0.18)
    ctx.stroke()
  }
}

function pill(ctx: Ctx, label: string, x: number, y: number, size: number, palette: Palette): number {
  setFont(ctx, TEXT, size, 0.01)
  const padX = size * 0.75
  const height = size * 2
  const width = ctx.measureText(label).width + padX * 2
  ctx.strokeStyle = palette.tone === 'dark' ? 'rgba(242, 241, 237, 0.3)' : 'rgba(13, 16, 18, 0.3)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(x + 1, y + 1, width - 2, height - 2, 12)
  ctx.stroke()
  text(ctx, label, x + padX, y + height / 2 + size * 0.36, palette.body)
  return width
}

/* ------------------------------------------------------- the card -- */

type Layout = {
  margin: number; lockupY: number; sigilY: number; sigil: number; namesY: number
  bn: number; latin: number; cap1: number; cap2: number; meta: number; pill: number
  footerY: number; footer: number; gap: number
}

const LAYOUT: Record<CardFormat, Layout> = {
  /* Story: the top 220px and bottom 380px stay clear of anything that must be read */
  story: {
    margin: 104, lockupY: 176, sigilY: 284, sigil: 264, namesY: 628, bn: 160, latin: 110,
    cap1: 42, cap2: 60, meta: 37, pill: 30, footerY: 1480, footer: 56, gap: 1,
  },
  feed: {
    margin: 88, lockupY: 112, sigilY: 168, sigil: 180, namesY: 410, bn: 118, latin: 84,
    cap1: 34, cap2: 48, meta: 31, pill: 26, footerY: 1250, footer: 42, gap: 0.8,
  },
}

export function drawCard(canvas: HTMLCanvasElement, format: CardFormat, input: CardInput) {
  const [w, h] = CARD_SIZE[format]
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { card, because, name, host } = input
  const id = card.primary
  const content = CONTENT[id]
  const palette = PALETTES[id]
  const L = LAYOUT[format]
  const width = w - L.margin * 2
  const x = L.margin
  ctx.textBaseline = 'alphabetic'

  paintGround(ctx, palette, w, h)
  const edge = id === 'para_kid' || id === 'pujo_romantic'
  if (edge) laalPaar(ctx, w, h - 26 * L.gap, 26 * L.gap)

  /* the lockup: MY KOLKATA over আমার কলকাতা */
  setFont(ctx, DISPLAY, 28 * L.gap + 2, 0.18)
  text(ctx, 'MY KOLKATA', x, L.lockupY, palette.body)
  drawBengali(ctx, 'আমার কলকাতা', x, L.lockupY + 40 * L.gap, 22 * L.gap + 2, palette.muted)

  drawSigil(ctx, id, palette.sigil, x - L.sigil * 0.04, L.sigilY, L.sigil)

  let y = L.namesY
  if (name) {
    setFont(ctx, TEXT, L.meta, 0.01)
    text(ctx, `${name}’s Pujo`, x, y, palette.muted)
    y += L.meta * 0.6
  }

  /* the Bengali name leads; the Latin name follows (DESIGN.md §4.3) */
  const bnSize = Math.min(L.bn, width / Math.max(1, bengaliWidth(content.bn, 1)))
  y += bnSize * 0.95
  drawBengali(ctx, content.bn, x, y, bnSize, palette.text)
  y += L.latin * 1.12
  fitFont(ctx, content.name, DISPLAY, L.latin, width, -0.035)
  text(ctx, content.name, x, y, palette.text)
  y += L.cap1 * 1.9

  /* the caption device: a tick, a quiet first line, an indented display line */
  const [line1, line2] = TAGLINE_LINES[id]
  const tickW = 6 * L.gap + 1
  const textX = x + tickW + 26 * L.gap
  const top = y
  setFont(ctx, TEXT, L.cap1, 0.01)
  y += L.cap1
  text(ctx, line1, textX, y, palette.body)
  const indent = 60 * L.gap
  fitFont(ctx, line2, DISPLAY, L.cap2, w - L.margin - textX - indent, -0.015)
  y += L.cap2 * 1.28
  text(ctx, line2, textX + indent, y, palette.second)
  ctx.fillStyle = palette.tick
  ctx.fillRect(x, top + L.cap1 * 0.12, tickW, y - top + L.cap2 * 0.12)
  y += L.meta * 2.3

  /* the streak, the hour, the status */
  setFont(ctx, TEXT, L.meta, 0.01)
  if (card.secondary) {
    text(ctx, streakLine(card.secondary), x, y, palette.muted)
    y += L.meta * 1.5
  }
  const hourW = text(ctx, content.hour, x, y, palette.accent)
  text(ctx, ' is my hour', x + hourW, y, palette.body)
  y += L.meta * 1.5
  if (card.status) {
    text(ctx, STATUS_LABELS[card.status], x, y, palette.muted)
    y += L.meta * 1.5
  }

  /* three traits, as words, a line below the last one */
  const pillTop = y - L.meta * 0.7
  let px = x
  for (const dim of because.slice(0, 3)) {
    const label = getDimension(dim).name
    setFont(ctx, TEXT, L.pill, 0.01)
    const pw = ctx.measureText(label).width + L.pill * 1.5
    if (px + pw > w - L.margin) break
    px += pill(ctx, label, px, pillTop, L.pill, palette) + 14 * L.gap
  }

  /* the question back, and where to answer it: never closer than a line to the traits */
  const footerY = Math.max(L.footerY, pillTop + L.pill * 2 + L.footer * 1.7)
  setFont(ctx, DISPLAY, L.footer, -0.02)
  text(ctx, 'Which Pujo are you?', x, footerY, palette.text)
  setFont(ctx, TEXT, L.meta, 0.02)
  text(ctx, `${host}/pujo`, x, footerY + L.meta * 1.6, palette.muted)
}

export function cardFileName(card: ShareCard, format: CardFormat) {
  return `my-pujo-${card.primary.replace(/_/g, '-')}-${format}.png`
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}
