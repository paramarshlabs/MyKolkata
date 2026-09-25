import type { ArchetypeId } from './types'

/*
 * The nine archetype sigils, as data. Drawn in the emblem vocabulary
 * (components/brand/emblems.tsx): filled, never outlined, a 64px grid, one
 * body colour and one accent. Kept as shape lists rather than JSX so the same
 * drawing renders inline (components/pujo-personality/Sigil.tsx), onto the
 * share-card canvas, and into server-side link previews.
 *
 * Four are derived from existing emblems: the dhaak (Para Kid), kash phool
 * (Pujo Romantic, doubled), the dhunuchi and the shiuli.
 */

export type Paint = 'body' | 'accent' | 'yellow' | 'ground'

export type Shape =
  | { t: 'path'; d: string; fill: Paint; transform?: string; rule?: 'evenodd' }
  | { t: 'circle'; cx: number; cy: number; r: number; fill: Paint; transform?: string }
  | { t: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill: Paint; transform?: string }
  | { t: 'line'; d: string; stroke: Paint; width: number; transform?: string }

export type SigilColours = { body: string; accent: string; yellow: string; ground: string }

/* the alpona teardrop, pointing up from (0, 0) — the same curve as kolka.tsx */
export const petalPath = (L: number, w: number) =>
  `M0 0 C${-w} ${-0.34 * L} ${-w} ${-0.72 * L} 0 ${-L} C${w} ${-0.72 * L} ${w} ${-0.34 * L} 0 0 Z`

const petal = (x: number, y: number, rot: number, L: number, w: number, fill: Paint = 'body'): Shape =>
  ({ t: 'path', d: petalPath(L, w), fill, transform: `rotate(${rot} ${x} ${y}) translate(${x} ${y})` })

const r2 = (n: number) => Math.round(n * 100) / 100

export const SIGILS: Record<ArchetypeId, Shape[]> = {
  /* a crescent cradling one Chandannagar bulb */
  night_owl: [
    { t: 'path', d: 'M33.14 7.03 A26 26 0 1 0 57.06 39.92 A20.5 20.5 0 1 1 33.14 7.03 Z', fill: 'body' },
    { t: 'line', d: 'M0 -13 L0 -21.5', stroke: 'body', width: 2, transform: 'translate(35.6 32.4) rotate(45)' },
    { t: 'path', d: 'M-3.8 -13.8 L3.8 -13.8 L3.8 -8.4 C3.8 -7.2 2 -6.6 0 -6.6 C-2 -6.6 -3.8 -7.2 -3.8 -8.4 Z', fill: 'body', transform: 'translate(35.6 32.4) rotate(45)' },
    { t: 'circle', cx: 0, cy: 0, r: 7.6, fill: 'yellow', transform: 'translate(35.6 32.4) rotate(45)' },
    { t: 'circle', cx: 59.5, cy: 48, r: 1.9, fill: 'body' },
    { t: 'circle', cx: 58.5, cy: 54.5, r: 1.3, fill: 'body' },
  ],

  /* a compass rose of alpona teardrops, north in crimson */
  pandal_hunter: [
    petal(32, 32, 0, 27, 6.2, 'accent'),
    petal(32, 32, 90, 24, 5.6),
    petal(32, 32, 180, 24, 5.6),
    petal(32, 32, 270, 24, 5.6),
    ...[45, 135, 225, 315].map((a) => petal(32, 32, a, 14, 3.8)),
    ...[45, 135, 225, 315].map((a): Shape => {
      const rad = (a * Math.PI) / 180
      return { t: 'circle', cx: r2(32 + Math.sin(rad) * 19.5), cy: r2(32 - Math.cos(rad) * 19.5), r: 2, fill: 'body' }
    }),
    { t: 'circle', cx: 32, cy: 32, r: 5.2, fill: 'body' },
    { t: 'circle', cx: 32, cy: 32, r: 2.2, fill: 'ground' },
  ],

  /* the dhaak with its plume (the Dhaak emblem) */
  para_kid: [
    petal(22, 27, -18, 16, 4.2),
    petal(32, 25, 0, 19, 4.8),
    petal(42, 27, 18, 16, 4.2),
    { t: 'path', d: 'M12 29 C24 25 40 25 52 29 C56 34 56 48 52 53 C40 57 24 57 12 53 C8 48 8 34 12 29Z', fill: 'accent' },
    { t: 'ellipse', cx: 12, cy: 41, rx: 5, ry: 14, fill: 'body' },
    { t: 'ellipse', cx: 52, cy: 41, rx: 5, ry: 14, fill: 'body' },
    { t: 'line', d: 'M18 30 L24 52 M26 29 L32 53 M34 29 L40 53 M42 30 L48 52', stroke: 'body', width: 1.8 },
  ],

  /* two kaash plumes gathered together, tied with one red thread */
  pujo_romantic: [
    ...[-17, 17].flatMap((a): Shape[] => {
      const tf = `rotate(${a} 32 49) translate(0 -3)`
      return [
        { t: 'path', d: 'M32 33 C23 29.5 17 18 18 6 C27 10 32 20 32 33Z', fill: 'body', transform: tf },
        { t: 'path', d: 'M32 33 C41 29.5 47 18 46 6 C37 10 32 20 32 33Z', fill: 'body', transform: tf },
        { t: 'path', d: 'M30.4 64 L30.4 28 L33.6 28 L33.6 64Z', fill: 'body', transform: tf },
      ]
    }),
    { t: 'path', d: 'M26.5 44.5 L37.5 44.5 L37.5 49.5 L26.5 49.5 Z', fill: 'accent' },
  ],

  /* a sal-leaf plate: the khichuri heaped on it, one piece of beguni */
  pet_pujari: [
    { t: 'path', d: 'M3 41 C7 50.5 19 55 32 55 C45 55 57 50.5 61 41 Z', fill: 'body' },
    { t: 'line', d: 'M12 45.5 C18 48.5 25 49.8 32 49.8 C39 49.8 46 48.5 52 45.5', stroke: 'ground', width: 1.3 },
    { t: 'path', d: 'M14 38.2 C13 31.5 17.5 27.2 22.5 28.2 C24 22 30.5 19.8 34 23.2 C38.5 20 45.5 22.5 45.5 28.4 C50.5 28.8 52 33.8 50 38.2 Z', fill: 'body' },
    { t: 'ellipse', cx: 46, cy: 29.5, rx: 10, ry: 3.8, fill: 'yellow', transform: 'rotate(-30 46 29.5)' },
    { t: 'circle', cx: 32, cy: 60.5, r: 1.8, fill: 'body' },
  ],

  /* the chalchitra: the painted arch, spokes radiating from the centre */
  art_kid: [
    { t: 'path', d: 'M3 49 A29 29 0 0 1 61 49 L54 49 A22 22 0 0 0 10 49 Z', fill: 'body' },
    { t: 'path', d: 'M15 49 A17 17 0 0 1 49 49 L44.5 49 A12.5 12.5 0 0 0 19.5 49 Z', fill: 'body' },
    ...[-75, -50, -25, 0, 25, 50, 75].map((a): Shape =>
      ({ t: 'path', d: 'M-1.2 -22.4 L1.2 -22.4 L1.2 -16.6 L-1.2 -16.6 Z', fill: 'body', transform: `translate(32 49) rotate(${a})` })),
    ...[-60, -30, 0, 30, 60].map((a): Shape =>
      ({ t: 'path', d: 'M-1.1 -12.9 L1.1 -12.9 L1.1 -7 L-1.1 -7 Z', fill: 'body', transform: `translate(32 49) rotate(${a})` })),
    { t: 'circle', cx: 32, cy: 49, r: 6.5, fill: 'accent' },
    { t: 'path', d: 'M2 52 L62 52 L62 56 L2 56 Z', fill: 'body' },
    { t: 'circle', cx: 32, cy: 61, r: 1.8, fill: 'body' },
  ],

  /* two bhaar cups touching, steam rising between them */
  addabaaz: [
    ...[[22.5, 44, 16], [41.5, 44, -16]].flatMap(([x, y, a]): Shape[] => {
      const tf = `translate(${x} ${y}) rotate(${a})`
      return [
        { t: 'path', d: 'M-8.6 -8 L8.6 -8 L6 8.4 C5.6 10.4 3.2 11.4 0 11.4 C-3.2 11.4 -5.6 10.4 -6 8.4 Z', fill: 'body', transform: tf },
        { t: 'ellipse', cx: 0, cy: -8, rx: 8.6, ry: 2.8, fill: 'body', transform: tf },
        { t: 'ellipse', cx: 0, cy: -8, rx: 6.6, ry: 1.6, fill: 'ground', transform: tf },
      ]
    }),
    { t: 'line', d: 'M28.5 27 C25 22 31.5 19 28 13', stroke: 'accent', width: 2.4 },
    { t: 'line', d: 'M35.5 27 C39 22 32.5 19 36 13', stroke: 'accent', width: 2.4 },
    { t: 'circle', cx: 32, cy: 61, r: 1.8, fill: 'body' },
  ],

  /* the dhunuchi, smoke rising (the Dhunuchi emblem) */
  dhunuchi: [
    { t: 'line', d: 'M25 17 C20 10 28 7 24 1', stroke: 'body', width: 2.6 },
    { t: 'line', d: 'M32 16 C38 8 29 5 33 0', stroke: 'body', width: 2.6 },
    { t: 'line', d: 'M39 17 C44 10 36 7 40 1', stroke: 'body', width: 2.6 },
    { t: 'ellipse', cx: 32, cy: 23, rx: 18, ry: 4, fill: 'body' },
    { t: 'path', d: 'M14 23 C16 37 22 45 32 45 C42 45 48 37 50 23Z', fill: 'body' },
    { t: 'circle', cx: 25, cy: 24, r: 3, fill: 'accent' },
    { t: 'circle', cx: 32, cy: 25, r: 3.6, fill: 'accent' },
    { t: 'circle', cx: 39, cy: 24, r: 3, fill: 'accent' },
    { t: 'path', d: 'M28 45 L36 45 L35 53 L29 53Z', fill: 'body' },
    { t: 'path', d: 'M19 62 C19 54 25 53 32 53 C39 53 45 54 45 62Z', fill: 'body' },
  ],

  /* five white petals and one orange stem (the Shiuli emblem) */
  shiuli: [
    ...[0, 72, 144, 216, 288].map((a) => petal(32, 26, a, 22, 8)),
    { t: 'circle', cx: 32, cy: 26, r: 5.4, fill: 'yellow' },
    { t: 'path', d: 'M30.4 62 L30.4 30 L33.6 30 L33.6 62Z', fill: 'yellow' },
  ],
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/* The sigil's shapes as SVG markup on the 64px grid, with the colours baked in. */
export function sigilBody(id: ArchetypeId, colours: SigilColours): string {
  const paint = (p: Paint) => esc(colours[p])
  return SIGILS[id].map((s) => {
    const tf = s.transform ? ` transform="${s.transform}"` : ''
    switch (s.t) {
      case 'path': return `<path d="${s.d}" fill="${paint(s.fill)}"${s.rule ? ` fill-rule="${s.rule}"` : ''}${tf}/>`
      case 'circle': return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${paint(s.fill)}"${tf}/>`
      case 'ellipse': return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" fill="${paint(s.fill)}"${tf}/>`
      case 'line': return `<path d="${s.d}" fill="none" stroke="${paint(s.stroke)}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round"${tf}/>`
    }
  }).join('')
}

/* A standalone SVG document of one sigil. */
export function sigilSvg(id: ArchetypeId, colours: SigilColours, size = 64): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">${sigilBody(id, colours)}</svg>`
}
