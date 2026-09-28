import type { Metadata } from 'next'
import Link from 'next/link'
import { Medallion } from '@/components/brand/kolka'
import { SiteFooter } from '@/components/layout/SiteFooter'

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'This page doesn’t exist on My Kolkata. It may have moved, or the address has a typo.',
  robots: { index: false, follow: true },
}

/* Two ways on: the city for people who are signed in, and the Pujo quiz,
   which anyone can open (/home would send a signed-out visitor to sign in). */
export default function NotFound() {
  return (
    <>
      <main className="mk-page mk-page-top">
        <div className="mk-wrap">
          <Medallion size={112} />
          <h1 className="mk-display" style={{ marginTop: 24 }}>This lane doesn&apos;t go anywhere.</h1>
          <p className="mk-lede">The page may have moved, or the address has a typo. Start again from the city.</p>
          <div className="mk-banner-actions">
            <Link href="/home" className="mk-btn mk-btn--primary">
              Back to the city <span className="mk-btn-arrow" aria-hidden="true">→</span>
            </Link>
            <Link href="/experience/personality" className="mk-btn mk-btn--text">What kind of Pujo are you?</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
