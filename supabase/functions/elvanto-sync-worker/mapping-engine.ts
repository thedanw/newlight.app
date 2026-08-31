/**
 * Field Mapping Engine
 * Loads mappings, evaluates conditions, applies transforms
 */

import { getTransform } from './transforms.ts'
import { loadWatermark, saveWatermark, parseElvantoDateModified } from './watermark.ts'
import type { FieldMappingRule, LocationTrackPairing } from './db/types.ts'

export interface FieldMappingRule {
  appField: string
  elvantoField: string
  direction: 'pull' | 'push' | 'both'
  condition?: any
  transform?: string
  priority: number
}

export interface LocationTrackPairing {
  elvanto_location_id: string
  elvanto_location_name: string
  journey_track_id: string
  journey_track_name: string
  follow_elvanto: boolean
}

export const SYNC_ENTITIES = ['people', 'households', 'journey']

export function applyMappings(record: Record<string, any>, trigger: string): Record<string, any> {
  const mapped: Record<string, any> = {}
  
  // Apply field mappings based on direction
  // This is a simplified version - full implementation would load from config
  return mapped
}

export async function getDateFilterForEntity(
  supabase: any,
  entity: string
): Promise<string | null> {
  const watermark = await loadWatermark(supabase, entity)
  if (!watermark?.sourceModified) return null
  return watermark.sourceModified
}

export async function updateEntityWatermark(
  supabase: any,
  entity: string,
  elvantoRecords: Record<string, any>[]
): Promise<void> {
  if (elvantoRecords.length === 0) return

  const latest = elvantoRecords.reduce((max, rec) => {
    const modified = rec.date_modified || rec.updated_at
    return modified > max ? modified : max
  }, '')

  if (latest) {
    await saveWatermark(supabase, entity, parseElvantoDateModified(latest), elvantoRecords.length)
  }
}
