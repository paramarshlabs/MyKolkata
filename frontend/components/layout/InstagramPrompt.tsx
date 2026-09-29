'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { UiIcon } from '@/components/brand/icons'
import { countPage, markFollowed, markShown, mayShow, quietMoment } from '@/lib/instagramPrompt'
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/site/site'

/* a few seconds into a page, never the instant it opens */
const DELAY_MIN_MS = 6_000
const DELAY_SPREAD_MS = 8_000
/* if the moment isn't quiet, look again shortly, a few times, then leave it for another page */
const RETRY_MS = 4_000
const RETRIES = 5

/* "Follow us on Instagram", as a small card in the corner: it never blocks the
   page, it asks at most twice ever, and "Follow" ends it for good. The rules
   live in lib/instagramPrompt.ts. */
export function InstagramPrompt() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)

  /* each page view counts toward "has browsed a bit", then maybe schedules the card */
  useEffect(() => {
    countPage()
    if (!mayShow()) return
    let tries = 0
    let timer = window.setTimeout(function attempt() {
      if (!mayShow()) return
      if (quietMoment()) {
        markShown()
        setOpen(true)
        return
      }
      if (++tries < RETRIES) timer = window.setTimeout(attempt, RETRY_MS)
    }, DELAY_MIN_MS + Math.random() * DELAY_SPREAD_MS)
    return () => window.clearTimeout(timer)
  }, [pathname])

  const close = useCallback(() => {
    setLeaving(true)
    window.setTimeout(() => {
      setOpen(false)
      setLeaving(false)
    }, 200)
  }, [])

  /* Escape dismisses, like any other card that floats over the page */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  if (!open) return null

  return (
    <aside
      className={`mk-ig${leaving ? ' is-leaving' : ''}`}
      role="complementary"
      aria-labelledby="mk-ig-title"
      aria-live="polite"
    >
      <button type="button" className="mk-ig-close" onClick={close} aria-label="Close">
        <UiIcon name="close" size={18} />
      </button>
      <div className="mk-ig-head">
        <span className="mk-ig-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <div>
          <h2 id="mk-ig-title" className="mk-ig-title">Follow us on Instagram</h2>
          <p className="mk-ig-handle">@{INSTAGRAM_HANDLE}</p>
        </div>
      </div>
      <p className="mk-ig-body">Pandal drops, Pujo routes and stories from every para, in your feed through the season.</p>
      <div className="mk-ig-actions">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mk-btn mk-btn--primary"
          onClick={() => {
            markFollowed()
            close()
          }}
        >
          Follow
        </a>
        <button type="button" className="mk-btn mk-btn--text" onClick={close}>Not now</button>
      </div>
    </aside>
  )
}
