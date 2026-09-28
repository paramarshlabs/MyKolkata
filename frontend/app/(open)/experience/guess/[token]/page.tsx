import Link from 'next/link'
import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'
import { GuessGame } from '@/components/pujo-personality/GuessGame'
import { decodeCard } from '@/lib/pujo-personality/token'

type Params = { params: Promise<{ token: string }> }

export const metadata: Metadata = {
  ...pageMetadata({ title: 'Guess my Pujo', description: 'Nine ways to do Pujo in Kolkata. Which one is mine?', ownImage: true }),
  robots: { index: false, follow: true },
}

export default async function GuessPage({ params }: Params) {
  const { token } = await params

  if (!decodeCard(token)) {
    return (
      <main className="mk-page mk-page-top">
        <div className="mk-wrap">
          <div className="mk-panel mk-empty">
            <h1 className="mk-h3">This link doesn&apos;t open a Pujo.</h1>
            <p className="mk-body">It may have been cut short when it was copied. Want to find yours instead?</p>
            <Link href="/experience/personality" className="mk-btn mk-btn--primary">Take the quiz <span className="mk-btn-arrow" aria-hidden="true">→</span></Link>
          </div>
        </div>
      </main>
    )
  }

  return <GuessGame token={token} />
}
