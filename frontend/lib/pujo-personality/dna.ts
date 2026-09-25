import { DIMENSION_FAMILIES } from './config'
import { petalPath } from './sigils'
import type { DimensionId, Vector } from './types'

/*
 * The Pujo DNA chart: the fourteen dimensions drawn as an alpona, fourteen
 * filled teardrops around a disc (08-visual-bible.md §3.3). The families sit
 * together; the gaps at ±90° are the medallion's, where its volutes would be.
 *
 * Petal lengths come from dnaPetals() in scoring.ts, so a petal at the dashed
 * ring is "about as much as most people", not the middle of some absolute
 * scale. Geometry only: the page, the share-card canvas and the link
 * previews all draw from this.
 */

export const DNA_BOX = 240
export const DNA_CENTRE = 120
export const DNA_DISC = 15
const BASE = 21          /* where a petal starts, just off the disc */
const MIN_LENGTH = 16
const MAX_LENGTH = 96

/* top arc: Self, Clock, Movement; bottom arc: Senses, People. 0° is up, clockwise. */
const ARCS: { from: number; to: number; families: string[] }[] = [
  { from: -72, to: 72, families: ['self', 'time', 'motion'] },
  { from: 108, to: 252, families: ['senses', 'people'] },
]
const FAMILY_GAP = 0.6   /* extra space between families, in petal steps */

export type DnaPetal = { dim: DimensionId; family: string; angle: number }

export const DNA_LAYOUT: DnaPetal[] = ARCS.flatMap(({ from, to, families }) => {
  const groups = families.map((id) => DIMENSION_FAMILIES.find((f) => f.id === id)!)
  const count = groups.reduce((n, g) => n + g.dims.length, 0)
  const step = (to - from) / (count - 1 + FAMILY_GAP * (groups.length - 1))
  const out: DnaPetal[] = []
  let angle = from
  groups.forEach((group, gi) => {
    group.dims.forEach((dim, di) => {
      if (out.length) angle += step + (gi > 0 && di === 0 ? step * FAMILY_GAP : 0)
      out.push({ dim, family: group.id, angle: Math.round(angle * 10) / 10 })
    })
  })
  return out
})

export function petalLength(petal: number): number {
  return MIN_LENGTH + (MAX_LENGTH - MIN_LENGTH) * petal
}

/* the dashed ring: where a petal lands for someone typical */
export const DNA_TYPICAL_RADIUS = BASE + petalLength(0.5)

export type DnaShape = DnaPetal & { d: string; transform: string; tip: [number, number]; length: number }

/* One filled teardrop per dimension, pointing out from the centre. */
export function dnaShapes(petals: Vector, centre = DNA_CENTRE): DnaShape[] {
  return DNA_LAYOUT.map((p) => {
    const length = petalLength(petals[p.dim])
    const width = 3 + length * 0.085
    const rad = (p.angle * Math.PI) / 180
    const reach = BASE + length
    return {
      ...p,
      length,
      d: petalPath(length, width),
      transform: `translate(${centre} ${centre}) rotate(${p.angle}) translate(0 ${-BASE})`,
      tip: [centre + Math.sin(rad) * reach, centre - Math.cos(rad) * reach],
    }
  })
}

/* the same transform, for a canvas already translated to the chart's centre */
export function canvasPetal(ctx: CanvasRenderingContext2D, shape: DnaShape) {
  ctx.save()
  ctx.rotate((shape.angle * Math.PI) / 180)
  ctx.translate(0, -BASE)
  ctx.fill(new Path2D(shape.d))
  ctx.restore()
}
