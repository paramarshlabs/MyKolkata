import type { ReactNode } from 'react'
import { DAYPARTS, daypartHours, type DaypartId } from '@/lib/home/day'
import styles from '@/styles/Home.module.css'

/*  One part of the city's day. The Bengali word is the chapter title — it is
    what people call this hour, not a translation of the English under it —
    and the part it is now says so in Taxi Yellow. Each part has its own
    ground, and the grounds run into one another from morning to night.     */
export function Daypart({ id, now, clock, children }: { id: DaypartId; now: boolean; clock: string; children: ReactNode }) {
  const part = DAYPARTS.find((p) => p.id === id)!
  return (
    <section id={id} className={`${styles.daypart} ${styles[`dp_${id}`]}`} aria-labelledby={`${id}-title`} data-now={now || undefined}>
      <div className="mk-wrap">
        <header className={styles.dpHead}>
          <h2 id={`${id}-title`} className={styles.dpTitle}>
            <span className={styles.dpBn} lang="bn">{part.bn}</span>
            <span className={styles.dpEn}>{part.en}</span>
          </h2>
          <div className={styles.dpAside}>
            <p className={styles.dpHours}>
              {daypartHours(part)}
              {now && <span className={styles.dpNow}>Now, {clock}</span>}
            </p>
            <p className={styles.dpLine}>{part.line}</p>
          </div>
        </header>
      </div>
      {children}
    </section>
  )
}

/* A block inside a part of the day, on the page's usual measure. */
export function DaySection({ children, id, wide = false }: { children: ReactNode; id?: string; wide?: boolean }) {
  return (
    <div className={styles.dpSection} id={id}>
      {wide ? children : <div className="mk-wrap">{children}</div>}
    </div>
  )
}
