import Link from 'next/link'
import { ARCHETYPE_IDS } from '@/lib/pujo-personality/config'
import { CONTENT } from '@/lib/pujo-personality/content'
import type { ArchetypeId } from '@/lib/pujo-personality/types'
import { Sigil } from './Sigil'
import styles from '@/styles/PujoPersonality.module.css'

/* The nine, three by three. Each opens its public page. */
export function ArchetypeGrid({ highlight, className = '' }: { highlight?: ArchetypeId; className?: string }) {
  return (
    <ul className={`${styles.grid9} ${className}`}>
      {ARCHETYPE_IDS.map((id) => (
        <li key={id}>
          <Link href={`/pujo/archetypes/${id}`} className={styles.grid9Item} aria-current={highlight === id ? 'true' : undefined}>
            <Sigil id={id} size={56} />
            <span className={styles.grid9Text}>
              <span className={styles.grid9Name}>{CONTENT[id].name}</span>
              <span className={styles.grid9Bn} lang="bn">{CONTENT[id].bn}</span>
              <span className={styles.grid9Line}>{CONTENT[id].tagline}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
