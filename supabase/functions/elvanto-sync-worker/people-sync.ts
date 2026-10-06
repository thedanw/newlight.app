/**
 * People Sync Logic — Full scan + incremental sync from Elvanto → Supabase.
 *
 * Receives the Elvanto API key as a string (decrypted from `elvanto_settings`
 * by index.ts). Fetches all people via people/getAll with pagination, applies
 * field mappings from `elvanto_sync_config`, and upserts rows into `people`
 * (PK id, unique elvanto_id) in batched chunks.
 */ import { getTransform } from './transforms.ts';
import { saveWatermark, formatForElvanto, loadWatermark, getDateFilterFromWatermark } from './watermark.ts';
const ELVANTO_BASE_URL = 'https://api.elvanto.com/v1';
const DEFAULT_PAGE_SIZE = 500;
const SEARCH_PAGE_SIZE = 1000;
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

/**
 * Fetch people using people/search with date_modified filter for incremental sync.
 * Elvanto's people/search supports date_modified with >= comparison (UTC).
 * Returns all matching people across pages.
 */
async function searchPeopleByDateModified(apiKey, dateModified) {
  const all = [];
  let page = 1;
  const dateFilter = dateModified.split(' ')[0]; // Extract YYYY-MM-DD from "YYYY-MM-DD HH:MM:SS"
  console.log(`[PeopleSync] Incremental sync: searching for people modified since ${dateFilter}`);
  
  for(;;){
    const body = {
      page,
      page_size: SEARCH_PAGE_SIZE,
      search: {
        date_modified: dateFilter
      },
      fields: [
        'gender',
        'birthday',
        'locations',
        'demographics'
      ]
    };
    const data = await elvantoRequest(apiKey, 'people/search', body);
    const batch = data?.people?.person ?? [];
    const total = data?.people?.total ?? 0;
    all.push(...batch);
    if (batch.length === 0 || all.length >= total || page >= MAX_PAGES) break;
    page++;
  }
  return all;
}

async function getAllPeople(apiKey, _dateFilter) {
  const all = [];
  let page = 1;
  for(;;){
    const body = {
      page,
      page_size: DEFAULT_PAGE_SIZE,
      fields: [
        'gender',
        'birthday',
        'locations',
        'demographics'
      ] // demographics field + custom field UUID from Elvanto API
    };
    // if (dateFilter) body.date_modified = dateFilter; // DISABLED: Elvanto API ignores this parameter on getAll
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
 */ async function applyMappings(supabase, entity, elvantoRecord, direction, mappings, locationPairings, categoryDemographicMappings, statusStageOverrides, journeyTransformGroups) {
  const appRecord = {};
  const journeyUpdates = {};
  const errors = [];
  // Filter mappings for this direction
  const applicableMappings = mappings.filter((m)=>m.direction === direction || m.direction === 'both');
  // Sort by priority (higher first)
  applicableMappings.sort((a, b)=>(b.priority ?? 0) - (a.priority ?? 0));
  // Fetch current permission from database for promote-only logic
  const { data: existingPerson } = await supabase
    .from('people')
    .select('access_permission')
    .eq('elvanto_id', elvantoRecord.id)
    .maybeSingle();
  // Create context for transforms
  const context = {
    elvantoRecord,
    appRecord,
    entity,
    direction,
    locationPairings,
    categoryDemographicMappings,
    statusStageOverrides,
    currentPermission: existingPerson?.access_permission
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
          // Category-based journey track (Sunday Services) - legacy single-track
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
    const locationJourneyUpdates = await applyLocationTrackMappings(supabase, elvantoRecord, locationPairings, statusStageOverrides);
    Object.assign(journeyUpdates, locationJourneyUpdates);
  }
  // Handle journey transform groups (new conditional format)
  if (direction === 'pull' && journeyTransformGroups && journeyTransformGroups.length > 0) {
    const groupJourneyUpdates = await applyJourneyTransformGroups(elvantoRecord, journeyTransformGroups);
    Object.assign(journeyUpdates, groupJourneyUpdates);
  } else if (direction === 'pull' && categoryDemographicMappings.length > 0) {
    // Fallback to legacy category/demographic mappings if no transform groups
    const catDemoJourneyUpdates = await applyCategoryDemographicTrackStageMappings(elvantoRecord, categoryDemographicMappings);
    Object.assign(journeyUpdates, catDemoJourneyUpdates);
  }
  // Apply status stage overrides to ALL journey tracks (universal overrides) - legacy fallback
  if (direction === 'pull' && Object.keys(statusStageOverrides).length > 0 && (!journeyTransformGroups || journeyTransformGroups.length === 0)) {
    applyStatusStageOverrides(journeyUpdates, elvantoRecord, statusStageOverrides);
  }
  return {
    appRecord,
    journeyUpdates,
    errors
  };
}
/**
 * Apply location-to-journey-track mappings
 */ async function applyLocationTrackMappings(_supabase, elvantoRecord, locationPairings, statusStageOverrides) {
  const updates = {};
  const locations = elvantoRecord.locations?.location;
  if (!locations || !Array.isArray(locations)) return updates;
  for (const loc of locations){
    if (!loc?.id) continue;
    // Find pairing for this location
    const pairing = locationPairings.find((p)=>p.elvanto_location_id === loc.id);
    if (pairing?.journey_track_id) {
      // Determine stage based on person status (conservative default: contact)
      let stage = computeLocationStage(elvantoRecord);
      // Apply status overrides if configured
      if (elvantoRecord.contact === 1 && statusStageOverrides.contact) {
        stage = statusStageOverrides.contact;
      } else if (elvantoRecord.archived === 1 && statusStageOverrides.archived) {
        stage = statusStageOverrides.archived;
      } else if (elvantoRecord.deceased === 1 && statusStageOverrides.deceased) {
        stage = statusStageOverrides.deceased;
      }
      updates[pairing.journey_track_id] = stage;
    }
  }
  return updates;
}

/**
 * Apply category/demographic → journey track + stage mappings
 * Elvanto categories/demographics map to specific tracks with specific stages
 */ async function applyCategoryDemographicTrackStageMappings(elvantoRecord, mappings) {
  const updates = {};
  
  // Get category_id from record
  const categoryId = elvantoRecord.category_id;
  
  // Get demographics from record (Elvanto returns {demographic: [{id, name}]})
  let demographicName = null;
  if (elvantoRecord.demographics?.demographic && Array.isArray(elvantoRecord.demographics.demographic) && elvantoRecord.demographics.demographic.length > 0) {
    demographicName = elvantoRecord.demographics.demographic[0]?.name;
  }
  
  for (const mapping of mappings) {
    let matches = false;
    
    if (mapping.source_type === 'category' && categoryId && mapping.source_value === categoryId) {
      matches = true;
    } else if (mapping.source_type === 'demographic' && demographicName && mapping.source_value === demographicName) {
      matches = true;
    }
    
    if (matches && mapping.journey_track_id && mapping.stage) {
      updates[mapping.journey_track_id] = mapping.stage;
    }
  }
  
  return updates;
}

/**
 * Apply status stage overrides to ALL journey tracks (universal overrides)
 * contact=1, archived=1, deceased=1 override stage on every track
 */ function applyStatusStageOverrides(journeyUpdates, elvantoRecord, statusStageOverrides) {
  // Determine which override applies (priority: deceased > archived > contact)
  let overrideStage = null;
  
  if (elvantoRecord.deceased === 1 && statusStageOverrides.deceased) {
    overrideStage = statusStageOverrides.deceased;
  } else if (elvantoRecord.archived === 1 && statusStageOverrides.archived) {
    overrideStage = statusStageOverrides.archived;
  } else if (elvantoRecord.contact === 1 && statusStageOverrides.contact) {
    overrideStage = statusStageOverrides.contact;
  }
  
  if (overrideStage) {
    // Apply to ALL existing journey tracks
    for (const trackId of Object.keys(journeyUpdates)) {
      journeyUpdates[trackId] = overrideStage;
    }
  }
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

async function loadCategoryDemographicTrackStageMappings(supabase) {
  const { data, error } = await supabase.from('elvanto_sync_config').select('value').eq('key', 'elvanto-sync_category_demographic_track_stage_mappings').maybeSingle();
  if (error) {
    console.error('[PeopleSync] Failed to load category/demographic track-stage mappings:', error);
    return [];
  }
  return Array.isArray(data?.value) ? data.value : [];
}

async function loadStatusStageOverrides(supabase) {
  const { data, error } = await supabase.from('elvanto_sync_config').select('value').eq('key', 'elvanto-sync_status_stage_overrides').maybeSingle();
  if (error) {
    console.error('[PeopleSync] Failed to load status stage overrides:', error);
    return {};
  }
  return data?.value ?? {};
}

async function loadJourneyTransformGroups(supabase) {
  const { data, error } = await supabase.from('elvanto_sync_config').select('value').eq('key', 'journey_transform_groups').maybeSingle();
  if (error) {
    console.error('[PeopleSync] Failed to load journey transform groups:', error);
    return [];
  }
  return Array.isArray(data?.value) ? data.value : [];
}

function evaluateCondition(condition, elvantoRecord) {
  let fieldValue = null;
  
  if (condition.field === 'category') {
    fieldValue = elvantoRecord.category_id;
  } else if (condition.field === 'demographic') {
    const demographics = elvantoRecord.demographics?.demographic;
    if (Array.isArray(demographics) && demographics.length > 0) {
      fieldValue = demographics[0]?.name || null;
    }
  } else if (condition.field === 'location') {
    const locations = elvantoRecord.locations?.location;
    if (Array.isArray(locations)) {
      fieldValue = locations.map(l => l?.id).filter(Boolean);
    }
  } else if (condition.field === 'status_contact') {
    fieldValue = elvantoRecord.contact === 1 ? '1' : '0';
  } else if (condition.field === 'status_archived') {
    fieldValue = (elvantoRecord.archived === 1 || elvantoRecord.deceased === 1) ? '1' : '0';
  }
  
  if (fieldValue === null || fieldValue === undefined) return false;
  
  if (condition.operator === 'equals') {
    if (Array.isArray(fieldValue)) {
      return fieldValue.includes(condition.value);
    }
    return String(fieldValue) === String(condition.value);
  } else if (condition.operator === 'not_equals') {
    if (Array.isArray(fieldValue)) {
      return !fieldValue.includes(condition.value);
    }
    return String(fieldValue) !== String(condition.value);
  } else if (condition.operator === 'contains') {
    return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
  }
  
  return false;
}

function evaluateGroupConditions(group, elvantoRecord) {
  if (!group.conditions || group.conditions.length === 0) return true;
  
  let result = evaluateCondition(group.conditions[0], elvantoRecord);
  
  for (let i = 1; i < group.conditions.length; i++) {
    const conditionResult = evaluateCondition(group.conditions[i], elvantoRecord);
    const logic = group.conditions[i].logic || 'AND';
    
    if (logic === 'AND') {
      result = result && conditionResult;
    } else if (logic === 'OR') {
      result = result || conditionResult;
    } else if (logic === 'XOR') {
      result = (result || conditionResult) && !(result && conditionResult);
    }
  }
  
  return result;
}

async function applyJourneyTransformGroups(elvantoRecord, transformGroups) {
  const updates = {};
  
  for (const group of transformGroups) {
    if (!evaluateGroupConditions(group, elvantoRecord)) continue;
    
    for (const transform of group.transforms) {
      if (transform.trackId && transform.stageId) {
        updates[transform.trackId] = transform.stageId;
      }
    }
  }
  
  return updates;
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
    const categoryDemographicMappings = await loadCategoryDemographicTrackStageMappings(supabase);
    const statusStageOverrides = await loadStatusStageOverrides(supabase);
    const journeyTransformGroups = await loadJourneyTransformGroups(supabase);
    
    // Determine sync mode: incremental (using people/search) or full scan (people/getAll)
    const fullScan = options.fullScan === true;
    let people = [];
    let syncMode = 'full';
    
    if (!fullScan) {
      // Try to load watermark for incremental sync
      const watermark = await loadWatermark(supabase, entity);
      const dateFilter = watermark ? getDateFilterFromWatermark(watermark) : null;
      
      if (dateFilter) {
        // Use incremental sync via people/search with date_modified filter
        syncMode = 'incremental';
        console.log(`[PeopleSync] Starting ${syncMode} sync (since ${dateFilter})`);
        people = await searchPeopleByDateModified(apiKey, dateFilter);
      } else {
        console.log('[PeopleSync] No watermark found, falling back to full scan');
        people = await getAllPeople(apiKey, null);
      }
    } else {
      console.log('[PeopleSync] Starting full scan sync (forced)');
      people = await getAllPeople(apiKey, null);
    }
    
    const total = people.length;
    if (total === 0) {
      console.log(`[PeopleSync] No people to sync (${syncMode} mode)`);
      return result;
    }
    console.log(`[PeopleSync] ${syncMode} sync: ${total} people to process`);
    // Process in chunks for batched upserts
    const upsertRows = [];
    let lastDateModified = null;
    for (const person of people){
      try {
        // Apply field mappings
        const { appRecord, journeyUpdates, errors } = await applyMappings(supabase, entity, person, 'pull', mappings, locationPairings, categoryDemographicMappings, statusStageOverrides, journeyTransformGroups);
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
    // Update watermark (format for Elvanto API: space format, UTC, no timezone)
    if (lastDateModified) {
      await saveWatermark(supabase, entity, formatForElvanto(lastDateModified), result.itemsProcessed);
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
  // Helper to convert empty strings to null for date fields
  const parseDate = (val) => {
    if (!val || val === '' || val === '0000-00-00') return null;
    // Handle MM-DD format (anniversary dates without year)
    if (/^\d{2}-\d{2}$/.test(val)) return null;
    return val;
  };
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
    date_of_birth: parseDate(appRecord.date_of_birth ?? person.birthday),
    anniversary: parseDate(appRecord.anniversary ?? person.anniversary),
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
  const valid = [
    'single',
    'engaged',
    'married',
    'partner',
    'widowed',
    'divorced',
    'separated'
  ];
  if (typeof value === 'string' && valid.includes(value.toLowerCase())) {
    return value.toLowerCase();
  }
  return null;
}
function sanitizeAccessPermission(value) {
  const valid = [
    'public',
    'member_area',
    'team_leaders',
    'admin',
    'super_admin'
  ];
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
