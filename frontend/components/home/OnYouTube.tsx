import { rankVideos, viewsLabel, type YouTube } from '@/lib/live/youtube'
import { isBengali } from '@/lib/live/shape'
import { daysAgo } from '@/lib/home/when'
import { SectionHead } from '@/components/brand/SectionHead'
import styles from '@/styles/Home.module.css'

/*  What people put up about the city this week, most watched first. The
    thumbnails come straight from YouTube's image host; every card opens the
    video on YouTube. Renders nothing without the feed.                     */
export function OnYouTube({ feed, now }: { feed: YouTube | null; now: Date }) {
  /* a stored week can age: nothing older than eight days, whatever was fetched */
  const videos = rankVideos((feed?.videos ?? []).filter((video) => now.getTime() - Date.parse(video.at) < 8 * 86_400_000))
  if (!videos.length) return null
  return (
    <section className="mk-band" aria-labelledby="youtube-title" style={{ paddingTop: 0 }}>
      <div className="mk-wrap">
        <SectionHead id="youtube-title" title="Kolkata on YouTube this week" lede="The most watched uploads about the city from the past seven days." />
        <ul className={styles.videos}>
          {videos.map((video) => (
            <li key={video.id}>
              <a className={styles.video} href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">
                <span className={styles.videoThumb}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                  {video.duration && <span className={styles.videoLength}>{video.duration}</span>}
                </span>
                <span className={styles.videoTitle} lang={isBengali(video.title) ? 'bn' : undefined}>{video.title}</span>
                <span className={styles.videoMeta}>
                  {[video.channel, viewsLabel(video.views), daysAgo(video.at, now)].filter(Boolean).join(', ')}
                </span>
                <span className="sr-only">, on YouTube, opens in a new tab</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
