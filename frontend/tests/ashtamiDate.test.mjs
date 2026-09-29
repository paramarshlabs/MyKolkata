// Tests for Find your Ashtami date (/experience/swipe): the age gate, the deck's
// rules, matching under a race, the first-move rule, chat retention, photos,
// and that nobody can read anything that isn't theirs.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { adultCutoff, checkBirthDate, formatYmd, isAdult, istDayKey, parseYmd } from '../lib/ashtami-date/age.ts'
import { FIRST_MOVE, LIMITS, NIGHT_DAYS, SEASON, VIBES, ZONES } from '../lib/ashtami-date/config.ts'
import { createAshtamiDateHandlers } from '../lib/ashtami-date/handlers.ts'
import { stripJpegMetadata } from '../lib/ashtami-date/jpeg.ts'
import { PLAN_PANDALS, planNight, suggestPlan } from '../lib/ashtami-date/plan.ts'
import {
  buildDeck, canExtend, canSee, canWrite, extendedExpiry, firstMoveBy, initialExpiry, matchStatus, noRelations,
  orderedPair, reasonFor, whoMovesFirst,
} from '../lib/ashtami-date/rules.ts'
import { checkHandle, checkMessage, cleanText, hasLink } from '../lib/ashtami-date/text.ts'
import { decodeMatchCard, encodeMatchCard } from '../lib/ashtami-date/token.ts'
import { OG_LINES } from '../lib/ashtami-date/og-lines.ts'
import { PATHS as OG_PATHS } from '../lib/ashtami-date/og-paths.ts'
import { PUJO_DAYS } from '../lib/pujo.ts'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')

const HOUR = 3_600_000
/* a fortnight before Ashtami, well inside the season */
const START = new Date('2026-10-05T12:00:00+05:30')

/* ------------------------------------------------------ the age gate -- */

test('the age gate: 17 years and 364 days is refused, 18 today is let in', () => {
  const now = new Date('2026-10-19T12:00:00+05:30')
  assert.deepEqual(checkBirthDate('2008-10-19', now), { ok: true, birth: { y: 2008, m: 10, d: 19 } })
  assert.deepEqual(checkBirthDate('2008-10-20', now), { ok: false, reason: 'under-age' })
  assert.equal(checkBirthDate('1990-01-01', now).ok, true)
})

test('the gate counts by the Kolkata calendar, not the server’s', () => {
  /* 00:15 in Kolkata on the 19th is still the 18th in UTC */
  assert.equal(checkBirthDate('2008-10-19', new Date('2026-10-18T18:45:00Z')).ok, true)
  /* 23:45 in Kolkata on the 18th */
  assert.deepEqual(checkBirthDate('2008-10-19', new Date('2026-10-18T18:15:00Z')), { ok: false, reason: 'under-age' })
})

test('a 29 February birthday comes of age on 1 March in a year without one', () => {
  assert.deepEqual(checkBirthDate('2008-02-29', new Date('2026-02-28T12:00:00+05:30')), { ok: false, reason: 'under-age' })
  assert.equal(checkBirthDate('2008-02-29', new Date('2026-03-01T12:00:00+05:30')).ok, true)
  assert.equal(checkBirthDate('2012-02-29', new Date('2030-02-28T12:00:00+05:30')).ok, false)
})

test('only real calendar dates, not in the future, pass the gate', () => {
  const now = START
  for (const bad of ['2008-02-30', '2008/10/19', '19-10-2008', '', null, 20081019, '2008-13-01']) {
    assert.deepEqual(checkBirthDate(bad, now), { ok: false, reason: 'invalid' }, String(bad))
  }
  assert.deepEqual(checkBirthDate('2030-01-01', now), { ok: false, reason: 'future' })
  assert.deepEqual(checkBirthDate('1900-01-01', now), { ok: false, reason: 'implausible' })
})

test('the deck’s database cutoff agrees with the gate on every day, leap days included', () => {
  for (let t = Date.parse('2027-02-20T06:00:00Z'); t < Date.parse('2028-03-10T06:00:00Z'); t += 24 * HOUR) {
    const now = new Date(t)
    const cutoff = formatYmd(adultCutoff(now))
    const today = parseYmd(istDayKey(now))
    for (const offset of [-2, -1, 0, 1, 2]) {
      const birth = new Date(Date.UTC(today.y - 18, today.m - 1, today.d + offset))
      const ymd = { y: birth.getUTCFullYear(), m: birth.getUTCMonth() + 1, d: birth.getUTCDate() }
      assert.equal(isAdult(ymd, now), formatYmd(ymd) <= cutoff, `${formatYmd(ymd)} on ${istDayKey(now)}`)
    }
    for (const leap of ['2009-02-28', '2010-02-28', '2010-03-01', '2008-02-29']) {
      const ymd = parseYmd(leap)
      assert.equal(isAdult(ymd, now), leap <= cutoff, `${leap} on ${istDayKey(now)}`)
    }
  }
})

/* -------------------------------------------------------- the deck -- */

const person = (id, over = {}) => ({
  id, userId: `user-${id}`, birthDate: '1998-06-01', gender: 'woman', showMe: 'men', night: 'ashtami', zone: 'north',
  vibes: ['bhog_first', 'dhaak', 'adda'], archetype: null, active: true, hidden: false, ...over,
})

test('the deck never shows yourself, anyone swiped, blocked either way, or who passed on you', () => {
  const now = START
  const me = person('me', { gender: 'man', showMe: 'women' })
  const fresh = person('fresh')
  const swiped = person('swiped')
  const blockedByMe = person('blockedByMe')
  const blockedMe = person('blockedMe')
  const passedOnMe = person('passedOnMe')
  const rel = {
    ...noRelations(),
    swiped: new Set(['swiped']),
    passedOnViewer: new Set(['passedOnMe']),
    /* the repository lists blocks in both directions by user id */
    blockedUsers: new Set(['user-blockedByMe', 'user-blockedMe']),
  }
  const pool = [me, { ...me, id: 'me-again' }, fresh, swiped, blockedByMe, blockedMe, passedOnMe]
  const deck = buildDeck(me, pool, rel, now, { day: istDayKey(now) }).entries.map((e) => e.profile.id)
  assert.deepEqual(deck, ['fresh'])
  assert.equal(canSee(me, me, noRelations(), now), false)
})

test('the deck only pairs people who each asked to see the other', () => {
  const now = START
  const rel = noRelations()
  const womanForMen = person('w1', { gender: 'woman', showMe: 'men' })
  const womanForWomen = person('w2', { gender: 'woman', showMe: 'women' })
  const womanForAll = person('w3', { gender: 'woman', showMe: 'everyone' })
  const manForWomen = person('m1', { gender: 'man', showMe: 'women' })
  const manForMen = person('m2', { gender: 'man', showMe: 'men' })
  const nonbinaryForAll = person('n1', { gender: 'nonbinary', showMe: 'everyone' })

  assert.equal(canSee(manForWomen, womanForMen, rel, now), true)
  assert.equal(canSee(womanForMen, manForWomen, rel, now), true)
  /* he asked for women; she asked for women, not men */
  assert.equal(canSee(manForWomen, womanForWomen, rel, now), false)
  assert.equal(canSee(womanForWomen, womanForAll, rel, now), true)
  assert.equal(canSee(manForMen, manForWomen, rel, now), false)
  /* non-binary people appear to those who asked for everyone, and see who asked for everyone */
  assert.equal(canSee(nonbinaryForAll, womanForAll, rel, now), true)
  assert.equal(canSee(nonbinaryForAll, womanForMen, rel, now), false)
  assert.equal(canSee(womanForMen, nonbinaryForAll, rel, now), false)
})

test('hidden, unfinished and under-age profiles never reach the deck', () => {
  const now = START
  const me = person('me', { gender: 'man', showMe: 'women' })
  const rel = noRelations()
  assert.equal(canSee(me, person('h', { hidden: true }), rel, now), false)
  assert.equal(canSee(me, person('i', { active: false }), rel, now), false)
  assert.equal(canSee(me, person('y', { birthDate: '2010-01-01' }), rel, now), false)
})

test('a shiuli puts its sender first, and the aajker special leads until it is swiped', () => {
  const now = START
  const day = istDayKey(now)
  const me = person('me', { gender: 'man', showMe: 'women' })
  const pool = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => person(id, { night: id === 'f' ? 'navami' : 'ashtami' }))
  const rel = { ...noRelations(), shiuliFrom: new Set(['f']) }
  const first = buildDeck(me, pool, rel, now, { day })
  assert.equal(first.entries.filter((e) => e.pick).length, 1)
  assert.equal(first.entries[0].pick, true, 'the pick leads')
  assert.equal(first.entries.find((e) => e.profile.id === 'f').shiuliFromThem, true)
  /* the pick is kept for the day; once it is swiped there is no second one */
  const again = buildDeck(me, pool.filter((p) => p.id !== first.pickId), rel, now, { day, pickId: first.pickId })
  assert.equal(again.entries.some((e) => e.pick), false)
})

test('the reason on a card is plain words, never a number', () => {
  const me = person('me', { vibes: ['bhog_first', 'dhaak', 'adda'] })
  assert.equal(reasonFor(me, person('x', { vibes: ['bhog_first', 'photo_walk', 'roll'] })), 'you both said bhog first.')
  assert.equal(reasonFor(me, person('x', { vibes: ['dhaak', 'bhog_first', 'roll'] })), 'you both said bhog first and dhaak.')
  assert.equal(reasonFor(me, person('x', { vibes: ['themes', 'photo_walk', 'roll'], zone: 'south' })), 'same night: ashtami.')
  assert.equal(
    reasonFor({ ...me, archetype: 'night_owl', night: 'navami', zone: 'south' }, person('x', { vibes: ['themes', 'photo_walk', 'roll'], archetype: 'night_owl' })),
    'two night owls. nobody\'s going home.',
  )
  for (const zone of ZONES.map((z) => z.id)) {
    const line = reasonFor(me, person('x', { vibes: ['themes', 'photo_walk', 'roll'], night: 'dashami', zone }))
    assert.doesNotMatch(line, /\d|%/)
  }
})

/* -------------------------------------------------------- the match -- */

test('a match is one ordered pair, whichever of them swiped first', () => {
  assert.deepEqual(orderedPair('p2', 'p1'), ['p1', 'p2'])
  assert.deepEqual(orderedPair('p1', 'p2'), ['p1', 'p2'])
})

test('the first-move rule comes from the one constant: women first with men, anyone otherwise', () => {
  assert.equal(FIRST_MOVE.womanFirst, true, 'on by default')
  assert.equal(firstMoveBy('man', 'woman'), 'woman')
  assert.equal(firstMoveBy('woman', 'man'), 'woman')
  for (const [a, b] of [['woman', 'woman'], ['man', 'man'], ['nonbinary', 'woman'], ['nonbinary', 'man'], ['nonbinary', 'nonbinary']]) {
    assert.equal(firstMoveBy(a, b), 'either', `${a} + ${b}`)
  }
  assert.equal(whoMovesFirst('woman', 'man'), 'you')
  assert.equal(whoMovesFirst('man', 'woman'), 'them')
  assert.equal(firstMoveBy('man', 'woman', { ...FIRST_MOVE, womanFirst: false }), 'either')
})

test('a match waits 24 hours for its first message, can be extended once, and never expires after it', () => {
  const created = START
  const hours = FIRST_MOVE.expiresAfterHours
  const match = { createdAt: created, expiresAt: initialExpiry(created), firstMoveAt: null, extensionsUsed: 0 }
  assert.equal(match.expiresAt.getTime() - created.getTime(), hours * HOUR)
  assert.equal(matchStatus(match, new Date(created.getTime() + hours * HOUR - 1)), 'waiting')
  assert.equal(matchStatus(match, new Date(created.getTime() + hours * HOUR)), 'expired')

  const now = new Date(created.getTime() + HOUR)
  assert.deepEqual(canWrite(match, 'man', 'woman', now), { ok: false, reason: 'their-move' })
  assert.deepEqual(canWrite(match, 'woman', 'man', now), { ok: true, firstMove: true })
  assert.deepEqual(canWrite(match, 'man', 'man', now), { ok: true, firstMove: true })

  assert.equal(canExtend(match, now), true)
  const extended = { ...match, expiresAt: extendedExpiry(match), extensionsUsed: 1 }
  assert.equal(extended.expiresAt.getTime() - match.expiresAt.getTime(), FIRST_MOVE.extendHours * HOUR)
  assert.equal(canExtend(extended, now), FIRST_MOVE.extensions > 1)

  const opened = { ...match, firstMoveAt: now, expiresAt: null }
  assert.equal(matchStatus(opened, new Date(created.getTime() + 30 * 24 * HOUR)), 'open')
  assert.equal(canExtend(opened, now), false)
  assert.deepEqual(canWrite(opened, 'man', 'woman', now), { ok: true, firstMove: false })
  assert.deepEqual(canWrite(match, 'woman', 'man', new Date(created.getTime() + hours * HOUR)), { ok: false, reason: 'expired' })
})

/* --------------------------------------------------------- the plan -- */

test('every match gets the same plan from either side: a real pandal, before 9 pm or in the morning', () => {
  const a = { id: 'p1', night: 'navami', zone: 'north', vibes: ['dhaak', 'adda', 'after_midnight'] }
  const b = { id: 'p2', night: 'ashtami', zone: 'south', vibes: ['dhaak', 'roll', 'themes'] }
  const plan = suggestPlan(a, b)
  assert.deepEqual(suggestPlan(b, a), plan)
  assert.equal(plan.night, 'ashtami')
  assert.equal(plan.time, '7 pm, for the sandhya arati')
  assert.ok(PLAN_PANDALS.some((p) => p.name === plan.pandal && p.zone === plan.zone))
  assert.equal(planNight('saptami', 'dashami'), 'saptami')

  for (const za of ZONES.map((z) => z.id)) {
    for (const vibe of VIBES.map((v) => v.id)) {
      const p = suggestPlan({ ...a, zone: za, vibes: [vibe] }, { ...b, zone: 'howrah', vibes: [vibe] })
      assert.ok(PLAN_PANDALS.some((x) => x.name === p.pandal), `${za} has somewhere to meet`)
      const [, h, , ampm] = /^(\d{1,2})(:\d\d)? (am|pm)/.exec(p.time) ?? []
      assert.ok(h, p.time)
      const hour24 = (Number(h) % 12) + (ampm === 'pm' ? 12 : 0)
      assert.ok(hour24 >= 6 && hour24 < 21, `${p.time} starts in daylight or before 9 pm`)
    }
  }
})

/* ------------------------------------------------ text and the share card -- */

test('chat is text only: no links, trimmed, and capped', () => {
  for (const link of ['see https://x.co', 'www.site.in/x', 'dm me t.me/abc', 'wa.me/919999', 'bit.ly/abc', 'mysite.com']) {
    assert.equal(hasLink(link), true, link)
    assert.equal(checkMessage(link).ok, false, link)
  }
  for (const fine of ['meet at 7.30 at the gate', 'bagbazar, ashtami, 7 pm', 'my insta is @ananya.k', 'e.g. the roll']) {
    assert.equal(checkMessage(fine).ok, true, fine)
  }
  assert.equal(checkMessage('   ').ok, false)
  assert.equal(checkMessage('x'.repeat(LIMITS.messageMax + 1)).ok, false)
  assert.equal(cleanText('hi\u202eevil\u200b  there'), 'hievil there')
})

test('handles are cleaned, and only real-looking ones are kept', () => {
  assert.deepEqual(checkHandle('instagram', '@ananya.k'), { ok: true, value: 'ananya.k' })
  assert.deepEqual(checkHandle('instagram', 'https://www.instagram.com/ananya.k/'), { ok: true, value: 'ananya.k' })
  assert.deepEqual(checkHandle('instagram', ''), { ok: true, value: null })
  assert.equal(checkHandle('instagram', 'bad handle').ok, false)
  assert.equal(checkHandle('instagram', '.dot').ok, false)
  assert.deepEqual(checkHandle('snapchat', 'rik_22'), { ok: true, value: 'rik_22' })
  assert.equal(checkHandle('snapchat', '1abc').ok, false)
})

test('the share card carries the night, the area and two vibes, and nobody’s name', () => {
  const card = { night: 'ashtami', zone: 'north', vibes: ['bhog_first', 'dhaak'] }
  const token = encodeMatchCard(card)
  assert.match(token, /^[A-Za-z0-9_-]{7}$/)
  assert.deepEqual(decodeMatchCard(token), card)
  for (const forged of ['', 'AAAA', 'x'.repeat(40), `${token.slice(0, 6)}!`, encodeMatchCard(card).replace(/^./, 'Z')]) {
    assert.equal(decodeMatchCard(forged), null, forged)
  }
})

test('every line the match card preview draws has been shaped, and the shared page carries nobody', async () => {
  for (const line of OG_LINES) {
    assert.ok(OG_PATHS[`${line.face}:${line.text}`]?.d, `${line.face} "${line.text}": run python3 scripts/pujo/generate-paths.py ashtami`)
  }
  const page = await read('app/(open)/experience/ashtami-date/[token]/page.tsx')
  const image = await read('app/(open)/experience/ashtami-date/[token]/opengraph-image.tsx')
  for (const source of [page, image]) assert.doesNotMatch(source, /firstName|\.photos|socialHandle|requireUser|currentUserId|prisma/)
})

/* ------------------------------------------------------------ photos -- */

function segment(marker, payload) {
  const length = payload.length + 2
  return [0xff, marker, length >> 8, length & 255, ...payload]
}
const ascii = (text) => [...Buffer.from(text, 'latin1')]

function jpeg({ width = 640, height = 800, between = [] } = {}) {
  return Uint8Array.from([
    0xff, 0xd8,
    ...segment(0xe0, [...ascii('JFIF\0'), 1, 1, 0, 0, 1, 0, 1, 0, 0]),
    ...segment(0xe1, [...ascii('Exif\0\0'), ...ascii('GPS 22.5726N 88.3639E Kolkata')]),
    ...segment(0xfe, ascii('shot on a phone by ananya')),
    ...segment(0xdb, [0, ...new Array(64).fill(1)]),
    ...segment(0xc0, [8, height >> 8, height & 255, width >> 8, width & 255, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]),
    ...segment(0xc4, [0, ...new Array(28).fill(0)]),
    ...segment(0xda, [3, 1, 0, 2, 0x11, 3, 0x11, 0, 0x3f, 0]),
    0x12, 0x34, 0xff, 0x00, 0x56, 0xff, 0xd0, 0x78,
    ...between,
    0xff, 0xd9,
  ])
}

test('photo metadata is stripped: EXIF, GPS, comments and anything hidden between scans', () => {
  const second = [...segment(0xe1, ascii('Exif\0\0GPS again')), ...segment(0xda, [3, 1, 0, 2, 0x11, 3, 0x11, 0, 0x3f, 0]), 0x9a, 0xbc]
  for (const file of [jpeg(), jpeg({ between: second })]) {
    const out = stripJpegMetadata(file)
    assert.ok(out)
    const text = Buffer.from(out.bytes).toString('latin1')
    assert.doesNotMatch(text, /Exif|GPS|ananya|JFIF/)
    assert.equal(out.width, 640)
    assert.equal(out.height, 800)
    assert.deepEqual([...out.bytes.slice(0, 2)], [0xff, 0xd8])
    assert.deepEqual([...out.bytes.slice(-2)], [0xff, 0xd9])
    /* the picture itself, escaped bytes and restart markers included, is untouched */
    assert.ok(text.includes(Buffer.from([0x12, 0x34, 0xff, 0x00, 0x56, 0xff, 0xd0, 0x78]).toString('latin1')))
  }
  assert.equal(stripJpegMetadata(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), null, 'a PNG')
  assert.equal(stripJpegMetadata(jpeg().slice(0, -2)), null, 'cut short')
})

/* ------------------------------------------ the handlers, in memory -- */

const tick = () => new Promise((resolve) => setImmediate(resolve))

/*
 * The database, as the handlers use it, with the same constraints Postgres
 * enforces (one swipe per pair and direction, one shiuli a day, one match per
 * pair, one photo per slot). swipe() yields between every read and write, so
 * concurrent swipes really interleave; `lock` is the per-pair advisory lock
 * the Prisma repository takes.
 */
function memoryRepository({ lock = true } = {}) {
  const db = { profiles: [], photos: [], swipes: [], matches: [], messages: [], blocks: [], reports: [] }
  let seq = 0
  const nextId = (prefix) => `${prefix}${String(++seq).padStart(4, '0')}`
  const copy = (row) => (row ? structuredClone(row) : null)
  const tails = new Map()

  async function withLock(key, fn) {
    if (!lock) return fn()
    const previous = tails.get(key) ?? Promise.resolve()
    let release
    const mine = new Promise((resolve) => { release = resolve })
    tails.set(key, previous.then(() => mine))
    await previous
    try {
      return await fn()
    } finally {
      release()
    }
  }

  function insertSwipe(row) {
    if (db.swipes.some((s) => s.swiperId === row.swiperId && s.targetId === row.targetId)) throw new Error('unique (swiperId, targetId)')
    if (row.shiuliDay && db.swipes.some((s) => s.swiperId === row.swiperId && s.shiuliDay === row.shiuliDay)) throw new Error('unique (swiperId, shiuliDay)')
    db.swipes.push(row)
  }
  function insertMatch(row) {
    if (db.matches.some((m) => m.aId === row.aId && m.bId === row.bId)) throw new Error('unique (aId, bId)')
    db.matches.push(row)
  }
  const inMatch = (m, profileId) => m.aId === profileId || m.bId === profileId

  const repo = {
    db,
    async profileByUser(userId) { return copy(db.profiles.find((p) => p.userId === userId)) },
    async profilesById(ids) { return db.profiles.filter((p) => ids.includes(p.id)).map(copy) },
    async createProfile(userId, birthDate, now) {
      const found = db.profiles.find((p) => p.userId === userId)
      if (found) return copy(found)
      const row = {
        id: nextId('p'), userId, birthDate, firstName: null, gender: null, showMe: null, night: null, zone: null, vibes: [],
        promptId: null, promptAnswer: null, socialKind: null, socialHandle: null, archetype: null, consentedAt: null,
        active: false, hiddenAt: null, pickDay: null, pickId: null, createdAt: now, updatedAt: now,
      }
      db.profiles.push(row)
      return copy(row)
    },
    async updateProfile(id, patch) {
      const row = db.profiles.find((p) => p.id === id)
      /* never the owner, the id or the date of birth, as in the Prisma repository */
      const allowed = Object.fromEntries(Object.entries(patch).filter(([key]) => !['id', 'userId', 'birthDate', 'createdAt'].includes(key)))
      Object.assign(row, allowed, { updatedAt: new Date() })
      return copy(row)
    },
    async deleteProfile(id) {
      const matchIds = db.matches.filter((m) => inMatch(m, id)).map((m) => m.id)
      db.profiles = db.profiles.filter((p) => p.id !== id)
      db.photos = db.photos.filter((p) => p.profileId !== id)
      db.swipes = db.swipes.filter((s) => s.swiperId !== id && s.targetId !== id)
      db.matches = db.matches.filter((m) => !inMatch(m, id))
      db.messages = db.messages.filter((m) => !matchIds.includes(m.matchId) && m.senderId !== id)
    },
    async photosOf(ids) { return db.photos.filter((p) => ids.includes(p.profileId)).sort((a, b) => a.position - b.position).map(copy) },
    async addPhoto(profileId, photo, max) {
      return withLock(`photos:${profileId}`, async () => {
        const taken = new Set(db.photos.filter((p) => p.profileId === profileId).map((p) => p.position))
        const position = [...Array(max).keys()].find((i) => !taken.has(i))
        if (position === undefined) return null
        const row = { id: nextId('ph'), profileId, position, ...photo }
        db.photos.push(row)
        return copy(row)
      })
    },
    async removePhoto(profileId, photoId) {
      const row = db.photos.find((p) => p.id === photoId && p.profileId === profileId)
      db.photos = db.photos.filter((p) => p !== row)
      return copy(row)
    },
    /* deliberately hands back everyone: the handler's rules must do the filtering */
    async deckPool(viewer) {
      return { candidates: db.profiles.map(copy), relations: await repo.relations(viewer, db.profiles) }
    },
    async relations(viewer, others) {
      const ids = new Set(others.map((o) => o.id))
      const users = new Set(others.map((o) => o.userId))
      return {
        swiped: new Set(db.swipes.filter((s) => s.swiperId === viewer.id && ids.has(s.targetId)).map((s) => s.targetId)),
        passedOnViewer: new Set(db.swipes.filter((s) => s.targetId === viewer.id && !s.liked && ids.has(s.swiperId)).map((s) => s.swiperId)),
        blockedUsers: new Set(db.blocks.flatMap((b) =>
          b.blockerUserId === viewer.userId && users.has(b.blockedUserId) ? [b.blockedUserId]
            : b.blockedUserId === viewer.userId && users.has(b.blockerUserId) ? [b.blockerUserId] : [])),
        shiuliFrom: new Set(db.swipes.filter((s) => s.targetId === viewer.id && s.liked && s.shiuliDay && ids.has(s.swiperId)).map((s) => s.swiperId)),
      }
    },
    async shiuliSpent(profileId, day) { return db.swipes.filter((s) => s.swiperId === profileId && s.shiuliDay === day).length },
    /* A transaction under READ COMMITTED: its reads see only committed rows, and its own
       writes land together at the end. Without the lock, two of them can't see each other. */
    async swipe({ swiper, target, liked, shiuliDay, now, plan, expiresAt }) {
      const [aId, bId] = orderedPair(swiper.id, target.id)
      const pairMatch = () => db.matches.find((m) => m.aId === aId && m.bId === bId)
      return withLock(`pair:${aId}:${bId}`, async () => {
        await tick()
        if (db.swipes.some((s) => s.swiperId === swiper.id && s.targetId === target.id)) {
          return { status: 'duplicate', match: copy(pairMatch()), created: false }
        }
        const transaction = async () => {
          if (shiuliDay && db.swipes.some((s) => s.swiperId === swiper.id && s.shiuliDay === shiuliDay)) {
            return { status: 'shiuli-spent', match: null, created: false }
          }
          await tick()
          const back = liked ? db.swipes.find((s) => s.swiperId === target.id && s.targetId === swiper.id) : null
          await tick()
          let match = back?.liked ? pairMatch() ?? null : null
          const created = Boolean(back?.liked && !match)
          if (created) match = { id: nextId('m'), aId, bId, createdAt: now, expiresAt, extensionsUsed: 0, firstMoveAt: null, plan, aReadAt: null, bReadAt: null }
          /* commit */
          insertSwipe({ swiperId: swiper.id, targetId: target.id, liked, shiuliDay, createdAt: now })
          if (created) insertMatch(match)
          return { status: 'ok', match: copy(match), created }
        }
        return shiuliDay ? withLock(`shiuli:${swiper.id}`, transaction) : transaction()
      })
    },
    async matchesOf(profileId) { return db.matches.filter((m) => inMatch(m, profileId)).map(copy) },
    async matchById(id) { return copy(db.matches.find((m) => m.id === id)) },
    async lastMessages(matchIds, now) {
      const out = new Map()
      for (const m of [...db.messages].sort((a, b) => a.createdAt - b.createdAt)) {
        if (matchIds.includes(m.matchId) && m.expiresAt > now) out.set(m.matchId, copy(m))
      }
      return out
    },
    async messagesOf(matchId, now, take) {
      return db.messages.filter((m) => m.matchId === matchId && m.expiresAt > now).sort((a, b) => a.createdAt - b.createdAt).slice(-take).map(copy)
    },
    async addMessage({ match, senderId, body, now, expiresAt, firstMoveAllowed }) {
      const row = db.matches.find((m) => m.id === match.id && inMatch(m, senderId))
      if (!row) return { error: 'gone' }
      if (!row.firstMoveAt) {
        if (row.expiresAt && row.expiresAt <= now) return { error: 'gone' }
        if (!firstMoveAllowed) return { error: 'their-move' }
        Object.assign(row, { firstMoveAt: now, expiresAt: null })
      }
      const message = { id: nextId('msg'), matchId: row.id, senderId, body, createdAt: now, expiresAt }
      db.messages.push(message)
      return { message: copy(message), match: copy(row) }
    },
    async extendMatch(match, now, rule) {
      const row = db.matches.find((m) => m.id === match.id)
      if (!row || row.firstMoveAt || !row.expiresAt || row.expiresAt.getTime() !== match.expiresAt?.getTime()) return null
      if (row.expiresAt <= now || row.extensionsUsed >= rule.extensions) return null
      Object.assign(row, { expiresAt: extendedExpiry(row, rule), extensionsUsed: row.extensionsUsed + 1 })
      return copy(row)
    },
    async markRead(matchId, profileId, now) {
      const row = db.matches.find((m) => m.id === matchId)
      if (row?.aId === profileId) row.aReadAt = now
      if (row?.bId === profileId) row.bReadAt = now
    },
    async deleteMatch(matchId, profileId) {
      const before = db.matches.length
      db.matches = db.matches.filter((m) => !(m.id === matchId && inMatch(m, profileId)))
      db.messages = db.messages.filter((m) => db.matches.some((x) => x.id === m.matchId))
      return db.matches.length < before
    },
    async block({ blockerUserId, blockedUserId, blockerProfileId, blockedProfileId, now }) {
      if (!db.blocks.some((b) => b.blockerUserId === blockerUserId && b.blockedUserId === blockedUserId)) {
        db.blocks.push({ blockerUserId, blockedUserId, createdAt: now })
      }
      const [aId, bId] = orderedPair(blockerProfileId, blockedProfileId)
      db.matches = db.matches.filter((m) => !(m.aId === aId && m.bId === bId))
      db.messages = db.messages.filter((m) => db.matches.some((x) => x.id === m.matchId))
    },
    async report(input) {
      db.reports.push({ ...input, status: 'OPEN', createdAt: input.now })
      return { reporters: new Set(db.reports.filter((r) => r.reportedUserId === input.reportedUserId && r.status === 'OPEN').map((r) => r.reporterUserId)).size }
    },
    async reportsSince(userId, since) { return db.reports.filter((r) => r.reporterUserId === userId && r.createdAt >= since).length },
    async hideProfile(profileId, now) {
      const row = db.profiles.find((p) => p.id === profileId)
      if (row && !row.hiddenAt) row.hiddenAt = now
    },
    async purgeExpired(now) {
      const before = [db.messages.length, db.matches.length]
      db.messages = db.messages.filter((m) => m.expiresAt > now)
      db.matches = db.matches.filter((m) => m.firstMoveAt || !m.expiresAt || m.expiresAt > now)
      return { messages: before[0] - db.messages.length, matches: before[1] - db.matches.length }
    },
  }
  return repo
}

/* A bucket that signs with opaque tokens, so a storage key can only leave the server by mistake. */
function memoryPhotos() {
  const objects = new Map()
  let n = 0
  const tokens = new Map()
  return {
    objects,
    ready: true,
    async put(key, bytes) { objects.set(key, bytes) },
    async remove(keys) { for (const key of keys) objects.delete(key) },
    async sign(keys) {
      return new Map(keys.filter((k) => objects.has(k)).map((k) => {
        if (!tokens.has(k)) tokens.set(k, `https://signed.test/o/${++n}?token=t${n}`)
        return [k, tokens.get(k)]
      }))
    },
  }
}

function setup({ lock = true } = {}) {
  const clock = { now: START }
  const repo = memoryRepository({ lock })
  const photos = memoryPhotos()
  let keys = 0
  const handlers = createAshtamiDateHandlers({
    repo,
    photos,
    clock: () => new Date(clock.now),
    defer: () => {},
    newKey: () => `private/${++keys}.jpg`,
  })
  return { handlers, repo, photos, clock }
}

const put = (body) => new Request('http://localhost/api/ashtami-date/me', {
  method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
})
const post = (body) => new Request('http://localhost/api/ashtami-date/x', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
})
function photoRequest(bytes = jpeg()) {
  const form = new FormData()
  form.set('photo', new Blob([bytes], { type: 'image/jpeg' }), 'me.jpg')
  return new Request('http://localhost/api/ashtami-date/photos', { method: 'POST', body: form })
}

const DEFAULTS = {
  birthDate: '1998-06-01', gender: 'woman', showMe: 'men', night: 'ashtami', zone: 'north',
  vibes: ['bhog_first', 'dhaak', 'adda'], promptId: 'queue_for', promptAnswer: 'the bagbazar bhog, obviously',
}

async function onboard(handlers, userId, over = {}) {
  const p = { firstName: userId.replace(/[^a-z]/gi, '').slice(0, 12) || 'someone', ...DEFAULTS, ...over }
  const steps = [
    await handlers.putMe(put({ step: 1, birthDate: p.birthDate }), userId),
    await handlers.putMe(put({ step: 2, firstName: p.firstName, gender: p.gender, showMe: p.showMe }), userId),
    await handlers.addPhoto(photoRequest(), userId),
    await handlers.putMe(put({ step: 3 }), userId),
    await handlers.putMe(put({ step: 4, night: p.night, zone: p.zone, vibes: p.vibes }), userId),
    await handlers.putMe(put({
      step: 5, promptId: p.promptId, promptAnswer: p.promptAnswer, consent: true,
      socialKind: p.socialHandle ? 'instagram' : null, socialHandle: p.socialHandle ?? null,
    }), userId),
  ]
  for (const res of steps) assert.ok(res.status < 300, `${userId}: ${res.status} ${await res.clone().text()}`)
  const { profile } = await steps.at(-1).json()
  assert.equal(profile.complete, true)
  return profile
}

async function deckOf(handlers, userId) {
  const res = await handlers.deck(userId)
  assert.equal(res.status, 200)
  return (await res.json()).cards
}

const like = (handlers, userId, targetId, extra = {}) => handlers.swipe(post({ targetId, liked: true, ...extra }), userId)

test('signed out, every handler answers 401 and touches nothing', async () => {
  const { handlers, repo } = setup()
  const results = [
    await handlers.getMe(null), await handlers.putMe(put({ step: 1, birthDate: '1998-01-01' }), null), await handlers.deleteMe(null),
    await handlers.addPhoto(photoRequest(), null), await handlers.removePhoto(null, 'x'), await handlers.deck(null),
    await handlers.swipe(post({ targetId: 'x', liked: true }), null), await handlers.matches(null), await handlers.unmatch(null, 'x'),
    await handlers.extend(null, 'x'), await handlers.messages(null, 'x'), await handlers.send(post({ body: 'hi' }), null, 'x'),
    await handlers.block(post({ profileId: 'x' }), null), await handlers.report(post({ profileId: 'x', reason: 'fake' }), null),
  ]
  assert.deepEqual(results.map((r) => r.status), results.map(() => 401))
  assert.equal(repo.db.profiles.length, 0)
})

test('under 18 at the gate: a kind refusal, and nothing is stored', async () => {
  const { handlers, repo } = setup()
  const res = await handlers.putMe(put({ step: 1, birthDate: '2009-01-01' }), 'kid')
  assert.equal(res.status, 403)
  const body = await res.json()
  assert.equal(body.underAge, true)
  assert.doesNotMatch(body.message, /!/)
  assert.equal(repo.db.profiles.length, 0)
  /* and the server enforces it, whatever the page does: no step 2 without step 1 */
  assert.equal((await handlers.putMe(put({ step: 2, firstName: 'Kid', gender: 'man', showMe: 'women' }), 'kid')).status, 409)
})

test('onboarding is resumable, a step at a time, and a date of birth can’t be changed later', async () => {
  const { handlers } = setup()
  await handlers.putMe(put({ step: 1, birthDate: '1998-06-01' }), 'u1')
  await handlers.putMe(put({ step: 2, firstName: 'Ananya', gender: 'woman', showMe: 'men' }), 'u1')
  const { profile } = await (await handlers.getMe('u1')).json()
  assert.equal(profile.step, 3, 'picks up at the photos')
  assert.equal(profile.complete, false)
  assert.equal((await handlers.putMe(put({ step: 1, birthDate: '1990-01-01' }), 'u1')).status, 409)
  assert.equal((await handlers.putMe(put({ step: 4, night: 'ashtami', zone: 'north', vibes: ['adda'] }), 'u1')).status, 400)
  assert.equal((await handlers.putMe(put({ step: 5, promptId: 'queue_for', promptAnswer: 'bhog', consent: false }), 'u1')).status, 400)
  assert.equal((await handlers.deck('u1')).status, 409, 'no deck before the card is finished')
})

test('photos: stripped before storage, three at most, and removed with the profile', async () => {
  const { handlers, photos, repo } = setup()
  await onboard(handlers, 'u1')
  const stored = [...photos.objects.values()][0]
  assert.doesNotMatch(Buffer.from(stored).toString('latin1'), /Exif|GPS/)
  assert.equal((await handlers.addPhoto(photoRequest(), 'u1')).status, 201)
  assert.equal((await handlers.addPhoto(photoRequest(), 'u1')).status, 201)
  assert.equal((await handlers.addPhoto(photoRequest(), 'u1')).status, 409)
  assert.equal((await handlers.addPhoto(photoRequest(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3])), 'u2')).status, 409, 'no profile yet')
  assert.equal(photos.objects.size, 3)

  const res = await handlers.deleteMe('u1')
  assert.equal(res.status, 204)
  assert.equal(photos.objects.size, 0)
  assert.equal(repo.db.profiles.length, 0)
  assert.equal(repo.db.photos.length, 0)
})

test('a card never carries a user id, a date of birth, a handle or a storage key', async () => {
  const { handlers, repo } = setup()
  await onboard(handlers, 'her-auth-id', { gender: 'woman', showMe: 'men', socialHandle: 'secret.handle' })
  await onboard(handlers, 'his-auth-id', { gender: 'man', showMe: 'women' })
  const res = await handlers.deck('his-auth-id')
  const text = await res.text()
  const [card] = JSON.parse(text).cards
  assert.equal(card.firstName, 'herauthid')
  assert.equal(card.age, 28)
  assert.equal(card.area, 'north kolkata')
  assert.match(card.photos[0], /^https:\/\/signed\.test\//)
  for (const secret of ['her-auth-id', '1998-06-01', 'secret.handle', 'private/', ...repo.db.photos.map((p) => p.storageKey)]) {
    assert.ok(!text.includes(secret), `the deck leaked ${secret}`)
  }
  /* no score of any kind next to a stranger: the only number on a card is an age */
  assert.deepEqual(Object.keys(card).sort(), ['age', 'archetype', 'area', 'firstName', 'id', 'night', 'photos', 'pick', 'plan', 'prompt', 'reason', 'shiuliFromThem', 'vibes'])
  assert.doesNotMatch(card.reason, /\d|%/)
})

test('the deck, end to end: show-me both ways, blocks both ways, nothing swiped twice', async () => {
  const { handlers } = setup()
  const her = await onboard(handlers, 'her', { gender: 'woman', showMe: 'men' })
  await onboard(handlers, 'him', { gender: 'man', showMe: 'women' })
  await onboard(handlers, 'other-woman', { gender: 'woman', showMe: 'women' })
  await onboard(handlers, 'second-man', { gender: 'man', showMe: 'women' })
  assert.ok(her)

  const hisDeck = (await deckOf(handlers, 'him')).map((c) => c.firstName)
  assert.deepEqual(hisDeck, ['her'])
  assert.deepEqual((await deckOf(handlers, 'her')).map((c) => c.firstName).sort(), ['him', 'secondman'])

  /* she blocks the second man: they vanish for each other */
  const second = (await deckOf(handlers, 'her')).find((c) => c.firstName === 'secondman')
  assert.equal((await handlers.block(post({ profileId: second.id }), 'her')).status, 204)
  assert.deepEqual((await deckOf(handlers, 'her')).map((c) => c.firstName), ['him'])
  assert.deepEqual(await deckOf(handlers, 'second-man'), [])

  /* a pass is final, both ways */
  const him = (await deckOf(handlers, 'her'))[0]
  assert.equal((await handlers.swipe(post({ targetId: him.id, liked: false }), 'her')).status, 200)
  assert.deepEqual(await deckOf(handlers, 'her'), [])
  assert.deepEqual(await deckOf(handlers, 'him'), [], 'she passed on him, so he never sees her again')
  /* and a swipe on someone the rules hide is refused like a missing card */
  assert.equal((await handlers.swipe(post({ targetId: second.id, liked: true }), 'her')).status, 404)
})

test('a mutual like makes one match, the same from both sides, even when both swipe at once, twice', async () => {
  const { handlers, repo } = setup()
  const her = await onboard(handlers, 'her', { gender: 'woman', showMe: 'men' })
  const him = await onboard(handlers, 'him', { gender: 'man', showMe: 'women' })
  const herId = repo.db.profiles.find((p) => p.userId === 'her').id
  const hisId = repo.db.profiles.find((p) => p.userId === 'him').id
  assert.ok(her && him)

  const results = await Promise.all([
    like(handlers, 'her', hisId), like(handlers, 'him', herId),
    like(handlers, 'her', hisId), like(handlers, 'him', herId),
  ])
  assert.deepEqual(results.map((r) => r.status), [200, 200, 200, 200])
  const bodies = await Promise.all(results.map((r) => r.json()))
  assert.equal(repo.db.matches.length, 1)
  assert.equal(bodies.filter((b) => b.created).length, 1, 'created exactly once')
  assert.equal(repo.db.swipes.length, 2, 'the repeated swipes were answered, not stored')

  const [match] = repo.db.matches
  assert.deepEqual([match.aId, match.bId], orderedPair(herId, hisId))
  const hers = (await (await handlers.matches('her')).json()).matches
  const his = (await (await handlers.matches('him')).json()).matches
  assert.equal(hers.length, 1)
  assert.equal(his.length, 1)
  assert.equal(hers[0].id, his[0].id)
  assert.deepEqual(hers[0].plan, his[0].plan)
  assert.equal(hers[0].them.firstName, 'him')
  assert.equal(his[0].them.firstName, 'her')
})

test('without the pair lock the same race loses the match, which is why the repository takes one', async () => {
  const { handlers, repo } = setup({ lock: false })
  await onboard(handlers, 'her', { gender: 'woman', showMe: 'men' })
  await onboard(handlers, 'him', { gender: 'man', showMe: 'women' })
  const herId = repo.db.profiles.find((p) => p.userId === 'her').id
  const hisId = repo.db.profiles.find((p) => p.userId === 'him').id
  await Promise.all([like(handlers, 'her', hisId), like(handlers, 'him', herId)])
  assert.equal(repo.db.matches.length, 0)
})

test('one shiuli a day, even two at once', async () => {
  const { handlers, repo, clock } = setup()
  await onboard(handlers, 'him', { gender: 'man', showMe: 'women' })
  await onboard(handlers, 'a', { gender: 'woman', showMe: 'men' })
  await onboard(handlers, 'b', { gender: 'woman', showMe: 'men' })
  const [a, b] = ['a', 'b'].map((u) => repo.db.profiles.find((p) => p.userId === u).id)
  const [first, second] = await Promise.all([like(handlers, 'him', a, { shiuli: true }), like(handlers, 'him', b, { shiuli: true })])
  assert.deepEqual([first.status, second.status].sort(), [200, 409])
  assert.equal(repo.db.swipes.filter((s) => s.shiuliDay).length, 1)
  /* she sees who sent it */
  const target = first.status === 200 ? 'a' : 'b'
  assert.equal((await deckOf(handlers, target))[0].shiuliFromThem, true)
  /* a new one blooms at midnight, Kolkata time */
  clock.now = new Date('2026-10-06T00:05:00+05:30')
  const deck = await (await handlers.deck('him')).json()
  assert.equal(deck.shiuliLeft, 1)
})

test('in a man–woman match she writes first; handles unlock with the first message', async () => {
  const { handlers, repo } = setup()
  await onboard(handlers, 'her', { gender: 'woman', showMe: 'men', socialHandle: 'her.insta' })
  await onboard(handlers, 'him', { gender: 'man', showMe: 'women', socialHandle: 'his.insta' })
  const herId = repo.db.profiles.find((p) => p.userId === 'her').id
  const hisId = repo.db.profiles.find((p) => p.userId === 'him').id
  await like(handlers, 'her', hisId)
  const { match } = await (await like(handlers, 'him', herId)).json()
  assert.equal(match.firstMove, 'them')
  assert.equal(match.canWrite, false)
  assert.equal(match.handles.theirs, null)
  assert.equal(match.handles.locked, true)

  const early = await handlers.send(post({ body: 'hi' }), 'him', match.id)
  assert.equal(early.status, 409)
  assert.equal((await early.json()).blocked, 'their-move')
  assert.equal(repo.db.messages.length, 0)

  assert.equal((await handlers.send(post({ body: 'bagbazar, 7 pm?' }), 'her', match.id)).status, 201)
  assert.equal((await handlers.send(post({ body: 'see you at the gate' }), 'him', match.id)).status, 201)
  const chat = await (await handlers.messages('him', match.id)).json()
  assert.deepEqual(chat.match.handles.theirs, { kind: 'instagram', handle: 'her.insta' })
  assert.deepEqual(chat.messages.map((m) => [m.mine, m.body]), [[false, 'bagbazar, 7 pm?'], [true, 'see you at the gate']])
  assert.equal((await handlers.send(post({ body: 'www.x.com' }), 'him', match.id)).status, 400)
})

test('two women: either can write first', async () => {
  const { handlers, repo } = setup()
  await onboard(handlers, 'w1', { gender: 'woman', showMe: 'women' })
  await onboard(handlers, 'w2', { gender: 'woman', showMe: 'everyone' })
  const [p1, p2] = ['w1', 'w2'].map((u) => repo.db.profiles.find((p) => p.userId === u).id)
  await like(handlers, 'w1', p2)
  const { match } = await (await like(handlers, 'w2', p1)).json()
  assert.equal(match.firstMove, 'either')
  assert.equal((await handlers.send(post({ body: 'hi' }), 'w2', match.id)).status, 201)
})

test('a match nobody writes in fades after 24 hours, unless extended once', async () => {
  const { handlers, repo, clock } = setup()
  await onboard(handlers, 'her', { gender: 'woman', showMe: 'men' })
  await onboard(handlers, 'him', { gender: 'man', showMe: 'women' })
  const herId = repo.db.profiles.find((p) => p.userId === 'her').id
  const hisId = repo.db.profiles.find((p) => p.userId === 'him').id
  await like(handlers, 'her', hisId)
  const { match } = await (await like(handlers, 'him', herId)).json()

  clock.now = new Date(START.getTime() + 23 * HOUR)
  assert.equal((await handlers.extend('him', match.id)).status, 200, 'either person can extend')
  assert.equal((await handlers.extend('her', match.id)).status, 409, 'once')
  clock.now = new Date(START.getTime() + 47 * HOUR)
  assert.equal((await (await handlers.matches('her')).json()).matches.length, 1)
  clock.now = new Date(START.getTime() + (FIRST_MOVE.expiresAfterHours + FIRST_MOVE.extendHours) * HOUR)
  assert.equal((await (await handlers.matches('her')).json()).matches.length, 0)
  assert.equal((await handlers.send(post({ body: 'sorry, late' }), 'her', match.id)).status, 409)
  assert.equal((await handlers.messages('her', match.id)).status, 410)
})

test('chats are kept 24 hours: gone from the chat on the hour, then deleted', async () => {
  const { handlers, repo, clock } = setup()
  await onboard(handlers, 'w1', { gender: 'woman', showMe: 'women' })
  await onboard(handlers, 'w2', { gender: 'woman', showMe: 'women' })
  const [p1, p2] = ['w1', 'w2'].map((u) => repo.db.profiles.find((p) => p.userId === u).id)
  await like(handlers, 'w1', p2)
  const { match } = await (await like(handlers, 'w2', p1)).json()
  await handlers.send(post({ body: 'hello' }), 'w1', match.id)

  clock.now = new Date(START.getTime() + LIMITS.messageTtlHours * HOUR - 1)
  assert.equal((await (await handlers.messages('w2', match.id)).json()).messages.length, 1)
  clock.now = new Date(START.getTime() + LIMITS.messageTtlHours * HOUR)
  assert.equal((await (await handlers.messages('w2', match.id)).json()).messages.length, 0)
  assert.equal(repo.db.messages.length, 1, 'hidden before it is swept')
  await handlers.purgeExpired()
  assert.equal(repo.db.messages.length, 0)
  /* the match itself stays open: somebody wrote */
  assert.equal((await (await handlers.matches('w1')).json()).matches.length, 1)
})

test('nobody reads a match or a chat that isn’t theirs', async () => {
  const { handlers, repo } = setup()
  await onboard(handlers, 'a', { gender: 'woman', showMe: 'men' })
  await onboard(handlers, 'b', { gender: 'man', showMe: 'women' })
  await onboard(handlers, 'c', { gender: 'woman', showMe: 'men' })
  const [a, b] = ['a', 'b'].map((u) => repo.db.profiles.find((p) => p.userId === u).id)
  await like(handlers, 'a', b)
  const { match } = await (await like(handlers, 'b', a)).json()
  await handlers.send(post({ body: 'meet at the gate' }), 'a', match.id)

  /* c is signed in, has a profile, and knows the match id */
  assert.deepEqual((await (await handlers.matches('c')).json()).matches, [])
  const peek = await handlers.messages('c', match.id)
  assert.equal(peek.status, 404)
  assert.doesNotMatch(await peek.text(), /meet at the gate/)
  assert.equal((await handlers.send(post({ body: 'hi' }), 'c', match.id)).status, 404)
  assert.equal((await handlers.extend('c', match.id)).status, 404)
  assert.equal((await handlers.unmatch('c', match.id)).status, 404)
  assert.equal((await handlers.messages('nobody', match.id)).status, 404)
  assert.equal(repo.db.matches.length, 1)
  assert.equal(repo.db.messages.length, 1)
  /* and a photo can only be removed by its owner */
  const photoId = repo.db.photos.find((p) => p.profileId === a).id
  assert.equal((await handlers.removePhoto('c', photoId)).status, 404)
})

test('block and unmatch end the chat; a report blocks too, keeps the evidence, and three hide a profile', async () => {
  const { handlers, repo } = setup()
  await onboard(handlers, 'her', { gender: 'woman', showMe: 'men' })
  await onboard(handlers, 'him', { gender: 'man', showMe: 'women' })
  const herId = repo.db.profiles.find((p) => p.userId === 'her').id
  const hisId = repo.db.profiles.find((p) => p.userId === 'him').id
  await like(handlers, 'her', hisId)
  const { match } = await (await like(handlers, 'him', herId)).json()
  await handlers.send(post({ body: 'hey' }), 'her', match.id)
  await handlers.send(post({ body: 'something vile' }), 'him', match.id)

  const report = await handlers.report(post({ profileId: hisId, reason: 'harassment', note: 'look at the chat', matchId: match.id }), 'her')
  assert.equal(report.status, 201)
  const [stored] = repo.db.reports
  assert.deepEqual(stored.evidence.map((e) => e.body), ['something vile'], 'only what he sent')
  assert.equal(repo.db.matches.length, 0, 'the report blocked him, which ended the match')
  assert.equal(repo.db.messages.length, 0)
  assert.equal((await handlers.messages('him', match.id)).status, 404)
  assert.equal((await handlers.report(post({ profileId: hisId, reason: 'nonsense' }), 'her')).status, 400)

  for (const u of ['r1', 'r2']) {
    await onboard(handlers, u, { gender: 'woman', showMe: 'men' })
    assert.equal((await handlers.report(post({ profileId: hisId, reason: 'fake' }), u)).status, 201)
  }
  assert.ok(repo.db.profiles.find((p) => p.id === hisId).hiddenAt, 'three people: off the deck for review')
  await onboard(handlers, 'r3', { gender: 'woman', showMe: 'men' })
  assert.deepEqual(await deckOf(handlers, 'r3'), [])
  assert.equal((await (await handlers.deck('him')).json()).paused, true)
})

test('unmatch is final: the chat goes and they never meet in the deck again', async () => {
  const { handlers, repo } = setup()
  await onboard(handlers, 'w1', { gender: 'woman', showMe: 'women' })
  await onboard(handlers, 'w2', { gender: 'woman', showMe: 'women' })
  const [p1, p2] = ['w1', 'w2'].map((u) => repo.db.profiles.find((p) => p.userId === u).id)
  await like(handlers, 'w1', p2)
  const { match } = await (await like(handlers, 'w2', p1)).json()
  await handlers.send(post({ body: 'hi' }), 'w1', match.id)
  assert.equal((await handlers.unmatch('w2', match.id)).status, 204)
  assert.equal(repo.db.messages.length, 0)
  assert.deepEqual(await deckOf(handlers, 'w1'), [])
  assert.deepEqual(await deckOf(handlers, 'w2'), [])
})

test('deleting a dating profile takes its swipes, matches and chats; blocks and reports stay', async () => {
  const { handlers, repo } = setup()
  await onboard(handlers, 'her', { gender: 'woman', showMe: 'men' })
  await onboard(handlers, 'him', { gender: 'man', showMe: 'women' })
  await onboard(handlers, 'third', { gender: 'man', showMe: 'women' })
  const herId = repo.db.profiles.find((p) => p.userId === 'her').id
  const hisId = repo.db.profiles.find((p) => p.userId === 'him').id
  const thirdId = repo.db.profiles.find((p) => p.userId === 'third').id
  await like(handlers, 'her', hisId)
  const { match } = await (await like(handlers, 'him', herId)).json()
  await handlers.send(post({ body: 'hi' }), 'her', match.id)
  await handlers.block(post({ profileId: thirdId }), 'third')
  await handlers.block(post({ profileId: herId }), 'third')

  assert.equal((await handlers.deleteMe('him')).status, 204)
  assert.equal(repo.db.profiles.some((p) => p.userId === 'him'), false)
  assert.equal(repo.db.swipes.some((s) => s.swiperId === hisId || s.targetId === hisId), false)
  assert.equal(repo.db.matches.length, 0)
  assert.equal(repo.db.messages.length, 0)
  assert.equal(repo.db.blocks.length, 1, 'blocking yourself does nothing; the real block stays')

  /* someone blocked who deletes and comes back still can't find her */
  await handlers.deleteMe('third')
  await onboard(handlers, 'third', { gender: 'man', showMe: 'women' })
  assert.deepEqual(await deckOf(handlers, 'third'), [])
})

test('the deck closes after Dashami, and the season’s data goes a week later', async () => {
  const { handlers, clock } = setup()
  await onboard(handlers, 'her', { gender: 'woman', showMe: 'men' })
  clock.now = new Date(SEASON.closesAt.getTime() + 1)
  const deck = await (await handlers.deck('her')).json()
  assert.equal(deck.closed, true)
  assert.equal(SEASON.closesAt.getTime() - new Date(NIGHT_DAYS.dashami.iso).getTime(), 24 * HOUR)
  assert.equal(SEASON.purgeAt.getTime() - SEASON.closesAt.getTime(), 7 * 24 * HOUR)
  assert.equal(NIGHT_DAYS.ashtami.iso, PUJO_DAYS.find((d) => d.en === 'Ashtami').iso)
})

/* --------------------------------------------------- the boundaries -- */

const walk = async (dir) => (await readdir(new URL(dir, root), { recursive: true }))
  .map((f) => f.replaceAll('\\', '/'))

test('every Ashtami date route checks the session itself and leaves the work to the handlers', async () => {
  const routes = (await walk('app/api/ashtami-date/')).filter((f) => f.endsWith('route.ts'))
  assert.ok(routes.length >= 10, `found ${routes.length} routes`)
  for (const file of routes) {
    const source = await read(`app/api/ashtami-date/${file}`)
    const verbs = [...source.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\b/g)]
    assert.ok(verbs.length, `${file} exports a handler`)
    assert.equal((source.match(/await currentUserId\(\)/g) ?? []).length, verbs.length, `${file}: every verb reads the session`)
    assert.match(source, /from '@\/lib\/ashtami-date\/server'/)
    assert.doesNotMatch(source, /prisma|supabase/i, `${file} talks to the database directly`)
  }
})

test('the pages are server components that sign you in, and the clients are real TypeScript', async () => {
  const pages = ['app/(main)/experience/swipe/page.tsx', 'app/(main)/experience/swipe/matches/page.tsx', 'app/(main)/experience/swipe/matches/[id]/page.tsx']
  for (const page of pages) {
    const source = await read(page)
    assert.doesNotMatch(source, /^['"]use client['"]/m, page)
    assert.match(source, /await requireUser\(\)/, page)
  }
  const clients = [
    ...(await walk('app/(main)/experience/swipe/')).filter((f) => f.endsWith('Client.tsx')).map((f) => `app/(main)/experience/swipe/${f}`),
    ...(await walk('components/ashtami-date/')).filter((f) => f.endsWith('.tsx')).map((f) => `components/ashtami-date/${f}`),
  ]
  assert.ok(clients.length >= 3)
  for (const file of clients) assert.doesNotMatch(await read(file), /@ts-nocheck|@ts-ignore/, file)
  /* the old place deck's API is left alone, and the new page no longer calls it */
  assert.doesNotMatch(await read('app/(main)/experience/swipe/AshtamiDateClient.tsx'), /tinder-profiles/)
})

test('private tables are locked down after every push, and chats and profiles are swept daily', async () => {
  const lockdown = await read('prisma/rls-lockdown.sql')
  for (const table of ['date_profiles', 'date_photos', 'date_swipes', 'date_matches', 'date_messages', 'date_blocks', 'date_reports']) {
    assert.match(lockdown, new RegExp(`'${table}'`), `${table} is locked down`)
  }
  assert.match(lockdown, /ENABLE ROW LEVEL SECURITY/)
  assert.match(lockdown, /REVOKE ALL ON TABLE .* FROM anon, authenticated/)
  assert.match(await read('scripts/prisma.mjs'), /rls-lockdown\.sql/)
  const vercel = JSON.parse(await read('vercel.json'))
  assert.ok(vercel.crons.some((c) => c.path === '/api/cron/ashtami-date'))
  assert.match(await read('app/api/cron/ashtami-date/route.ts'), /Bearer \$\{secret\}/)
})

test('the privacy policy says what Ashtami date stores and how to delete it', async () => {
  const privacy = await read('app/(open)/privacy/page.tsx')
  for (const words of [/date of birth/i, /24 hours/, /delete my dating profile/i, /signed/i, /block/i]) {
    assert.match(privacy, words)
  }
})
