import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'
import CommunityClient from './CommunityClient'

export const metadata: Metadata = pageMetadata({
  title: 'Community',
  description: 'Join a Kolkata community, or share a story from your para. Stories stay up for 24 hours.',
})

export default async function ContributePage() {
  return <CommunityClient />
}
