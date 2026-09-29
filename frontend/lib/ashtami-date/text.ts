import { sanitizeName } from '@/lib/pujo-personality/names'
import { LIMITS, type SocialKind } from './config'

/*
 * Everything a person types into Find your Ashtami date: a first name, one
 * prompt answer, an optional handle, chat messages and a report note. Plain
 * text, always rendered as text, never as HTML. Chat is text only: no images,
 * and no links, so nobody is walked off to somewhere we can't see.
 * The feature speaks lowercase, and so do its error messages.
 */

export type Checked<T> = { ok: true; value: T } | { ok: false; message: string }

/* invisible and direction-flipping characters: they hide words and spoof names */
const INVISIBLE = /[\u0000-\u0008\u000b-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]/g

/* collapse runs of spaces, keep single line breaks, trim */
export function cleanText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(INVISIBLE, '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/* http(s), www., and anything shaped like a domain on a common TLD (t.me, wa.me, bit.ly included) */
const LINK = /(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|in|net|org|io|co|me|app|ly|gg|xyz|link|site|info|biz|tv|to|us|uk|dev|page|shop|store|live|online|club|fun)\b/i

export const hasLink = (text: string) => LINK.test(text)

export function checkMessage(value: unknown): Checked<string> {
  const body = cleanText(value)
  if (!body) return { ok: false, message: 'say something first.' }
  if ([...body].length > LIMITS.messageMax) return { ok: false, message: `keep it under ${LIMITS.messageMax} characters.` }
  if (hasLink(body)) return { ok: false, message: 'no links in here. swap handles instead.' }
  return { ok: true, value: body }
}

export function checkPromptAnswer(value: unknown): Checked<string> {
  const answer = cleanText(value).replace(/\n+/g, ' ')
  if (answer.length < 2) return { ok: false, message: 'finish the line. a few words is plenty.' }
  if ([...answer].length > LIMITS.promptMax) return { ok: false, message: `keep it under ${LIMITS.promptMax} characters.` }
  if (hasLink(answer)) return { ok: false, message: 'no links on your card.' }
  return { ok: true, value: answer }
}

export function checkFirstName(value: unknown): Checked<string> {
  const name = sanitizeName(value)
  if (!name) return { ok: false, message: 'just your first name. letters, up to 20.' }
  return { ok: true, value: name }
}

export function checkNote(value: unknown): Checked<string | null> {
  const note = cleanText(value)
  if (!note) return { ok: true, value: null }
  if ([...note].length > LIMITS.noteMax) return { ok: false, message: `keep it under ${LIMITS.noteMax} characters.` }
  return { ok: true, value: note }
}

/* Instagram: letters, numbers, full stops and underscores, up to 30, no dot at either end or twice in a row.
   Snapchat: starts with a letter, 3 to 15, with - _ . allowed. */
const HANDLE: Record<SocialKind, RegExp> = {
  instagram: /^(?!.*\.\.)(?!\.)[a-z0-9._]{1,30}(?<!\.)$/i,
  snapchat: /^[a-z][a-z0-9._-]{2,14}$/i,
}

/* "@name", "instagram.com/name/" and "name" all mean the same handle; empty means none */
export function checkHandle(kind: SocialKind, value: unknown): Checked<string | null> {
  if (typeof value !== 'string' || !value.trim()) return { ok: true, value: null }
  const handle = value.trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^(?:www\.)?(?:instagram\.com|snapchat\.com\/add|snapchat\.com)\//i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '')
  if (!HANDLE[kind].test(handle)) return { ok: false, message: `that doesn’t look like a ${kind} username.` }
  return { ok: true, value: handle }
}

export function socialUrl(kind: SocialKind, handle: string): string {
  return kind === 'instagram'
    ? `https://www.instagram.com/${encodeURIComponent(handle)}/`
    : `https://www.snapchat.com/add/${encodeURIComponent(handle)}`
}
