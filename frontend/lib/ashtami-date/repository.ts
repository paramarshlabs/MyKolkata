import 'server-only'
import type { DateMatch, DateMessage, DatePhoto, DateProfile, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import { isArchetypeId } from '@/lib/pujo-personality/config'
import { adultCutoff, dateToYmd, formatYmd, ymdToDate } from './age'
import {
  LIMITS, SHOW_ME, isGender, isNight, isPrompt, isShowMe, isSocial, isVibe, isZone, showMeGenders,
} from './config'
import type { AshtamiDateRepository } from './handlers'
import type { MatchRecord, MessageRecord, PhotoRecord, ProfileRecord } from './profile'
import { extendedExpiry, orderedPair } from './rules'

/* The Prisma side of Find your Ashtami date. Every query that returns people is
   scoped by the caller in the handlers; this file only knows how to store. */

function toProfile(row: DateProfile): ProfileRecord {
  return {
    id: row.id,
    userId: row.userId,
    birthDate: formatYmd(dateToYmd(row.birthDate)),
    firstName: row.firstName,
    gender: isGender(row.gender) ? row.gender : null,
    showMe: isShowMe(row.showMe) ? row.showMe : null,
    night: isNight(row.night) ? row.night : null,
    zone: isZone(row.zone) ? row.zone : null,
    vibes: (row.vibes ?? []).filter(isVibe),
    promptId: isPrompt(row.promptId) ? row.promptId : null,
    promptAnswer: row.promptAnswer,
    socialKind: isSocial(row.socialKind) ? row.socialKind : null,
    socialHandle: row.socialHandle,
    archetype: isArchetypeId(row.archetype) ? row.archetype : null,
    consentedAt: row.consentedAt,
    active: row.active,
    hiddenAt: row.hiddenAt,
    pickDay: row.pickDay,
    pickId: row.pickId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

const toPhoto = (row: DatePhoto): PhotoRecord => ({
  id: row.id, profileId: row.profileId, storageKey: row.storageKey, position: row.position, width: row.width, height: row.height,
})

function toMatch(row: DateMatch): MatchRecord {
  return {
    id: row.id,
    aId: row.aId,
    bId: row.bId,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    extensionsUsed: row.extensionsUsed,
    firstMoveAt: row.firstMoveAt,
    plan: {
      night: isNight(row.planNight) ? row.planNight : 'ashtami',
      pandal: row.planPandal,
      area: row.planArea,
      note: row.planNote,
      time: row.planTime,
      zone: isZone(row.planZone) ? row.planZone : 'central',
    },
    aReadAt: row.aReadAt,
    bReadAt: row.bReadAt,
  }
}

const toMessage = (row: DateMessage): MessageRecord => ({
  id: row.id, matchId: row.matchId, senderId: row.senderId, body: row.body, createdAt: row.createdAt, expiresAt: row.expiresAt,
})

/* the columns a patch may touch; never the owner or the date of birth */
const PATCHABLE = [
  'firstName', 'gender', 'showMe', 'night', 'zone', 'vibes', 'archetype', 'promptId', 'promptAnswer',
  'socialKind', 'socialHandle', 'consentedAt', 'active', 'hiddenAt', 'pickDay', 'pickId',
] as const

function patchData(patch: Partial<ProfileRecord>): Prisma.DateProfileUpdateInput {
  const data: Record<string, unknown> = {}
  for (const key of PATCHABLE) if (key in patch) data[key] = patch[key]
  return data as Prisma.DateProfileUpdateInput
}

/* Transaction-scoped advisory locks: held until commit, and fine through a transaction pooler. */
const lock = (tx: Prisma.TransactionClient, key: string) =>
  tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`

export const prismaRepository: AshtamiDateRepository = {
  async profileByUser(userId) {
    const row = await prisma.dateProfile.findUnique({ where: { userId } })
    return row ? toProfile(row) : null
  },

  async profilesById(ids) {
    if (!ids.length) return []
    return (await prisma.dateProfile.findMany({ where: { id: { in: ids } } })).map(toProfile)
  },

  async createProfile(userId, birthDate, now) {
    const [y, m, d] = birthDate.split('-').map(Number)
    const row = await prisma.dateProfile.upsert({
      where: { userId },
      create: { userId, birthDate: ymdToDate({ y, m, d }), createdAt: now },
      update: {},
    })
    return toProfile(row)
  },

  async updateProfile(id, patch) {
    return toProfile(await prisma.dateProfile.update({ where: { id }, data: patchData(patch) }))
  },

  async deleteProfile(id) {
    /* photos, swipes both ways, matches and their messages cascade */
    await prisma.dateProfile.deleteMany({ where: { id } })
  },

  async photosOf(profileIds) {
    if (!profileIds.length) return []
    const rows = await prisma.datePhoto.findMany({ where: { profileId: { in: profileIds } }, orderBy: { position: 'asc' } })
    return rows.map(toPhoto)
  },

  async addPhoto(profileId, photo, max) {
    return prisma.$transaction(async (tx) => {
      await lock(tx, `ashtami-date:photos:${profileId}`)
      const taken = new Set((await tx.datePhoto.findMany({ where: { profileId }, select: { position: true } })).map((p) => p.position))
      const position = Array.from({ length: max }, (_, i) => i).find((i) => !taken.has(i))
      if (position === undefined) return null
      return toPhoto(await tx.datePhoto.create({ data: { profileId, position, ...photo } }))
    })
  },

  async removePhoto(profileId, photoId) {
    const row = await prisma.datePhoto.findFirst({ where: { id: photoId, profileId } })
    if (!row) return null
    await prisma.datePhoto.deleteMany({ where: { id: photoId, profileId } })
    return toPhoto(row)
  },

  /* The deck's filters, mirrored from rules.ts so the database does the heavy part:
     live, adult, the genders each asked for, never swiped, never passed on the
     viewer, never blocked either way. rules.ts checks all of it again. */
  async deckPool(viewer, now, take) {
    const empty = { candidates: [], relations: { swiped: new Set<string>(), passedOnViewer: new Set<string>(), blockedUsers: new Set<string>(), shiuliFrom: new Set<string>() } }
    if (!viewer.gender || !viewer.showMe) return empty
    const blocks = await prisma.dateBlock.findMany({
      where: { OR: [{ blockerUserId: viewer.userId }, { blockedUserId: viewer.userId }] },
      select: { blockerUserId: true, blockedUserId: true },
    })
    const blockedUsers = new Set(blocks.map((b) => (b.blockerUserId === viewer.userId ? b.blockedUserId : b.blockerUserId)))
    const viewerGender = viewer.gender
    const where: Prisma.DateProfileWhereInput = {
      active: true,
      hiddenAt: null,
      id: { not: viewer.id },
      userId: { notIn: [viewer.userId, ...blockedUsers] },
      gender: { in: [...showMeGenders(viewer.showMe)] },
      showMe: { in: SHOW_ME.filter((s) => (s.genders as readonly string[]).includes(viewerGender)).map((s) => s.id) },
      birthDate: { lte: ymdToDate(adultCutoff(now)) },
      swipesGot: { none: { swiperId: viewer.id } },
      swipesMade: { none: { targetId: viewer.id, liked: false } },
    }
    const shiuli = await prisma.dateSwipe.findMany({
      where: { targetId: viewer.id, liked: true, shiuliDay: { not: null } },
      select: { swiperId: true },
    })
    const senders = shiuli.map((s) => s.swiperId)
    const [first, pool] = await Promise.all([
      senders.length ? prisma.dateProfile.findMany({ where: { AND: [where, { id: { in: senders } }] } }) : Promise.resolve([]),
      prisma.dateProfile.findMany({ where, orderBy: { updatedAt: 'desc' }, take }),
    ])
    const byId = new Map([...first, ...pool].map((row) => [row.id, row]))
    const candidates = [...byId.values()].map(toProfile)
    return {
      candidates,
      relations: { swiped: new Set(), passedOnViewer: new Set(), blockedUsers, shiuliFrom: new Set(senders) },
    }
  },

  async relations(viewer, others) {
    const ids = others.map((o) => o.id)
    const users = others.map((o) => o.userId)
    if (!ids.length) return { swiped: new Set(), passedOnViewer: new Set(), blockedUsers: new Set(), shiuliFrom: new Set() }
    const [mine, theirs, blocks] = await Promise.all([
      prisma.dateSwipe.findMany({ where: { swiperId: viewer.id, targetId: { in: ids } }, select: { targetId: true } }),
      prisma.dateSwipe.findMany({ where: { targetId: viewer.id, swiperId: { in: ids } }, select: { swiperId: true, liked: true, shiuliDay: true } }),
      prisma.dateBlock.findMany({
        where: {
          OR: [
            { blockerUserId: viewer.userId, blockedUserId: { in: users } },
            { blockedUserId: viewer.userId, blockerUserId: { in: users } },
          ],
        },
        select: { blockerUserId: true, blockedUserId: true },
      }),
    ])
    return {
      swiped: new Set(mine.map((s) => s.targetId)),
      passedOnViewer: new Set(theirs.filter((s) => !s.liked).map((s) => s.swiperId)),
      blockedUsers: new Set(blocks.map((b) => (b.blockerUserId === viewer.userId ? b.blockedUserId : b.blockerUserId))),
      shiuliFrom: new Set(theirs.filter((s) => s.liked && s.shiuliDay).map((s) => s.swiperId)),
    }
  },

  shiuliSpent: (profileId, day) => prisma.dateSwipe.count({ where: { swiperId: profileId, shiuliDay: day } }),

  /* One transaction under a lock on the pair: two people liking each other at the same
     moment are serialised, so whichever lands second sees the first like and makes the
     match, once. The unique pair on date_matches is the backstop. A shiuli also takes a
     lock on its sender, so two in the same second can't both be spent. */
  async swipe({ swiper, target, liked, shiuliDay, now, plan, expiresAt }) {
    const [aId, bId] = orderedPair(swiper.id, target.id)
    const pair = { aId_bId: { aId, bId } }
    const matchOf = async (db: Prisma.TransactionClient) => {
      const row = await db.dateMatch.findUnique({ where: pair })
      return row ? toMatch(row) : null
    }

    /* A pass can't make a match, so it takes no lock: one insert, and the unique pair makes a repeat a no-op. */
    if (!liked) {
      const { count } = await prisma.dateSwipe.createMany({
        data: [{ swiperId: swiper.id, targetId: target.id, liked, shiuliDay: null, createdAt: now }],
        skipDuplicates: true,
      })
      return count ? { status: 'ok' as const, match: null, created: false } : { status: 'duplicate' as const, match: await matchOf(prisma), created: false }
    }

    /* Every query here is a round trip made while holding the lock, so there are as few as the rules allow. */
    return prisma.$transaction(async (tx) => {
      await lock(tx, `ashtami-date:pair:${aId}:${bId}`)
      /* both directions in one read: mine means a repeat, theirs decides the match */
      const both = await tx.dateSwipe.findMany({
        where: { OR: [{ swiperId: swiper.id, targetId: target.id }, { swiperId: target.id, targetId: swiper.id }] },
        select: { swiperId: true, liked: true },
      })
      if (both.some((s) => s.swiperId === swiper.id)) return { status: 'duplicate' as const, match: await matchOf(tx), created: false }
      if (shiuliDay) {
        await lock(tx, `ashtami-date:shiuli:${swiper.id}`)
        const spent = await tx.dateSwipe.count({ where: { swiperId: swiper.id, shiuliDay } })
        if (spent >= LIMITS.shiuliPerDay) return { status: 'shiuli-spent' as const, match: null, created: false }
      }
      await tx.dateSwipe.create({ data: { swiperId: swiper.id, targetId: target.id, liked, shiuliDay, createdAt: now } })
      if (!both.some((s) => s.swiperId === target.id && s.liked)) return { status: 'ok' as const, match: null, created: false }

      /* the unique pair is the backstop: a match that somehow exists already is found, never made twice */
      const [made] = await tx.dateMatch.createManyAndReturn({
        data: [{
          aId, bId, createdAt: now, expiresAt,
          planNight: plan.night, planPandal: plan.pandal, planArea: plan.area, planNote: plan.note, planTime: plan.time, planZone: plan.zone,
        }],
        skipDuplicates: true,
      })
      return made
        ? { status: 'ok' as const, match: toMatch(made), created: true }
        : { status: 'ok' as const, match: await matchOf(tx), created: false }
    })
  },

  async matchesOf(profileId) {
    const rows = await prisma.dateMatch.findMany({ where: { OR: [{ aId: profileId }, { bId: profileId }] }, orderBy: { createdAt: 'desc' } })
    return rows.map(toMatch)
  },

  async matchById(id) {
    const row = await prisma.dateMatch.findUnique({ where: { id } })
    return row ? toMatch(row) : null
  },

  async lastMessages(matchIds, now) {
    if (!matchIds.length) return new Map()
    const rows = await prisma.dateMessage.findMany({
      where: { matchId: { in: matchIds }, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      distinct: ['matchId'],
    })
    return new Map(rows.map((row) => [row.matchId, toMessage(row)]))
  },

  async messagesOf(matchId, now, take) {
    const rows = await prisma.dateMessage.findMany({
      where: { matchId, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      take,
    })
    return rows.reverse().map(toMessage)
  },

  /* The first message opens the match for good; the check and the write share a transaction. */
  async addMessage({ match, senderId, body, now, expiresAt, firstMoveAllowed }) {
    return prisma.$transaction(async (tx) => {
      const row = await tx.dateMatch.findFirst({ where: { id: match.id, OR: [{ aId: senderId }, { bId: senderId }] } })
      if (!row) return { error: 'gone' as const }
      if (!row.firstMoveAt) {
        if (row.expiresAt && row.expiresAt.getTime() <= now.getTime()) return { error: 'gone' as const }
        if (!firstMoveAllowed) return { error: 'their-move' as const }
        await tx.dateMatch.updateMany({ where: { id: row.id, firstMoveAt: null }, data: { firstMoveAt: now, expiresAt: null } })
      }
      const message = await tx.dateMessage.create({ data: { matchId: row.id, senderId, body, createdAt: now, expiresAt } })
      const fresh = await tx.dateMatch.findUniqueOrThrow({ where: { id: row.id } })
      return { message: toMessage(message), match: toMatch(fresh) }
    })
  },

  /* only if nothing moved since it was read: still waiting, same deadline, an extension left */
  async extendMatch(match, now, rule) {
    const next = extendedExpiry(match, rule)
    if (!next || !match.expiresAt) return null
    const { count } = await prisma.dateMatch.updateMany({
      where: {
        id: match.id,
        firstMoveAt: null,
        expiresAt: { equals: match.expiresAt, gt: now },
        extensionsUsed: { lt: rule.extensions },
      },
      data: { expiresAt: next, extensionsUsed: { increment: 1 } },
    })
    if (!count) return null
    const row = await prisma.dateMatch.findUnique({ where: { id: match.id } })
    return row ? toMatch(row) : null
  },

  async markRead(matchId, profileId, now) {
    await prisma.$transaction([
      prisma.dateMatch.updateMany({ where: { id: matchId, aId: profileId }, data: { aReadAt: now } }),
      prisma.dateMatch.updateMany({ where: { id: matchId, bId: profileId }, data: { bReadAt: now } }),
    ])
  },

  async deleteMatch(matchId, profileId) {
    const { count } = await prisma.dateMatch.deleteMany({ where: { id: matchId, OR: [{ aId: profileId }, { bId: profileId }] } })
    return count > 0
  },

  async block({ blockerUserId, blockedUserId, blockerProfileId, blockedProfileId, now }) {
    const [aId, bId] = orderedPair(blockerProfileId, blockedProfileId)
    await prisma.$transaction([
      prisma.dateBlock.createMany({ data: [{ blockerUserId, blockedUserId, createdAt: now }], skipDuplicates: true }),
      prisma.dateMatch.deleteMany({ where: { aId, bId } }),
    ])
  },

  async report({ reporterUserId, reportedUserId, reason, note, evidence, now }) {
    await prisma.dateReport.create({
      data: { reporterUserId, reportedUserId, reason, note, evidence: evidence ?? undefined, createdAt: now },
    })
    const reporters = await prisma.dateReport.findMany({
      where: { reportedUserId, status: 'OPEN' },
      distinct: ['reporterUserId'],
      select: { reporterUserId: true },
    })
    return { reporters: reporters.length }
  },

  reportsSince: (reporterUserId, since) => prisma.dateReport.count({ where: { reporterUserId, createdAt: { gte: since } } }),

  async hideProfile(profileId, now) {
    await prisma.dateProfile.updateMany({ where: { id: profileId, hiddenAt: null }, data: { hiddenAt: now } })
  },

  async purgeExpired(now) {
    const messages = await prisma.dateMessage.deleteMany({ where: { expiresAt: { lte: now } } })
    const matches = await prisma.dateMatch.deleteMany({ where: { firstMoveAt: null, expiresAt: { lte: now } } })
    return { messages: messages.count, matches: matches.count }
  },
}
