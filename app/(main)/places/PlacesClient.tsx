// @ts-nocheck
'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { KOLKATA, exploreCategories, exploreRequest, fetchLivePlaces, mapHref } from '@/lib/livePlaces'
import { haversineDistanceKm } from '@/lib/places/geo'
import { Card } from '@/components/brand/Card'
import { SectionHead } from '@/components/brand/SectionHead'
import { Sprig } from '@/components/brand/kolka'
import { CityIcon, UiIcon } from '@/components/brand/icons'
import { AlponaLoader } from '@/components/brand/Alpona'
import styles from '@/styles/Explore.module.css'

const RESULT_BATCH_SIZE = 8
const ROW_SIZE = 10
const NEARBY_RADIUS_KM = 3
const OUTSIDE_KOLKATA_KM = 60
const CENTRAL_KOLKATA = Object.freeze({ ...KOLKATA, source: 'default' })

/* the live rows the page opens with, closest first */
const rowCategories = ['cafes', 'food', 'culture', 'outdoors', 'shopping']
  .map((slug) => exploreCategories.find((category) => category.slug === slug))

/* hero chips pick a kind of place — they don't type a word into search */
const heroShortcuts = exploreCategories.filter((category) => ['food', 'places', 'culture', 'experiences'].includes(category.slug))

function originPhrase(origin) {
  return origin.source === 'user' ? 'near you' : 'around central Kolkata'
}

/* links carry the visitor's position, so the map reopens the same list */
function originParam(origin) {
  return origin.source === 'user' ? origin : undefined
}

/* one live list, keyed by its request — a stale answer never shows as the current one */
function useLivePlaces(url) {
  const [state, setState] = useState({ url: null, status: 'idle', places: [], meta: {} })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!url) return undefined
    const controller = new AbortController()
    fetchLivePlaces(url, { signal: controller.signal })
      .then(({ places, meta }) => setState({ url, status: 'success', places, meta }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ url, status: 'error', places: [], meta: {} })
      })
    return () => controller.abort()
  }, [url, attempt])

  const retry = useCallback(() => {
    setState((current) => ({ ...current, url: null }))
    setAttempt((value) => value + 1)
  }, [])

  const status = !url ? 'idle' : state.url !== url ? 'loading' : state.status
  return { places: state.url === url ? state.places : [], meta: state.url === url ? state.meta : {}, status, retry }
}

function ExploreResultsSkeleton({ count = RESULT_BATCH_SIZE, className = styles.resultGrid }) {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={styles.resultSkeleton}>
          <div className={`mk-skel ${styles.skeletonMedia}`} />
          <span className={`mk-skel-line ${styles.skeletonTitle}`} />
          <span className={`mk-skel-line ${styles.skeletonSub}`} />
        </div>
      ))}
    </div>
  )
}

/* the sub-line already names the area, so the card keeps just the street */
function shortAddress(place) {
  const parts = String(place.address || '').split(',').map((part) => part.trim())
    .filter((part) => part && part !== place.area && !/^kolkata$/i.test(part))
  return parts.slice(0, 3).join(', ') || null
}

function placeSub(place, origin) {
  if (origin.source === 'user' && place.distance) return `${place.distance} away, ${place.area}`
  return place.area
}

function NearbyRow({ category, origin }) {
  const url = exploreRequest({ category: category.name, origin, radiusKm: NEARBY_RADIUS_KM, limit: ROW_SIZE })
  const { places, status, retry } = useLivePlaces(url)
  const headingId = `row-${category.slug}`

  return (
    <section className={styles.rowSection} aria-labelledby={headingId}>
      <div className={styles.rowHead}>
        <h3 id={headingId} className={styles.rowTitle}>
          <CityIcon name={category.icon} size={26} />
          {category.name}
        </h3>
        <Link
          href={mapHref({ view: 'grid', category: category.name, origin: originParam(origin) })}
          className="mk-btn mk-btn--text"
          aria-label={`See all ${category.name.toLowerCase()} ${originPhrase(origin)}`}
        >
          See all
        </Link>
      </div>
      {status === 'loading' ? (
        <ExploreResultsSkeleton count={4} className={`mk-row ${styles.rowOffset}`} />
      ) : status === 'error' ? (
        <p className={`mk-note ${styles.rowNote}`} role="status">
          {category.name} didn&apos;t load.{' '}
          <button type="button" className="mk-btn mk-btn--text" onClick={retry}>Try again</button>
        </p>
      ) : places.length ? (
        <div className={`mk-row ${styles.rowOffset}`}>
          {places.map((place) => (
            <Card
              key={place.id}
              href={mapHref({ category: category.name, origin: originParam(origin), select: place.id })}
              ariaLabel={`Show ${place.name} on the map`}
              image={place.image}
              icon={place.icon}
              fallbackLabel={place.category}
              title={place.name}
              sub={placeSub(place, origin)}
              desc={shortAddress(place)}
            />
          ))}
        </div>
      ) : (
        <p className={`mk-caption ${styles.rowNote}`}>No {category.name.toLowerCase()} mapped within {NEARBY_RADIUS_KM} km yet.</p>
      )}
    </section>
  )
}

function Explore() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [isComposing, setIsComposing] = useState(false)
  const [paging, setPaging] = useState({ url: null, count: RESULT_BATCH_SIZE })
  const [origin, setOrigin] = useState(CENTRAL_KOLKATA)
  const [locationState, setLocationState] = useState('idle')
  const searchRef = useRef(null)

  const typedQuery = query.trim().length >= 2 ? query.trim().slice(0, 120) : ''
  useEffect(() => {
    if (isComposing || typedQuery === debouncedQuery) return undefined
    const timer = window.setTimeout(() => setDebouncedQuery(typedQuery), typedQuery ? 320 : 0)
    return () => window.clearTimeout(timer)
  }, [debouncedQuery, isComposing, typedQuery])

  const isFiltering = Boolean(typedQuery) || activeCategory !== 'All'
  const resultsUrl = debouncedQuery || activeCategory !== 'All'
    ? exploreRequest({
      query: debouncedQuery,
      category: activeCategory,
      origin,
      radiusKm: NEARBY_RADIUS_KM,
      limit: debouncedQuery ? 40 : 48
    })
    : null
  const results = useLivePlaces(resultsUrl)
  /* a new request pages from the start again */
  const visibleResultCount = paging.url === resultsUrl ? paging.count : RESULT_BATCH_SIZE
  const searchStatus = isComposing || typedQuery !== debouncedQuery ? 'loading' : results.status
  const displayedItems = searchStatus === 'success' ? results.places : []
  const visibleResults = displayedItems.slice(0, visibleResultCount)
  const remainingResultCount = Math.max(0, displayedItems.length - visibleResults.length)
  const areaAnchor = searchStatus === 'success' && debouncedQuery ? results.meta?.area : null
  const resultsTitle = searchStatus === 'loading'
    ? 'Finding Kolkata places'
    : debouncedQuery
      ? (displayedItems.length ? `Results for “${debouncedQuery}”` : `Nothing matches “${debouncedQuery}” yet`)
      : (displayedItems.length ? `${activeCategory} ${originPhrase(origin)}` : `No ${activeCategory.toLowerCase()} ${originPhrase(origin)} yet`)

  const requestLocation = useCallback(({ quiet = false } = {}) => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      if (!quiet) setLocationState('unsupported')
      return
    }
    if (!navigator.geolocation) {
      if (!quiet) setLocationState('unsupported')
      return
    }
    setLocationState('loading')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lng: coords.longitude }
        if (haversineDistanceKm(KOLKATA, position) > OUTSIDE_KOLKATA_KM) {
          setLocationState('far')
          return
        }
        setOrigin({ ...position, source: 'user' })
        setLocationState('ready')
      },
      (error) => {
        if (quiet) {
          setLocationState('idle')
          return
        }
        if (error?.code === 3) setLocationState('timeout')
        else if (error?.code === 1) setLocationState('denied')
        else setLocationState('denied')
      },
      /* longer timeout for indoor / cellular GPS; cache a recent fix briefly */
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 120000 }
    )
  }, [])

  /* if the visitor already shares their location, open on what's near them */
  useEffect(() => {
    let cancelled = false
    navigator.permissions?.query({ name: 'geolocation' })
      .then((permission) => {
        if (!cancelled && permission.state === 'granted') requestLocation({ quiet: true })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [requestLocation])

  const clearSearch = () => {
    setQuery('')
    setDebouncedQuery('')
    searchRef.current?.focus()
  }

  const resetDiscovery = () => {
    setQuery('')
    setDebouncedQuery('')
    setActiveCategory('All')
    searchRef.current?.focus()
  }

  const changeQuery = (nextQuery) => setQuery(nextQuery)

  const changeCategory = (nextCategory) => setActiveCategory(nextCategory)

  const locationNote = {
    denied: 'Location access wasn’t available, so these are around central Kolkata.',
    timeout: 'Finding you took too long, so these are around central Kolkata. Try again.',
    unsupported: 'This browser can’t share its location, so these are around central Kolkata.',
    far: 'You’re outside Kolkata, so these are around the city centre.'
  }[locationState]

  return (
    <main className={`mk-page ${styles.root}`}>
      <section className="mk-banner" aria-labelledby="explore-title">
        <img
          className="mk-banner-img"
          src="/explore-hero-v2.webp"
          alt="Kolkata at blue hour after rain, a yellow taxi on the wet street and the Howrah Bridge lit up beyond"
          width="1942"
          height="809"
          style={{ objectPosition: '56% 58%' }}
        />
        <div className="mk-banner-scrim" aria-hidden="true" />
        <div className="mk-banner-content">
          <div className={styles.heroCopy}>
            <Sprig size={38} />
            <h1 id="explore-title" className="mk-display" style={{ marginTop: 8 }}>Find your next Kolkata plan.</h1>
            <p className="mk-banner-lede">Good food, quiet corners and stories worth leaving home for.</p>

            <div className={styles.heroActions}>
              <form className={`mk-line ${styles.searchForm}`} role="search" noValidate onSubmit={(event) => event.preventDefault()}>
                <label className="sr-only" htmlFor="explore-search">Search Kolkata</label>
                <UiIcon name="search" size={20} />
                <input
                  ref={searchRef}
                  id="explore-search"
                  type="search"
                  value={query}
                  onChange={(event) => changeQuery(event.target.value)}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={(event) => {
                    setIsComposing(false)
                    changeQuery(event.currentTarget.value)
                  }}
                  placeholder="Search a café, a dish, a para"
                  autoComplete="off"
                  enterKeyHint="search"
                />
                {query && (
                  <button type="button" className="mk-icon-btn mk-icon-btn--bare" onClick={clearSearch} aria-label="Clear search">
                    <UiIcon name="close" />
                  </button>
                )}
              </form>
              <Link href={mapHref({ locate: true })} className="mk-btn mk-btn--primary">
                Open the live map <span className="mk-btn-arrow" aria-hidden="true">→</span>
              </Link>
            </div>

            <div className={`mk-chips ${styles.heroShortcuts}`} role="group" aria-label="Explore shortcuts">
              {heroShortcuts.map(({ name, icon }) => (
                <button
                  key={name}
                  type="button"
                  className="mk-chip"
                  aria-pressed={activeCategory === name}
                  onClick={() => changeCategory(activeCategory === name ? 'All' : name)}
                >
                  <CityIcon name={icon} size={20} />
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mk-wrap">
        {!query.trim() && (
          <section className={`${styles.categorySection} ${activeCategory !== 'All' ? styles.categorySectionActive : ''}`} aria-labelledby="category-title">
            <SectionHead id="category-title" title="Explore by category" />
            <div className={styles.categoryGrid}>
              {exploreCategories.map((category) => {
                const isActive = activeCategory === category.name
                return (
                  <button
                    key={category.slug}
                    type="button"
                    className={`mk-chip ${styles.categoryButton}`}
                    aria-pressed={isActive}
                    onClick={() => changeCategory(isActive ? 'All' : category.name)}
                  >
                    <CityIcon name={category.icon} size={24} />
                    <span>{category.name}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {isFiltering && (
          <section className={styles.resultsSection} aria-labelledby="results-title">
            <SectionHead
              id="results-title"
              title={resultsTitle}
              action={<button type="button" className="mk-btn mk-btn--text" onClick={resetDiscovery}>Clear filters</button>}
            />
            <p className="sr-only" aria-live="polite">
              {searchStatus === 'loading' ? 'Searching Kolkata places' : `${displayedItems.length} results found`}
            </p>
            {areaAnchor && (
              <Link
                href={mapHref({ origin: { lat: areaAnchor.latitude, lng: areaAnchor.longitude }, label: areaAnchor.name })}
                className={`mk-btn mk-btn--secondary ${styles.anchorLink}`}
              >
                Explore around {areaAnchor.name}
              </Link>
            )}
            {searchStatus === 'loading' ? (
              <>
                <AlponaLoader label="Looking across the city" className={styles.loader} />
                <ExploreResultsSkeleton />
              </>
            ) : searchStatus === 'error' ? (
              <div className={`mk-panel mk-empty ${styles.state}`} role="status">
                <h3 className="mk-h3">Kolkata places didn&apos;t load.</h3>
                <p className="mk-body">Check your connection, then try the search again.</p>
                <button type="button" className="mk-btn mk-btn--secondary" onClick={results.retry}>
                  Try again
                </button>
              </div>
            ) : displayedItems.length ? (
              <>
                <div className={styles.resultGrid}>
                  {visibleResults.map((item) => (
                    <Card
                      key={item.id}
                      href={mapHref({ query: debouncedQuery, category: activeCategory, origin: originParam(origin), select: item.id })}
                      ariaLabel={`Show ${item.name} on the map`}
                      image={item.image}
                      icon={item.icon}
                      fallbackLabel={item.category}
                      title={item.name}
                      sub={placeSub(item, origin)}
                      desc={shortAddress(item)}
                    />
                  ))}
                </div>
                <div className={styles.resultActions}>
                  {remainingResultCount > 0 && (
                    <button
                      type="button"
                      className="mk-btn mk-btn--secondary"
                      onClick={() => setPaging({ url: resultsUrl, count: visibleResultCount + RESULT_BATCH_SIZE })}
                    >
                      Show {Math.min(RESULT_BATCH_SIZE, remainingResultCount)} more
                    </button>
                  )}
                  <Link
                    href={mapHref({ query: debouncedQuery, category: activeCategory, origin: originParam(origin) })}
                    className="mk-btn mk-btn--text"
                  >
                    View all on map
                  </Link>
                </div>
              </>
            ) : (
              <div className={`mk-panel mk-empty ${styles.state}`}>
                <h3 className="mk-h3">{debouncedQuery ? 'Nothing in Kolkata matches that yet.' : `No ${activeCategory.toLowerCase()} mapped close by.`}</h3>
                <p className="mk-body">{debouncedQuery ? 'Check the spelling, or search a para, a street or a landmark.' : 'Open the map and look a little further out.'}</p>
                <button type="button" className="mk-btn mk-btn--secondary" onClick={resetDiscovery}>Start over</button>
              </div>
            )}
          </section>
        )}

        {!isFiltering && (
          <section id="near-you" className={styles.section} aria-labelledby="near-title">
            <SectionHead
              id="near-title"
              title={origin.source === 'user' ? 'Near you' : 'Around central Kolkata'}
              lede={origin.source === 'user'
                ? 'Live from the map, closest first.'
                : 'Live from the map. Share your location to start from where you are.'}
              action={origin.source === 'user' ? (
                <Link href={mapHref({ origin, locate: true })} className="mk-btn mk-btn--text">See them on the map</Link>
              ) : (
                <button
                  type="button"
                  className="mk-btn mk-btn--text"
                  onClick={() => requestLocation()}
                  disabled={locationState === 'loading'}
                >
                  {locationState === 'loading' ? 'Finding you…' : 'Use my location'}
                </button>
              )}
            />
            {locationNote && <p className={`mk-note ${styles.locationNote}`} role="status">{locationNote}</p>}
            {rowCategories.map((category) => (
              <NearbyRow key={category.slug} category={category} origin={origin} />
            ))}
          </section>
        )}
      </div>
    </main>
  )
}

export default Explore
