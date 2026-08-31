# Elvanto Sync Plugin — Field Mapping Configuration UI Design

**Purpose:** Admin interface for configuring how Supabase (app) fields map to Elvanto fields, with conditional logic for complex mappings like People Category → Journey Grid and Locations → Journey Tracks.

---

## 1. Core Concept: Two-Column Mapping Table

| Column 1 (App Field) | Column 2 (Elvanto Field) |
|---|---|
| Every field from `peopleFields.md` (person profile sections) | Dropdown of every field available on linked Elvanto database |

**Pre-populated** from migration mappings (§4.1, §4.2 of `ELVANTO_SYNC_CONTRACT.md`) and standard field mappings (§4 matrix).

---

## 2. App Fields (Column 1) — Sourced from `peopleFields.md`

Organized by Person Profile Page sections:

### Personal Details [All]
- `firstname` (required)
- `preferred_name`
- `lastname` (required)
- `middle_name`

### Demographics [All]
- `demographic` (Adult | Youth | Child) — **maps to People Category**
- `gender` (Male | Female | Blank)
- `date_of_birth`
- `marital_status` [Adult] (Blank | Single | Engaged | Married | Partner | Widowed | Divorced | Separated)
- `kindy_start_year` [Youth+Child] (integer)
- `school_name` [Youth+Child]
- `school_email_permission` [Youth] (Blank | Yes | No)
- `school_email` [Youth + permission='yes']

### Address [All]
- `address_line1`
- `address_suburb`
- `address_state`
- `address_postcode`

### Contact [Adult]
- `email`
- `contact_channels` (first-class: type=home/mobile/work/other, value, is_primary)
  - Primary mobile → Elvanto `mobile`
  - Primary home → Elvanto `phone`

### Guardians [Youth+Child]
- `guardian_relationships` (via `people_relationships`)

### Medical [Youth+Child]
- `medical_allergies`
- `medical_other`
- `medical_medication`

### Consents [Youth+Child]
- `consent_external_photo` (Blank | Yes | No)
- `consent_internal_photo` (Blank | Yes | No)
- `consent_school_email` [Youth] (Blank | Yes | No)
- `consent_biscuit_under5` [Child<5] (Blank | Yes | No)
- `consent_girl_guide_offsite` (Blank | Yes | No)

### Child Safety [Youth+Adult]
- `safe_ministry_leader_type` (Adults Leader | Junior Leader | Not Active | Under 13 Assistant | Visiting Leader)
- `safe_ministry_notes`
- `safe_ministry_start_date` (DATE)
- `wwcc_number`
- `wwcc_expiry_date`
- `wwcc_verification_date`
- `wwcc_verification_by`
- `wwcc_verification_outcome` (Blank | Cleared)
- `wwcc_exemption` (Support Role | Volunteer and Parent of attending Child — multi-select)
- `smt_certificate_no`
- `smt_completion_date`
- `smt_last_type` (Blank | Essentials | Junior | Refresher)
- `smc_exemption`
- `smc_reviewer`
- `smc_result_date`
- `smc_result` (Age 13-17 Approved | Over 18 Approved)

### Admin [Admin]
- `access_permission` (Public | Member Area | Team Leaders | Admin | SuperAdmin)
- `date_professed`
- `legacy_date_added`
- `legacy_member_id`

### Journey Grid (App-Owned — Deny-List for Push)
- `journey` JSONB — **never pushed to Elvanto** (read-only in mapping UI)
- `journey_tracks` configuration — managed in Journey Grid Settings, not here

### Sync Shadow Fields (Read-Only in Mapping UI)
- `elvanto_category_id`
- `elvanto_archived`
- `elvanto_login_status`
- `elvanto_is_contact`
- `elvanto_deceased`
- `elvanto_custom_fields`
- `elvanto_school_grade`
- `elvanto_giving_number`
- `elvanto_locations` (JSONB)

---

## 3. Elvanto Fields (Column 2 Dropdown) — Sourced from `ELVANTO_API_REFERENCE.md`

### Standard Person Fields (from `people/getInfo` + `people/create|edit` params)
- `id` (uuid, read-only)
- `date_added` / `date_modified` (read-only)
- `category_id` (uuid → People Category)
- `firstname` / `preferred_name` / `middle_name` / `lastname`
- `email`
- `phone` / `mobile`
- `admin` / `archived` / `contact` / `volunteer` (0/1 flags)
- `status` (active | suspended)
- `username` / `last_login`
- `country` / `timezone`
- `picture`
- `family_id` (int)
- `family_relationship` (Primary Contact | Spouse | Partner | Child | Sibling | Grandfather | Grandmother | Other)
- `birthday` / `anniversary` (date)
- `gender` (Male | Female)
- `marital_status` (Single | Engaged | Married | Widowed | Divorced | Separated | Defacto)
- `school_grade` / `security_code` / `receipt_name` / `giving_number`
- `deceased` / `development_child` / `special_needs_child` (bool-ish)
- `locations` (nested `{location: [{id, name}]}`) — **maps to Journey Tracks**
- `home_address` / `home_address2` / `home_city` / `home_state` / `home_postcode` / `home_country`
- `mailing_address` / `mailing_address2` / `mailing_city` / `mailing_state` / `mailing_postcode` / `mailing_country`
- `departments` (string: `Department||Sub-department||Position`)
- `service_types` / `demographics` / `access_permissions` / `reports_to` (assignment fields)
- `family` (retrieval-only array)

### Custom Fields (EAV — Dynamic)
- `custom_<uuid>` — one per Elvanto custom field definition (from `people/customFields/getAll`)
- Displayed as: `Custom: <field_name> (type: <text|select_multi|...>)`
- For select_multi: show predefined values from `custom_field_values`

### Groups Fields (for reference)
- `groups` membership (nested in `people/getInfo` via `fields`)

---

## 4. Conditional Mapping Logic (Robust Enough for Complex Cases)

### 4.1 Mapping Rule Structure

Each mapping row can have **optional conditional logic**:

```typescript
interface MappingRule {
  appField: string;                    // Column 1 selection
  elvantoField: string;                // Column 2 selection
  direction: 'pull' | 'push' | 'both'; // Default: 'pull' for shadow, 'both' for standard
  condition?: ConditionGroup;          // Optional: when this mapping applies
  transform?: TransformFn;             // Optional: value transformation
  priority: number;                    // Higher = evaluated first (for overrides)
}
```

### 4.2 Condition System

```typescript
type Condition =
  | { type: 'field_equals'; field: string; value: string | number | boolean }
  | { type: 'field_in'; field: string; values: (string | number)[] }
  | { type: 'field_not_equals'; field: string; value: string | number | boolean }
  | { type: 'field_exists'; field: string }
  | { type: 'and'; conditions: Condition[] }
  | { type: 'or'; conditions: Condition[] };

type ConditionGroup = Condition;
```

**Fields available in conditions:** Any app field (Column 1) + any Elvanto field (Column 2) + sync shadow fields.

### 4.3 Transform Functions (Pre-defined, Selectable)

| Transform | Use Case |
|---|---|
| `identity` | Pass through (default) |
| `category_to_journey_stage` | People Category → Sunday Services track stage (§4.1) |
| `location_to_journey_tracks` | Locations[] → Campus tracks (§4.2) |
| `defacto_to_partner` | Marital status Defacto ⇄ Partner |
| `school_grade_to_kindy_year` | "Year N" / "Kindy" ⇄ integer |
| `kindy_year_to_school_grade` | Integer → "Year N" / "Kindy" |
| `admin_to_access_permission` | 0/1 ⇄ 5-level enum (promote-only on pull) |
| `bool_to_yes_no` | Boolean → "yes"/"no" string |
| `yes_no_to_bool` | "yes"/"no" → boolean |
| `int_flag_to_bool` | 0/1 → boolean |
| `bool_to_int_flag` | Boolean → 0/1 |
| `capitalize_enum` | lowercase → Capitalized |
| `lowercase_enum` | Capitalized → lowercase |
| `trim_suffix` | Remove trailing `*`, `_` from category names |
| `parse_departments` | `Dept||Sub||Pos` string → structured object |
| `format_departments` | Structured → `Dept||Sub||Pos` string |

### 4.4 Pre-Configured Complex Mappings (Shipped as Defaults)

#### Mapping A: People Category → Sunday Services Journey Track (Pull Only)

```json
{
  "appField": "journey[sunday_services_track_id]",
  "elvantoField": "category_id",
  "direction": "pull",
  "priority": 100,
  "condition": {
    "type": "and",
    "conditions": [
      { "type": "field_not_equals", "field": "contact", "value": 1 },
      { "type": "field_not_equals", "field": "suspended", "value": 1 },
      { "type": "field_not_equals", "field": "archived", "value": 1 },
      { "type": "field_not_equals", "field": "deceased", "value": 1 }
    ]
  },
  "transform": "category_to_journey_stage"
}
```

#### Mapping B: Status Overrides → Archived/Deleted (Pull Only, Higher Priority)

```json
[
  {
    "appField": "journey[sunday_services_track_id]",
    "elvantoField": "contact",
    "direction": "pull",
    "priority": 200,
    "condition": { "type": "field_equals", "field": "contact", "value": 1 },
    "transform": "constant_archived"
  },
  {
    "appField": "journey[sunday_services_track_id]",
    "elvantoField": "suspended",
    "direction": "pull",
    "priority": 200,
    "condition": { "type": "field_equals", "field": "suspended", "value": 1 },
    "transform": "constant_archived"
  },
  {
    "appField": "journey[sunday_services_track_id]",
    "elvantoField": "archived",
    "direction": "pull",
    "priority": 200,
    "condition": { "type": "field_equals", "field": "archived", "value": 1 },
    "transform": "constant_deleted_privacy_data"
  },
  {
    "appField": "journey[sunday_services_track_id]",
    "elvantoField": "deceased",
    "direction": "pull",
    "priority": 200,
    "condition": { "type": "field_equals", "field": "deceased", "value": 1 },
    "transform": "constant_deleted_privacy_data"
  }
]
```

#### Mapping C: Locations → Campus Journey Tracks (Pull Only)

```json
{
  "appField": "journey",  // Special: expands to multiple track entries
  "elvantoField": "locations.location[]",
  "direction": "pull",
  "priority": 100,
  "transform": "location_to_journey_tracks",
  "condition": {
    "type": "and",
    "conditions": [
      { "type": "field_not_equals", "field": "contact", "value": 1 },
      { "type": "field_not_equals", "field": "suspended", "value": 1 },
      { "type": "field_not_equals", "field": "archived", "value": 1 },
      { "type": "field_not_equals", "field": "deceased", "value": 1 }
    ]
  }
}
```

#### Mapping D: Standard Fields (Both Directions)

```json
[
  { "appField": "firstname", "elvantoField": "firstname", "direction": "both", "transform": "identity" },
  { "appField": "lastname", "elvantoField": "lastname", "direction": "both", "transform": "identity" },
  { "appField": "email", "elvantoField": "email", "direction": "both", "transform": "identity" },
  { "appField": "contact_channels[primary_mobile].value", "elvantoField": "mobile", "direction": "both", "transform": "identity" },
  { "appField": "contact_channels[primary_home].value", "elvantoField": "phone", "direction": "both", "transform": "identity" },
  { "appField": "marital_status", "elvantoField": "marital_status", "direction": "both", "transform": "defacto_to_partner" },
  { "appField": "kindy_start_year", "elvantoField": "school_grade", "direction": "pull", "transform": "school_grade_to_kindy_year" },
  { "appField": "kindy_start_year", "elvantoField": "school_grade", "direction": "push", "transform": "kindy_year_to_school_grade", "condition": { "type": "field_in", "field": "demographic", "values": ["Youth", "Child"] } },
  { "appField": "access_permission", "elvantoField": "admin", "direction": "pull", "transform": "admin_to_access_permission_promote_only" },
  { "appField": "access_permission", "elvantoField": "admin", "direction": "push", "transform": "access_permission_to_admin" }
]
```

---

## 5. UI Layout

### 5.1 Main Mapping Table

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Elvanto Sync — Field Mapping Configuration                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Search/Filter]  [Add Mapping]  [Import/Export JSON]  [Validate]  [Save]   │
├──────────────────┬──────────────────────┬──────────┬──────────┬────────────┤
│ App Field        │ Elvanto Field        │ Direction│ Priority │ Actions    │
├──────────────────┼──────────────────────┼──────────┼──────────┼────────────┤
│ firstname        │ firstname            │ ⇄ both   │ 10       │ [⋮]        │
│ lastname         │ lastname             │ ⇄ both   │ 10       │ [⋮]        │
│ email            │ email                │ ⇄ both   │ 10       │ [⋮]        │
│ demographic      │ category_id          │ ↓ pull   │ 50       │ [⋮]        │
│ journey[sunday]  │ category_id          │ ↓ pull   │ 100      │ [⋮]        │
│ journey[sunday]  │ contact              │ ↓ pull   │ 200      │ [⋮]        │
│ journey[campus]  │ locations.location[] │ ↓ pull   │ 100      │ [⋮]        │
│ kindy_start_year │ school_grade         │ ⇄ both   │ 10       │ [⋮]        │
│ ...              │ ...                  │ ...      │ ...      │ ...        │
├──────────────────┴──────────────────────┴──────────┴──────────┴────────────┤
│ [+ Add Custom Mapping]                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Mapping Editor Modal (Click [⋮] → Edit)

```
┌────────────────────────────────────────────────────────────┐
│ Edit Mapping Rule                                          │
├────────────────────────────────────────────────────────────┤
│ App Field: [dropdown: all peopleFields.md fields]          │
│ Elvanto Field: [dropdown: all Elvanto person fields]       │
│ Direction: [Pull ▼] [Push ▼] [Both ▼]                      │
│ Priority: [100] (number input)                             │
│                                                             │
│ ┌─ Conditional Logic (Optional) ────────────────────────┐  │
│ │ [+ Add Condition Group]                                │  │
│ │                                                         │  │
│ │ IF [field] [equals ▼] [value]                          │  │
│ │   AND [field] [in ▼] [value, value]                    │  │
│ │   OR  [field] [exists]                                 │  │
│ │                                                         │  │
│ │ [Transform: category_to_journey_stage ▼]               │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ [Cancel] [Save]                                            │
└────────────────────────────────────────────────────────────┘
```

### 5.3 Journey Track Pairing Sub-UI (For Location → Track Mappings)

Separate tab/section for managing `journey_tracks.elvanto_location_id`:

```
┌────────────────────────────────────────────────────────────┐
│ Location ↔ Journey Track Pairing                           │
├────────────────────────────────────────────────────────────┤
│ [Fetch Fresh Locations from Elvanto]                       │
├──────────────────────┬──────────────────────┬──────────────┤
│ Elvanto Location     │ Journey Track        │ Follow Elvanto│
├──────────────────────┼──────────────────────┼──────────────┤
│ Central Campus       │ Central Campus       │ [☐]          │
│   (8a631195-...)     │ (track uuid)         │              │
│ North Campus         │ North Campus         │ [☐]          │
│   (9f3aec97-...)     │ (track uuid)         │              │
│ West Campus          │ [Create New Track]   │ [☐]          │
│   (new-uuid-...)     │                      │              │
├──────────────────────┴──────────────────────┴──────────────┤
│ [Auto-Create Missing Tracks]  [Save Pairings]              │
└────────────────────────────────────────────────────────────┘
```

---

## 6. Validation Rules

1. **No duplicate appField+direction combinations** without conditions (would be ambiguous)
2. **Journey grid fields** (`journey.*`) → direction must be `pull` only (deny-list enforced)
3. **Shadow fields** (`elvanto_*`) → direction must be `pull` only, read-only in UI
4. **Required fields** (firstname, lastname, email) must have mappings in both directions
5. **Custom fields** → if Elvanto field is `custom_<uuid>`, app field must be `custom_fields` JSONB path
6. **Priority conflicts** → warn if same appField has multiple rules with same priority
7. **Transform compatibility** → validate transform input/output types match field types

---

## 7. Persistence

- Stored in `module_config` table (or dedicated `elvanto_field_mappings` table)
- Versioned JSONB: `{ version: 1, mappings: [...], locationPairings: [...], updatedAt, updatedBy }`
- Audit trail in `people_audit` (or `sync_audit`) when mappings change
- Export/import JSON for backup and migration between environments

---

## 8. Integration with Sync Worker

Sync worker reads mapping config at startup (or watches for changes via Supabase Realtime):

```typescript
// Pseudocode
const mappings = await getElvantoFieldMappings();
const locationPairings = await getLocationTrackPairings();

for (const person of elvantoPeople) {
  const appPerson = {};
  
  for (const mapping of mappings) {
    if (mapping.direction === 'pull' || mapping.direction === 'both') {
      if (evaluateCondition(mapping.condition, person)) {
        const value = getNestedValue(person, mapping.elvantoField);
        const transformed = applyTransform(mapping.transform, value, person);
        setNestedValue(appPerson, mapping.appField, transformed);
      }
    }
  }
  
  // Special handling for journey tracks (multi-target)
  applyJourneyTrackMappings(appPerson, person, locationPairings);
  
  await upsertPerson(appPerson);
}
```

---

## 9. Future Extensibility

- **Group membership mapping** → `groups` ↔ `people_relationships` / tags
- **Service/roster mapping** → `services` volunteers ↔ journey tracks
- **Giving mapping** → `transactions` ↔ journey track "Giving" (future)
- **Webhook support** → if Elvanto adds webhooks, mapping config drives real-time sync
- **Multi-tenant** → mapping config per church/tenant (already partitioned by Supabase project)