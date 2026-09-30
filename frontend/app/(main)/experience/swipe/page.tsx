import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'
import { requireUser } from '@/lib/auth'
import { ashtamiDate } from '@/lib/ashtami-date/server'
import AshtamiDateClient from './AshtamiDateClient'

export const metadata: Metadata = pageMetadata({
  title: 'Find your Ashtami date',
  description: 'Ashtami is coming. Swipe for someone to go pandal-hopping with, match, and pick a pandal. 18 and over.',
  noindex: true,
})

export default async function AshtamiDatePage() {
  const userId = await requireUser('/experience/swipe')
  /* your own card, so the page opens where you left off; the client asks again if this fails */
  const profile = await ashtamiDate.loadOwn(userId).catch((err) => {
    console.error('[ashtami-date] profile did not load', err)
    return undefined
  })
  return <AshtamiDateClient initialProfile={profile} />
}
