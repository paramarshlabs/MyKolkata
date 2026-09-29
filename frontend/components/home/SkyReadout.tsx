import type { MoonPhase } from '@/lib/home/astro'
import type { SkyReport } from '@/lib/home/sky'
import styles from '@/styles/Home.module.css'

/*  Tonight's moon, drawn at its real phase: a dim disc, and the lit part
    bounded by the limb on one side and the terminator — an ellipse whose
    width follows the phase — on the other.                                 */
export function MoonGlyph({ moon, size = 44 }: { moon: MoonPhase; size?: number }) {
  const r = 20
  const rx = Math.abs(Math.cos(2 * Math.PI * moon.phase)) * r
  const crescent = moon.illumination < 0.5
  /* waxing: lit on the right; waning: on the left (as seen from Bengal) */
  const limb = moon.waxing ? 1 : 0
  const terminator = moon.waxing ? (crescent ? 0 : 1) : (crescent ? 1 : 0)
  const lit = moon.illumination < 0.02 ? null
    : moon.illumination > 0.98 ? `M0 ${-r} A${r} ${r} 0 1 1 0 ${r} A${r} ${r} 0 1 1 0 ${-r} Z`
    : `M0 ${-r} A${r} ${r} 0 0 ${limb} 0 ${r} A${rx.toFixed(2)} ${r} 0 0 ${terminator} 0 ${-r} Z`
  return (
    <svg className={styles.moon} viewBox="-24 -24 48 48" width={size} height={size} aria-hidden="true">
      <circle r={r} fill="rgba(242, 241, 237, 0.1)" stroke="rgba(242, 241, 237, 0.22)" strokeWidth="0.8" />
      {lit && <path d={lit} fill="var(--mk-blush)" />}
    </svg>
  )
}

/*  The corner of the frame: tonight's moon and one line about the sky.   */
export function SkyReadout({ report }: { report: SkyReport }) {
  return (
    <div className={styles.sky}>
      <MoonGlyph moon={report.moon} />
      <p className={styles.skyLine}>{report.sentence}</p>
    </div>
  )
}
