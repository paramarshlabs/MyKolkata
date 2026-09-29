import { isArchetypeId } from '@/lib/pujo-personality/config'
import type { ArchetypeId } from '@/lib/pujo-personality/types'
import { checkBirthDate, formatYmd } from './age'
import {
  LIMITS, isGender, isNight, isPrompt, isShowMe, isSocial, isVibe, isZone, promptText, vibeLabel, zoneLabel,
  type Gender, type Night, type PromptId, type ShowMe, type SocialKind, type VibeId, type ZoneId,
} from './config'
import type { Plan } from './plan'
import { archetypeName, canExtend, canWrite, matchStatus, publicAge, reasonFor, whoMovesFirst, type RuleProfile } from './rules'
import { checkFirstName, checkHandle, checkPromptAnswer, type Checked } from './text'
import { encodeMatchCard } from './token'

/* ==========================================================================
   A dating profile: what is stored, how far through onboarding it is, and
   the only shapes that ever leave the server. A card shows a first name, an
   age, a coarse area, one prompt, vibes and a plan. It never carries a user
   id, a date of birth, a handle or a photo's storage key.
   ========================================================================== */

export type ProfileRecord = {
  id: string
  userId: string
  /* YYYY-MM-DD; an age is worked out from it on the day */
  birthDate: string
  firstName: string | null
  gender: Gender | null
  showMe: ShowMe | null
  night: Night | null
  zone: ZoneId | null
  vibes: VibeId[]
  promptId: PromptId | null
  promptAnswer: string | null
  socialKind: SocialKind | null
  socialHandle: string | null
  archetype: ArchetypeId | null
  consentedAt: Date | null
  active: boolean
  hiddenAt: Date | null
  /* the day's aajker special, once chosen */
  pickDay: string | null
  pickId: string | null
  createdAt: Date
  updatedAt: Date
}

export type PhotoRecord = { id: string; profileId: string; storageKey: string; position: number; width: number; height: number }

export type MatchRecord = {
  id: string
  aId: string
  bId: string
  createdAt: Date
  expiresAt: Date | null
  extensionsUsed: number
  firstMoveAt: Date | null
  plan: Plan
  aReadAt: Date | null
  bReadAt: Date | null
}

export type MessageRecord = { id: string; matchId: string; senderId: string; body: string; createdAt: Date; expiresAt: Date }

/* ---------------------------------------------------------- onboarding -- */

export const STEPS = 5

export function stepDone(p: ProfileRecord, photoCount: number, step: number): boolean {
  switch (step) {
    case 1: return Boolean(p.birthDate)
    case 2: return Boolean(p.firstName && p.gender && p.showMe)
    case 3: return photoCount >= LIMITS.photosMin
    case 4: return Boolean(p.night && p.zone && p.vibes.length >= LIMITS.vibesMin && p.vibes.length <= LIMITS.vibesMax)
    case 5: return Boolean(p.promptId && p.promptAnswer && p.consentedAt)
    default: return false
  }
}

/* the first step still to do, or STEPS + 1 when the card is finished */
export function nextStep(p: ProfileRecord, photoCount: number): number {
  for (let step = 1; step <= STEPS; step++) if (!stepDone(p, photoCount, step)) return step
  return STEPS + 1
}

export const isComplete = (p: ProfileRecord, photoCount: number) => nextStep(p, photoCount) > STEPS

/* the rule-shaped view of a finished profile; null while it isn't one */
export function toRuleProfile(p: ProfileRecord): RuleProfile | null {
  if (!p.gender || !p.showMe || !p.night || !p.zone) return null
  return {
    id: p.id, userId: p.userId, birthDate: p.birthDate, gender: p.gender, showMe: p.showMe, night: p.night,
    zone: p.zone, vibes: p.vibes, archetype: p.archetype, active: p.active, hidden: p.hiddenAt !== null,
  }
}

type Patch = Partial<Pick<ProfileRecord,
  'firstName' | 'gender' | 'showMe' | 'night' | 'zone' | 'vibes' | 'archetype' | 'promptId' | 'promptAnswer' | 'socialKind' | 'socialHandle' | 'consentedAt'>>

const body = (value: unknown) => (value && typeof value === 'object' ? value : {}) as Record<string, unknown>

/* Steps 2, 4 and 5 as a patch to the profile. Step 1 is the age gate (checkBirthDate);
   step 3 is the photos themselves. */
export function checkStep(step: number, raw: unknown, now: Date): Checked<Patch> {
  const input = body(raw)
  if (step === 2) {
    const name = checkFirstName(input.firstName)
    if (!name.ok) return name
    if (!isGender(input.gender)) return { ok: false, message: 'pick the one that fits you.' }
    if (!isShowMe(input.showMe)) return { ok: false, message: 'pick who you want to see.' }
    return { ok: true, value: { firstName: name.value, gender: input.gender, showMe: input.showMe } }
  }
  if (step === 4) {
    if (!isNight(input.night)) return { ok: false, message: 'pick your night.' }
    if (!isZone(input.zone)) return { ok: false, message: 'pick where you’ll be.' }
    const vibes = Array.isArray(input.vibes) ? [...new Set(input.vibes)] : []
    if (!vibes.every(isVibe)) return { ok: false, message: 'one of those vibes isn’t on the list.' }
    if (vibes.length < LIMITS.vibesMin || vibes.length > LIMITS.vibesMax) {
      return { ok: false, message: `pick ${LIMITS.vibesMin} to ${LIMITS.vibesMax} vibes.` }
    }
    const archetype = input.archetype == null || input.archetype === '' ? null : input.archetype
    if (archetype !== null && !isArchetypeId(archetype)) return { ok: false, message: 'that pujo personality isn’t one of the nine.' }
    return { ok: true, value: { night: input.night, zone: input.zone, vibes, archetype } }
  }
  if (step === 5) {
    if (!isPrompt(input.promptId)) return { ok: false, message: 'pick a line to finish.' }
    const answer = checkPromptAnswer(input.promptAnswer)
    if (!answer.ok) return answer
    const kind = input.socialKind == null || input.socialKind === '' ? null : input.socialKind
    if (kind !== null && !isSocial(kind)) return { ok: false, message: 'instagram or snapchat, or leave it empty.' }
    const handle = kind ? checkHandle(kind, input.socialHandle) : { ok: true as const, value: null }
    if (!handle.ok) return handle
    if (input.consent !== true) return { ok: false, message: 'tick the box to say you’re in.' }
    return {
      ok: true,
      value: {
        promptId: input.promptId, promptAnswer: answer.value,
        socialKind: handle.value ? kind : null, socialHandle: handle.value, consentedAt: now,
      },
    }
  }
  return { ok: false, message: 'that step doesn’t exist.' }
}

export { checkBirthDate }

/* -------------------------------------------------------- what leaves -- */

export type OwnPhoto = { id: string; url: string | null; position: number }

/* your own profile, to you: everything you entered, and nothing about anyone else */
export type OwnProfile = {
  step: number
  complete: boolean
  birthDate: string
  age: number | null
  firstName: string | null
  gender: Gender | null
  showMe: ShowMe | null
  night: Night | null
  zone: ZoneId | null
  vibes: VibeId[]
  promptId: PromptId | null
  promptAnswer: string | null
  socialKind: SocialKind | null
  socialHandle: string | null
  archetype: ArchetypeId | null
  photos: OwnPhoto[]
  hidden: boolean
}

export function toOwnProfile(p: ProfileRecord, photos: OwnPhoto[], now: Date): OwnProfile {
  return {
    step: nextStep(p, photos.length),
    complete: isComplete(p, photos.length),
    birthDate: p.birthDate,
    age: publicAge(p.birthDate, now),
    firstName: p.firstName,
    gender: p.gender,
    showMe: p.showMe,
    night: p.night,
    zone: p.zone,
    vibes: p.vibes,
    promptId: p.promptId,
    promptAnswer: p.promptAnswer,
    socialKind: p.socialKind,
    socialHandle: p.socialHandle,
    archetype: p.archetype,
    photos: [...photos].sort((a, b) => a.position - b.position),
    hidden: p.hiddenAt !== null,
  }
}

/* one person on the deck, as someone else sees them */
export type PublicCard = {
  id: string
  firstName: string
  age: number
  area: string
  night: Night
  plan: string
  prompt: { text: string; answer: string }
  vibes: string[]
  reason: string
  archetype: string | null
  photos: string[]
  pick: boolean
  shiuliFromThem: boolean
}

/* the plan chip: their night and the part of it their vibes point to */
export function planChip(night: Night, vibes: readonly VibeId[]): string {
  const when =
    vibes.includes('after_midnight') ? 'after midnight'
      : vibes.includes('bhor') || vibes.includes('anjali') ? 'morning'
        : vibes.includes('bhog_first') ? 'noon'
          : vibes.includes('photo_walk') || vibes.includes('themes') ? 'golden hour'
            : vibes.includes('dhaak') || vibes.includes('dhunuchi') ? 'arati'
              : 'evening'
  return `${night}, ${when}`
}

export function toCard(
  viewer: RuleProfile,
  them: ProfileRecord,
  photoUrls: string[],
  flags: { pick: boolean; shiuliFromThem: boolean },
  now: Date,
): PublicCard | null {
  const rule = toRuleProfile(them)
  const age = publicAge(them.birthDate, now)
  if (!rule || age === null || !them.firstName || !them.promptId || !them.promptAnswer) return null
  return {
    id: them.id,
    firstName: them.firstName,
    age,
    area: zoneLabel(rule.zone),
    night: rule.night,
    plan: planChip(rule.night, rule.vibes),
    prompt: { text: promptText(them.promptId), answer: them.promptAnswer },
    vibes: rule.vibes.map(vibeLabel),
    reason: reasonFor(viewer, rule),
    archetype: them.archetype ? archetypeName(them.archetype) : null,
    photos: photoUrls,
    pick: flags.pick,
    shiuliFromThem: flags.shiuliFromThem,
  }
}

export type Social = { kind: SocialKind; handle: string }

/* a match, as one of the two people in it sees it */
export type MatchView = {
  id: string
  createdAt: string
  /* their profile id (never their auth id), for block and report */
  them: { id: string; firstName: string; age: number | null; area: string; photo: string | null; archetype: string | null }
  plan: Plan & { areaLabel: string }
  status: 'waiting' | 'open'
  expiresAt: string | null
  firstMove: 'you' | 'them' | 'either'
  canWrite: boolean
  writeBlocked: 'their-move' | 'expired' | 'closed' | null
  canExtend: boolean
  handles: { mine: Social | null; theirs: Social | null; locked: boolean }
  lastMessage: { mine: boolean; body: string; sentAt: string } | null
  unread: boolean
  shareToken: string
}

const social = (p: ProfileRecord): Social | null =>
  p.socialKind && p.socialHandle ? { kind: p.socialKind, handle: p.socialHandle } : null

export function toMatchView(
  match: MatchRecord,
  me: ProfileRecord,
  them: ProfileRecord,
  themPhoto: string | null,
  last: MessageRecord | null,
  now: Date,
): MatchView | null {
  const status = matchStatus(match, now)
  if (status === 'expired' || !me.gender || !them.gender || !them.firstName || !them.zone) return null
  const write = canWrite(match, me.gender, them.gender, now)
  const readAt = match.aId === me.id ? match.aReadAt : match.bReadAt
  const open = status === 'open'
  const shared = me.vibes.filter((v) => them.vibes.includes(v))
  return {
    id: match.id,
    createdAt: match.createdAt.toISOString(),
    them: {
      id: them.id,
      firstName: them.firstName,
      age: publicAge(them.birthDate, now),
      area: zoneLabel(them.zone),
      photo: themPhoto,
      archetype: them.archetype ? archetypeName(them.archetype) : null,
    },
    plan: { ...match.plan, areaLabel: zoneLabel(match.plan.zone) },
    status,
    expiresAt: match.expiresAt ? match.expiresAt.toISOString() : null,
    firstMove: whoMovesFirst(me.gender, them.gender),
    canWrite: write.ok,
    writeBlocked: write.ok ? null : write.reason,
    canExtend: canExtend(match, now),
    /* handles are for matches only, and only once somebody has written */
    handles: { mine: social(me), theirs: open ? social(them) : null, locked: !open && Boolean(social(me) || social(them)) },
    lastMessage: last ? { mine: last.senderId === me.id, body: last.body, sentAt: last.createdAt.toISOString() } : null,
    unread: Boolean(last && last.senderId !== me.id && (!readAt || last.createdAt > readAt)),
    shareToken: encodeMatchCard({ night: match.plan.night, zone: match.plan.zone, vibes: shared.slice(0, 2) }),
  }
}

export const formatBirthDate = formatYmd
