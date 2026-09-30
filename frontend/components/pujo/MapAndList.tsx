'use client'

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { UiIcon } from '@/components/brand/icons'
import { SectionHead } from '@/components/brand/SectionHead'
import { PujoRow } from '@/components/pujo/bits'
import { PujoMap, type MapFrame } from '@/components/pujo/PujoMap'
import { usePujo } from '@/components/pujo/PujoProvider'
import { ZoneChips } from '@/components/pujo/ZoneChips'
import type { ClientPujo } from '@/lib/pujo/client'
import { count, distanceText, metroLine } from '@/lib/pujo/format'
import { KOLKATA_CENTRE, corePoints, straightKm } from '@/lib/pujo/geo'
import { ZONES, zoneOf, type ZoneId } from '@/lib/pujo/sectors'
import { NEAR_METRO_KM } from '@/lib/pujo/search'
import styles from '@/styles/PujoExplore.module.css'

/* ==========================================================================
   Every pujo on our map, with a list beside it: side by side on a desktop, a
   toggle on a phone. The list works when Ola doesn't. Filters narrow both:
   a zone and its areas, famous only, near a Metro. "Near me" asks for the
   phone's position when tapped, never before, and sorts by distance.
   ========================================================================== */

const PAGE = 40
/* the first view: the city, not the far suburbs */
const CITY_KM = 12
/* "Near me" frames this much around you */
const NEAR_YOU_KM = 1.5

export function MapAndList({ action }: { action?: (pujo: ClientPujo) => ReactNode }) {
  const { index, open, selected, area, station, nearMe } = usePujo()
  const [zone, setZone] = useState<ZoneId | null>(null)
  const [areaId, setAreaId] = useState<string | null>(null)
  const [famousOnly, setFamousOnly] = useState(false)
  const [nearMetro, setNearMetro] = useState(false)
  const [view, setView] = useState<'map' | 'list'>('map')
  const [shown, setShown] = useState(PAGE)

  const pickZone = (next: ZoneId | null) => {
    setZone(next)
    setAreaId(null)
    setShown(PAGE)
  }

  const filtered = useMemo(() => index.pujos.filter((p) =>
    (!zone || p.zone === zone)
    && (!areaId || p.area === areaId)
    && (!famousOnly || p.famous)
    && (!nearMetro || (p.metro !== null && p.metro.km <= NEAR_METRO_KM))), [index, zone, areaId, famousOnly, nearMetro])

  const you = nearMe.status === 'on' ? nearMe.position : null
  const distance = useCallback((point: { lat: number; lng: number }) => (you ? straightKm(you, point) : null), [you])

  const listed = useMemo(() => {
    const withKm = filtered.map((p) => ({ pujo: p, km: p.lat !== null && p.lng !== null ? distance({ lat: p.lat, lng: p.lng }) : null }))
    return withKm.sort((a, b) =>
      you
        ? (a.km ?? Infinity) - (b.km ?? Infinity)
        : Number(b.pujo.famous) - Number(a.pujo.famous) || a.pujo.name.localeCompare(b.pujo.name))
  }, [filtered, distance, you])

  const frame = useMemo<MapFrame>(() => {
    const located = filtered.filter((p) => p.lat !== null && p.lng !== null).map((p) => ({ lat: p.lat as number, lng: p.lng as number }))
    const filteredAtAll = zone || areaId || famousOnly || nearMetro
    const key = `${zone}|${areaId}|${famousOnly}|${nearMetro}|${you ? 'you' : ''}`
    /* near me: you, and the pujos within a short walk */
    if (you) return { key, points: [you, ...located.filter((p) => straightKm(p, you) <= NEAR_YOU_KM)], maxZoom: 15 }
    return { key, points: filteredAtAll ? corePoints(located) : located.filter((p) => straightKm(p, KOLKATA_CENTRE) <= CITY_KM), maxZoom: 15 }
  }, [filtered, zone, areaId, famousOnly, nearMetro, you])

  const zoneAreas = zone ? index.areas.filter((a) => a.zone === zone && a.count > 0) : []
  const unplaced = filtered.filter((p) => p.lat === null).length
  const zones = ZONES.map((z) => z.id).filter((id) => index.pujos.some((p) => p.zone === id))

  return (
    <section className="mk-band" aria-labelledby="map-title">
      <div className="mk-wrap">
        <SectionHead
          id="map-title"
          title="On the map"
          lede="Every dot is a pujo; the bright ones are the famous ones. Tap one to read about it."
        />

        <div className={styles.filters}>
          <ZoneChips zones={zones} value={zone} onChange={pickZone} label="Side of the city" />
          {zoneAreas.length > 0 && (
            <div className={`mk-chips ${styles.chipRow}`} role="group" aria-label={`Areas in ${zoneOf(zone as ZoneId).long}`}>
              {zoneAreas.map((a) => (
                <button key={a.id} type="button" className="mk-chip" aria-pressed={areaId === a.id} onClick={() => { setAreaId(areaId === a.id ? null : a.id); setShown(PAGE) }}>
                  {a.name}
                </button>
              ))}
            </div>
          )}
          <div className={`mk-chips ${styles.chipRow}`} role="group" aria-label="Narrow the map">
            <button type="button" className="mk-chip" aria-pressed={famousOnly} onClick={() => setFamousOnly((v) => !v)}>Famous only</button>
            <button type="button" className="mk-chip" aria-pressed={nearMetro} onClick={() => setNearMetro((v) => !v)}>Near a Metro</button>
            <button
              type="button"
              className="mk-chip"
              aria-pressed={nearMe.status === 'on'}
              onClick={() => (nearMe.status === 'on' ? nearMe.stop() : nearMe.request())}
              disabled={nearMe.status === 'asking'}
            >
              <UiIcon name="locate" size={16} />
              {nearMe.status === 'asking' ? 'Finding you' : 'Near me'}
            </button>
          </div>
          {(nearMe.status === 'denied' || nearMe.status === 'unavailable') && (
            <p className="mk-caption" role="status">
              {nearMe.status === 'denied'
                ? 'Location is off for this site. Allow it in your browser settings, or pick an area instead.'
                : 'Your location isn’t available here. Pick an area instead.'}
            </p>
          )}
        </div>

        <div className={`mk-seg ${styles.viewToggle}`} role="group" aria-label="Show the pujos as">
          <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')}>Map</button>
          <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>List</button>
        </div>

        <div className={styles.mapLayout} data-view={view}>
          <div className={styles.mapPane}>
            <PujoMap
              pujos={filtered}
              selected={selected}
              onSelect={open}
              you={you}
              frame={frame}
              label="Map of the pujos"
              className={styles.mapFill}
            />
          </div>
          <div className={styles.listPane}>
            <p className="mk-caption" role="status" aria-live="polite">
              {count(filtered.length, 'pujo')}
              {zone ? ` in ${zoneOf(zone).long}` : ''}
              {areaId ? `, ${area(areaId)?.name}` : ''}
              {you ? ', nearest first' : ''}
              {unplaced ? `. ${unplaced} ${unplaced === 1 ? 'has' : 'have'} no map location yet.` : '.'}
            </p>
            <ol className={styles.rows}>
              {listed.slice(0, shown).map(({ pujo, km }) => (
                <PujoRow
                  key={pujo.slug}
                  name={pujo.name}
                  famous={pujo.famous}
                  current={selected === pujo.slug}
                  onOpen={() => open(pujo.slug)}
                  meta={[you ? distanceText(km, 'you') : area(pujo.area)?.name, metroLine(pujo.metro, station(pujo.metro?.id)) ?? (pujo.lat === null ? 'No map location yet' : null)].filter(Boolean).join(', ')}
                  action={action?.(pujo)}
                />
              ))}
            </ol>
            {listed.length > shown && (
              <button type="button" className={`mk-btn mk-btn--text ${styles.more}`} onClick={() => setShown((n) => n + PAGE)}>
                Show {Math.min(PAGE, listed.length - shown)} more
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
