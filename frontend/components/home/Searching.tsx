import type { Searching as SearchingFeed } from '@/lib/live/searching'
import { SectionHead } from '@/components/brand/SectionHead'
import styles from '@/styles/Home.module.css'

const google = (query: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}`

/*  What the city is typing into Google this week: the searches rising with
    "Kolkata" (a ranking, so numbered), and the derby as a split of the two
    clubs' searches. Identity is carried by the names, never by colour.     */
export function Searching({ feed }: { feed: SearchingFeed | null }) {
  if (!feed || (!feed.rising.length && !feed.derby)) return null
  const { rising, derby } = feed
  return (
    <section className="mk-band" aria-labelledby="searching-title" style={{ paddingTop: 0 }}>
      <div className="mk-wrap">
        <SectionHead id="searching-title" title="What Kolkata is searching" lede="Rising in West Bengal this week alongside the word Kolkata, from Google Trends." />
        <div className={styles.searching}>
          {rising.length > 0 && (
            <ol className={styles.rising}>
              {rising.map((item) => (
                <li key={item.query}>
                  <a href={google(item.query)} target="_blank" rel="noopener noreferrer" className={styles.risingItem}>
                    <span className={styles.risingQuery}>{item.query}</span>
                    {item.growth && <span className={styles.risingGrowth}>{item.growth}</span>}
                    <span className="sr-only">, search Google, opens in a new tab</span>
                  </a>
                </li>
              ))}
            </ol>
          )}
          {derby && (
            <figure className={styles.derby}>
              <figcaption className={styles.derbyTitle}>The derby, in searches this week</figcaption>
              <div className={styles.derbyNames}>
                <span>{derby.a.name}</span>
                <span>{derby.b.name}</span>
              </div>
              <div className={styles.derbyBar} role="img" aria-label={`${derby.a.name} ${derby.a.share}%, ${derby.b.name} ${derby.b.share}%`}>
                <span className={styles.derbyA} style={{ flexGrow: derby.a.share }} />
                <span className={styles.derbyB} style={{ flexGrow: derby.b.share }} />
              </div>
              <div className={styles.derbyShares} aria-hidden="true">
                <span className="mk-tabular">{derby.a.share}%</span>
                <span className="mk-tabular">{derby.b.share}%</span>
              </div>
              <p className="mk-meta">
                {derby.a.share === derby.b.share ? 'Dead level.'
                  : `${derby.a.share > derby.b.share ? derby.a.name : derby.b.name} ahead by ${Math.abs(derby.a.share - derby.b.share)} points.`}
              </p>
            </figure>
          )}
        </div>
      </div>
    </section>
  )
}
