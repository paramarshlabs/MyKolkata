import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import ProfileClient from './ProfileClient'

export const metadata: Metadata = { title: 'Your profile' }

export default async function ProfilePage() {
  await requireUser()
  return <ProfileClient />
}
