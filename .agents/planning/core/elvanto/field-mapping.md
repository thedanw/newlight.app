# Field Mapping — Configuration & Transforms

## Storage

Mappings live in `elvanto_sync_config` (JSONB value arrays). Keys are **plugin-prefixed**: UI `setConfig('field_mappings')` stores `elvanto-sync_field_mappings`; `location_track_pairings` → `elvanto-sync_location_track_pairings` (see [database.md](database.md)). Discovery catalog: `elvanto-sync_elvanto_field_catalog`.

**Rule shape** (`db\types.ts` `FieldMappingRule`, UI `MappingRule`): `id` (UUID, backfilled for legacy rows) · `appField` (dot-path) · `elvantoField` (dot-path or `custom_<uuid>`, `category_id`, `locations.location[]`) · `direction`: `pull` | `push` | `both` · `condition?` (group tree) · `transform?` (name) · `priority` (int; UI save rewrites to `(count - index) * 10`, higher = applied first).

## UI (Field Mappings tab)

- Requires a saved API key (else points to Connection tab).
- **Discover Elvanto Fields** → `utils\field-discovery.ts` fetches categories/custom fields/locations/demographics → saves catalog → dropdown options: `category_id:<uuid>`, `custom_<uuid>`, `locations:<uuid>`, `demographics:<value>`.
  - **Dev**: Vite proxy `/api/elvanto` → `https://api.elvanto.com` (with `rewrite` to strip `/api/elvanto` prefix); locations & demographics extracted from `people/getAll` records
  - **Prod**: Edge function action `discover_fields` (server-side proxy, avoids CORS); locations & demographics extracted from `people/getAll` records
- **Note**: Elvanto has no dedicated `locations/getAll` or `demographics/getAll` endpoints. Both are extracted by fetching all people (`people/getAll` with `fields: ['locations', 'demographics']`) and compiling unique values from person records.
- **Demographics structure**: Elvanto returns demographics as `person.demographics.demographic[]` — an array of objects with `id` (UUID) and `name` (string, e.g., "Adults", "Youth", "Child"). The `fields: ['demographics']` parameter must be passed to `people/getAll` to include this data. Some people have empty `demographics: []` arrays.
- Two-column table (`settings\components\FieldMappingTable.tsx`): app field ≈60 options (identity, demographics, address, contact, consents/medical/safe-ministry, admin, `journey`, `elvanto_*` shadows) vs Elvanto field ≈53 options (incl. opt-in `home_*`/`mailing_*`); per-rule direction (`DirectionSelect`), transform (dropdown), conditions (`MappingRow`: equals / not_equals / in / exists / and / or). Add/delete/duplicate/reorder rows; **Save** persists with recomputed priorities. Defaults: `DEFAULT_MAPPINGS` (27 rules) used when no config exists — identity both-ways at priority 100; pull rules for `demographic←category_id`, `journey.sunday_services←category_id`, `journey←locations.location[]`, shadows at priority 10; push rules only for `access_permission→admin`.
- **Validation in code:** none enforced client-side beyond de-dup of option labels (legacy UI design's rule set — no duplicate/required-field checks — is design, not implemented).

## Application (edge runtime)

`supabase\functions\elvanto-sync-worker\people-sync.ts`:

1. Load rules + pairings; filter `direction ∈ {pull, both}`; sort by `priority` desc.
2. Per record: evaluate `condition` (nested and/or, field_equals/not_equals/in/exists on dot-paths) → read `elvantoField` → `applyTransform(name, value, {elvantoRecord, appRecord, entity, direction, locationPairings})` → write `appField` via dot-path.
3. Journey special-cases: `category_id` rules → Sunday-services track placeholder; `locations.location[]` → per-paired-track updates with stage from person status (archived/deceased → `deleted_privacy_data`, contact/suspended flags → `archived`, else `contact`).
4. `preparePersonUpsert` merges mapped values with **direct fallbacks** (`appRecord.x ?? person.x`) for core identity fields, then shadows/metadata. A mapping error fails that person (counted in `itemsFailed`).
5. Config-less parts of the engine: edge `mapping-engine.ts` `applyMappings()` is a stub returning `{}`; `resolveJourneyTrackId` returns a placeholder id (real track resolution relies on location pairings + `DEFAULT_JOURNEY`). The **src** `sync\mapping-engine.ts` holds the fuller (dormant) implementation.

## Transforms (15)

Registry via `getTransform`/`listTransforms` (src `sync\transforms.ts`; UI dropdown mirrors it): `category_to_journey_stage`, `location_to_journey_tracks`, `defacto_to_partner` (Defacto⇄partner), `school_grade_to_kindy_year` (kindy→0, "Year N"→N), `kindy_year_to_school_grade` (0→Kindy, 1–12→Year N), `admin_to_access_permission` (**promote-only**), `access_permission_to_admin` (admin/super_admin→1 else 0), `bool_to_yes_no`/`yes_no_to_bool`, `int_flag_to_bool`/`bool_to_int_flag`, `capitalize_enum`/`lowercase_enum`, `trim_suffix` (strips trailing `*`/`_`), plus `parse_departments`/`format_departments` (dept/position/subDepartment objects). **New:** `demographics_array_to_enum` — converts Elvanto demographics array `["Youth"]` → Supabase enum `"youth"` (handles "Adults"/"Adult"→"adult", "Child"/"Children"/"Kid"/"Kids"→"child", defaults to "adult"). Unknown transform → warn, value unchanged.

**Tests:** `src\...\sync\transforms.test.ts` specifies exact behaviour for all of the above except `category_to_demographic` — which appears in `DEFAULT_MAPPINGS` but is **not** registered in the dropdown/tests (edge instead uses an inline `mapCategoryToDemographic` that always yields `adult`). Deployed edge `transforms.ts` has diverged from the tested src copy (145/189 line delta) — tests describe intent, deployed code is truth.

## Location ↔ journey-track pairing (Locations tab)

- Fetch Locations → dev proxy or edge `list_locations` (stored key is decrypted first; legacy plaintext tolerated).
- Auto-create pairs unpaired locations, using `new-track-<locationId>` placeholder ids client-side; Save persists **config only**.
- Track rows materialize when edge `journey-sync` upserts `journey_tracks` on `elvanto_location_id` (name from pairing). Pairing `journey_track_id` values may not match the real row id until reconciled — consumers should match on `elvanto_location_id`.
- `follow_elvanto` flag is stored but not read by the edge code (design intent only).

## Salvaged from the legacy UI design (`SYNC_PLUGIN_FIELD_MAPPING_UI.md`, removed — git history)

Only the verified parts were carried forward: two-column concept, direction semantics, transform list, location-pairing flow, journey/shadow read-only intent. Its persistence design (`module_config`/versioned JSONB/audit trail), validation rules, and worker pseudocode do not match the code and were **not** carried over (superseded by the sections above).
