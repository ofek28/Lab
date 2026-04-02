import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client (uses service role key - never expose to browser)
// Use this in API routes and Server Components for full DB access
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
