'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { SectionHead } from '@/components/brand/SectionHead'
import { usePujo } from '@/components/pujo/PujoProvider'
import { ZoneChips } from '@/components/pujo/ZoneChips'
import type { ClientPujo } from '@/lib/pujo/client'
import { metroLine, tierText } from '@/lib/pujo/format'
import type { ZoneId } from '@/lib/pujo/sectors'
import styles from '@/styles/PujoExplore.module.css'

/* ==========================================================================
   The famous ones: featured by the data, or ranked at the Red Road carnival.
   Arch-topped cards, the chalchitra's silhouette (docs/DESIGN.md §6), on a
   rail on a phone and in a grid on a desktop. No photographs yet: the
   scraped gallery belongs to other people.
   ========================================================================== */

export function FamousPujos({ action }: { action?: (pujo: ClientPujo) => ReactNode }) {
  const { index, open, area, station } = usePujo()
  const [zone, setZone] = useState<ZoneId | null>(null)
  const famous = useMemo(
    /* carnival ranks first, in order, then the rest by name */
    () => index.pujos.filter((p) => p.famous).sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99) || a.name.localeCompare(b.name)),
    [index],
  )
  const zones = useMemo(() => [...new Set(famous.map((p) => p.zone))], [famous])
  const shown = zone ? famous.filter((p) => p.zone === zone) : famous

  return (
    <section className="mk-band" aria-labelledby="famous-title">
      <div className="mk-wrap">
        <SectionHead
          id="famous-title"
          title="The famous ones"
          lede={`The ${famous.length} pujos the city queues for: the Red Road carnival's ranked eight, and the ones everyone names.`}
        />
        <ZoneChips zones={zones} value={zone} onChange={setZone} label="Famous pujos by side of the city" className={styles.sectionChips} />
        <ul className={styles.famousGrid} aria-label="Famous pujos">
          {shown.map((pujo) => {
            const walk = metroLine(pujo.metro, station(pujo.metro?.id))
            return (
              <li key={pujo.slug} className={styles.famousCard}>
                <p className={styles.famousTier}>{tierText(pujo)}</p>
                <h3 className={styles.famousName}>
                  <button type="button" className={styles.famousOpen} onClick={() => open(pujo.slug)}>{pujo.name}</button>
                </h3>
                <p className={styles.famousWhere}>{area(pujo.area)?.name ?? pujo.place ?? 'Kolkata'}</p>
                {walk && <p className={styles.famousMetro}>{walk}</p>}
                {action && <div className={styles.famousActions}>{action(pujo)}</div>}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
