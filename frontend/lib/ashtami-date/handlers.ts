import { NextResponse } from 'next/server'
import { createRateLimiter } from '@/lib/rateLimit'
import { checkBirthDate, formatYmd, istDayKey } from './age'
import { FIRST_MOVE, LIMITS, isReportReason, type FirstMoveRule } from './config'
import { stripJpegMetadata } from './jpeg'
import { suggestPlan, type Plan } from './plan'
import {
  checkStep, isComplete, toCard, toMatchView, toOwnProfile, toRuleProfile,
  type MatchRecord, type MessageRecord, type OwnProfile, type PhotoRecord, type ProfileRecord,
} from './profile'
import {
  buildDeck, canExtend, canSwipeOn, canWrite, initialExpiry, seasonOpen, type Relations, type RuleProfile,
} from './rules'
import { checkMessage, checkNote } from './text'

/* ==========================================================================
   The HTTP side of Find your Ashtami date. Each handler takes the signed-in
   user's id (null when signed out) and answers 401 itself; the route files in
   app/api/ashtami-date/ only wire the session to these. The database and the
   photo bucket come in as arguments, so tests run all of this in memory.

   Every read is scoped to the caller: your profile, your matches and their
   messages, and only the people the deck's rules let you see. Anything that
   isn't yours looks exactly like something that doesn't exist.
   ========================================================================== */

export type SwipeInput = {
  swiper: ProfileRecord
  target: ProfileRecord
  liked: boolean
  /* the Kolkata day a shiuli is spent on, or null for an ordinary swipe */
  shiuliDay: string | null
  now: Date
  plan: Plan
  expiresAt: Date | null
}
export type SwipeResult = { status: 'ok' | 'duplicate' | 'shiuli-spent'; match: MatchRecord | null; created: boolean }

export type NewMessage = { match: MatchRecord; senderId: string; body: string; now: Date; expiresAt: Date; firstMoveAllowed: boolean }
export type NewReport = {
  reporterUserId: string
  reportedUserId: string
  reason: string
  note: string | null
  evidence: { body: string; sentAt: string }[] | null
  now: Date
}

export interface AshtamiDateRepository {
  profileByUser(userId: string): Promise<ProfileRecord | null>
  profilesById(ids: string[]): Promise<ProfileRecord[]>
  /* the one profile a user has; creating a second returns the first */
  createProfile(userId: string, birthDate: string, now: Date): Promise<ProfileRecord>
  updateProfile(id: string, patch: Partial<ProfileRecord>): Promise<ProfileRecord>
  /* the profile, its photos, swipes (both ways), matches and messages */
  deleteProfile(id: string): Promise<void>
  photosOf(profileIds: string[]): Promise<PhotoRecord[]>
  /* takes the first free position; null when all `max` are taken */
  addPhoto(profileId: string, photo: { storageKey: string; width: number; height: number }, max: number): Promise<PhotoRecord | null>
  removePhoto(profileId: string, photoId: string): Promise<PhotoRecord | null>
  /* candidates for the deck, prefiltered by the same rules as rules.ts, and their relations to the viewer */
  deckPool(viewer: ProfileRecord, now: Date, take: number): Promise<{ candidates: ProfileRecord[]; relations: Relations }>
  relations(viewer: ProfileRecord, others: ProfileRecord[]): Promise<Relations>
  shiuliSpent(profileId: string, day: string): Promise<number>
  /* one swipe, and the match if it completes one: created once, whoever swipes last, however close together */
  swipe(input: SwipeInput): Promise<SwipeResult>
  matchesOf(profileId: string): Promise<MatchRecord[]>
  matchById(id: string): Promise<MatchRecord | null>
  lastMessages(matchIds: string[], now: Date): Promise<Map<string, MessageRecord>>
  messagesOf(matchId: string, now: Date, take: number): Promise<MessageRecord[]>
  addMessage(input: NewMessage): Promise<{ message: MessageRecord; match: MatchRecord } | { error: 'gone' | 'their-move' }>
  /* adds the extension if the match is still waiting and has one left; null otherwise */
  extendMatch(match: MatchRecord, now: Date, rule: FirstMoveRule): Promise<MatchRecord | null>
  markRead(matchId: string, profileId: string, now: Date): Promise<void>
  /* only a match the profile is in */
  deleteMatch(matchId: string, profileId: string): Promise<boolean>
  /* the block, and any match between the two profiles */
  block(input: { blockerUserId: string; blockedUserId: string; blockerProfileId: string; blockedProfileId: string; now: Date }): Promise<void>
  /* stores the report; returns how many different people have open reports on the reported user */
  report(input: NewReport): Promise<{ reporters: number }>
  reportsSince(reporterUserId: string, since: Date): Promise<number>
  hideProfile(profileId: string, now: Date): Promise<void>
  purgeExpired(now: Date): Promise<{ messages: number; matches: number }>
}

export interface PhotoStore {
  /* false when the bucket's key isn't configured on this server */
  readonly ready: boolean
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>
  remove(keys: string[]): Promise<void>
  /* short-lived links, by key; a key that can't be signed is left out */
  sign(keys: string[], seconds: number): Promise<Map<string, string>>
}

type Options = {
  repo: AshtamiDateRepository
  photos: PhotoStore
  clock?: () => Date
  /* work that shouldn't hold up the response (next/server's after() in the routes) */
  defer?: (task: () => Promise<unknown>) => void
  newKey?: () => string
  rule?: FirstMoveRule
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const PURGE_EVERY_MS = 5 * MINUTE
const REPORTS_PER_DAY = 20
const MESSAGES_SHOWN = 200

const NO_STORE = { 'Cache-Control': 'no-store' }
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { ...NO_STORE, ...headers } })
const empty = (status = 204) => new NextResponse(null, { status, headers: NO_STORE })
const say = (message: string, status: number, extra: Record<string, unknown> = {}) => json({ message, ...extra }, status)

const unauthorized = () => say('sign in to find your ashtami date.', 401)
const tooMany = (retryAfterSeconds: number) =>
  json({ message: 'slow down a little. try again in a moment.' }, 429, { 'Retry-After': String(retryAfterSeconds) })
const serverError = (err: unknown) => {
  console.error('[ashtami-date]', err)
  return say('something went wrong on our side. try again.', 500)
}
const gone = () => say('that’s gone, or it isn’t yours.', 404)
const needsProfile = () => say('finish your card first.', 409, { needsProfile: true })

async function readJson(request: Request): Promise<Record<string, unknown>> {
  const body = await request.json().catch(() => null)
  return body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
}

const WRITE_BLOCKED: Record<'their-move' | 'expired' | 'closed', string> = {
  'their-move': 'they make the first move here. you’ll see it when they do.',
  expired: 'this match faded before anyone wrote.',
  closed: 'pujo’s over, and so is the chat.',
}

export function createAshtamiDateHandlers({
  repo,
  photos,
  clock = () => new Date(),
  defer = (task) => { void task().catch((err) => console.error('[ashtami-date] deferred', err)) },
  newKey = () => `${crypto.randomUUID()}.jpg`,
  rule = FIRST_MOVE,
}: Options) {
  const limit = {
    profile: createRateLimiter({ limit: 60, windowMs: HOUR }),
    photo: createRateLimiter({ limit: 20, windowMs: HOUR }),
    read: createRateLimiter({ limit: 240, windowMs: MINUTE }),
    swipe: createRateLimiter({ limit: 90, windowMs: MINUTE }),
    message: createRateLimiter({ limit: 20, windowMs: MINUTE }),
    block: createRateLimiter({ limit: 30, windowMs: HOUR }),
    report: createRateLimiter({ limit: 10, windowMs: HOUR }),
  }
  let lastPurge = 0

  /* chats are deleted 24 hours after they're sent: the cron sweeps daily, and a
     server in use sweeps every few minutes, after it has answered */
  function purgeSoon() {
    const now = clock()
    if (now.getTime() - lastPurge < PURGE_EVERY_MS) return
    lastPurge = now.getTime()
    defer(() => repo.purgeExpired(now))
  }

  async function signed(keys: string[]) {
    if (!keys.length || !photos.ready) return new Map<string, string>()
    try {
      return await photos.sign(keys, LIMITS.signedUrlSeconds)
    } catch (err) {
      console.error('[ashtami-date] signing failed', err)
      return new Map<string, string>()
    }
  }

  async function own(profile: ProfileRecord, now: Date): Promise<OwnProfile> {
    const rows = await repo.photosOf([profile.id])
    const urls = await signed(rows.map((p) => p.storageKey))
    return toOwnProfile(profile, rows.map((p) => ({ id: p.id, url: urls.get(p.storageKey) ?? null, position: p.position })), now)
  }

  /* after any change, the card is live exactly when every step is done */
  async function settle(profile: ProfileRecord): Promise<ProfileRecord> {
    const count = (await repo.photosOf([profile.id])).length
    const complete = isComplete(profile, count)
    return complete === profile.active ? profile : repo.updateProfile(profile.id, { active: complete })
  }

  /* a match, only if the caller is in it */
  async function ownMatch(userId: string, matchId: string) {
    const me = await repo.profileByUser(userId)
    if (!me || typeof matchId !== 'string' || !matchId) return null
    const match = await repo.matchById(matchId)
    if (!match || (match.aId !== me.id && match.bId !== me.id)) return null
    const [them] = await repo.profilesById([match.aId === me.id ? match.bId : match.aId])
    if (!them) return null
    const rel = await repo.relations(me, [them])
    if (rel.blockedUsers.has(them.userId)) return null
    return { me, match, them }
  }

  async function matchViews(me: ProfileRecord, matches: MatchRecord[], now: Date) {
    const otherIds = matches.map((m) => (m.aId === me.id ? m.bId : m.aId))
    const [others, lasts, photoRows] = await Promise.all([
      repo.profilesById(otherIds),
      repo.lastMessages(matches.map((m) => m.id), now),
      repo.photosOf(otherIds),
    ])
    const rel = await repo.relations(me, others)
    const cover = new Map<string, PhotoRecord>()
    for (const p of [...photoRows].sort((a, b) => a.position - b.position)) if (!cover.has(p.profileId)) cover.set(p.profileId, p)
    const urls = await signed([...cover.values()].map((p) => p.storageKey))
    const byId = new Map(others.map((o) => [o.id, o]))
    return matches.flatMap((m) => {
      const them = byId.get(m.aId === me.id ? m.bId : m.aId)
      if (!them || rel.blockedUsers.has(them.userId)) return []
      const photo = cover.get(them.id)
      const view = toMatchView(m, me, them, photo ? urls.get(photo.storageKey) ?? null : null, lasts.get(m.id) ?? null, now)
      return view ? [view] : []
    })
  }

  return {
    /* -------------------------------------------------- your profile -- */

    async loadOwn(userId: string): Promise<OwnProfile | null> {
      const profile = await repo.profileByUser(userId)
      return profile ? own(profile, clock()) : null
    },

    async getMe(userId: string | null) {
      if (!userId) return unauthorized()
      const limited = limit.read(userId, clock().getTime())
      if (!limited.ok) return tooMany(limited.retryAfterSeconds)
      try {
        const profile = await repo.profileByUser(userId)
        return json({ profile: profile ? await own(profile, clock()) : null })
      } catch (err) {
        return serverError(err)
      }
    },

    /* One onboarding step at a time. Step 1 is the age gate: under 18, nothing is stored. */
    async putMe(request: Request, userId: string | null) {
      if (!userId) return unauthorized()
      const now = clock()
      const limited = limit.profile(userId, now.getTime())
      if (!limited.ok) return tooMany(limited.retryAfterSeconds)
      const body = await readJson(request)
      const step = Number(body.step)

      try {
        const existing = await repo.profileByUser(userId)
        if (step === 1) {
          const check = checkBirthDate(body.birthDate, now)
          if (!check.ok) {
            if (check.reason === 'under-age') {
              return say('this one’s for 18 and over. nothing you typed has been saved.', 403, { underAge: true })
            }
            return say('that date doesn’t look right. day, month, year.', 400)
          }
          const birthDate = formatYmd(check.birth)
          if (existing) {
            if (existing.birthDate !== birthDate) {
              return say('your date of birth is set. if it’s wrong, write to us.', 409)
            }
            return json({ profile: await own(existing, now) })
          }
          const created = await repo.createProfile(userId, birthDate, now)
          return json({ profile: await own(created, now) }, 201)
        }

        if (!existing) return say('start with your date of birth.', 409, { needsProfile: true })
        if (step === 3) {
          const count = (await repo.photosOf([existing.id])).length
          if (count < LIMITS.photosMin) return say('add at least one photo.', 400)
          return json({ profile: await own(await settle(existing), now) })
        }
        const checked = checkStep(step, body, now)
        if (!checked.ok) return say(checked.message, 400)
        const updated = await settle(await repo.updateProfile(existing.id, checked.value))
        return json({ profile: await own(updated, now) })
      } catch (err) {
        return serverError(err)
      }
    },

    /* Everything goes: photos from the bucket first, so a failure leaves nothing orphaned,
       then the profile and all that hangs off it. Blocks and reports stay (see /privacy). */
    async deleteMe(userId: string | null) {
      if (!userId) return unauthorized()
      try {
        const profile = await repo.profileByUser(userId)
        if (!profile) return empty()
        const rows = await repo.photosOf([profile.id])
        /* a server without the bucket key can't reach the photos, and must still let people leave */
        if (rows.length && photos.ready) await photos.remove(rows.map((p) => p.storageKey))
        else if (rows.length) console.warn(`[ashtami-date] ${rows.length} photo(s) left in the bucket: no key on this server`)
        await repo.deleteProfile(profile.id)
        return empty()
      } catch (err) {
        return serverError(err)
      }
    },

    /* ------------------------------------------------------- photos -- */

    async addPhoto(request: Request, userId: string | null) {
      if (!userId) return unauthorized()
      const now = clock()
      const limited = limit.photo(userId, now.getTime())
      if (!limited.ok) return tooMany(limited.retryAfterSeconds)
      if (!photos.ready) return say('photos aren’t switched on here yet.', 503)

      const declared = Number(request.headers.get('content-length') ?? 0)
      if (declared > LIMITS.photoMaxBytes + 64 * 1024) return say('that photo’s too big. try another.', 413)

      try {
        const profile = await repo.profileByUser(userId)
        if (!profile) return say('start with your date of birth.', 409, { needsProfile: true })
        const current = await repo.photosOf([profile.id])
        if (current.length >= LIMITS.photosMax) return say('three is the limit. remove one first.', 409)

        const form = await request.formData().catch(() => null)
        const file = form?.get('photo')
        if (!file || typeof file === 'string') return say('pick a photo to add.', 400)
        if (file.size > LIMITS.photoMaxBytes) return say('that photo’s too big. try another.', 413)
        const stripped = stripJpegMetadata(new Uint8Array(await file.arrayBuffer()))
        if (!stripped) return say('that file isn’t a photo we can use. try a jpeg.', 415)
        const shortEdge = Math.min(stripped.width, stripped.height)
        const longEdge = Math.max(stripped.width, stripped.height)
        if (shortEdge < LIMITS.photoMinEdge) return say('that photo’s too small. try a bigger one.', 400)
        if (longEdge > LIMITS.photoMaxEdge) return say('that photo’s too big. try another.', 413)

        /* a random name: nothing about the person is in the path */
        const key = newKey()
        await photos.put(key, stripped.bytes, 'image/jpeg')
        const row = await repo.addPhoto(profile.id, { storageKey: key, width: stripped.width, height: stripped.height }, LIMITS.photosMax)
        if (!row) {
          await photos.remove([key]).catch(() => {})
          return say('three is the limit. remove one first.', 409)
        }
        const urls = await signed([key])
        return json({ photo: { id: row.id, url: urls.get(key) ?? null, position: row.position } }, 201)
      } catch (err) {
        return serverError(err)
      }
    },

    async removePhoto(userId: string | null, photoId: string) {
      if (!userId) return unauthorized()
      try {
        const profile = await repo.profileByUser(userId)
        if (!profile) return gone()
        const rows = await repo.photosOf([profile.id])
        const target = rows.find((p) => p.id === photoId)
        if (!target) return gone()
        if (profile.active && rows.length <= LIMITS.photosMin) return say('add another photo before you remove this one.', 409)
        if (photos.ready) await photos.remove([target.storageKey])
        await repo.removePhoto(profile.id, photoId)
        await settle(profile)
        return empty()
      } catch (err) {
        return serverError(err)
      }
    },

    /* --------------------------------------------------------- deck -- */

    async deck(userId: string | null) {
      if (!userId) return unauthorized()
      const now = clock()
      const limited = limit.read(userId, now.getTime())
      if (!limited.ok) return tooMany(limited.retryAfterSeconds)
      try {
        const me = await repo.profileByUser(userId)
        const viewer = me && me.active ? toRuleProfile(me) : null
        if (!me || !viewer) return needsProfile()
        if (!seasonOpen(now)) return json({ cards: [], closed: true, shiuliLeft: 0 })
        /* reported by several people: off the deck, both ways, until a person has looked */
        if (viewer.hidden) return json({ cards: [], closed: false, paused: true, shiuliLeft: 0 })

        const day = istDayKey(now)
        purgeSoon()
        const [{ candidates, relations }, spent] = await Promise.all([
          repo.deckPool(me, now, LIMITS.deckPool),
          repo.shiuliSpent(me.id, day),
        ])
        const records = new Map(candidates.map((c) => [c.id, c]))
        const rules = candidates.flatMap((c) => {
          const r = toRuleProfile(c)
          return r ? [r] : []
        })
        const chosen = me.pickDay === day ? me.pickId ?? '' : null
        const deck = buildDeck<RuleProfile>(viewer, rules, relations, now, { day, pickId: chosen })
        if (chosen === null && deck.pickId) await repo.updateProfile(me.id, { pickDay: day, pickId: deck.pickId })

        const ids = deck.entries.map((e) => e.profile.id)
        const rows = (await repo.photosOf(ids)).sort((a, b) => a.position - b.position)
        const urls = await signed(rows.map((p) => p.storageKey))
        const cards = deck.entries.flatMap((entry) => {
          const record = records.get(entry.profile.id)
          if (!record) return []
          const pics = rows.filter((p) => p.profileId === record.id).flatMap((p) => urls.get(p.storageKey) ?? [])
          const card = toCard(viewer, record, pics, { pick: entry.pick, shiuliFromThem: entry.shiuliFromThem }, now)
          return card ? [card] : []
        })
        return json({ cards, closed: false, shiuliLeft: Math.max(0, LIMITS.shiuliPerDay - spent) })
      } catch (err) {
        return serverError(err)
      }
    },

    async swipe(request: Request, userId: string | null) {
      if (!userId) return unauthorized()
      const now = clock()
      const limited = limit.swipe(userId, now.getTime())
      if (!limited.ok) return tooMany(limited.retryAfterSeconds)
      const body = await readJson(request)
      const targetId = typeof body.targetId === 'string' ? body.targetId : ''
      if (!targetId || typeof body.liked !== 'boolean') return say('swipe on a card.', 400)
      const liked = body.liked
      const shiuli = liked && body.shiuli === true

      try {
        /* A match is the moment people wait for, so this path counts its round trips: lookups that
           don't depend on each other go together, and a new match is answered from what's already here. */
        const [me, [target]] = await Promise.all([repo.profileByUser(userId), repo.profilesById([targetId])])
        const viewer = me && me.active ? toRuleProfile(me) : null
        if (!me || !viewer) return needsProfile()
        if (!seasonOpen(now)) return say('the deck closed after dashami.', 409, { closed: true })

        const them = target ? toRuleProfile(target) : null
        if (!target || !them) return gone()
        const [rel, theirPhotos] = await Promise.all([
          repo.relations(me, [target]),
          liked ? repo.photosOf([target.id]) : Promise.resolve([]),
        ])
        if (!canSwipeOn(viewer, them, rel, now)) return gone()

        const day = istDayKey(now)
        /* only a shiuli changes how many are spent, so for anything else the count comes alongside the swipe */
        const [result, spentAlready] = await Promise.all([
          repo.swipe({
            swiper: me,
            target,
            liked,
            shiuliDay: shiuli ? day : null,
            now,
            plan: suggestPlan(viewer, them),
            expiresAt: initialExpiry(now, rule),
          }),
          shiuli ? Promise.resolve(null) : repo.shiuliSpent(me.id, day),
        ])
        /* a match made just now has no messages yet, and canSwipeOn has already ruled out a block */
        const cover = [...theirPhotos].sort((a, b) => a.position - b.position)[0]
        const view = async (m: MatchRecord) => {
          if (!result.created) return (await matchViews(me, [m], now))[0] ?? null
          const urls = cover ? await signed([cover.storageKey]) : new Map<string, string>()
          return toMatchView(m, me, target, cover ? urls.get(cover.storageKey) ?? null : null, null, now)
        }
        const [spent, match] = await Promise.all([
          spentAlready ?? repo.shiuliSpent(me.id, day),
          result.match ? view(result.match) : Promise.resolve(null),
        ])
        const shiuliLeft = Math.max(0, LIMITS.shiuliPerDay - spent)
        if (result.status === 'shiuli-spent') {
          return say('your shiuli’s spent for today. a new one blooms at midnight.', 409, { shiuliLeft })
        }
        return json({ match, created: result.created, shiuliLeft })
      } catch (err) {
        return serverError(err)
      }
    },

    /* ------------------------------------------------------ matches -- */

    async matches(userId: string | null) {
      if (!userId) return unauthorized()
      const now = clock()
      const limited = limit.read(userId, now.getTime())
      if (!limited.ok) return tooMany(limited.retryAfterSeconds)
      try {
        const me = await repo.profileByUser(userId)
        if (!me) return json({ matches: [] })
        purgeSoon()
        const views = await matchViews(me, await repo.matchesOf(me.id), now)
        const activity = (v: (typeof views)[number]) => v.lastMessage?.sentAt ?? v.createdAt
        views.sort((a, b) => activity(b).localeCompare(activity(a)))
        return json({ matches: views })
      } catch (err) {
        return serverError(err)
      }
    },

    async unmatch(userId: string | null, matchId: string) {
      if (!userId) return unauthorized()
      try {
        const me = await repo.profileByUser(userId)
        if (!me || !(await repo.deleteMatch(matchId, me.id))) return gone()
        return empty()
      } catch (err) {
        return serverError(err)
      }
    },

    async extend(userId: string | null, matchId: string) {
      if (!userId) return unauthorized()
      const now = clock()
      try {
        const found = await ownMatch(userId, matchId)
        if (!found) return gone()
        if (!canExtend(found.match, now, rule)) return say('this one can’t be extended again.', 409)
        const updated = await repo.extendMatch(found.match, now, rule)
        if (!updated) return say('this one can’t be extended again.', 409)
        const [view] = await matchViews(found.me, [updated], now)
        return json({ match: view ?? null })
      } catch (err) {
        return serverError(err)
      }
    },

    async messages(userId: string | null, matchId: string) {
      if (!userId) return unauthorized()
      const now = clock()
      const limited = limit.read(userId, now.getTime())
      if (!limited.ok) return tooMany(limited.retryAfterSeconds)
      try {
        const found = await ownMatch(userId, matchId)
        if (!found) return gone()
        const [view] = await matchViews(found.me, [found.match], now)
        if (!view) return say('this match faded before anyone wrote.', 410)
        const rows = await repo.messagesOf(found.match.id, now, MESSAGES_SHOWN)
        await repo.markRead(found.match.id, found.me.id, now)
        purgeSoon()
        return json({
          match: { ...view, unread: false },
          messages: rows.map((m) => ({
            id: m.id, mine: m.senderId === found.me.id, body: m.body,
            sentAt: m.createdAt.toISOString(), expiresAt: m.expiresAt.toISOString(),
          })),
        })
      } catch (err) {
        return serverError(err)
      }
    },

    async send(request: Request, userId: string | null, matchId: string) {
      if (!userId) return unauthorized()
      const now = clock()
      const limited = limit.message(userId, now.getTime())
      if (!limited.ok) return tooMany(limited.retryAfterSeconds)
      const checked = checkMessage((await readJson(request)).body)
      if (!checked.ok) return say(checked.message, 400)

      try {
        const found = await ownMatch(userId, matchId)
        if (!found || !found.me.gender || !found.them.gender) return gone()
        const write = canWrite(found.match, found.me.gender, found.them.gender, now, rule)
        if (!write.ok) return say(WRITE_BLOCKED[write.reason], 409, { blocked: write.reason })
        const result = await repo.addMessage({
          match: found.match,
          senderId: found.me.id,
          body: checked.value,
          now,
          expiresAt: new Date(now.getTime() + LIMITS.messageTtlHours * HOUR),
          firstMoveAllowed: write.firstMove,
        })
        if ('error' in result) {
          return result.error === 'their-move' ? say(WRITE_BLOCKED['their-move'], 409, { blocked: 'their-move' }) : gone()
        }
        purgeSoon()
        const [view] = await matchViews(found.me, [result.match], now)
        const m = result.message
        return json({
          message: { id: m.id, mine: true, body: m.body, sentAt: m.createdAt.toISOString(), expiresAt: m.expiresAt.toISOString() },
          match: view ?? null,
        }, 201)
      } catch (err) {
        return serverError(err)
      }
    },

    /* ----------------------------------------------- block and report -- */

    async block(request: Request, userId: string | null) {
      if (!userId) return unauthorized()
      const now = clock()
      const limited = limit.block(userId, now.getTime())
      if (!limited.ok) return tooMany(limited.retryAfterSeconds)
      const body = await readJson(request)
      const profileId = typeof body.profileId === 'string' ? body.profileId : ''
      try {
        const me = await repo.profileByUser(userId)
        if (!me) return needsProfile()
        const [target] = profileId ? await repo.profilesById([profileId]) : []
        /* the same answer whether or not there was anyone to block */
        if (target && target.userId !== me.userId) {
          await repo.block({ blockerUserId: me.userId, blockedUserId: target.userId, blockerProfileId: me.id, blockedProfileId: target.id, now })
        }
        return empty()
      } catch (err) {
        return serverError(err)
      }
    },

    /* A report is kept for a person to review, and blocks them for you straight away. With the
       chat that led to it, the reported person's messages are copied onto the report as evidence,
       since the chat itself is deleted after 24 hours. */
    async report(request: Request, userId: string | null) {
      if (!userId) return unauthorized()
      const now = clock()
      const limited = limit.report(userId, now.getTime())
      if (!limited.ok) return tooMany(limited.retryAfterSeconds)
      const body = await readJson(request)
      const profileId = typeof body.profileId === 'string' ? body.profileId : ''
      if (!profileId || !isReportReason(body.reason)) return say('pick what went wrong.', 400)
      const note = checkNote(body.note)
      if (!note.ok) return say(note.message, 400)

      try {
        if ((await repo.reportsSince(userId, new Date(now.getTime() - 24 * HOUR))) >= REPORTS_PER_DAY) return tooMany(3600)
        const me = await repo.profileByUser(userId)
        if (!me) return needsProfile()
        const [target] = await repo.profilesById([profileId])
        if (!target || target.userId === me.userId) return gone()

        let evidence: NewReport['evidence'] = null
        const matchId = typeof body.matchId === 'string' ? body.matchId : ''
        if (matchId) {
          const found = await ownMatch(userId, matchId)
          if (found && found.them.id === target.id) {
            const rows = await repo.messagesOf(found.match.id, now, MESSAGES_SHOWN)
            evidence = rows.filter((m) => m.senderId === target.id).map((m) => ({ body: m.body, sentAt: m.createdAt.toISOString() }))
          }
        }

        const { reporters } = await repo.report({
          reporterUserId: me.userId, reportedUserId: target.userId, reason: body.reason, note: note.value, evidence, now,
        })
        await repo.block({ blockerUserId: me.userId, blockedUserId: target.userId, blockerProfileId: me.id, blockedProfileId: target.id, now })
        if (reporters >= LIMITS.reportsToHide) await repo.hideProfile(target.id, now)
        return say('thanks for telling us. they’re hidden from you now, and a person will look at this.', 201)
      } catch (err) {
        return serverError(err)
      }
    },

    /* ---------------------------------------------------------- cron -- */

    purgeExpired: () => repo.purgeExpired(clock()),
  }
}

export type AshtamiDateHandlers = ReturnType<typeof createAshtamiDateHandlers>
