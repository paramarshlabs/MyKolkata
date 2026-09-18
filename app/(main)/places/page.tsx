import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import PlacesClient from './PlacesClient'

export const metadata: Metadata = {
  title: 'Explore',
  description: 'Food, culture, hidden corners and the places Kolkata keeps for itself.',
}

export default async function PlacesPage() {
  await requireUser()
  return <PlacesClient />
}
