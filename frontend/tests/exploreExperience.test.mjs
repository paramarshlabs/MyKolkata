import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import test from 'node:test'

const pageSource = await readFile(new URL('../app/(main)/places/PlacesClient.tsx', import.meta.url), 'utf8')
const stylesSource = await readFile(new URL('../styles/Explore.module.css', import.meta.url), 'utf8')
const heroAsset = await stat(new URL('../public/explore-hero-v2.webp', import.meta.url))

test('Explore hero leads with a useful Kolkata plan and direct map action', () => {
  assert.match(pageSource, /Find your next Kolkata plan\./)
  assert.match(pageSource, /mapHref\(\{ locate: true \}\)/)
  assert.match(pageSource, /Open the live map/)
  assert.doesNotMatch(pageSource, /Tonight’s easy plan|heroPlan|FaClock/)
  assert.doesNotMatch(pageSource, /CAL\s*24/)
})

test('Explore hands a known location to the map instead of re-asking GPS', () => {
  assert.match(pageSource, /mapHref\(\{ origin, locate: true \}\)/)
  assert.match(pageSource, /window\.isSecureContext/)
  assert.match(pageSource, /timeout: 20000/)
})

test('Explore hero is the brand banner: a full-bleed photograph, a scrim, content bottom-left', () => {
  assert.match(pageSource, /src="\/explore-hero-v2\.webp"/)
  assert.ok(heroAsset.size > 50_000 && heroAsset.size < 500_000)
  assert.match(pageSource, /className="mk-banner"/)
  assert.match(pageSource, /className="mk-banner-img"/)
  assert.match(pageSource, /className="mk-banner-scrim"/)
  /* no accenting one word of a headline in a different colour — design.md §4.6 */
  assert.doesNotMatch(pageSource, /heroCity/)
})

test('Explore hero search is the house line input, and one primary button leads', () => {
  assert.match(pageSource, /className=\{`mk-line \$\{styles\.searchForm\}`\}/)
  assert.equal(pageSource.match(/mk-btn--primary/g)?.length, 1)
})

test('Explore hero shortcuts pick a kind of place rather than typing a word into search', () => {
  assert.match(pageSource, /const heroShortcuts = exploreCategories\.filter/)
  assert.match(pageSource, /aria-label="Explore shortcuts"/)
  assert.match(pageSource, /changeCategory\(activeCategory === name \? 'All' : name\)/)
  assert.doesNotMatch(pageSource, /changeQuery\(label\)/)
  assert.match(stylesSource, /@media \(max-width: 900px\)[\s\S]*\.heroShortcuts\s*\{[^}]*display: none/s)
})

test('Explore hides the large category section only while a text search is active', () => {
  assert.match(pageSource, /\{!query\.trim\(\) && \(\s*<section className=\{`\$\{styles\.categorySection\}/s)
})

test('categories come from the shared taxonomy, not a page-local list', () => {
  assert.match(pageSource, /from '@\/lib\/livePlaces'/)
  assert.match(pageSource, /exploreCategories\.map\(\(category\) =>/)
  assert.doesNotMatch(pageSource, /exploreData|trendingPlaces|hiddenKolkata|collections|nearbyPlaces/)
})

test('search and category results are live requests keyed by what was asked', () => {
  assert.match(pageSource, /function useLivePlaces\(url\)/)
  assert.match(pageSource, /state\.url !== url \? 'loading' : state\.status/)
  assert.match(pageSource, /exploreRequest\(\{\s*query: debouncedQuery,/s)
  assert.match(pageSource, /controller\.abort\(\)/)
})

test('Explore result grid pages through live results and hands off to the map', () => {
  assert.match(pageSource, /<Card\s/)
  assert.match(stylesSource, /\.categorySectionActive \+ \.resultsSection/)
  assert.match(pageSource, /const RESULT_BATCH_SIZE = 8/)
  assert.match(pageSource, /displayedItems\.slice\(0, visibleResultCount\)/)
  assert.match(pageSource, /setPaging\(\{ url: resultsUrl, count: visibleResultCount \+ RESULT_BATCH_SIZE \}\)/)
  assert.match(pageSource, /Show \{Math\.min\(RESULT_BATCH_SIZE, remainingResultCount\)\} more/)
  assert.match(pageSource, /View all on map/)
  assert.match(pageSource, /select: item\.id/)
  assert.match(stylesSource, /\.resultActions/)
})

test('a searched neighbourhood offers to explore around it', () => {
  assert.match(pageSource, /results\.meta\?\.area/)
  assert.match(pageSource, /Explore around \{areaAnchor\.name\}/)
})

test('Explore loads with the alpona line and quiet placeholders — no spinner, no shimmer', () => {
  assert.match(pageSource, /function ExploreResultsSkeleton\(/)
  assert.match(pageSource, /searchStatus === 'loading' \? \(\s*<>\s*<AlponaLoader/s)
  assert.match(pageSource, /<ExploreResultsSkeleton \/>/)
  assert.match(stylesSource, /\.resultSkeleton/)
  assert.doesNotMatch(stylesSource, /@keyframes/)
})

test('the opening rows are live lists around the visitor, closest first', () => {
  assert.match(pageSource, /function NearbyRow\(\{ category, origin \}\)/)
  assert.match(pageSource, /const rowCategories = \[/)
  assert.match(pageSource, /navigator\.permissions\?\.query\(\{ name: 'geolocation' \}\)/)
  assert.match(pageSource, /permission\.state === 'granted'/)
  assert.match(pageSource, />\s*See all\s*</)
})

test('Explore only says "near you" once the visitor has shared where they are', () => {
  assert.match(pageSource, /origin\.source === 'user' \? 'near you' : 'around central Kolkata'/)
  assert.match(pageSource, /origin\.source === 'user' \? 'Near you' : 'Around central Kolkata'/)
  assert.match(pageSource, /if \(origin\.source === 'user' && place\.distance\)/)
})

test('Explore copy avoids emoji decoration and Pujo content', () => {
  assert.doesNotMatch(pageSource, /🔥|📍|🤫|🗺️|Pujo|Pandal/i)
})

test('Explore sets type from the brand families and never from weight or capitals', () => {
  assert.doesNotMatch(stylesSource, /Anek|Manrope|@font-face/)
  assert.match(stylesSource, /font-family: var\(--mk-display\)/)
  assert.doesNotMatch(stylesSource, /font-weight:\s*[5-9]00/)
  assert.doesNotMatch(stylesSource, /text-transform:\s*uppercase/)
  assert.doesNotMatch(pageSource, /sectionEyebrow|eyebrow=/)
})

test('Explore rows bleed to the edge on phones', () => {
  assert.match(stylesSource, /@media \(max-width: 640px\)[\s\S]*\.rowOffset\s*\{[^}]*margin-inline: calc\(-1 \* var\(--mk-edge\)\)/s)
})
