'use client'

import { useEffect, useMemo, useRef } from 'react'
import { AlponaLoader } from '@/components/brand/Alpona'
import { boundsOf, collection, point, type LngLatTuple, type OlaMap, type OlaMarker } from '@/components/maps/ola'
import { useOlaMap } from '@/components/maps/useOlaMap'
import type { LatLng } from '@/lib/pujo/geo'
import styles from '@/styles/PujoMap.module.css'

/* ==========================================================================
   The pujo map: every pujo as a dot, not a photo pin. 626 pins would hide
   each other; dots show where Pujo is dense. Para pujos are small and dim,
   famous ones bright with a ring, and names appear as you zoom in. The
   selected pujo gets the one Crimson ring on screen (docs/PUJO_PLAN.md §Design).
   Everything here has a list beside it, and the list works when Ola doesn't.
   ========================================================================== */

export type MapPujo = { slug: string; name: string; lat: number | null; lng: number | null; famous: boolean }

/* a new key moves the camera once; the same key never moves it again */
export type MapFrame = { key: string; points: LatLng[]; maxZoom?: number }

type Props = {
  pujos: readonly MapPujo[]
  selected?: string | null
  onSelect?: (slug: string) => void
  you?: LatLng | null
  frame?: MapFrame | null
  label: string
  className?: string
  /* extra layers and markers, drawn by the caller once the map is ready (the route, the meeting spot) */
  children?: (map: OlaMap | null) => React.ReactNode
}

const SOURCE = 'pujo-dots'
const LAYERS = {
  hit: 'pujo-hit',
  para: 'pujo-para',
  famousRing: 'pujo-famous-ring',
  famous: 'pujo-famous',
  selected: 'pujo-selected',
  paraLabel: 'pujo-para-label',
  famousLabel: 'pujo-famous-label',
} as const

const PEARL = '#f2f1ed'
const POP_WHITE = '#fcfbf8'
const OBSIDIAN = '#0d1012'
const CRIMSON = '#d72638'
/* Ola's style ships Gentona; the brand faces are web fonts the map can't use */
const LABEL_FONT = ['Gentona Book']

type DotProps = { slug: string; name: string; famous: boolean }

function dots(pujos: readonly MapPujo[]) {
  return collection<DotProps>(pujos.flatMap((pujo) =>
    pujo.lat !== null && pujo.lng !== null ? [point(pujo.lng, pujo.lat, { slug: pujo.slug, name: pujo.name, famous: pujo.famous })] : []))
}

function addPujoLayers(map: OlaMap) {
  map.addSource(SOURCE, { type: 'geojson', data: collection([]) })
  const famous = ['==', ['get', 'famous'], true]
  const para = ['==', ['get', 'famous'], false]
  /* invisible, and large: a 5 px dot is too small for a thumb */
  map.addLayer({ id: LAYERS.hit, type: 'circle', source: SOURCE, paint: { 'circle-radius': 14, 'circle-opacity': 0 } })
  map.addLayer({ id: LAYERS.para, type: 'circle', source: SOURCE, filter: para, paint: { 'circle-radius': 2.5, 'circle-color': PEARL, 'circle-opacity': 0.5 } })
  map.addLayer({
    id: LAYERS.famousRing, type: 'circle', source: SOURCE, filter: famous,
    paint: { 'circle-radius': 7.5, 'circle-opacity': 0, 'circle-stroke-width': 1, 'circle-stroke-color': POP_WHITE, 'circle-stroke-opacity': 0.55 },
  })
  map.addLayer({ id: LAYERS.famous, type: 'circle', source: SOURCE, filter: famous, paint: { 'circle-radius': 4.5, 'circle-color': POP_WHITE } })
  map.addLayer({
    id: LAYERS.selected, type: 'circle', source: SOURCE, filter: ['==', ['get', 'slug'], ''],
    paint: { 'circle-radius': 12, 'circle-opacity': 0, 'circle-stroke-width': 2, 'circle-stroke-color': CRIMSON },
  })
  const label = (id: string, filter: unknown, minzoom: number, size: number) => map.addLayer({
    id, type: 'symbol', source: SOURCE, filter, minzoom,
    layout: {
      'text-field': ['get', 'name'], 'text-font': LABEL_FONT, 'text-size': size,
      'text-anchor': 'top', 'text-offset': [0, 0.9], 'text-max-width': 9, 'text-optional': true,
    },
    paint: { 'text-color': PEARL, 'text-halo-color': OBSIDIAN, 'text-halo-width': 1.4 },
  })
  label(LAYERS.paraLabel, para, 14.5, 11.5)
  label(LAYERS.famousLabel, famous, 12, 12.5)
}

/* keep what we frame clear of the edges, and of the info sheet on a phone */
function padding(map: OlaMap) {
  const { clientWidth: width, clientHeight: height } = map.getContainer()
  const side = Math.min(width < 640 ? 28 : 56, width * 0.12)
  return { top: Math.min(56, height * 0.14), bottom: Math.min(56, height * 0.14), left: side, right: side }
}

export function PujoMap({ pujos, selected = null, onSelect, you = null, frame = null, label, className = '', children }: Props) {
  const elementRef = useRef<HTMLDivElement>(null)
  const onSelectRef = useRef(onSelect)
  const latestPujos = useRef(pujos)
  const youMarker = useRef<OlaMarker | null>(null)
  const appliedFrame = useRef('')

  useEffect(() => {
    onSelectRef.current = onSelect
    latestPujos.current = pujos
  })

  const { status, map, olaMapsRef, retry } = useOlaMap(elementRef, {
    lazy: true,
    setup: (map) => {
      addPujoLayers(map)
      map.getSource(SOURCE)?.setData(dots(latestPujos.current))
      map.on('click', LAYERS.hit, (event) => {
        const slug = event.features?.[0]?.properties?.slug
        if (typeof slug === 'string') onSelectRef.current?.(slug)
      })
      map.on('mouseenter', LAYERS.hit, () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', LAYERS.hit, () => { map.getCanvas().style.cursor = '' })
    },
    beforeRemove: () => {
      youMarker.current?.remove()
      youMarker.current = null
      appliedFrame.current = ''
    },
  })

  const data = useMemo(() => dots(pujos), [pujos])
  useEffect(() => {
    map?.getSource(SOURCE)?.setData(data)
  }, [data, map])

  useEffect(() => {
    map?.setFilter(LAYERS.selected, ['==', ['get', 'slug'], selected ?? ''])
  }, [map, selected])

  /* frame the set once per key: a zone chosen, a group opened */
  useEffect(() => {
    if (!map || !frame || frame.key === appliedFrame.current) return
    const bounds = boundsOf(frame.points)
    if (!bounds) return
    appliedFrame.current = frame.key
    map.fitBounds(bounds, { padding: padding(map), maxZoom: frame.maxZoom ?? 15.5, duration: 450 })
  }, [frame, map])

  /* a newly selected pujo slides into view, lifted clear of the sheet on a phone */
  const selectedPoint = useMemo(() => {
    const pujo = selected ? pujos.find((p) => p.slug === selected) : null
    return pujo && pujo.lat !== null && pujo.lng !== null ? ([pujo.lng, pujo.lat] as LngLatTuple) : null
  }, [pujos, selected])
  useEffect(() => {
    if (!map || !selectedPoint) return
    const { clientWidth, clientHeight } = map.getContainer()
    map.easeTo({
      center: selectedPoint,
      zoom: Math.max(map.getZoom(), 14.5),
      offset: [0, clientWidth < 900 ? -clientHeight * 0.2 : 0],
      duration: 380,
    })
  }, [map, selectedPoint])

  useEffect(() => {
    const olaMaps = olaMapsRef.current
    if (!map || !olaMaps) return
    youMarker.current?.remove()
    youMarker.current = null
    if (!you) return
    const element = document.createElement('span')
    element.className = styles.you
    element.setAttribute('role', 'img')
    element.setAttribute('aria-label', 'You are here')
    youMarker.current = olaMaps.addMarker({ element, anchor: 'center' }).setLngLat([you.lng, you.lat]).addTo(map)
  }, [map, olaMapsRef, you])

  return (
    <div className={`${styles.frame} ${className}`}>
      <div ref={elementRef} className={styles.map} role="region" aria-label={label} />
      {children?.(map)}
      {(status === 'waiting' || status === 'loading') && (
        <div className={styles.status}>
          <AlponaLoader label="Loading the map" />
        </div>
      )}
      {status === 'missing-key' && (
        <div className={styles.status} role="status">
          <p className={styles.statusTitle}>The map isn&apos;t connected here.</p>
          <p className="mk-caption">The list has every pujo on it.</p>
        </div>
      )}
      {status === 'error' && (
        <div className={styles.status} role="alert">
          <p className={styles.statusTitle}>The map didn&apos;t load.</p>
          <p className="mk-caption">The list still has every pujo. Check your connection, then try the map again.</p>
          <button type="button" className="mk-btn mk-btn--secondary mk-btn--sm" onClick={retry}>Try the map again</button>
        </div>
      )}
    </div>
  )
}
