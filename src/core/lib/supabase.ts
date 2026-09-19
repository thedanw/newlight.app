import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { getRuntimeConfig } from './runtime-config'

const { supabaseUrl, supabaseAnonKey } = getRuntimeConfig()

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `[supabase] Missing environment variables.\n` +
      `The Cloudflare Pages _middleware.ts reads these at runtime from the ` +
      `project's "Variables and secrets" settings.\n` +
      `Verify that VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY ` +
      `(or VITE_SUPABASE_ANON_KEY) are set on the Pages project — ` +
      `not at the account level — and that a fresh deployment was triggered.\n` +
      `Current: URL=${supabaseUrl ? 'set' : 'MISSING'}, ` +
      `key=${supabaseAnonKey ? 'present' : 'MISSING'}`,
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
