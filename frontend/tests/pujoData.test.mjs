// Tests for the /pujo data layer (lib/pujo): display names, the spelling
// normaliser, the curated fixes to the scraped rows, areas, the famous tier,
// nearest Metro, and search.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fullName, shortName, titleCase } from '../lib/pujo/names.ts'
import { fold, foldWord, wordMatch, withinEdits } from '../lib/pujo/normalise.ts'
import { DUPLICATES, EXCLUDED, NAME_OVERRIDES, PIN_FIXES, UNPINNED, curatedSlugs } from '../lib/pujo/curation.ts'
import { AREAS, ZONES, areaForPincode, areaFromText, pincodeFromText, zoneFromData } from '../lib/pujo/sectors.ts'
import { buildIndex, findPujo, isRoutable, placeFrom, tierLabel } from '../lib/pujo/build.ts'
import { linesFromText, placesFromRows } from '../lib/pujo/pois.ts'
import { nearestPujos, toClientIndex } from '../lib/pujo/client.ts'
import { buildSearchIndex, noMatch, parseQuery, search } from '../lib/pujo/search.ts'
import { formatKm, straightKm, walkKm, walkMinutes } from '../lib/pujo/geo.ts'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')

/* ------------------------------------------------------------ names -- */

test('short names drop the committee words people never say', () => {
  assert.equal(shortName('HATIBAGAN SARBOJONIN DURGOTSAB COMMITTEE'), 'Hatibagan Sarbojonin')
  assert.equal(shortName('BAGBAZAR SARBOJANIN DURGOTSAV & EXHIBITION'), 'Bagbazar Sarbojanin')
  assert.equal(shortName('22 NO. PALLY BASI BINDO DURGA PUJA PANDAL'), '22 No. Pally Basi Bindo')
  assert.equal(shortName('MADDOX SQUARE DURGA PUJO'), 'Maddox Square')
  assert.equal(shortName('SINGHI PARK SARBOJANIN DURGAPUJA COMMITTEE'), 'Singhi Park Sarbojanin')
  assert.equal(shortName('GOLF GREEN SARODOTSAVA COMMITTEE PHASE -II'), 'Golf Green Phase II')
  assert.equal(shortName('BAGMARI BAZAR SARBOJONIN DURGA UTSAV COMMITTEE'), 'Bagmari Bazar Sarbojonin')
  assert.equal(shortName('BARUIPUR SARBOJONIN PUJA O UTSAV SANGHA DURGA MANDIR'), 'Baruipur Sarbojonin')
  assert.equal(shortName('SHYAMSQUARE SARBOJANIN DUEGAPUJA O PRADARSHANI'), 'Shyamsquare Sarbojanin')
  assert.equal(shortName('CHAKRABORTY BARIR DURGA PUJO'), 'Chakraborty Bari')
})

test('a bracketed place belongs to the full name, not the short one', () => {
  assert.equal(shortName('SURUCHI SANGHA (NEW ALIPORE)'), 'Suruchi Sangha')
  assert.equal(fullName('SURUCHI SANGHA (NEW ALIPORE)'), 'Suruchi Sangha (New Alipore)')
  assert.equal(shortName('SANTOSH MITRA SQUARE (LEBUTALA)'), 'Santosh Mitra Square')
  /* notes that aren't a name at all go from both */
  assert.equal(fullName('JODHPUR PARK SARBOJANIN (DISTINCT FROM 95 PALLY)'), 'Jodhpur Park Sarbojanin')
  assert.equal(fullName('ACHARYA PRAFULLA PALLY ADI SARBAJONIN DURGOTSAV (EST. 1950)'), 'Acharya Prafulla Pally Adi Sarbajonin Durgotsav')
})

test('a name that was all filler keeps its words, or the place it names', () => {
  assert.equal(shortName('DURGA PUJA PANDAL (TARATALA)'), 'Taratala')
  assert.equal(shortName('DURGA PUJA COMMITTEE (TRIANGULAR PARK)'), 'Triangular Park')
  assert.equal(shortName('MAA DURGA PANDAL (BALAKA ABASAN)'), 'Balaka Abasan')
  assert.equal(shortName('SARBOJANIN DURGOUTSAV COMMITTEE'), 'Sarbojanin Durgoutsav Committee')
})

test('title case keeps Salt Lake blocks, initials and numerals, and nothing else, in capitals', () => {
  assert.equal(titleCase('SALT LAKE FD BLOCK'), 'Salt Lake FD Block')
  assert.equal(shortName('AE (PART-2) DURGA PUJA'), 'AE Block')
  assert.equal(titleCase('NEWTOWN AA-I CA BLOCK CULTURAL ASSOCIATION'), 'Newtown AA-I CA Block Cultural Association')
  assert.equal(titleCase('HARI NATH DE ROAD BAROWARI'), 'Hari Nath De Road Barowari')
  assert.equal(titleCase('KALITALA & R K DAS ROAD'), 'Kalitala & R K Das Road')
  assert.equal(titleCase('66-PALLI'), '66-Palli')
  assert.equal(titleCase('SREEBHUMI 7TH LANE'), 'Sreebhumi 7th Lane')
  assert.equal(titleCase("JORASANKO SHIB KRISHNA DAW'S BARI"), "Jorasanko Shib Krishna Daw's Bari")
  assert.equal(titleCase('BAGBAZAR PALLY PUJA O PRODORSHONI'), 'Bagbazar Pally Puja o Prodorshoni')
})

/* ------------------------------------------------------- normaliser -- */

test('every spelling in the data folds to one', () => {
  const same = (...variants) => {
    const folded = variants.map((v) => fold(v).join(' '))
    assert.ok(folded.every((f) => f === folded[0]), `${variants.join(' / ')} → ${folded.join(' / ')}`)
  }
  same('Sarbojanin', 'Sarbojonin', 'Sarbajanin', 'SARVAJANIN', 'sarbajonin')
  same('Durgotsab', 'Durgotsav', 'Durgotsob', 'Durgatsab', 'Durgautsab', 'Durgoutsav')
  same('Pally', 'Palli')
  same('Samity', 'Samiti')
  same('Bagbazar', 'Baghbazar')
  same('Kumartuli', 'Kumortuli', 'Kumartuly')
  same('Shobhabazar', 'Sovabazar', 'Sobhabazar')
  same('Bhowanipore', 'Bhowanipur')
  same('Phoolbagan', 'Fulbagan')
  same('Sreebhumi', 'Shreebhumi', 'Sribhumi')
  same('Beleghata', 'Beliaghata')
  same('Chhatra', 'Chatra')
})

test('numbers stay as typed, and places that differ stay apart', () => {
  assert.equal(foldWord('700006'), '700006')
  assert.equal(foldWord('25'), '25')
  assert.notEqual(fold('Bagbazar').join(), fold('Bowbazar').join())
  assert.equal(withinEdits('mahamad', 'mahamid'), true)
  assert.equal(withinEdits('abcdef', 'abxyef'), false)
  assert.equal(wordMatch('bag', 'bagbajar'), 2)
  assert.equal(wordMatch('bagbajar', 'bagbajar'), 3)
  assert.equal(wordMatch('mahamid', 'mahamad'), 1)
  assert.equal(wordMatch('mahamid', 'mahamad', false), 0)
})

/* ---------------------------------------------------------- curation -- */

test('the curated fixes are consistent: one home per slug, nothing both kept and merged', () => {
  const canonicals = Object.keys(DUPLICATES)
  const merged = Object.values(DUPLICATES).flat()
  assert.equal(new Set(merged).size, merged.length, 'a slug is merged into two pujos')
  for (const slug of canonicals) assert.ok(!merged.includes(slug), `${slug} is kept and merged`)
  for (const slug of [...canonicals, ...merged]) assert.ok(!EXCLUDED.has(slug), `${slug} is merged and excluded`)
  for (const slug of Object.keys(PIN_FIXES)) assert.ok(!UNPINNED.has(slug), `${slug} is fixed and unpinned`)
  for (const slug of curatedSlugs()) assert.match(slug, /^[a-z0-9-]+$/)
  /* the plan's four, and the two carnival ranks that sit on hidden rows */
  assert.ok(DUPLICATES['bagbazar-sarbojanin-durga-puja-mandap'].includes('bagbazar-sarbojanin-durgotsav-exhibition'))
  assert.ok(DUPLICATES['chetla-agroni-club'].includes('chetla-agrani-durga-puja-pandal'))
  assert.ok(DUPLICATES['ahiritola-jubakbrinda-sarbojanin-sarodotsab'])
  assert.ok(DUPLICATES['deshapriyanagar-sadharon-durgotsab'])
  assert.ok(DUPLICATES.sammilani.includes('tridhara'))
  assert.ok(NAME_OVERRIDES['chetla-agroni-club'])
})

test('every moved pin lands in Kolkata, and United Club moves to Ultadanga', () => {
  for (const [slug, fix] of Object.entries(PIN_FIXES)) {
    assert.ok(straightKm(fix, { lat: 22.5726, lng: 88.3639 }) < 40, slug)
  }
  const ultadanga = { lat: 22.5937, lng: 88.3907 }
  assert.ok(straightKm(PIN_FIXES['united-club'], ultadanga) < 1)
})

/* ----------------------------------------------------------- sectors -- */

test('areas: every pincode in one area, every area in a zone, and names for the places', () => {
  const pincodes = AREAS.flatMap((area) => area.pincodes)
  assert.equal(new Set(pincodes).size, pincodes.length, 'a pincode is in two areas')
  assert.equal(new Set(AREAS.map((area) => area.id)).size, AREAS.length)
  for (const area of AREAS) {
    assert.ok(ZONES.some((zone) => zone.id === area.zone), area.id)
    assert.ok(area.keywords.length > 0, `${area.id} has no keywords`)
    assert.match(area.name, /^[A-Z]/)
  }
  /* the plan's examples */
  assert.equal(areaForPincode('700003').id, 'bagbazar-kumartuli')
  assert.equal(areaForPincode('700006').id, 'hatibagan-shyambazar')
  assert.equal(areaForPincode('700029').id, 'ballygunge-gariahat')
  assert.equal(areaForPincode('700026').id, 'kalighat-bhowanipore')
  assert.equal(areaForPincode('700034').id, 'behala-barisha')
  assert.equal(areaForPincode('700084').id, 'jadavpur-garia')
  assert.equal(areaForPincode('999999'), null)
})

test('zones, pincodes in addresses, and places named in text', () => {
  assert.equal(zoneFromData('others'), 'suburbs')
  assert.equal(zoneFromData('north'), 'north')
  assert.equal(zoneFromData('nowhere'), null)
  assert.equal(pincodeFromText('4 Gouri Bari Ln, Manicktala, Kolkata 700004'), '700004')
  assert.equal(pincodeFromText('Makhla Rd, Uttarpara 712233'), '712233')
  assert.equal(pincodeFromText('no pincode here'), null)
  assert.equal(areaFromText('ULTADANGA SANGRAMI SARBOJANIN').id, 'ultadanga-beleghata')
  /* the longest keyword wins */
  assert.equal(areaFromText('Dum Dum Park Bharat Chakra').id, 'lake-town-baguiati')
  assert.equal(areaFromText('Manicktala 14er Pally').id, 'hatibagan-shyambazar')
  assert.equal(areaFromText('Somewhere unnamed'), null)
})

/* ------------------------------------------------------------- build -- */

const row = (slug, over = {}) => ({
  slug, name: slug.toUpperCase().replaceAll('-', ' '), zone: 'north', locality: null, address: null, pincode: null,
  lat: null, lng: null, is_hidden: false, is_featured: false, red_road_carnival_rank: null, carnival_awards: [], ...over,
})

const PANDALS = [
  row('bagbazar-sarbojanin-durga-puja-mandap', { name: 'BAGBAZAR SARBOJANIN DURGA PUJA MANDAP', pincode: '700003', lat: 22.60478, lng: 88.366177, locality: '213, Baghbazar, Kolkata 700003' }),
  row('bagbazar-sarbojanin-durgotsav-exhibition', { name: 'BAGBAZAR SARBOJANIN DURGOTSAV & EXHIBITION', pincode: '700003', lat: 22.60449, lng: 88.365615, is_hidden: true, red_road_carnival_rank: 4, carnival_awards: ['107-Year Heritage Icon'] }),
  row('bagbazar-pally-puja-o-prodorshoni', { name: 'BAGBAZAR PALLY PUJA O PRODORSHONI', pincode: '700003', lat: 22.601208, lng: 88.366823 }),
  row('chetla-agroni-club', { name: 'CHETLA AGRONI CLUB', zone: 'south', pincode: '700027', lat: 22.5164, lng: 88.336837, is_featured: true }),
  row('chetla-agrani-durga-puja-pandal', { name: 'CHETLA AGRANI DURGA PUJA PANDAL', zone: 'south', pincode: '700027', lat: 22.516388, lng: 88.337111, is_hidden: true, red_road_carnival_rank: 1, carnival_awards: ['Biswa Bangla Sharad Samman', 'Best Idol'] }),
  row('kumartuli-park-sarbojanin-durgotsab', { name: 'KUMARTULI PARK SARBOJANIN DURGOTSAB', pincode: '700005', lat: 22.598983, lng: 88.361466, is_featured: true, red_road_carnival_rank: 8 }),
  row('hatibagan-sarbojonin-durgotsab-committee', { name: 'HATIBAGAN SARBOJONIN DURGOTSAB COMMITTEE', pincode: '700006', lat: 22.594386, lng: 88.372, is_featured: true }),
  row('goabagan-sarodatsav-sammilani', { name: 'GOABAGAN SARODATSAV SAMMILANI', zone: 'south', pincode: '700006', lat: 22.48582, lng: 88.389733 }),
  row('united-club', { name: 'United Club', zone: 'north', locality: 'Ultadanga Main Road SO', lat: 22.465594, lng: 88.359239 }),
  row('ultadanga-sangrami-sarbojanin', { name: 'ULTADANGA SANGRAMI SARBOJANIN', zone: 'south' }),
  row('cd-block-durga-puja', { name: 'CD BLOCK DURGA PUJA', zone: 'east', pincode: '700107', lat: 22.574593, lng: 88.464944 }),
  row('new-town-durga-puja-committee-bg-block', { name: 'NEW TOWN DURGA PUJA COMMITTEE, BG BLOCK', zone: 'east', pincode: '700163', lat: 22.582274, lng: 88.458849, is_featured: true }),
  row('kasba-shakti-sangha', { name: 'KASBA SHAKTI SANGHA', zone: 'east', pincode: '700107', lat: 22.5112, lng: 88.3905 }),
  row('kasba-rathtala-club', { name: 'KASBA RATHTALA CLUB', zone: 'east', pincode: '700042', lat: 22.5155, lng: 88.3861 }),
  row('mallick-bari-bhowanipore', { name: 'MALLICK BARI (BHOWANIPORE)', zone: 'south', pincode: '700020', lat: 22.533598, lng: 88.349092 }),
  row('mallick-bari-pathuriaghatasingha-bahini', { name: 'MALLICK BARI (PATHURIAGHATA/SINGHA BAHINI)', pincode: '700006', lat: 22.590074, lng: 88.356973 }),
  row('dum-dum-park-tarun-sangha', { name: 'DUM DUM PARK TARUN SANGHA', zone: 'east', pincode: '700055', lat: 22.610051, lng: 88.411488, is_featured: true }),
  row('dum-dum-park-yubak-brinda', { name: 'DUM DUM PARK YUBAK BRINDA', zone: 'east', pincode: '700055', lat: 22.605496, lng: 88.417748 }),
  row('dum-dum-park-bharat-chakra', { name: 'DUM DUM PARK BHARAT CHAKRA', zone: 'east', pincode: '700055', lat: 22.610821, lng: 88.4146 }),
  row('bowbazar-47-palli-milansree-welfare-society', { name: 'BOWBAZAR 47 PALLI MILANSREE WELFARE SOCIETY', zone: 'central' }),
  row('connectivity-test', { name: 'Durga Puja Pandal', zone: 'south', is_hidden: true }),
  row('kali-puja-pandal-green-park-dum-dum', { name: 'KALI PUJA PANDAL (GREEN PARK, DUM DUM)', pincode: '700028', lat: 22.638536, lng: 88.416946 }),
]

const POIS = [
  { id: 'shyambazar-metro-station', name: 'Shyambazar', category: 'metro-station', address: 'Shyambazar, Blue Line, Kolkata Metro', lat: 22.601313, lng: 88.372586 },
  { id: 'shobhabazar-sutanuti-metro-station', name: 'Shobhabazar Sutanuti', category: 'metro-station', address: 'Shobhabazar Sutanuti, Blue Line, Kolkata Metro', lat: 22.596029, lng: 88.365285 },
  { id: 'kalighat-metro-station', name: 'Kalighat', category: 'metro-station', address: 'Kalighat, Blue Line, Kolkata Metro', lat: 22.516652, lng: 88.346003 },
  { id: 'noapara-metro-station', name: 'Noapara', category: 'metro-station', address: 'Noapara, Blue/Yellow Line Interchange, Kolkata Metro', lat: 22.63972, lng: 88.39389 },
  { id: 'victoria-memorial-popular-landmark', name: 'Victoria Memorial', category: 'popular-landmark', address: 'Queens Way', lat: 22.5448, lng: 88.3426 },
  { id: 'lake-police-station-police-station', name: 'Lake Police Station', category: 'police-station', address: '37/1, Sarat Bose Road', lat: 22.5315, lng: 88.3484, phone: '033-2486-1000' },
  { id: 'peter-cat-restaurant', name: 'Peter Cat', category: 'restaurant', address: '18A, Park Street', lat: 22.5556, lng: 88.3507 },
]

const index = buildIndex({ pandals: PANDALS, pois: POIS })
const bySlug = (slug) => index.pujos.find((pujo) => pujo.slug === slug)

test('duplicates merge, and a carnival rank on a hidden row travels to the pujo that stays', () => {
  const bagbazar = bySlug('bagbazar-sarbojanin-durga-puja-mandap')
  assert.equal(bagbazar.rank, 4)
  assert.equal(bagbazar.famous, true)
  assert.deepEqual(bagbazar.awards, ['107-Year Heritage Icon'])
  assert.equal(bagbazar.name, 'Bagbazar Sarbojanin')
  assert.equal(bagbazar.fullName, 'Bagbazar Sarbojanin Durgotsav & Exhibition')
  assert.deepEqual(bagbazar.aliases.sort(), ['bagbazar-pally-puja-o-prodorshoni', 'bagbazar-sarbojanin-durgotsav-exhibition'])
  assert.equal(bySlug('bagbazar-pally-puja-o-prodorshoni'), undefined)

  const chetla = bySlug('chetla-agroni-club')
  assert.equal(chetla.rank, 1)
  assert.equal(chetla.name, 'Chetla Agrani Club')
  assert.equal(tierLabel(chetla), 'Red Road Carnival #1')
  assert.equal(tierLabel(bySlug('hatibagan-sarbojonin-durgotsab-committee')), 'Featured')
  assert.equal(tierLabel(bySlug('dum-dum-park-bharat-chakra')), null)
})

test('a merged slug still finds its pujo, so old links keep working', () => {
  const found = findPujo(index, 'chetla-agrani-durga-puja-pandal')
  assert.equal(found.pujo.slug, 'chetla-agroni-club')
  assert.equal(found.canonical, false)
  assert.equal(findPujo(index, 'chetla-agroni-club').canonical, true)
  assert.equal(findPujo(index, 'no-such-pujo'), null)
})

test('hidden rows and rows that are not a Durga Puja never show', () => {
  assert.equal(bySlug('connectivity-test'), undefined)
  assert.equal(bySlug('kali-puja-pandal-green-park-dum-dum'), undefined)
  assert.equal(findPujo(index, 'kali-puja-pandal-green-park-dum-dum'), null)
})

test('wrong pins: United Club moves to Ultadanga; an unplaceable pin is dropped but keeps its area', () => {
  const united = bySlug('united-club')
  assert.ok(straightKm(united, { lat: 22.5937, lng: 88.3907 }) < 1)
  assert.equal(united.area, 'ultadanga-beleghata')
  assert.equal(united.zone, 'east')
  const goabagan = bySlug('goabagan-sarodatsav-sammilani')
  assert.equal(goabagan.lat, null)
  assert.equal(isRoutable(goabagan), false)
  /* its pincode still says Manicktala, and the area's zone overrides the scraper's "south" */
  assert.equal(goabagan.area, 'hatibagan-shyambazar')
  assert.equal(goabagan.zone, 'north')
})

test('areas come from pincodes; a pin that contradicts its pincode wins; a name places the rest', () => {
  assert.equal(bySlug('hatibagan-sarbojonin-durgotsab-committee').area, 'hatibagan-shyambazar')
  assert.equal(bySlug('kasba-shakti-sangha').area, 'park-circus-kasba')
  /* CD Block says 700107 (Kasba) but sits in New Town */
  assert.equal(bySlug('cd-block-durga-puja').area, 'new-town-kestopur')
  assert.equal(bySlug('ultadanga-sangrami-sarbojanin').area, 'ultadanga-beleghata')
  assert.equal(bySlug('ultadanga-sangrami-sarbojanin').zone, 'east')
  const area = index.areas.find((a) => a.id === 'bagbazar-kumartuli')
  assert.ok(area.centre && area.count >= 2)
})

test('two pujos with one name say which is which', () => {
  assert.equal(bySlug('mallick-bari-bhowanipore').name, 'Mallick Bari, Bhowanipore')
  assert.equal(bySlug('mallick-bari-pathuriaghatasingha-bahini').name, 'Mallick Bari, Pathuriaghata')
})

test('nearest Metro is computed from coordinates, and POI phone numbers are never read', () => {
  assert.equal(bySlug('bagbazar-sarbojanin-durga-puja-mandap').metro.id, 'shyambazar-metro-station')
  assert.equal(bySlug('chetla-agroni-club').metro.id, 'kalighat-metro-station')
  assert.equal(bySlug('ultadanga-sangrami-sarbojanin').metro, null)
  const places = placesFromRows(POIS)
  assert.equal(places.stations.length, 4)
  assert.deepEqual(places.stations.find((s) => s.name === 'Noapara').lines, ['blue', 'yellow'])
  assert.equal(places.landmarks.length, 1)
  assert.equal(places.help[0].kind, 'police')
  assert.ok(!JSON.stringify(places).includes('033-'), 'a phone number leaked')
  assert.deepEqual(linesFromText('Esplanade, Blue/Green Line Interchange, Kolkata Metro'), ['blue', 'green'])
  assert.deepEqual(linesFromText('Babughat ferry'), [])
})

test('the loader selects real columns only: the scraper filler never leaves the database', async () => {
  const loader = await read('lib/pujo/pandals.ts')
  assert.match(loader, /^import 'server-only'/)
  const select = loader.slice(loader.indexOf('kolkata_puja_pandals.findMany'), loader.indexOf('kolkata_puja_pois'))
  for (const filler of ['rating', 'view_count', 'crowd_level', 'theme_description', 'sculpted_by', 'established', 'nearby_slugs', 'bus_routes', 'categories', 'gallery', 'image_url']) {
    assert.doesNotMatch(select, new RegExp(`\\b${filler}\\b`), `${filler} is selected`)
  }
  assert.doesNotMatch(loader, /\b(?:create|update|upsert|delete)(?:Many)?\(/, 'the loader writes to the scraper tables')
})

test('the client index leaves addresses and merged slugs on the server', () => {
  const client = toClientIndex(index)
  const pujo = client.pujos.find((p) => p.slug === 'bagbazar-sarbojanin-durga-puja-mandap')
  assert.equal('address' in pujo, false)
  assert.equal('aliases' in pujo, false)
  assert.equal(pujo.lat, 22.60478)
  assert.equal(client.stations.length, 4)
})

test('places read as two names, without house numbers, plus codes or the city', () => {
  assert.equal(placeFrom('25A/C Mohini Mohan Rd, Jadubabur Bazar, Bhowanipore, Kolkata 700020', 'X'), 'Jadubabur Bazar, Bhowanipore')
  assert.equal(placeFrom('H6RR+27Q,Mohiari, near Laxmi Kamal Hospital, Andul, Mahiari, West Bengal 711302', 'X'), 'Andul, Mahiari')
  assert.equal(placeFrom('AJOYNAGAR SARBOJANIN DURGOTSAB SOCIETY, Kolkata (FFD Member 2025)', 'AJOYNAGAR SARBOJANIN DURGOTSAB SOCIETY'), null)
  assert.equal(placeFrom('Baruipur HO', 'X'), 'Baruipur')
  assert.equal(placeFrom(null, 'X'), null)
})

test('nearest pujos come with walking distance and minutes', () => {
  const bagbazar = bySlug('bagbazar-sarbojanin-durga-puja-mandap')
  const near = nearestPujos(index.pujos, bagbazar, { exclude: [bagbazar.slug], limit: 3 })
  assert.equal(near[0].pujo.slug, 'kumartuli-park-sarbojanin-durgotsab')
  assert.ok(near[0].minutes >= 1)
  assert.ok(near.every(({ pujo }) => pujo.slug !== bagbazar.slug))
  assert.ok(near.every(({ pujo }) => pujo.lat !== null))
})

/* ------------------------------------------------------------ search -- */

const searchIndex = buildSearchIndex({
  pujos: toClientIndex(index).pujos,
  stations: index.stations,
  areas: index.areas,
  food: [{ id: 'mitra-cafe', name: 'Mitra Cafe', area: 'Shobhabazar', order: 'Fish kabiraji', lat: 22.5946, lng: 88.3661 }],
})
const names = (query, options) => search(searchIndex, query, options).pujos.map((hit) => hit.item.name)

test('search forgives spelling and finds a pujo by its para', () => {
  assert.equal(names('bagbazar')[0], 'Bagbazar Sarbojanin')
  assert.equal(names('baghbazar')[0], 'Bagbazar Sarbojanin')
  assert.ok(!names('bagbazar').some((name) => name.startsWith('Bowbazar')), 'Bagbazar found Bowbazar')
  assert.equal(names('kumortuli')[0], 'Kumartuli Park Sarbojanin')
  assert.deepEqual(names('dum dum park').slice(0, 3).sort(), ['Dum Dum Park Bharat Chakra', 'Dum Dum Park Tarun Sangha', 'Dum Dum Park Yubak Brinda'])
  assert.equal(names('chetla agrani')[0], 'Chetla Agrani Club')
  assert.equal(names('hatibagan sarbojanin')[0], 'Hatibagan Sarbojonin')
})

test('filler words are ignored unless they are all that was typed', () => {
  assert.deepEqual(parseQuery('Bagbazar Sarbojanin Durga Puja').words, ['bagbajar'])
  assert.ok(names('sarbojanin').length >= 3)
  assert.deepEqual(parseQuery('durga puja').words.length, 2)
})

test('search by pincode, by zone, and by Metro station', () => {
  assert.ok(names('700006').includes('Hatibagan Sarbojonin'))
  assert.ok(!names('700006').includes('Chetla Agrani Club'))
  assert.ok(names('south').includes('Chetla Agrani Club'))
  const metro = search(searchIndex, 'Shyambazar metro')
  assert.equal(metro.stations[0].name, 'Shyambazar')
  assert.ok(metro.pujos.some((hit) => hit.item.name === 'Bagbazar Sarbojanin'))
  assert.ok(!metro.pujos.some((hit) => hit.item.name === 'Chetla Agrani Club'))
  /* measured from the station */
  assert.ok(metro.pujos.every((hit) => hit.km !== null && hit.km <= 1))
})

test('results: name matches first, famous first among them, then nearest, then alphabetical', () => {
  const byArea = names('hatibagan')
  assert.equal(byArea[0], 'Hatibagan Sarbojonin')
  const near = { lat: 22.6105, lng: 88.4144 }
  const measured = search(searchIndex, 'dum dum park', { distance: (p) => straightKm(p, near) }).pujos
  assert.equal(measured[0].item.name, 'Dum Dum Park Tarun Sangha', 'famous first')
  assert.equal(measured[1].item.name, 'Dum Dum Park Bharat Chakra', 'then the nearest')
  assert.ok(measured.every((hit) => typeof hit.km === 'number'))
})

test('food picks come back in their own group, and a miss says what to try', () => {
  const result = search(searchIndex, 'mitra cafe')
  assert.equal(result.food[0].item.name, 'Mitra Cafe')
  assert.equal(search(searchIndex, 'xyzzy').pujos.length, 0)
  assert.equal(search(searchIndex, '   ').pujos.length, 0)
  assert.equal(noMatch(' xyz '), 'No pujo called ‘xyz’. Try the para\'s name or a Metro station.')
  assert.doesNotMatch(noMatch('x'), /!/)
})

test('one edit of slack, only when nothing matches without it', () => {
  assert.equal(names('mohammed ali').length, 0)
  const withPark = buildSearchIndex({
    pujos: [{ slug: 'mohammad-ali-park', name: 'Mohammad Ali Park', fullName: 'Mohammad Ali Park', zone: 'central', area: null, place: null, pincode: '700073', lat: 22.577, lng: 88.36, famous: false }],
    stations: [], areas: [],
  })
  assert.equal(search(withPark, 'mohammed ali').pujos[0].item.name, 'Mohammad Ali Park')
  assert.equal(search(withPark, 'muhammad ali park').pujos[0].item.name, 'Mohammad Ali Park')
})

/* --------------------------------------------------------------- geo -- */

test('walking is straight-line × 1.3 at a Pujo pace, and reads as a person would say it', () => {
  const a = { lat: 22.6, lng: 88.36 }
  const b = { lat: 22.61, lng: 88.37 }
  assert.ok(Math.abs(walkKm(a, b) - straightKm(a, b) * 1.3) < 1e-9)
  assert.equal(walkMinutes(0), 1)
  assert.equal(walkMinutes(4.5), 60)
  assert.equal(formatKm(0.37), '350 m')
  assert.equal(formatKm(0.01), '50 m')
  assert.equal(formatKm(1.24), '1.2 km')
  assert.equal(formatKm(12.6), '13 km')
})
