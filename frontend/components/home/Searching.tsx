import type { Searching as SearchingFeed } from '@/lib/live/searching'
import { readPulse, type Trend } from '@/lib/live/trend'
import { PulseChart } from './PulseChart'
import { LiveHead } from './LiveHead'
import styles from '@/styles/Home.module.css'

const google = (query: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}`
const day = (d: string, month: 'short' | 'long' = 'short') => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month, timeZone: 'UTC' })

function times(ratio: number) {
  return `${ratio >= 10 ? Math.round(ratio) : Math.round(ratio * 10) / 10} times`
}

/*  The week's fastest-rising search, drawn: its last three months, so the
    point where the city started asking is visible. Whatever it is about —
    a pandal, a match, the rain — is what leads.                            */
function Pulse({ trend }: { trend: Trend }) {
  const reading = readPulse(trend)
  const span = reading.daily ? 'past week' : 'latest week'
  const summary = reading.ratio == null ? 'A month ago almost nobody in West Bengal was searching for it.'
    : reading.ratio >= 1.5 ? `Searched ${times(reading.ratio)} as much in the ${span} as in the four weeks before.`
    : reading.ratio >= 0.8 ? `Searched about as much in the ${span} as in the four weeks before.`
    : `Searched less in the ${span} than in the four weeks before.`
  const { points } = trend
  const peak = reading.peakIndex
  return (
    <div className={styles.pulseLead}>
      <p className={styles.pulseKicker}>Rising fastest</p>
      <p className={styles.pulseSummary}>
        <a href={google(trend.keyword)} target="_blank" rel="noopener noreferrer" className={styles.pulseQuery}>{trend.keyword}<span className="sr-only">, search Google, opens in a new tab</span></a>
      </p>
      <p className={styles.pulseLine}>{summary}</p>
      <PulseChart
        points={points}
        peakIndex={peak}
        daily={reading.daily}
        peakLabel={peak != null ? `${day(points[peak].d)}, ${points[peak].v}` : ''}
        nowLabel={`${day(reading.current.d)}, ${reading.current.v}`}
      />
      <p className="mk-meta" style={{ marginTop: 16 }}>
        {reading.daily ? 'Day by day' : 'Week by week'}, the past three months. 100 is its busiest {reading.daily ? 'day' : 'week'}.
      </p>
      {/* a table is never narrower than its text, so the one-pixel box around it does the hiding */}
      <div className="sr-only">
        <table>
          <caption>Search interest in {trend.keyword}, West Bengal, 0 to 100</caption>
          <thead><tr><th scope="col">{reading.daily ? 'Day' : 'Week of'}</th><th scope="col">Interest</th></tr></thead>
          <tbody>
            {points.map((point) => <tr key={point.d}><td>{day(point.d, 'long')}</td><td>{point.v}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/*  What the city is typing into Google this week: the fastest riser drawn
    as a line, beside the rest of the searches rising with "Kolkata" (a
    ranking, so numbered, counting on from the one drawn) and the derby as a
    split of the two clubs' searches. Identity is carried by the names,
    never by colour.                                                        */
export function Searching({ feed }: { feed: SearchingFeed | null }) {
  if (!feed || (!feed.rising.length && !feed.derby)) return null
  const { derby, pulse } = feed
  /* the pulse is the top riser; the list carries on from it */
  const drawn = pulse ? feed.rising.findIndex((item) => item.query === pulse.keyword) : -1
  const rising = drawn === 0 ? feed.rising.slice(1) : feed.rising
  const side = (rising.length > 0 || derby) && (
    <div className={pulse ? styles.searchSide : styles.searching}>
      {rising.length > 0 && (
        <ol className={styles.rising} start={drawn === 0 ? 2 : undefined} style={drawn === 0 ? { counterReset: 'rise 1' } : undefined}>
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
  )
  return (
    <section className={styles.live} aria-labelledby="searching-title">
      <div className="mk-wrap">
        <LiveHead
          id="searching-title"
          title="What Kolkata is searching"
          source="Rising in West Bengal this week alongside the word Kolkata, from Google Trends."
        />
        {pulse ? (
          <div className={styles.searching}>
            <Pulse trend={pulse} />
            {side}
          </div>
        ) : side}
      </div>
    </section>
  )
}
