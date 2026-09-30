'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { clientOlaStyleUrl, proxiedOlaMapsUrl } from '@/lib/places/olaMapsProxy'
import type { OlaMap, OlaMapsApi } from './ola'

/* ==========================================================================
   One way to boot an Ola map, shared by /near-you and /pujo. Dark is the only
   style. It loads through our proxy (/api/maps/ola), so phone and LAN origins
   aren't blocked by Ola's browser-domain allowlist, and the server key never
   reaches the browser. `lazy` holds the SDK back until the map is near the
   screen: it's the heaviest thing on the page.
   ========================================================================== */

export type OlaMapStatus = 'waiting' | 'loading' | 'ready' | 'missing-key' | 'error'

export const KOLKATA_CENTER: [number, number] = [88.3639, 22.5726]

export function safeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || 'Unknown Ola Maps error')
  return message.replace(/([?&]api_key=)[^&\s]+/gi, '$1[redacted]')
}

/* MapLibre paints to a canvas sized at init — mobile URL bars and orientation
   change the container after that, so the canvas must be resized explicitly. */
export function waitForSizedContainer(element: HTMLElement) {
  return new Promise<void>((resolve) => {
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

export function bindMapResize(map: OlaMap, element: HTMLElement) {
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

export type OlaMapOptions = {
  /* wait until the map is near the viewport before downloading the SDK */
  lazy?: boolean
  /* where the camera starts; read at each (re)boot, so a retry can resume the last view */
  initialView?: () => { center: [number, number]; zoom: number }
  /* sources, layers and events, added before the map reports 'ready' */
  setup?: (map: OlaMap, olaMaps: OlaMapsApi) => void | Promise<void>
  /* last look at the map before it's removed, e.g. to remember the camera */
  beforeRemove?: (map: OlaMap) => void
  navigation?: boolean
}

export function useOlaMap(elementRef: RefObject<HTMLElement | null>, options: OlaMapOptions = {}) {
  const lazy = options.lazy ?? false
  /* handlers are bound once, so they read the latest options through a ref */
  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  })
  const [near, setNear] = useState(!lazy)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<OlaMapStatus>(lazy ? 'waiting' : 'loading')
  /* the map once it's ready, for effects that draw on it */
  const [map, setMap] = useState<OlaMap | null>(null)
  const mapRef = useRef<OlaMap | null>(null)
  const olaMapsRef = useRef<OlaMapsApi | null>(null)

  useEffect(() => {
    const element = elementRef.current
    if (near || !element) return
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      setNear(true)
    }, { rootMargin: '480px 0px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [elementRef, near])

  useEffect(() => {
    if (!near) return
    let cancelled = false
    let map: OlaMap | null = null
    let unbindResize = () => {}
    /* Constructor still wants a key; tile auth runs on the server proxy. */
    const apiKey = process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY || 'proxied'
    /* cellular + style fetch often exceeds a short desktop budget */
    const loadTimer = window.setTimeout(() => {
      if (!cancelled) setStatus((current) => (current === 'ready' ? current : 'error'))
    }, 25000)

    import('olamaps-web-sdk')
      .then(async ({ OlaMaps }) => {
        if (cancelled || !elementRef.current) return
        setStatus((current) => (current === 'waiting' ? 'loading' : current))

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

        const olaMaps = new OlaMaps({ apiKey }) as unknown as OlaMapsApi
        olaMapsRef.current = olaMaps
        const view = optionsRef.current.initialView?.() ?? { center: KOLKATA_CENTER, zoom: 13.5 }
        const created = await olaMaps.init({
          container: elementRef.current,
          /* the SDK only accepts a style URL string — it calls style.includes() */
          style: styleUrl,
          center: view.center,
          zoom: view.zoom,
          attributionControl: true,
          /* Overrides the SDK transform so every Ola URL goes through /api/maps/ola */
          transformRequest: (url: string) => ({ url: proxiedOlaMapsUrl(url) }),
        })
        map = created
        if (cancelled) {
          created?.remove()
          return
        }

        mapRef.current = created
        unbindResize = bindMapResize(created, elementRef.current)
        if (optionsRef.current.navigation !== false) {
          created.addControl(olaMaps.addNavigationControls({ showCompass: false }), 'bottom-right')
        }
        /* optional style resources fail now and then; that's a warning, never a broken map */
        created.on('error', (event) => {
          console.warn('Ola map resource error:', safeErrorMessage(event?.error))
        })

        let setupStarted = false
        const finishSetup = async () => {
          if (setupStarted) return
          setupStarted = true
          try {
            if (cancelled) return
            created.resize()
            await optionsRef.current.setup?.(created, olaMaps)
            if (cancelled) return
            created.resize()
            window.clearTimeout(loadTimer)
            setMap(created)
            setStatus('ready')
          } catch (error) {
            console.error('Ola map setup failed:', safeErrorMessage(error))
            if (!cancelled) setStatus('error')
          }
        }

        created.once('load', finishSetup)
        if (created.loaded()) finishSetup()
      })
      .catch((error) => {
        console.error('Ola map initialization failed:', safeErrorMessage(error))
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      window.clearTimeout(loadTimer)
      unbindResize()
      if (map) optionsRef.current.beforeRemove?.(map)
      mapRef.current = null
      olaMapsRef.current = null
      map?.remove()
    }
  }, [attempt, near, elementRef])

  const retry = useCallback(() => {
    setMap(null)
    setStatus('loading')
    setAttempt((value) => value + 1)
  }, [])

  return { status, map: status === 'ready' ? map : null, mapRef, olaMapsRef, retry }
}
