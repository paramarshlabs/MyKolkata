import type { ReactNode } from 'react'
import styles from '@/styles/Home.module.css'

/*  The head of a live section: the title a size down from the page's
    chapters (news, the market) and one line saying where the data comes
    from. No sprig: six of them down the page is wallpaper.                 */
export function LiveHead({ id, title, source, action }: {
  id: string
  title: string
  source: ReactNode
  action?: ReactNode
}) {
  return (
    <header className={styles.liveHead}>
      <div className={styles.liveHeadText}>
        <h2 id={id} className="mk-h2">{title}</h2>
        <p className={styles.liveSource}>{source}</p>
      </div>
      {action}
    </header>
  )
}

/* how many of `count` cards fill whole rows of a `columns`-wide grid, so a
   wide screen never ends on one orphan; narrow screens scroll through all */
export const fullRows = (count: number, columns = 3) => (count <= columns ? count : count - (count % columns))
