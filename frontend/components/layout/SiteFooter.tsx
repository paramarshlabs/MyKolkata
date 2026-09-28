'use client'

import Link from 'next/link'
import { openConsent } from '@/lib/consent'
import { OPERATOR } from '@/lib/site/site'

export function CookieSettingsButton() {
  return <button type="button" onClick={openConsent}>Cookie settings</button>
}

/* The small print, on every page: who runs the site, the policies, and the
   way back into the cookie choice. */
export function SiteFooter() {
  return (
    <footer className="mk-footer">
      <div className="mk-wrap mk-footer-row">
        <p className="mk-footer-owner">© {new Date().getFullYear()} {OPERATOR}</p>
        <nav aria-label="Legal">
          <ul className="mk-footer-links">
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
            <li><CookieSettingsButton /></li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
