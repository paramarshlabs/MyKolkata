/* ==========================================================================
   The scraper stores registered names in capitals: "HATIBAGAN SARBOJONIN
   DURGOTSAB COMMITTEE". People say "Hatibagan Sarbojonin". The short name is
   what the lists, the map and the route show; the full name sits under it on
   the pujo's own page. Spellings stay as the data has them (Sarbojonin is
   not corrected to Sarbojanin): that is the para's own spelling.
   ========================================================================== */

const KEEP_UPPER = new Set(['SB', 'HZ', 'CIT', 'ITI', 'KMC', 'VIP', 'EM', 'II', 'III', 'IV', 'VI', 'VII', 'AA-I', 'AA-II', 'AA-III'])
const KEEP_LOWER = new Map([['O', 'o'], ['ER', 'er'], ['OF', 'of'], ['AND', 'and']])
const ABBREVIATIONS = new Map([['NO', 'No'], ['NO.', 'No.'], ['ST', 'St'], ['ST.', 'St.'], ['RD', 'Rd'], ['LN', 'Ln'], ['THE', 'The']])
/* the words around a Salt Lake or New Town block: "FD BLOCK", "SALT LAKE BJ" */
const BLOCK_CONTEXT = new Set(['BLOCK', 'LAKE', 'SALTLAKE', 'NEWTOWN', 'TOWN', 'SECTOR'])

function titleWord(word: string, index: number, all: string[]): string {
  /* brackets and trailing commas travel with the word: "(NEW ALIPORE)" */
  const [, lead, core, trail] = word.match(/^([("']*)(.*?)([)",]*)$/) as RegExpMatchArray
  if (!core) return word
  return lead + titleCore(core, index, all) + trail
}

function titleCore(core: string, index: number, all: string[]): string {
  const upper = core.toUpperCase()
  if (KEEP_UPPER.has(upper)) return upper
  if (index > 0 && KEEP_LOWER.has(upper)) return KEEP_LOWER.get(upper) as string
  if (ABBREVIATIONS.has(upper)) return ABBREVIATIONS.get(upper) as string
  /* a single letter is a block or an initial: "E Block", "R K Das Road"; so is "R.M.S." */
  if (/^(?:[A-Z]\.?)+$/.test(upper) && (upper.length === 1 || upper.includes('.'))) return upper
  /* two letters from A to L next to BLOCK, SALT LAKE or leading the name are a block: FD, BJ, CK.
     Elsewhere they are a word: "HARI NATH DE ROAD" */
  if (/^[A-L]{2}$/.test(upper)) {
    const neighbours = [all[index - 1], all[index + 1]].map((w) => (w ?? '').toUpperCase())
    if (index === 0 || neighbours.some((w) => BLOCK_CONTEXT.has(w) || /^\d/.test(w))) return upper
  }
  /* "7TH" → "7th", "14ER" → "14er", "NO1" → "No 1"; "1D" and "A-2" stay as written */
  if (/^\d+(ST|ND|RD|TH|ER)$/.test(upper)) return upper.toLowerCase()
  if (/^NO\d+$/.test(upper)) return `No ${upper.slice(2)}`
  if (upper.includes('-')) return upper.split('-').map((part, i) => (part ? titleCore(part, index + i, all) : part)).join('-')
  if (/\d/.test(upper)) return upper
  return upper.charAt(0) + upper.slice(1).toLowerCase()
}

export function titleCase(raw: string): string {
  const all = raw.trim().split(/\s+/)
  return all
    .map((word, i) => titleWord(word, i, all))
    .join(' ')
    /* "DAW'S" → "Daw's", "CLUB'S" → "Club's" */
    .replace(/'S\b/g, "'s")
}

/* notes the scraper left inside names that belong to no name */
const NOTE = /\([^)]*(?:DISTINCT FROM|\bEST\.|\bYRS\b|FFD MEMBER|IDOL-MAKING|BOAT TOUR|PART-\d)[^)]*\)/gi

const DURGOTSAB = String.raw`DURG[AOU]*\s*U?TS?H?[AOU]+[BV]A?|DUROTSAB|SH?AR[AO]D[AO]TS[AO][BV]A?`
const DURGA_PUJA = String.raw`DURGA\s*PU(?:JA|JO)|DURGAPUJA|DURG\s*PUJA|DUEGAPUJA|MAHAPUJA`
const BODY = String.raw`COMMITTEE|COMMITTE|COMMITTTEE|COMM\.?|SAMITY|SAMITI|SOCIETY|GROUND|AREA|ART|MANDAP|MANDOP|MONDOP|CLUB|PANDAL|PANDEL`

/* the words every committee adds and nobody says */
const FILLER_PHRASES = [
  new RegExp(String.raw`(?:^|\s)(?:O|&|AND)\s+(?:PRADARSHANI|PRODORSHONI|PRADARSHONI|PRADORSHANI|EXHIBITION)\b`, 'g'),
  new RegExp(String.raw`\b(?:${DURGA_PUJA})\s+(?:${BODY})\b`, 'g'),
  new RegExp(String.raw`\b(?:${DURGOTSAB}|PUJA|PUJO|UTSAV|UTSAB)\s+(?:${BODY}|SANGHA\s+DURGA\s+MANDIR)(?=\s|$)`, 'g'),
  new RegExp(String.raw`\b(?:${DURGA_PUJA}|${DURGOTSAB})\b`, 'g'),
  new RegExp(String.raw`\b(?:PUJA|PUJO)\s+(?:COMMITTEE|SAMITY|SAMITI|MANDAP|MANDOP|MONDOP)\b`, 'g'),
  /\b(?:PANDAL|PANDEL)\b/g,
]

/* dangling words once the filler has gone: "BAGMARI BAZAR SARBOJONIN DURGA", "… PUJA O" */
const TRAILING = /\s+(?:PUJA|PUJO|DURGA|O|&|AND|COMMITTEE|SARADIYA|SARADIA|SRI\s+SRI|SREE\s+SREE)$/

/* what is left when a name was all filler: not a name on its own */
const GENERIC = /^(?:SARBOJANIN|SARBOJONIN|SARBAJANIN|SARVAJANIN|SARVOJANIN|SADHARAN|SADHARON|PUJA|PUJO|DURGA|MAA|O|&|-|\s)*$/i

function spaced(value: string) {
  return value
    .replace(/\s*\(\s*/g, ' (')
    .replace(/\s*\)/g, ') ')
    /* "ST.PALLY" → "ST. PALLY" */
    .replace(/\.(?=[A-Z]{3,})/g, '. ')
    /* "- O-" and "-O-" are the Bengali "and": "DURGOTSAB - O- PRADORSHANI" */
    .replace(/\s*-\s*O\s*-\s*/g, ' O ')
    /* a dash between words reads " - "; "PHASE -II" is "PHASE II" */
    .replace(/\s+-(II|III|IV|I)\b/g, ' $1')
    .replace(/\s+-\s*|\s*-\s+/g, ' - ')
}

function tidy(value: string) {
  return value
    .replace(/\s+/g, ' ')
    /* "MAHATIRTHAM -KALIKAPUR", once the filler between them has gone */
    .replace(/(?<=\S)\s+-(?=\S)|(?<=\S)-\s+(?=\S)/g, ' - ')
    .replace(/\s+([,.])/g, '$1')
    .replace(/^[\s,&\-–]+|[\s,&\-–(]+$/g, '')
    .trim()
}

/* "HATIBAGAN SARBOJONIN DURGOTSAB COMMITTEE" → "Hatibagan Sarbojonin" */
export function shortName(raw: string): string {
  const upper = spaced(raw.toUpperCase().replace(NOTE, ' '))
  /* a location in brackets is the full name's business, not the short one's */
  let short = upper.replace(/\([^)]*\)/g, ' ').replace(/\s*,\s*/g, ' ')
  for (const phrase of FILLER_PHRASES) short = short.replace(phrase, ' ')
  short = tidy(short)
  for (let before = ''; before !== short;) {
    before = short
    short = tidy(short.replace(TRAILING, ''))
  }
  /* "CHAKRABORTY BARIR" is "of the Chakraborty house": the house is the name */
  short = short.replace(/\bBARIR$/, 'BARI').replace(/'S$/, '')
  if (!short || GENERIC.test(short)) {
    /* "DURGA PUJA PANDAL (TARATALA)" is the Taratala pujo; with no place, keep every word */
    const place = upper.match(/\(([^)]+)\)/)?.[1].split(',')[0]
    short = tidy(place ?? upper.replace(/\([^)]*\)/g, ' '))
  }
  /* a Salt Lake block on its own: "AE" → "AE Block" */
  if (/^[A-L]{2}$/.test(short)) short = `${short} BLOCK`
  return titleCase(short)
}

/* the registered name, legible: "Hatibagan Sarbojonin Durgotsab Committee" */
export function fullName(raw: string): string {
  return titleCase(tidy(spaced(raw.toUpperCase().replace(NOTE, ' ')).replace(/\(\s+/g, '(').replace(/\s+\)/g, ')')))
}
