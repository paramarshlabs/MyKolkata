/* ==========================================================================
   The parts of the Ola (MapLibre) map this app calls, typed. The SDK's own
   types point at maplibre-gl's, which aren't installed, so without these
   every map call would be untyped.
   ========================================================================== */

export type LngLatTuple = [number, number]
export type Bounds = [LngLatTuple, LngLatTuple]

export type GeoJsonPoint = { type: 'Point'; coordinates: LngLatTuple }
export type GeoJsonLine = { type: 'LineString'; coordinates: LngLatTuple[] }
export type GeoJsonFeature<P = Record<string, unknown>> = {
  type: 'Feature'
  properties: P
  geometry: GeoJsonPoint | GeoJsonLine
}
export type GeoJsonCollection<P = Record<string, unknown>> = { type: 'FeatureCollection'; features: GeoJsonFeature<P>[] }

export type MapLayerEvent = {
  features?: { properties?: Record<string, unknown> }[]
  lngLat?: { lat: number; lng: number }
  originalEvent?: Event
  error?: unknown
}

export type GeoJsonSource = { setData(data: GeoJsonCollection): void }

export interface OlaMap {
  on(type: string, listener: (event: MapLayerEvent) => void): void
  on(type: string, layer: string, listener: (event: MapLayerEvent) => void): void
  once(type: string, listener: () => void): void
  off(type: string, listener: (event: MapLayerEvent) => void): void
  loaded(): boolean
  resize(): void
  remove(): void
  addControl(control: unknown, position?: string): void
  getCanvas(): HTMLCanvasElement
  getContainer(): HTMLElement
  addSource(id: string, source: { type: 'geojson'; data: GeoJsonCollection }): void
  getSource(id: string): GeoJsonSource | undefined
  addLayer(layer: Record<string, unknown>, beforeId?: string): void
  getLayer(id: string): unknown
  moveLayer(id: string, beforeId?: string): void
  setLayoutProperty(layer: string, name: string, value: unknown): void
  setPaintProperty(layer: string, name: string, value: unknown): void
  setFilter(layer: string, filter: unknown): void
  hasImage(id: string): boolean
  addImage(id: string, image: ImageData, options?: { pixelRatio?: number }): void
  fitBounds(bounds: Bounds, options?: Record<string, unknown>): void
  easeTo(options: Record<string, unknown>): void
  jumpTo(options: Record<string, unknown>): void
  getZoom(): number
  getCenter(): { lat: number; lng: number }
  getBounds(): { getNorth(): number; getSouth(): number; getEast(): number; getWest(): number }
}

export interface OlaMarker {
  setLngLat(position: LngLatTuple): OlaMarker
  addTo(map: OlaMap): OlaMarker
  remove(): void
  getElement(): HTMLElement
}

export interface OlaMapsApi {
  init(options: Record<string, unknown>): Promise<OlaMap>
  addNavigationControls(options?: Record<string, unknown>): unknown
  addMarker(options: { element: HTMLElement; anchor?: string; offset?: [number, number] }): OlaMarker
}

export const point = <P,>(lng: number, lat: number, properties: P): GeoJsonFeature<P> => ({
  type: 'Feature',
  properties,
  geometry: { type: 'Point', coordinates: [lng, lat] },
})

export const collection = <P,>(features: GeoJsonFeature<P>[]): GeoJsonCollection<P> => ({ type: 'FeatureCollection', features })

/* a south-west, north-east box around the points, padded a little so edge dots aren't clipped */
export function boundsOf(points: { lat: number; lng: number }[], padKm = 0.25): Bounds | null {
  if (!points.length) return null
  const lat = points.map((p) => p.lat)
  const lng = points.map((p) => p.lng)
  const dLat = padKm / 110.574
  const dLng = padKm / 102.3
  return [
    [Math.min(...lng) - dLng, Math.min(...lat) - dLat],
    [Math.max(...lng) + dLng, Math.max(...lat) + dLat],
  ]
}
