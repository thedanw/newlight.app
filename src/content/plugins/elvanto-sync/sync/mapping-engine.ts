/**
 * Mapping Engine — Core sync logic that applies field mappings from config
 * Loads mappings, evaluates conditions (AND/OR), applies transforms by priority
 * Handles special multi-target mappings (journey tracks)
 */

import type { TypedSupabaseClient } from '@/core/plugins/PluginAPI'
import type { FieldMappingRule, ConditionGroup, LocationTrackPairing } from '@/content/plugins/elvanto-sync/db/types'
import { getTransform } from './transforms'
import { loadWatermark, saveWatermark, parseElvantoDateModified } from './watermark'

// ============================================
// Types
// ============================================

export interface MappingContext {
  elvantoRecord: Record<string, any>
  appRecord: Record<string, any>
  entity: string
  direction: 'pull' | 'push'
}

export interface MappingResult {
  appRecord: Record<string, any>
  journeyUpdates: Record<string, string> // journey_track_id → stage
  errors: string[]
}

export interface SyncEntityConfig {
  entity: string
  elvantoEndpoint: string
  dateFilterField?: string
  mappings: FieldMappingRule[]
  locationPairings: LocationTrackPairing[]
}

// ============================================
// Condition Evaluation
// ============================================

/**
 * Evaluate a condition group against the Elvanto record
 */
export function evaluateCondition(condition: ConditionGroup | undefined, record: Record<string, any>): boolean {
  if (!condition) return true
  
  return evaluateConditionNode(condition, record)
}

function evaluateConditionNode(node: ConditionGroup, record: Record<string, any>): boolean {
  switch (node.type) {
    case 'field_equals':
      return getNestedValue(record, node.field) === node.value
    
    case 'field_not_equals':
      return getNestedValue(record, node.field) !== node.value
    
    case 'field_in':
      const value = getNestedValue(record, node.field)
      return node.values.includes(value)
    
    case 'field_exists':
      return getNestedValue(record, node.field) !== undefined && getNestedValue(record, node.field) !== null
    
    case 'and':
      return node.conditions?.every(c => evaluateConditionNode(c, record)) ?? true
    
    case 'or':
      return node.conditions?.some(c => evaluateConditionNode(c, record)) ?? false
    
    default:
      return true
  }
}

/**
 * Get nested value from object using dot notation (e.g., "person.email")
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  if (!obj || !path) return undefined
  
  return path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) return undefined
    return current[key]
  }, obj)
}

// ============================================
// Transform Application
// ============================================

/**
 * Apply a transform function to a value
 */
export function applyTransform(
  transformName: string | undefined,
  value: any,
  context?: Record<string, any>
): any {
  if (!transformName) return value
  
  const transform = getTransform(transformName)
  if (!transform) {
    console.warn(`[MappingEngine] Unknown transform: ${transformName}`)
    return value
  }
  
  try {
    return transform(value, context)
  } catch (err) {
    console.error(`[MappingEngine] Transform ${transformName} failed:`, err)
    return value
  }
}

// ============================================
// Main Mapping Engine
// ============================================

/**
 * Apply all field mappings to an Elvanto record to produce an app record
 */
export async function applyMappings(
  supabase: TypedSupabaseClient,
  entity: string,
  elvantoRecord: Record<string, any>,
  direction: 'pull' | 'push',
  mappings: FieldMappingRule[],
  locationPairings: LocationTrackPairing[]
): Promise<MappingResult> {
  const appRecord: Record<string, any> = {}
  const journeyUpdates: Record<string, string> = {}
  const errors: string[] = []
  
  // Filter mappings for this direction
  const applicableMappings = mappings.filter(m => 
    m.direction === direction || m.direction === 'both'
  )
  
  // Sort by priority (higher first)
  applicableMappings.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  
  // Create context for transforms
  const context = {
    elvantoRecord,
    appRecord,
    entity,
    direction,
    locationPairings,
  }
  
  for (const mapping of applicableMappings) {
    try {
      // Evaluate condition
      if (!evaluateCondition(mapping.condition, elvantoRecord)) {
        continue
      }
      
      // Get source value
      const sourceValue = getNestedValue(elvantoRecord, mapping.elvantoField)
      
      // Apply transform
      const transformedValue = applyTransform(mapping.transform, sourceValue, context)
      
      // Handle special multi-target mappings (journey tracks)
      if (mapping.appField.startsWith('journey') || mapping.appField === 'journey') {
        // This is a journey track mapping - could be multi-target
        if (mapping.elvantoField === 'locations.location[]' || mapping.elvantoField.includes('location')) {
          // Location-based journey tracks handled separately
          continue
        }
        if (mapping.elvantoField === 'category_id' || mapping.elvantoField.includes('category')) {
          // Category-based journey track (Sunday Services)
          const trackId = await resolveJourneyTrackId(supabase, 'sunday-services')
          if (trackId) {
            journeyUpdates[trackId] = transformedValue
          }
        }
      } else {
        // Regular field mapping
        setNestedValue(appRecord, mapping.appField, transformedValue)
      }
    } catch (err) {
      errors.push(`Mapping ${mapping.appField} ← ${mapping.elvantoField}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  
  // Handle location → journey tracks mapping (multi-target)
  const locationMapping = mappings.find(m => 
    m.elvantoField === 'locations.location[]' || m.elvantoField.includes('location')
  )
  
  if (locationMapping && direction === 'pull') {
    const locationJourneyUpdates = await applyLocationTrackMappings(
      supabase,
      elvantoRecord,
      locationPairings
    )
    Object.assign(journeyUpdates, locationJourneyUpdates)
  }
  
  return { appRecord, journeyUpdates, errors }
}

/**
 * Apply location-to-journey-track mappings
 */
async function applyLocationTrackMappings(
  _supabase: TypedSupabaseClient,
  elvantoRecord: Record<string, any>,
  locationPairings: LocationTrackPairing[]
): Promise<Record<string, string>> {
  const updates: Record<string, string> = {}
  
  const locations = elvantoRecord.locations?.location
  if (!locations || !Array.isArray(locations)) return updates
  
  for (const loc of locations) {
    if (!loc?.id) continue
    
    // Find pairing for this location
    const pairing = locationPairings.find(p => p.elvanto_location_id === loc.id)
    if (pairing?.journey_track_id) {
      // Determine stage based on person status (conservative default: contact)
      const stage = computeLocationStage(elvantoRecord)
      updates[pairing.journey_track_id] = stage
    }
  }
  
  return updates
}

/**
 * Compute journey stage for location-based track based on person status
 */
function computeLocationStage(elvantoRecord: Record<string, any>): string {
  // Status overrides (same as category mapping)
  if (elvantoRecord.contact === 1 || elvantoRecord.suspended === 1) {
    return 'archived'
  }
  if (elvantoRecord.archived === 1 || elvantoRecord.deceased === 1) {
    return 'deleted_privacy_data'
  }
  return 'contact' // Conservative default
}

/**
 * Resolve journey track ID by name/type
 */
async function resolveJourneyTrackId(
  _supabase: TypedSupabaseClient,
  trackType: 'sunday-services' | 'campus'
): Promise<string | null> {
  // In a real implementation, this would query journey_tracks table
  // For now, return a placeholder that the actual sync logic will resolve
  return `journey-track-${trackType}`
}

/**
 * Set nested value in object using dot notation
 */
function setNestedValue(obj: Record<string, any>, path: string, value: any): void {
  if (!path) return
  
  const keys = path.split('.')
  let current = obj
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }
  
  current[keys[keys.length - 1]] = value
}

// ============================================
// Watermark Integration
// ============================================

/**
 * Get the date filter for incremental sync based on watermark
 */
export async function getDateFilterForEntity(
  supabase: TypedSupabaseClient,
  entity: string,
  _dateFilterField: string
): Promise<string | null> {
  const watermark = await loadWatermark(supabase, entity)
  if (!watermark?.sourceModified) return null
  
  // Return the watermark date for API filtering
  return watermark.sourceModified
}

/**
 * Update watermark after successful entity sync
 */
export async function updateEntityWatermark(
  supabase: TypedSupabaseClient,
  entity: string,
  elvantoRecords: Record<string, any>[],
  dateModifiedField: string
): Promise<void> {
  if (!elvantoRecords.length) return
  
  // Find the latest date_modified from the synced records
  let latestDate: string | null = null
  
  for (const record of elvantoRecords) {
    const dateStr = getNestedValue(record, dateModifiedField)
    if (dateStr) {
      const parsed = parseElvantoDateModified(dateStr)
      if (!latestDate || parsed > latestDate) {
        latestDate = parsed
      }
    }
  }
  
  if (latestDate) {
    await saveWatermark(supabase, entity, latestDate, elvantoRecords.length)
  }
}

// ============================================
// Sync Entity Configs (from ELVANTO_SYNC_CONTRACT.md §5)
// ============================================

export const SYNC_ENTITIES: SyncEntityConfig[] = [
  { entity: 'people_categories', elvantoEndpoint: 'people/categories/getAll', mappings: [], locationPairings: [] },
  { entity: 'custom_fields', elvantoEndpoint: 'people/customFields/getAll', mappings: [], locationPairings: [] },
  { entity: 'families', elvantoEndpoint: 'people/getAll', dateFilterField: 'date_modified', mappings: [], locationPairings: [] },
  { 
    entity: 'people', 
    elvantoEndpoint: 'people/getAll', 
    dateFilterField: 'date_modified',
    mappings: [], // Will be loaded from config
    locationPairings: [] // Will be loaded from config
  },
  { entity: 'groups', elvantoEndpoint: 'groups/getAll', dateFilterField: 'date_modified', mappings: [], locationPairings: [] },
  { entity: 'financial_categories', elvantoEndpoint: 'financial/categories/getAll', mappings: [], locationPairings: [] },
  { entity: 'service_types', elvantoEndpoint: 'services/getAll', mappings: [], locationPairings: [] },
  { entity: 'locations', elvantoEndpoint: 'services/getAll', mappings: [], locationPairings: [] },
  { entity: 'services', elvantoEndpoint: 'services/getAll', dateFilterField: 'date_modified', mappings: [], locationPairings: [] },
  { entity: 'songs', elvantoEndpoint: 'songs/getAll', dateFilterField: 'date_modified', mappings: [], locationPairings: [] },
  { entity: 'calendars', elvantoEndpoint: 'calendar/getAll', mappings: [], locationPairings: [] },
  { entity: 'calendar_events', elvantoEndpoint: 'calendar/events/getAll', dateFilterField: 'date_modified', mappings: [], locationPairings: [] },
  { entity: 'people_flows', elvantoEndpoint: 'peopleFlows/getAll', mappings: [], locationPairings: [] },
  { entity: 'batches', elvantoEndpoint: 'financial/transactions/getAll', mappings: [], locationPairings: [] },
]

export function getSyncEntityConfig(entity: string): SyncEntityConfig | undefined {
  return SYNC_ENTITIES.find(e => e.entity === entity)
}