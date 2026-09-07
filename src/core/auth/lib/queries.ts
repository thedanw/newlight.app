import { supabase } from '@/core/lib/supabase'
import type { Tables } from '@/core/lib/database.types'

/** Load the non-deleted people row linked to an auth user (join key auth_user_id). */
export async function getPersonByAuthUserId(userId: string): Promise<Tables<'people'> | null> {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('auth_user_id', userId)
    .is('deleted_at', null)
    .maybeSingle()
  if (error) throw error
  return data
}