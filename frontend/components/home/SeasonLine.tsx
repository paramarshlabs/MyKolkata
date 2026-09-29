import type { CSSProperties } from 'react'
import { seasonLine } from '@/lib/home/season'
import styles from '@/styles/Home.module.css'

/*  The season line at the foot of the hero: the build-up, Mahalaya and the
    five days, with today marked. Drawn from the calendar on the server; it
    renders nothing outside the season.                                     */
export function SeasonLine({ now }: { now?: Date }) {
  const line = seasonLine(now)
  if (!line) return null

  return (
    <div className={styles.season} style={{ '--today': line.todayAt } as CSSProperties}>
      <p className={styles.seasonNow}>
        <span className={styles.seasonDate}>{line.todayLabel}</span>
        <span className={styles.seasonStatus}>{line.status}</span>
      </p>
      <div className={styles.seasonTrack} aria-hidden="true">
        <span className={styles.seasonDone} />
        <span className={styles.seasonMarker} />
      </div>
      <ol className={styles.seasonNodes} aria-label="The Pujo season">
        {line.nodes.map((node) => (
          <li
            key={node.key}
            className={`${styles.seasonNode} ${node.past ? styles.isPast : ''} ${node.today ? styles.isToday : ''}`}
            data-node={node.key}
            style={{ '--at': node.at } as CSSProperties}
          >
            <span className={styles.seasonDot} aria-hidden="true" />
            <span className={styles.seasonBn} lang="bn">{node.bn}</span>
            <span className={styles.seasonDay}>
              <span className="sr-only">{node.en}, </span>{node.date}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
