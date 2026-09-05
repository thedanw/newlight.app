import { supabase } from '@/core/lib/supabase'
import type { <Entity> } from './types'

/**
 * Supabase queries return typed shapes from `./types`. Throw on error; the
 * `useAsyncQuery` wrapper in `hooks.ts` catches and surfaces it.
 */
export async function get<Entities>(options: { limit?: number; offset?: number } = {}): Promise<<Entity>[]> {
  const { limit = 50, offset = 0 } = options
  const { data, error } = await supabase
    .from('<your_table>')
    .select('*')
    .range(offset, offset + limit - 1)
  if (error) throw error
  return (data ?? []) as <Entity>[]
}

// Add create/update/delete queries as your module grows:
// export async function create<Entity>(input: ...) { ... }
// export async function update<Entity>(id: string, patch: ...) { ... }
