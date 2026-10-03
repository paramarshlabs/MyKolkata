import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'
import { HomeEntry } from '@/components/brand/HomeEntry'
import { HomeView } from '@/components/home/HomeView'

/* The same page for everyone signed in (the wall is in proxy.ts), so it is
   rendered at most once a minute and served from the CDN in between, rather
   than reading the database for every visitor. A stale live feed is refreshed
   after a re-render (lib/live/server.ts). */
export const revalidate = 60
export const maxDuration = 60

export const metadata: Metadata = pageMetadata({
  title: 'Home',
  description: 'The city, this week: the news, what the paras are saying, what is on tonight and what Kolkata is searching.',
})

export default async function HomePage() {
  return (
    <>
      <HomeEntry />
      <HomeView />
    </>
  )
}
