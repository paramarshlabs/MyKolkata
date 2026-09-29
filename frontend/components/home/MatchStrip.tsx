import { matchesNow, type Cricket, type Side } from '@/lib/live/cricket'
import { showWhen } from '@/lib/home/when'
import styles from '@/styles/Home.module.css'

function Team({ side }: { side: Side }) {
  return (
    <span className={styles.matchTeam}>
      {side.name}
      {side.score && <span className={styles.matchScore}> {side.score}{side.overs ? ` (${side.overs})` : ''}</span>}
    </span>
  )
}

/*  One line under the hero while one of ours is playing or about to: India,
    Bengal or the Knight Riders. Renders nothing the rest of the time.      */
export function MatchStrip({ feed, fetchedAt, now }: { feed: Cricket | null; fetchedAt: string | null; now: Date }) {
  const matches = matchesNow(feed, fetchedAt, now)
  if (!matches.length) return null
  return (
    <section className={styles.match} aria-label="Cricket">
      <div className="mk-wrap">
        <ul className={styles.matchList}>
          {matches.map((match) => (
            <li key={match.id}>
              <a className={styles.matchRow} href={match.url} target="_blank" rel="noopener noreferrer">
                <span className={styles.matchWhen}>{match.state === 'live' ? 'Live' : showWhen(match.start, now)}</span>
                <span className={styles.matchTeams}>
                  <Team side={match.teams[0]} />
                  <span className={styles.matchV}> v </span>
                  <Team side={match.teams[1]} />
                </span>
                <span className={styles.matchStatus}>
                  {[
                    match.state === 'live' ? match.status : null,
                    [match.title, match.series].filter(Boolean).join(', '),
                  ].filter(Boolean).join('. ')}
                </span>
                <span className="sr-only">, on ESPNcricinfo, opens in a new tab</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
