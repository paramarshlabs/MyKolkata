'use client'

import { useDeferredValue, useId, useMemo, useState } from 'react'
import { UiIcon } from '@/components/brand/icons'
import { CONTENT } from '@/lib/pujo-personality/content'
import { mapsUrl } from '@/lib/pujo-personality/recommendations'
import { QUERY_MAX, ROUTE_COUNT, searchRoutes } from '@/lib/pujo-personality/routeSearch'
import styles from '@/styles/Pujo.module.css'

/* the first few matches are plenty to scan; the count says how many more */
const SHOWN = 8

/* Search the Pujo routes by pandal, para, day or hour. Plain words work, and so
   does a regular expression for anyone who wants one (lib/pujo-personality/routeSearch.ts). */
export function RouteSearch() {
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query)
  const { hits, mode } = useMemo(() => searchRoutes(deferred), [deferred])
  const id = useId()
  const hintId = `${id}-hint`
  const searching = deferred.trim() !== ''

  return (
    <div className={styles.routeSearch}>
      <label className="mk-label" htmlFor={id}>Search the routes</label>
      <div className={`mk-line ${styles.routeLine}`}>
        <UiIcon name="search" size={20} />
        <input
          id={id}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="A pandal, a para, a day: Bagbazar, Gariahat, sapt|ashtami"
          maxLength={QUERY_MAX}
          autoComplete="off"
          spellCheck={false}
          aria-describedby={hintId}
        />
      </div>
      <p id={hintId} className={`mk-meta ${styles.routeHint}`}>
        {ROUTE_COUNT} routes across the city. Regular expressions work too, like <code>^north</code> or <code>ghat$</code>.
      </p>

      {searching && (
        <div className={styles.routeResults}>
          <p className="mk-caption" role="status" aria-live="polite">
            {hits.length === 0
              ? `No route passes “${deferred.trim()}”. Try a para, or a day like Saptami.`
              : `${hits.length} ${hits.length === 1 ? 'route' : 'routes'}${hits.length > SHOWN ? `, showing the first ${SHOWN}` : ''}${mode === 'text' ? ', searching as plain text' : ''}.`}
          </p>

          {hits.length > 0 && (
            <ol className={styles.routeList}>
              {hits.slice(0, SHOWN).map(({ route, archetypes, stops }) => (
                <li key={route.id} className={`mk-panel ${styles.route}`}>
                  <h3 className={styles.routeTitle}>{route.title}</h3>
                  <p className="mk-meta">{route.when}. {route.zone}.</p>
                  <p className={styles.routeWhy}>{route.why}</p>
                  <ol className={styles.routeStops}>
                    {route.stops.map((stop, i) => (
                      <li key={`${stop.name}-${i}`} className={stops.includes(i) ? styles.routeStopHit : undefined}>
                        <a href={mapsUrl(stop.name, stop.area)} target="_blank" rel="noopener noreferrer">
                          {stop.name}
                        </a>
                        <span className="mk-meta">, {stop.area}</span>
                        {stops.includes(i) && <span className="sr-only"> (matches)</span>}
                      </li>
                    ))}
                  </ol>
                  <p className={`mk-meta ${styles.routeFor}`}>
                    Written for {archetypes.map((a) => CONTENT[a].name).join(', ')}
                  </p>
                </li>
              ))}
            </ol>
          )}
          <p className="mk-meta">Themes and timings are announced after Mahalaya; check a pandal before you set out. Stops open in Google Maps.</p>
        </div>
      )}
    </div>
  )
}
