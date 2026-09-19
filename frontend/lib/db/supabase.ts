import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const globalForSupabase = globalThis as typeof globalThis & {
  supabase?: SupabaseClient
}

function requirePublicEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

export const supabase =
  globalForSupabase.supabase ??
  createClient(requirePublicEnv('NEXT_PUBLIC_SUPABASE_URL'), requirePublicEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'))

if (process.env.NODE_ENV !== 'production') globalForSupabase.supabase = supabase
