// @ts-nocheck
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlponaLoader } from '@/components/brand/Alpona'
import { clientOlaStyleUrl, proxiedOlaMapsUrl } from '@/lib/places/olaMapsProxy'
import styles from '@/styles/NearYou.module.css'

const KOLKATA_CENTER = [88.3639, 22.5726]
/* Dark is the primary experience. Style loads via our proxy so phone/LAN
   origins are not blocked by Ola's browser-domain allowlist. */
const SOURCE_ID = 'mykolkata-places'
const SELECTED_LAYER_ID = 'mykolkata-selected-place'
const PLACE_PHOTO_LAYER_ID = 'mykolkata-place-photos'

function safeErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error || 'Unknown Ola Maps error')
  return message.replace(/([?&]api_key=)[^&\s]+/gi, '$1[redacted]')
}

/* Brand surfaces, not a rainbow: food and cafés sit on Bordeaux, everything
   else on Slate. The letter carries the category — colour never does alone. */
export const CATEGORY_MARKERS = {
  cafes: { color: '#3f0d12', label: 'C' },
  food: { color: '#3f0d12', label: 'F' },
  places: { color: '#1c2225', label: 'P' },
  culture: { color: '#1c2225', label: 'A' },
  shopping: { color: '#1c2225', label: 'S' },
  experiences: { color: '#1c2225', label: 'E' },
  outdoors: { color: '#1c2225', label: 'O' }
}

function imageIdFor(place) {
  return place.hasRealImage ? `mykolkata-photo-${place.id}` : `mykolkata-category-${place.markerCategory || 'places'}`
}

function placesGeoJson(places, selectedPlaceId) {
  return {
    type: 'FeatureCollection',
    features: places.map((place) => ({
      type: 'Feature',
      properties: {
        id: place.id,
        name: place.name,
        category: place.category,
        imageId: imageIdFor(place),
        selected: place.id === selectedPlaceId
      },
      geometry: {
        type: 'Point',
        coordinates: [place.coordinates.lng, place.coordinates.lat]
      }
    }))
  }
}

function createPhotoImage(source, category = 'places', hasRealImage = true) {
  return new Promise((resolve) => {
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    const image = new Image()

    const finish = (hasImage) => {
      context.clearRect(0, 0, size, size)
      context.save()
      context.shadowColor = 'rgba(5, 6, 7, .6)'
      context.shadowBlur = 8
      context.shadowOffsetY = 4
      context.fillStyle = '#f2f1ed'
      context.beginPath()
      context.arc(32, 32, 29, 0, Math.PI * 2)
      context.fill()
      context.restore()

      context.save()
      context.beginPath()
      context.arc(32, 32, 25, 0, Math.PI * 2)
      context.clip()
      if (hasImage && hasRealImage) {
        const scale = Math.max(50 / image.naturalWidth, 50 / image.naturalHeight)
        const width = image.naturalWidth * scale
        const height = image.naturalHeight * scale
        context.drawImage(image, 32 - width / 2, 32 - height / 2, width, height)
      } else {
        const marker = CATEGORY_MARKERS[category] || CATEGORY_MARKERS.places
        context.fillStyle = marker.color
        context.fillRect(7, 5, 50, 50)
        context.fillStyle = '#f2f1ed'
        context.font = '400 22px "Clear Sans Display", system-ui, sans-serif'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText(marker.label, 32, 31)
      }
      context.restore()
      resolve(context.getImageData(0, 0, size, size))
    }

    if (hasRealImage && source) {
      image.crossOrigin = 'anonymous'
      image.onload = () => finish(true)
      image.onerror = () => finish(false)
      image.decoding = 'async'
      image.src = source
    } else {
      finish(false)
    }
  })
}

async function ensurePhotoImages(map, places, registeredImageIds) {
  await Promise.all(places.map(async (place) => {
    const imageId = imageIdFor(place)
    if (map.hasImage(imageId)) {
      registeredImageIds.add(imageId)
      return
    }
    const imageData = await createPhotoImage(place.image, place.markerCategory, place.hasRealImage)
    if (!map.hasImage(imageId)) map.addImage(imageId, imageData)
    registeredImageIds.add(imageId)
  }))
}

function addPlaceLayers(map) {
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: placesGeoJson([], null)
    })
  }

  if (!map.getLayer(SELECTED_LAYER_ID)) map.addLayer({
    id: SELECTED_LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['==', ['get', 'selected'], true],
    paint: {
      'circle-color': '#d72638',
      'circle-radius': 22,
      'circle-stroke-color': '#f2f1ed',
      'circle-stroke-width': 2
    }
  })

  if (!map.getLayer(PLACE_PHOTO_LAYER_ID)) map.addLayer({
    id: PLACE_PHOTO_LAYER_ID,
    type: 'symbol',
    source: SOURCE_ID,
    /* small pins that step aside for each other — no piles, no clusters.
       Zooming in reveals the ones hidden; the selected place always shows. */
    layout: {
      'icon-image': ['get', 'imageId'],
      'icon-size': ['case', ['==', ['get', 'selected'], true], .62, .44],
      'icon-padding': 2,
      'icon-allow-overlap': false,
      'symbol-sort-key': ['case', ['==', ['get', 'selected'], true], 0, 1]
    }
  })

  ;[
    SELECTED_LAYER_ID,
    PLACE_PHOTO_LAYER_ID
  ].forEach((layerId) => map.moveLayer(layerId))
}

function placeBounds(places) {
  const lngs = places.map((place) => place.coordinates.lng)
  const lats = places.map((place) => place.coordinates.lat)
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)]
  ]
}

function circleBounds({ lat, lng }, radiusKm) {
  const latitudeDelta = radiusKm / 110.574
  const longitudeDelta = radiusKm / (111.32 * Math.max(Math.cos(lat * Math.PI / 180), 0.01))
  return [[lng - longitudeDelta, lat - latitudeDelta], [lng + longitudeDelta, lat + latitudeDelta]]
}

/* keep what we fit clear of the control deck above and the results rail below */
function cameraPadding(map) {
  const { clientWidth: width, clientHeight: height } = map.getContainer()
  const compact = width < 768
  const top = Math.min(compact ? 150 : 170, height * 0.3)
  const bottom = Math.min(compact ? 170 : 190, height * 0.3)
  const side = Math.min(compact ? 28 : 72, width * 0.12)
  return { top, bottom, left: side, right: side }
}

/* MapLibre paints to a canvas sized at init — mobile URL bars and orientation
   change the container after that, so the canvas must be resized explicitly. */
function waitForSizedContainer(element) {
  return new Promise((resolve) => {
    if (element.clientWidth > 0 && element.clientHeight > 0) {
      resolve()
      return
    }
    let settled = false
    const finish = () => {
      if (settled || element.clientWidth <= 0 || element.clientHeight <= 0) return
      settled = true
      observer.disconnect()
      resolve()
    }
    const observer = new ResizeObserver(finish)
    observer.observe(element)
    requestAnimationFrame(finish)
    window.setTimeout(finish, 400)
  })
}

function bindMapResize(map, element) {
  const resize = () => {
    try { map.resize() } catch { /* map may already be removed */ }
  }
  const schedule = () => requestAnimationFrame(resize)
  const observer = new ResizeObserver(schedule)
  observer.observe(element)
  window.visualViewport?.addEventListener('resize', schedule)
  window.addEventListener('orientationchange', schedule)
  schedule()
  return () => {
    observer.disconnect()
    window.visualViewport?.removeEventListener('resize', schedule)
    window.removeEventListener('orientationchange', schedule)
  }
}

/*
 * camera: { key, center?, radiusKm?, fit? } — a new key moves the map once.
 * `center` frames the circle around a point; `fit` frames the loaded places.
 * The page never moves the map for a viewport the visitor chose themselves.
 */
export default function NearYouMap({ places, selectedPlaceId, onSelect, userPosition, onViewportChange, camera }) {
  const elementRef = useRef(null)
  const mapRef = useRef(null)
  const olaMapsRef = useRef(null)
  const userMarkerRef = useRef(null)
  const registeredImageIdsRef = useRef(new Set())
  const appliedCameraKeyRef = useRef('')
  const previousSelectedIdRef = useRef(null)
  const userInteractingRef = useRef(false)
  const savedCameraRef = useRef(null)
  const latestPlacesRef = useRef(places)
  const latestSelectedIdRef = useRef(selectedPlaceId)
  const onSelectRef = useRef(onSelect)
  const onViewportChangeRef = useRef(onViewportChange)
  const syncVersionRef = useRef(0)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState('loading')
  const placeKey = useMemo(() => places.map((place) => place.id).join('|'), [places])

  /* map event handlers are bound once, so they read the latest props through refs */
  useEffect(() => {
    latestPlacesRef.current = places
    latestSelectedIdRef.current = selectedPlaceId
    onSelectRef.current = onSelect
    onViewportChangeRef.current = onViewportChange
  })

  useEffect(() => {
    let cancelled = false
    let map
    let unbindResize = () => {}
    /* Constructor still wants a key; tile auth runs on the server proxy. */
    const apiKey = process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY || 'proxied'

    setStatus('loading')
    registeredImageIdsRef.current = new Set()
    appliedCameraKeyRef.current = savedCameraRef.current ? appliedCameraKeyRef.current : ''
    /* cellular + style fetch often exceeds a short desktop budget */
    const loadTimer = window.setTimeout(() => {
      if (!cancelled) setStatus((current) => current === 'ready' ? current : 'error')
    }, 25000)

    import('olamaps-web-sdk')
      .then(async ({ OlaMaps }) => {
        if (cancelled || !elementRef.current) return

        await waitForSizedContainer(elementRef.current)
        if (cancelled || !elementRef.current) return

        /* probe first so a missing server key shows the setup hint, not a blank map */
        const styleUrl = clientOlaStyleUrl()
        const styleResponse = await fetch(styleUrl)
        if (cancelled) return
        if (!styleResponse.ok) {
          setStatus(styleResponse.status === 503 ? 'missing-key' : 'error')
          return
        }

        const olaMaps = new OlaMaps({ apiKey })
        olaMapsRef.current = olaMaps
        const saved = savedCameraRef.current
        map = await olaMaps.init({
          container: elementRef.current,
          /* the SDK only accepts a style URL string — it calls style.includes() */
          style: styleUrl,
          center: saved?.center || KOLKATA_CENTER,
          zoom: saved?.zoom || 13.5,
          attributionControl: true,
          /* Overrides the SDK transform so every Ola URL goes through /api/maps/ola */
          transformRequest: (url) => ({ url: proxiedOlaMapsUrl(url) }),
        })
        if (cancelled) {
          map?.remove()
          return
        }

        mapRef.current = map
        unbindResize = bindMapResize(map, elementRef.current)
        map.addControl(olaMaps.addNavigationControls({ showCompass: false }), 'bottom-right')
        map.on('error', (event) => {
          console.warn('Ola map resource error:', safeErrorMessage(event?.error))
        })

        let setupStarted = false
        const finishSetup = async () => {
          if (setupStarted) return
          setupStarted = true
          try {
            if (cancelled) return
            map.resize()
            addPlaceLayers(map)

            map.on('click', PLACE_PHOTO_LAYER_ID, (event) => {
              const placeId = event.features?.[0]?.properties?.id
              if (placeId) onSelectRef.current?.(placeId)
            })
            map.on('mouseenter', PLACE_PHOTO_LAYER_ID, () => { map.getCanvas().style.cursor = 'pointer' })
            map.on('mouseleave', PLACE_PHOTO_LAYER_ID, () => { map.getCanvas().style.cursor = '' })

            await ensurePhotoImages(map, latestPlacesRef.current, registeredImageIdsRef.current)
            if (cancelled) return
            map.getSource(SOURCE_ID)?.setData(placesGeoJson(latestPlacesRef.current, latestSelectedIdRef.current))
            map.resize()
            window.clearTimeout(loadTimer)
            setStatus('ready')
          } catch (error) {
            console.error('Ola map setup failed:', safeErrorMessage(error))
            if (!cancelled) setStatus('error')
          }
        }

        map.once('load', finishSetup)
        if (map.loaded()) finishSetup()

        map.on('dragstart', () => { userInteractingRef.current = true })
        map.on('zoomstart', (event) => {
          if (event.originalEvent) userInteractingRef.current = true
        })
        map.on('rotatestart', (event) => {
          if (event.originalEvent) userInteractingRef.current = true
        })
        map.on('moveend', () => {
          if (!userInteractingRef.current) return
          userInteractingRef.current = false
          const bounds = map.getBounds()
          onViewportChangeRef.current?.({
            north: bounds.getNorth(),
            east: bounds.getEast(),
            south: bounds.getSouth(),
            west: bounds.getWest()
          })
        })
      })
      .catch((error) => {
        console.error('Ola map initialization failed:', safeErrorMessage(error))
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      window.clearTimeout(loadTimer)
      unbindResize()
      syncVersionRef.current += 1
      if (map) {
        const center = map.getCenter?.()
        savedCameraRef.current = center ? { center: [center.lng, center.lat], zoom: map.getZoom() } : null
      }
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
      mapRef.current = null
      olaMapsRef.current = null
      map?.remove()
    }
  }, [attempt])

  /* markers */
  useEffect(() => {
    const map = mapRef.current
    if (!map || status !== 'ready') return
    const syncVersion = ++syncVersionRef.current

    ensurePhotoImages(map, places, registeredImageIdsRef.current)
      .then(() => {
        if (syncVersion !== syncVersionRef.current || !map.getSource(SOURCE_ID)) return
        map.getSource(SOURCE_ID).setData(placesGeoJson(places, selectedPlaceId))
      })
      .catch((error) => {
        console.error('Ola place marker update failed:', safeErrorMessage(error))
      })
  }, [placeKey, places, selectedPlaceId, status])

  /* camera — once per key, and only when there is something to frame */
  useEffect(() => {
    const map = mapRef.current
    if (!map || status !== 'ready' || !camera?.key || camera.key === appliedCameraKeyRef.current) return

    if (camera.center && Number.isFinite(camera.center.lat) && Number.isFinite(camera.center.lng)) {
      map.fitBounds(circleBounds(camera.center, camera.radiusKm || 2), {
        padding: cameraPadding(map),
        maxZoom: 16,
        duration: 450
      })
      appliedCameraKeyRef.current = camera.key
      return
    }

    if (camera.fit && places.length) {
      map.fitBounds(placeBounds(places), {
        padding: cameraPadding(map),
        maxZoom: 16,
        duration: 450
      })
      appliedCameraKeyRef.current = camera.key
    }
  }, [camera, placeKey, places, status])

  /* a newly selected place slides into view; re-renders don't move the map */
  useEffect(() => {
    const map = mapRef.current
    if (!map || status !== 'ready') return
    if (selectedPlaceId === previousSelectedIdRef.current) return
    previousSelectedIdRef.current = selectedPlaceId

    const selected = places.find((place) => place.id === selectedPlaceId)
    if (!selected) return
    const { clientWidth, clientHeight } = map.getContainer()
    map.easeTo({
      center: [selected.coordinates.lng, selected.coordinates.lat],
      zoom: Math.max(map.getZoom(), 15),
      /* nudge up so the details sheet doesn't cover the pin */
      offset: [0, clientWidth < 768 ? -clientHeight * 0.18 : -40],
      duration: 380
    })
  }, [placeKey, places, selectedPlaceId, status])

  useEffect(() => {
    const map = mapRef.current
    const olaMaps = olaMapsRef.current
    if (!map || !olaMaps || status !== 'ready') return

    userMarkerRef.current?.remove()
    userMarkerRef.current = null

    if (userPosition) {
      const element = document.createElement('span')
      element.className = styles.userMarker
      element.setAttribute('role', 'img')
      element.setAttribute('aria-label', 'Your location')
      userMarkerRef.current = olaMaps.addMarker({ element, anchor: 'center' })
        .setLngLat([userPosition.lng, userPosition.lat])
        .addTo(map)
    }
  }, [status, userPosition])

  return (
    <div className={styles.mapFrame}>
      <div ref={elementRef} className={styles.map} aria-label="Interactive Ola map of Kolkata places" />
      {status === 'loading' && (
        <div className={styles.mapStatus}>
          <AlponaLoader label="Loading the Kolkata map" />
        </div>
      )}
      {status === 'missing-key' && (
        <div className={styles.mapStatus} role="status">
          <p className={styles.mapStatusTitle}>Ola Maps is ready to connect.</p>
          <p className="mk-caption">{process.env.NODE_ENV === 'development' ? 'Add OLA_MAPS_API_KEY to .env.local, then restart the server.' : 'Map configuration is incomplete.'}</p>
        </div>
      )}
      {status === 'error' && (
        <div className={styles.mapStatus} role="alert">
          <p className={styles.mapStatusTitle}>The Ola map could not load.</p>
          <p className="mk-caption">Check your connection and map credentials, then try again.</p>
          <button type="button" className="mk-btn mk-btn--secondary mk-btn--sm" onClick={() => setAttempt((value) => value + 1)}>Retry map</button>
        </div>
      )}
    </div>
  )
}
