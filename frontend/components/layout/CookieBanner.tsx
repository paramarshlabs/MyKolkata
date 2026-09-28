'use client'

import Link from 'next/link'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { readConsent, subscribeConsent, subscribeOpenConsent, writeConsent, type Consent } from '@/lib/consent'

/* 'pending' on the server and while hydrating. The banner is in the server
   HTML, so a first visit paints it straight away rather than after the
   JavaScript runs; a visitor who has already chosen never sees it, because
   CONSENT_BOOT marks <html data-consent> before paint and CSS hides it. */
const snapshot = () => readConsent() ?? 'unset'
const serverSnapshot = () => 'pending' as const

/* Asks once, in plain words, with "no" as easy as "yes". Reopened from
   "Cookie settings" in the footer. */
export function CookieBanner() {
  const state = useSyncExternalStore(subscribeConsent, snapshot, serverSnapshot)
  const [reopened, setReopened] = useState(false)
  useEffect(() => subscribeOpenConsent(() => setReopened(true)), [])

  if (state !== 'pending' && state !== 'unset' && !reopened) return null

  const choose = (value: Consent) => {
    setReopened(false)
    writeConsent(value)
  }

  return (
    <section className={`mk-consent${reopened ? ' is-open' : ''}`} role="region" aria-labelledby="consent-title">
      <h2 id="consent-title" className="mk-consent-title">Cookies</h2>
      <p className="mk-consent-body">
        Necessary cookies keep you signed in. May we also use analytics (Google and Vercel) to see which
        pages people use? No ads. Change it any time in Cookie settings.{' '}
        <Link href="/privacy#cookies">Details</Link>
      </p>
      <div className="mk-consent-actions">
        <button type="button" className="mk-btn mk-btn--secondary" onClick={() => choose('denied')}>
          Necessary only
        </button>
        <button type="button" className="mk-btn mk-btn--secondary" onClick={() => choose('granted')}>
          Allow analytics
        </button>
      </div>
      {reopened && state !== 'pending' && state !== 'unset' && (
        <p className="mk-consent-now">
          Right now: {state === 'granted' ? 'analytics allowed' : 'necessary cookies only'}.
        </p>
      )}
    </section>
  )
}
