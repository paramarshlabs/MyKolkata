import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'
import { MAHALAYA, PUJO_DAYS } from '../lib/pujo.ts'
import { redactPujoUrl } from '../lib/pujo-personality/analytics.ts'
import { ARCHETYPE_IDS, DIMENSION_IDS } from '../lib/pujo-personality/config.ts'
import { BADGES, CONTENT, PAIRS, STATUSES, TAGLINE_LINES, aName, pairCopy, peopleFor, streakLine } from '../lib/pujo-personality/content.ts'
import { PATHS as BENGALI } from '../lib/pujo-personality/bengali-paths.ts'
import { OG_LINES } from '../lib/pujo-personality/og-lines.ts'
import { PATHS as LATIN } from '../lib/pujo-personality/og-latin-paths.ts'
import { sanitizeName } from '../lib/pujo-personality/names.ts'
import { RECOMMENDATIONS } from '../lib/pujo-personality/recommendations.ts'
import { badgesFrom, quoteFor, scoreAnswers, shareCardFrom } from '../lib/pujo-personality/session.ts'
import { SIGILS } from '../lib/pujo-personality/sigils.ts'
import { pujoSync } from '../lib/pujo-personality/sync.ts'
import { decodeCard, encodeCard } from '../lib/pujo-personality/token.ts'
import { buildContent } from '../scripts/pujo/build-content.mjs'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')

/* ------------------------------------------------------------ content -- */

test('the archetype copy is what the character bibles say', async () => {
  const built = await buildContent()
  const shipped = JSON.parse(await read('lib/pujo-personality/content.json'))
  assert.deepEqual(shipped, JSON.parse(JSON.stringify(built)),
    'lib/pujo-personality/content.json has drifted: run node scripts/pujo/build-content.mjs')
})

test('every archetype has its words, lore, sigil and palette', () => {
  for (const id of ARCHETYPE_IDS) {
    const c = CONTENT[id]
    assert.ok(c.name && c.bn && c.tagline && c.hour, id)
    const words = c.lore.join(' ').split(/\s+/).length
    assert.ok(words >= 200 && words <= 420, `${id} lore is ${words} words`)
    assert.ok(c.says.length >= 3, `${id} says`)
    assert.equal(TAGLINE_LINES[id].length, 2)
    assert.ok(SIGILS[id].length > 0, `${id} sigil`)
  }
})

test('there is pair copy for all 45 pairs, in either order', () => {
  assert.equal(PAIRS.length, 45)
  for (const a of ARCHETYPE_IDS) {
    for (const b of ARCHETYPE_IDS) {
      const pair = pairCopy(a, b)
      assert.ok(pair.headline && pair.line && pair.plan, `${a} + ${b}`)
      /* either person may be reading: "you" means both, never one side against "they" */
      assert.doesNotMatch(`${pair.headline} ${pair.line}`, /\b(they|their)\b/i, `${a} + ${b} reads for one side only`)
    }
    const people = peopleFor(a)
    assert.ok(people.kin.length + people.complement.length + people.spark.length > 0, `${a} has no people`)
  }
})

test('names take the right article', () => {
  assert.equal(aName('addabaaz'), 'an Addabaaz')
  assert.equal(aName('art_kid'), 'an Art Kid')
  assert.equal(streakLine('pet_pujari'), 'with a Pet Pujari streak')
})

/* ----------------------------------------------------------- the card -- */

function randomCard(i) {
  const primary = ARCHETYPE_IDS[i % 9]
  const secondary = i % 4 === 0 ? null : ARCHETYPE_IDS[(i + 1 + (i % 7)) % 9]
  return {
    primary,
    secondary: secondary === primary ? null : secondary,
    band: ['clear', 'leaning', 'close'][i % 3],
    vector: Object.fromEntries(DIMENSION_IDS.map((d, j) => [d, ((i * 37 + j * 11) % 256) / 255])),
    badges: BADGES.filter((_, j) => (i >> j) & 1),
    status: i % 5 === 0 ? null : STATUSES[i % STATUSES.length],
  }
}

test('a card survives its link exactly', () => {
  for (let i = 0; i < 200; i += 1) {
    const card = randomCard(i)
    const token = encodeCard(card)
    assert.match(token, /^[A-Za-z0-9_-]{28}$/)
    assert.deepEqual(decodeCard(token), card)
  }
})

test('a link carries no name, and a broken or forged link opens nothing', () => {
  const card = randomCard(3)
  assert.equal('name' in decodeCard(encodeCard({ ...card, name: 'Riya' })), false)
  const token = encodeCard(card)
  for (const bad of ['', 'x', token.slice(0, 27), `${token}AAAA`, token.replace(/^./, 'B'), '../../etc', `${token}<script>`]) {
    assert.equal(decodeCard(bad), null, JSON.stringify(bad))
  }
})

test('share links are recorded by route, not by card', () => {
  const token = encodeCard(randomCard(5))
  assert.equal(redactPujoUrl(`https://example.org/pujo/you/${token}?x=1`), 'https://example.org/pujo/you/[card]?x=1')
  assert.equal(redactPujoUrl(`/pujo/guess/${token}`), '/pujo/guess/[card]')
  assert.equal(redactPujoUrl('/pujo/personality'), '/pujo/personality')
})

test('first names on a card: letters in any script, nothing offensive', () => {
  for (const ok of ['Riya', 'রিয়া', 'Anne-Marie', "O'Brien", 'Dickens', 'Sussex', 'Nikita', 'Mag']) assert.ok(sanitizeName(ok), ok)
  for (const bad of ['', '   ', 'Riya123', '<b>', 'www.site', 'fuck', 'F u c k', 'bhosdike', 'চোদা', 'a'.repeat(21), 'sex', 'kutta']) {
    assert.equal(sanitizeName(bad), null, bad)
  }
  assert.equal(sanitizeName('  Riya   Sen '), 'Riya Sen')
})

/* ------------------------------------------------------------ results -- */

const nightOwl = { q_last_pandal: ['a'], q_mahalaya: ['b'], q_plan: ['e'], q_queue: ['f'], q_plate: ['b'], q_ashtami_look: ['f'], q_theme_pandal: ['b'], q_crew: ['b'], q_soundtrack: ['e'], q_dhaak: ['f'], q_love: ['b'], q_dashami: ['f'], q_frame: ['night_owl'], rf_metro: ['a'], rf_crush: ['b'] }

test('a result becomes a card with its badges and status, and explains itself in their words', () => {
  const result = scoreAnswers(nightOwl)
  const card = shareCardFrom(result, { answers: nightOwl, prefs: { pref_status: 'homecomer' } })
  assert.equal(card.primary, 'night_owl')
  assert.deepEqual(badgesFrom(nightOwl), ['last_metro', 'the_quiet'])
  assert.equal(card.status, 'homecomer')
  const quote = quoteFor('night', result.vector.night, nightOwl)
  assert.equal(quote, "Obviously. The night's only getting started.")
})

test('Pujo Sync is mutual, bounded, and highest for the same Pujo', () => {
  const people = ARCHETYPE_IDS.map((id, i) => ({ primary: id, vector: randomCard(i * 7 + 1).vector }))
  for (const a of people) {
    assert.ok(Math.abs(pujoSync(a, a).match - 1) < 1e-9)
    for (const b of people) {
      const ab = pujoSync(a, b)
      assert.ok(ab.match >= 0 && ab.match <= 1)
      assert.ok(Math.abs(ab.match - pujoSync(b, a).match) < 1e-9, `${a.primary} + ${b.primary}`)
    }
  }
})

/* ---------------------------------------------------- recommendations -- */

test('every archetype has three routes, eight pandals and three plates for any diet', () => {
  const routeIds = new Set()
  for (const id of ARCHETYPE_IDS) {
    const r = RECOMMENDATIONS[id]
    assert.equal(r.routes.length, 3, id)
    assert.equal(r.pandals.length, 8, id)
    assert.ok(r.plates.length >= 3, id)
    assert.ok(r.plates.some((p) => p.diet === 'veg'), `${id} has nothing veg`)
    assert.ok(r.playlist.name && r.playlist.anchors.length, id)
    for (const route of r.routes) {
      assert.ok(!routeIds.has(route.id), `route id ${route.id} repeats`)
      routeIds.add(route.id)
      assert.ok(route.stops.length >= 3, `${route.id} is too short`)
    }
  }
})

/* --------------------------------------------------- link-preview type -- */

test('every line a link preview draws has been shaped', () => {
  for (const line of OG_LINES) {
    const shaped = line.face === 'bengali' ? BENGALI[line.text] : LATIN[`${line.face}:${line.text}`]
    assert.ok(shaped?.d, `${line.face} "${line.text}": run python3 scripts/pujo/generate-paths.py`)
  }
  for (const id of ARCHETYPE_IDS) assert.ok(BENGALI[CONTENT[id].bn], `${id} has no Bengali outline`)
})

test('no font file is copied out of public/fonts', async () => {
  const files = await readdir(new URL('lib/', root), { recursive: true })
  assert.deepEqual(files.filter((f) => /\.(ttf|otf|woff2?)$/i.test(f)), [])
})

/* ------------------------------------------------------- public pages -- */

test('the Pujo Personality is public, and nothing public writes', async () => {
  const files = (await readdir(new URL('app/(open)/', root), { recursive: true })).filter((f) => /\.tsx?$/.test(f))
  for (const page of ['pujo/personality/page.tsx', 'pujo/archetypes/page.tsx', 'pujo/archetypes/[id]/page.tsx', 'pujo/you/[token]/page.tsx', 'pujo/guess/[token]/page.tsx']) {
    assert.ok(files.includes(page), `missing app/(open)/${page}`)
  }
  for (const file of files) {
    const source = await read(`app/(open)/${file}`)
    assert.doesNotMatch(source, /requireUser|currentUserId|cookies\(\)|prisma/, `${file} reaches for a session or the database`)
    assert.doesNotMatch(source, /export (async function|const) (GET|POST|PUT|PATCH|DELETE)\b/, `${file} is a route handler`)
  }
  assert.equal(files.some((f) => f.endsWith('route.ts')), false)
  assert.match(await read('app/(open)/layout.tsx'), /<OpenHeader \/>/)
})

test('the guess preview never reads the card it is guessing', async () => {
  assert.doesNotMatch(await read('app/(open)/pujo/guess/[token]/opengraph-image.tsx'), /decodeCard|params/)
})

test('Mahalaya is 10 October 2026, and Shashthi a week later', () => {
  assert.equal(MAHALAYA, '2026-10-10T00:00:00+05:30')
  assert.equal(PUJO_DAYS[0].iso, '2026-10-17T00:00:00+05:30')
})
