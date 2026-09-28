'use client'

import { useSyncExternalStore } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from '@next/third-parties/google'
import { consentServerSnapshot, consentSnapshot, subscribeConsent } from '@/lib/consent'
import { redactPujoUrl } from '@/lib/pujo-personality/analytics'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

/* Vercel Analytics and Google Analytics, loaded only once the visitor has
   accepted analytics cookies (lib/consent.ts). Pujo share links are recorded
   by route rather than by card. */
export function SiteAnalytics() {
  const consent = useSyncExternalStore(subscribeConsent, consentSnapshot, consentServerSnapshot)
  if (consent !== 'granted') return null
  return (
    <>
      <Analytics beforeSend={(event) => ({ ...event, url: redactPujoUrl(event.url) })} />
      {/* loads after hydration and records client-side navigations too */}
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </>
  )
}
