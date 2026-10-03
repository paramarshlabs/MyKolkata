'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { AreaSummary } from '@/lib/pujo/build'
import type { ClientIndex, ClientPujo } from '@/lib/pujo/client'
import type { LatLng } from '@/lib/pujo/geo'
import type { Station } from '@/lib/pujo/pois'
import { buildSearchIndex, type SearchIndex, type SearchableFood } from '@/lib/pujo/search'

/* ==========================================================================
   Everything the Pujo screens share on the phone: the index (every pujo,
   area and station), its search index, the pujo whose sheet is open, and
   "Near me". The position from "Near me" stays in this tab: it sorts lists
   and draws a dot, and is never sent anywhere.
   ========================================================================== */

export type NearMe = {
  status: 'off' | 'asking' | 'on' | 'denied' | 'unavailable'
  position: LatLng | null
  request: () => void
  stop: () => void
}

type PujoContext = {
  index: ClientIndex
  pujo: (slug: string | null | undefined) => ClientPujo | undefined
  station: (id: string | null | undefined) => Station | undefined
  area: (id: string | null | undefined) => AreaSummary | undefined
  searchIndex: SearchIndex<ClientPujo, SearchableFood>
  selected: string | null
  open: (slug: string) => void
  close: () => void
  nearMe: NearMe
}

const Context = createContext<PujoContext | null>(null)

function useNearMe(): NearMe {
  const [state, setState] = useState<Pick<NearMe, 'status' | 'position'>>({ status: 'off', position: null })
  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator) || !window.isSecureContext) {
      setState({ status: 'unavailable', position: null })
      return
    }
    setState((current) => ({ ...current, status: 'asking' }))
    navigator.geolocation.getCurrentPosition(
      (found) => setState({ status: 'on', position: { lat: found.coords.latitude, lng: found.coords.longitude } }),
      (error) => setState({ status: error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable', position: null }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  }, [])
  const stop = useCallback(() => setState({ status: 'off', position: null }), [])
  return useMemo(() => ({ ...state, request, stop }), [state, request, stop])
}

/* the pujo a link asked for (lib/pujo/links.ts, or an Instagram post through
   /share): read from the address in the browser only, so the page itself stays
   the same cached page for everyone */
const noSubscribe = () => () => {}
const linkedSlug = () => new URLSearchParams(window.location.search).get('pandal')
const noLinkedSlug = () => null

export function PujoProvider({ index, food = [], children }: { index: ClientIndex; food?: SearchableFood[]; children: ReactNode }) {
  /* undefined until someone opens or closes a sheet: until then, the link's */
  const [picked, setSelected] = useState<string | null | undefined>(undefined)
  const linked = useSyncExternalStore(noSubscribe, linkedSlug, noLinkedSlug)
  /* where focus goes back to when a sheet closes */
  const opener = useRef<HTMLElement | null>(null)
  const nearMe = useNearMe()

  const lookups = useMemo(() => {
    const pujos = new Map(index.pujos.map((p) => [p.slug, p]))
    const stations = new Map(index.stations.map((s) => [s.id, s]))
    const areas = new Map(index.areas.map((a) => [a.id, a]))
    return {
      pujo: (slug: string | null | undefined) => (slug ? pujos.get(slug) : undefined),
      station: (id: string | null | undefined) => (id ? stations.get(id) : undefined),
      area: (id: string | null | undefined) => (id ? areas.get(id) : undefined),
    }
  }, [index])

  const searchIndex = useMemo(
    () => buildSearchIndex({ pujos: index.pujos, food, stations: index.stations, areas: index.areas }),
    [index, food],
  )

  const open = useCallback((slug: string) => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement && !opener.current) {
      opener.current = document.activeElement
    }
    setSelected(slug)
  }, [])

  const selected = picked === undefined ? (lookups.pujo(linked) ? linked : null) : picked

  const close = useCallback(() => {
    setSelected(null)
    /* closed: a reload or a share from here shouldn't open it again */
    const url = new URL(window.location.href)
    if (url.searchParams.has('pandal')) {
      url.searchParams.delete('pandal')
      window.history.replaceState(window.history.state, '', url)
    }
    const back = opener.current
    opener.current = null
    if (back?.isConnected) requestAnimationFrame(() => back.focus())
  }, [])

  const value = useMemo(
    () => ({ index, ...lookups, searchIndex, selected, open, close, nearMe }),
    [index, lookups, searchIndex, selected, open, close, nearMe],
  )
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function usePujo() {
  const value = useContext(Context)
  if (!value) throw new Error('usePujo must be used inside PujoProvider')
  return value
}
