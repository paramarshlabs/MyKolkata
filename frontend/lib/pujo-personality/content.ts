import contentDoc from './content.json'
import { CALIBRATION, PAIR_KINDS } from './config'
import type { ArchetypeId, DimensionId } from './types'

/* What the product says about each archetype. The lore, taglines and phrases
   are generated from the character bibles (scripts/pujo/build-content.mjs);
   what lives here is presentation: palettes, splits and short lines. */

export type ArchetypeContent = {
  name: string
  bn: string
  bnGloss: string
  tagline: string
  oneLine: string
  hour: string
  philosophy: string
  belief: string
  difference: string
  lore: string[]
  light: string
  shadow: string
  says: string[]
  proud: string
  playlist: string
  statements: string[]
}

export type PairKind = 'same' | 'kin' | 'complement' | 'spark' | 'crossover'

export type PairCopy = { a: ArchetypeId; b: ArchetypeId; kind: PairKind; headline: string; line: string; plan: string }

export const CONTENT = contentDoc.archetypes as Record<ArchetypeId, ArchetypeContent>
export const PAIRS = contentDoc.pairs as PairCopy[]

export function pairCopy(x: ArchetypeId, y: ArchetypeId): PairCopy {
  const found = PAIRS.find((p) => (p.a === x && p.b === y) || (p.a === y && p.b === x))
  if (!found) throw new Error(`No pair copy for ${x} + ${y}`)
  return found
}

/* Kin, complement and spark, for "your people". */
export function peopleFor(id: ArchetypeId): Record<'kin' | 'complement' | 'spark', ArchetypeId[]> {
  const pick = (kind: 'kin' | 'complement' | 'spark') => PAIR_KINDS[kind]
    .filter(([a, b]) => a === id || b === id)
    .map(([a, b]) => (a === id ? b : a))
  return { kin: pick('kin'), complement: pick('complement'), spark: pick('spark') }
}

/* a fragment from the bibles, as a sentence: "the Night Owl sees..." -> "The Night Owl sees..." */
export const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/* "a Night Owl", "an Addabaaz" */
export function aName(id: ArchetypeId): string {
  const name = CONTENT[id].name
  return `${/^[AEIOU]/.test(name) ? 'an' : 'a'} ${name}`
}

/* "with a Pet Pujari streak", "with an Addabaaz streak" */
export function streakLine(id: ArchetypeId): string {
  return `with ${aName(id)} streak`
}

/* The house caption device takes a tagline in two lines: a quiet first line,
   an indented display second line. DESIGN.md §9.6 */
export const TAGLINE_LINES: Record<ArchetypeId, [string, string]> = {
  night_owl: ['Pujo starts', 'after midnight.'],
  pandal_hunter: ['Every pandal.', 'On purpose.'],
  para_kid: ['Every road leads', 'back to the para.'],
  pujo_romantic: ['Pujo is a love story.', "You're in it."],
  pet_pujari: ['Thakur dekha', 'is the excuse.'],
  art_kid: ['Every pandal is a gallery', 'if you look long enough.'],
  addabaaz: ['The pandal', 'is just the venue.'],
  dhunuchi: ['When the dhaak starts,', 'so do you.'],
  shiuli: ['Pujo is', 'a morning thing.'],
}

/* ------------------------------------------------------------- palettes -- */

export const HEX = {
  obsidian: '#0D1012', ink: '#141819', slate: '#1C2225',
  bordeaux: '#3F0D12', bordeauxDeep: '#260A0E', crimsonDepth: '#710014',
  ruby: '#98111E', crimson: '#D72638', taxi: '#F2B33D', taxiPaper: '#C98A1F',
  ash: '#AFA2A0', pearl: '#F2F1ED', white: '#FCFBF8', blush: '#FBE4E3', monsoon: '#132A2E',
} as const

export type Palette = {
  tone: 'dark' | 'paper'
  ground: string
  text: string          /* display type */
  body: string          /* running text */
  muted: string         /* captions, metadata */
  accent: string        /* one small highlight: the hour, a rule */
  tick: string          /* the caption device's bar */
  second: string        /* the caption device's second line */
  sigil: { body: string; accent: string; yellow: string; ground: string }
}

const dark = (ground: string, accent: string, tick: string = HEX.crimson, sigilAccent: string = HEX.crimson): Palette => ({
  tone: 'dark', ground, text: HEX.white, body: HEX.pearl, muted: HEX.ash, accent, tick, second: HEX.blush,
  sigil: { body: HEX.pearl, accent: sigilAccent, yellow: HEX.taxi, ground },
})

/* On paper the Pearl becomes Obsidian and the Crimson becomes Ruby. DESIGN.md §7A */
const paper = (ground: string): Palette => ({
  tone: 'paper', ground, text: HEX.obsidian, body: HEX.obsidian, muted: 'rgba(13, 16, 18, 0.68)', accent: HEX.ruby,
  tick: HEX.ruby, second: HEX.ruby,
  sigil: { body: HEX.obsidian, accent: HEX.ruby, yellow: HEX.taxiPaper, ground },
})

export const PALETTES: Record<ArchetypeId, Palette> = {
  night_owl: dark(HEX.obsidian, HEX.taxi),
  pandal_hunter: dark(HEX.slate, HEX.taxi),
  para_kid: dark(HEX.bordeaux, HEX.taxi),
  pujo_romantic: dark(HEX.bordeauxDeep, HEX.blush),
  pet_pujari: dark(HEX.ink, HEX.taxi),
  art_kid: paper(HEX.pearl),
  addabaaz: dark(HEX.ink, HEX.taxi),
  /* crimson on Crimson Depth disappears: the labels and tick are Pearl, and the
     embers glow Taxi Yellow, the way the diya's flame does */
  dhunuchi: dark(HEX.crimsonDepth, HEX.pearl, HEX.pearl, HEX.taxi),
  shiuli: paper(HEX.blush),
}

/* ---------------------------------------------------- why you got this -- */

const BECAUSE: Record<DimensionId, [string, string]> = {
  night: ['You treat 1:30 am as early.', 'You would rather be asleep when the Night Owls go out.'],
  dawn: ['You would set an alarm for Mahalaya.', 'Mornings are not your Pujo.'],
  roam: ['You would cross the whole city in one night.', 'You would rather know one para well than every para a little.'],
  plan: ['You plan the route before the route plans you.', 'You go where the night goes.'],
  crowd: ['The crush is half the fun for you.', 'You would rather see it before the crowd does.'],
  squad: ['Your Pujo comes with a group chat.', 'Your Pujo is for one or two people.'],
  roots: ['You belong to a para, not just to a Pujo.', 'Every pandal is new to you, and you like it that way.'],
  heritage: ['The old Pujo pulls at you.', 'You come for what is new this year.'],
  art: ['You read the placard.', 'You would rather feel it than read about it.'],
  feast: ['Your route bends towards food.', 'Food is fuel. Pandals are the point.'],
  shaaj: ['You plan the look.', 'Comfort first, always.'],
  spotlight: ["You don't mind being the one everyone films.", 'You would rather be behind the camera.'],
  romance: ['Pujo is a love story to you.', "Love can wait. The pandals can't."],
  rhythm: ['The dhaak moves you before you decide to move.', 'You listen more than you dance.'],
}

export function becauseLine(dim: DimensionId, value: number): string {
  const mean = CALIBRATION.neutral[dim]?.mean ?? 0.5
  return BECAUSE[dim][value >= mean ? 0 : 1]
}

/* ---------------------------------------------------------- the DNA words -- */

export function dnaWord(petal: number): string {
  if (petal >= 0.8) return 'far more than most'
  if (petal >= 0.62) return 'more than most'
  if (petal > 0.38) return 'about as much as most'
  if (petal > 0.2) return 'less than most'
  return 'far less than most'
}

/* ------------------------------------------------------ badges, status -- */

export const BADGES = [
  'last_metro', 'first_metro', 'team_theme', 'team_sabeki', 'in_the_photo',
  'taking_it', 'the_crush', 'the_quiet', 'my_para', 'whole_city',
] as const

export type Badge = (typeof BADGES)[number]

export const BADGE_LABELS: Record<Badge, string> = {
  last_metro: 'Last Metro', first_metro: 'First Metro',
  team_theme: 'Team Theme', team_sabeki: 'Team Sabeki',
  in_the_photo: 'In the photo', taking_it: 'Behind the camera',
  the_crush: 'Team Crush', the_quiet: 'Team Quiet',
  my_para: 'Para first', whole_city: 'The whole city',
}

/* rapid-fire answers become badges: [question, option] -> badge */
export const RAPID_BADGES: Record<string, Record<string, Badge>> = {
  rf_metro: { a: 'last_metro', b: 'first_metro' },
  rf_theme: { a: 'team_theme', b: 'team_sabeki' },
  rf_photo: { a: 'in_the_photo', b: 'taking_it' },
  rf_crush: { a: 'the_crush', b: 'the_quiet' },
  rf_para: { a: 'my_para', b: 'whole_city' },
}

export const STATUSES = ['local', 'homecomer', 'first_pujo', 'far_away'] as const
export type Status = (typeof STATUSES)[number]

export const STATUS_LABELS: Record<Status, string> = {
  local: 'Here, like every year',
  homecomer: 'Home for Pujo',
  first_pujo: 'First Pujo in Kolkata',
  far_away: 'Watching from far away',
}

export const KIND_LABELS: Record<PairKind, string> = {
  same: 'The same Pujo, twice',
  kin: 'The same Pujo',
  complement: 'A good fit',
  spark: 'Opposites, the fun kind',
  crossover: 'A crossover',
}
