import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'
import { requireUser } from '@/lib/auth'
import ChatClient from './ChatClient'

export const metadata: Metadata = pageMetadata({
  title: 'Your Ashtami chat',
  description: 'A short chat with a match from Find your Ashtami date. Messages go 24 hours after they are sent.',
  noindex: true,
})

type Params = { params: Promise<{ id: string }> }

/* the chat itself is fetched by the browser, and only for the two people in the match */
export default async function ChatPage({ params }: Params) {
  await requireUser()
  const { id } = await params
  return <ChatClient matchId={id} />
}
