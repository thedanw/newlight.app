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
  return watermark.sourceModified;
}
export async function updateEntityWatermark(supabase, entity, elvantoRecords) {
  if (elvantoRecords.length === 0) return;
  const latest = elvantoRecords.reduce((max, rec)=>{
    const modified = rec.date_modified || rec.updated_at;
    return modified > max ? modified : max;
  }, '');
  if (latest) {
    await saveWatermark(supabase, entity, parseElvantoDateModified(latest), elvantoRecords.length);
  }
}
