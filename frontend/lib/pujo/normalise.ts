/* ==========================================================================
   One spelling for the fifteen ways Bengali names reach the Roman alphabet.
   The data alone spells Sarbojanin three ways and Durgotsab four; people
   searching add their own. Every name and every query goes through fold(),
   so "sarbajonin durgotsav" and "SARBOJANIN DURGOTSAB" meet in the middle.

   The folding is deliberately loose. It runs on both sides of a match, so a
   collision only widens a result list a little, while a miss hides a pujo.
   What folding can't reach (Mohammad and Mohammed), one edit of slack does,
   when nothing matches without it.
   ========================================================================== */

/* whole words that mean the same thing however they are spelled */
const CANONICAL: [RegExp, string][] = [
  [/^s(?:h)?[ao]r[bv][ao]j[ao]n(?:in|een|ik|eek)$/, 'sarbojanin'],
  [/^durg[aou]*u?ts?h?[aou]+[bv]a?$|^durotsab$/, 'durgotsab'],
  [/^s(?:h)?[ao]r[ao]d[ao]ts[ao][bv]a?$/, 'sarodotsab'],
  [/^durga?puj[ao]$|^duegapuja$/, 'durgapuja'],
  [/^puj[ao]$/, 'puja'],
  [/^sadh[ao]r[ao]n$/, 'sadharan'],
  [/^samm?[ei]l[ai]n[ei]$|^sanmilani$/, 'sammilani'],
  [/^(?:metro|station|stn)$/, 'metro'],
]

/* aspirates, doubled letters and a/o come and go between spellings */
function phonetic(word: string): string {
  return word
    .replace(/pore$/, 'pur')
    .replace(/h+/g, 'h')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/(?:ou|au)/g, 'o')
    /* Phoolbagan and Fulbagan, before ph can lose its h below */
    .replace(/ph/g, 'f')
    .replace(/([bcdgjkpt])h/g, '$1')
    .replace(/sh/g, 's')
    .replace(/ck/g, 'k')
    .replace(/v/g, 'b')
    .replace(/w/g, 'b')
    .replace(/z/g, 'j')
    .replace(/(?<=.)y(?=[^aeiou]|$)/g, 'i')
    /* Beleghata and Beliaghata */
    .replace(/ia/g, 'i')
    .replace(/e/g, 'i')
    .replace(/(.)\1+/g, '$1')
    /* Sarbojonin, Durgatsab, Kumortuli, Agroni */
    .replace(/o/g, 'a')
}

export function foldWord(word: string): string {
  /* numbers stay as typed: "700006", "25 Pally" */
  if (/^\d+$/.test(word)) return word
  for (const [pattern, canonical] of CANONICAL) if (pattern.test(word)) return canonical
  return phonetic(word)
}

/* lowercase, no accents, no punctuation, one word each */
export function words(text: string): string[] {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

export const fold = (text: string): string[] => words(text).map(foldWord)

/* words every committee has, ignored unless they're all that was typed */
export const FILLER = new Set(
  ['durga', 'puja', 'pujo', 'durgapuja', 'committee', 'sarbojanin', 'durgotsab', 'sarodotsab', 'pandal', 'kolkata', 'the']
    .map(foldWord),
)

/* Damerau–Levenshtein, stopping early once it's past `max` */
export function withinEdits(a: string, b: string, max = 1): boolean {
  if (Math.abs(a.length - b.length) > max) return false
  if (a === b) return true
  const rows = a.length + 1
  const cols = b.length + 1
  const d: number[][] = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)))
  for (let i = 1; i < rows; i++) {
    let best = Infinity
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      best = Math.min(best, d[i][j])
    }
    if (best > max) return false
  }
  return d[rows - 1][cols - 1] <= max
}

/*
 * How well one typed word matches one word of a name: 3 for the whole word,
 * 2 for its start ("bag" → Bagbazar), 1 within one edit for words of five
 * letters or more, 0 for no match. Places turn fuzzy matching off: Bagbazar
 * and Bowbazar are one edit apart once folded, and both are real.
 */
export function wordMatch(typed: string, word: string, fuzzy = true): number {
  if (typed === word) return 3
  if (word.startsWith(typed)) return 2
  if (fuzzy && typed.length >= 5 && !/\d/.test(typed) && (withinEdits(typed, word) || withinEdits(typed, word.slice(0, typed.length)))) return 1
  return 0
}
