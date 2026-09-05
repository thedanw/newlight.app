/**
 * Watermark Management — Load/save sync watermarks from elvanto_sync_config
 * Watermarks track the last successful sync point per entity for incremental sync
 */

import type { TypedSupabaseClient } from '@/core/plugins/PluginAPI'

const WATERMARK_KEY_PREFIX = 'watermark_'

export interface WatermarkData {
  entity: string
  sourceModified: string // Elvanto date_modified timestamp (ISO)
  lastSyncAt: string // When we last synced this entity
  itemsProcessed: number
}

/**
 * Generate the config key for an entity's watermark
 */
export function getWatermarkKey(entity: string): string {
  return `${WATERMARK_KEY_PREFIX}${entity}`
}

/**
 * Load watermark for an entity from elvanto_sync_config
 */
export async function loadWatermark(
  supabase: TypedSupabaseClient,
  entity: string
): Promise<WatermarkData | null> {
  const key = getWatermarkKey(entity)
  
  const { data, error } = await (supabase as any)
    .from('elvanto_sync_config')
    .select('value')
    .eq('key', key)
    .maybeSingle()
  
  if (error) {
    console.error(`[Watermark] Failed to load watermark for ${entity}:`, error)
    return null
  }
  
  if (!data?.value) return null
  
  const watermark = data.value as WatermarkData
  // Validate structure
  if (!watermark.entity || !watermark.sourceModified) return null
  
  return watermark
}

/**
 * Save watermark for an entity to elvanto_sync_config
 */
export async function saveWatermark(
  supabase: TypedSupabaseClient,
  entity: string,
  sourceModified: string,
  itemsProcessed: number
): Promise<void> {
  const key = getWatermarkKey(entity)
  const watermark: WatermarkData = {
    entity,
    sourceModified,
    lastSyncAt: new Date().toISOString(),
    itemsProcessed,
  }
  
  const { error } = await (supabase as any)
    .from('elvanto_sync_config')
    .upsert(
      {
        key,
        value: watermark,
        environment: 'production',
        updated_by: (await supabase.auth.getUser()).data.user?.id,
      },
      { onConflict: 'key' }
    )
  
  if (error) {
    console.error(`[Watermark] Failed to save watermark for ${entity}:`, error)
    throw error
  }
}

/**
 * Load all watermarks (for debugging/admin UI)
 */
export async function loadAllWatermarks(
  supabase: TypedSupabaseClient
): Promise<Record<string, WatermarkData>> {
  const { data, error } = await (supabase as any)
    .from('elvanto_sync_config')
    .select('key, value')
    .like('key', `${WATERMARK_KEY_PREFIX}%`)
  
  if (error) {
    console.error('[Watermark] Failed to load all watermarks:', error)
    return {}
  }
  
  const result: Record<string, WatermarkData> = {}
  for (const row of data ?? []) {
    const entity = row.key.replace(WATERMARK_KEY_PREFIX, '')
    result[entity] = row.value as WatermarkData
  }
  
  return result
}

/**
 * Clear watermark for an entity (force full resync)
 */
export async function clearWatermark(
  supabase: TypedSupabaseClient,
  entity: string
): Promise<void> {
  const key = getWatermarkKey(entity)
  
  const { error } = await (supabase as any)
    .from('elvanto_sync_config')
    .delete()
    .eq('key', key)
  
  if (error) {
    console.error(`[Watermark] Failed to clear watermark for ${entity}:`, error)
    throw error
  }
}

/**
 * Get the date filter value for Elvanto API based on watermark
 * Returns ISO date string for date_modified >= filter
 */
export function getDateFilterFromWatermark(watermark: WatermarkData | null): string | null {
  if (!watermark?.sourceModified) return null
  return watermark.sourceModified
}

/**
 * Parse Elvanto date_modified string to ISO
 * Elvanto format: "yyyy-mm-dd hh:mm:ss" (UTC)
 */
export function parseElvantoDateModified(dateStr: string): string {
  if (!dateStr) return new Date().toISOString()
  
  // Elvanto format: "2026-08-29 14:30:00"
  // Convert to ISO: "2026-08-29T14:30:00.000Z"
  const [datePart, timePart] = dateStr.split(' ')
  if (!timePart) return new Date(datePart).toISOString()
  
  return `${datePart}T${timePart}.000Z`
}

/**
 * Format ISO date for Elvanto API (if needed for push)
 * Elvanto expects: "yyyy-mm-dd hh:mm:ss"
 */
export function formatForElvanto(isoDate: string): string {
  const date = new Date(isoDate)
  const pad = (n: number) => n.toString().padStart(2, '0')
  
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
         `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
}