import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import TinderClient from './TinderClient'

export const metadata: Metadata = { title: 'Experiences' }

export default async function TinderPage() {
  await requireUser()
  return <TinderClient />
}
