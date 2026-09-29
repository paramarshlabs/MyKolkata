import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'
import { requireUser } from '@/lib/auth'
import { HomeEntry } from '@/components/brand/HomeEntry'
import { HomeView } from '@/components/home/HomeView'

export const dynamic = 'force-dynamic'
/* a stale live feed is refreshed after the response (lib/live/server.ts) */
export const maxDuration = 60

export const metadata: Metadata = pageMetadata({
  title: 'Home',
  description: 'The city, this week: the news, what the paras are saying, what is on tonight and what Kolkata is searching.',
})

export default async function HomePage() {
  await requireUser()
  return (
    <>
      <HomeEntry />
      <HomeView />
    </>
  )
}
