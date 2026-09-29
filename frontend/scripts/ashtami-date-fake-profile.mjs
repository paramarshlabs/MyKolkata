/*
 * Fake Ashtami date profiles for testing /experience/swipe. Temporary: delete this file with them.
 *
 *   node scripts/ashtami-date-fake-profile.mjs add [name]         make the fakes that don't exist yet (riya, oishani);
 *                                                                 each has already said "for me" to every real man
 *   node scripts/ashtami-date-fake-profile.mjs say <name> <text>  a message from her to each real person she's matched with
 *   node scripts/ashtami-date-fake-profile.mjs chat <name>        an opening burst of messages, long and short, to stress the chat
 *   node scripts/ashtami-date-fake-profile.mjs replies <name>     keep answering whatever you write to her (Ctrl-C to stop)
 *   node scripts/ashtami-date-fake-profile.mjs reset [name]       undo your swipes on her, and any match or chat, to test again
 *   node scripts/ashtami-date-fake-profile.mjs remove             delete every fake, her photos, swipes, matches and messages
 *
 * say and chat need a match. If you've both said "for me" but the match is gone (it faded, or you
 * ended it), they make it again, with the plan below. Every fake's userId starts with FAKE, so
 * nothing real is ever touched. Messages follow the app's rules: the woman writes first, 500
 * characters at most, no links, and gone 24 hours after they're sent.
 */
import { randomUUID } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { loadEnvFile } from './lib/load-env.mjs'

loadEnvFile()

const FAKE = 'fake-test-'
const BUCKET = 'ashtami-date'
const HOUR = 3_600_000
const MESSAGE_MAX = 500
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/* photos are portrait crops of Kolkata scenes from public/, as the phone would send them */
const FAKES = {
  riya: {
    profile: {
      birthDate: new Date('2004-03-14T00:00:00Z'),
      firstName: 'Riya',
      gender: 'woman',
      showMe: 'men',
      night: 'ashtami',
      zone: 'north',
      vibes: ['pandal_hopper', 'adda', 'roll', 'photo_walk'],
      archetype: 'pandal_hunter',
      promptId: 'eat_first',
      promptAnswer: 'a mutton roll from the stall outside college square, then phuchka till my fingers smell of tetul.',
      socialKind: 'instagram',
      socialHandle: 'fake.test.riya',
    },
    photos: [{ file: 'maidan.jpg', left: 0.18 }, { file: 'sare.jpg', left: 0.5 }, { file: 'dkt.jpg', left: 0.5 }],
    /* her "for me" comes with her shiuli */
    shiuli: true,
    /* the plan the app gave her match with Kaushik, for when say or chat has to make it again */
    plan: { night: 'ashtami', pandal: 'Bagbazar Sarbojanin', area: 'Bagbazar', note: 'The old protima, with nobody in front of it.', time: '7:30 pm, adda after', zone: 'north' },
    burst: [
      'okay so the app says bagbazar at 7:30 and honestly? correct choice',
      'i will be the one holding two rolls. one is not for you. unless you earn it',
      'serious question though. are you a "see every pandal in north kolkata in one night" person or a "find one good spot and do adda for three hours" person. because i have strong opinions and i need to know what i\'m walking into. last year my cousins dragged me from shyambazar to ahiritola to kumartuli and back and my feet have still not forgiven any of them.',
      'also',
      'also also',
      'বাগবাজারে দেখা হচ্ছে তাহলে 🙂',
      'ps: supercalifragilisticexpialidociouslylongwordthatshouldwrapinsteadofbreakingthelayoutofyourlovelychatbubble',
    ],
  },
  oishani: {
    profile: {
      birthDate: new Date('2002-07-21T00:00:00Z'),
      firstName: 'Oishani',
      gender: 'woman',
      showMe: 'men',
      night: 'navami',
      zone: 'salt_lake',
      vibes: ['after_midnight', 'adda', 'dhaak', 'themes'],
      archetype: 'night_owl',
      promptId: 'pujo_rule',
      promptAnswer: 'no queue longer than the walk to the next pandal. and nobody says "last one" before 2 am.',
      socialKind: 'snapchat',
      socialHandle: 'fake.test.oishani',
    },
    photos: [{ file: 'hero-bg.jpg', left: 0.5 }, { file: 'login-bg.jpg', left: 0.62 }, { file: 'indmus.jpg', left: 0.5 }],
    shiuli: false,
    plan: { night: 'ashtami', pandal: 'Salt Lake FD Block', area: 'Salt Lake', note: 'A Salt Lake fixture on the shortlists.', time: '8:30 pm, and see how late it goes', zone: 'salt_lake' },
    burst: [
      'navami was my pick but i\'ll allow ashtami. once.',
      'fd block, 8:30. i\'ll be by the dhaakis, they\'re loud enough to find',
      'fair warning: i don\'t go home before 2',
    ],
  },
}

/* canned answers for `replies`, in turn */
const REPLIES = [
  'haha okay fair',
  'wait say that again',
  'that is the most north kolkata thing anyone has ever said to me',
  'hmm. i\'ll think about it over a roll',
  'ok but what are you wearing on ashtami. asking for the photos',
  'deal 🤝',
  'no because same',
  'you\'re going to be late aren\'t you',
]

/* the app's rule: nothing shaped like a link in a message (lib/ashtami-date/text.ts) */
const LINK = /(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|in|net|org|io|co|me|app|ly|gg|xyz|link|site|info|biz|tv|to|us|uk|dev|page|shop|store|live|online|club|fun)\b/i

const prisma = new PrismaClient()
const storage = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
).storage.from(BUCKET)

const userIdOf = (name) => `${FAKE}${name}`
const orderedPair = (x, y) => (x < y ? [x, y] : [y, x])
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* the Kolkata calendar day, as the app keys a shiuli */
const istDay = (d = new Date()) => new Date(d.getTime() + 5.5 * HOUR).toISOString().slice(0, 10)

function namesFrom(arg) {
  if (!arg) return Object.keys(FAKES)
  if (!FAKES[arg]) throw new Error(`no fake called ${arg}; there's ${Object.keys(FAKES).join(', ')}`)
  return [arg]
}

async function fakeProfile(name) {
  const row = await prisma.dateProfile.findUnique({ where: { userId: userIdOf(name) } })
  if (!row) throw new Error(`${name} doesn't exist yet: run add first`)
  return row
}

async function portrait({ file, left }) {
  const image = sharp(join(root, 'public', file))
  const { width, height } = await image.metadata()
  const w = Math.min(width, Math.round(height * 0.8))
  const x = Math.round(Math.max(0, Math.min(width - w, width * left - w / 2)))
  const bytes = await image.extract({ left: x, top: 0, width: w, height }).resize({ height: 1250, withoutEnlargement: true }).jpeg({ quality: 86 }).toBuffer()
  const meta = await sharp(bytes).metadata()
  return { bytes, width: meta.width, height: meta.height }
}

/* ------------------------------------------------------------------- add -- */

async function add(names) {
  const now = new Date()
  const men = await prisma.dateProfile.findMany({
    where: { active: true, gender: 'man', showMe: { in: ['women', 'everyone'] }, NOT: { userId: { startsWith: FAKE } } },
    select: { id: true, firstName: true },
  })
  for (const name of names) {
    const fake = FAKES[name]
    if (await prisma.dateProfile.findUnique({ where: { userId: userIdOf(name) } })) {
      console.log(`${fake.profile.firstName} is already here; left as she is`)
      continue
    }
    const profile = await prisma.dateProfile.create({
      data: { ...fake.profile, userId: userIdOf(name), consentedAt: now, active: true },
    })
    for (const [position, photo] of fake.photos.entries()) {
      const { bytes, width, height } = await portrait(photo)
      const storageKey = `${randomUUID()}.jpg`
      const { error } = await storage.upload(storageKey, bytes, { contentType: 'image/jpeg', upsert: false })
      if (error) throw error
      await prisma.datePhoto.create({ data: { profileId: profile.id, storageKey, position, width, height } })
    }
    /* she's already said "for me" to every real man who shows women, so his right swipe matches */
    for (const [i, man] of men.entries()) {
      await prisma.dateSwipe.create({
        data: { swiperId: profile.id, targetId: man.id, liked: true, shiuliDay: fake.shiuli && i === 0 ? istDay(now) : null },
      })
    }
    console.log(`added ${fake.profile.firstName} (${profile.id}) with ${fake.photos.length} photos; she likes ${men.map((m) => m.firstName).join(', ') || 'nobody yet'}`)
  }
}

/* -------------------------------------------------------------- messages -- */

/* Her matches with real people. A pair who both said "for me" but lost the match gets it back,
   with a fresh 24 hours: the match moment has been seen already, this is for testing the chat. */
async function matchesOf(name) {
  const her = await fakeProfile(name)
  const mutual = await prisma.dateSwipe.findMany({
    where: { targetId: her.id, liked: true, swiper: { NOT: { userId: { startsWith: FAKE } } } },
    select: { swiperId: true, swiper: { select: { firstName: true } } },
  })
  const theirs = []
  for (const { swiperId, swiper } of mutual) {
    const back = await prisma.dateSwipe.findUnique({ where: { swiperId_targetId: { swiperId: her.id, targetId: swiperId } } })
    if (!back?.liked) continue
    const [aId, bId] = orderedPair(her.id, swiperId)
    let match = await prisma.dateMatch.findUnique({ where: { aId_bId: { aId, bId } } })
    if (match && !match.firstMoveAt && match.expiresAt && match.expiresAt <= new Date()) {
      await prisma.dateMatch.delete({ where: { id: match.id } })
      match = null
    }
    if (!match) {
      const plan = FAKES[name].plan
      match = await prisma.dateMatch.create({
        data: {
          aId, bId, expiresAt: new Date(Date.now() + 24 * HOUR),
          planNight: plan.night, planPandal: plan.pandal, planArea: plan.area, planNote: plan.note, planTime: plan.time, planZone: plan.zone,
        },
      })
      console.log(`made the match between ${FAKES[name].profile.firstName} and ${swiper.firstName} again`)
    }
    theirs.push({ match, with: swiper.firstName })
  }
  if (!theirs.length) {
    console.log(`${FAKES[name].profile.firstName} has no match yet: swipe right on her in the app first`)
  }
  return { her, matches: theirs }
}

function checkBody(body) {
  const text = String(body ?? '').trim()
  if (!text) throw new Error('say something')
  if (text.length > MESSAGE_MAX) throw new Error(`${text.length} characters; the app allows ${MESSAGE_MAX}`)
  if (LINK.test(text)) throw new Error('the app turns away anything shaped like a link')
  return text
}

/* as the app writes one (repository.addMessage): the first message opens the match and stops its clock */
async function write(her, match, body, at = new Date()) {
  await prisma.$transaction(async (tx) => {
    if (!match.firstMoveAt) {
      await tx.dateMatch.updateMany({ where: { id: match.id, firstMoveAt: null }, data: { firstMoveAt: at, expiresAt: null } })
      match.firstMoveAt = at
    }
    await tx.dateMessage.create({
      data: { matchId: match.id, senderId: her.id, body, createdAt: at, expiresAt: new Date(at.getTime() + 24 * HOUR) },
    })
  })
}

async function say(name, text) {
  const body = checkBody(text)
  const { her, matches } = await matchesOf(name)
  for (const m of matches) {
    await write(her, m.match, body)
    console.log(`${her.firstName} → ${m.with}: ${body}`)
  }
}

/* a burst, a few seconds apart, ending now: short lines, one long one, bengali, and a word too long to wrap */
async function chat(name) {
  const lines = FAKES[name].burst.map(checkBody)
  const { her, matches } = await matchesOf(name)
  for (const m of matches) {
    const start = Date.now() - lines.length * 20_000
    for (const [i, line] of lines.entries()) await write(her, m.match, line, new Date(start + i * 20_000))
    console.log(`${her.firstName} sent ${m.with} ${lines.length} messages`)
  }
}

/* answers whatever the real person writes, a moment later, until Ctrl-C */
async function replies(name) {
  const her = await fakeProfile(name)
  const answered = new Set()
  let turn = 0
  let first = true
  console.log(`${her.firstName} is listening. write to her in the app; Ctrl-C to stop.`)
  for (;;) {
    const matches = await prisma.dateMatch.findMany({ where: { OR: [{ aId: her.id }, { bId: her.id }] } })
    for (const match of matches) {
      const last = await prisma.dateMessage.findFirst({ where: { matchId: match.id, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } })
      if (!last || last.senderId === her.id || answered.has(last.id)) continue
      answered.add(last.id)
      /* whatever was already waiting when she started listening gets an answer too */
      await sleep(first ? 0 : 1200)
      const body = REPLIES[turn++ % REPLIES.length]
      await write(her, match, body)
      console.log(`  they said: ${last.body.slice(0, 60)}\n  ${her.firstName}: ${body}`)
    }
    first = false
    await sleep(2500)
  }
}

/* ----------------------------------------------------------- reset, remove -- */

async function reset(names) {
  for (const name of names) {
    const fake = await prisma.dateProfile.findUnique({ where: { userId: userIdOf(name) } })
    if (!fake) continue
    const userId = userIdOf(name)
    const swipes = await prisma.dateSwipe.deleteMany({ where: { targetId: fake.id } })
    /* messages go with their matches */
    const matches = await prisma.dateMatch.deleteMany({ where: { OR: [{ aId: fake.id }, { bId: fake.id }] } })
    const blocks = await prisma.dateBlock.deleteMany({ where: { OR: [{ blockerUserId: userId }, { blockedUserId: userId }] } })
    const reports = await prisma.dateReport.deleteMany({ where: { reportedUserId: userId } })
    await prisma.dateProfile.update({ where: { id: fake.id }, data: { hiddenAt: null } })
    console.log(`reset ${fake.firstName}: ${swipes.count} swipe(s) on her, ${matches.count} match(es), ${blocks.count} block(s), ${reports.count} report(s) cleared`)
  }
}

async function remove() {
  const rows = await prisma.dateProfile.findMany({ where: { userId: { startsWith: FAKE } }, include: { photos: true } })
  const keys = rows.flatMap((r) => r.photos.map((p) => p.storageKey))
  if (keys.length) {
    const { error } = await storage.remove(keys)
    if (error) throw error
  }
  /* photos, swipes both ways, matches and their messages cascade */
  const { count } = await prisma.dateProfile.deleteMany({ where: { userId: { startsWith: FAKE } } })
  await prisma.dateBlock.deleteMany({ where: { OR: [{ blockerUserId: { startsWith: FAKE } }, { blockedUserId: { startsWith: FAKE } }] } })
  await prisma.dateReport.deleteMany({ where: { OR: [{ reporterUserId: { startsWith: FAKE } }, { reportedUserId: { startsWith: FAKE } }] } })
  console.log(`removed ${count} fake profile(s) and ${keys.length} photo(s)`)
}

const [command, name, ...rest] = process.argv.slice(2)
try {
  if (command === 'add') await add(namesFrom(name))
  else if (command === 'say') await say(namesFrom(name)[0], rest.join(' '))
  else if (command === 'chat') await chat(namesFrom(name)[0])
  else if (command === 'replies') await replies(namesFrom(name)[0])
  else if (command === 'reset') await reset(namesFrom(name))
  else if (command === 'remove') await remove()
  else console.log('usage: node scripts/ashtami-date-fake-profile.mjs add [name] | say <name> <text> | chat <name> | replies <name> | reset [name] | remove')
} catch (err) {
  console.error(err.message ?? err)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
