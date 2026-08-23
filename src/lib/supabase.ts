// ================================================================
// EduFit Nepal — Supabase Client Initialization
// ================================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/** Browser client — uses anon key, safe to expose. */
export function createBrowserSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

/** Server client — uses service role key for elevated permissions.
 *  Never call from client components. */
export function createServerSupabaseClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error('[supabase.ts] SUPABASE_SERVICE_ROLE_KEY not set — server client unavailable')
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Runtime-appropriate client.
 *  In client components, use createBrowserSupabaseClient() directly. */
export function getSupabaseClient() {
  // Server context check (Node.js env)
  if (typeof window === 'undefined' && supabaseServiceRoleKey) {
    return createServerSupabaseClient()
  }
  return createBrowserSupabaseClient()
}
