import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/*
 * The project's secret key (SUPABASE_SECRET_KEY, or the legacy
 * SUPABASE_SERVICE_ROLE_KEY), for the few things the browser's publishable key
 * must never do: private Storage buckets and app_metadata. Server only.
 */

export const secretKey = () => process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const adminReady = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && secretKey())

let client: SupabaseClient | null = null
export function admin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = secretKey()
  if (!url || !key) throw new Error('Supabase admin is not configured (SUPABASE_SECRET_KEY)')
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
  return client
}
