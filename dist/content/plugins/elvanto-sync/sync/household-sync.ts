/**
 * Household Sync Logic — Derive households from Elvanto family_id changes
 * Address sync via Primary Contact only (per ELVANTO_SYNC_CONTRACT.md L-2)
 */

import type { TypedSupabaseClient } from '@/core/plugins/PluginAPI'
import { getDateFilterForEntity } from './mapping-engine'
import { saveWatermark } from './watermark'

// ============================================
// Types
// ============================================

interface ElvantoPerson {
  id: string
  date_modified: string
  family_id: number
  family_relationship: string
  firstname: string
  lastname: string
  // Address fields (on Primary Contact)
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
}

interface SyncResult {
  success: boolean
  itemsProcessed: number
  itemsFailed: number
  errors: string[]
  lastDateModified: string | null
}

// ============================================
// Elvanto API Client (reuse from people-sync)
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
): Promise<{ people: { person: ElvantoPerson[]; on_this_page: number; total: number } }> {
  const body: Record<string, any> = { page, page_size: pageSize }
  
  if (dateModifiedSince) {
    body.search = { date_modified: dateModifiedSince }
    return elvantoRequest(apiKey, 'people/search', body)
  }
  
  return elvantoRequest(apiKey, 'people/getAll', body)
}

// ============================================
// Main Household Sync Function
// ============================================

export async function syncHouseholds(
  supabase: TypedSupabaseClient,
  apiKey: string,
  options: {
    fullScan?: boolean
    onProgress?: (processed: number, total: number) => void
  } = {}
): Promise<SyncResult> {
  const entity = 'households'
  const result: SyncResult = {
    success: true,
    itemsProcessed: 0,
    itemsFailed: 0,
    errors: [],
    lastDateModified: null,
  }
  
  try {
    // Determine date filter
    let dateFilter: string | null = null
    if (!options.fullScan) {
      dateFilter = await getDateFilterForEntity(supabase, entity, 'date_modified')
    }
    
    console.log(`[HouseholdSync] Starting sync${dateFilter ? ` (since ${dateFilter})` : ' (full scan)'}`)
    
    // Build household map from people data
    // We need to fetch all people to derive households
    const householdMap = new Map<number, {
      familyId: number
      members: ElvantoPerson[]
      primaryContact: ElvantoPerson | null
      lastModified: string
    }>()
    
    let page = 1
    const pageSize = 1000
    let hasMore = true
    let lastDateModified: string | null = null
    
    while (hasMore) {
      const response = await getElvantoPeople(apiKey, page, pageSize, dateFilter || undefined)
      const people = response.people.person
      
      if (!people.length) {
        hasMore = false
        break
      }
      
      for (const person of people) {
        const familyId = person.family_id
        if (!familyId) continue // Skip people without family
        
        let household = householdMap.get(familyId)
        if (!household) {
          household = {
            familyId,
            members: [],
            primaryContact: null,
            lastModified: person.date_modified,
          }
          householdMap.set(familyId, household)
        }
        
        household.members.push(person)
        
        // Track primary contact for address
        if (person.family_relationship === 'Primary Contact') {
          household.primaryContact = person
        }
        
        // Track latest modification
        if (!household.lastModified || person.date_modified > household.lastModified) {
          household.lastModified = person.date_modified
        }
        
        if (!lastDateModified || person.date_modified > lastDateModified) {
          lastDateModified = person.date_modified
        }
      }
      
      if (options.onProgress) {
        options.onProgress(result.itemsProcessed, response.people.total)
      }
      
      hasMore = people.length === pageSize
      page++
      
      if (hasMore) await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Now upsert households
    for (const [familyId, household] of householdMap) {
      try {
        // Prepare household upsert
        const householdData = prepareHouseholdUpsert(familyId, household)
        
        const { error } = await supabase
          .from('households')
          .upsert(householdData, { onConflict: 'elvanto_family_id' })
        
        if (error) {
          result.errors.push(`Household ${familyId}: ${error.message}`)
          result.itemsFailed++
        } else {
          result.itemsProcessed++
          
          // Also upsert address from primary contact
          if (household.primaryContact) {
            await upsertHouseholdAddress(supabase, familyId, household.primaryContact)
          }
        }
      } catch (err) {
        result.errors.push(`Household ${familyId}: ${err instanceof Error ? err.message : String(err)}`)
        result.itemsFailed++
      }
    }
    
    // Update watermark
    if (lastDateModified) {
      await saveWatermark(supabase, entity, lastDateModified, result.itemsProcessed)
      result.lastDateModified = lastDateModified
    }
    
    console.log(`[HouseholdSync] Completed: ${result.itemsProcessed} processed, ${result.itemsFailed} failed`)
    
  } catch (err) {
    result.success = false
    result.errors.push(`Sync failed: ${err instanceof Error ? err.message : String(err)}`)
    console.error('[HouseholdSync] Fatal error:', err)
  }
  
  return result
}

function prepareHouseholdUpsert(
  familyId: number,
  household: { familyId: number; members: ElvantoPerson[]; primaryContact: ElvantoPerson | null; lastModified: string }
): Record<string, any> {
  const now = new Date().toISOString()
  
  // Generate household name from primary contact or first member
  const primary = household.primaryContact ?? household.members[0]
  const name = primary ? `${primary.lastname} Family` : `Family ${familyId}`
  
  return {
    elvanto_family_id: familyId,
    name,
    _synced_at: now,
  }
}

async function upsertHouseholdAddress(
  supabase: TypedSupabaseClient,
  familyId: number,
  primaryContact: ElvantoPerson
): Promise<void> {
  // Get household UUID
  const { data: household } = await supabase
    .from('households')
    .select('id')
    .eq('elvanto_family_id', familyId)
    .maybeSingle()
  
  if (!household) return
  
  const now = new Date().toISOString()
  
  // Upsert home address
  if (primaryContact.home_address || primaryContact.home_city || primaryContact.home_postcode) {
    await supabase
      .from('addresses')
      .upsert({
        household_id: household.id,
        kind: 'home',
        line1: primaryContact.home_address,
        line2: primaryContact.home_address2,
        suburb: primaryContact.home_city,
        state: primaryContact.home_state,
        postcode: primaryContact.home_postcode,
        // country: primaryContact.home_country, // if column exists
        _synced_at: now,
      }, { onConflict: 'household_id,kind' })
  }
  
  // Upsert mailing address if different
  if (primaryContact.mailing_address && 
      primaryContact.mailing_address !== primaryContact.home_address) {
    await supabase
      .from('addresses')
      .upsert({
        household_id: household.id,
        kind: 'postal',
        line1: primaryContact.mailing_address,
        line2: primaryContact.mailing_address2,
        suburb: primaryContact.mailing_city,
        state: primaryContact.mailing_state,
        postcode: primaryContact.mailing_postcode,
        // country: primaryContact.mailing_country,
        _synced_at: now,
      }, { onConflict: 'household_id,kind' })
  }
}

// Type for ElvantoPerson (reused from people-sync)
interface ElvantoPerson {
  id: string
  date_modified: string
  family_id: number
  family_relationship: string
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
}