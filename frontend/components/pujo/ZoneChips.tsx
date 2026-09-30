'use client'

import { ZONES, type ZoneId } from '@/lib/pujo/sectors'
import styles from '@/styles/PujoExplore.module.css'

/* All, then the sides of the city that have something to show. Zones are
   told apart by filtering, never by colour. */
export function ZoneChips({
  zones, value, onChange, label, className = '',
}: {
  zones: readonly ZoneId[]
  value: ZoneId | null
  onChange: (zone: ZoneId | null) => void
  label: string
  className?: string
}) {
  return (
    <div className={`mk-chips ${styles.chipRow} ${className}`} role="group" aria-label={label}>
      <button type="button" className="mk-chip" aria-pressed={value === null} onClick={() => onChange(null)}>All</button>
      {ZONES.filter((zone) => zones.includes(zone.id)).map((zone) => (
        <button key={zone.id} type="button" className="mk-chip" aria-pressed={value === zone.id} onClick={() => onChange(value === zone.id ? null : zone.id)}>
          {zone.label}
        </button>
      ))}
    </div>
  )
}
