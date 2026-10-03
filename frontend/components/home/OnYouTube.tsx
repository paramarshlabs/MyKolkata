import { rankVideos, viewsLabel, type YouTube } from '@/lib/live/youtube'
import { isBengali } from '@/lib/live/shape'
import { daysAgo } from '@/lib/home/when'
import { CardImage } from '@/components/brand/CardImage'
import { LiveHead, fullRows } from './LiveHead'
import styles from '@/styles/Home.module.css'

/*  What people put up about the city this week, most watched first. The
    thumbnails come from YouTube's image host through our optimizer; every card opens the
    video on YouTube. Whole rows of three on a wide screen, a row to swipe on
    a phone. Renders nothing without the feed.                              */
export function OnYouTube({ feed, now }: { feed: YouTube | null; now: Date }) {
  /* a stored week can age: nothing older than eight days, whatever was fetched */
  const videos = rankVideos((feed?.videos ?? []).filter((video) => now.getTime() - Date.parse(video.at) < 8 * 86_400_000))
  if (!videos.length) return null
  const shown = fullRows(videos.length)
  return (
    <section className={styles.live} aria-labelledby="youtube-title">
      <div className="mk-wrap">
        <LiveHead
          id="youtube-title"
          title="Kolkata on YouTube this week"
          source="The most watched uploads about the city from the past seven days."
        />
        <ul className={styles.videos}>
          {videos.map((video, i) => (
            <li key={video.id} data-extra={i >= shown || undefined}>
              <a className={styles.video} href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">
                <span className={styles.videoThumb}>
                  <CardImage src={`https://i.ytimg.com/vi/${encodeURIComponent(video.id)}/mqdefault.jpg`} sizes="(max-width: 640px) 70vw, 320px" referrerPolicy="no-referrer" />
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
