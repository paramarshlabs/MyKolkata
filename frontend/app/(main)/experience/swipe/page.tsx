import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'
import { requireUser } from '@/lib/auth'
import SwipeClient from './SwipeClient'

export const metadata: Metadata = pageMetadata({
  title: 'Swipe to find your Ashtami',
  description: 'Kolkata, one card at a time. Drag right if it is for you, left if it is not, then say how it was.',
})

export default async function SwipePage() {
  await requireUser()
  return <SwipeClient />
}
