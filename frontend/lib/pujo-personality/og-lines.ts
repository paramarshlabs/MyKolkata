import { ARCHETYPE_IDS } from './config'
import { CONTENT, STATUS_LABELS, STATUSES, TAGLINE_LINES, streakLine } from './content'

/*
 * Every line of type the link previews draw. Satori cannot shape Bengali, and
 * the house Latin faces are licensed web fonts that are not copied to the
 * server, so the previews carry their type as outlines instead:
 * scripts/pujo/generate-paths.py shapes each line below once and writes
 * bengali-paths.ts and og-latin-paths.ts. Change a line here, re-run it.
 */

export type Face = 'display' | 'text' | 'bengali'
export type OgLine = { face: Face; text: string; tracking: number }

/* tracking in em, as the pages set it (DESIGN.md §4.4) */
export const TRACK = { lockup: 0.18, name: -0.035, headline: -0.02, second: -0.015, body: 0.01 } as const

export const OG_TEXT = {
  lockup: 'MY KOLKATA',
  lockupBn: 'আমার কলকাতা',
  question: 'Which Pujo are you?',
  questionBn: 'তুমি কোন পুজো?',
  landing: 'What kind of Pujo are you?',
  landingSub: 'Thirteen questions. Nine ways to do Pujo.',
  guess: 'Guess my Pujo.',
  guessSub: 'Nine ways to do Pujo. Which one is mine?',
  hourTail: 'is my hour',
} as const

const LINES: OgLine[] = [
  { face: 'display', text: OG_TEXT.lockup, tracking: TRACK.lockup },
  { face: 'bengali', text: OG_TEXT.lockupBn, tracking: 0 },
  { face: 'bengali', text: OG_TEXT.questionBn, tracking: 0 },
  { face: 'display', text: OG_TEXT.question, tracking: TRACK.headline },
  { face: 'display', text: OG_TEXT.landing, tracking: TRACK.name },
  { face: 'text', text: OG_TEXT.landingSub, tracking: TRACK.body },
  { face: 'display', text: OG_TEXT.guess, tracking: TRACK.name },
  { face: 'text', text: OG_TEXT.guessSub, tracking: TRACK.body },
  { face: 'text', text: OG_TEXT.hourTail, tracking: TRACK.body },
  ...STATUSES.map((s): OgLine => ({ face: 'text', text: STATUS_LABELS[s], tracking: TRACK.body })),
  ...ARCHETYPE_IDS.flatMap((id): OgLine[] => [
    { face: 'bengali', text: CONTENT[id].bn, tracking: 0 },
    { face: 'display', text: CONTENT[id].name, tracking: TRACK.name },
    { face: 'text', text: TAGLINE_LINES[id][0], tracking: TRACK.body },
    { face: 'display', text: TAGLINE_LINES[id][1], tracking: TRACK.second },
    { face: 'text', text: streakLine(id), tracking: TRACK.body },
    { face: 'text', text: CONTENT[id].hour, tracking: TRACK.body },
  ]),
]

export const OG_LINES: OgLine[] = LINES.filter((line, i) =>
  LINES.findIndex((x) => x.face === line.face && x.text === line.text) === i)
