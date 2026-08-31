/**
 * Journey Sync Logic — Sync journey grid from Elvanto categories + locations
 * Sunday Services track (category-derived) + Campus tracks (location-derived)
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
  category_id: string
  category_name: string // Would need to be fetched via people/getInfo with fields
  locations: { location: Array<{ id: string; name: string }> } | null
  archived: number
  deceased: number
  contact: number
  suspended: number
  volunteer: number
}

interface SyncResult {
  success: boolean
  itemsProcessed: number
  itemsFailed: number
  errors: string[]
  lastDateModified: string | null
}

// ============================================
// Elvanto API Client
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
  
  // Need categories and locations - use people/getAll with fields
  body.fields = ['category_id', 'locations', 'archived', 'deceased', 'contact', 'suspended', 'volunteer']
  
  if (dateModifiedSince) {
    body.search = { date_modified: dateModifiedSince }
    return elvantoRequest(apiKey, 'people/search', body)
  }
  
  return elvantoRequest(apiKey, 'people/getAll', body)
}

async function getPeopleCategories(apiKey: string): Promise<Array<{ id: string; name: string }>> {
  const response = await elvantoRequest<{ categories: { category: Array<{ id: string; name: string }> } }>(
    apiKey, 'people/categories/getAll', {}
  )
  return response.categories.category
}

// ============================================
// Main Journey Sync Function
// ============================================

export async function syncJourney(
  supabase: TypedSupabaseClient,
  apiKey: string,
  options: {
    fullScan?: boolean
    onProgress?: (processed: number, total: number) => void
  } = {}
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    itemsProcessed: 0,
    itemsFailed: 0,
    errors: [],
    lastDateModified: null,
  }
  
  try {
    // Load location pairings
    const locationPairings = await loadLocationPairings(supabase)
    
    // Load category name lookup
    const categories = await getPeopleCategories(apiKey)
    const categoryNameMap = new Map(categories.map(c => [c.id, c.name]))
    
    // Determine date filter
    let dateFilter: string | null = null
    if (!options.fullScan) {
      dateFilter = await getDateFilterForEntity(supabase, 'people', 'date_modified')
    }
    
    console.log(`[JourneySync] Starting sync${dateFilter ? ` (since ${dateFilter})` : ' (full scan)'}`)
    
    // Get journey track IDs from Supabase
    const trackIds = await getJourneyTrackIds(supabase)
    if (!trackIds.sundayServices) {
      result.errors.push('Sunday Services journey track not found. Run migration first.')
      result.success = false
      return result
    }
    
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
        try {
          // Compute journey updates for this person
          const journeyUpdates = computeJourneyUpdates(
            person,
            categoryNameMap,
            trackIds,
            locationPairings
          )
          
          if (Object.keys(journeyUpdates).length === 0) {
            // No journey tracks to update for this person
            continue
          }
          
          // Update person's journey JSONB
          const { error } = await supabase
            .from('people')
            .update({ 
              journey: journeyUpdates,
              _synced_at: new Date().toISOString(),
              _source_modified: person.date_modified,
            })
            .eq('elvanto_id', person.id)
          
          if (error) {
            result.errors.push(`Person ${person.id}: ${error.message}`)
            result.itemsFailed++
          } else {
            result.itemsProcessed++
            
            if (!lastDateModified || person.date_modified > lastDateModified) {
              lastDateModified = person.date_modified
            }
          }
        } catch (err) {
          result.errors.push(`Person ${person.id}: ${err instanceof Error ? err.message : String(err)}`)
          result.itemsFailed++
        }
      }
      
      if (options.onProgress) {
        options.onProgress(result.itemsProcessed, response.people.total)
      }
      
      hasMore = people.length === pageSize
      page++
      
      if (hasMore) await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Update watermark (using people entity watermark since journey sync is part of people sync)
    if (lastDateModified) {
      await saveWatermark(supabase, 'people', lastDateModified, result.itemsProcessed)
      result.lastDateModified = lastDateModified
    }
    
    console.log(`[JourneySync] Completed: ${result.itemsProcessed} processed, ${result.itemsFailed} failed`)
    
  } catch (err) {
    result.success = false
    result.errors.push(`Sync failed: ${err instanceof Error ? err.message : String(err)}`)
    console.error('[JourneySync] Fatal error:', err)
  }
  
  return result
}

// ============================================
// Journey Computation Logic
// ============================================

interface TrackIds {
  sundayServices: string
  campusTracks: Map<string, string> // elvanto_location_id -> journey_track_id
}

async function getJourneyTrackIds(supabase: TypedSupabaseClient): Promise<TrackIds> {
  const { data: tracks } = await supabase
    .from('journey_tracks')
    .select('id, name, elvanto_location_id')
  
  const trackIds: TrackIds = {
    sundayServices: '',
    campusTracks: new Map(),
  }
  
  for (const track of tracks ?? []) {
    if (track.name === 'Sunday Services' && !track.elvanto_location_id) {
      trackIds.sundayServices = track.id
    } else if (track.elvanto_location_id) {
      trackIds.campusTracks.set(track.elvanto_location_id, track.id)
    }
  }
  
  return trackIds
}

function computeJourneyUpdates(
  person: ElvantoPerson,
  categoryNameMap: Map<string, string>,
  trackIds: TrackIds,
  locationPairings: Array<{ elvanto_location_id: string; journey_track_id: string; follow_elvanto: boolean }>
): Record<string, string> {
  const updates: Record<string, string> = {}
  
  // 1. Sunday Services track (from People Category)
  if (trackIds.sundayServices) {
    const categoryName = categoryNameMap.get(person.category_id) ?? ''
    const stage = computeSundayStage(person, categoryName)
    if (stage) {
      updates[trackIds.sundayServices] = stage
    }
  }
  
  // 2. Campus tracks (from Elvanto locations)
  const locations = person.locations?.location
  if (locations && Array.isArray(locations)) {
    for (const loc of locations) {
      if (!loc?.id) continue
      
      // Find pairing for this location
      const pairing = locationPairings.find(p => p.elvanto_location_id === loc.id)
      if (pairing?.journey_track_id) {
        const stage = computeLocationStage(person)
        updates[pairing.journey_track_id] = stage
      } else if (trackIds.campusTracks.has(loc.id)) {
        // Fallback to trackIds map if no explicit pairing
        const stage = computeLocationStage(person)
        updates[trackIds.campusTracks.get(loc.id)!] = stage
      }
    }
  }
  
  return updates
}

function computeSundayStage(person: ElvantoPerson, categoryName: string): string | null {
  // Status overrides (priority order)
  if (person.contact === 1 || person.suspended === 1) {
    return 'archived'
  }
  if (person.archived === 1 || person.deceased === 1) {
    return 'deleted_privacy_data'
  }
  
  // Category mapping
  const normalized = categoryName.trim().replace(/[*_]+$/, '').toLowerCase()
  
  const mapping: Record<string, string> = {
    'sunday guest': 'guest',
    'sunday linked': 'linked',
    'sunday regular': 'regular',
    'community connection': 'contact',
  }
  
  return mapping[normalized] ?? 'contact'
}

function computeLocationStage(person: ElvantoPerson): string {
  // Same status overrides as Sunday Services
  if (person.contact === 1 || person.suspended === 1) {
    return 'archived'
  }
  if (person.archived === 1 || person.deceased === 1) {
    return 'deleted_privacy_data'
  }
  return 'contact' // Conservative default
}

// ============================================
// Helper Functions
// ============================================

async function loadLocationPairings(supabase: TypedSupabaseClient): Promise<Array<{ elvanto_location_id: string; journey_track_id: string; follow_elvanto: boolean }>> {
  const { data } = await (supabase as any)
    .from('elvanto_sync_config')
    .select('value')
    .eq('key', 'elvanto-sync_location_track_pairings')
    .maybeSingle()
  
  return (data?.value as any[]) ?? []
}