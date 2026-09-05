/**
 * Watermark Management — Load/save sync watermarks from elvanto_sync_config
 */ const WATERMARK_KEY_PREFIX = 'watermark_';
export function getWatermarkKey(entity) {
  return `${WATERMARK_KEY_PREFIX}${entity}`;
}
export async function loadWatermark(supabase, entity) {
  const key = getWatermarkKey(entity);
  const { data, error } = await supabase.from('elvanto_sync_config').select('value').eq('key', key).maybeSingle();
  if (error) {
    console.error(`[Watermark] Failed to load watermark for ${entity}:`, error);
    return null;
  }
  if (!data?.value) return null;
  const watermark = data.value;
  if (!watermark.entity || !watermark.sourceModified) return null;
  return watermark;
}
export async function saveWatermark(supabase, entity, sourceModified, itemsProcessed) {
  const key = getWatermarkKey(entity);
  const watermark = {
    entity,
    sourceModified,
    lastSyncAt: new Date().toISOString(),
    itemsProcessed
  };
  // Service-role clients have no user session — updated_by stays null for
  // automated syncs (auth.getUser() would throw on a service-role client).
  // onConflict: 'key' is required — key is UNIQUE but not the PK, so without
  // it PostgREST resolves conflicts on id and the key constraint is violated.
  const { error } = await supabase.from('elvanto_sync_config').upsert({
    key,
    value: watermark,
    environment: 'production',
    updated_by: null
  }, { onConflict: 'key' });
  if (error) {
    console.error(`[Watermark] Failed to save watermark for ${entity}:`, error);
    throw error;
  }
}
export async function loadAllWatermarks(supabase) {
  const { data, error } = await supabase.from('elvanto_sync_config').select('key, value').like('key', `${WATERMARK_KEY_PREFIX}%`);
  if (error) {
    console.error('[Watermark] Failed to load all watermarks:', error);
    return {};
  }
  const result = {};
  for (const row of data ?? []){
    const entity = row.key.replace(WATERMARK_KEY_PREFIX, '');
    result[entity] = row.value;
  }
  return result;
}
export async function clearWatermark(supabase, entity) {
  const key = getWatermarkKey(entity);
  const { error } = await supabase.from('elvanto_sync_config').delete().eq('key', key);
  if (error) {
    console.error(`[Watermark] Failed to clear watermark for ${entity}:`, error);
    throw error;
  }
}
export function getDateFilterFromWatermark(watermark) {
  if (!watermark?.sourceModified) return null;
  return watermark.sourceModified;
}
export function parseElvantoDateModified(dateStr) {
  if (!dateStr) return new Date().toISOString();
  const [datePart, timePart] = dateStr.split(' ');
  if (!timePart) return new Date(datePart).toISOString();
  return `${datePart}T${timePart}.000Z`;
}
export function formatForElvanto(isoDate) {
  const date = new Date(isoDate);
  const pad = (n)=>n.toString().padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` + `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}
