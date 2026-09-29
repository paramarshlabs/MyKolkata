import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'
import { requireUser } from '@/lib/auth'
import MatchesClient from './MatchesClient'

export const metadata: Metadata = pageMetadata({
  title: 'Your Ashtami matches',
  description: 'Your matches from Find your Ashtami date, each with a plan: a pandal and a time.',
  noindex: true,
})

export default async function MatchesPage() {
  await requireUser()
  return <MatchesClient />
}
