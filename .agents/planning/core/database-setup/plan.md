# Supabase Database Setup — Implementation Plan

**Goal:** Provision the Supabase project and create the full schema, RLS, seeds, and TypeScript client.
**Approach:** Single canonical migration from `.agents/planning/schema.dbml`; Supabase CLI local dev → push to hosted; RLS on every table via `auth.uid()` (core #11); seed journey_stages, user_roles, and module_config defaults.
**Branch:** `feat/database-setup` (from `main`)

## Source Documents (priority order)
1. `core/decision.md` — platform architecture, auth, RLS, settings (#11, #13, #14, #20, #23, #25, #26, #46)
2. `people/decision.md` — people data model, journey grid, child-safety, pg_cron (#12, #23, #28, #30, #42, #46–48)
3. `people/peopleFields.md` — field-level SSOT (enums, visibility, migration mapping)
4. `elvanto/compatibility-design.md` — dual-key identity, shadow columns, field ownership, migration runbook (§1–§8)
5. `elvanto/sync-design.md` — sync contract (watermarks, deletes, upsert order, deny-lists)

## Scope
- In: schema creation, RLS, seed data, Supabase TypeScript client, env setup
- Out: Elvanto sync worker (separate feature), pg_cron jobs (deferred — requires paid tier verification per people #4), edge functions, PWA offline cache

## Module Architecture Compatibility (module-design/decision.md)
- Batch 4 is compatible with the module architecture because it models module-owned state only; it does not introduce runtime plugins, package workspaces, or manual registry mutation.
- The database tables for groups, flows, services, songs, and calendar data remain module-owned data surfaces, while the actual feature code lives under `src/modules/<name>/` with a typed manifest and the scaffold-managed registry.
- This plan must not be read as a runtime module contract or a UI import exception. Module UI remains locked to `src/core/ui`, and cross-module coupling is still controlled by manifest dependencies.
- Implementation note: the database setup is an aggregate migration plan for local Supabase database initialization, but the module ownership boundary is still `src/modules/*` for code and `supabase/migrations` for the merged schema snapshot. It has no relationship to Twitter Bootstrap CSS; the UI stack remains Panda CSS + Park UI.

## Key Schema Patterns (from compatibility-design.md §0–§1)
- **Dual-key identity:** `id uuid pk` + `elvanto_id uuid unique null` on app-owned synced tables. Migrated rows: `id = elvanto_id`. App-origin rows: `elvanto_id = null` until first push.
- **Three table partitions:** APP-OWNED (decisions govern) · SYNC-SHADOW (`elvanto_*` columns; sync-written, never in UI) · MIRROR (Elvanto governs; groups, services, songs, calendar, flows)
- **Every synced table carries:** `_synced_at timestamptz NOT NULL`; watermarked tables add `_source_modified timestamptz NOT NULL`
- **Sync never SQL-DELETES:** missing upstream ⇒ `deleted_at` tombstone (core #26, sync-design §4)
- **FK-safe upsert order:** sync-design §5 governs batch ordering

---

## LLM Agent Execution Protocol

> **READ THIS before every batch.** This plan is designed for small-context-window LLM agents. Each batch is self-contained. Follow these rules:

### Before Every Batch
1. **Read this file** (`plan.md`) — at minimum the "Goal", "Key Schema Patterns", and the current batch section.
2. **Read `progress.md`** — check what batches are done, any errors logged, current state.
3. **Read `findings.md`** — check for audit gaps relevant to this batch.
4. **Create a TODO list** using the `manage_todo_list` tool with 3–5 actionable items for this batch.
5. **For complex batches** (Batch 3b, 4a, 4b, 6): spawn a **subagent** via `runSubagent` to handle the SQL generation while the main agent tracks progress.

### During Every Batch
6. **Mark exactly ONE todo as `in-progress`** before starting work.
7. **Mark that todo as `completed`** immediately after finishing it.
8. **Keep working** through the TODO list sequentially.

### After Every Batch
9. **Verify** using the batch's verification step.
10. **Update `progress.md`** — append a dated entry with:
    - What was done
    - Any errors encountered
    - Files created/modified
    - Verification results
11. **Update `task_plan.md`** — change the batch status from `not-started` to `completed`.
12. **Commit** with the batch's commit message.

### Subagent Strategy
- **Simple batches** (1, 2, 5, 7, 8): main agent handles directly.
- **Complex batches** (3a, 3b, 4a, 4b, 6): spawn a subagent for SQL generation; main agent handles orchestration and verification.
- **Always** pass the relevant source document paths to the subagent.

---

## Batch 1: Project Foundation
**Batch Goal:** Supabase CLI installed, project initialized, local dev running, `.env` complete, TypeScript client created.
**Estimated effort:** Small — 6 checklist items, no SQL.
**Subagent:** No — main agent handles directly.

### BEFORE YOU START
- [ ] Read this batch section fully.
- [ ] Read `progress.md` — confirm no prior batches exist.
- [ ] Create TODO list: (1) Install CLI, (2) Init project, (3) Start local dev, (4) Update .env, (5) Create client, (6) Commit.

### Steps
- [ ] **Install Supabase CLI globally:** `npm i -g supabase`
- [ ] **Init Supabase in project:** `supabase init` (creates `supabase/` dir with `config.toml`)
- [ ] **Start local dev:** `supabase start` (spins up local Postgres + Studio on port 54321)
- [ ] **Update `.env`** with local dev values from `supabase start` output:
  - `VITE_SUPABASE_URL=http://localhost:54321`
  - `VITE_SUPABASE_ANON_KEY=<from output>`
  - `SUPABASE_SERVICE_ROLE_KEY=<from output>`
- [ ] **Create `src/core/lib/supabase.ts`** — typed client singleton:
  ```ts
  import { createClient } from '@supabase/supabase-js'
  import type { Database } from './database.types'

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
  ```
- [ ] **Create `src/core/lib/database.types.ts`** — placeholder (will be regenerated from schema after migration)

### Verify
- [ ] `supabase start` shows Studio URL
- [ ] `.env` has all 3 vars set
- [ ] `src/core/lib/supabase.ts` imports without error

### AFTER YOU ARE DONE
- [ ] **Update `progress.md`:** Append entry: `## Batch 1 — Project Foundation (2026-08-25)` with details.
- [ ] **Update `task_plan.md`:** Change Batch 1 status to `completed`.
- [ ] **Commit:** `chore: supabase init + typed client`

---

## Batch 2: Extensions & Enums
**Batch Goal:** Enable pgcrypto extension and create all 20 enum types.
**Estimated effort:** Small — single SQL file, no table dependencies.
**Subagent:** No — main agent handles directly.

### BEFORE YOU START
- [ ] Read this batch section fully.
- [ ] Read `progress.md` — confirm Batch 1 is completed.
- [ ] Read `schema.dbml` lines 40–120 (the Enumerations section) to verify exact enum values.
- [ ] Create TODO list: (1) Create migration file, (2) Write SQL, (3) Verify, (4) Update progress, (5) Commit.

### Steps
- [ ] **Create migration:** `supabase migration new create_enums`
- [ ] **Write SQL** enabling `pgcrypto` extension and all 21 enum types from `schema.dbml`:
  - App enums (13): `demographic`, `gender`, `marital_status`, `access_permission`, `relationship_type`, `phone_type`, `address_kind`, `yes_no`, `tag_category`, `audit_change_reason`, `safe_ministry_leader_type`, `smt_type`, `smc_result`
  - Mirror enums (7): `person_status`, `family_relationship`, `group_status`, `flow_step_member_status`, `event_status`, `event_repeat`, `custom_field_type`

### Verify
- [ ] `supabase db reset` succeeds
- [ ] Check enums in local Studio — 21 enum types visible

### AFTER YOU ARE DONE
- [ ] **Update `progress.md`:** Append entry: `## Batch 2 — Extensions & Enums (2026-08-25)` with details.
- [ ] **Update `task_plan.md`:** Change Batch 2 status to `completed`.
- [ ] **Commit:** `feat(db): create extension + 21 enum types`

---

## Batch 3a: Core Tables — Platform + Identity
**Batch Goal:** Create platform tables (user_roles, module_config, platform_settings) and household/address tables.
**Estimated effort:** Small — 5 simple tables, no complex columns.
**Subagent:** No — main agent handles directly.

### BEFORE YOU START
- [ ] Read this batch section fully.
- [ ] Read `progress.md` — confirm Batch 2 is completed.
- [ ] Read `schema.dbml` lines 120–170 (Auth & Platform + start of People Domain).
- [ ] Create TODO list: (1) Create migration, (2) Write SQL, (3) Verify, (4) Update progress, (5) Commit.

### Steps
- [ ] **Create migration:** `supabase migration new create_platform_tables`
- [ ] **Write SQL** for tables in order:
  1. `user_roles` — id uuid PK, role access_permission NOT NULL UNIQUE, description varchar
  2. `module_config` — module varchar PK, enabled boolean NOT NULL DEFAULT true, config jsonb, updated_at timestamptz NOT NULL
  3. `platform_settings` — id uuid PK, key varchar NOT NULL, environment varchar NOT NULL, value jsonb NOT NULL, updated_at timestamptz NOT NULL; UNIQUE(index) on (key, environment)
  4. `households` — id uuid PK, elvanto_family_id integer UNIQUE (compatibility-design §2), name varchar, deleted_at timestamptz, _synced_at timestamptz NOT NULL
  5. `addresses` — id uuid PK, household_id uuid NOT NULL FK→households, kind address_kind NOT NULL DEFAULT 'home', line1/line2/suburb/state/postcode varchar, _synced_at timestamptz NOT NULL

### Verify
- [ ] `supabase db reset` succeeds
- [ ] 5 tables visible in Studio: user_roles, module_config, platform_settings, households, addresses

### AFTER YOU ARE DONE
- [ ] **Update `progress.md`:** Append entry: `## Batch 3a — Platform + Identity Tables (2026-08-25)`.
- [ ] **Update `task_plan.md`:** Change Batch 3a status to `completed`.
- [ ] **Commit:** `feat(db): platform + household tables`

---

## Batch 3b: Core Tables — People (the big one)
**Batch Goal:** Create the `people` table with all 80+ columns (personal, demographics, contact, roles, journey, child-safety, medical, consents, admin/legacy, shadows).
**Estimated effort:** **Large** — single table with complex column list. **Use subagent.**
**Subagent:** **YES** — spawn subagent to generate the CREATE TABLE SQL from `schema.dbml`. Main agent verifies.

### BEFORE YOU START
- [ ] Read this batch section fully.
- [ ] Read `progress.md` — confirm Batch 3a is completed.
- [ ] Read `schema.dbml` lines 170–340 (full `people` table definition).
- [ ] Create TODO list: (1) Spawn subagent for SQL, (2) Review SQL, (3) Apply migration, (4) Verify, (5) Update progress, (6) Commit.
- [ ] **Spawn subagent** with prompt: "Read `.agents/planning/schema.dbml` lines 170–340. Generate a PostgreSQL CREATE TABLE statement for the `people` table. Include ALL columns: personal (firstname through email), demographics (demographic through school_email_permission), mobile shadow, access_permission, journey JSONB with CHECK constraint, custom_fields JSONB, all child-safety columns (safe_ministry_*, wwcc_*, smt_*, smc_*), medical columns, consent columns, admin/legacy columns, country/timezone/picture_url, all 18+ elvanto_* shadow columns, _synced_at and _source_modified. Include the GIN index on journey and all other indexes. Do NOT create the auth_users table (Supabase-managed). Return the complete SQL."

### Steps
- [ ] **Review subagent output** — verify all columns match schema.dbml exactly.
- [ ] **Append to migration** from Batch 3a (or create new if needed): `supabase migration new create_people_table`
- [ ] **Write SQL:**
  ```sql
  -- auth_users is Supabase-managed — declared for FK documentation only
  -- Do NOT create it in migrations

  CREATE TABLE people (
    -- id, elvanto_id, auth_user_id, household_id, deleted_at
    -- Personal: firstname, preferred_name, middle_name, lastname, email
    -- Demographics: demographic, gender, date_of_birth, anniversary, marital_status,
    --   kindy_start_year, school_name, school_email_permission
    -- Contact: mobile (shadow mirror of primary mobile channel)
    -- Roles: access_permission
    -- Journey: journey jsonb NOT NULL, custom_fields jsonb
    -- Child Safety: safe_ministry_leader_type through smc_result (14 columns)
    -- Medical: medical_anaphylaxis_allergy, medical_other_behavioral, medical_regular_medication
    -- Consents: consent_external_photo, consent_internal_photo, consent_biscuit_under5, consent_girl_guide_offsite
    -- Admin/legacy: date_professed, legacy_date_added, legacy_member_id
    -- Meta: country, timezone, picture_url
    -- Shadows: elvanto_archived through elvanto_custom_fields (18+ columns)
    -- Sync: _synced_at, _source_modified
  );
  ```
- [ ] **Include constraints:**
  - `CHECK (journey <> '{}')` — people #42
  - GIN index on `journey`
  - Indexes on `email`, `(lastname, firstname)`, `_source_modified`, `household_id`
  - FK: `auth_user_id → auth_users.id` (documentation only, auth_users not created)
- [ ] **Include people_relationships, tags, people_tags** in same migration:
  - `people_relationships` — person_id, related_person_id, relationship_type, is_primary_guardian; UNIQUE(person_id, related_person_id, relationship_type) per people #10
  - `tags` — id, name, category tag_category NOT NULL DEFAULT 'custom'
  - `people_tags` — composite PK (person_id, tag_id)

### Verify
- [ ] `supabase db reset` succeeds
- [ ] `people` table has 80+ columns visible in Studio
- [ ] CHECK constraint on journey works: INSERT with `{}` should fail

### AFTER YOU ARE DONE
- [ ] **Update `progress.md`:** Append entry: `## Batch 3b — People Table (2026-08-25)` with column count and constraint details.
- [ ] **Update `task_plan.md`:** Change Batch 3b status to `completed`.
- [ ] **Commit:** `feat(db): people + relationships + tags tables`

---

## Batch 3c: Core Tables — Journey + Audit
**Batch Goal:** Create journey_track_categories, journey_tracks, journey_stages, people_audit, and Elvanto mirror tables (people_categories, custom_fields, custom_field_values).
**Estimated effort:** Small–Medium — 7 tables, moderate column counts.
**Subagent:** No — main agent handles directly.

### BEFORE YOU START
- [ ] Read this batch section fully.
- [ ] Read `progress.md` — confirm Batch 3b is completed.
- [ ] Read `schema.dbml` lines 340–420 (Journey grid + Elvanto mirrors).
- [ ] Create TODO list: (1) Create migration, (2) Write SQL, (3) Verify, (4) Update progress, (5) Commit.

### Steps
- [ ] **Create migration:** `supabase migration new create_journey_tables`
- [ ] **Write SQL** for:
  1. `journey_track_categories` — id PK, parent_id self-ref FK, name, sort_order
  2. `journey_tracks` — id PK, category_id FK, name, sort_order, elvanto_location_id UNIQUE, follow_elvanto boolean DEFAULT false, deleted_at
  3. `journey_stages` — slug varchar PK, label, color varchar(7), sort_order, is_terminal boolean DEFAULT false
  4. `people_audit` — id PK, person_id FK→people, field_changed varchar, old_value jsonb, new_value jsonb, change_reason audit_change_reason NOT NULL, changed_by uuid, changed_at timestamptz NOT NULL
  5. `people_categories` — MIRROR: id IS Elvanto UUID PK, name, color, _synced_at, _source_modified
  6. `custom_fields` — MIRROR: id PK, name, type custom_field_type NOT NULL, _synced_at
  7. `custom_field_values` — id PK, custom_field_id FK→custom_fields, name

### Verify
- [ ] `supabase db reset` succeeds
- [ ] 7 tables visible: journey_track_categories, journey_tracks, journey_stages, people_audit, people_categories, custom_fields, custom_field_values

### AFTER YOU ARE DONE
- [ ] **Update `progress.md`:** Append entry: `## Batch 3c — Journey + Audit + Mirrors (2026-08-25)`.
- [ ] **Update `task_plan.md`:** Change Batch 3c status to `completed`.
- [ ] **Commit:** `feat(db): journey grid + audit + elvanto mirror tables`

---

## Batch 4a: Module Tables — Groups + Flows
**Batch Goal:** Create module-owned schema for groups and flows: groups, group_members, locations, people_flows, people_flow_steps, people_flow_step_members.
**Estimated effort:** Small–Medium — 6 tables, MIRROR partition.
**Compatibility note:** This is only the persistence layer for the Groups + Flows module. Actual module code stays in `src/modules/groups` / `src/modules/flows` with manifest-based dependencies and no runtime plugins. The database tables are not a bypass of the module boundary.
**Subagent:** No — main agent handles directly.

### BEFORE YOU START
- [ ] Read this batch section fully.
- [ ] Read `progress.md` — confirm Batch 3c is completed.
- [ ] Read `schema.dbml` lines 420–500 (Groups + People Flows domains).
- [ ] Create TODO list: (1) Create migration, (2) Write SQL, (3) Verify, (4) Update progress, (5) Commit.

### Steps
- [ ] **Create migration:** `supabase migration new create_groups_flows`
- [ ] **Write SQL** for:
  1. `groups` — MIRROR (id IS Elvanto UUID): id PK, date_added, date_modified NOT NULL, name NOT NULL, status group_status, description text, logo_url, picture_url, meeting_* fields, meeting_frequency jsonb, _synced_at, _source_modified
  2. `group_members` — composite PK (group_id, person_id): group_id FK→groups, person_id FK→people, position varchar, _synced_at
  3. `locations` — id PK, name NOT NULL (shared reference)
  4. `people_flows` — MIRROR: id PK, name, status, access, admins uuid[], locations/demographics jsonb, _synced_at
  5. `people_flow_steps` — id PK, flow_id FK→people_flows, parent_step_id self-ref FK, priority, name, description, instructions, notifications, entry_point, step_due jsonb, admins jsonb, _synced_at
  6. `people_flow_step_members` — id PK, step_id FK→people_flow_steps, person_id FK→people, date_added, assigned_admin_id FK→people, status flow_step_member_status, completed_date, due_date, _synced_at

### Verify
- [ ] `supabase db reset` succeeds
- [ ] 6 tables visible

### AFTER YOU ARE DONE
- [ ] **Update `progress.md`:** Append entry: `## Batch 4a — Groups + Flows (2026-08-25)`.
- [ ] **Update `task_plan.md`:** Change Batch 4a status to `completed`.
- [ ] **Commit:** `feat(db): groups + people flows tables`

---

## Batch 4b: Module Tables — Services + Songs
**Batch Goal:** Create service_types, services, service_times, service_plan_items, service_volunteers, service_files, service_notes, songs, song_categories, song_category_memberships, arrangements, song_keys.
**Estimated effort:** Medium — 12 tables, some with complex columns. **Use subagent for SQL generation.**
**Subagent:** **YES** — spawn subagent to generate SQL for services + songs domain from schema.dbml.

### BEFORE YOU START
- [ ] Read this batch section fully.
- [ ] Read `progress.md` — confirm Batch 4a is completed.
- [ ] Read `schema.dbml` lines 500–620 (Services + Songs domains).
- [ ] Create TODO list: (1) Spawn subagent, (2) Review SQL, (3) Apply migration, (4) Verify, (5) Update progress, (6) Commit.
- [ ] **Spawn subagent** with prompt: "Read `.agents/planning/schema.dbml` lines 500–620. Generate PostgreSQL CREATE TABLE statements for the services domain (service_types, services, service_times, service_plan_items, service_volunteers, service_files, service_notes) and songs domain (songs, song_categories, song_category_memberships, arrangements, song_keys). Note: services.volunteer uses composite unique (service_time_id, position_id, person_id) — no stable PK. All tables are MIRROR partition with _synced_at. Return the complete SQL."

### Steps
- [ ] **Review subagent output** — verify FK order, composite keys, _synced_at on all tables.
- [ ] **Create migration:** `supabase migration new create_services_songs`
- [ ] **Apply subagent SQL** (after review).

### Verify
- [ ] `supabase db reset` succeeds
- [ ] 12 tables visible

### AFTER YOU ARE DONE
- [ ] **Update `progress.md`:** Append entry: `## Batch 4b — Services + Songs (2026-08-25)`.
- [ ] **Update `task_plan.md`:** Change Batch 4b status to `completed`.
- [ ] **Commit:** `feat(db): services + songs tables`

---

## Batch 5: Calendar + Sync Infrastructure
**Batch Goal:** Create calendars, calendar_events, calendar_event_locations, sync_errors, sync_watermarks, and sync_conflicts.
**Estimated effort:** Small — 6 tables. Note: calendar_events.calendar_id is NULLABLE (compatibility-design §8).
**Subagent:** No — main agent handles directly.

### BEFORE YOU START
- [ ] Read this batch section fully.
- [ ] Read `progress.md` — confirm Batch 4b is completed.
- [ ] Read `schema.dbml` Calendar + Sync infrastructure sections.
- [ ] Create TODO list: (1) Create migration, (2) Write SQL, (3) Verify, (4) Update progress, (5) Commit.

### Steps
- [ ] **Create migration:** `supabase migration new create_calendar_sync`
- [ ] **Write SQL** for:
  1. `calendars` — MIRROR: id PK, name, color, members boolean, published boolean, _synced_at
  2. `calendar_events` — **calendar_id is NULLABLE** (services pseudo-calendar has no row): id PK, calendar_id FK→calendars NULLABLE, name, status event_status, start_date/end_date timestamptz, all_day, where_label, description, admin_notes, url, color, picture_url, interval_summary, organizer_person_id FK→people, register_url, register_form_id, who_can_attend, show_guest_list, repeat event_repeat, repeat_frequency, repeat_on, repeat_occurrences, repeat_end_date, assets jsonb, _synced_at, _source_modified; INDEXES on calendar_id, (start_date, end_date)
  3. `calendar_event_locations` — composite PK (event_id, location_id)
  4. `sync_errors` — id PK, entity varchar NOT NULL, elvanto_id uuid, endpoint NOT NULL, error_code NOT NULL, error_message, request_payload jsonb, attempt_count integer DEFAULT 1, next_retry_at, created_at DEFAULT now(), resolved_at
  5. `sync_watermarks` — entity varchar PK, last_full_sync_at, last_poll_at, total_synced integer DEFAULT 0, notes
  6. `sync_conflicts` — id PK, entity NOT NULL, elvanto_id NOT NULL, field NOT NULL, app_value jsonb, elvanto_value jsonb, resolution varchar, resolved_by uuid, resolved_at, created_at DEFAULT now()

### Verify
- [ ] `supabase db reset` succeeds
- [ ] 6 tables visible
- [ ] Total tables in database: 40 (5 platform + 17 people + 6 groups/flows + 12 services/songs + 3 calendar + 3 sync infra)

### AFTER YOU ARE DONE
- [ ] **Update `progress.md`:** Append entry: `## Batch 5 — Calendar + Sync Infrastructure (2026-08-26)` with total table count verification.
- [ ] **Update `task_plan.md`:** Change Batch 5 status to `completed`.
- [ ] **Commit:** `feat(db): calendar + sync infrastructure tables`

---

## Batch 6: RLS Policies
**Batch Goal:** Enable Row Level Security on every table and create per-table policies.
**Estimated effort:** Medium — many tables but repetitive SQL pattern. **Use subagent.**
**Subagent:** **YES** — spawn subagent to generate all RLS SQL from the policy specifications below.

### BEFORE YOU START
- [ ] Read this batch section fully.
- [ ] Read `progress.md` — confirm Batch 5 is completed.
- [ ] Read `core/decision.md` decision #11 and `people/decision.md` RLS section.
- [ ] Create TODO list: (1) Spawn subagent, (2) Review SQL, (3) Apply migration, (4) Verify, (5) Update progress, (6) Commit.
- [ ] **Spawn subagent** with prompt: "Generate PostgreSQL RLS policies for all 40 tables. Use the policy specifications below. Return complete SQL with ALTER TABLE ENABLE ROW LEVEL SECURITY + CREATE POLICY for each table."

### Policy Specifications
- **All tables:** `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`
- **People table:**
  - Household read: `USING (household_id = (SELECT household_id FROM people WHERE id = auth.uid()))`
  - Admin manage: `USING (auth.uid() IN (SELECT id FROM people WHERE access_permission IN ('admin', 'super_admin')))`
- **Journey track/stage/category:** all authenticated read: `USING (auth.role() = 'authenticated')`
- **Module tables** (groups, group_members, services, songs, calendar): read = all authenticated; write = admin/super_admin
- **People audit:** admin/super_admin only
- **Sync infra** (errors, watermarks, conflicts): service_role only
- **Platform settings:** read = all authenticated; write = super_admin only
- **Module config:** read = all authenticated; write = admin+

### Verify
- [ ] `supabase db reset` succeeds
- [ ] Test with anon key — should see nothing
- [ ] Test with authenticated key — should see permitted rows

### AFTER YOU ARE DONE
- [ ] **Update `progress.md`:** Append entry: `## Batch 6 — RLS Policies (2026-08-25)`.
- [ ] **Update `task_plan.md`:** Change Batch 6 status to `completed`.
- [ ] **Commit:** `feat(db): RLS policies on all tables`

---

## Batch 7: Seed Data
**Batch Goal:** Populate journey_stages (6 stages), default user_roles (5 roles), module_config (4 modules).
**Estimated effort:** Small — simple INSERT statements.
**Subagent:** No — main agent handles directly.

### BEFORE YOU START
- [ ] Read this batch section fully.
- [ ] Read `progress.md` — confirm Batch 6 is completed.
- [ ] Read `people/peopleFields.md` journey grid section for exact stage values/colors.
- [ ] Create TODO list: (1) Create migration, (2) Write SQL, (3) Verify, (4) Update progress, (5) Commit.

### Steps
- [ ] **Create migration:** `supabase migration new seed_data`
- [ ] **Write SQL:**
  - **journey_stages** (per peopleFields.md):
    ```sql
    INSERT INTO journey_stages (slug, label, color, sort_order, is_terminal) VALUES
      ('contact', 'Contact', '#6B7280', 1, false),
      ('guest', 'Guest', '#F59E0B', 2, false),
      ('linked', 'Linked', '#3B82F6', 3, false),
      ('regular', 'Regular', '#10B981', 4, false),
      ('archived', 'Archived', '#9CA3AF', 5, true),
      ('deleted_privacy_data', 'GDPR Erased', '#EF4444', 6, true);
    ```
  - **user_roles** (core #25):
    ```sql
    INSERT INTO user_roles (role, description) VALUES
      ('public', 'Unauthenticated (no access)'),
      ('member_area', 'Regular church member — self-view + household'),
      ('team_leaders', 'Team leaders — read all, manage team'),
      ('admin', 'Church admins — full people/group management'),
      ('super_admin', 'Platform admin — settings + all modules');
    ```
  - **module_config** (core #14):
    ```sql
    INSERT INTO module_config (module, enabled) VALUES
      ('people', true),
      ('groups', false),
      ('services', false),
      ('calendar', false);
    ```

### Verify
- [ ] `supabase db reset` succeeds
- [ ] 6 journey_stages, 5 user_roles, 4 module_config rows visible

### AFTER YOU ARE DONE
- [ ] **Update `progress.md`:** Append entry: `## Batch 7 — Seed Data (2026-08-25)`.
- [ ] **Update `task_plan.md`:** Change Batch 7 status to `completed`.
- [ ] **Commit:** `feat(db): seed journey_stages, user_roles, module_config defaults`

---

## Batch 8: Generate TypeScript Types + Verify
**Batch Goal:** Regenerate `database.types.ts` from live schema; verify full stack compiles.
**Estimated effort:** Small — 2 commands.
**Subagent:** No — main agent handles directly.

### BEFORE YOU START
- [ ] Read this batch section fully.
- [ ] Read `progress.md` — confirm Batch 7 is completed.
- [ ] Create TODO list: (1) Generate types, (2) Typecheck, (3) Diff check, (4) Update progress, (5) Commit.

### Steps
- [ ] **Generate types:** `supabase gen types typescript --local > src/core/lib/database.types.ts`
- [ ] **Verify types compile:** `pnpm typecheck`
- [ ] **Verify full schema:** `supabase db diff --use-migra` → should be empty (no drift)

### Verify
- [ ] `database.types.ts` generated with all 40 tables
- [ ] `pnpm typecheck` passes
- [ ] `supabase db diff --use-migra` shows no drift

### AFTER YOU ARE DONE
- [ ] **Update `progress.md`:** Append entry: `## Batch 8 — TypeScript Types (2026-08-25)`.
- [ ] **Update `task_plan.md`:** Change Batch 8 status to `completed`.
- [ ] **Commit:** `chore: generate database types from schema`

---

## Batch 9: Push to Hosted (when ready)
**Batch Goal:** Link to hosted Supabase project and push schema.
**Estimated effort:** Small — but requires user to create hosted project first.
**Subagent:** No — main agent handles directly.
**Prerequisite:** User must create a Supabase project at supabase.com.

### BEFORE YOU START
- [ ] Read this batch section fully.
- [ ] Read `progress.md` — confirm Batch 8 is completed.
- [ ] Create TODO list: (1) Link project, (2) Push schema, (3) Update .env, (4) Verify, (5) Update progress, (6) Commit.

### Steps
- [ ] **Link:** `supabase link --project-ref <ref>`
- [ ] **Push:** `supabase db push`
- [ ] **Update `.env`** with hosted project values (URL + anon key + service role key)
- [ ] **Verify:** `supabase db diff --linked` → empty (no drift)

### AFTER YOU ARE DONE
- [ ] **Update `progress.md`:** Append entry: `## Batch 9 — Push to Hosted (2026-08-25)`.
- [ ] **Update `task_plan.md`:** Change Batch 9 status to `completed`.
- [ ] **Commit:** `chore: link + push schema to hosted Supabase`

---

## Deferred Batches (not in initial execution)

### Batch 10: pg_cron Jobs
**Blocker:** pg_cron requires paid tier or self-hosted. People #4 Gap: "if free tier, fallback to Edge Function triggered by GitHub Actions schedule cron."
- Demographic progression: Jan 1 00:00 AEDT (Dec 31 13:00 UTC)
- Kindy prompt: Nov/Dec cron for age 3–5 children without kindy_start_year

### Batch 11: Contact-Only Parent Trigger
**Blocker:** Requires app logic layer (Supabase Edge Function or trigger).
- People #46–47: auto-reconcile journey on child-link change
- No active child links + no own journey → auto-archive

---

## Open Questions
- [ ] Supabase project name/region (Oceania for latency? Free tier region availability?)
- [ ] Should `people` RLS allow self-view via `auth.uid() = id` OR via `household_id` match? (People #33 says both — implement both)
- [ ] pg_cron jobs (people #23, #28, #30): **DEFERRED** to Batch 10 — requires paid tier verification
- [ ] Contact-only parent trigger (people #46–47): **DEFERRED** to Batch 11

## Verification (final)
- [ ] `supabase db reset` succeeds with zero errors
- [ ] 40 tables visible in Studio
- [ ] RLS blocks anon access to all tables
- [ ] Authenticated user can read permitted rows
- [ ] Seed data present (6 journey stages, 5 user roles, 4 module configs)
- [ ] `pnpm typecheck` passes with generated `database.types.ts`
- [ ] `supabase db diff --use-migra` shows no drift
