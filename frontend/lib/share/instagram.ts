/* ==========================================================================
   An Instagram post shared into the app: which post it is, and the place
   names its caption might be about. Pure, so the browser can spot a pasted
   link (the Explore search box) and the tests can run it on real captions.

   Instagram gives a link preview nothing but the caption (og:description):
   the location tag isn't in it. So the names come from what people write —
   "📍 Peter Cat, Park Street", a "[ Howrah Bridge , Victoria Memorial ]"
   keyword list, a business's @handle, #HashTags — best first.
   ========================================================================== */

export type InstagramPost = { kind: 'p' | 'reel' | 'tv'; code: string; url: string }

/* instagram.com/p/…, /reel/…, /reels/…, /tv/…, with or without the author's name before it */
const POST = /https?:\/\/(?:www\.|m\.)?instagram\.com\/(?:[A-Za-z0-9._]+\/)?(p|reels?|tv)\/([A-Za-z0-9_-]{5,40})/

export function findInstagramPost(...texts: (string | null | undefined)[]): InstagramPost | null {
  for (const text of texts) {
    const match = typeof text === 'string' ? text.match(POST) : null
    if (!match) continue
    const kind = match[1].startsWith('reel') ? 'reel' : (match[1] as 'p' | 'tv')
    const code = match[2]
    return { kind, code, url: `https://www.instagram.com/${kind}/${code}/` }
  }
  return null
}

/* the share sheet hands over a url, a text, a title; /share takes them as they come */
export const sharePath = (url: string) => `/share?url=${encodeURIComponent(url)}`

const ENTITIES: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' }

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name: string) => {
    if (name[0] === '#') {
      const point = name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10)
      return Number.isFinite(point) && point <= 0x10ffff ? String.fromCodePoint(point) : whole
    }
    return ENTITIES[name.toLowerCase()] ?? whole
  })
}

/* one meta tag's content, decoded */
export function metaContent(html: string, property: string): string | null {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const tag = html.match(new RegExp(`<meta[^>]+(?:property|name)="${escaped}"[^>]*>`))?.[0]
  const content = tag?.match(/content="([^"]*)"/)?.[1]
  return content === undefined ? null : decodeEntities(content)
}

/* og:description is '285K likes, 479 comments - author on July 25, 2026: "the caption".' */
export function captionFrom(description: string | null): { author: string | null; caption: string } {
  if (!description) return { author: null, caption: '' }
  const quoted = description.match(/^[^"]*?-\s*([A-Za-z0-9._]+) on [^:]+:\s*"([\s\S]*)"\.?\s*$/)
  if (quoted) return { author: quoted[1], caption: quoted[2] }
  return { author: null, caption: description }
}

/* tags and words that say "Kolkata" or "Instagram", not where */
const GENERIC = new Set([
  'kolkata', 'calcutta', 'kolkatadiaries', 'kolkatafood', 'kolkatafoodie', 'kolkatafoodies', 'kolkatafoodblogger',
  'kolkatablogger', 'kolkatavibes', 'kolkatanightlife', 'kolkatacafe', 'kolkatacafes', 'kolkatagram', 'cityofjoy',
  'westbengal', 'bengal', 'bengali', 'india', 'incredibleindia', 'northkolkata', 'southkolkata',
  'fyp', 'foryou', 'foryoupage', 'explore', 'explorepage', 'explorer', 'viral', 'viralreels', 'trending', 'reels', 'reel',
  'reelsinstagram', 'instagram', 'instagood', 'instadaily', 'instafood', 'photography', 'photooftheday', 'love',
  'food', 'foodie', 'foodies', 'foodblogger', 'foodporn', 'foodlover', 'streetfood', 'cafe', 'travel', 'aesthetic',
  'nostalgic', 'relatable', 'sunset', 'rain', 'couple', 'vlog', 'blogger', 'follow', 'like', 'share',
  'durgapuja', 'durgapujo', 'pujo', 'puja', 'pujovibes', 'pujo2026', 'durgapuja2026', 'maadurga', 'durga', 'pandal',
  'pandalhopping', 'sharodotsav', 'dhaak', 'dhunuchi', 'kolkatadurgapuja', 'kolkatapujo',
])
/* trailing words on a handle or tag that aren't part of the name; the short
   ones only after a dot or underscore, so Sarbojanin keeps its "in" */
const TRAILING = /(?:[._](?:kol|cal|ccu|in)|[._]?(?:official|kolkata|calcutta|india))+[._]*$/i

/* "PeterCatKolkata" → "Peter Cat", "flurys_official" → "flurys" */
export function splitHandle(raw: string): string {
  const trimmed = raw.replace(/^[@#]/, '')
  const bare = trimmed.length > 6 ? trimmed.replace(TRAILING, '') || trimmed : trimmed
  return bare
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .replace(/[._]+/g, ' ')
    .trim()
}

const compact = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '')

/* a name worth looking up: Latin letters, not too short or long, not a generic word */
function worthTrying(name: string): boolean {
  const key = compact(name)
  if (key.length < 3 || name.length > 60) return false
  if (GENERIC.has(key)) return false
  return /[a-z]/i.test(name)
}

const clean = (name: string) => name.replace(/[^\p{L}\p{N}&'’ ,.-]/gu, ' ').replace(/\s+/g, ' ').replace(/^[\s,.-]+|[\s,.-]+$/g, '')

/*
 * The names a caption might be about, best first, at most `limit`:
 *   1. a pin or a "Location:" line, whole and then its first part
 *   2. a "[ a , b ]" keyword list
 *   3. @handles, not the author's and not "follow @…"
 *   4. #tags, generic ones dropped
 *   5. the shared title, when it's short (a share sheet's own text)
 */
export function placeCandidates({ caption, author = null, title = null, limit = 6 }: {
  caption: string
  author?: string | null
  title?: string | null
  limit?: number
}): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const add = (raw: string) => {
    const name = clean(raw)
    const key = compact(name)
    if (!worthTrying(name) || seen.has(key)) return
    seen.add(key)
    out.push(name)
  }
  /* the share sheet's text often carries the link itself */
  caption = caption.replace(/https?:\/\/\S+/g, ' ')

  for (const line of caption.split(/\n|\s\|\s/)) {
    const pinned = line.match(/(?:📍|📌|🗺️?|(?:^|\s)(?:location|address|venue|place|where)\s*[:\-–]\s*)(.+)$/iu)
    if (!pinned) continue
    const text = pinned[1].replace(/@([A-Za-z0-9._]+)/g, (_, handle: string) => splitHandle(handle))
    add(text)
    add(text.split(/[,•·]/)[0])
  }

  for (const list of caption.matchAll(/\[([^\]]{3,400})\]/g)) {
    for (const item of list[1].split(/[,|]/)) add(item)
  }

  const self = author?.toLowerCase()
  for (const mention of caption.matchAll(/(follow\s+)?@([A-Za-z0-9._]{2,30})/gi)) {
    if (mention[1] || mention[2].toLowerCase() === self) continue
    add(splitHandle(mention[2]))
  }

  for (const tag of caption.matchAll(/#([\p{L}\p{N}_]{3,40})/gu)) {
    if (GENERIC.has(tag[1].toLowerCase())) continue
    add(splitHandle(tag[1]))
  }

  if (title && title.length <= 60 && !findInstagramPost(title)) add(title)

  return out.slice(0, limit)
}

/* a caption about the Pujo: try the pandals before the city's places */
export const aboutPujo = (text: string) => /\b(?:pujo|puja|pandal|durga|sarbojanin|sarbojonin|thakur|dhaak|mandap|durgotsab)\b|#\w*(?:pujo|puja|pandal)/i.test(text)
