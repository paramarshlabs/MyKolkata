'use client'

import { Analytics } from '@vercel/analytics/next'
import { redactPujoUrl } from '@/lib/pujo-personality/analytics'

/* Vercel Analytics, with Pujo share links recorded by route rather than by card. */
export function SiteAnalytics() {
  return <Analytics beforeSend={(event) => ({ ...event, url: redactPujoUrl(event.url) })} />
}
