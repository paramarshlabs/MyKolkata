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
  /* the person's photo, already loaded; drawn round, beside the sigil */
  photo?: ImageBitmap | null
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

/* a photo cut to a circle (cover-cropped), in a ring of the palette's tick colour */
function portrait(ctx: Ctx, photo: ImageBitmap, x: number, y: number, size: number, palette: Palette) {
  const r = size / 2
  const side = Math.min(photo.width, photo.height)
  ctx.save()
  ctx.beginPath()
  ctx.arc(x + r, y + r, r, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(photo, (photo.width - side) / 2, (photo.height - side) / 2, side, side, x, y, size, size)
  ctx.restore()
  ctx.strokeStyle = palette.tick
  ctx.lineWidth = Math.max(4, size * 0.03)
  ctx.beginPath()
  ctx.arc(x + r, y + r, r - ctx.lineWidth / 2, 0, Math.PI * 2)
  ctx.stroke()
}

/* ------------------------------------------------------- the card -- */

type Layout = {
  margin: number; lockupY: number; bottom: number; sigil: number; photo: number; person: number
  bn: number; latin: number; cap1: number; cap2: number; meta: number; footer: number; gap: number
}

const LAYOUT: Record<CardFormat, Layout> = {
  /* Story: the top 220px and bottom ~240px stay clear of the app's own buttons */
  story: {
    margin: 104, lockupY: 176, bottom: 240, sigil: 300, photo: 420, person: 80,
    bn: 140, latin: 104, cap1: 42, cap2: 60, meta: 38, footer: 56, gap: 1,
  },
  feed: {
    margin: 88, lockupY: 112, bottom: 96, sigil: 200, photo: 290, person: 62,
    bn: 112, latin: 80, cap1: 34, cap2: 48, meta: 31, footer: 42, gap: 0.8,
  },
}

/* the sigil as a medallion on the photo's lower right, cut out of the ground */
function medallion(ctx: Ctx, id: ArchetypeId, palette: Palette, cx: number, cy: number, r: number) {
  ctx.fillStyle = palette.ground
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = palette.tick
  ctx.lineWidth = Math.max(3, r * 0.05)
  ctx.stroke()
  const size = r * 1.5
  drawSigil(ctx, id, palette.sigil, cx - size / 2, cy - size / 2, size)
}

/* One stretch of the card: how tall it is, and how to draw it from a top edge. */
type Block = { height: number; draw: (top: number) => void }

export function drawCard(canvas: HTMLCanvasElement, format: CardFormat, input: CardInput) {
  const [w, h] = CARD_SIZE[format]
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { card, name, photo, host } = input
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

  const blocks: Block[] = []

  /* the person: their photo with the sigil pinned to it (or the sigil alone), and their name under it */
  const hero = photo ? L.photo : L.sigil
  blocks.push({
    height: hero + (name ? L.person * 1.35 : 0),
    draw(top) {
      if (photo) {
        portrait(ctx, photo, x, top, hero, palette)
        medallion(ctx, id, palette, x + hero * 0.86, top + hero * 0.86, hero * 0.2)
      } else {
        drawSigil(ctx, id, palette.sigil, x - hero * 0.04, top, hero)
      }
      if (!name) return
      const baseline = top + hero + L.person * 1.2
      const size = fitFont(ctx, `${name}’s Pujo`, DISPLAY, L.person, width, -0.03)
      const nameW = text(ctx, `${name}’s`, x, baseline, palette.text)
      setFont(ctx, DISPLAY, size, -0.03)
      text(ctx, ' Pujo', x + nameW, baseline, palette.accent)
    },
  })

  /* the Bengali name leads; the Latin name follows (DESIGN.md §4.3) */
  const bnSize = Math.min(L.bn, width / Math.max(1, bengaliWidth(content.bn, 1)))
  blocks.push({
    height: bnSize * 0.95 + L.latin * 1.2 + L.latin * 0.2,
    draw(top) {
      const bnBase = top + bnSize * 0.95
      drawBengali(ctx, content.bn, x, bnBase, bnSize, palette.text)
      fitFont(ctx, content.name, DISPLAY, L.latin, width, -0.035)
      text(ctx, content.name, x, bnBase + L.latin * 1.2, palette.text)
    },
  })

  /* the caption device: a tick, a quiet first line, an indented display line */
  const [line1, line2] = TAGLINE_LINES[id]
  blocks.push({
    height: L.cap1 + L.cap2 * 1.28 + L.cap2 * 0.25,
    draw(top) {
      const tickW = 6 * L.gap + 1
      const textX = x + tickW + 26 * L.gap
      const indent = 60 * L.gap
      setFont(ctx, TEXT, L.cap1, 0.01)
      text(ctx, line1, textX, top + L.cap1, palette.body)
      fitFont(ctx, line2, DISPLAY, L.cap2, w - L.margin - textX - indent, -0.015)
      const last = top + L.cap1 + L.cap2 * 1.28
      text(ctx, line2, textX + indent, last, palette.second)
      ctx.fillStyle = palette.tick
      ctx.fillRect(x, top + L.cap1 * 0.12, tickW, last - top + L.cap2 * 0.12)
    },
  })

  /* the hour, then the streak and the status, quieter */
  const lines = 1 + (card.secondary ? 1 : 0) + (card.status ? 1 : 0)
  blocks.push({
    height: L.meta + (lines - 1) * L.meta * 1.5 + L.meta * 0.25,
    draw(top) {
      let y = top + L.meta
      setFont(ctx, TEXT, L.meta, 0.01)
      const hourW = text(ctx, content.hour, x, y, palette.accent)
      text(ctx, ' is my hour', x + hourW, y, palette.body)
      if (card.secondary) {
        y += L.meta * 1.5
        text(ctx, streakLine(card.secondary), x, y, palette.muted)
      }
      if (card.status) {
        y += L.meta * 1.5
        text(ctx, STATUS_LABELS[card.status], x, y, palette.muted)
      }
    },
  })

  /* the question back, and where to answer it */
  blocks.push({
    height: L.footer + L.meta * 1.6 + L.meta * 0.25,
    draw(top) {
      setFont(ctx, DISPLAY, L.footer, -0.02)
      text(ctx, 'Which Pujo are you?', x, top + L.footer, palette.text)
      setFont(ctx, TEXT, L.meta, 0.02)
      text(ctx, `${host}/pujo`, x, top + L.footer + L.meta * 1.6, palette.muted)
    },
  })

  /* from under the lockup to the clear strip at the bottom, the space left over is shared evenly */
  const start = L.lockupY + 40 * L.gap
  const end = h - L.bottom
  const used = blocks.reduce((n, b) => n + b.height, 0)
  const space = Math.max(16, (end - start - used) / blocks.length)
  let top = start + space
  for (const block of blocks) {
    block.draw(top)
    top += block.height + space
  }
}

export function cardFileName(card: ShareCard, format: CardFormat) {
  return `my-pujo-${card.primary.replace(/_/g, '-')}-${format}.png`
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}
