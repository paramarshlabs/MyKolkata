import { CONTENT, pairCopy } from '@/lib/pujo-personality/content'
import type { ArchetypeId } from '@/lib/pujo-personality/types'
import { ageAt, isAdult, parseYmd } from './age'
import {
  FIRST_MOVE, LIMITS, SEASON, showMeGenders, vibeLabel, zoneLabel,
  type FirstMoveRule, type Gender, type Night, type ShowMe, type VibeId, type ZoneId,
} from './config'
import { hashString } from './plan'

/* ==========================================================================
   The rules of Find your Ashtami date, with no I/O: who can see whom, in what
   order, why two people might get on, and what a match allows. The database
   filters the deck with the same rules for speed (repository.ts); these are
   the source of truth, and the handlers apply them again on the way out.
   ========================================================================== */

/* the parts of a profile the rules need */
export type RuleProfile = {
  id: string
  userId: string
  birthDate: string
  gender: Gender
  showMe: ShowMe
  night: Night
  zone: ZoneId
  vibes: readonly VibeId[]
  archetype: ArchetypeId | null
  active: boolean
  hidden: boolean
}

export type Relations = {
  /* profiles the viewer has already swiped, either way */
  swiped: ReadonlySet<string>
  /* profiles that said "not for me" to the viewer: they never come round again */
  passedOnViewer: ReadonlySet<string>
  /* user ids the viewer blocked, and user ids that blocked the viewer */
  blockedUsers: ReadonlySet<string>
  /* profiles that spent a shiuli on the viewer */
  shiuliFrom: ReadonlySet<string>
}

export const noRelations = (): Relations => ({
  swiped: new Set(), passedOnViewer: new Set(), blockedUsers: new Set(), shiuliFrom: new Set(),
})

/* ------------------------------------------------------------ interest -- */

export const wants = (showMe: ShowMe, gender: Gender) => showMeGenders(showMe).includes(gender)

/* each of them is someone the other asked to see */
export const mutualInterest = (a: Pick<RuleProfile, 'gender' | 'showMe'>, b: Pick<RuleProfile, 'gender' | 'showMe'>) =>
  wants(a.showMe, b.gender) && wants(b.showMe, a.gender)

function adult(profile: Pick<RuleProfile, 'birthDate'>, now: Date) {
  const birth = parseYmd(profile.birthDate)
  return birth !== null && isAdult(birth, now)
}

/* The deck's gate. Never yourself, never anyone swiped, blocked either way or who passed on you,
   only people each of you asked to see, and only live, adult profiles. */
export function canSee(viewer: RuleProfile, candidate: RuleProfile, rel: Relations, now: Date): boolean {
  if (candidate.id === viewer.id || candidate.userId === viewer.userId) return false
  if (!candidate.active || candidate.hidden || !adult(candidate, now)) return false
  if (!viewer.active || viewer.hidden || !adult(viewer, now)) return false
  if (rel.swiped.has(candidate.id) || rel.passedOnViewer.has(candidate.id)) return false
  if (rel.blockedUsers.has(candidate.userId)) return false
  return mutualInterest(viewer, candidate)
}

/* Before swiping, the same gate minus "already swiped", so a repeated swipe is answered, not refused. */
export function canSwipeOn(viewer: RuleProfile, candidate: RuleProfile, rel: Relations, now: Date): boolean {
  return canSee(viewer, candidate, { ...rel, swiped: new Set() }, now)
}

/* ------------------------------------------------------------- ranking -- */

const sharedVibes = (a: readonly VibeId[], b: readonly VibeId[]) => a.filter((v) => b.includes(v))

/* Plans over profiles: the same night counts most, then the same area, then shared vibes.
   A shiuli puts its sender first. Ties break by a hash that changes daily. */
export function relevance(viewer: RuleProfile, candidate: RuleProfile, rel: Relations, day: string): number {
  let score = 0
  if (rel.shiuliFrom.has(candidate.id)) score += 100
  if (candidate.night === viewer.night) score += 8
  if (candidate.zone === viewer.zone) score += 4
  score += sharedVibes(viewer.vibes, candidate.vibes).length * 2
  if (viewer.archetype && candidate.archetype) score += 1
  return score + (hashString(`${viewer.id}:${candidate.id}:${day}`) % 1000) / 1000
}

export type DeckEntry<P extends RuleProfile> = { profile: P; pick: boolean; shiuliFromThem: boolean }

/*
 * The deck: everyone the viewer can see, best first. The aajker special (the
 * day's pick) is chosen once a day from the five most relevant, and leads the
 * deck until it is swiped; `pickId` is the one already chosen today, if any.
 */
export function buildDeck<P extends RuleProfile>(
  viewer: RuleProfile,
  candidates: readonly P[],
  rel: Relations,
  now: Date,
  { day, limit = LIMITS.deckSize, pickId = null }: { day: string; limit?: number; pickId?: string | null },
): { entries: DeckEntry<P>[]; pickId: string | null } {
  const seen = new Set<string>()
  const eligible = candidates.filter((c) => {
    if (seen.has(c.id) || !canSee(viewer, c, rel, now)) return false
    seen.add(c.id)
    return true
  })
  const ranked = eligible
    .map((profile) => ({ profile, score: relevance(viewer, profile, rel, day) }))
    .sort((a, b) => b.score - a.score)
    .map(({ profile }) => profile)

  const pick = pickId === null ? choosePick(viewer.id, day, ranked) : ranked.find((p) => p.id === pickId) ?? null
  const ordered = pick ? [pick, ...ranked.filter((p) => p.id !== pick.id)] : ranked
  return {
    entries: ordered.slice(0, limit).map((profile) => ({
      profile,
      pick: profile.id === pick?.id,
      shiuliFromThem: rel.shiuliFrom.has(profile.id),
    })),
    pickId: pick?.id ?? null,
  }
}

export function choosePick<P extends { id: string }>(viewerId: string, day: string, ranked: readonly P[]): P | null {
  const top = ranked.slice(0, 5)
  return top.length ? top[hashString(`${viewerId}:${day}:pick`) % top.length] : null
}

/* ------------------------------------------------------ the reason line -- */

const VIBE_ORDER: VibeId[] = [
  'bhog_first', 'dhaak', 'after_midnight', 'bhor', 'anjali', 'dhunuchi', 'adda',
  'photo_walk', 'roll', 'bonedi', 'themes', 'pandal_hopper',
]

/* Plain words about what the two of them share, for the card. Never a number. */
export function reasonFor(viewer: Omit<RuleProfile, 'active' | 'hidden'>, other: Omit<RuleProfile, 'active' | 'hidden'>): string {
  const shared = VIBE_ORDER.filter((v) => viewer.vibes.includes(v) && other.vibes.includes(v))
  if (shared.length >= 2) return `you both said ${vibeLabel(shared[0])} and ${vibeLabel(shared[1])}.`
  if (shared.length === 1) return `you both said ${vibeLabel(shared[0])}.`
  if (viewer.night === other.night) return `same night: ${viewer.night}.`
  if (viewer.zone === other.zone) return `both around ${zoneLabel(viewer.zone)}.`
  if (viewer.archetype && other.archetype) return pairCopy(viewer.archetype, other.archetype).headline.toLowerCase()
  return 'different pujos. that’s half the fun.'
}

export const archetypeName = (id: ArchetypeId) => CONTENT[id].name.toLowerCase()

/* --------------------------------------------------------- the match -- */

export const orderedPair = (x: string, y: string): [string, string] => (x < y ? [x, y] : [y, x])

export type MatchClock = {
  createdAt: Date
  expiresAt: Date | null
  firstMoveAt: Date | null
  extensionsUsed: number
}

export type MatchStatus = 'waiting' | 'open' | 'expired'

/* who may write the first message: 'woman' only in a man–woman match with the rule on */
export function firstMoveBy(a: Gender, b: Gender, rule: FirstMoveRule = FIRST_MOVE): 'woman' | 'either' {
  const manWoman = (a === 'man' && b === 'woman') || (a === 'woman' && b === 'man')
  return rule.womanFirst && manWoman ? 'woman' : 'either'
}

/* the same, from one person's side */
export function whoMovesFirst(me: Gender, them: Gender, rule: FirstMoveRule = FIRST_MOVE): 'you' | 'them' | 'either' {
  if (firstMoveBy(me, them, rule) === 'either') return 'either'
  return me === 'woman' ? 'you' : 'them'
}

export function initialExpiry(createdAt: Date, rule: FirstMoveRule = FIRST_MOVE): Date | null {
  return rule.expiresAfterHours === null ? null : new Date(createdAt.getTime() + rule.expiresAfterHours * 3_600_000)
}

export function matchStatus(match: MatchClock, now: Date): MatchStatus {
  if (match.firstMoveAt) return 'open'
  if (match.expiresAt && match.expiresAt.getTime() <= now.getTime()) return 'expired'
  return 'waiting'
}

export type WriteCheck = { ok: true; firstMove: boolean } | { ok: false; reason: 'expired' | 'their-move' | 'closed' }

export function canWrite(match: MatchClock, me: Gender, them: Gender, now: Date, rule: FirstMoveRule = FIRST_MOVE): WriteCheck {
  if (now.getTime() >= SEASON.purgeAt.getTime()) return { ok: false, reason: 'closed' }
  const status = matchStatus(match, now)
  if (status === 'expired') return { ok: false, reason: 'expired' }
  if (status === 'open') return { ok: true, firstMove: false }
  if (whoMovesFirst(me, them, rule) === 'them') return { ok: false, reason: 'their-move' }
  return { ok: true, firstMove: true }
}

/* one extend per match, by either of them, only while it is still waiting for a first message */
export function canExtend(match: MatchClock, now: Date, rule: FirstMoveRule = FIRST_MOVE): boolean {
  return matchStatus(match, now) === 'waiting' && match.expiresAt !== null && match.extensionsUsed < rule.extensions
}

export function extendedExpiry(match: MatchClock, rule: FirstMoveRule = FIRST_MOVE): Date | null {
  return match.expiresAt ? new Date(match.expiresAt.getTime() + rule.extendHours * 3_600_000) : null
}

/* -------------------------------------------------------- what we show -- */

export const publicAge = (birthDate: string, now: Date) => {
  const birth = parseYmd(birthDate)
  return birth ? ageAt(birth, now) : null
}

export const seasonOpen = (now: Date) => now.getTime() < SEASON.closesAt.getTime()
export const seasonOver = (now: Date) => now.getTime() >= SEASON.purgeAt.getTime()
