import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// Fallback to publishable key if anon key is not set (for development)
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
if (!supabaseAnonKey) {
  supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  console.warn('Using VITE_SUPABASE_PUBLISHABLE_KEY as fallback for VITE_SUPABASE_ANON_KEY')
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY as fallback).')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
