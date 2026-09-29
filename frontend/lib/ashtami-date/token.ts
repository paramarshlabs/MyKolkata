import { NIGHTS, VIBES, ZONES, type Night, type VibeId, type ZoneId } from './config'

/*
 * The match card's share link carries the moment and nobody in it: the night,
 * the area the plan meets in, and up to two vibes the pair share. No names, no
 * photos, no pandal and no time: the plan itself stays between the two people.
 *
 * Version 1, five bytes, base64url (seven characters):
 *   [0] version  [1] night  [2] zone  [3..4] vibes, little-endian bits
 */

export type MatchCard = { night: Night; zone: ZoneId; vibes: VibeId[] }

const VERSION = 1
const LENGTH = 5
const MAX_VIBES = 2
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const VIBE_IDS = VIBES.map((v) => v.id) as VibeId[]
const ZONE_IDS = ZONES.map((z) => z.id) as ZoneId[]

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

export function encodeMatchCard(card: MatchCard): string {
  const bits = card.vibes.slice(0, MAX_VIBES).reduce((acc, v) => acc | (1 << VIBE_IDS.indexOf(v)), 0)
  return toBase64Url(Uint8Array.of(VERSION, NIGHTS.indexOf(card.night), ZONE_IDS.indexOf(card.zone), bits & 255, (bits >> 8) & 255))
}

export function decodeMatchCard(token: string | null | undefined): MatchCard | null {
  if (!token || token.length > 16) return null
  const bytes = fromBase64Url(token)
  if (!bytes || bytes.length !== LENGTH || bytes[0] !== VERSION) return null
  const night = NIGHTS[bytes[1]]
  const zone = ZONE_IDS[bytes[2]]
  if (!night || !zone) return null
  const bits = bytes[3] | (bytes[4] << 8)
  if (bits >> VIBE_IDS.length) return null
  const vibes = VIBE_IDS.filter((_, i) => bits & (1 << i))
  if (vibes.length > MAX_VIBES) return null
  return { night, zone, vibes }
}
