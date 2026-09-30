import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { stripJpegMetadata } from '@/lib/ashtami-date/jpeg'
import { createRateLimiter } from '@/lib/rateLimit'
import { admin, adminReady } from '@/lib/supabase/admin'
import { PHOTO_LIMITS, googlePhotoAt, isPhotoKey } from './photo'

/*
 * The profile photo, server side. A person's own photo goes into a private
 * bucket (no policies, so the browser's key can't reach it) and is only ever
 * served back to that same person, through /api/profile/photo. It goes onto a
 * share card on their phone; it is never put in a link or a link preview.
 */

const BUCKET = 'profile-photos'
const HOUR = 60 * 60 * 1000

const limitUploads = createRateLimiter({ limit: 20, windowMs: HOUR })

const say = (message: string, status: number) => Response.json({ error: message }, { status })

/* Made once per server: private and JPEG only. A public bucket of this name is refused. */
let bucket: Promise<void> | null = null
function ensureBucket(storage: SupabaseClient['storage']) {
  bucket ??= (async () => {
    const existing = await storage.getBucket(BUCKET)
    if (existing.data) {
      if (existing.data.public) throw new Error(`The ${BUCKET} bucket is public. Make it private before storing photos in it.`)
      return
    }
    const created = await storage.createBucket(BUCKET, { public: false, fileSizeLimit: PHOTO_LIMITS.maxBytes, allowedMimeTypes: ['image/jpeg'] })
    if (created.error && !/already exists/i.test(created.error.message)) throw created.error
  })().catch((err) => {
    bucket = null
    throw err
  })
  return bucket
}

async function account(userId: string) {
  const { data, error } = await admin().auth.admin.getUserById(userId)
  if (error || !data.user) throw error ?? new Error('No such user')
  const custom = data.user.app_metadata?.photo
  const meta = data.user.user_metadata ?? {}
  return { custom: isPhotoKey(custom) ? custom : null, google: googlePhotoAt(meta.avatar_url || meta.picture) }
}

const image = (body: BodyInit, maxAge: number) => new Response(body, {
  headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': `private, max-age=${maxAge}`, 'X-Content-Type-Options': 'nosniff' },
})

/* Your photo, to you: your own if you put one up, else Google's. */
export async function readPhoto(userId: string | null): Promise<Response> {
  if (!userId) return say('Sign in first.', 401)
  if (!adminReady()) return say('Photos aren’t switched on here yet.', 503)
  try {
    const { custom, google } = await account(userId)
    if (custom) {
      const { data, error } = await admin().storage.from(BUCKET).download(custom)
      if (error || !data) throw error ?? new Error('Photo missing')
      return image(data, 60 * 60 * 24 * 30)
    }
    if (!google) return new Response(null, { status: 404 })
    const res = await fetch(google, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    const type = res.headers.get('content-type') ?? ''
    if (!res.ok || !type.startsWith('image/')) return new Response(null, { status: 404 })
    const bytes = await res.arrayBuffer()
    if (bytes.byteLength > PHOTO_LIMITS.maxBytes) return new Response(null, { status: 404 })
    return new Response(bytes, { headers: { 'Content-Type': type, 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' } })
  } catch (err) {
    console.error('[profile-photo] read failed', err)
    return say('That photo didn’t load.', 500)
  }
}

/* A new photo of your own, as multipart form data (`photo`), replacing any before it. */
export async function writePhoto(request: Request, userId: string | null): Promise<Response> {
  if (!userId) return say('Sign in first.', 401)
  const limited = limitUploads(userId)
  if (!limited.ok) return say('That’s a lot of photos. Try again in a while.', 429)
  if (!adminReady()) return say('Photos aren’t switched on here yet.', 503)

  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > PHOTO_LIMITS.maxBytes + 64 * 1024) return say('That photo’s too big. Try another.', 413)

  try {
    const form = await request.formData().catch(() => null)
    const file = form?.get('photo')
    if (!file || typeof file === 'string') return say('Pick a photo first.', 400)
    if (file.size > PHOTO_LIMITS.maxBytes) return say('That photo’s too big. Try another.', 413)
    /* the file's own bytes decide what it is; every metadata segment goes */
    const stripped = stripJpegMetadata(new Uint8Array(await file.arrayBuffer()))
    if (!stripped) return say('That file isn’t a photo we can use. Try a JPEG.', 415)
    if (Math.min(stripped.width, stripped.height) < PHOTO_LIMITS.minEdge) return say('That photo’s too small. Try a bigger one.', 400)
    if (Math.max(stripped.width, stripped.height) > PHOTO_LIMITS.maxEdge) return say('That photo’s too big. Try another.', 413)

    const { custom: previous } = await account(userId)
    const key = `${crypto.randomUUID()}.jpg`
    const { storage, auth } = admin()
    await ensureBucket(storage)
    const put = await storage.from(BUCKET).upload(key, stripped.bytes, { contentType: 'image/jpeg', upsert: false })
    if (put.error) throw put.error
    const saved = await auth.admin.updateUserById(userId, { app_metadata: { photo: key } })
    if (saved.error) {
      await storage.from(BUCKET).remove([key]).catch(() => {})
      throw saved.error
    }
    if (previous) await storage.from(BUCKET).remove([previous]).catch(() => {})
    return Response.json({ photo: key }, { status: 201 })
  } catch (err) {
    console.error('[profile-photo] write failed', err)
    return say('That photo didn’t save. Try again.', 500)
  }
}

/* Back to the Google photo: your own is deleted, not just hidden. */
export async function removePhoto(userId: string | null): Promise<Response> {
  if (!userId) return say('Sign in first.', 401)
  if (!adminReady()) return say('Photos aren’t switched on here yet.', 503)
  try {
    const { custom } = await account(userId)
    const { storage, auth } = admin()
    const saved = await auth.admin.updateUserById(userId, { app_metadata: { photo: null } })
    if (saved.error) throw saved.error
    if (custom) await storage.from(BUCKET).remove([custom]).catch(() => {})
    return new Response(null, { status: 204 })
  } catch (err) {
    console.error('[profile-photo] remove failed', err)
    return say('That didn’t go through. Try again.', 500)
  }
}
