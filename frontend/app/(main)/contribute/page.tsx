import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'
import { requireUser } from '@/lib/auth'
import ContributeClient from './ContributeClient'

export const metadata: Metadata = pageMetadata({
  title: 'Contribute',
  description: 'Join a Kolkata community, or share a story from your para. Stories stay up for 24 hours.',
})

export default async function ContributePage() {
  await requireUser()
  return <ContributeClient />
}
