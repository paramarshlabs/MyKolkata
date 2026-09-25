import Link from 'next/link'
import { CONTENT, KIND_LABELS, pairCopy } from '@/lib/pujo-personality/content'
import { pujoSync, SYNC_COMPONENTS, type SyncComponent } from '@/lib/pujo-personality/sync'
import type { ShareCard } from '@/lib/pujo-personality/token'
import { Sigil } from './Sigil'
import styles from '@/styles/PujoPersonality.module.css'

type CompareProps = {
  you: Pick<ShareCard, 'primary' | 'vector'>
  them: Pick<ShareCard, 'primary' | 'vector'>
  themLabel?: string
}

/* Two Pujos side by side (07-pujo-match.md §3.4). Pujo Sync measures how much
   of one Pujo night both people would enjoy, and says so: nothing more. */
export function Compare({ you, them, themLabel = 'Your friend' }: CompareProps) {
  const sync = pujoSync(you, them)
  const pair = pairCopy(you.primary, them.primary)
  const percent = Math.round(sync.match * 100)

  return (
    <div className={styles.compare}>
      <div className={styles.compareFaces}>
        {([['You', you.primary], [themLabel, them.primary]] as const).map(([who, id]) => (
          <Link key={who} href={`/pujo/archetypes/${id}`} className={styles.compareFace}>
            <Sigil id={id} size={64} />
            <span className={styles.compareWho}>{who}</span>
            <span className={styles.compareName}>{CONTENT[id].name}</span>
            <span className={styles.compareBn} lang="bn">{CONTENT[id].bn}</span>
          </Link>
        ))}
      </div>

      <p className={styles.compareKind}>{KIND_LABELS[pair.kind]}</p>
      <h3 className="mk-h2">{pair.headline}</h3>
      <p className="mk-body-lg" style={{ marginTop: 12 }}>{pair.line}</p>

      <div className={styles.sync}>
        <p className={styles.syncScore}>
          <span className={styles.syncNumber}>{percent}%</span>
          <span className={styles.syncLabel}>Pujo Sync</span>
        </p>
        <p className="mk-caption">How much of one Pujo night you would both enjoy. A plan match, not chemistry.</p>
        <dl className={styles.syncRows}>
          {(Object.keys(SYNC_COMPONENTS) as SyncComponent[]).map((key) => (
            <div key={key} className={styles.syncRow}>
              <dt>{SYNC_COMPONENTS[key].label}</dt>
              <dd>
                <span className={styles.syncBar} aria-hidden="true">
                  <span style={{ width: `${Math.round(sync.components[key] * 100)}%` }} />
                </span>
                <span>{sync.words[key]}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <p className={styles.comparePlan}><span className={styles.kicker}>Try this</span>{pair.plan}.</p>
    </div>
  )
}
