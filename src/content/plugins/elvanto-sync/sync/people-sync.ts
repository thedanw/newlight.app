/**
 * People Sync Logic — Full scan diff with search cursor for incremental sync
 * Syncs people from Elvanto to Supabase with field mappings
 */

import type { TypedSupabaseClient } from '@/core/plugins/PluginAPI'
import { applyMappings, getDateFilterForEntity, updateEntityWatermark, SYNC_ENTITIES } from './mapping-engine'
import { loadWatermark as _loadWatermark } from './watermark'

// Fallback journey when no track mappings produced updates (DB CHECK journey <> '{}')
const DEFAULT_JOURNEY: Record<string, string> = { default: 'contact' }

// ============================================
// Types
// ============================================

interface ElvantoPerson {
  id: string
  date_added: string
  date_modified: string
  category_id: string
  firstname: string
  preferred_name: string | null
  middle_name: string | null
  lastname: string
  email: string | null
  phone: string | null
  mobile: string | null
  admin: number
  archived: number
  contact: number
  volunteer: number
  status: string
  username: string | null
  last_login: string | null
  country: string | null
  timezone: string | null
  picture: string | null
  family_id: number
  family_relationship: string
  birthday: string | null
  anniversary: string | null
  gender: string | null
  marital_status: string | null
  school_grade: string | null
  security_code: string | null
  receipt_name: string | null
  giving_number: string | null
  deceased: number
  development_child: number
  special_needs_child: number
  locations: { location: Array<{ id: string; name: string }> } | null
  custom_fields: Record<string, string> // custom_<uuid> -> value
  // Opt-in fields
  home_address: string | null
  home_address2: string | null
  home_city: string | null
  home_state: string | null
  home_postcode: string | null
  home_country: string | null
  mailing_address: string | null
  mailing_address2: string | null
  mailing_city: string | null
  mailing_state: string | null
  mailing_postcode: string | null
  mailing_country: string | null
  departments: string | null
  service_types: string | null
  demographics: string | null
  access_permissions: string | null
  reports_to: string | null
}

interface ElvantoPeopleResponse {
  generated_in: string
  status: string
  people: {
    on_this_page: number
    page: number
    per_page: number
    total: number
    person: ElvantoPerson[]
  }
}

interface SyncResult {
  success: boolean
  itemsProcessed: number
  itemsFailed: number
  errors: string[]
  lastDateModified: string | null
}

// ============================================
// Elvanto API Client (inline for now)
// ============================================

const ELVANTO_BASE_URL = 'https://api.elvanto.com/v1'

async function elvantoRequest<T>(
  apiKey: string,
  endpoint: string,
  body: Record<string, any>
): Promise<T> {
  const response = await fetch(`${ELVANTO_BASE_URL}/${endpoint}.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(apiKey + ':')}`,
    },
    body: JSON.stringify(body),
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Elvanto API ${response.status}: ${error.error?.message || response.statusText}`)
  }
  
  return response.json()
}

async function getElvantoPeople(
  apiKey: string,
  page: number,
  pageSize: number,
  dateModifiedSince?: string
): Promise<ElvantoPeopleResponse> {
  const body: Record<string, any> = {
    page,
    page_size: pageSize,
  }
  
  // Use people/search for date filtering (people/getAll doesn't support date_modified filter)
  if (dateModifiedSince) {
    body.search = { date_modified: dateModifiedSince }
    return elvantoRequest<ElvantoPeopleResponse>(apiKey, 'people/search', body)
  }
  
  return elvantoRequest<ElvantoPeopleResponse>(apiKey, 'people/getAll', body)
}

// ============================================
// Main People Sync Function
// ============================================

export async function syncPeople(
  supabase: TypedSupabaseClient,
  apiKey: string,
  options: {
    fullScan?: boolean
    entityFilter?: string
    onProgress?: (processed: number, total: number) => void
  } = {}
): Promise<SyncResult> {
  const entity = 'people'
  const config = SYNC_ENTITIES.find(e => e.entity === entity)
  if (!config) throw new Error(`No sync config for entity: ${entity}`)
  
  const result: SyncResult = {
    success: true,
    itemsProcessed: 0,
    itemsFailed: 0,
    errors: [],
    lastDateModified: null,
  }
  
  try {
    // Load field mappings and location pairings from config
    const mappings = await loadFieldMappings(supabase)
    const locationPairings = await loadLocationPairings(supabase)
    
    // Determine date filter for incremental sync
    let dateFilter: string | null = null
    if (!options.fullScan) {
      dateFilter = await getDateFilterForEntity(supabase, entity, 'date_modified')
    }
    
    console.log(`[PeopleSync] Starting sync${dateFilter ? ` (since ${dateFilter})` : ' (full scan)'}`)
    
    // Sync loop with pagination
    let page = 1
    const pageSize = 1000
    let hasMore = true
    let lastDateModified: string | null = null
    
    while (hasMore) {
      // Fetch page from Elvanto
      const response = await getElvantoPeople(apiKey, page, pageSize, dateFilter || undefined)
      const people = response.people.person
      
      if (!people.length) {
        hasMore = false
        break
      }
      
      // Process each person
      for (const person of people) {
        try {
          // Apply field mappings
          const { appRecord, journeyUpdates, errors } = await applyMappings(
            supabase,
            entity,
            person,
            'pull',
            mappings,
            locationPairings
          )
          
          if (errors.length) {
            result.errors.push(...errors.map(e => `Person ${person.id}: ${e}`))
            result.itemsFailed++
            continue
          }
          
          // Prepare upsert data
          const upsertData = preparePersonUpsert(person, appRecord, journeyUpdates)
          
          // Upsert to Supabase (using service role for sync writes)
          const { error } = await supabase
            .from('people')
            .upsert(upsertData, { onConflict: 'elvanto_id' })
          
          if (error) {
            result.errors.push(`Person ${person.id}: ${error.message}`)
            result.itemsFailed++
          } else {
            result.itemsProcessed++
            // Track latest date_modified for watermark
            if (!lastDateModified || person.date_modified > lastDateModified) {
              lastDateModified = person.date_modified
            }
          }
        } catch (err) {
          result.errors.push(`Person ${person.id}: ${err instanceof Error ? err.message : String(err)}`)
          result.itemsFailed++
        }
      }
      
      // Progress callback
      if (options.onProgress) {
        options.onProgress(result.itemsProcessed, response.people.total)
      }
      
      // Check if more pages
      hasMore = people.length === pageSize
      page++
      
      // Rate limiting: small delay between pages
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    // Update watermark
    if (lastDateModified) {
      await updateEntityWatermark(supabase, entity, [], 'date_modified')
      // Manually save with the last date
      const { saveWatermark } = await import('./watermark')
      await saveWatermark(supabase, entity, lastDateModified, result.itemsProcessed)
      result.lastDateModified = lastDateModified
    }
    
    console.log(`[PeopleSync] Completed: ${result.itemsProcessed} processed, ${result.itemsFailed} failed`)
    
  } catch (err) {
    result.success = false
    result.errors.push(`Sync failed: ${err instanceof Error ? err.message : String(err)}`)
    console.error('[PeopleSync] Fatal error:', err)
  }
  
  return result
}

// ============================================
// Helper Functions
// ============================================

async function loadFieldMappings(supabase: TypedSupabaseClient): Promise<any[]> {
  const { data } = await (supabase as any)
    .from('elvanto_sync_config')
    .select('value')
    .eq('key', 'elvanto-sync_field_mappings')
    .maybeSingle()
  
  return (data?.value as any[]) ?? []
}

async function loadLocationPairings(supabase: TypedSupabaseClient): Promise<any[]> {
  const { data } = await (supabase as any)
    .from('elvanto_sync_config')
    .select('value')
    .eq('key', 'elvanto-sync_location_track_pairings')
    .maybeSingle()
  
  return (data?.value as any[]) ?? []
}

function preparePersonUpsert(
  person: ElvantoPerson,
  appRecord: Record<string, any>,
  journeyUpdates: Record<string, string>
): Record<string, any> {
  return {
    // Identity
    elvanto_id: person.id,
    id: person.id, // Migrated rows use same ID
    
    // Core fields from appRecord (mapped)
    ...appRecord,
    
    // Direct fields (fallback if not mapped)
    firstname: appRecord.firstname ?? person.firstname,
    preferred_name: appRecord.preferred_name ?? person.preferred_name,
    middle_name: appRecord.middle_name ?? person.middle_name,
    lastname: appRecord.lastname ?? person.lastname,
    email: appRecord.email ?? person.email,
    mobile: appRecord.mobile ?? person.mobile,
    
    // Demographics
    demographic: sanitizeDemographic(appRecord.demographic ?? mapCategoryToDemographic(person.category_id)),
    gender: sanitizeGender(appRecord.gender ?? mapGender(person.gender)),
    date_of_birth: appRecord.date_of_birth ?? person.birthday,
    anniversary: appRecord.anniversary ?? person.anniversary,
    marital_status: sanitizeMaritalStatus(appRecord.marital_status ?? mapMaritalStatus(person.marital_status)),
    kindy_start_year: appRecord.kindy_start_year ?? mapSchoolGradeToKindyYear(person.school_grade),
    school_name: appRecord.school_name ?? null,
    
    // Access
    access_permission: sanitizeAccessPermission(appRecord.access_permission ?? mapAdminToPermission(person.admin)),
    
    // Journey (DB CHECK journey <> '{}' — always emit a non-empty object)
    journey: Object.keys(journeyUpdates).length > 0 ? journeyUpdates : { ...DEFAULT_JOURNEY },
    
    // Sync metadata
    _synced_at: now,
    _source_modified: person.date_modified,
    
    // Sync shadows
    elvanto_category_id: person.category_id,
    elvanto_archived: person.archived === 1,
    elvanto_login_status: person.status === 'suspended' ? 'suspended' : 'active',
    elvanto_is_contact: person.contact === 1,
    elvanto_deceased: person.deceased === 1,
    elvanto_custom_fields: person.custom_fields ?? {},
    elvanto_school_grade: person.school_grade,
    elvanto_giving_number: person.giving_number,
  }
}

// Mapping helpers (inline for now, will use transforms.ts)
function sanitizeDemographic(value: any): 'adult' | 'youth' | 'child' {
  if (value === 'adult' || value === 'youth' || value === 'child') return value
  // UUID or unknown value — fall back to adult (safe enum default)
  return 'adult'
}

function sanitizeGender(value: any): 'male' | 'female' | null {
  if (value === 'male' || value === 'female') return value
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    if (lower === 'male' || lower === 'female') return lower
  }
  return null
}

function sanitizeMaritalStatus(value: any): string | null {
  const valid = ['single', 'engaged', 'married', 'partner', 'widowed', 'divorced', 'separated']
  if (typeof value === 'string' && valid.includes(value.toLowerCase())) {
    return value.toLowerCase()
  }
  return null
}

function sanitizeAccessPermission(value: any): string {
  const valid = ['public', 'member_area', 'team_leaders', 'admin', 'super_admin']
  if (typeof value === 'string' && valid.includes(value.toLowerCase())) {
    return value.toLowerCase()
  }
  return 'member_area'
}

function mapCategoryToDemographic(_categoryId: string): 'adult' | 'youth' | 'child' {
  // Would need category lookup - default to adult
  return 'adult'
}

function mapGender(gender: string | null): 'male' | 'female' | null {
  if (!gender) return null
  const lower = gender.toLowerCase()
  if (lower === 'male') return 'male'
  if (lower === 'female') return 'female'
  return null
}

function mapMaritalStatus(status: string | null): string | null {
  if (!status) return null
  const lower = status.toLowerCase()
  if (lower === 'defacto') return 'partner'
  return lower
}

function mapSchoolGradeToKindyYear(grade: string | null): number | null {
  if (!grade) return null
  const lower = grade.toLowerCase().trim()
  if (lower === 'kindy' || lower === 'kindergarten') return 0
  const match = lower.match(/year\s*(\d+)/i) || lower.match(/^(\d+)$/)
  if (match) return parseInt(match[1], 10)
  return null
}

function mapAdminToPermission(admin: number): string {
  return admin === 1 ? 'admin' : 'member_area'
}

const now = new Date().toISOString()