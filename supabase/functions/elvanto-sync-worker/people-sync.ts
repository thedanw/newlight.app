/**
 * People Sync Logic — Full scan + incremental sync from Elvanto → Supabase.
 *
 * Receives the Elvanto API key as a string (decrypted from `elvanto_settings`
 * by index.ts). Fetches all people via people/getAll with pagination, applies
 * field mappings from `elvanto_sync_config`, and upserts rows into `people`
 * (PK id, unique elvanto_id) in batched chunks.
 */ import { getTransform } from './transforms.ts';
import { saveWatermark } from './watermark.ts';
import { getDateFilterForEntity } from './mapping-engine.ts';
const ELVANTO_BASE_URL = 'https://api.elvanto.com/v1';
const DEFAULT_PAGE_SIZE = 500;
const MAX_PAGES = 200;
const UPSERT_CHUNK_SIZE = 200;
// Fallback journey when no track mappings produced updates (DB CHECK journey <> '{}')
const DEFAULT_JOURNEY = {
  default: 'contact'
};
// ============================================
// Elvanto API helpers
// ============================================
async function elvantoRequest(apiKey, endpoint, body) {
  const response = await fetch(`${ELVANTO_BASE_URL}/${endpoint}.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(apiKey + ':')}`
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const errData = await response.json().catch(()=>({}));
    throw new Error(`Elvanto API ${response.status}: ${errData.error?.message || response.statusText}`);
  }
  return response.json();
}
async function getAllPeople(apiKey, dateFilter) {
  const all = [];
  let page = 1;
  for(;;){
    const body = {
      page,
      page_size: DEFAULT_PAGE_SIZE
    };
    if (dateFilter) body.date_modified = dateFilter;
    const data = await elvantoRequest(apiKey, 'people/getAll', body);
    const batch = data?.people?.person ?? [];
    const total = data?.people?.total ?? 0;
    all.push(...batch);
    if (batch.length === 0 || all.length >= total || page >= MAX_PAGES) break;
    page++;
  }
  return all;
}
// ============================================
// Config helpers
// ============================================
async function loadFieldMappings(supabase) {
  const { data, error } = await supabase.from('elvanto_sync_config').select('value').eq('key', 'elvanto-sync_field_mappings').maybeSingle();
  if (error) {
    console.error('[PeopleSync] Failed to load field mappings:', error);
    return [];
  }
  return Array.isArray(data?.value) ? data.value : [];
}
async function loadJourneyTrackMap(supabase) {
  const byLocation = {};
  let sundayService = null;
  try {
    const { data, error } = await supabase.from('journey_tracks').select('id, name, elvanto_location_id').is('deleted_at', null);
    if (error) {
      console.error('[PeopleSync] Failed to load journey tracks:', error);
      return {
        byLocation,
        sundayService
      };
    }
    for (const track of data ?? []){
      if (track.elvanto_location_id) {
        byLocation[track.elvanto_location_id] = track.id;
      }
      const name = String(track.name || '').toLowerCase();
      if (!sundayService && name.includes('sunday')) {
        sundayService = track.id;
      }
    }
  } catch (err) {
    console.error('[PeopleSync] Error loading journey tracks:', err);
  }
  return {
    byLocation,
    sundayService
  };
}
/**
 * Evaluate a condition group against the Elvanto record
 */ function evaluateCondition(condition, record) {
  if (!condition) return true;
  return evaluateConditionNode(condition, record);
}
function evaluateConditionNode(node, record) {
  switch(node.type){
    case 'field_equals':
      return getNestedValue(record, node.field) === node.value;
    case 'field_not_equals':
      return getNestedValue(record, node.field) !== node.value;
    case 'field_in':
      return node.values.includes(getNestedValue(record, node.field));
    case 'field_exists':
      {
        const value = getNestedValue(record, node.field);
        return value !== undefined && value !== null;
      }
    case 'and':
      return node.conditions?.every((c)=>evaluateConditionNode(c, record)) ?? true;
    case 'or':
      return node.conditions?.some((c)=>evaluateConditionNode(c, record)) ?? false;
    default:
      return true;
  }
}
/**
 * Get nested value from object using dot notation (e.g., "person.email")
 */ function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((current, key)=>{
    if (current === null || current === undefined) return undefined;
    return current[key];
  }, obj);
}
/**
 * Apply a transform function to a value
 */ function applyTransform(transformName, value, context) {
  if (!transformName) return value;
  const transform = getTransform(transformName);
  if (!transform) {
    console.warn(`[PeopleSync] Unknown transform: ${transformName}`);
    return value;
  }
  try {
    return transform(value, context);
  } catch (err) {
    console.error(`[PeopleSync] Transform ${transformName} failed:`, err);
    return value;
  }
}
/**
 * Apply all field mappings to an Elvanto record to produce an app record
 */ async function applyMappings(supabase, entity, elvantoRecord, direction, mappings, locationPairings) {
  const appRecord = {};
  const journeyUpdates = {};
  const errors = [];
  // Filter mappings for this direction
  const applicableMappings = mappings.filter((m)=>m.direction === direction || m.direction === 'both');
  // Sort by priority (higher first)
  applicableMappings.sort((a, b)=>(b.priority ?? 0) - (a.priority ?? 0));
  // Create context for transforms
  const context = {
    elvantoRecord,
    appRecord,
    entity,
    direction,
    locationPairings
  };
  for (const mapping of applicableMappings){
    try {
      // Evaluate condition
      if (!evaluateCondition(mapping.condition, elvantoRecord)) {
        continue;
      }
      // Get source value
      const sourceValue = getNestedValue(elvantoRecord, mapping.elvantoField);
      // Apply transform
      const transformedValue = applyTransform(mapping.transform, sourceValue, context);
      // Handle special multi-target mappings (journey tracks)
      if (mapping.appField.startsWith('journey') || mapping.appField === 'journey') {
        // This is a journey track mapping - could be multi-target
        if (mapping.elvantoField === 'locations.location[]' || mapping.elvantoField.includes('location')) {
          continue;
        }
        if (mapping.elvantoField === 'category_id' || mapping.elvantoField.includes('category')) {
          // Category-based journey track (Sunday Services)
          const trackId = await resolveJourneyTrackId(supabase, 'sunday-services');
          if (trackId) {
            journeyUpdates[trackId] = transformedValue;
          }
        }
      } else {
        // Regular field mapping
        setNestedValue(appRecord, mapping.appField, transformedValue);
      }
    } catch (err) {
      errors.push(`Mapping ${mapping.appField} ← ${mapping.elvantoField}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  // Handle location → journey tracks mapping (multi-target)
  const locationMapping = mappings.find((m)=>m.elvantoField === 'locations.location[]' || m.elvantoField.includes('location'));
  if (locationMapping && direction === 'pull') {
    const locationJourneyUpdates = await applyLocationTrackMappings(supabase, elvantoRecord, locationPairings);
    Object.assign(journeyUpdates, locationJourneyUpdates);
  }
  return {
    appRecord,
    journeyUpdates,
    errors
  };
}
/**
 * Apply location-to-journey-track mappings
 */ async function applyLocationTrackMappings(_supabase, elvantoRecord, locationPairings) {
  const updates = {};
  const locations = elvantoRecord.locations?.location;
  if (!locations || !Array.isArray(locations)) return updates;
  for (const loc of locations){
    if (!loc?.id) continue;
    // Find pairing for this location
    const pairing = locationPairings.find((p)=>p.elvanto_location_id === loc.id);
    if (pairing?.journey_track_id) {
      // Determine stage based on person status (conservative default: contact)
      const stage = computeLocationStage(elvantoRecord);
      updates[pairing.journey_track_id] = stage;
    }
  }
  return updates;
}
/**
 * Compute journey stage for location-based track based on person status
 */ function computeLocationStage(elvantoRecord) {
  // Status overrides (same as category mapping)
  if (elvantoRecord.contact === 1 || elvantoRecord.suspended === 1) {
    return 'archived';
  }
  if (elvantoRecord.archived === 1 || elvantoRecord.deceased === 1) {
    return 'deleted_privacy_data';
  }
  return 'contact' // Conservative default
  ;
}
/**
 * Resolve journey track ID by name/type
 */ async function resolveJourneyTrackId(_supabase, trackType) {
  // In a real implementation, this would query journey_tracks table
  // For now, return a placeholder that the actual sync logic will resolve
  return `journey-track-${trackType}`;
}
/**
 * Set nested value in object using dot notation
 */ function setNestedValue(obj, path, value) {
  if (!path) return;
  const keys = path.split('.');
  let current = obj;
  for(let i = 0; i < keys.length - 1; i++){
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}
// ============================================
// Config helpers (continued)
// ============================================
async function loadLocationPairings(supabase) {
  const { data, error } = await supabase.from('elvanto_sync_config').select('value').eq('key', 'elvanto-sync_location_track_pairings').maybeSingle();
  if (error) {
    console.error('[PeopleSync] Failed to load location track pairings:', error);
    return [];
  }
  return Array.isArray(data?.value) ? data.value : [];
}
// ============================================
// Main People Sync Function
// ============================================
export async function syncPeople(supabase, apiKey, options = {}) {
  const entity = 'people';
  const result = {
    success: true,
    itemsProcessed: 0,
    itemsFailed: 0,
    errors: [],
    lastDateModified: null
  };
  try {
    // Load field mappings and location pairings from config
    const mappings = await loadFieldMappings(supabase);
    const locationPairings = await loadLocationPairings(supabase);
    // Determine date filter for incremental sync
    let dateFilter = null;
    if (!options.fullScan) {
      dateFilter = await getDateFilterForEntity(supabase, entity);
    }
    console.log(`[PeopleSync] Starting sync${dateFilter ? ` (since ${dateFilter})` : ' (full scan)'}`);
    // Fetch all people (paginated internally by getAllPeople)
    const people = await getAllPeople(apiKey, dateFilter || undefined);
    const total = people.length;
    if (total === 0) {
      console.log('[PeopleSync] No people to sync');
      return result;
    }
    // Process in chunks for batched upserts
    const upsertRows = [];
    let lastDateModified = null;
    for (const person of people){
      try {
        // Apply field mappings
        const { appRecord, journeyUpdates, errors } = await applyMappings(supabase, entity, person, 'pull', mappings, locationPairings);
        if (errors.length) {
          result.errors.push(...errors.map((e)=>`Person ${person.id}: ${e}`));
          result.itemsFailed++;
          continue;
        }
        // Prepare upsert data
        const upsertData = preparePersonUpsert(person, appRecord, journeyUpdates);
        upsertRows.push(upsertData);
        // Track latest date_modified for watermark
        if (person.date_modified && (!lastDateModified || person.date_modified > lastDateModified)) {
          lastDateModified = person.date_modified;
        }
        // Flush chunk when full
        if (upsertRows.length >= UPSERT_CHUNK_SIZE) {
          const { error } = await supabase.from('people').upsert(upsertRows, {
            onConflict: 'elvanto_id'
          });
          if (error) {
            result.errors.push(`Chunk upsert failed: ${error.message}`);
            result.itemsFailed += upsertRows.length;
          } else {
            result.itemsProcessed += upsertRows.length;
          }
          upsertRows.length = 0;
        }
      } catch (err) {
        result.errors.push(`Person ${person.id}: ${err instanceof Error ? err.message : String(err)}`);
        result.itemsFailed++;
      }
      // Progress callback
      if (options.onProgress) {
        options.onProgress(result.itemsProcessed + result.itemsFailed, total);
      }
    }
    // Flush remaining chunk
    if (upsertRows.length > 0) {
      const { error } = await supabase.from('people').upsert(upsertRows, {
        onConflict: 'elvanto_id'
      });
      if (error) {
        result.errors.push(`Chunk upsert failed: ${error.message}`);
        result.itemsFailed += upsertRows.length;
      } else {
        result.itemsProcessed += upsertRows.length;
      }
    }
    // Update watermark
    if (lastDateModified) {
      await saveWatermark(supabase, entity, lastDateModified, result.itemsProcessed);
      result.lastDateModified = lastDateModified;
    }
    console.log(`[PeopleSync] Completed: ${result.itemsProcessed} processed, ${result.itemsFailed} failed`);
  } catch (err) {
    // Serialize the error usefully (Supabase errors are plain objects, not Error instances)
    let detail = '';
    if (err instanceof Error) {
      detail = err.message;
    } else if (err && typeof err === 'object') {
      detail = err.message || err.error_description || err.details || JSON.stringify(err);
    } else {
      detail = String(err);
    }
    // If rows were already processed, the sync itself succeeded — record the
    // post-processing error but don't flip the whole result to failed.
    if (result.itemsProcessed > 0 || result.itemsFailed > 0) {
      result.errors.push(`Post-sync warning: ${detail}`);
      console.warn('[PeopleSync] Post-sync warning:', err);
    } else {
      result.success = false;
      result.errors.push(`Sync failed: ${detail}`);
      console.error('[PeopleSync] Fatal error:', err);
    }
  }
  return result;
}
// ============================================
// Helper Functions
// ============================================
function preparePersonUpsert(person, appRecord, journeyUpdates) {
  return {
    // Identity
    elvanto_id: person.id,
    id: person.id,
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
    journey: Object.keys(journeyUpdates).length > 0 ? journeyUpdates : {
      ...DEFAULT_JOURNEY
    },
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
    elvanto_giving_number: person.giving_number
  };
}
// Mapping helpers (inline for now, will use transforms.ts)
function sanitizeDemographic(value) {
  if (value === 'adult' || value === 'youth' || value === 'child') return value;
  // UUID or unknown value — fall back to adult (safe enum default)
  return 'adult';
}
function sanitizeGender(value) {
  if (value === 'male' || value === 'female') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'male' || lower === 'female') return lower;
  }
  return null;
}
function sanitizeMaritalStatus(value) {
  const valid = ['single', 'engaged', 'married', 'partner', 'widowed', 'divorced', 'separated'];
  if (typeof value === 'string' && valid.includes(value.toLowerCase())) {
    return value.toLowerCase();
  }
  return null;
}
function sanitizeAccessPermission(value) {
  const valid = ['public', 'member_area', 'team_leaders', 'admin', 'super_admin'];
  if (typeof value === 'string' && valid.includes(value.toLowerCase())) {
    return value.toLowerCase();
  }
  return 'member_area';
}
function mapCategoryToDemographic(_categoryId) {
  // Would need category lookup - default to adult
  return 'adult';
}
function mapGender(gender) {
  if (!gender) return null;
  const lower = gender.toLowerCase();
  if (lower === 'male') return 'male';
  if (lower === 'female') return 'female';
  return null;
}
function mapMaritalStatus(status) {
  if (!status) return null;
  const lower = status.toLowerCase();
  if (lower === 'defacto') return 'partner';
  return lower;
}
function mapSchoolGradeToKindyYear(grade) {
  if (!grade) return null;
  const lower = grade.toLowerCase().trim();
  if (lower === 'kindy' || lower === 'kindergarten') return 0;
  const match = lower.match(/year\s*(\d+)/i) || lower.match(/^(\d+)$/);
  if (match) return parseInt(match[1], 10);
  return null;
}
function mapAdminToPermission(admin) {
  return admin === 1 || admin === '1' ? 'admin' : 'member_area';
}
const now = new Date().toISOString();
