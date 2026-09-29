import Link from 'next/link'
import { ARCHETYPES } from '@/lib/pujo-personality/config'
import { PersonalityCta } from './PersonalityCta'
import { Sigil } from './Sigil'
import styles from '@/styles/PujoPersonality.module.css'

/* The way in, from /home (09-ux-flow.md §2). A Bordeaux band — the warm surface
   the rest of the page never uses — with the nine laid out as one run, each
   leading to its own page. No hooks: it renders from Server Components too. */
export function PersonalityEntry() {
  return (
    <section className={`mk-band--deep ${styles.entry}`} aria-labelledby="personality-entry">
      <div className="mk-wrap">
        <div className={styles.entryHead}>
          <div>
            <p className={styles.entryBn} lang="bn">তুমি কোন পুজো?</p>
            <h2 id="personality-entry" className="mk-h1">What kind of Pujo are you?</h2>
          </div>
          <div className={styles.entryAside}>
            <p className="mk-body-lg">
              Thirteen questions. Nine ways to do Pujo in this city. One of them is yours, with the routes,
              pandals and plates to match.
            </p>
            <div className="mk-banner-actions">
              <PersonalityCta />
            </div>
          </div>
        </div>
        <ul className={styles.entryNine} aria-label="The nine">
          {ARCHETYPES.map((archetype) => (
            <li key={archetype.id}>
              <Link href={`/experience/archetypes/${archetype.id}`} className={styles.entryItem}>
                <Sigil id={archetype.id} size={56} />
                <span className={styles.entryItemBn} lang="bn">{archetype.bn}</span>
                <span className={styles.entryItemName}>{archetype.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
