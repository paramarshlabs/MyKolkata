'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { SectionHead } from '@/components/brand/SectionHead'
import { PujoRow } from '@/components/pujo/bits'
import { usePujo } from '@/components/pujo/PujoProvider'
import { ZoneChips } from '@/components/pujo/ZoneChips'
import type { ClientPujo } from '@/lib/pujo/client'
import { metroLine } from '@/lib/pujo/format'
import { ZONES, type ZoneId } from '@/lib/pujo/sectors'
import styles from '@/styles/PujoExplore.module.css'

/* ==========================================================================
   The para pujos: the neighbourhood ones, grouped under the areas people
   would name. Each area shows its first five, and the rest on request.
   ========================================================================== */

const FIRST = 5

type Group = { id: string; title: string; zone: ZoneId; pujos: ClientPujo[] }

export function ParaByArea({ action }: { action?: (pujo: ClientPujo) => ReactNode }) {
  const { index, open, station } = usePujo()
  const [zone, setZone] = useState<ZoneId | null>(null)
  const [opened, setOpened] = useState<Set<string>>(() => new Set())

  const groups = useMemo(() => {
    const para = index.pujos.filter((p) => !p.famous)
    const byArea: Group[] = index.areas
      .map((a) => ({ id: a.id, title: a.name, zone: a.zone, pujos: para.filter((p) => p.area === a.id) }))
      .filter((g) => g.pujos.length)
    /* the ones no area claims, per side of the city */
    const elsewhere: Group[] = ZONES
      .map((z) => ({ id: `elsewhere-${z.id}`, title: z.id === 'suburbs' ? 'Elsewhere in the suburbs' : `Elsewhere in ${z.long}`, zone: z.id, pujos: para.filter((p) => !p.area && p.zone === z.id) }))
      .filter((g) => g.pujos.length)
    const order = (g: Group) => ZONES.findIndex((z) => z.id === g.zone)
    return [...byArea, ...elsewhere].sort((a, b) => order(a) - order(b))
  }, [index])

  const total = groups.reduce((sum, g) => sum + g.pujos.length, 0)
  const zones = [...new Set(groups.map((g) => g.zone))]
  const shown = zone ? groups.filter((g) => g.zone === zone) : groups

  return (
    <section className="mk-band" aria-labelledby="para-title">
      <div className="mk-wrap">
        <SectionHead
          id="para-title"
          title="Para pujos, by area"
          lede={`The ${total} neighbourhood pujos, under the names of their paras. Most are a short walk from a famous one.`}
        />
        <ZoneChips zones={zones} value={zone} onChange={setZone} label="Para pujos by side of the city" className={styles.sectionChips} />
        <div className={styles.areaGrid}>
          {shown.map((group) => {
            const open_ = opened.has(group.id)
            const rows = open_ ? group.pujos : group.pujos.slice(0, FIRST)
            const headingId = `area-${group.id}`
            return (
              <section key={group.id} className={styles.areaGroup} aria-labelledby={headingId}>
                <h3 id={headingId} className={styles.areaTitle}>
                  {group.title}
                  <span className={styles.areaCount}>{group.pujos.length}</span>
                </h3>
                <ol className={styles.rows}>
                  {rows.map((pujo) => (
                    <PujoRow
                      key={pujo.slug}
                      name={pujo.name}
                      onOpen={() => open(pujo.slug)}
                      meta={metroLine(pujo.metro, station(pujo.metro?.id)) ?? (pujo.lat === null ? 'No map location yet' : 'No Metro within a walk')}
                      action={action?.(pujo)}
                    />
                  ))}
                </ol>
                {group.pujos.length > FIRST && (
                  <button
                    type="button"
                    className={`mk-btn mk-btn--text ${styles.more}`}
                    aria-expanded={open_}
                    onClick={() => setOpened((current) => {
                      const next = new Set(current)
                      if (next.has(group.id)) next.delete(group.id)
                      else next.add(group.id)
                      return next
                    })}
                  >
                    {open_ ? 'Show fewer' : `Show all ${group.pujos.length}`}
                  </button>
                )}
              </section>
            )
          })}
        </div>
      </div>
    </section>
  )
}
