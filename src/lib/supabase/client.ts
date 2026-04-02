import { createClient } from '@supabase/supabase-js'

// Browser-side Supabase client (uses anon key - safe to expose)
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Singleton for client components
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (!browserClient) {
    browserClient = createBrowserClient()
  }
  return browserClient
}
