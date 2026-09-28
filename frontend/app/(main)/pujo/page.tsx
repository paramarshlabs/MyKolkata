import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'
import { requireUser } from '@/lib/auth'
import PujoClient from './PujoClient'

export const metadata: Metadata = pageMetadata({
  title: 'Pujo',
  description: 'Durga Pujo in Kolkata: the countdown to Mahalaya, pandals by region, and what kind of Pujo you are.',
})

export default async function PujoPage() {
  await requireUser()
  return <PujoClient />
}
