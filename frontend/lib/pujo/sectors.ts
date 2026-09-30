/* ==========================================================================
   The city in six zones, and each zone in areas people would name: Bagbazar–
   Kumartuli, Behala–Barisha. Areas come from pincodes, which the scraper got
   mostly right; a pujo without one joins the area whose centre is nearest.

   The zone the scraper wrote is noisy (Goabagan Street, Manicktala is marked
   South), so a pujo in an area takes the area's zone. This is a first cut:
   someone who knows the paras should check the names and boundaries, for
   example whether Lake Town goes with Dum Dum or with Salt Lake.
   ========================================================================== */

export const ZONES = [
  { id: 'north', label: 'North', long: 'North Kolkata' },
  { id: 'central', label: 'Central', long: 'Central Kolkata' },
  { id: 'south', label: 'South', long: 'South Kolkata' },
  { id: 'east', label: 'East', long: 'East Kolkata' },
  { id: 'howrah', label: 'Howrah', long: 'Howrah' },
  { id: 'suburbs', label: 'Suburbs', long: 'the suburbs' },
] as const

export type ZoneId = (typeof ZONES)[number]['id']

export const isZoneId = (value: unknown): value is ZoneId => ZONES.some((zone) => zone.id === value)

export function zoneOf(id: ZoneId) {
  return ZONES.find((zone) => zone.id === id) as (typeof ZONES)[number]
}

/* the scraper's zone names; "others" is everything outside the city */
export function zoneFromData(value: string | null | undefined): ZoneId | null {
  if (!value) return null
  if (value === 'others') return 'suburbs'
  return isZoneId(value) ? value : null
}

import { fold } from './normalise'

/* keywords: locality names that place a pujo with no pin and no pincode ("Ultadanga Sangrami") */
export type Area = { id: string; name: string; zone: ZoneId; pincodes: readonly string[]; keywords: readonly string[] }

export const AREAS: readonly Area[] = [
  /* North */
  { id: 'bagbazar-kumartuli', name: 'Bagbazar–Kumartuli', zone: 'north', pincodes: ['700003', '700005'], keywords: ['bagbazar', 'kumartuli', 'ahiritola', 'shobhabazar', 'beniatola', 'nimtala'] },
  { id: 'hatibagan-shyambazar', name: 'Hatibagan–Shyambazar', zone: 'north', pincodes: ['700002', '700004', '700006'], keywords: ['hatibagan', 'shyambazar', 'darjipara', 'maniktala', 'girish park', 'simla', 'simulia', 'beadon', 'grey street', 'gray street', 'shyampukur', 'tala', 'chitpur', 'cossipore', 'halsibagan', 'sikdar bagan'] },
  { id: 'belgachia-dum-dum', name: 'Belgachia–Dum Dum', zone: 'north', pincodes: ['700028', '700030', '700037', '700065', '700074', '700079', '700080', '700081'], keywords: ['belgachia', 'paikpara', 'nagerbazar', 'motijheel', 'dum dum'] },
  { id: 'baranagar-sinthee', name: 'Baranagar–Sinthee', zone: 'north', pincodes: ['700035', '700036', '700050', '700076', '700090', '700108'], keywords: ['baranagar', 'sinthee', 'sinthi', 'noapara', 'dakshineswar', 'alambazar'] },
  /* Central */
  { id: 'college-street-bowbazar', name: 'College Street–Bowbazar', zone: 'central', pincodes: ['700007', '700009', '700012', '700073'], keywords: ['college street', 'college square', 'bowbazar', 'machuabazar', 'mechua bazar', 'amherst street', 'jorasanko', 'muktaram', 'baithakkhana', 'thanthania'] },
  { id: 'esplanade-sealdah', name: 'Esplanade–Sealdah', zone: 'central', pincodes: ['700001', '700013', '700014', '700016', '700069', '700071', '700072', '700087'], keywords: ['esplanade', 'dharmatala', 'taltala', 'janbazar', 'sealdah', 'entally', 'new market', 'park street', 'wellington'] },
  /* East */
  { id: 'ultadanga-beleghata', name: 'Ultadanga–Beleghata', zone: 'east', pincodes: ['700010', '700011', '700054', '700067', '700085'], keywords: ['ultadanga', 'beleghata', 'kankurgachi', 'phoolbagan', 'bagmari', 'narkeldanga'] },
  { id: 'park-circus-kasba', name: 'Park Circus–Kasba', zone: 'east', pincodes: ['700015', '700017', '700039', '700042', '700046', '700105', '700107'], keywords: ['park circus', 'beniapukur', 'kasba', 'tangra', 'tiljala', 'topsia', 'anandapur', 'madurdaha'] },
  { id: 'salt-lake', name: 'Salt Lake', zone: 'east', pincodes: ['700064', '700091', '700097', '700098', '700106'], keywords: ['salt lake', 'saltlake', 'bidhannagar'] },
  { id: 'lake-town-baguiati', name: 'Lake Town–Baguiati', zone: 'east', pincodes: ['700048', '700052', '700055', '700059', '700089', '700159'], keywords: ['lake town', 'baguiati', 'dum dum park', 'sreebhumi', 'patipukur', 'bangur'] },
  { id: 'new-town-kestopur', name: 'New Town–Kestopur', zone: 'east', pincodes: ['700101', '700102', '700135', '700136', '700156', '700157', '700160', '700161', '700163'], keywords: ['new town', 'newtown', 'kestopur', 'rajarhat', 'action area', 'chinar park', 'teghoria'] },
  /* South */
  { id: 'kalighat-bhowanipore', name: 'Kalighat–Bhowanipore', zone: 'south', pincodes: ['700020', '700025', '700026'], keywords: ['kalighat', 'bhowanipore', 'hazra', 'lansdowne', 'sahanagar', 'paddapukur', 'chakraberia', 'lake market'] },
  { id: 'ballygunge-gariahat', name: 'Ballygunge–Gariahat', zone: 'south', pincodes: ['700019', '700029', '700031'], keywords: ['ballygunge', 'gariahat', 'dhakuria', 'deshapriya', 'rashbehari', 'selimpur', 'golpark', 'ekdalia'] },
  { id: 'chetla-new-alipore', name: 'Chetla–New Alipore', zone: 'south', pincodes: ['700027', '700053', '700088'], keywords: ['chetla', 'alipore', 'new alipore', 'newalipore', 'taratala', 'sahapur'] },
  { id: 'kidderpore-garden-reach', name: 'Kidderpore–Garden Reach', zone: 'south', pincodes: ['700018', '700023', '700024', '700043', '700044'], keywords: ['kidderpore', 'khidirpur', 'garden reach', 'metiabruz', 'watgunge', 'mominpur', 'ekbalpur'] },
  { id: 'behala-barisha', name: 'Behala–Barisha', zone: 'south', pincodes: ['700008', '700034', '700038', '700060', '700061', '700063'], keywords: ['behala', 'barisha', 'thakurpukur', 'sakherbazar', 'sarsuna', 'joka', 'parnasree'] },
  { id: 'tollygunge-lake-gardens', name: 'Tollygunge–Lake Gardens', zone: 'south', pincodes: ['700033', '700040', '700041', '700045', '700068', '700082', '700093', '700095'], keywords: ['tollygunge', 'lake gardens', 'golf green', 'jodhpur park', 'regent park', 'haridevpur', 'putiary'] },
  { id: 'jadavpur-garia', name: 'Jadavpur–Garia', zone: 'south', pincodes: ['700032', '700047', '700070', '700075', '700078', '700084', '700086', '700092', '700094', '700099'], keywords: ['jadavpur', 'garia', 'baghajatin', 'bagha jatin', 'santoshpur', 'naktala', 'bansdroni', 'patuli', 'bijoygarh', 'haltu', 'purbachal', 'kalikapur', 'mukundapur', 'ajoy nagar', 'raipur', 'garfa', 'kendua'] },
  { id: 'sonarpur-baruipur', name: 'Sonarpur–Baruipur', zone: 'south', pincodes: ['700103', '700144', '700146', '700149', '700150', '700151', '700154'], keywords: ['sonarpur', 'baruipur', 'narendrapur', 'harinavi', 'boral'] },
  /* Howrah */
  { id: 'howrah-shibpur', name: 'Howrah–Shibpur', zone: 'howrah', pincodes: ['711101', '711102', '711103', '711104', '711105', '711106', '711107', '711108', '711111', '711112', '711113', '711201', '711202', '711204', '711205'], keywords: ['howrah', 'shibpur', 'salkia', 'santragachi', 'bantra', 'tikiapara', 'tekiapara', 'ichapur', 'bally', 'belur', 'liluah', 'dasnagar', 'ramrajatala', 'ghusuri'] },
  { id: 'andul-domjur', name: 'Andul–Domjur', zone: 'howrah', pincodes: ['711110', '711302', '711303', '711313', '711316', '711405', '711409'], keywords: ['andul', 'domjur', 'uluberia', 'bagnan', 'sankrail', 'mahiari'] },
  /* Suburbs */
  { id: 'belghoria-sodepur', name: 'Belghoria–Sodepur', zone: 'suburbs', pincodes: ['700049', '700051', '700056', '700057', '700058', '700083', '700109', '700110', '700114', '700115', '700118', '700134'], keywords: ['belghoria', 'belgharia', 'sodepur', 'panihati', 'agarpara', 'khardah', 'khardaha', 'birati', 'nimta', 'ariadaha'] },
  { id: 'barrackpore-barasat', name: 'Barrackpore–Barasat', zone: 'suburbs', pincodes: ['700119', '700120', '700122', '700124', '700125', '700126', '700127', '700129', '700155', '743122'], keywords: ['barrackpore', 'barasat', 'madhyamgram', 'titagarh', 'palta'] },
  { id: 'serampore-uttarpara', name: 'Serampore–Uttarpara', zone: 'suburbs', pincodes: ['712201', '712203', '712233', '712235', '712245', '712248', '712258'], keywords: ['serampore', 'uttarpara', 'makhla', 'konnagar', 'rishra'] },
]

const AREA_BY_PINCODE = new Map(AREAS.flatMap((area) => area.pincodes.map((pincode) => [pincode, area] as const)))
const AREA_BY_ID = new Map(AREAS.map((area) => [area.id, area]))

export const areaForPincode = (pincode: string | null | undefined) => (pincode ? AREA_BY_PINCODE.get(pincode) ?? null : null)
export const areaById = (id: string | null | undefined) => (id ? AREA_BY_ID.get(id) ?? null : null)

/* a pin this far from its pincode's area is trusted over the pincode (New Town's CD Block says 700107) */
export const PINCODE_TRUST_KM = 3.5
/* a pujo with no usable pincode joins the nearest area centre within this */
export const NEAREST_AREA_KM = 5

/* the area a pujo's name or address names, when nothing better places it; the longest keyword wins,
   so "Dum Dum Park" goes to Lake Town–Baguiati, not Belgachia–Dum Dum */
const AREA_KEYWORDS = AREAS.flatMap((area) => area.keywords.map((keyword) => ({ area, folded: ` ${fold(keyword).join(' ')} ` })))
  .sort((a, b) => b.folded.length - a.folded.length)

export function areaFromText(...texts: (string | null | undefined)[]): Area | null {
  const haystack = ` ${fold(texts.filter(Boolean).join(' ')).join(' ')} `
  return AREA_KEYWORDS.find(({ folded }) => haystack.includes(folded))?.area ?? null
}

/* "700006" inside an address, when the pincode column is empty */
export function pincodeFromText(text: string | null | undefined): string | null {
  const match = text?.match(/\b(7[0-4]\d{4})\b/)
  return match ? match[1] : null
}
