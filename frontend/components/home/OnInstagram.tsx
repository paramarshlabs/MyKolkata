import type { Instagram } from '@/lib/live/instagram'
import { SectionHead } from '@/components/brand/SectionHead'
import { StoryMedia } from '@/app/(main)/community/StoryMedia'
import styles from '@/styles/Home.module.css'

/* an Instagram post someone linked from a story posted here today */
export type SharedGram = { url: string; title: string }

/*  Kolkata on Instagram, shown the way Instagram allows: its own embeds of
    posts people linked from their stories here, then the top posts under
    #kolkata when the Graph API is set up. Nothing is copied or scraped.
    Renders nothing when there is neither.                                  */
export function OnInstagram({ feed, shared }: { feed: Instagram | null; shared: SharedGram[] }) {
  const posts: SharedGram[] = []
  const candidates = [
    ...shared,
    ...(feed?.posts ?? []).map((post) => ({ url: post.permalink, title: post.caption ?? `A post under #${feed!.hashtag}` })),
  ]
  for (const post of candidates) {
    if (posts.length < 3 && !posts.some((kept) => kept.url === post.url)) posts.push(post)
  }
  if (!posts.length) return null

  const lede = feed?.posts.length
    ? `Top posts under #${feed.hashtag}${shared.length ? ', and posts people shared in their stories here today' : ''}.`
    : 'Posts people shared in their stories here today.'
  return (
    <section className="mk-band" aria-labelledby="instagram-title" style={{ paddingTop: 0 }}>
      <div className="mk-wrap">
        <SectionHead id="instagram-title" title="Kolkata on Instagram" lede={lede} />
        <ul className={styles.grams}>
          {posts.map((post) => (
            <li key={post.url}><StoryMedia url={post.url} title={post.title} /></li>
          ))}
        </ul>
      </div>
    </section>
  )
}
