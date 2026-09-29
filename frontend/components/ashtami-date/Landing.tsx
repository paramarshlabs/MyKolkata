'use client'

import Link from 'next/link'
import { useCountdown } from '@/components/brand/Countdown'
import { ASHTAMI_ISO } from '@/lib/ashtami-date/config'
import styles from '@/styles/AshtamiDate.module.css'
import { Sticker } from './marks'

const pad = (n: number) => String(n).padStart(2, '0')

/* One promise and one button, over the clock to Ashtami. */
export function Landing({ onStart }: { onStart: () => void }) {
  const left = useCountdown(ASHTAMI_ISO)
  const units: [string, string][] = left
    ? [[String(left.d), 'days'], [pad(left.h), 'hrs'], [pad(left.m), 'min'], [pad(left.s), 'sec']]
    : [['--', 'days'], ['--', 'hrs'], ['--', 'min'], ['--', 'sec']]

  return (
    <section className={styles.landing} aria-labelledby="landing-title">
      <Sticker tone="taxi" tilt={11} className={styles.landingSticker}>18+</Sticker>

      <div className={styles.landingClock} role="timer" aria-live="off" aria-label={left ? `${left.d} days to Ashtami` : 'counting down to Ashtami'}>
        {units.map(([value, label]) => (
          <span key={label} className={styles.landingUnit}>
            <span className={styles.landingNum}>{value}</span>
            <span className={styles.landingLabel}>{label}</span>
          </span>
        ))}
      </div>
      <p className={styles.landingTill}>{left?.done ? 'it’s' : 'till'} <span lang="bn" className={styles.landingBn}>অষ্টমী</span></p>

      <h1 id="landing-title" className={styles.landingTitle}>
        ashtami is coming.
        <span className={styles.landingTitleTwo}>who are you queueing with?</span>
      </h1>

      <button type="button" className={`mk-btn mk-btn--primary ${styles.landingCta}`} onClick={onStart}>
        find my ashtami date <span className="mk-btn-arrow" aria-hidden="true">→</span>
      </button>
      <p className={styles.landingSmall}>no bio. just what you&apos;d eat first. a minute, 18 and over.</p>
    </section>
  )
}

/* Under 18: a kind dead-end. Nothing was saved, and there's no way back in from here. */
export function UnderAge() {
  return (
    <section className={styles.landing} aria-labelledby="underage-title">
      <h1 id="underage-title" className={styles.onboardTitle}>not this pujo.</h1>
      <p className={styles.onboardSub}>ashtami date is for 18 and over. nothing you typed has been saved.</p>
      <p className={`${styles.stepText} ${styles.spaced}`}>the pujo is still all yours. find out what kind of pujo you are, and send it to your friends.</p>
      <div className={`${styles.stepActions} ${styles.spaced}`}>
        <Link href="/experience/personality" className="mk-btn mk-btn--primary">
          take the pujo personality quiz <span className="mk-btn-arrow" aria-hidden="true">→</span>
        </Link>
        <Link href="/experience" className={`mk-btn mk-btn--text ${styles.quiet}`}>all experiences</Link>
      </div>
    </section>
  )
}
