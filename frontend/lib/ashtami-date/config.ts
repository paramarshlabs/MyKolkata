import { PUJO_DAYS } from '@/lib/pujo'
import type { ArchetypeId } from '@/lib/pujo-personality/types'

/* ==========================================================================
   Find your Ashtami date (/experience/swipe): the constants.
   18 and over, opt-in, one Pujo season. Everything here is data, so the rules
   in ./rules.ts and the tests read the same numbers the product runs on.
   ========================================================================== */

export const MIN_AGE = 18

/*
 * The first move, borrowed from Bumble. On by default.
 * - womanFirst: in a man–woman match the woman writes first. Any other
 *   pairing (two women, two men, anyone non-binary) is open to either person.
 * - expiresAfterHours: a match with no first message is gone after this.
 * - extensions: how many times a match can be extended, by either person,
 *   each adding extendHours. Once someone writes, the clock stops.
 * Bumble dropped women-first in August 2026; set womanFirst to false to follow.
 */
export const FIRST_MOVE = {
  womanFirst: true,
  expiresAfterHours: 24,
  extensions: 1,
  extendHours: 24,
} as const

export type FirstMoveRule = {
  womanFirst: boolean
  expiresAfterHours: number | null
  extensions: number
  extendHours: number
}

export const LIMITS = {
  /* photos: one to three, JPEG after the phone re-encodes them */
  photosMin: 1,
  photosMax: 3,
  photoMaxBytes: 4 * 1024 * 1024,
  photoMinEdge: 320,
  photoMaxEdge: 4096,
  /* what the phone sends: the long edge, and the JPEG quality */
  photoUploadEdge: 1600,
  photoUploadQuality: 0.86,
  vibesMin: 3,
  vibesMax: 5,
  promptMax: 140,
  messageMax: 500,
  noteMax: 500,
  /* cards per deck request, and how many candidates are ranked to find them */
  deckSize: 12,
  deckPool: 300,
  /* one shiuli (the super-like) a day, counted by the Kolkata calendar */
  shiuliPerDay: 1,
  /* chat messages are deleted 24 hours after they are sent */
  messageTtlHours: 24,
  /* distinct people reporting a profile before it leaves the deck for review */
  reportsToHide: 3,
  /* how long a photo link works */
  signedUrlSeconds: 30 * 60,
} as const

export const GENDERS = [
  { id: 'woman', label: 'woman' },
  { id: 'man', label: 'man' },
  { id: 'nonbinary', label: 'non-binary' },
] as const
export type Gender = (typeof GENDERS)[number]['id']

export const SHOW_ME = [
  { id: 'women', label: 'women', genders: ['woman'] },
  { id: 'men', label: 'men', genders: ['man'] },
  { id: 'everyone', label: 'everyone', genders: ['woman', 'man', 'nonbinary'] },
] as const satisfies readonly { id: string; label: string; genders: readonly Gender[] }[]
export type ShowMe = (typeof SHOW_ME)[number]['id']

/* The four nights, straight from the one constant every Pujo date lives in. */
export const NIGHTS = ['saptami', 'ashtami', 'navami', 'dashami'] as const
export type Night = (typeof NIGHTS)[number]

export const NIGHT_DAYS: Record<Night, (typeof PUJO_DAYS)[number]> = Object.fromEntries(
  NIGHTS.map((night) => [night, PUJO_DAYS.find((day) => day.en.toLowerCase() === night)!]),
) as Record<Night, (typeof PUJO_DAYS)[number]>

export const ASHTAMI_ISO = NIGHT_DAYS.ashtami.iso

/* The deck closes when Dashami ends; a week later the season's data is deleted. */
const DAY_MS = 24 * 60 * 60 * 1000
const dashamiStart = new Date(NIGHT_DAYS.dashami.iso).getTime()
export const SEASON = {
  closesAt: new Date(dashamiStart + DAY_MS),
  purgeAt: new Date(dashamiStart + 8 * DAY_MS),
} as const

/* Coarse areas only. Never an address, never coordinates. */
export const ZONES = [
  { id: 'north', label: 'north kolkata' },
  { id: 'central', label: 'central' },
  { id: 'south', label: 'south kolkata' },
  { id: 'jadavpur', label: 'jadavpur and garia' },
  { id: 'behala', label: 'behala' },
  { id: 'salt_lake', label: 'salt lake' },
  { id: 'new_town', label: 'new town' },
  { id: 'dum_dum', label: 'dum dum and lake town' },
  { id: 'howrah', label: 'howrah' },
] as const
export type ZoneId = (typeof ZONES)[number]['id']

export const VIBES = [
  { id: 'pandal_hopper', label: 'pandal hopper' },
  { id: 'bhog_first', label: 'bhog first' },
  { id: 'adda', label: 'adda' },
  { id: 'photo_walk', label: 'photo walk' },
  { id: 'dhaak', label: 'dhaak' },
  { id: 'dhunuchi', label: 'dhunuchi dance' },
  { id: 'anjali', label: 'anjali' },
  { id: 'after_midnight', label: 'after midnight' },
  { id: 'bhor', label: 'at dawn' },
  { id: 'themes', label: 'theme pandals' },
  { id: 'bonedi', label: 'bonedi bari' },
  { id: 'roll', label: 'roll, then phuchka' },
] as const
export type VibeId = (typeof VIBES)[number]['id']

/* One prompt per profile, written for a plan rather than a biography. */
export const PROMPTS = [
  { id: 'my_ashtami', text: 'my ashtami is…' },
  { id: 'queue_for', text: 'i will 100% queue for…' },
  { id: 'eat_first', text: 'the first thing i’m eating is…' },
  { id: 'pandal_of_the_year', text: 'my pandal of the year is…' },
  { id: 'find_me', text: 'you’ll find me…' },
  { id: 'pujo_rule', text: 'my one pujo rule…' },
] as const
export type PromptId = (typeof PROMPTS)[number]['id']

export const SOCIALS = [
  { id: 'instagram', label: 'instagram' },
  { id: 'snapchat', label: 'snapchat' },
] as const
export type SocialKind = (typeof SOCIALS)[number]['id']

export const REPORT_REASONS = [
  { id: 'fake', label: 'fake profile' },
  { id: 'underage', label: 'looks under 18' },
  { id: 'harassment', label: 'rude or harassing' },
  { id: 'unsafe', label: 'made me feel unsafe' },
  { id: 'photos', label: 'inappropriate photos' },
  { id: 'other', label: 'something else' },
] as const
export type ReportReason = (typeof REPORT_REASONS)[number]['id']

const ids = <T extends { id: string }>(list: readonly T[]) => new Set<string>(list.map((item) => item.id))
const GENDER_IDS = ids(GENDERS)
const SHOW_ME_IDS = ids(SHOW_ME)
const ZONE_IDS = ids(ZONES)
const VIBE_IDS = ids(VIBES)
const PROMPT_IDS = ids(PROMPTS)
const SOCIAL_IDS = ids(SOCIALS)
const REPORT_IDS = ids(REPORT_REASONS)

export const isGender = (v: unknown): v is Gender => typeof v === 'string' && GENDER_IDS.has(v)
export const isShowMe = (v: unknown): v is ShowMe => typeof v === 'string' && SHOW_ME_IDS.has(v)
export const isNight = (v: unknown): v is Night => typeof v === 'string' && (NIGHTS as readonly string[]).includes(v)
export const isZone = (v: unknown): v is ZoneId => typeof v === 'string' && ZONE_IDS.has(v)
export const isVibe = (v: unknown): v is VibeId => typeof v === 'string' && VIBE_IDS.has(v)
export const isPrompt = (v: unknown): v is PromptId => typeof v === 'string' && PROMPT_IDS.has(v)
export const isSocial = (v: unknown): v is SocialKind => typeof v === 'string' && SOCIAL_IDS.has(v)
export const isReportReason = (v: unknown): v is ReportReason => typeof v === 'string' && REPORT_IDS.has(v)

const label = <T extends { id: string; label: string }>(list: readonly T[], id: string) =>
  list.find((item) => item.id === id)?.label ?? id

export const zoneLabel = (id: ZoneId) => label(ZONES, id)
export const vibeLabel = (id: VibeId) => label(VIBES, id)
export const genderLabel = (id: Gender) => label(GENDERS, id)
export const promptText = (id: PromptId) => PROMPTS.find((p) => p.id === id)?.text ?? ''
export const showMeGenders = (id: ShowMe): readonly Gender[] => SHOW_ME.find((s) => s.id === id)?.genders ?? []

/* A Pujo Personality result already on the phone can fill in step 4: the
   night and vibes each archetype would pick. Only ever a starting point. */
export const ARCHETYPE_HINTS: Record<ArchetypeId, { night: Night; vibes: VibeId[] }> = {
  night_owl: { night: 'navami', vibes: ['after_midnight', 'pandal_hopper', 'roll'] },
  pandal_hunter: { night: 'ashtami', vibes: ['pandal_hopper', 'themes', 'photo_walk'] },
  para_kid: { night: 'ashtami', vibes: ['anjali', 'dhaak', 'bhog_first'] },
  pujo_romantic: { night: 'navami', vibes: ['photo_walk', 'bonedi', 'adda'] },
  pet_pujari: { night: 'ashtami', vibes: ['bhog_first', 'roll', 'adda'] },
  art_kid: { night: 'saptami', vibes: ['themes', 'photo_walk', 'bonedi'] },
  addabaaz: { night: 'navami', vibes: ['adda', 'after_midnight', 'roll'] },
  dhunuchi: { night: 'ashtami', vibes: ['dhunuchi', 'dhaak', 'photo_walk'] },
  shiuli: { night: 'ashtami', vibes: ['bhor', 'anjali', 'bonedi'] },
}
