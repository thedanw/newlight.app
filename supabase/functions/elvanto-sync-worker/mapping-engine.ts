/**
 * Field Mapping Engine
 * Loads mappings, evaluates conditions, applies transforms
 */ import { loadWatermark, saveWatermark, parseElvantoDateModified } from './watermark.ts';
export const SYNC_ENTITIES = [
  'people',
  'households',
  'journey'
];
export function applyMappings(record, trigger) {
  const mapped = {};
  // Apply field mappings based on direction
  // This is a simplified version - full implementation would load from config
  return mapped;
}
export async function getDateFilterForEntity(supabase, entity) {
  const watermark = await loadWatermark(supabase, entity);
  if (!watermark?.sourceModified) return null;
  // Format for Elvanto API (space format, no timezone, UTC)
  const { formatForElvanto } = await import('./watermark.ts');
  return formatForElvanto(watermark.sourceModified);
}
export async function updateEntityWatermark(supabase, entity, elvantoRecords) {
  if (elvantoRecords.length === 0) return;
  const latest = elvantoRecords.reduce((max, rec)=>{
    const modified = rec.date_modified || rec.updated_at;
    return modified > max ? modified : max;
  }, '');
  if (latest) {
    // Store in Elvanto format (space, no timezone, UTC)
    const { formatForElvanto, parseElvantoDateModified } = await import('./watermark.ts');
    await saveWatermark(supabase, entity, formatForElvanto(parseElvantoDateModified(latest)), elvantoRecords.length);
  }
}
