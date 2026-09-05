import type { Tables } from '@/core/lib/database.types'

// Derive shapes from the generated Supabase types — never declare domain types
// by hand. Replace `<your_table>` with the actual table name(s) in your module.
export type <Entity> = Tables<'<your_table>'>

// Add joined shapes, option objects, and other domain types as you build them.
// Example:
// export type <Entity>With<Relation> = <Entity> & {
//   relation: <Relation> | null
// }
