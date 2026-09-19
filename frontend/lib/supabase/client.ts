import { createBrowserClient } from '@supabase/ssr'

/* The browser half of the session. Cookies, not localStorage, so the server sees it too. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
