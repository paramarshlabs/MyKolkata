import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'
import { requireUser } from '@/lib/auth'
import ExperienceClient from './ExperienceClient'

export const metadata: Metadata = pageMetadata({
  title: 'Experiences',
  description: 'Kolkata experiences, one card at a time. Drag right if it is for you, left if it is not, then say how it was.',
})

export default async function ExperiencePage() {
  await requireUser()
  return <ExperienceClient />
}
