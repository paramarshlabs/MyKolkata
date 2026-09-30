import assert from 'node:assert/strict'
import test from 'node:test'
import { WikimediaImageProvider } from '../lib/places/wikimediaImageProvider.ts'

/* a fake Commons that answers each kind of query from its own table */
function commons({ nearby = [], search = [], files = {} }) {
  const calls = []
  const fetchImpl = async (url) => {
    const params = new URL(url).searchParams
    const kind = params.get('generator') === 'geosearch' ? 'geosearch' : params.get('list') === 'search' ? 'search' : 'details'
    calls.push(kind)
    const pages = kind === 'search' ? [] : kind === 'geosearch'
      ? nearby.map((title) => ({ title, coordinates: files[title]?.coordinates }))
      : params.get('titles').split('|').map((title) => ({
        title,
        coordinates: files[title]?.coordinates,
        imageinfo: [{ mime: 'image/jpeg', thumburl: `https://upload.wikimedia.org/${encodeURIComponent(title)}`, extmetadata: {} }],
      }))
    return { ok: true, status: 200, json: async () => (kind === 'search'
      ? { query: { search: search.map((title) => ({ title })) } }
      : { query: { pages } }) }
  }
  return { provider: new WikimediaImageProvider({ fetchImpl }), calls }
}

const flurys = { name: 'Flurys', lat: 22.5530, lng: 88.3525 }

test('name search is only a fallback: a nearby geotagged match is used as before', async () => {
  const { provider, calls } = commons({ nearby: ['File:Flurys tea room.jpg'] })
  const image = await provider.lookupImage(flurys)
  assert.match(image.image, /Flurys%20tea%20room/)
  assert.equal(image.imageMatchConfidence, 1)
  assert.deepEqual(calls, ['geosearch', 'details'])
})

test('when nothing nearby matches, a name search finds the place and marks it a candidate', async () => {
  const { provider, calls } = commons({
    search: ['File:Peter Cat menu.pdf', 'File:Chelow Kabab, Peter Cat, Park Street, Kolkata.jpg'],
  })
  const image = await provider.lookupImage({ name: 'Peter Cat', lat: 22.5530, lng: 88.3520 })
  assert.match(image.image, /Chelow%20Kabab/)
  assert.equal(image.imageMatchConfidence, 0.7)
  assert.deepEqual(calls, ['geosearch', 'search', 'details'])
})

test('name search refuses a namesake photographed somewhere else', async () => {
  const ferry = 'File:M.V. Kasturi Enterprise ferry on the Hooghly.jpg'
  const { provider } = commons({ search: [ferry], files: { [ferry]: { coordinates: [{ lat: 22.60, lon: 88.40 }] } } })
  assert.equal(await provider.lookupImage({ name: 'Kasturi Enterprise', lat: 22.5460, lng: 88.3540 }), null)
})

test('a one-word name needs a geotag near the place', async () => {
  const unplaced = 'File:Nahoum cakes.jpg'
  const placed = 'File:Nahoum shopfront.jpg'
  const { provider: bare } = commons({ search: [unplaced] })
  assert.equal(await bare.lookupImage({ name: 'Nahoum', lat: 22.5600, lng: 88.3520 }), null)
  /* elsewhere, so the miss remembered above doesn't answer it */
  const { provider: near } = commons({ search: [placed], files: { [placed]: { coordinates: [{ lat: 22.5702, lon: 88.3621 }] } } })
  assert.match((await near.lookupImage({ name: 'Nahoum', lat: 22.5700, lng: 88.3620 })).image, /shopfront/)
})

test('name search needs every word of the name in the title', async () => {
  const { provider } = commons({ search: ['File:Arsalan biryani plate.jpg'] })
  assert.equal(await provider.lookupImage({ name: 'Mughal Arsalan Biryani', lat: 22.5500, lng: 88.3600 }), null)
})

test('generic business words are not needed in the title, but the rest of the name is', async () => {
  const branch = 'File:Arsalan Restaurant - 28 Circus Avenue - Kolkata.jpg'
  const { provider } = commons({ search: [branch], files: { [branch]: { coordinates: [{ lat: 22.5451, lon: 88.3652 }] } } })
  /* only "Arsalan" is left, so it also has to be geotagged near this branch */
  assert.match((await provider.lookupImage({ name: 'Arsalan Restaurant & Caterer', lat: 22.5460, lng: 88.3660 })).image, /Circus%20Avenue/)
  const { provider: far } = commons({ search: [branch], files: { [branch]: { coordinates: [{ lat: 22.5451, lon: 88.3652 }] } } })
  assert.equal(await far.lookupImage({ name: 'Arsalan Restaurant & Caterer', lat: 22.6100, lng: 88.4000 }), null)
})

test('without a geotag, the name has to read in order in the title', async () => {
  const scattered = 'File:House sparrow eating chicken feed, Kolkata.jpg'
  const { provider } = commons({ search: [scattered] })
  assert.equal(await provider.lookupImage({ name: 'The Chicken House', lat: 22.5500, lng: 88.3500 }), null)
})

test('a short word still counts: G Centre Mall is not City Centre Mall', async () => {
  const other = 'File:City Centre Mall - Salt Lake City - Kolkata.JPG'
  const { provider } = commons({ search: [other] })
  assert.equal(await provider.lookupImage({ name: 'G Centre Mall', lat: 22.5800, lng: 88.3700 }), null)
})

test('requests to Commons go out at most two at a time', async () => {
  let open = 0
  let peak = 0
  const provider = new WikimediaImageProvider({
    fetchImpl: async () => {
      open += 1
      peak = Math.max(peak, open)
      await new Promise((resolve) => setTimeout(resolve, 30))
      open -= 1
      return { ok: true, status: 200, json: async () => ({ query: { pages: [], search: [] } }) }
    },
  })
  await Promise.all(Array.from({ length: 5 }, (_, index) =>
    provider.lookupImage({ name: `Pacing Test ${index}`, lat: 22.5 + index / 100, lng: 88.35 })))
  assert.equal(peak <= 2, true)
})
