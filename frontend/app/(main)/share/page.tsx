import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { mapHref } from '@/lib/livePlaces'
import { createRateLimiter } from '@/lib/rateLimit'
import { findInstagramPost } from '@/lib/share/instagram'
import { resolveSharedPost } from '@/lib/share/server'
import { pageMetadata } from '@/lib/site/site'

/* ==========================================================================
   Where a shared Instagram post lands: Android's share sheet (the manifest's
   share_target sends ?url=&text=&title=), or a link pasted into the Explore
   search. Straight on to the place it's about, on the Explore map or the
   Pujo map; when there's no telling, the names it mentions, to search.
   ========================================================================== */

export const metadata: Metadata = pageMetadata({
  title: 'Shared post',
  description: 'Open the place an Instagram post is about.',
  noindex: true,
})

/* each lookup can reach Instagram and the places provider */
const lookups = createRateLimiter({ limit: 20, windowMs: 60_000 })

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? null

export default async function SharePage({ searchParams }: Props) {
  const userId = await requireUser('/share')
  const params = await searchParams
  const text = one(params.text)
  const title = one(params.title)
  const post = findInstagramPost(one(params.url), text, title)

  const result = post && lookups(userId).ok ? await resolveSharedPost(post, { text, title }) : null
  if (result && result.kind !== 'none') redirect(result.href)

  const guesses = result?.kind === 'none' ? result.guesses : []
  return (
    <main className="mk-page mk-page-top">
      <div className="mk-wrap">
        <h1 className="mk-display">{post ? 'We couldn’t place this post.' : 'That isn’t an Instagram post.'}</h1>
        <p className="mk-lede">
          {post
            ? guesses.length
              ? 'It mentions these. Pick one to find it on the map.'
              : 'Its caption doesn’t name a place we know. Search for it instead.'
            : 'Share a post or a reel from Instagram, or paste its link into Explore.'}
        </p>
        {guesses.length > 0 && (
          <div className="mk-chips" role="group" aria-label="Places the post mentions" style={{ marginTop: 16 }}>
            {guesses.map((guess) => (
              <Link key={guess} className="mk-chip" href={mapHref({ query: guess })}>{guess}</Link>
            ))}
          </div>
        )}
        <div className="mk-banner-actions">
          <Link href="/places" className="mk-btn mk-btn--primary">
            Search Explore <span className="mk-btn-arrow" aria-hidden="true">→</span>
          </Link>
          {post && (
            <a href={post.url} className="mk-btn mk-btn--text" target="_blank" rel="noopener noreferrer">Open on Instagram</a>
          )}
        </div>
      </div>
    </main>
  )
}
