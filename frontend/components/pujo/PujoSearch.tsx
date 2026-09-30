'use client'

import { useDeferredValue, useId, useMemo, useState, type ReactNode } from 'react'
import { UiIcon } from '@/components/brand/icons'
import { PujoRow } from '@/components/pujo/bits'
import { usePujo } from '@/components/pujo/PujoProvider'
import type { ClientPujo } from '@/lib/pujo/client'
import { count, distanceText, tierText, whereLine } from '@/lib/pujo/format'
import { formatKm, WALK_FACTOR, type LatLng } from '@/lib/pujo/geo'
import { noMatch, search, type SearchableFood } from '@/lib/pujo/search'
import styles from '@/styles/PujoExplore.module.css'

/* ==========================================================================
   One search, everywhere: /pujo, the "Add pujos" sheet and the nearby lists.
   It runs on the phone over every pujo, so it's instant on one bar of signal.
   ========================================================================== */

const SHOWN = 8

type Props = {
  /* straight-line km from wherever results are measured, and from what */
  distance?: (point: LatLng) => number | null
  from?: 'you' | 'route' | null
  /* Add, inside a group */
  action?: (pujo: ClientPujo) => ReactNode
  /* a food pick picked from the results */
  foodAction?: (spot: SearchableFood) => ReactNode
  autoFocus?: boolean
  label?: string
  placeholder?: string
  /* the query's owner, when the parent needs it (e.g. to hide shortcuts while typing) */
  onQueryChange?: (query: string) => void
  /* a few things to try, shown until something is typed */
  suggestions?: string[]
}

export function PujoSearch({
  distance, from = null, action, foodAction, autoFocus = false, onQueryChange, suggestions = [],
  label = 'Search the pujos',
  placeholder = 'A para, a pujo, a Metro station: Bagbazar, Behala, Shyambazar metro',
}: Props) {
  const { searchIndex, open, area } = usePujo()
  const [query, setQuery] = useState('')
  const [all, setAll] = useState(false)
  const deferred = useDeferredValue(query)
  const id = useId()
  const result = useMemo(() => search(searchIndex, deferred, { distance }), [searchIndex, deferred, distance])
  const searching = deferred.trim() !== ''
  const shown = all ? result.pujos : result.pujos.slice(0, SHOWN)

  const setBoth = (value: string) => {
    setQuery(value)
    setAll(false)
    onQueryChange?.(value)
  }

  return (
    <div className={styles.search}>
      <label className="mk-label" htmlFor={id}>{label}</label>
      <div className={`mk-line ${styles.searchLine}`}>
        <UiIcon name="search" size={20} />
        <input
          id={id}
          type="search"
          value={query}
          onChange={(event) => setBoth(event.target.value)}
          placeholder={placeholder}
          maxLength={80}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          autoFocus={autoFocus}
        />
        {query && (
          <button type="button" className="mk-icon-btn mk-icon-btn--bare" onClick={() => setBoth('')} aria-label="Clear the search">
            <UiIcon name="close" size={16} />
          </button>
        )}
      </div>

      {!query && suggestions.length > 0 && (
        <p className={`mk-meta ${styles.suggest}`}>
          <span>Try</span>
          {suggestions.map((word) => (
            <button key={word} type="button" className={styles.suggestion} onClick={() => setBoth(word)}>{word}</button>
          ))}
        </p>
      )}

      {searching && (
        <div className={styles.results}>
          <p className="mk-caption" role="status" aria-live="polite">
            {result.total === 0 && result.food.length === 0
              ? noMatch(deferred)
              : result.stations.length
                ? `${count(result.total, 'pujo')} within a kilometre of ${result.stations.map((s) => `${s.name} Metro`).join(' or ')}.`
                : count(result.total, 'pujo')}
          </p>
          {shown.length > 0 && (
            <ol className={styles.rows}>
              {shown.map(({ item, km }) => {
                const measured = result.stations.length && km !== null ? `${formatKm(km * WALK_FACTOR)} from the station` : distanceText(km, from)
                return (
                  <PujoRow
                    key={item.slug}
                    name={item.name}
                    famous={item.famous}
                    onOpen={() => open(item.slug)}
                    meta={[whereLine(area(item.area)?.name, item.zone), item.famous ? tierText(item) : null, measured].filter(Boolean).join(', ')}
                    action={action?.(item)}
                  />
                )
              })}
            </ol>
          )}
          {!all && result.pujos.length > SHOWN && (
            <button type="button" className={`mk-btn mk-btn--text ${styles.more}`} onClick={() => setAll(true)}>
              Show all {result.pujos.length}
            </button>
          )}
          {result.food.length > 0 && (
            <div className={styles.foodResults}>
              <h3 className={styles.groupTitle}>Places to eat</h3>
              <ol className={styles.rows}>
                {result.food.map(({ item }) => (
                  <li key={item.id} className={styles.row}>
                    <div className={styles.rowOpen}>
                      <span className={styles.rowName}>{item.name}</span>
                      <span className={styles.rowMeta}>{item.order}, {item.area}</span>
                    </div>
                    {foodAction?.(item)}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
