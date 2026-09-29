import type { CuratedGram } from '@/lib/home/instagram_feed'
import { resolveStoryMedia } from '@/lib/stories/media'
import { LiveHead } from './LiveHead'
import { GramTile } from './GramTile'
import styles from '@/styles/Home.module.css'

type Gram = { url: string; title: string; embedUrl: string; reel: boolean }

/* the first `max` hand-picked links that are Instagram posts or reels, once each */
export function pickGrams(posts: CuratedGram[], max = 6) {
  const picked: Gram[] = []
  for (const post of posts) {
    const media = resolveStoryMedia(typeof post === 'string' ? post : post.url)
    if (picked.length >= max || media?.kind !== 'instagram' || picked.some((kept) => kept.embedUrl === media.embedUrl)) continue
    const title = typeof post === 'string' ? '' : post.title.trim()
    picked.push({ url: media.url, title, embedUrl: media.embedUrl, reel: media.embedUrl.includes('/reel/') })
  }
  return picked
}

/*  Kolkata on Instagram: posts and reels picked by hand
    (lib/home/instagram_feed.ts), as cards laid out like the YouTube row:
    Instagram's own embed cropped to its picture, the title under it. Three
    across on a wide screen, scrolling sideways past the third when there
    are more; a row to swipe on a phone. Renders nothing while the list is
    empty.                                                                  */
export function OnInstagram({ posts }: { posts: CuratedGram[] }) {
  const shown = pickGrams(posts)
  if (!shown.length) return null
  return (
    <section className={styles.live} aria-labelledby="instagram-title">
      <div className="mk-wrap">
        <LiveHead id="instagram-title" title="Kolkata on Instagram" source="Posts and reels from around the city, picked by hand." />
        <ul className={shown.length > 3 ? `${styles.videos} ${styles.gramRow}` : styles.videos}>
          {shown.map((post) => (
            <li key={post.url}><GramTile {...post} /></li>
          ))}
        </ul>
      </div>
    </section>
  )
}
