import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'
import { requireUser } from '@/lib/auth'
import ProfileClient from './ProfileClient'

export const metadata: Metadata = pageMetadata({
  title: 'Your profile',
  description: 'Your My Kolkata account.',
  noindex: true,
})

export default async function ProfilePage() {
  await requireUser()
  return <ProfileClient />
}
