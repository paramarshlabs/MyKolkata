import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { admin, adminReady } from '@/lib/supabase/admin'
import { LIMITS } from './config'
import type { PhotoStore } from './handlers'

/*
 * Dating photos live in a private Supabase Storage bucket that only this
 * server can reach, with the project's secret key (SUPABASE_SECRET_KEY, or the
 * legacy SUPABASE_SERVICE_ROLE_KEY). The bucket has no policies, so the
 * browser's publishable key can't list, read or write it. A photo leaves only
 * as a signed URL that works for half an hour, made after the handler has
 * decided the viewer may see it. Object names are random: nothing about the
 * person is in the path.
 */

export const BUCKET = 'ashtami-date'

/* Made once per server: private, JPEG only, with the size cap. A public bucket of this name is refused. */
let bucket: Promise<void> | null = null
function ensureBucket(storage: SupabaseClient['storage']) {
  bucket ??= (async () => {
    const existing = await storage.getBucket(BUCKET)
    if (existing.data) {
      if (existing.data.public) throw new Error(`The ${BUCKET} bucket is public. Make it private before storing photos in it.`)
      return
    }
    const created = await storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: LIMITS.photoMaxBytes,
      allowedMimeTypes: ['image/jpeg'],
    })
    if (created.error && !/already exists/i.test(created.error.message)) throw created.error
  })().catch((err) => {
    bucket = null
    throw err
  })
  return bucket
}

export const supabasePhotoStore: PhotoStore = {
  get ready() {
    return adminReady()
  },

  async put(key, bytes, contentType) {
    const { storage } = admin()
    await ensureBucket(storage)
    const { error } = await storage.from(BUCKET).upload(key, bytes, { contentType, upsert: false, cacheControl: '3600' })
    if (error) throw error
  },

  async remove(keys) {
    if (!keys.length) return
    const { error } = await admin().storage.from(BUCKET).remove(keys)
    if (error) throw error
  },

  async sign(keys, seconds) {
    const out = new Map<string, string>()
    if (!keys.length) return out
    const { data, error } = await admin().storage.from(BUCKET).createSignedUrls([...new Set(keys)], seconds)
    if (error) throw error
    for (const item of data ?? []) if (item.path && item.signedUrl && !item.error) out.set(item.path, item.signedUrl)
    return out
  },
}
