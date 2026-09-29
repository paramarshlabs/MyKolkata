'use client'

import { LIMITS } from '@/lib/ashtami-date/config'
import type { MatchView, OwnPhoto, OwnProfile, PublicCard } from '@/lib/ashtami-date/profile'

/*
 * The browser's side of /api/ashtami-date. Every call answers with data or a
 * message a person can read, in the feature's voice, never a stack trace. No
 * signal at a pandal is normal, so a failed fetch says so plainly.
 */

export type Failure = { ok: false; status: number; message: string; data: Record<string, unknown> }
export type Result<T> = { ok: true; status: number; data: T } | Failure

const OFFLINE = 'no signal. try again when you have a bar or two.'

async function call<T>(path: string, init?: RequestInit): Promise<Result<T>> {
  let res: Response
  try {
    res = await fetch(`/api/ashtami-date${path}`, { cache: 'no-store', ...init })
  } catch {
    return { ok: false, status: 0, message: OFFLINE, data: {} }
  }
  const body = res.status === 204 ? {} : await res.json().catch(() => ({}))
  if (res.ok) return { ok: true, status: res.status, data: body as T }
  const data = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const message = typeof data.message === 'string' ? data.message
    : res.status === 401 ? 'sign in again to carry on.'
      : 'something went wrong. try again.'
  return { ok: false, status: res.status, message, data }
}

const send = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
  body: body === undefined ? undefined : JSON.stringify(body),
})

export type Deck = { cards: PublicCard[]; closed: boolean; paused?: boolean; shiuliLeft: number }
export type SwipeAnswer = { match: MatchView | null; created: boolean; shiuliLeft: number }
export type ChatMessage = { id: string; mine: boolean; body: string; sentAt: string; expiresAt: string }

export const api = {
  me: () => call<{ profile: OwnProfile | null }>('/me'),
  saveStep: (step: number, fields: Record<string, unknown> = {}) => call<{ profile: OwnProfile }>('/me', send('PUT', { step, ...fields })),
  deleteProfile: () => call<Record<string, never>>('/me', send('DELETE')),
  addPhoto: (photo: Blob) => {
    const form = new FormData()
    form.set('photo', photo, 'photo.jpg')
    return call<{ photo: OwnPhoto }>('/photos', { method: 'POST', body: form })
  },
  removePhoto: (id: string) => call<Record<string, never>>(`/photos/${encodeURIComponent(id)}`, send('DELETE')),
  deck: () => call<Deck>('/deck'),
  swipe: (targetId: string, liked: boolean, shiuli = false) => call<SwipeAnswer>('/swipes', send('POST', { targetId, liked, shiuli })),
  matches: () => call<{ matches: MatchView[] }>('/matches'),
  chat: (matchId: string) => call<{ match: MatchView; messages: ChatMessage[] }>(`/matches/${encodeURIComponent(matchId)}/messages`),
  write: (matchId: string, body: string) =>
    call<{ message: ChatMessage; match: MatchView | null }>(`/matches/${encodeURIComponent(matchId)}/messages`, send('POST', { body })),
  extend: (matchId: string) => call<{ match: MatchView | null }>(`/matches/${encodeURIComponent(matchId)}/extend`, send('POST')),
  unmatch: (matchId: string) => call<Record<string, never>>(`/matches/${encodeURIComponent(matchId)}`, send('DELETE')),
  block: (profileId: string) => call<Record<string, never>>('/blocks', send('POST', { profileId })),
  report: (profileId: string, reason: string, note: string, matchId?: string) =>
    call<{ message: string }>('/reports', send('POST', { profileId, reason, note, matchId })),
}

/*
 * A photo, redrawn on this phone before it goes anywhere: turned the right way
 * up, cut down to 1600px on the long edge, and saved as a fresh JPEG. Redrawing
 * drops EXIF, GPS and everything else the camera wrote into the file; the
 * server strips again anyway.
 */
export async function preparePhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') && file.type !== '') throw new Error('that isn’t a photo.')
  let source: ImageBitmap
  try {
    source = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('that photo didn’t open here. try a jpeg or a screenshot of it.')
  }
  const edge = LIMITS.photoUploadEdge
  const scale = Math.min(1, edge / Math.max(source.width, source.height))
  const width = Math.round(source.width * scale)
  const height = Math.round(source.height * scale)
  if (Math.min(width, height) < LIMITS.photoMinEdge) {
    source.close()
    throw new Error('that photo’s too small. try a bigger one.')
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('your browser wouldn’t draw that photo.')
  ctx.drawImage(source, 0, 0, width, height)
  source.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', LIMITS.photoUploadQuality))
  if (!blob) throw new Error('your browser wouldn’t save that photo.')
  if (blob.size > LIMITS.photoMaxBytes) throw new Error('that photo’s too big. try another.')
  return blob
}
