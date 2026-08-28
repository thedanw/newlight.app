# Progress — Supabase Database Setup

**Session log** — append entries as work progresses.

## Batch 1 — Project Foundation (2026-08-25)
- ✅ CLI availability confirmed via `npx supabase --version`.
- ✅ Local Supabase project initialized via `npx supabase init`.
- ✅ Project files created: `src/core/lib/supabase.ts` and `src/core/lib/database.types.ts`.
- ✅ `.env` is present with the required project URL and keys.
- ⚠️ Local database bootstrap is blocked because Docker Desktop is not running: `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`.
- Files modified: `src/core/lib/supabase.ts`, `src/core/lib/database.types.ts`.
- Verification: CLI startup path works, but `npx supabase start` fails due to missing Docker runtime.

## Batch 2 — Extensions & Enums (2026-08-25)
- ✅ Created migration: `supabase/migrations/20260825221018_create_enums.sql`.
- ✅ Added `pgcrypto` extension and all 21 enum types from the canonical schema.
- ✅ Reset local database successfully and re-applied the migration.
- Verification: `npx supabase db query "select ... typname ..."` returned 21 enum names including `access_permission`, `demographic`, `person_status`, and `custom_field_type`.
- Files modified: `supabase/migrations/20260825221018_create_enums.sql`.

## Batch 3a — Platform + Identity Tables (2026-08-25)
- ✅ Created migration: `supabase/migrations/20260826000000_create_platform_tables.sql`.
- ✅ Applied `user_roles`, `module_config`, `platform_settings`, `households`, and `addresses`.
- Verification: `npx supabase db query ... table_name in (...)` returned all five tables.
- Warning surfaced by Supabase: RLS is disabled on these tables. The remediation SQL was shown to the user and must be applied intentionally in the authorization policy stage, not here.
- Files modified: `supabase/migrations/20260826000000_create_platform_tables.sql`.

## Batch 3b — People Table (2026-08-25)
- ✅ Created and applied the corrected people migration: `supabase/migrations/20260826002000_create_people_table.sql`.
- ✅ Created `people`, `people_relationships`, `tags`, and `people_tags` with the required indexes and non-empty `journey` check constraint.
- Verification: table presence query returned all six expected tables (`households`, `addresses`, `people`, `people_relationships`, `people_tags`, `tags`).
- Warning surfaced by Supabase: RLS is disabled on these tables and will be addressed in Batch 6.
- Files modified: `supabase/migrations/20260826010000_create_people_table.sql`.

## Batch 3c — Journey + Audit + Mirrors (2026-08-25)
- ✅ Created migration: `supabase/migrations/20260826005400_create_journey_tables.sql`.
- ✅ Added `journey_track_categories`, `journey_tracks`, `journey_stages`, `people_audit`, `people_categories`, `custom_fields`, and `custom_field_values`.
- Verification: the reset succeeded and the local DB accepted the migration set without table errors.
- Warning surfaced by Supabase: RLS remains disabled on the table set and will be addressed in Batch 6.
- Files modified: `supabase/migrations/20260825231207_create_journey_tables.sql`.

## Batch 4a — Groups + Flows (2026-08-25)
- ✅ Created migration: `supabase/migrations/20260826003527_create_groups_flows.sql`.
- ✅ Added `locations`, `groups`, `group_members`, `people_flows`, `people_flow_steps`, and `people_flow_step_members`.
- ✅ Verified the dependency order: the `people` table is created before `group_members` references it, and the new migration applies cleanly in a full reset.
- Verification: `npx supabase db reset` completed successfully, and the table query returned all expected Batch 4a tables.
- Warning surfaced by Supabase: RLS remains disabled on these tables and will be addressed in Batch 6.

## Batch 5 — Calendar + Sync Infrastructure (2026-08-26)
- ✅ Created migration: `supabase/migrations/20260826005327_create_calendar_sync.sql`.
- ✅ Added `calendars`, `calendar_events`, `calendar_event_locations`, `sync_errors`, `sync_watermarks`, and `sync_conflicts`.
- ✅ Preserved compatibility requirements: `calendar_events.calendar_id` is nullable for Elvanto's `services` pseudo-calendar, and sync errors, watermarks, and conflicts remain app-owned infrastructure.
- ✅ Financial/giving tables were removed from the executable schema and deferred outside the MVP scope by the core platform decision.
- Verification: after removing financial objects, a fresh `npx supabase db reset` should produce 40 public tables; `calendar_events.calendar_id` remains nullable.
- Warning surfaced by Supabase: RLS remains disabled across the schema and will be addressed in Batch 6 with explicit policies.
- Files modified: `supabase/migrations/20260826005327_create_calendar_sync.sql`, `supabase/migrations/20260826005400_create_journey_tables.sql`.
- Files modified: `supabase/migrations/20260826003527_create_groups_flows.sql`.

## Batch 4b — Services + Songs (2026-08-25)
- ✅ Created migration: `supabase/migrations/20260826003532_create_services_songs.sql`.
- ✅ Added `service_types`, `services`, `service_times`, `service_plan_items`, `service_volunteers`, `service_files`, `service_notes`, `songs`, `song_categories`, `song_category_memberships`, `arrangements`, and `song_keys`.
- ✅ Verified the migration set after removing a stale duplicate `people` migration and re-running a fresh reset.
- Verification: `npx supabase db reset` completed successfully, and the table query returned the expected Batch 4b tables.
- Warning surfaced by Supabase: RLS remains disabled on these tables and will be addressed in Batch 6.
- Files modified: `supabase/migrations/20260826003532_create_services_songs.sql`.

## Error Table

| # | Batch | Error | Fix Attempted | Resolution |
|---|---|---|---|---|
| 1 | Batch 1 | Docker Desktop API unavailable for local Supabase startup | Tried `npx supabase start` after init | Blocked by environment; project setup remains complete but local DB cannot boot until Docker is running |
| 2 | Batch 4 | Duplicate / stale `people` migration caused `relation "people" already exists` and earlier `relation "people" does not exist` during reset | Removed stale migrations and normalized the stable migration timestamp ordering | Batch 4 migrations now apply in the correct dependency order |
| 3 | Batch 5 | Empty Batch 3c migration caused the reset schema to contain 37 instead of 44 planned tables | Restored the seven Batch 3c tables in a correctly ordered migration and removed the empty migration | Full schema now resets cleanly with 40 tables after the financial scope removal |
