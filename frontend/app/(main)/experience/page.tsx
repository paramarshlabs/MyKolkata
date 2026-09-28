import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import ExperienceClient from './ExperienceClient'

export const metadata: Metadata = { title: 'Experiences' }

export default async function ExperiencePage() {
  await requireUser()
  return <ExperienceClient />
}
