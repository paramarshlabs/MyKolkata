'use client'

import Link from 'next/link'
import { NotchWing } from '@/components/brand/kolka'
import Navbar from '@/components/layout/Navbar'
import { useAuth } from '@/components/providers/AuthProvider'

/*  The header for the public pages under app/(open). Signed in, it is the
    full notch bar. Signed out, the sections would all ask for a sign-in, so it
    is one island: the lockup, and a way in.                                   */
export function OpenHeader() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navbar />

  return (
    <div className="mk-notchbar">
      <div className="bezel" aria-hidden="true" />
      <header className="nn nn-island nn-island--solo">
        <NotchWing side="left" />
        <NotchWing side="right" />
        <div className="nn-island-row">
          <Link className="nn-brand" href="/" aria-label="My Kolkata">
            <span className="nn-brand-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/micon.png" alt="" width={28} height={28} />
            </span>
            <span className="nn-brand-text nn-brand-text--solo">
              <span className="nn-brand-latin">MY KOLKATA</span>
              <span className="nn-brand-bn" lang="bn">আমার কলকাতা</span>
            </span>
          </Link>
          {/* hidden until the session is known, so a signed-in visitor never sees it flash */}
          {isAuthenticated === false && <Link className="nn-signin" href="/login">Sign in</Link>}
        </div>
      </header>
    </div>
  )
}
