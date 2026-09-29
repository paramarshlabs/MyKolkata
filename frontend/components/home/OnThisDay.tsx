import { kolkataMonthDay, type MomentKind, type OnThisDay as OnThisDayFeed } from '@/lib/live/onthisday'
import { SectionHead } from '@/components/brand/SectionHead'
import styles from '@/styles/Home.module.css'

const KIND: Record<MomentKind, string | null> = { event: null, birth: 'Born', death: 'Died', holiday: 'Observed' }

/*  The day's anniversaries that are the city's or Bengal's, from Wikipedia.
    Shown only on the day they are for; most days have one or none.         */
export function OnThisDay({ feed, now }: { feed: OnThisDayFeed | null; now: Date }) {
  if (!feed?.moments.length || feed.day !== kolkataMonthDay(now)) return null
  const today = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' })
  return (
    <section className="mk-band" aria-labelledby="onthisday-title" style={{ paddingTop: 0 }}>
      <div className="mk-wrap">
        <SectionHead id="onthisday-title" title="On this day" lede={`${today}, in Kolkata and Bengal, from Wikipedia.`} />
        <ol className={styles.moments}>
          {feed.moments.map((moment) => {
            const body = (
              <>
                <span className={styles.momentYear}>{moment.year ?? 'Every year'}</span>
                <span className={styles.momentText}>
                  {KIND[moment.kind] && <span className={styles.momentKind}>{KIND[moment.kind]}. </span>}
                  {moment.text}
                </span>
              </>
            )
            return (
              <li key={`${moment.year}-${moment.text}`}>
                {moment.url ? (
                  <a className={styles.moment} href={moment.url} target="_blank" rel="noopener noreferrer">
                    {body}<span className="sr-only">, on Wikipedia, opens in a new tab</span>
                  </a>
                ) : <div className={styles.moment}>{body}</div>}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
