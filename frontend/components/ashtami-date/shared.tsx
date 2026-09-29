'use client'

import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'
import type { MatchView } from '@/lib/ashtami-date/profile'
import styles from '@/styles/AshtamiDate.module.css'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/* A dialog's manners: focus moves in, Tab stays in, Escape leaves, and focus goes back where it was. */
export function useDialog(panel: RefObject<HTMLElement | null>, onClose: () => void, initial?: RefObject<HTMLElement | null>) {
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose })

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const first = initial?.current ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close.current()
        return
      }
      if (e.key !== 'Tab' || !panel.current) return
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (!items.length) return
      const [head, tail] = [items[0], items[items.length - 1]]
      if (e.shiftKey && document.activeElement === head) {
        e.preventDefault()
        tail.focus()
      } else if (!e.shiftKey && document.activeElement === tail) {
        e.preventDefault()
        head.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
    // the dialog mounts once; its handlers read the latest onClose through the ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/* A sheet that rises from the bottom of a phone, and sits in the middle on anything wider. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  useDialog(panel, onClose)
  return (
    <div className={styles.sheetBack} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={panel} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className={styles.sheetTitle}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

/* "18 hours left", counted up so the last hour still says so */
export function timeLeft(iso: string | null, now = Date.now()): string {
  if (!iso) return ''
  const ms = new Date(iso).getTime() - now
  if (ms <= 0) return 'no time left'
  const hours = Math.ceil(ms / 3_600_000)
  return hours <= 1 ? 'under an hour left' : `${hours} hours left`
}

/* who writes first, in words, from one person's side */
export function firstMoveLine(match: MatchView, now = Date.now()): string {
  if (match.status === 'open') return 'you’re talking. messages vanish 24 hours after they’re sent.'
  const left = timeLeft(match.expiresAt, now)
  if (match.firstMove === 'you') return `you make the first move. ${left}.`
  if (match.firstMove === 'them') return `${match.them.firstName} makes the first move. ${left}.`
  return `either of you can go first. ${left}, or it fades.`
}
