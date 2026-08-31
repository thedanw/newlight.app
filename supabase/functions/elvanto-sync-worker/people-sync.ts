/**
 * People Sync Logic — Full scan diff with search cursor for incremental sync
 * Syncs people from Elvanto to Supabase with field mappings
 */

import type { FieldMappingRule, LocationTrackPairing } from './db/types.ts'
import { applyMappings, getDateFilterForEntity, updateEntityWatermark, SYNC_ENTITIES } from './mapping-engine.ts'
import { loadWatermark } from './watermark.ts'

// ============================================
// Types
// ============================================

interface ElvantoPerson {
  id: string
  date_added: string
  date_modified: string
  category_id: string
  firstname: string
  preferred_name: string
  lastname: string
  email: string
  phone: string
  mobile: string
  admin: string
  archived: string
  contact: string
  volunteer: string
  status: string
  username: string
  last_login: string
  country: string
  timezone: string
  picture: string
  family_id: string
  family_relationship: string
  birthday: string
  anniversary: string
  gender: string
  marital_status: string
  school_grade: string
  security_code: string
  receipt_name: string
  giving_number: string
  deceased: string
  development_child: string
  special_needs_child: string
  locations: string
  home_address: string
  home_address2: string
  home_city: string
  home_state: string
  home_postcode: string
  home_country: string
  mailing_address: string
  mailing_address2: string
  mailing_city: string
  mailing_state: string
  mailing_postcode: string
  mailing_country: string
  departments: string
  service_types: string
  demographics: string
  access_permissions: string
  reports_to: string
  family: any
}

interface SyncResult {
  success: boolean
  itemsProcessed: number
  itemsFailed: number
  errors: string[]
}

// ============================================
// Main Sync Function
// ============================================

export async function syncPeople(
  supabase: any,
  elvantoClient: any,
  options: { trigger: string; onProgress?: (processed: number, total: number) => void }
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    itemsProcessed: 0,
    itemsFailed: 0,
    errors: [],
  }

  try {
    // Load watermark for incremental sync
    const watermark = await loadWatermark(supabase, 'people')
    const dateFilter = getDateFilterForEntity(watermark)

    // Fetch people from Elvanto
    const people = await elvantoClient.getAllPages('people/getAll', {
      ...(dateFilter && { date_modified: dateFilter }),
      page_size: 1000,
    })

    // Process each person
    for (const person of people as ElvantoPerson[]) {
      try {
        // Apply field mappings
        const mappedFields = applyMappings(person, options.trigger)
        
        // Prepare upsert data
        const upsertData = {
          elvanto_id: person.id,
          firstname: person.firstname,
          preferred_name: person.preferred_name,
          lastname: person.lastname,
          email: person.email,
          // ... more fields
          ...mappedFields,
          updated_at: new Date().toISOString(),
        }

        // Upsert to Supabase
        const { error } = await supabase
          .from('people')
          .upsert(upsertData, { onConflict: 'elvanto_id' })

        if (error) {
          result.errors.push(`Person ${person.id}: ${error.message}`)
          result.itemsFailed++
        } else {
          result.itemsProcessed++
        }
      } catch (err) {
        result.errors.push(`Person ${person.id}: ${err instanceof Error ? err.message : String(err)}`)
        result.itemsFailed++
      }
    }

    // Update watermark
    await updateEntityWatermark(supabase, 'people', people)

    // Progress callback
    if (options.onProgress) {
      options.onProgress(result.itemsProcessed, people.length)
    }
  } catch (err) {
    result.errors.push(`Sync failed: ${err instanceof Error ? err.message : String(err)}`)
    result.success = false
    console.error('[PeopleSync] Fatal error:', err)
  }

  return result
}
