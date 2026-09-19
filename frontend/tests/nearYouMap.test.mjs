import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pageSource = await readFile(new URL('../app/(main)/near-you/NearYouClient.tsx', import.meta.url), 'utf8')
const mapSource = await readFile(new URL('../components/explore/NearYouMap.tsx', import.meta.url), 'utf8')
const stylesSource = await readFile(new URL('../styles/NearYou.module.css', import.meta.url), 'utf8')
const packageSource = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

test('Near You opens in map mode and replaces the map for Grid or List', () => {
  assert.match(pageSource, /\? searchParams\.get\('view'\) : 'map'\)/)
  assert.match(pageSource, /view === 'map' \? \(/)
  assert.match(pageSource, /styles\.gridView : styles\.listView/)
  assert.match(pageSource, /styles\.mapMode : styles\.resultsMode/)
})

test('selected places offer a safe Google Maps coordinate link', () => {
  assert.match(pageSource, /https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/)
  assert.match(pageSource, /encodeURIComponent\(`\$\{place\.coordinates\.lat\},\$\{place\.coordinates\.lng\}`\)/)
  assert.match(pageSource, /target="_blank"/)
  assert.match(pageSource, /rel="noopener noreferrer"/)
  assert.match(pageSource, /Open \$\{place\.name\} in Google Maps/)
  assert.match(stylesSource, /\.detailsFooter a:hover/)
})

test('Ola map places use real photos or category markers, each shown on its own', () => {
  assert.equal(packageSource.dependencies['olamaps-web-sdk'], '1.3.0')
  assert.match(mapSource, /import\('olamaps-web-sdk'\)/)
  assert.match(mapSource, /new OlaMaps\(\{ apiKey \}\)/)
  assert.doesNotMatch(mapSource, /cluster: true|clusterMaxZoom|clusterRadius|getClusterExpansionZoom/)
  assert.match(mapSource, /image\.src = source/)
  assert.match(mapSource, /CATEGORY_MARKERS/)
  assert.match(mapSource, /mykolkata-category-/)
  assert.match(mapSource, /map\.addImage\(imageId, imageData\)/)
  assert.doesNotMatch(mapSource, /PLACE_RING_LAYER_ID|mykolkata-place-rings/)
  assert.match(mapSource, /context\.arc\(32, 32, 29/)
  assert.doesNotMatch(mapSource, /index \+ 1/)
  assert.doesNotMatch(mapSource, /leaflet|OpenStreetMap/i)
  assert.doesNotMatch(pageSource, /leaflet|OpenStreetMap/i)
})

test('selected map photos use a restrained highlight ring — the one crimson on the map', () => {
  assert.match(mapSource, /'circle-radius': 22/)
  assert.match(mapSource, /'circle-stroke-width': 2/)
  assert.match(mapSource, /'circle-color': '#d72638'/)
  assert.doesNotMatch(mapSource, /'circle-radius': 34/)
})

test('Ola map configuration fails visibly and safely when the browser key is missing', () => {
  assert.match(mapSource, /process\.env\.NEXT_PUBLIC_OLA_MAPS_API_KEY \|\| 'proxied'/)
  assert.match(mapSource, /'missing-key'/)
  assert.match(mapSource, /Ola Maps is ready to connect\./)
  assert.match(mapSource, /clientOlaStyleUrl|proxiedOlaMapsUrl/)
  assert.match(mapSource, /olaMapsProxy/)
})

test('Ola resource diagnostics are redacted without treating optional style warnings as fatal', () => {
  assert.match(mapSource, /map\.on\('error'/)
  assert.match(mapSource, /safeErrorMessage\(event\?\.error\)/)
  assert.match(mapSource, /api_key=/)
  assert.doesNotMatch(mapSource, /map\.on\('error',[\s\S]{0,300}setStatus/)
  assert.match(mapSource, /Check your connection and map credentials/)
})

test('the map is always the dark style — there is no theme to switch', () => {
  assert.match(mapSource, /clientOlaStyleUrl\(\)/)
  assert.match(mapSource, /style: styleUrl,/)
  assert.doesNotMatch(mapSource, /styleResponse\.json\(\)/)
  assert.doesNotMatch(mapSource, /default-light-standard/)
  assert.doesNotMatch(mapSource, /useTheme|darkMode|setStyle|styledata/)
  assert.match(mapSource, /\}, \[attempt\]\)/)
  assert.match(mapSource, /map\.moveLayer\(layerId\)/)
})

test('map tiles go through the same-origin Ola proxy so phone LAN origins are allowed', () => {
  assert.match(mapSource, /proxiedOlaMapsUrl/)
  assert.match(mapSource, /transformRequest: \(url\) => \(\{ url: proxiedOlaMapsUrl\(url\) \}\)/)
})

test('map markers use brand surfaces and letters, not a rainbow', () => {
  assert.match(mapSource, /cafes: \{ color: '#3f0d12', label: 'C' \}/)
  assert.match(mapSource, /places: \{ color: '#1c2225', label: 'P' \}/)
  assert.doesNotMatch(mapSource, /#3157e5|#7946a8|#24765f|#f5c344|Manrope/)
  assert.match(stylesSource, /\.userMarker\s*\{[^}]*background: var\(--mk-taxi\)/s)
})

test('map mode fills the viewport and floats its controls under the notch bar', () => {
  assert.match(stylesSource, /\.mapMode\s*\{[^}]*height: 100dvh/s)
  assert.match(stylesSource, /\.mapFrame\s*\{[^}]*position: absolute;[^}]*inset: 0/s)
  assert.match(stylesSource, /\.mapOverlay\s*\{[^}]*position: absolute;[^}]*top: calc\(var\(--mk-nav\) \+ 8px\)/s)
  assert.match(stylesSource, /\.controlDeck\s*\{[^}]*backdrop-filter: blur\(26px\) saturate\(180%\)/s)
  assert.doesNotMatch(stylesSource, /\.mapMode\s*\{[^}]*min-height: 540px/s)
})

test('the Ola map resizes when the mobile viewport settles or rotates', () => {
  assert.match(mapSource, /function waitForSizedContainer/)
  assert.match(mapSource, /function bindMapResize/)
  assert.match(mapSource, /new ResizeObserver/)
  assert.match(mapSource, /visualViewport/)
  assert.match(mapSource, /orientationchange/)
  assert.match(mapSource, /map\.resize\(\)/)
})

test('Near You exposes compact filters and all three result views', () => {
  assert.match(pageSource, /aria-controls="near-you-filters"/)
  assert.match(pageSource, /aria-expanded=\{filtersOpen\}/)
  assert.match(pageSource, /const viewOptions = \[/)
  assert.match(pageSource, /id: 'map'/)
  assert.match(pageSource, /id: 'grid'/)
  assert.match(pageSource, /id: 'list'/)
  assert.match(pageSource, /event\.key === 'Escape'/)
  assert.doesNotMatch(stylesSource, /\.explorer \.viewToggle button \{ display: none; \}/)
})

test('mobile map filters stay below the control deck instead of escaping the viewport', () => {
  assert.match(stylesSource, /@media \(max-width: 767px\)[\s\S]*?\.filterStack\s*\{[^}]*top: calc\(100% \+ 8px\);[^}]*max-height: min\(58dvh,480px\);[^}]*overflow-y: auto/s)
  assert.doesNotMatch(stylesSource, /\.filterStack\s*\{[^}]*position: fixed/s)
})

test('mobile category and area chips support horizontal touch scrolling', () => {
  assert.match(stylesSource, /@media \(max-width: 767px\)[\s\S]*?\.categoryFilters, \.areaFilters\s*\{[^}]*overflow-x: auto;[^}]*touch-action: pan-x pan-y;[^}]*-webkit-overflow-scrolling: touch;/s)
  assert.match(stylesSource, /\.categoryFilters button, \.areaFilters button\s*\{[^}]*flex: 0 0 auto;/s)
  assert.match(pageSource, /function FilterScroller/)
  assert.doesNotMatch(pageSource, /setPointerCapture|onPointerMove=|onClickCapture=/)
  assert.match(pageSource, /onClick=\{\(\) => onCategoryChange\(item\)\}/)
  assert.match(pageSource, /onClick=\{\(\) => onAreaChange\(item\)\}/)
})

test('Near You never labels generic category artwork as a venue photo', () => {
  assert.match(pageSource, /place\.hasRealImage && place\.image/)
  assert.match(pageSource, /Photo not available for \$\{place\.name\}/)
  assert.match(pageSource, /<PlaceVisual place=\{place\}/)
})

test('Near You uses truthful loading skeletons instead of demo-place fallbacks', () => {
  assert.match(pageSource, /function PlaceResultsSkeleton\(\{ layout \}\)/)
  assert.match(pageSource, /dataStatus === 'loading' \? \(\s*<PlaceResultsSkeleton layout=\{view\}/s)
  assert.match(pageSource, /<AlponaLoader label="Loading Kolkata places"/)
  assert.match(pageSource, /dataStatus === 'success' && !visiblePlaces\.length/)
  assert.doesNotMatch(pageSource, /setDataPlaces\(nearbyPlaces/)
  assert.doesNotMatch(pageSource, /Showing saved Kolkata picks/)
  assert.match(stylesSource, /\.placeSkeleton/)
  assert.doesNotMatch(stylesSource, /@keyframes/)
})

test('Near You only measures distance from somewhere meaningful', () => {
  assert.match(pageSource, /if \(origin\.source === 'user'\) return `\$\{place\.distance\} away`/)
  assert.match(pageSource, /return `\$\{place\.distance\} from \$\{origin\.label\}`/)
  assert.match(pageSource, /locationKnown \? 'Near you' : 'Kolkata map'/)
  assert.match(pageSource, /origin\.source === 'user'\s*\? 'Near you'/s)
  assert.match(pageSource, /routeLocate === '1'/)
  assert.match(pageSource, /locate && !label/)
  assert.match(pageSource, /window\.isSecureContext/)
  assert.match(pageSource, /GEO_OPTIONS/)
})

test('Near You never shows an empty answer for a request that is still on its way', () => {
  assert.match(pageSource, /const requestKey = requestUrl \? `\$\{requestUrl\}#\$\{retryVersion\}` : ''/)
  assert.match(pageSource, /holdForLocation \|\| typing \|\| result\.key !== requestKey \? 'loading' : result\.status/)
  assert.doesNotMatch(pageSource, /No Kolkata stops match that search/)
  assert.doesNotMatch(pageSource, /exploreData|findExploreGuide|searchNearbyPlaces/)
})

test('visitors can explore around themselves, a searched area, any place, or the map view', () => {
  assert.match(pageSource, /source: 'user', radiusKm: NEAR_YOU_RADIUS_KM/)
  assert.match(pageSource, /const exploreArea = \(anchor\) =>/)
  assert.match(pageSource, /Explore around \{areaAnchor\.name\}/)
  assert.match(pageSource, /const exploreAround = \(place\) =>/)
  assert.match(pageSource, /What&apos;s nearby/)
  assert.match(pageSource, /exploreRequest\(\{/)
})

test('the map lists what it shows in a rail that selects the place', () => {
  assert.match(pageSource, /className=\{`\$\{styles\.resultsRail\}/)
  assert.match(pageSource, /onClick=\{\(\) => selectPlace\(place\.id\)\}/)
  assert.match(stylesSource, /\.resultsRail\s*\{[^}]*overflow-x: auto/s)
})

test('the map moves once per camera key and leaves a viewport the visitor chose alone', () => {
  assert.match(mapSource, /camera\.key === appliedCameraKeyRef\.current/)
  assert.match(mapSource, /map\.once\('load', finishSetup\)/)
  assert.match(pageSource, /if \(origin\.source === 'map'\) return null/)
})

test('Search this area applies the current geographic viewport', () => {
  assert.match(mapSource, /bounds\.getNorth\(\)/)
  assert.match(mapSource, /bounds\.getSouth\(\)/)
  assert.match(pageSource, /const searchThisArea = \(\) =>/)
  assert.match(pageSource, /source: 'map', radiusKm: Math\.min\(Math\.max\(corner, 0\.4\), 15\)/)
  assert.match(pageSource, />\s*Search this area\s*</)
})

test('Near You sets type from the brand families, never from weight or capitals', () => {
  assert.doesNotMatch(stylesSource, /Anek|Manrope|@font-face/)
  assert.match(stylesSource, /font-family: var\(--mk-display\)/)
  assert.doesNotMatch(stylesSource, /font-weight:\s*[5-9]00/)
  assert.doesNotMatch(stylesSource, /text-transform:\s*uppercase/)
})

test('Near You renders without the undefined Head element and without mojibake', () => {
  assert.doesNotMatch(pageSource, /<Head>|â€/)
  assert.doesNotMatch(mapSource, /â€/)
})

test('Near You search is the house line input, which draws its focus rule', () => {
  assert.match(pageSource, /className=\{`mk-line \$\{styles\.searchBox\}`\}/)
  assert.doesNotMatch(stylesSource, /\.root input:focus-visible/)
})

test('Near You map chrome sits on the brand surfaces', () => {
  assert.match(stylesSource, /\.map :global\(\.maplibregl-ctrl-group\)[^}]*background: var\(--mk-ink\)/s)
  assert.match(stylesSource, /\.placeDetails\s*\{[^}]*background: var\(--mk-ink\)/s)
  assert.doesNotMatch(stylesSource, /:global\(\.dark\)|leaflet-tile-pane|#14243a/)
})

test('the map legend uses the pin letters and selects a kind of place', () => {
  assert.match(mapSource, /export const CATEGORY_MARKERS/)
  assert.match(pageSource, /function MapLegend\(/)
  assert.match(pageSource, /aria-controls="near-you-legend"/)
  assert.match(pageSource, /onCategoryChange\(category === name \? 'All' : name\)/)
  assert.match(stylesSource, /\.legendRow\[aria-pressed="true"\]/)
})
