import { ARCHETYPE_IDS, DIMENSION_IDS } from './config'
import { BADGES, STATUSES, type Badge, type Status } from './content'
import type { ArchetypeId, Band, Vector } from './types'

/*
 * A share card, carried entirely in its link.
 *
 * Nothing about a result is stored on a server: the link holds the archetype,
 * the streak, the Pujo DNA (fourteen bytes), the badges and the status. It is
 * what the person chose to share and nothing else. No name, no answers, no
 * personal data: a first name can go on the card image, which is drawn on the
 * phone, but never into a URL (13-product-spec.md §23).
 *
 * Layout (version 1), 21 bytes, base64url (28 characters):
 *   [0] version  [1] primary  [2] secondary (255 = pure)  [3] band
 *   [4] status (0 = none)  [5..6] badges, little-endian bits
 *   [7..20] fourteen dimensions, 0-255
 */

export type ShareCard = {
  primary: ArchetypeId
  secondary: ArchetypeId | null
  band: Band
  vector: Vector
  badges: Badge[]
  status: Status | null
}

const VERSION = 1
const LENGTH = 21
const BANDS: Band[] = ['clear', 'leaning', 'close']

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

function toBase64Url(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0)
    out += ALPHABET[(n >> 18) & 63] + ALPHABET[(n >> 12) & 63]
    if (i + 1 < bytes.length) out += ALPHABET[(n >> 6) & 63]
    if (i + 2 < bytes.length) out += ALPHABET[n & 63]
  }
  return out
}

function fromBase64Url(text: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(text) || text.length % 4 === 1) return null
  const bytes: number[] = []
  for (let i = 0; i < text.length; i += 4) {
    const chunk = text.slice(i, i + 4)
    const n = [...chunk].reduce((acc, ch, j) => acc | (ALPHABET.indexOf(ch) << (18 - 6 * j)), 0)
    bytes.push((n >> 16) & 255)
    if (chunk.length > 2) bytes.push((n >> 8) & 255)
    if (chunk.length > 3) bytes.push(n & 255)
  }
  return Uint8Array.from(bytes)
}

export function encodeCard(card: ShareCard): string {
  const bytes = new Uint8Array(LENGTH)
  bytes[0] = VERSION
  bytes[1] = ARCHETYPE_IDS.indexOf(card.primary)
  bytes[2] = card.secondary ? ARCHETYPE_IDS.indexOf(card.secondary) : 255
  bytes[3] = Math.max(0, BANDS.indexOf(card.band))
  bytes[4] = card.status ? STATUSES.indexOf(card.status) + 1 : 0
  const bits = card.badges.reduce((acc, b) => acc | (1 << BADGES.indexOf(b)), 0)
  bytes[5] = bits & 255
  bytes[6] = (bits >> 8) & 255
  DIMENSION_IDS.forEach((d, i) => { bytes[7 + i] = Math.round(Math.min(1, Math.max(0, card.vector[d])) * 255) })
  return toBase64Url(bytes)
}

export function decodeCard(token: string | null | undefined): ShareCard | null {
  if (!token || token.length > 64) return null
  const bytes = fromBase64Url(token)
  if (!bytes || bytes.length !== LENGTH || bytes[0] !== VERSION) return null

  const primary = ARCHETYPE_IDS[bytes[1]]
  const secondary = bytes[2] === 255 ? null : ARCHETYPE_IDS[bytes[2]]
  const band = BANDS[bytes[3]]
  if (!primary || secondary === undefined || !band || secondary === primary) return null
  const status = bytes[4] === 0 ? null : STATUSES[bytes[4] - 1] ?? null

  const bits = bytes[5] | (bytes[6] << 8)
  const badges = BADGES.filter((_, i) => bits & (1 << i))

  const vector = Object.fromEntries(DIMENSION_IDS.map((d, i) => [d, bytes[7 + i] / 255])) as Vector

  return { primary, secondary, band, vector, badges, status }
}
