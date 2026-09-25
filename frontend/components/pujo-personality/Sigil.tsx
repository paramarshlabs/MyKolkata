import type { CSSProperties } from 'react'
import { SIGILS, type SigilColours } from '@/lib/pujo-personality/sigils'
import type { ArchetypeId } from '@/lib/pujo-personality/types'
import styles from '@/styles/PujoPersonality.module.css'

/* The house emblem colours on the dark ground. Paper grounds pass their own. */
export const DARK_SIGIL: SigilColours = {
  body: 'var(--mk-pearl)',
  accent: 'var(--mk-crimson)',
  yellow: 'var(--mk-taxi)',
  ground: 'var(--mk-obsidian)',
}

type SigilProps = {
  id: ArchetypeId
  size?: number
  colours?: SigilColours
  /* the reveal: each part lands in drawing order, centre first */
  bloom?: boolean
  label?: string
  className?: string
}

/* One of the nine archetype sigils (08-visual-bible.md §3.1). No hooks, so it
   renders from Server Components too. Never below 40px. */
export function Sigil({ id, size = 64, colours = DARK_SIGIL, bloom = false, label, className = '' }: SigilProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`${styles.sigil} ${bloom ? styles.sigilBloom : ''} ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {SIGILS[id].map((shape, i) => {
        const part = shape.t === 'line'
          ? <path d={shape.d} fill="none" stroke={colours[shape.stroke]} strokeWidth={shape.width} strokeLinecap="round" strokeLinejoin="round" transform={shape.transform} />
          : shape.t === 'circle'
            ? <circle cx={shape.cx} cy={shape.cy} r={shape.r} fill={colours[shape.fill]} transform={shape.transform} />
            : shape.t === 'ellipse'
              ? <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} fill={colours[shape.fill]} transform={shape.transform} />
              : <path d={shape.d} fill={colours[shape.fill]} fillRule={shape.rule} transform={shape.transform} />
        /* the animated group carries the CSS transform; the shape keeps its own */
        return <g key={i} className={styles.sigilPart} style={{ '--i': i } as CSSProperties}>{part}</g>
      })}
    </svg>
  )
}
