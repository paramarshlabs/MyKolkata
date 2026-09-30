'use client'

import { useState, type ReactNode } from 'react'
import { UiIcon } from '@/components/brand/icons'
import { METRO_LINES, type Station } from '@/lib/pujo/pois'
import styles from '@/styles/PujoExplore.module.css'

/* ==========================================================================
   Small pieces the Pujo screens share: a pujo's row in a list, the Metro
   line mark (official line colours, the palette's one approved exception),
   and Share.
   ========================================================================== */

/* a small square per line the station is on; the line's name is always in the text beside it */
export function LineMark({ station }: { station: Station }) {
  return (
    <span className={styles.lineMark} aria-hidden="true">
      {station.lines.map((line) => <span key={line} style={{ background: METRO_LINES[line].colour }} />)}
    </span>
  )
}

type RowProps = {
  name: string
  meta?: ReactNode
  famous?: boolean
  onOpen: () => void
  /* a second control beside the row, e.g. Add */
  action?: ReactNode
  current?: boolean
}

/* the row is a button that opens the pujo; the action sits beside it, never inside it */
export function PujoRow({ name, meta, famous = false, onOpen, action, current = false }: RowProps) {
  return (
    <li className={`${styles.row} ${current ? styles.rowCurrent : ''}`}>
      <button type="button" className={styles.rowOpen} onClick={onOpen} aria-current={current ? 'true' : undefined}>
        <span className={styles.rowName}>
          {name}
          {famous && <span className={styles.famousTag}>Famous</span>}
        </span>
        {meta && <span className={styles.rowMeta}>{meta}</span>}
      </button>
      {action}
    </li>
  )
}

export function useShare() {
  const [said, setSaid] = useState<string | null>(null)
  const share = async ({ title, text, url }: { title: string; text?: string; url: string }) => {
    const absolute = new URL(url, window.location.origin).toString()
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: absolute })
        return
      }
      await navigator.clipboard.writeText(absolute)
      setSaid('Link copied.')
    } catch (error) {
      /* closing the share sheet is not an error worth a word */
      if (error instanceof DOMException && error.name === 'AbortError') return
      setSaid('That didn’t share. Copy the link from the address bar.')
    }
    window.setTimeout(() => setSaid(null), 2600)
  }
  return { share, said }
}

export function ShareButton({ title, text, url, label = 'Share' }: { title: string; text?: string; url: string; label?: string }) {
  const { share, said } = useShare()
  return (
    <>
      <button type="button" className="mk-btn mk-btn--secondary mk-btn--sm" onClick={() => share({ title, text, url })}>
        <UiIcon name="share" size={16} />
        {label}
      </button>
      <span className="sr-only" role="status" aria-live="polite">{said}</span>
      {said && <span className={`mk-meta ${styles.said}`} aria-hidden="true">{said}</span>}
    </>
  )
}
