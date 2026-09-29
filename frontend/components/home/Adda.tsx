import type { ReactNode } from 'react'
import Link from 'next/link'
import { SUBREDDIT, type Adda as AddaFeed } from '@/lib/live/adda'
import { isBengali } from '@/lib/live/shape'
import { ago } from '@/lib/home/when'
import { LiveHead } from './LiveHead'
import styles from '@/styles/Home.module.css'

export type TodayStory = { id: string; title: string; createdAt: string }

/* a thread on Reddit or a story posted here, as one line of talk */
type Talk = { id: string; title: string; href: string; external: boolean; meta: string }

const lang = (text: string) => (isBengali(text) ? 'bn' : undefined)

function TalkLink({ talk, className, children }: { talk: Talk; className: string; children: ReactNode }) {
  return talk.external ? (
    <a href={talk.href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}<span className="sr-only">, on Reddit, opens in a new tab</span>
    </a>
  ) : (
    <Link href={talk.href} className={className}>{children}</Link>
  )
}

/*  What the paras are saying: the week's most upvoted thread on r/kolkata
    as the lead, then the stories people posted here today and the rest of
    the week's threads, in one list. Titles only, and every one leads out
    to where the talk is. Renders nothing when both are empty.              */
export function Adda({ feed, stories, now }: { feed: AddaFeed | null; stories: TodayStory[]; now: Date }) {
  const threads = feed?.threads ?? []
  if (!threads.length && !stories.length) return null
  const subreddit = feed?.subreddit ?? SUBREDDIT

  const fromReddit: Talk[] = threads.map((thread) => ({
    id: `r-${thread.id}`, title: thread.title, href: thread.url, external: true,
    meta: [thread.flair, thread.at ? ago(thread.at, now) : null].filter(Boolean).join(', ') || `r/${subreddit}`,
  }))
  const fromHere: Talk[] = stories.map((story) => ({
    id: `s-${story.id}`, title: story.title, href: '/community#stories-title', external: false,
    meta: `On My Kolkata, ${ago(story.createdAt, now).toLowerCase()}`,
  }))
  const [lead, ...others] = fromReddit.length ? fromReddit : fromHere
  const rest = fromReddit.length
    ? [...fromHere.slice(0, 2), ...others].slice(0, 6)
    : others.slice(0, 6)

  return (
    <section className={styles.live} aria-labelledby="adda-title">
      <div className="mk-wrap">
        <LiveHead
          id="adda-title"
          title="What the paras are saying"
          source={threads.length
            ? `The week's top threads on r/${subreddit}, and stories posted here today.`
            : 'Stories people posted here today.'}
          action={<Link href="/community#stories-title" className="mk-btn mk-btn--text">Post a story</Link>}
        />
        <div className={rest.length ? styles.adda : styles.addaSolo}>
          <TalkLink talk={lead} className={styles.addaLead}>
            <span className={styles.addaLeadKicker}>
              {fromReddit.length ? `Most upvoted on r/${subreddit} this week` : 'Posted on My Kolkata today'}
            </span>
            <span className={styles.addaLeadTitle} lang={lang(lead.title)}>{lead.title}</span>
            <span className={styles.addaLeadMeta}>{lead.meta}</span>
          </TalkLink>
          {rest.length > 0 && (
            <ul className={styles.addaList}>
              {rest.map((talk) => (
                <li key={talk.id}>
                  <TalkLink talk={talk} className={styles.addaItem}>
                    <span className={styles.addaTitle} lang={lang(talk.title)}>{talk.title}</span>
                    <span className={styles.addaMeta}>{talk.meta}</span>
                  </TalkLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
