import type { ReactNode } from 'react'
import { EP } from './emblems'

/* ========================================================= alpona library == */
/*  Six motifs read straight off design/kolka_design.png. Solid, symmetrical,
    built from teardrops and dot runs. 64 x 112 grid.                          */

const P = 'var(--mk-pearl)'
const CR = 'var(--mk-crimson)'

/* Rounded so the server and the client print identical attribute strings —
   an unrounded Math.sin result hydrates as a mismatch. */
const r3 = (n: number) => Math.round(n * 1000) / 1000

export const MOTIF_LIB = {
  finial: (
    <>
      <path d="M32 4 C26 18 22 27 22 33 C22 40 26 44 32 44 C38 44 42 40 42 33 C42 27 38 18 32 4Z" fill={P} />
      <circle cx="32" cy="62" r="12" fill="none" stroke={P} strokeWidth="5" />
      <circle cx="32" cy="62" r="4.5" fill={CR} />
      <path d="M13 80 C13 93 21 100 32 100 C43 100 51 93 51 80 C47 89 40 93 32 93 C24 93 17 89 13 80Z" fill={P} />
      <circle cx="20" cy="108" r="3" fill={P} /><circle cx="32" cy="109" r="3.5" fill={P} />
      <circle cx="44" cy="108" r="3" fill={P} />
    </>
  ),
  flame: (
    <>
      <path d="M32 2 C27 14 24 22 24 27 C24 33 28 36 32 36 C36 36 40 33 40 27 C40 22 37 14 32 2Z" fill={P} />
      <EP x={32} y={66} rot={0} L={28} w={10} />
      <EP x={32} y={66} rot={-52} L={24} w={8} /><EP x={32} y={66} rot={52} L={24} w={8} />
      <EP x={32} y={66} rot={-86} L={18} w={6.5} /><EP x={32} y={66} rot={86} L={18} w={6.5} />
      <circle cx="32" cy="66" r="6" fill={CR} />
      <circle cx="22" cy="82" r="3" fill={P} /><circle cx="42" cy="82" r="3" fill={P} />
      <circle cx="32" cy="92" r="3.8" fill={P} /><circle cx="32" cy="104" r="2.6" fill={P} />
    </>
  ),
  rosette: (
    <>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180
        return <circle key={i} cx={r3(32 + Math.cos(a) * 20)} cy={r3(40 + Math.sin(a) * 20)} r="5.5" fill={P} />
      })}
      <circle cx="32" cy="40" r="19" fill={P} />
      <circle cx="32" cy="40" r="9" fill={CR} />
      <circle cx="32" cy="76" r="4" fill={P} />
      <circle cx="20" cy="90" r="3.2" fill={P} /><circle cx="32" cy="92" r="3.2" fill={P} />
      <circle cx="44" cy="90" r="3.2" fill={P} />
      <circle cx="32" cy="106" r="2.6" fill={P} />
    </>
  ),
  star: (
    <>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
        <EP key={d} x={32} y={42} rot={d} L={26} w={9} />
      ))}
      <circle cx="32" cy="42" r="7" fill={CR} />
      <circle cx="32" cy="86" r="4" fill={P} /><circle cx="32" cy="102" r="2.8" fill={P} />
    </>
  ),
  beadrun: (
    <>
      <circle cx="32" cy="8" r="4" fill={P} />
      <ellipse cx="32" cy="34" rx="9" ry="14" fill={P} />
      <EP x={32} y={62} rot={0} L={12} w={5} />
      <EP x={32} y={62} rot={-60} L={14} w={5} /><EP x={32} y={62} rot={60} L={14} w={5} />
      <circle cx="32" cy="80" r="4" fill={CR} />
      <circle cx="32" cy="96" r="3.2" fill={P} /><circle cx="32" cy="108" r="2.4" fill={P} />
    </>
  ),
  curl: (
    <>
      <path d="M32 4 C25 20 20 32 20 40 C20 48 25 53 32 53 C39 53 44 48 44 40 C44 32 39 20 32 4Z" fill={P} />
      <path d="M32 56 C40 66 26 76 33 88 C37 95 33 100 29 100" fill="none" stroke={P}
        strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="32" cy="108" r="3.4" fill={P} />
    </>
  ),
} satisfies Record<string, ReactNode>

export type MotifName = keyof typeof MOTIF_LIB

export const MOTIF_LIB_LIST: [MotifName, string, string][] = [
  ['finial', 'Finial', 'Section openers and the top of a feature panel'],
  ['flame', 'Flame', 'Celebration moments — a completed contribution, a milestone'],
  ['rosette', 'Rosette', 'Avatars, para badges, category markers'],
  ['star', 'Star flower', 'Ratings, highlights, editor picks'],
  ['beadrun', 'Bead run', 'Vertical dividers and timeline nodes'],
  ['curl', 'Curl', 'Quote marks, pull-quotes, end-of-article marks'],
]

/* Filled, never outlined, never rotated. One motif per component. design.md §6 */
export function Motif({ name, height = 80, className = '' }: { name: MotifName; height?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 112" width={height * (64 / 112)} height={height}
      className={`mk-motif ${className}`} aria-hidden="true">
      {MOTIF_LIB[name]}
    </svg>
  )
}
