import type { CSSProperties, ReactNode } from 'react'
import { petalPath } from '@/components/brand/kolka'
import styles from '@/styles/AshtamiDate.module.css'

/* ==========================================================================
   The drawn parts of Find your Ashtami date. No icon library: a scalloped
   sticker like the price tags on a sweet shop's glass, the shiuli for the
   super-like, and alpona petals and dots for the match. Coordinates are
   rounded so the server and the browser draw the same thing.
   ========================================================================== */

const r2 = (n: number) => Math.round(n * 100) / 100

/* a circle with `bumps` scallops, on a 100 × 100 grid */
function scallopPath(bumps = 16, outer = 49, inner = 44) {
  const step = (Math.PI * 2) / bumps
  let d = ''
  for (let i = 0; i < bumps; i++) {
    const a0 = i * step
    const a1 = a0 + step / 2
    const a2 = a0 + step
    const p0 = [50 + Math.cos(a0) * inner, 50 + Math.sin(a0) * inner]
    const c = [50 + Math.cos(a1) * (outer + (outer - inner)), 50 + Math.sin(a1) * (outer + (outer - inner))]
    const p2 = [50 + Math.cos(a2) * inner, 50 + Math.sin(a2) * inner]
    d += `${i === 0 ? `M${r2(p0[0])} ${r2(p0[1])}` : ''} Q${r2(c[0])} ${r2(c[1])} ${r2(p2[0])} ${r2(p2[1])}`
  }
  return `${d} Z`
}
const SCALLOP = scallopPath()

type StickerProps = { children: ReactNode; tone?: 'taxi' | 'pearl' | 'blush'; tilt?: number; className?: string }

/* A hard-edged sticker, slapped on at an angle. The words sit on top as real text. */
export function Sticker({ children, tone = 'taxi', tilt = -8, className = '' }: StickerProps) {
  return (
    <span className={`${styles.sticker} ${styles[`sticker_${tone}`]} ${className}`} style={{ '--tilt': `${tilt}deg` } as CSSProperties}>
      <svg viewBox="0 0 100 100" aria-hidden="true" className={styles.stickerShape}><path d={SCALLOP} /></svg>
      <span className={styles.stickerText}>{children}</span>
    </span>
  )
}

/* The shiuli, as a line glyph for the super-like: five petals round an orange heart, one stem. */
export function ShiuliGlyph({ size = 22 }: { size?: number }) {
  const petals = [0, 72, 144, 216, 288]
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {petals.map((deg) => (
        <path key={deg} transform={`rotate(${deg} 12 9.5)`} d="M12 9.5 C10.2 7.4 10.4 4.6 12 3 C13.6 4.6 13.8 7.4 12 9.5Z" />
      ))}
      <path d="M12 11.5 V21.5" className={styles.shiuliStem} />
    </svg>
  )
}

/* "for me": the kolka's teardrop over two dots, filled, as the brand's sprig */
export function SprigGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="currentColor">
      <path d="M12 2 C9.4 6.8 8 9.6 8 11.6 C8 14 9.8 15.6 12 15.6 C14.2 15.6 16 14 16 11.6 C16 9.6 14.6 6.8 12 2Z" />
      <circle cx="12" cy="19" r="1.6" /><circle cx="12" cy="22.4" r="1.1" />
    </svg>
  )
}

export function CrossGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

/* ------------------------------------------------------- the burst -- */

/* a fixed, seeded scatter: the same burst every time, and no Math.random in render */
function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x6d2b79f5) >>> 0
    return (s % 10000) / 10000
  }
}

type Piece = { kind: 'petal' | 'dot' | 'rosette'; tone: 'pearl' | 'crimson' | 'taxi' | 'blush'; x: number; y: number; rot: number; size: number; delay: number }

const PIECES: Piece[] = (() => {
  const rand = seeded(1910)
  const kinds: Piece['kind'][] = ['petal', 'petal', 'dot', 'petal', 'rosette', 'dot']
  const tones: Piece['tone'][] = ['pearl', 'taxi', 'pearl', 'crimson', 'blush', 'pearl']
  return Array.from({ length: 28 }, (_, i) => {
    const angle = (i / 28) * Math.PI * 2 + rand() * 0.4
    const reach = 26 + rand() * 30
    return {
      kind: kinds[i % kinds.length],
      tone: tones[(i * 5) % tones.length],
      x: r2(Math.cos(angle) * reach),
      y: r2(Math.sin(angle) * reach * 1.25),
      rot: Math.round((angle * 180) / Math.PI + 90 + (rand() - 0.5) * 60),
      size: r2(0.7 + rand() * 0.8),
      delay: Math.round(rand() * 140),
    }
  })
})()

function PieceShape({ kind }: { kind: Piece['kind'] }) {
  if (kind === 'dot') return <circle cx="12" cy="12" r="5" />
  if (kind === 'rosette') {
    return (
      <>
        {[0, 60, 120, 180, 240, 300].map((d) => (
          <circle key={d} cx={r2(12 + Math.cos((d * Math.PI) / 180) * 6.5)} cy={r2(12 + Math.sin((d * Math.PI) / 180) * 6.5)} r="2.6" />
        ))}
        <circle cx="12" cy="12" r="3.4" />
      </>
    )
  }
  return <path transform="translate(12 22)" d={petalPath(20, 6.5)} />
}

/* Alpona pieces thrown out from the middle of the screen, the way rice paste
   dots land when you flick it. They settle and stay; under reduced motion
   they're simply there. */
export function AlponaBurst() {
  return (
    <div className={styles.burst} aria-hidden="true">
      {PIECES.map((p, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`${styles.burstPiece} ${styles[`tone_${p.tone}`]}`}
          style={{ '--tx': `${p.x}vw`, '--ty': `${p.y}vh`, '--rot': `${p.rot}deg`, '--s': p.size, '--delay': `${p.delay}ms` } as CSSProperties}
        >
          <PieceShape kind={p.kind} />
        </svg>
      ))}
    </div>
  )
}
