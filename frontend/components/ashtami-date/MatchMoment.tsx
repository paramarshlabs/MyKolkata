'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { NIGHT_DAYS } from '@/lib/ashtami-date/config'
import type { MatchView } from '@/lib/ashtami-date/profile'
import styles from '@/styles/AshtamiDate.module.css'
import { AlponaBurst } from './marks'
import { firstMoveLine, useDialog } from './shared'

type Props = {
  match: MatchView
  myPhoto: string | null
  onClose: () => void
}

/* The product's one loud moment: the screen people screenshot. */
export function MatchMoment({ match, myPhoto, onClose }: Props) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const primary = useRef<HTMLAnchorElement & HTMLButtonElement>(null)
  const [note, setNote] = useState<string | null>(null)
  useDialog(panel, onClose, primary)

  useEffect(() => {
    document.body.classList.add(styles.lockScroll)
    return () => document.body.classList.remove(styles.lockScroll)
  }, [])

  const day = NIGHT_DAYS[match.plan.night]
  const chatHref = `/experience/swipe/matches/${encodeURIComponent(match.id)}`

  async function share() {
    const url = `${window.location.origin}/experience/ashtami-date/${match.shareToken}`
    const text = 'found my ashtami date. who are you queueing with?'
    try {
      if (navigator.share) {
        await navigator.share({ title: 'it’s a match', text, url })
        return
      }
      await navigator.clipboard.writeText(`${text} ${url}`)
      setNote('link copied. no names in it, just the night.')
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setNote('that didn’t share. screenshot it instead.')
    }
  }

  return (
    <div className={styles.moment} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panel}>
      <AlponaBurst />
      <div className={styles.momentInner}>
        <h2 id={titleId} className={styles.momentTitle}>it&apos;s a match.</h2>
        <p className={styles.momentSub}>now pick a pandal.</p>

        <div className={styles.prints} aria-hidden="true">
          <span className={`${styles.print} ${styles.printMine}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a signed, private link, see DeckCard */}
            {myPhoto ? <img src={myPhoto} alt="" /> : <span className={styles.printBlank}>you</span>}
          </span>
          <span className={`${styles.print} ${styles.printTheirs}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a signed, private link, see DeckCard */}
            {match.them.photo ? <img src={match.them.photo} alt="" /> : <span className={styles.printBlank}>{match.them.firstName.slice(0, 1)}</span>}
          </span>
        </div>

        <div className={styles.planCard}>
          <p className={styles.planLabel}>you and {match.them.firstName}, the plan</p>
          <p className={styles.planPandal}>{match.plan.pandal}</p>
          <p className={styles.planWhen}>
            <span lang="bn" className={styles.planBn}>{day.bn}</span> {match.plan.night}, {match.plan.time}
          </p>
          <p className={styles.planNote}>{match.plan.note} {match.plan.areaLabel}.</p>
        </div>

        <p className={styles.momentMove}>{firstMoveLine(match)}</p>
        {match.handles.locked && <p className={styles.momentHint}>handles unlock with the first message.</p>}

        <div className={styles.momentActions}>
          {match.canWrite ? (
            <Link ref={primary} href={chatHref} className="mk-btn mk-btn--primary">
              say hi <span className="mk-btn-arrow" aria-hidden="true">→</span>
            </Link>
          ) : (
            <button ref={primary} type="button" className="mk-btn mk-btn--primary" onClick={onClose}>
              keep swiping <span className="mk-btn-arrow" aria-hidden="true">→</span>
            </button>
          )}
          <button type="button" className="mk-btn mk-btn--secondary" onClick={share}>share the moment</button>
          {match.canWrite
            ? <button type="button" className={`mk-btn mk-btn--text ${styles.quiet}`} onClick={onClose}>keep swiping</button>
            : <Link href={chatHref} className={`mk-btn mk-btn--text ${styles.quiet}`}>open the chat</Link>}
        </div>
        <p className={styles.momentNote} role="status">{note}</p>
      </div>
    </div>
  )
}
