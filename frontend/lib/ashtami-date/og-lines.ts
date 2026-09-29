import { NIGHTS, NIGHT_DAYS, VIBES, ZONES } from './config'

/*
 * Every line of type the match card's link preview can draw. The preview is
 * built on the server from pre-shaped outlines, for the same two reasons as
 * the Pujo Personality's (see lib/pujo-personality/og-lines.ts): Satori can't
 * shape Bengali, and the house Latin faces stay in public/fonts.
 * scripts/pujo/generate-paths.py shapes these into ./og-paths.ts. Change a
 * line here, run it again; tests/ashtamiDate.test.mjs checks nothing is missing.
 */

export type Face = 'display' | 'text' | 'bengali'
export type OgLine = { face: Face; text: string; tracking: number }

const TRACK = { lockup: 0.18, title: -0.045, headline: -0.025, body: 0.01 } as const

export const OG_TEXT = {
  lockup: 'MY KOLKATA',
  lockupBn: 'আমার কলকাতা',
  title: 'it’s a match.',
  sub: 'now pick a pandal.',
  coming: 'ashtami is coming.',
  queue: 'who are you queueing with?',
  cta: 'find your ashtami date on my kolkata',
} as const

export const nightLine = (night: (typeof NIGHTS)[number]) => `${night} night`

const LINES: OgLine[] = [
  { face: 'display', text: OG_TEXT.lockup, tracking: TRACK.lockup },
  { face: 'bengali', text: OG_TEXT.lockupBn, tracking: 0 },
  { face: 'display', text: OG_TEXT.title, tracking: TRACK.title },
  { face: 'display', text: OG_TEXT.sub, tracking: TRACK.headline },
  { face: 'display', text: OG_TEXT.coming, tracking: TRACK.title },
  { face: 'display', text: OG_TEXT.queue, tracking: TRACK.headline },
  { face: 'text', text: OG_TEXT.cta, tracking: TRACK.body },
  ...NIGHTS.flatMap((night): OgLine[] => [
    { face: 'text', text: nightLine(night), tracking: TRACK.body },
    { face: 'bengali', text: NIGHT_DAYS[night].bn, tracking: 0 },
  ]),
  ...ZONES.map((zone): OgLine => ({ face: 'text', text: zone.label, tracking: TRACK.body })),
  ...VIBES.map((vibe): OgLine => ({ face: 'text', text: vibe.label, tracking: TRACK.body })),
]

export const OG_LINES: OgLine[] = LINES.filter((line, i) =>
  LINES.findIndex((x) => x.face === line.face && x.text === line.text) === i)
