// @ts-nocheck
'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import NearYouMap, { CATEGORY_MARKERS } from '@/components/explore/NearYouMap'
import {
  KOLKATA, exploreCategories, exploreRequest, fetchLivePlaces, fetchPlaceDetails
} from '@/lib/livePlaces'
import { haversineDistanceKm } from '@/lib/places/geo'
import { findCategory } from '@/lib/places/taxonomy'
import { Sprig } from '@/components/brand/kolka'
import { CityIcon, UiIcon } from '@/components/brand/icons'
import { AlponaLoader } from '@/components/brand/Alpona'
import styles from '@/styles/NearYou.module.css'

const nearCategories = ['All', ...exploreCategories.map((category) => category.name)]
const DEFAULT_ORIGIN = Object.freeze({ ...KOLKATA, label: 'central Kolkata', source: 'default', radiusKm: 3 })
/* how far "near" reaches around a person, a searched area and a chosen place */
const NEAR_YOU_RADIUS_KM = 2.5
const AREA_RADIUS_KM = 1.5
/* beyond this the visitor isn't in Kolkata, and the city stays on screen */
const OUTSIDE_KOLKATA_KM = 60
const NEARBY_LIMIT = 120
const SEARCH_LIMIT = 40
const PAGE_SIZE = 24
const RAIL_SIZE = 40

const viewOptions = [
  { id: 'map', label: 'Map' },
  { id: 'grid', label: 'Grid' },
  { id: 'list', label: 'List' }
]

const VIEW_ICONS = { map: 'howrah', grid: 'grid', list: 'list' }

/* how a count of each kind reads: "12 places to eat", not "12 food" */
const CATEGORY_NOUNS = {
  All: 'places', 'Cafés': 'cafés', Food: 'places to eat', Places: 'landmarks', Culture: 'cultural places',
  Shopping: 'places to shop', Experiences: 'things to do', Outdoors: 'parks and open spaces'
}

function originPhrase(origin) {
  if (origin.source === 'user') return 'near you'
  if (origin.source === 'map') return 'in this part of the map'
  if (origin.source === 'default') return 'around central Kolkata'
  return `around ${origin.label}`
}

/* distance is only worth saying when it is measured from somewhere meaningful */
function distanceText(place, origin) {
  if (!place.distance) return null
  if (origin.source === 'user') return `${place.distance} away`
  if (origin.source === 'area' || origin.source === 'place') return `${place.distance} from ${origin.label}`
  return null
}

function initialOrigin(searchParams) {
  const lat = Number(searchParams.get('lat'))
  const lng = Number(searchParams.get('lng'))
  const label = (searchParams.get('near') || '').trim().slice(0, 80)
  const locate = searchParams.get('locate') === '1'
  if (!searchParams.get('lat') || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return DEFAULT_ORIGIN
  }
  /* Explore already resolved "near you" — reuse those coords without re-prompting GPS */
  if (locate && !label) {
    return { lat, lng, label: 'you', source: 'user', radiusKm: NEAR_YOU_RADIUS_KM }
  }
  return label
    ? { lat, lng, label, source: 'area', radiusKm: AREA_RADIUS_KM }
    : { lat, lng, label: 'this part of the map', source: 'map', radiusKm: DEFAULT_ORIGIN.radiusKm }
}

function locationFromSearchParams(searchParams) {
  const origin = initialOrigin(searchParams)
  if (origin.source !== 'user') return { position: null, state: searchParams.get('locate') === '1' ? 'loading' : 'idle' }
  return { position: { lat: origin.lat, lng: origin.lng }, state: 'ready' }
}

function geoFailureState(error) {
  if (typeof window !== 'undefined' && !window.isSecureContext) return 'unsupported'
  if (error?.code === 1) return 'denied'
  if (error?.code === 3) return 'timeout'
  return 'denied'
}

const GEO_OPTIONS = Object.freeze({ enableHighAccuracy: true, timeout: 20000, maximumAge: 120000 })

function mergeEnrichment(place, data) {
  if (!data) return place
  const merged = { ...place }
  for (const key of ['image', 'imageSourceUrl', 'imageAttribution', 'imageLicense', 'phone', 'website', 'openingHours', 'rating', 'ratingCount', 'description', 'photos']) {
    const value = data[key]
    if (value !== null && value !== undefined && !(Array.isArray(value) && !value.length)) merged[key] = value
  }
  merged.hasRealImage = Boolean(merged.image)
  return merged
}

function DiscoveryControls({
  query, onQueryChange, onClearSearch, searchRef, view, onViewChange,
  filtersOpen, onToggleFilters, activeFilterCount, onLocate, locationState, mapIdentity,
  onCompositionStart, onCompositionEnd, locationKnown
}) {
  const filterCount = activeFilterCount > 0 && <span className={styles.filterCount}>{activeFilterCount}</span>
  const locateLabel = locationState === 'loading' ? 'Finding your location' : locationKnown ? 'Show places near you again' : 'Use my location'

  /* on the map the deck is one slim row: back, search, and three quiet icons */
  if (mapIdentity) {
    return (
      <div className={`${styles.controlDeck} ${styles.mapDeck}`}>
        <Link href="/places" className={styles.mapBack} aria-label={`Back to Explore from ${locationKnown ? 'Near you' : 'Kolkata map'}`}>
          <UiIcon name="back" />
        </Link>
        <label className={`mk-line ${styles.searchBox}`}>
          <span className="sr-only">Search a café, a dish, a para or a landmark</span>
          <UiIcon name="search" size={16} />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            placeholder="Search Kolkata"
            autoComplete="off"
            enterKeyHint="search"
          />
          {query && (
            <button type="button" className={`mk-icon-btn mk-icon-btn--bare ${styles.deckIcon}`} onClick={onClearSearch} aria-label="Clear search">
              <UiIcon name="close" size={16} />
            </button>
          )}
        </label>
        <button
          type="button"
          className={`mk-icon-btn mk-icon-btn--bare ${styles.deckIcon}`}
          aria-expanded={filtersOpen}
          aria-controls="near-you-filters"
          aria-label="Filters"
          onClick={onToggleFilters}
        >
          <UiIcon name="filter" size={18} />
          {filterCount}
        </button>
        <button type="button" className={`mk-icon-btn mk-icon-btn--bare ${styles.deckIcon}`} onClick={() => onViewChange('list')} aria-label="Show places as a list">
          <UiIcon name="list" size={18} />
        </button>
        <button
          type="button"
          className={`mk-icon-btn mk-icon-btn--bare ${styles.deckIcon} ${styles.locateIcon}`}
          onClick={onLocate}
          disabled={locationState === 'loading'}
          aria-pressed={locationKnown}
          aria-label={locateLabel}
        >
          <UiIcon name="locate" size={18} />
        </button>
      </div>
    )
  }

  return (
    <div className={styles.controlDeck}>
      <label className={`mk-line ${styles.searchBox}`}>
        <span className="sr-only">Search a café, a dish, a para or a landmark</span>
        <UiIcon name="search" />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          placeholder="Search a café, a dish, a para"
          autoComplete="off"
          enterKeyHint="search"
        />
        {query && (
          <button type="button" className="mk-icon-btn mk-icon-btn--bare" onClick={onClearSearch} aria-label="Clear search">
            <UiIcon name="close" />
          </button>
        )}
      </label>

      <button
        type="button"
        className={`mk-btn mk-btn--secondary mk-btn--sm ${styles.filterButton}`}
        aria-expanded={filtersOpen}
        aria-controls="near-you-filters"
        onClick={onToggleFilters}
      >
        <UiIcon name="filter" />
        <span>Filters</span>
        {filterCount}
      </button>

      <div className={`mk-seg ${styles.viewToggle}`} role="group" aria-label="Choose results view">
        {viewOptions.map(({ id, label }) => (
          <button key={id} type="button" aria-pressed={view === id} onClick={() => onViewChange(id)}>
            {id === 'map' ? <CityIcon name="howrah" size={18} /> : <UiIcon name={VIEW_ICONS[id]} size={16} />}
            <span>{label}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className={`mk-icon-btn ${styles.locateIcon}`}
        onClick={onLocate}
        disabled={locationState === 'loading'}
        aria-pressed={locationKnown}
        aria-label={locateLabel}
      >
        <UiIcon name="locate" size={20} />
      </button>
    </div>
  )
}

function FilterScroller({ className, label, children }) {
  return (
    <div className={className} role="group" aria-label={label}>
      {children}
    </div>
  )
}

/* the map's key — the same letters and surfaces the pins wear. Tapping a row
   shows only that kind of place; tapping it again shows everything. */
function MapLegend({ open, onToggle, category, onCategoryChange }) {
  return (
    <div className={styles.legend}>
      <button
        type="button"
        className={styles.legendToggle}
        aria-expanded={open}
        aria-controls="near-you-legend"
        onClick={onToggle}
      >
        <span className={styles.legendDots} aria-hidden="true">
          <span style={{ background: CATEGORY_MARKERS.food.color }} />
          <span style={{ background: CATEGORY_MARKERS.places.color }} />
        </span>
        <span>{category === 'All' ? 'Legend' : category}</span>
      </button>
      {open && (
        <div id="near-you-legend" className={styles.legendPanel} role="group" aria-label="Map legend: show one kind of place">
          <button type="button" className={styles.legendRow} aria-pressed={category === 'All'} onClick={() => onCategoryChange('All')}>
            <span className={`${styles.legendSwatch} ${styles.legendSwatchAll}`} aria-hidden="true">•</span>
            <span>All places</span>
          </button>
          {exploreCategories.map(({ slug, name }) => {
            const marker = CATEGORY_MARKERS[slug] || CATEGORY_MARKERS.places
            return (
              <button
                key={slug}
                type="button"
                className={styles.legendRow}
                aria-pressed={category === name}
                onClick={() => onCategoryChange(category === name ? 'All' : name)}
              >
                <span className={styles.legendSwatch} style={{ background: marker.color }} aria-hidden="true">{marker.label}</span>
                <span>{name}</span>
              </button>
            )
          })}
          <p className={styles.legendNote}>Round photos are the place itself.</p>
        </div>
      )}
    </div>
  )
}

function PlaceVisual({ place, detail = false }) {
  if (place.hasRealImage && place.image) {
    return (
      <img
        className={styles.placePhoto}
        src={place.image}
        alt={`${place.name} venue photo`}
        width={detail ? 360 : 640}
        height={detail ? 250 : 480}
      />
    )
  }

  return (
    <div className={styles.placeVisualFallback} role="img" aria-label={`Photo not available for ${place.name}`}>
      <CityIcon name={place.icon || 'victoria'} size={36} />
      <span className="mk-meta">{place.category}</span>
    </div>
  )
}

function FilterStack({ category, onCategoryChange, area, areas, onAreaChange, resultCount, activeFilterCount, onClearFilters, onClose }) {
  return (
    <div id="near-you-filters" className={styles.filterStack}>
      <div className={styles.filterHeading}>
        <div>
          <p className="mk-meta">Refine the map</p>
          <p className={styles.filterTitle}>{resultCount} {resultCount === 1 ? 'place' : 'places'} showing</p>
        </div>
        <button type="button" className="mk-icon-btn mk-icon-btn--bare" onClick={onClose} aria-label="Close filters"><UiIcon name="close" /></button>
      </div>
      <div className={styles.filterGroup}>
        <span className="mk-meta">What</span>
        <FilterScroller className={styles.categoryFilters} label="Filter by category">
          {nearCategories.map((item) => (
            <button key={item} type="button" className="mk-chip" aria-pressed={category === item} onClick={() => onCategoryChange(item)}>
              {item}
            </button>
          ))}
        </FilterScroller>
      </div>
      {areas.length > 1 && (
        <div className={styles.filterGroup}>
          <span className="mk-meta">Where, among these results</span>
          <FilterScroller className={styles.areaFilters} label="Filter by area">
            {areas.map((item) => (
              <button key={item} type="button" className="mk-chip" aria-pressed={area === item} onClick={() => onAreaChange(item)}>
                {item}
              </button>
            ))}
          </FilterScroller>
        </div>
      )}
      {activeFilterCount > 0 && <button type="button" className={`mk-btn mk-btn--text ${styles.clearFilters}`} onClick={onClearFilters}>Clear all filters</button>}
    </div>
  )
}

function PlaceDetails({ place, origin, onClose, onExploreAround, enrichmentStatus }) {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.coordinates.lat},${place.coordinates.lng}`)}`
  let websiteUrl = null
  let imageSourceUrl = null
  try {
    const parsedWebsite = new URL(place.website)
    if (['http:', 'https:'].includes(parsedWebsite.protocol)) websiteUrl = parsedWebsite.toString()
  } catch {}
  try {
    const parsedSource = new URL(place.imageSourceUrl)
    if (['http:', 'https:'].includes(parsedSource.protocol)) imageSourceUrl = parsedSource.toString()
  } catch {}
  const hours = Array.isArray(place.openingHours) ? place.openingHours.filter((line) => typeof line === 'string') : []
  const distance = distanceText(place, origin)

  return (
    <aside className={styles.placeDetails} aria-label={`${place.name} details`}>
      <button type="button" className={`mk-icon-btn ${styles.closeDetails}`} onClick={onClose} aria-label={`Close ${place.name} details`}>
        <UiIcon name="close" />
      </button>
      <div className={styles.detailsMedia}><PlaceVisual place={place} detail /></div>
      <div className={styles.detailsBody}>
        <p className={styles.detailsMeta}>
          <span>{place.category}</span>
          {place.rating && <span>Rated {place.rating}{place.ratingCount ? ` by ${place.ratingCount}` : ''}</span>}
          {distance
            ? <span className={styles.distance}>{distance}</span>
            : place.area && place.area !== 'Kolkata' && <span>{place.area}</span>}
        </p>
        <h2 className={styles.detailsTitle}>{place.name}</h2>
        <p className={styles.detailsAddress}>{place.address}</p>
        {place.description && <p className={styles.detailsDesc}>{place.description}</p>}
        {enrichmentStatus === 'loading' && <p className={styles.enrichmentStatus}>Checking hours and contact details…</p>}
        {hours.length > 0 && (
          <details className={styles.hours}>
            <summary>Opening hours</summary>
            <ul>{hours.map((line) => <li key={line}>{line}</li>)}</ul>
          </details>
        )}
        {(place.phone || websiteUrl) && (
          <div className={styles.contactLinks}>
            {place.phone && <a className="mk-btn mk-btn--secondary mk-btn--sm" href={`tel:${String(place.phone).replace(/[^+\d]/g, '')}`}>Call</a>}
            {websiteUrl && <a className="mk-btn mk-btn--secondary mk-btn--sm" href={websiteUrl} target="_blank" rel="noopener noreferrer">Website</a>}
          </div>
        )}
        {place.imageAttribution && (
          <p className={styles.imageCredit}>
            Photo by {imageSourceUrl ? (
              <a href={imageSourceUrl} target="_blank" rel="noopener noreferrer">{place.imageAttribution}</a>
            ) : place.imageAttribution}
            {place.imageLicense ? `, ${place.imageLicense}` : ''}
          </p>
        )}
        <div className={styles.detailsFooter}>
          <div className={styles.detailsActions}>
            <button type="button" className="mk-btn mk-btn--text" onClick={() => onExploreAround(place)}>
              What&apos;s nearby
            </button>
            <a
              className="mk-btn mk-btn--text"
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${place.name} in Google Maps`}
            >
              Directions
            </a>
          </div>
        </div>
      </div>
    </aside>
  )
}

function PlaceCard({ place, layout, origin, onShowMap, onExploreAround }) {
  const distance = distanceText(place, origin)
  return (
    <article className={`${styles.placeCard} ${layout === 'list' ? styles.placeCardList : ''}`}>
      <div className={styles.cardMedia}><PlaceVisual place={place} /></div>
      <div className={styles.cardBody}>
        <div className={styles.cardHead}>
          <Sprig size={22} />
          <div className={styles.cardHeadText}>
            <h2 className={styles.cardTitle}>{place.name}</h2>
            <p className={styles.cardSub}>{place.category}{place.rating ? `, rated ${place.rating}` : ''}</p>
          </div>
        </div>
        <p className={styles.cardAddress}>{place.address}</p>
        {place.description && <p className={styles.cardDesc}>{place.description}</p>}
        <div className={styles.cardFooter}>
          {distance && <span className={styles.distance}>{distance}</span>}
          <div className={styles.cardActions}>
            <button type="button" className="mk-btn mk-btn--text" onClick={() => onExploreAround(place)}>What&apos;s nearby</button>
            <button type="button" className="mk-btn mk-btn--text" onClick={() => onShowMap(place.id)}>Show on map</button>
          </div>
        </div>
      </div>
    </article>
  )
}

function PlaceResultsSkeleton({ layout }) {
  const count = layout === 'grid' ? 6 : 4
  return (
    <section className={styles.skeletonResults} aria-label="Loading Kolkata places" role="status">
      <AlponaLoader label="Loading Kolkata places" className={styles.loader} />
      <div className={layout === 'grid' ? styles.gridView : styles.listView}>
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className={`${styles.placeSkeleton} ${layout === 'list' ? styles.placeSkeletonList : ''}`} aria-hidden="true">
            <div className={`mk-skel ${styles.placeSkeletonMedia}`} />
            <div className={styles.placeSkeletonBody}>
              <span className="mk-skel-line" style={{ width: '62%', height: 18 }} />
              <span className="mk-skel-line" style={{ width: '40%' }} />
              <span className="mk-skel-line" style={{ width: '84%' }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function EmptyResults({ searchText, category, origin, onClearSearch, onShowAllCategories, className, compact }) {
  let title
  let body
  let action = null
  if (searchText) {
    title = `Nothing in Kolkata matches “${searchText}”.`
    body = 'Check the spelling, or search a para, a street or a landmark.'
    action = <button type="button" className="mk-btn mk-btn--secondary mk-btn--sm" onClick={onClearSearch}>Clear search</button>
  } else if (category !== 'All') {
    title = `No ${CATEGORY_NOUNS[category] ?? 'places'} ${originPhrase(origin)}.`
    body = 'Zoom out and search this area, or try another kind of place.'
    action = <button type="button" className="mk-btn mk-btn--secondary mk-btn--sm" onClick={onShowAllCategories}>Show every kind of place</button>
  } else {
    title = `Nothing is mapped ${originPhrase(origin)} yet.`
    body = 'Zoom out, then search this area.'
  }
  return (
    <div className={className} role="status">
      <h2 className="mk-h3">{title}</h2>
      <p className={compact ? 'mk-caption' : 'mk-body'}>{body}</p>
      {action}
    </div>
  )
}

export default function NearYouClient() {
  const searchParams = useSearchParams()
  const searchRef = useRef(null)
  const railRef = useRef(null)

  const [view, setView] = useState(() => viewOptions.some((option) => option.id === searchParams.get('view')) ? searchParams.get('view') : 'map')
  const [query, setQuery] = useState(() => (searchParams.get('q') || '').slice(0, 120))
  const [debouncedQuery, setDebouncedQuery] = useState(() => {
    const text = (searchParams.get('q') || '').trim().slice(0, 120)
    return text.length >= 2 ? text : ''
  })
  const [category, setCategory] = useState(() => findCategory(searchParams.get('category'))?.name ?? 'All')
  const [area, setArea] = useState('All areas')
  const [origin, setOrigin] = useState(() => initialOrigin(searchParams))
  const [userPosition, setUserPosition] = useState(() => locationFromSearchParams(searchParams).position)
  const [locationState, setLocationState] = useState(() => locationFromSearchParams(searchParams).state)
  const [selectedPlaceId, setSelectedPlaceId] = useState(null)
  const [pendingSelectId, setPendingSelectId] = useState(() => searchParams.get('select'))
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [legendOpen, setLegendOpen] = useState(false)
  const [pendingViewport, setPendingViewport] = useState(null)
  const [isComposing, setIsComposing] = useState(false)
  const [retryVersion, setRetryVersion] = useState(0)
  const [paging, setPaging] = useState({ key: '', count: PAGE_SIZE })
  const [result, setResult] = useState({ key: '', status: 'idle', places: [], meta: {} })
  const [placeEnrichment, setPlaceEnrichment] = useState({ placeId: null, status: 'idle', data: null })

  /* ---------------------------------------------------------- location -- */
  const requestLocation = useCallback(() => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setLocationState('unsupported')
      return
    }
    if (!navigator.geolocation) {
      setLocationState('unsupported')
      return
    }
    setLocationState('loading')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lng: coords.longitude }
        if (haversineDistanceKm(KOLKATA, position) > OUTSIDE_KOLKATA_KM) {
          setUserPosition(null)
          setLocationState('far')
          return
        }
        setUserPosition(position)
        setOrigin({ ...position, label: 'you', source: 'user', radiusKm: NEAR_YOU_RADIUS_KM })
        setArea('All areas')
        setPendingViewport(null)
        setLocationState('ready')
      },
      (error) => setLocationState(geoFailureState(error)),
      GEO_OPTIONS
    )
  }, [])

  const routeLocate = searchParams.get('locate')
  const locateOnArrival = useRef(routeLocate === '1' && !userPosition)
  useEffect(() => {
    if (!locateOnArrival.current) return
    locateOnArrival.current = false
    /* Mobile Safari often blocks GPS without a fresh user gesture after navigation.
       Still try once for desktop / already-granted permissions; the locate button retries. */
    requestLocation()
  }, [requestLocation])

  /* ------------------------------------------------------------ search -- */
  useEffect(() => {
    if (isComposing) return undefined
    const text = query.trim().slice(0, 120)
    const next = text.length >= 2 ? text : ''
    if (next === debouncedQuery) return undefined
    const timer = window.setTimeout(() => setDebouncedQuery(next), next ? 320 : 0)
    return () => window.clearTimeout(timer)
  }, [debouncedQuery, isComposing, query])

  const searchText = debouncedQuery
  /* wait for a location the visitor asked for, rather than flashing the centre first */
  const holdForLocation = locationState === 'loading' && origin.source === 'default' && !searchText
  const requestUrl = holdForLocation ? null : exploreRequest({
    query: searchText,
    category,
    origin,
    radiusKm: origin.radiusKm,
    limit: searchText ? SEARCH_LIMIT : NEARBY_LIMIT
  })
  const requestKey = requestUrl ? `${requestUrl}#${retryVersion}` : ''

  useEffect(() => {
    if (!requestUrl) return undefined
    const controller = new AbortController()
    const key = requestKey
    fetchLivePlaces(requestUrl, { signal: controller.signal })
      .then(({ places, meta }) => setResult({ key, status: 'success', places, meta }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ key, status: 'error', places: [], meta: {} })
      })
    return () => controller.abort()
  }, [requestKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const typing = isComposing || (query.trim().length >= 2 ? query.trim().slice(0, 120) : '') !== debouncedQuery
  const dataStatus = holdForLocation || typing || result.key !== requestKey ? 'loading' : result.status
  const settled = dataStatus !== 'loading'

  /* a new request starts a new list, paged and scrolled from the top */
  const visibleCount = paging.key === requestKey ? paging.count : PAGE_SIZE
  useEffect(() => {
    railRef.current?.scrollTo?.({ left: 0 })
  }, [requestKey])

  const places = result.places
  const areas = useMemo(() => {
    const counts = new Map()
    for (const place of places) {
      if (place.area && place.area !== 'Kolkata') counts.set(place.area, (counts.get(place.area) || 0) + 1)
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name]) => name)
    return top.length > 1 ? ['All areas', ...top] : []
  }, [places])
  const visiblePlaces = useMemo(
    () => (area === 'All areas' ? places : places.filter((place) => place.area === area)),
    [area, places]
  )

  /* a place linked from Explore opens selected once its results arrive */
  const selectedBasePlace = visiblePlaces.find((place) => place.id === (selectedPlaceId ?? pendingSelectId)) || null
  const enrichmentStatus = !selectedBasePlace
    ? 'idle'
    : placeEnrichment.placeId === selectedBasePlace.id ? placeEnrichment.status : 'loading'
  const selectedPlace = selectedBasePlace && placeEnrichment.placeId === selectedBasePlace.id
    ? mergeEnrichment(selectedBasePlace, placeEnrichment.data)
    : selectedBasePlace

  useEffect(() => {
    if (!selectedBasePlace) return undefined
    const controller = new AbortController()
    fetchPlaceDetails(selectedBasePlace, { signal: controller.signal })
      .then((data) => setPlaceEnrichment({ placeId: selectedBasePlace.id, status: data ? 'success' : 'unavailable', data }))
      .catch((error) => {
        if (error.name !== 'AbortError') setPlaceEnrichment({ placeId: selectedBasePlace.id, status: 'unavailable', data: null })
      })
    return () => controller.abort()
  }, [selectedBasePlace?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  /* the address bar keeps the context, so back and share land in the same place */
  useEffect(() => {
    const params = new URLSearchParams({ view })
    if (debouncedQuery) params.set('q', debouncedQuery)
    if (category !== 'All') params.set('category', category)
    if (origin.source === 'area' || origin.source === 'place') {
      params.set('lat', origin.lat.toFixed(5))
      params.set('lng', origin.lng.toFixed(5))
      params.set('near', origin.label)
    } else if (origin.source === 'map') {
      params.set('lat', origin.lat.toFixed(5))
      params.set('lng', origin.lng.toFixed(5))
    } else if (origin.source === 'user') {
      params.set('locate', '1')
      params.set('lat', origin.lat.toFixed(5))
      params.set('lng', origin.lng.toFixed(5))
    }
    const next = `?${params}`
    if (window.location.search !== next) window.history.replaceState(null, '', next)
  }, [category, debouncedQuery, origin, view])

  useEffect(() => {
    if (!filtersOpen && !legendOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setFiltersOpen(false)
        setLegendOpen(false)
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [filtersOpen, legendOpen])

  /* ----------------------------------------------------------- actions -- */
  const activeFilterCount = Number(category !== 'All') + Number(area !== 'All areas') + Number(Boolean(query.trim()))

  const selectPlace = useCallback((placeId) => {
    setSelectedPlaceId(placeId)
    setPendingSelectId(null)
    setFiltersOpen(false)
    setLegendOpen(false)
  }, [])

  const closeDetails = () => {
    setSelectedPlaceId(null)
    setPendingSelectId(null)
  }
  const markMapMoved = useCallback((bounds) => setPendingViewport(bounds), [])

  const changeQuery = (nextQuery) => {
    setQuery(nextQuery)
    setArea('All areas')
  }

  const clearSearch = () => {
    setQuery('')
    setDebouncedQuery('')
    setArea('All areas')
    searchRef.current?.focus()
  }

  const changeCategory = (nextCategory) => {
    setCategory(nextCategory)
    setArea('All areas')
  }

  const homeOrigin = () => userPosition
    ? { ...userPosition, label: 'you', source: 'user', radiusKm: NEAR_YOU_RADIUS_KM }
    : DEFAULT_ORIGIN

  const clearFilters = () => {
    setQuery('')
    setDebouncedQuery('')
    setCategory('All')
    setArea('All areas')
    setOrigin(homeOrigin())
    setPendingViewport(null)
    setFiltersOpen(false)
    searchRef.current?.focus()
  }

  const exploreAround = (place) => {
    closeDetails()
    setOrigin({ lat: place.coordinates.lat, lng: place.coordinates.lng, label: place.name, source: 'place', radiusKm: AREA_RADIUS_KM })
    setQuery('')
    setDebouncedQuery('')
    setArea('All areas')
    setPendingViewport(null)
    setFiltersOpen(false)
  }

  const exploreArea = (anchor) => {
    setOrigin({ lat: anchor.latitude, lng: anchor.longitude, label: anchor.name, source: 'area', radiusKm: AREA_RADIUS_KM })
    setQuery('')
    setDebouncedQuery('')
    setArea('All areas')
    setPendingViewport(null)
  }

  const searchThisArea = () => {
    if (!pendingViewport) return
    const centre = { lat: (pendingViewport.north + pendingViewport.south) / 2, lng: (pendingViewport.east + pendingViewport.west) / 2 }
    const corner = haversineDistanceKm(centre, { lat: pendingViewport.north, lng: pendingViewport.east })
    setOrigin({ ...centre, label: 'this part of the map', source: 'map', radiusKm: Math.min(Math.max(corner, 0.4), 15) })
    setArea('All areas')
    setPendingViewport(null)
  }

  const locate = () => {
    if (userPosition) {
      setOrigin(homeOrigin())
      setPendingViewport(null)
      return
    }
    requestLocation()
  }

  const showOnMap = (placeId) => {
    selectPlace(placeId)
    setView('map')
  }

  const changeView = (nextView) => {
    setFiltersOpen(false)
    setView(nextView)
  }

  const retryPlaces = () => setRetryVersion((version) => version + 1)

  const camera = useMemo(() => {
    if (searchText) {
      /* frame the answers once they arrive, never the previous list */
      return settled && result.status === 'success' ? { key: `search:${requestKey}`, fit: true } : null
    }
    /* the visitor framed this view themselves — leave it be */
    if (origin.source === 'map') return null
    return { key: `origin:${origin.source}:${origin.lat}:${origin.lng}:${origin.radiusKm}`, center: origin, radiusKm: origin.radiusKm }
  }, [origin, requestKey, result.status, searchText, settled])

  const areaAnchor = searchText && settled ? result.meta?.area : null
  const dataCredit = result.meta?.provider === 'ola' || result.meta?.source === 'ola' ? 'Place data from Ola Maps.' : null
  const noun = visiblePlaces.length === 1 ? 'place' : (CATEGORY_NOUNS[category] ?? 'places')
  const summary = searchText ? `for “${searchText}”` : originPhrase(origin)

  const locationMessage = locationState === 'denied'
    ? 'Location access wasn’t available. Search a para or move the map instead.'
    : locationState === 'timeout'
      ? 'Finding you took too long. Tap locate to try again, or search a para.'
      : locationState === 'far'
        ? 'You’re outside Kolkata, so the map stays on the city.'
        : 'This browser can’t share its location. Use HTTPS, or search a para instead.'
  const showLocationNotice = ['denied', 'unsupported', 'far', 'timeout'].includes(locationState)

  const controls = (mapIdentity) => (
    <DiscoveryControls
      query={query}
      onQueryChange={changeQuery}
      onClearSearch={clearSearch}
      searchRef={searchRef}
      view={view}
      onViewChange={changeView}
      filtersOpen={filtersOpen}
      onToggleFilters={() => {
        setFiltersOpen((value) => !value)
        setLegendOpen(false)
      }}
      activeFilterCount={activeFilterCount}
      onLocate={locate}
      locationState={locationState}
      locationKnown={Boolean(userPosition)}
      mapIdentity={mapIdentity}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={(event) => {
        setIsComposing(false)
        changeQuery(event.currentTarget.value)
      }}
    />
  )

  const filters = filtersOpen && (
    <FilterStack
      category={category}
      onCategoryChange={changeCategory}
      area={area}
      areas={areas}
      onAreaChange={setArea}
      resultCount={visiblePlaces.length}
      activeFilterCount={activeFilterCount}
      onClearFilters={clearFilters}
      onClose={() => setFiltersOpen(false)}
    />
  )

  return (
    <main className={`${styles.root} ${view === 'map' ? styles.mapMode : styles.resultsMode}`}>
      {view === 'map' ? (
        <section className={styles.mapWorkspace} aria-label="Explore Kolkata places on the map">
          <NearYouMap
            places={visiblePlaces}
            selectedPlaceId={selectedPlace?.id || null}
            onSelect={selectPlace}
            userPosition={userPosition}
            onViewportChange={markMapMoved}
            camera={camera}
          />

          <div className={styles.mapOverlay}>
            {controls(true)}
            {filters}
          </div>

          <div className={styles.mapStatusBar}>
            <span className={styles.statusPill} aria-live="polite">
              {dataStatus === 'loading'
                ? (holdForLocation ? 'Finding your location…' : 'Finding places…')
                : dataStatus === 'error'
                  ? 'Places didn’t load'
                  : <><span className="mk-tabular">{visiblePlaces.length}</span>&nbsp;{noun} {summary}</>}
            </span>
            {areaAnchor && (
              <button type="button" className="mk-btn mk-btn--secondary mk-btn--sm" onClick={() => exploreArea(areaAnchor)}>
                Explore around {areaAnchor.name}
              </button>
            )}
            {pendingViewport && (
              <button type="button" className="mk-btn mk-btn--primary mk-btn--sm" onClick={searchThisArea}>
                Search this area
              </button>
            )}
          </div>

          {!selectedPlace && (
            <MapLegend
              open={legendOpen}
              onToggle={() => {
                setLegendOpen((value) => !value)
                setFiltersOpen(false)
              }}
              category={category}
              onCategoryChange={changeCategory}
            />
          )}

          {showLocationNotice && <p className={styles.locationNotice} role="status">{locationMessage}</p>}

          {dataStatus === 'error' && (
            <div className={styles.dataNotice} role="status">
              <span>Kolkata places couldn’t be loaded.</span>
              <button type="button" className="mk-btn mk-btn--secondary mk-btn--sm" onClick={retryPlaces}>Try again</button>
            </div>
          )}

          {selectedPlace ? (
            <PlaceDetails
              place={selectedPlace}
              origin={origin}
              enrichmentStatus={enrichmentStatus}
              onExploreAround={exploreAround}
              onClose={closeDetails}
            />
          ) : dataStatus === 'success' && !visiblePlaces.length ? (
            <EmptyResults
              className={styles.emptyState}
              compact
              searchText={searchText}
              category={category}
              origin={origin}
              onClearSearch={clearSearch}
              onShowAllCategories={() => changeCategory('All')}
            />
          ) : visiblePlaces.length > 0 && (
            <ul ref={railRef} className={`${styles.resultsRail} ${settled ? '' : styles.resultsRailStale}`} aria-label="Places on the map">
              {visiblePlaces.slice(0, RAIL_SIZE).map((place) => {
                const distance = distanceText(place, origin)
                return (
                  <li key={place.id}>
                    <button type="button" className={styles.railItem} onClick={() => selectPlace(place.id)}>
                      <span className={styles.railIcon} aria-hidden="true"><CityIcon name={place.icon || 'victoria'} size={22} /></span>
                      <span className={styles.railText}>
                        <span className={styles.railTitle}>{place.name}</span>
                        <span className={styles.railMeta}>{[place.category, distance ? place.distance : place.area].filter(Boolean).join(' · ')}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ) : (
        <div className="mk-wrap">
          <header className={styles.resultsHeader}>
            <Link href="/places" className={`mk-btn mk-btn--text ${styles.backLink}`}>
              <UiIcon name="back" /> Explore
            </Link>
            <div className="mk-band-head">
              <Sprig size={46} />
              <div>
                <p className="mk-caption">{category === 'All' ? 'Every kind of place' : category}</p>
                <h1 className="mk-h1">
                  {searchText
                    ? `“${searchText}”`
                    : origin.source === 'user'
                      ? 'Near you'
                      : origin.source === 'area' || origin.source === 'place'
                        ? `Around ${origin.label}`
                        : 'Explore Kolkata'}
                </h1>
              </div>
            </div>
          </header>
          <section className={styles.explorer} aria-label="Kolkata places">
            {controls(false)}
            {filters}

            <p className={styles.resultsSummary} aria-live="polite">
              {dataStatus === 'loading'
                ? (holdForLocation ? 'Finding your location…' : 'Finding places…')
                : dataStatus === 'error'
                  ? 'Places are unavailable for now.'
                  : <><span className={styles.summaryCount}>{visiblePlaces.length}</span> {noun} {summary}.{dataCredit ? ` ${dataCredit}` : ''}</>}
            </p>

            {areaAnchor && (
              <button type="button" className={`mk-btn mk-btn--secondary ${styles.anchorButton}`} onClick={() => exploreArea(areaAnchor)}>
                Explore around {areaAnchor.name}
              </button>
            )}

            {showLocationNotice && <p className={`mk-note ${styles.resultsNotice}`} role="status">{locationMessage}</p>}
            {dataStatus === 'loading' ? (
              <PlaceResultsSkeleton layout={view} />
            ) : dataStatus === 'error' ? (
              <div className={`mk-panel mk-empty ${styles.emptyPage}`} role="status">
                <h2 className="mk-h3">We couldn’t load Kolkata places.</h2>
                <p className="mk-body">Check your connection, then try again.</p>
                <button type="button" className="mk-btn mk-btn--secondary" onClick={retryPlaces}>Try again</button>
              </div>
            ) : visiblePlaces.length ? (
              <>
                <section className={view === 'grid' ? styles.gridView : styles.listView} aria-label={`Kolkata places ${view}`}>
                  {visiblePlaces.slice(0, visibleCount).map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      layout={view}
                      origin={origin}
                      onShowMap={showOnMap}
                      onExploreAround={exploreAround}
                    />
                  ))}
                </section>
                {visiblePlaces.length > visibleCount && (
                  <button
                    type="button"
                    className={`mk-btn mk-btn--secondary ${styles.loadMore}`}
                    onClick={() => setPaging({ key: requestKey, count: visibleCount + PAGE_SIZE })}
                  >
                    Show {Math.min(PAGE_SIZE, visiblePlaces.length - visibleCount)} more places
                  </button>
                )}
              </>
            ) : (
              <EmptyResults
                className={`mk-panel mk-empty ${styles.emptyPage}`}
                searchText={searchText}
                category={category}
                origin={origin}
                onClearSearch={clearSearch}
                onShowAllCategories={() => changeCategory('All')}
              />
            )}
          </section>
        </div>
      )}
    </main>
  )
}
