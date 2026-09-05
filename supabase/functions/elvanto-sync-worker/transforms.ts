/**
 * Transform Functions — Pure, unit-testable transformations for Elvanto ↔ Supabase sync
 * Used by mapping-engine.ts to convert field values during sync
 */ // ============================================
// Type Definitions
// ============================================
// ============================================
// 1. category_to_journey_stage
// People Category name → Sunday Services journey track stage
// ============================================
/**
 * Maps Elvanto People Category to journey stage for Sunday Services track
 * Status overrides (contact/suspended → archived, archived/deceased → deleted_privacy_data)
 * are handled separately in mapping-engine.ts with higher priority
 */ export function category_to_journey_stage(categoryName, _context) {
  if (!categoryName) return 'contact';
  // Normalize: trim whitespace, remove trailing * and _, lowercase for comparison
  const normalized = categoryName.trim().replace(/[*_]+$/, '').toLowerCase();
  const mapping = {
    'sunday guest': 'guest',
    'sunday linked': 'linked',
    'sunday regular': 'regular',
    'community connection': 'contact'
  };
  return mapping[normalized] ?? 'contact';
}
// ============================================
// 1b. category_to_demographic
// People Category name → demographic enum (adult | youth | child)
// ============================================
/**
 * Maps an Elvanto People Category to a demographic enum value.
 * Accepts a category NAME (e.g. "Kids", "Youth", "Adults") or a category UUID.
 * UUIDs cannot be resolved without a lookup, so they default to 'adult'
 * (safe fallback — the demographic enum only allows adult|youth|child).
 */ export function category_to_demographic(categoryValue, _context) {
  if (!categoryValue) return 'adult';
  // If it looks like a UUID, we can't resolve the name — default to adult
  if (typeof categoryValue === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryValue)) {
    return 'adult';
  }
  const normalized = String(categoryValue).trim().replace(/[*_]+$/, '').toLowerCase();
  if (/(^|\s)(child|kid|kids|toddler|infant|baby|pre-school|preschool|nursery)/.test(normalized)) {
    return 'child';
  }
  if (/(^|\s)(youth|teen|teenager|high.?school|young.?adult|youth.?group)/.test(normalized)) {
    return 'youth';
  }
  return 'adult';
}
// ============================================
// 2. location_to_journey_tracks
// Locations[] array → Campus journey tracks (multi-target)
// ============================================
/**
 * Transforms Elvanto locations array into journey track entries
 * Returns object mapping journey_track_id → stage
 * Actual track ID resolution happens in mapping-engine.ts using location_track_pairings config
 */ export function location_to_journey_tracks(locations, _context) {
  if (!locations?.location || !Array.isArray(locations.location)) {
    return {};
  }
  const result = {};
  for (const loc of locations.location){
    if (loc?.id) {
      // The actual journey_track_id will be resolved by mapping-engine
      // using the location_track_pairings config (elvanto_location_id → journey_track_id)
      // For now, we use the location ID as a key that mapping-engine will translate
      result[`location:${loc.id}`] = 'contact' // Conservative default
      ;
    }
  }
  return result;
}
// ============================================
// 3. defacto_to_partner
// Marital status: Defacto ↔ Partner
// ============================================
export function defacto_to_partner(value, context) {
  const direction = context?.direction ?? 'pull';
  if (direction === 'pull') {
    // Elvanto → Supabase: Defacto → Partner
    return value?.toLowerCase() === 'defacto' ? 'partner' : value?.toLowerCase() ?? '';
  } else {
    // Supabase → Elvanto: Partner → Defacto
    return value?.toLowerCase() === 'partner' ? 'Defacto' : capitalizeFirst(value ?? '');
  }
}
// ============================================
// 4. school_grade_to_kindy_year
// "Year N" / "Kindy" → integer (kindy_start_year)
// ============================================
export function school_grade_to_kindy_year(schoolGrade) {
  if (!schoolGrade) return null;
  const normalized = schoolGrade.trim().toLowerCase();
  if (normalized === 'kindy' || normalized === 'kindergarten') {
    return 0 // Kindy = 0
    ;
  }
  // Match "Year N" or "year N" or just "N"
  const yearMatch = normalized.match(/^year\s*(\d+)$/i) || normalized.match(/^(\d+)$/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    if (year >= 1 && year <= 12) {
      return year // Year 1 = 1, Year 12 = 12
      ;
    }
  }
  return null // Unparseable → null (review queue)
  ;
}
// ============================================
// 5. kindy_year_to_school_grade
// Integer (kindy_start_year) → "Year N" / "Kindy"
// ============================================
export function kindy_year_to_school_grade(kindyYear, context) {
  if (kindyYear === null || kindyYear === undefined) return null;
  // Only push for Youth/Child demographics
  const demographic = context?.demographic;
  if (demographic && ![
    'youth',
    'child'
  ].includes(demographic.toLowerCase())) {
    return null;
  }
  if (kindyYear === 0) return 'Kindy';
  if (kindyYear >= 1 && kindyYear <= 12) return `Year ${kindyYear}`;
  return null;
}
// ============================================
// 6. admin_to_access_permission
// Admin 0/1 (promote-only on pull) → 5-level access_permission enum
// ============================================
export function admin_to_access_permission(adminFlag, context) {
  const isAdmin = adminFlag === 1 || adminFlag === '1' || adminFlag === true;
  const currentPermission = context?.currentPermission;
  if (isAdmin) {
    // Promote-only: only upgrade, never downgrade on pull
    const currentLevel = permissionToLevel(currentPermission ?? 'public');
    const adminLevel = permissionToLevel('admin');
    return currentLevel >= adminLevel ? currentPermission ?? 'admin' : 'admin';
  }
  // Not admin → member_area (lowest non-public) or keep current if higher
  const currentLevel = permissionToLevel(currentPermission ?? 'public');
  const memberLevel = permissionToLevel('member_area');
  return currentLevel >= memberLevel ? currentPermission ?? 'member_area' : 'member_area';
}
function permissionToLevel(permission) {
  const levels = {
    'public': 0,
    'member_area': 1,
    'team_leaders': 2,
    'admin': 3,
    'super_admin': 4
  };
  return levels[permission?.toLowerCase()] ?? 0;
}
// ============================================
// 7. access_permission_to_admin
// 5-level access_permission enum → Admin 0/1
// ============================================
export function access_permission_to_admin(permission) {
  const adminLevels = [
    'admin',
    'super_admin'
  ];
  return adminLevels.includes(permission?.toLowerCase() ?? '') ? 1 : 0;
}
// ============================================
// 8. bool_to_yes_no / yes_no_to_bool
// Boolean ↔ "yes"/"no" string
// ============================================
export function bool_to_yes_no(value) {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (typeof value === 'number') return value === 1 ? 'yes' : 'no';
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if ([
      'true',
      '1',
      'yes',
      'y'
    ].includes(lower)) return 'yes';
    if ([
      'false',
      '0',
      'no',
      'n'
    ].includes(lower)) return 'no';
  }
  return 'no';
}
export function yes_no_to_bool(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return [
      'yes',
      'y',
      'true',
      '1'
    ].includes(lower);
  }
  return false;
}
// ============================================
// 9. int_flag_to_bool / bool_to_int_flag
// 0/1 ↔ Boolean
// ============================================
export function int_flag_to_bool(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value === '1';
  return false;
}
export function bool_to_int_flag(value) {
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value === 1 ? 1 : 0;
  if (typeof value === 'string') return [
    '1',
    'true',
    'yes',
    'y'
  ].includes(value.toLowerCase()) ? 1 : 0;
  return 0;
}
// ============================================
// 10. capitalize_enum / lowercase_enum
// Case conversion for enum values
// ============================================
export function capitalize_enum(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
export function lowercase_enum(value) {
  return value?.toLowerCase() ?? '';
}
function capitalizeFirst(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}
// ============================================
// 11. trim_suffix
// Remove trailing *, _ from category names
// ============================================
export function trim_suffix(value) {
  return value?.trim().replace(/[*_]+$/, '') ?? '';
}
export function parse_departments(departmentsString) {
  if (!departmentsString) return [];
  return departmentsString.split(',').map((part)=>{
    const [dept, subDept, position] = part.split('||').map((s)=>s?.trim() ?? '');
    return {
      department: dept,
      subDepartment: subDept,
      position
    };
  });
}
export function format_departments(departments) {
  if (!departments?.length) return '';
  return departments.map((d)=>[
      d.department,
      d.subDepartment,
      d.position
    ].filter(Boolean).join('||')).join(',');
}
// ============================================
// Transform Registry
// ============================================
export const TRANSFORMS = {
  category_to_journey_stage,
  category_to_demographic,
  location_to_journey_tracks,
  defacto_to_partner,
  school_grade_to_kindy_year,
  kindy_year_to_school_grade,
  admin_to_access_permission,
  access_permission_to_admin,
  bool_to_yes_no,
  yes_no_to_bool,
  int_flag_to_bool,
  bool_to_int_flag,
  capitalize_enum,
  lowercase_enum,
  trim_suffix,
  parse_departments,
  format_departments
};
export function getTransform(name) {
  return TRANSFORMS[name];
}
export function listTransforms() {
  return Object.keys(TRANSFORMS);
}
