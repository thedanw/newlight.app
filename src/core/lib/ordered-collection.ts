import { supabase } from './supabase'
import type { Database } from './database.types'

/**
 * Describes a reorderable collection persisted to a `sort_order` column.
 * Plugins may use arbitrary tables via `table`; core tables are typed.
 */
export interface OrderedCollectionDefinition {
  /** Stable, unique id for the collection (e.g. `journey:stages`). */
  collectionId: string
  /** Supabase table name. */
  table: string
  /** Column holding the order index. Defaults to `sort_order`. */
  orderColumn?: string
  /** Fixed scope filters applied to every row update (e.g. `{ journey_id }`). */
  scope?: Record<string, unknown>
  /** Primary key column. Defaults to `id`. */
  primaryKey?: string
}

export interface OrderedCollectionService {
  /**
   * Persist an ordering by writing `orderColumn = index` per row.
   * Returns `true` only if every row update succeeds.
   */
  persist(definition: OrderedCollectionDefinition, orderedIds: string[]): Promise<boolean>
}

export const orderedCollectionService: OrderedCollectionService = {
  async persist(definition, orderedIds) {
    const { table, orderColumn = 'sort_order', scope = {}, primaryKey = 'id' } = definition
    const tableName = table as keyof Database['public']['Tables']
    for (let index = 0; index < orderedIds.length; index++) {
      const id = orderedIds[index]
      // `as never`: the payload is a generic partial update for an arbitrary
      // table; the typed client's Update union cannot express dynamic keys.
      const { error } = await supabase
        .from(tableName)
        .update({ [orderColumn]: index, ...scope } as never)
        .eq(primaryKey, id)
      if (error) return false
    }
    return true
  },
}