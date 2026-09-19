import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import ContributeClient from './ContributeClient'

export const metadata: Metadata = { title: 'Contribute' }

export default async function ContributePage() {
  await requireUser()
  return <ContributeClient />
}
