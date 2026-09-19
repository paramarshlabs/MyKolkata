// @ts-nocheck
/*
 * One taxonomy for the API, the map and the Explore page. `icon` names a
 * CityIcon; `providerTypes` are Ola Places types verified to return results —
 * Ola answers zero_results for a whole request if any single type is unknown,
 * so never add a type here without checking it against the live API.
 */
const TAXONOMY = [
  {
    slug: 'cafes', name: 'Cafés', icon: 'bhaar',
    aliases: ['cafe', 'cafes', 'café', 'cafés', 'coffee', 'coffee shop', 'coffee shops', 'bakery', 'bakeries'],
    providerTypes: ['cafe', 'bakery'],
  },
  {
    slug: 'food', name: 'Food', icon: 'phuchka',
    aliases: ['food', 'restaurant', 'restaurants', 'dining', 'street food', 'eat', 'places to eat', 'bar', 'bars'],
    /* Park Street's old dining rooms — Peter Cat, Mocambo — are typed only as bars */
    providerTypes: ['restaurant', 'bar'],
  },
  {
    slug: 'places', name: 'Places', icon: 'victoria',
    aliases: ['place', 'places', 'landmark', 'landmarks', 'attraction', 'attractions', 'sightseeing', 'monument', 'monuments'],
    providerTypes: ['tourist_attraction', 'landmark'],
  },
  {
    slug: 'culture', name: 'Culture', icon: 'book',
    aliases: ['culture', 'art', 'arts', 'gallery', 'galleries', 'museum', 'museums', 'library', 'libraries', 'heritage', 'temple', 'temples', 'church', 'churches', 'mosque', 'mosques'],
    providerTypes: ['museum', 'art_gallery', 'library', 'place_of_worship'],
  },
  {
    slug: 'shopping', name: 'Shopping', icon: 'signboard',
    aliases: ['shopping', 'shop', 'shops', 'market', 'markets', 'mall', 'malls', 'bookshop', 'bookshops', 'book store', 'book stores'],
    providerTypes: ['shopping_mall', 'clothing_store', 'book_store', 'jewelry_store'],
  },
  {
    slug: 'experiences', name: 'Experiences', icon: 'rickshaw',
    aliases: ['experience', 'experiences', 'event', 'events', 'activity', 'activities', 'nightlife', 'cinema', 'cinemas', 'movies'],
    providerTypes: ['movie_theater', 'amusement_park', 'night_club', 'stadium'],
  },
  {
    slug: 'outdoors', name: 'Outdoors', icon: 'boat',
    aliases: ['outdoors', 'outdoor', 'park', 'parks', 'garden', 'gardens', 'nature', 'lake', 'lakes', 'zoo'],
    providerTypes: ['park', 'zoo', 'natural_feature'],
  },
]

/* provider type → category, for labelling results. Generic types only decide
   when nothing more specific is present. */
const TYPE_CATEGORY = new Map([
  ['cafe', 'cafes'], ['bakery', 'cafes'], ['coffee_shop', 'cafes'],
  ['restaurant', 'food'], ['bar', 'food'], ['meal_takeaway', 'food'], ['meal_delivery', 'food'], ['food', 'food'],
  ['museum', 'culture'], ['art_gallery', 'culture'], ['library', 'culture'], ['place_of_worship', 'culture'],
  ['hindu_temple', 'culture'], ['church', 'culture'], ['mosque', 'culture'], ['synagogue', 'culture'],
  ['shopping_mall', 'shopping'], ['clothing_store', 'shopping'], ['book_store', 'shopping'],
  ['jewelry_store', 'shopping'], ['department_store', 'shopping'], ['store', 'shopping'], ['market', 'shopping'],
  ['movie_theater', 'experiences'], ['amusement_park', 'experiences'],
  ['night_club', 'experiences'], ['bowling_alley', 'experiences'], ['stadium', 'experiences'],
  ['park', 'outdoors'], ['zoo', 'outdoors'], ['natural_feature', 'outdoors'], ['campground', 'outdoors'],
])
const GENERIC_TYPE_CATEGORY = new Map([
  ['tourist_attraction', 'places'], ['landmark', 'places'], ['point_of_interest', 'places'],
])

export const categories = Object.freeze(TAXONOMY.map(({ slug, name, icon }) => ({ slug, name, icon })))

export function normalizeText(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('en-IN')
}

export function findCategory(value) {
  const normalized = normalizeText(value)
  if (!normalized || normalized === 'all') return null

  return TAXONOMY.find((category) =>
    category.slug === normalized ||
    normalizeText(category.name) === normalized ||
    category.aliases.some((alias) => normalizeText(alias) === normalized)
  ) ?? null
}

function categoryBySlug(slug) {
  const category = TAXONOMY.find((entry) => entry.slug === slug)
  return { slug: category.slug, name: category.name }
}

export function categoryFromProviderTypes(types = []) {
  const list = (Array.isArray(types) ? types : [types]).map((type) => normalizeText(type).replaceAll(' ', '_'))

  const specific = list.find((type) => TYPE_CATEGORY.has(type))
  if (specific) return categoryBySlug(TYPE_CATEGORY.get(specific))
  const generic = list.find((type) => GENERIC_TYPE_CATEGORY.has(type))
  if (generic) return categoryBySlug(GENERIC_TYPE_CATEGORY.get(generic))

  for (const type of list) {
    const normalized = type.replaceAll('_', ' ')
    const direct = findCategory(normalized)
    if (direct) return categoryBySlug(direct.slug)

    /* whole words only — "department" must not match "art" */
    const words = new Set(normalized.split(' '))
    const partial = TAXONOMY.find((category) =>
      category.aliases.some((alias) => normalizeText(alias).split(' ').every((word) => words.has(word)))
    )
    if (partial) return categoryBySlug(partial.slug)
  }

  return { slug: 'places', name: 'Places' }
}

export function providerTypesForCategory(value) {
  return findCategory(value)?.providerTypes ?? []
}

export function categoryIcon(value) {
  return findCategory(value)?.icon ?? 'howrah'
}
