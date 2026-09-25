/*
 * The only free text a person can put on a card is a first name. It is drawn
 * onto the card image on the phone, under MyKolkata's name, and never goes
 * into a link. Letters (any script), spaces, apostrophes, hyphens and full
 * stops; up to 20 characters; nothing on the list below. The list is a safety
 * net, not a moderation system: it errs towards dropping the name, never the
 * card.
 */

const MAX_LENGTH = 20

/* matched anywhere in the letters-only, lower-cased name */
const STEMS = [
  'fuck', 'shit', 'bitch', 'cunt', 'pussy', 'whore', 'slut', 'bastard', 'asshole', 'nigg', 'faggot',
  'retard', 'rapist', 'porn', 'nazi', 'hitler', 'penis', 'vagina', 'dildo', 'wank', 'twat', 'jerkoff',
  'chod', 'chut', 'bhosd', 'bsdk', 'gandu', 'gaand', 'lauda', 'lawda', 'randi', 'harami', 'haramzada',
  'kamina', 'khanki', 'www', 'http',
  'চোদ', 'খানকি', 'মাগি', 'মাগী', 'হারামি', 'ল্যাওড়া',
  'चोद', 'चूत', 'भोसड', 'रंडी', 'गांडू', 'हरामी', 'लौड़ा',
]

/* matched only as whole words, because they hide inside ordinary names */
const WORDS = ['dick', 'cock', 'arse', 'fag', 'rape', 'tits', 'sex', 'boob', 'boobs', 'nude', 'gand', 'lund', 'loda', 'kutta', 'kutti', 'magi', 'গুদ']

const ALLOWED = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u

export function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const name = raw.normalize('NFC').replace(/\s+/g, ' ').trim()
  if (!name || [...name].length > MAX_LENGTH || !ALLOWED.test(name)) return null

  const lower = name.toLocaleLowerCase('en')
  const letters = lower.replace(/[^\p{L}\p{M}]/gu, '')
  if (STEMS.some((stem) => letters.includes(stem))) return null
  const words = lower.split(/[^\p{L}\p{M}]+/u).filter(Boolean)
  if (words.some((w) => WORDS.includes(w))) return null

  return name
}
