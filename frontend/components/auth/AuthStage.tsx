import type { ReactNode } from 'react'
import { MedallionBloom } from '@/components/brand/MedallionBloom'
import Link from 'next/link'
import Image from 'next/image'
import { AlponaLoader } from '@/components/brand/Alpona'
import { CookieSettingsButton } from '@/components/layout/SiteFooter'

/*  The auth screens. The medallion needs a flat ground, so the photograph gets
    its own half of the frame and the mark sits on Obsidian beside it. Below
    900px the photograph becomes a short band above the form.                 */

/* shared with app/(auth)/layout.tsx, which preloads it */
export const AUTH_PHOTO = { src: '/login-bg.jpg', sizes: '(max-width: 900px) 100vw, 50vw' }

export function AuthStage({ children, lede, footer }: { children: ReactNode; lede: string; footer?: ReactNode }) {
  return (
    <main className="mk-auth">
      <section className="mk-auth-main">
        <div className="mk-auth-column">
          <div className="mk-auth-lockup">
            <MedallionBloom size={88} />
            <div>
              <h1 className="mk-auth-latin">MY KOLKATA</h1>
              <p className="mk-auth-bn" lang="bn">আমার কলকাতা</p>
            </div>
          </div>
          <p className="mk-body-lg mk-auth-lede">{lede}</p>
          {children}
          <p className="mk-caption mk-auth-legal">
            By continuing, you agree to our <Link href="/terms">Terms of Use</Link> and <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </div>
        <footer className="mk-meta mk-auth-credit">
          {footer && <span>{footer}</span>}
          <span className="mk-footer-links mk-auth-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <CookieSettingsButton />
          </span>
        </footer>
      </section>

      <figure className="mk-auth-photo">
        <Image
          src={AUTH_PHOTO.src}
          alt="Kolkata from above under a monsoon sky, the Howrah Bridge crossing the Hooghly in the haze"
          fill
          sizes={AUTH_PHOTO.sizes}
          preload
        />
        <div className="mk-auth-scrim" aria-hidden="true" />
        <figcaption className="mk-capdev mk-auth-caption">
          <span className="mk-capdev-tick" aria-hidden="true" />
          <div>
            <p className="mk-capdev-1">The rain comes in over the river,</p>
            <p className="mk-capdev-2">and the city keeps its appointments.</p>
          </div>
        </figcaption>
      </figure>
    </main>
  )
}

export function AuthLoading({ label }: { label: string }) {
  return (
    <main className="mk-auth mk-auth--loading">
      <AlponaLoader label={label} />
    </main>
  )
}
