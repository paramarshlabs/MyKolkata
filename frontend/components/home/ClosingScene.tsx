import Link from 'next/link'
import { KaashPhoolScene } from '@/components/brand/KaashPhool'
import styles from '@/styles/Home.module.css'

/*  The last shot: the drawn kaash-phool field from /pujo, with the closing
    statement over it (design.md §12). Bengali leads, because what the city
    is saying this month is Bengali.                                        */
export function ClosingScene() {
  return (
    <section className={styles.closing} aria-labelledby="closing-title">
      <KaashPhoolScene />
      <div className={styles.closingScrim} aria-hidden="true" />
      <div className={styles.closingCopy}>
        <p className={styles.closingBn} lang="bn">পুজো আসছে।</p>
        <h2 id="closing-title" className={styles.closingTitle}>Same city. New stories.</h2>
        <div className="mk-banner-actions">
          <Link href="/pujo" className="mk-btn mk-btn--primary">
            Explore the Pujo <span className="mk-btn-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
