import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'
import { requireUser } from '@/lib/auth'
import PlacesClient from './PlacesClient'

export const metadata: Metadata = pageMetadata({
  title: 'Explore',
  description: 'Food, culture, hidden corners and the places Kolkata keeps for itself.',
})

export default async function PlacesPage() {
  await requireUser()
  return <PlacesClient />
}
