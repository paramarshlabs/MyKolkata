import Link from 'next/link'
import type { Adda as AddaFeed } from '@/lib/live/adda'
import { isBengali } from '@/lib/live/shape'
import { ago } from '@/lib/home/when'
import { SectionHead } from '@/components/brand/SectionHead'
import styles from '@/styles/Home.module.css'

export type TodayStory = { id: string; title: string; createdAt: string }

const lang = (text: string) => (isBengali(text) ? 'bn' : undefined)

/*  What the paras are saying: the week's top threads on r/kolkata beside
    the stories people posted here today. Titles only, and every one leads
    out to where the talk is. Renders nothing when both are empty.          */
export function Adda({ feed, stories, now }: { feed: AddaFeed | null; stories: TodayStory[]; now: Date }) {
  const threads = feed?.threads ?? []
  if (!threads.length && !stories.length) return null

  const ours = (
    <div className={styles.addaCol}>
      <h3 className={styles.addaHead}>On My Kolkata today</h3>
      {stories.length ? (
        <ul className={styles.addaList}>
          {stories.map((story) => (
            <li key={story.id}>
              <Link href="/community#stories-title" className={styles.addaItem}>
                <span className={styles.addaTitle} lang={lang(story.title)}>{story.title}</span>
                <span className={styles.addaMeta}>{ago(story.createdAt, now)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mk-caption">Nothing posted here today. Stories stay up for a day.</p>
      )}
      <Link href="/community#stories-title" className="mk-btn mk-btn--text" style={{ marginTop: 16 }}>Post a story</Link>
    </div>
  )

  return (
    <section className="mk-band" aria-labelledby="adda-title" style={{ paddingTop: 0 }}>
      <div className="mk-wrap">
        <SectionHead
          id="adda-title"
          title="What the paras are saying"
          lede={threads.length
            ? `The most upvoted threads on r/${feed!.subreddit} this week, and the stories people posted here today.`
            : 'The stories people posted here today.'}
        />
        <div className={threads.length ? styles.adda : undefined}>
          {threads.length > 0 && (
            <div className={styles.addaCol}>
              <h3 className={styles.addaHead}>On r/{feed!.subreddit} this week</h3>
              <ul className={styles.addaList}>
                {threads.map((thread) => (
                  <li key={thread.id}>
                    <a href={thread.url} target="_blank" rel="noopener noreferrer" className={styles.addaItem}>
                      <span className={styles.addaTitle} lang={lang(thread.title)}>{thread.title}</span>
                      <span className={styles.addaMeta}>
                        {[thread.flair, thread.at ? ago(thread.at, now) : null].filter(Boolean).join(', ') || 'Reddit'}
                      </span>
                      <span className="sr-only">, on Reddit, opens in a new tab</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {ours}
        </div>
      </div>
    </section>
  )
}
