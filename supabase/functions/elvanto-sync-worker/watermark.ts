/**
 * Watermark Management — Load/save sync watermarks from elvanto_sync_config
 */

const WATERMARK_KEY_PREFIX = 'watermark_'

export interface WatermarkData {
  entity: string
  sourceModified: string
  lastSyncAt: string
  itemsProcessed: number
}

export function getWatermarkKey(entity: string): string {
  return `${WATERMARK_KEY_PREFIX}${entity}`
}

export async function loadWatermark(
  supabase: any,
  entity: string
): Promise<WatermarkData | null> {
  const key = getWatermarkKey(entity)

  const { data, error } = await supabase
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
  if (!watermark.entity || !watermark.sourceModified) return null

  return watermark
}

export async function saveWatermark(
  supabase: any,
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

  const { error } = await supabase
    .from('elvanto_sync_config')
    .upsert({
      key,
      value: watermark,
      environment: 'production',
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })

  if (error) {
    console.error(`[Watermark] Failed to save watermark for ${entity}:`, error)
    throw error
  }
}

export async function loadAllWatermarks(
  supabase: any
): Promise<Record<string, WatermarkData>> {
  const { data, error } = await supabase
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

export async function clearWatermark(
  supabase: any,
  entity: string
): Promise<void> {
  const key = getWatermarkKey(entity)

  const { error } = await supabase
    .from('elvanto_sync_config')
    .delete()
    .eq('key', key)

  if (error) {
    console.error(`[Watermark] Failed to clear watermark for ${entity}:`, error)
    throw error
  }
}

export function getDateFilterFromWatermark(watermark: WatermarkData | null): string | null {
  if (!watermark?.sourceModified) return null
  return watermark.sourceModified
}

export function parseElvantoDateModified(dateStr: string): string {
  if (!dateStr) return new Date().toISOString()

  const [datePart, timePart] = dateStr.split(' ')
  if (!timePart) return new Date(datePart).toISOString()

  return `${datePart}T${timePart}.000Z`
}

export function formatForElvanto(isoDate: string): string {
  const date = new Date(isoDate)
  const pad = (n: number) => n.toString().padStart(2, '0')

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
         `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
}
