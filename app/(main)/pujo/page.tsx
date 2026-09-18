import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import PujoClient from './PujoClient'

export const metadata: Metadata = { title: 'Pujo' }

export default async function PujoPage() {
  await requireUser()
  return <PujoClient />
}
