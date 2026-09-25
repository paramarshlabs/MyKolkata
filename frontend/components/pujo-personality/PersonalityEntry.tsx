import Link from 'next/link'
import { ARCHETYPE_IDS } from '@/lib/pujo-personality/config'
import { Sigil } from './Sigil'
import styles from '@/styles/PujoPersonality.module.css'

/* The way in, from /home and /pujo (09-ux-flow.md §2). No hooks: it renders
   from Server and Client Components alike. */
export function PersonalityEntry() {
  return (
    <section className={`mk-band ${styles.entry}`} aria-labelledby="personality-entry">
      <div className={`mk-wrap ${styles.entryInner}`}>
        <div>
          <p className={styles.entryBn} lang="bn">তুমি কোন পুজো?</p>
          <h2 id="personality-entry" className="mk-h1">What kind of Pujo are you?</h2>
          <p className="mk-lede">
            Thirteen questions. Nine ways to do Pujo in this city. One of them is yours, with the routes,
            pandals and plates to match.
          </p>
          <div className="mk-banner-actions">
            <Link href="/pujo/personality" className="mk-btn mk-btn--primary">
              Discover my Pujo <span className="mk-btn-arrow" aria-hidden="true">→</span>
            </Link>
            <Link href="/pujo/archetypes" className="mk-btn mk-btn--text">Meet the nine</Link>
          </div>
        </div>
        <ul className={styles.entrySigils} aria-hidden="true">
          {ARCHETYPE_IDS.map((id) => <li key={id}><Sigil id={id} size={64} /></li>)}
        </ul>
      </div>
    </section>
  )
}
