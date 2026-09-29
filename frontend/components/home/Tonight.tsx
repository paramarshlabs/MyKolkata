import { upcoming, type Show, type Tonight as TonightFeed } from '@/lib/live/tonight'
import { showWhen } from '@/lib/home/when'
import { SectionHead } from '@/components/brand/SectionHead'
import { CityIcon } from '@/components/brand/icons'
import styles from '@/styles/Home.module.css'

function Stub({ show, now }: { show: Show; now: Date }) {
  const body = (
    <>
      <span className={styles.stubPoster}>
        {show.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={show.image} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        ) : (
          <CityIcon name="lamp" size={32} />
        )}
      </span>
      <span className={styles.stubBody}>
        <span className={styles.stubSource}>{show.source}{show.kind ? `, ${show.kind}` : ''}</span>
        <span className={styles.stubTitle}>{show.title}</span>
        {show.venue && <span className={styles.stubVenue}>{show.venue}</span>}
        <span className={styles.stubWhen}>{showWhen(show.when, now)}</span>
      </span>
    </>
  )
  return show.url ? (
    <a className={styles.stub} href={show.url} target="_blank" rel="noopener noreferrer">
      {body}<span className="sr-only">, on {show.source}, opens in a new tab</span>
    </a>
  ) : (
    <div className={styles.stub}>{body}</div>
  )
}

/*  What is on tonight and this week: films, gigs and meetups as paper ticket
    stubs — the one Pearl object on a dark page, the way a ticket is the one
    bright thing in a pocket. Renders nothing until the feed has something.  */
export function Tonight({ feed, now }: { feed: TonightFeed | null; now: Date }) {
  const shows = feed ? upcoming(feed.shows, now).slice(0, 6) : []
  if (!shows.length) return null
  const sources = [...new Set(shows.map((show) => show.source))]
  return (
    <section className="mk-band" aria-labelledby="tonight-title" style={{ paddingTop: 0 }}>
      <div className="mk-wrap">
        <SectionHead
          id="tonight-title"
          title="Tonight in the city"
          lede={`Films, gigs and meetups on in Kolkata this week, from ${sources.join(sources.length > 2 ? ', ' : ' and ').replace(/, ([^,]*)$/, ' and $1')}.`}
        />
        <ul className={styles.stubs}>
          {shows.map((show) => <li key={`${show.source}-${show.title}`}><Stub show={show} now={now} /></li>)}
        </ul>
      </div>
    </section>
  )
}
