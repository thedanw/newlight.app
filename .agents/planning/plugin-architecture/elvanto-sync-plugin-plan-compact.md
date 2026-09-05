# Elvanto Sync Plugin — Compact Plan (Small Context Optimized)

**Full Plan:** `elvanto-sync-plugin-plan.md` | **Task Plan:** `task_plan.md` | **Progress:** `progress.md` | **Decisions:** `decision.md`

---

## TL;DR

Build a **runtime plugin system** (WordPress-style) with **Elvanto Sync** as first plugin.

| Aspect | Decision |
|--------|----------|
| **Plugin Location** | `/src/content/plugins/elvanto-sync/` (dev) → `/public/content/plugins/elvanto-sync/` (prod, gitignored) |
| **Sync Runtime** | Supabase Edge Function + pg_cron (native, free tier) |
| **Config Storage** | Dedicated `elvanto_sync_config` table (JSONB key/value) |
| **Credentials** | Dedicated `elvanto_settings` table (encrypted, RLS super_admin) |
| **Settings UI** | New "Integrations" section + 6 tabs via hook system |
| **Data Access** | Service role in Edge Function (bypasses RLS); audit via `sync_conflicts` |
| **Sync Direction** | MVP = Pull only (Elvanto → Supabase) |

---

## Universal Instructions for Every Phase

### 🔄 Context Management
- **Start each phase** by reading: `decision.md` (core decisions), `progress.md` (current status), this file (phase details)
- **Maintain evolving context statement** at phase start — summarizes what's done, what's next, key decisions
- **Use subagents** for complex multi-file tasks (Phase 1 core system, Phase 4 sync engine, Phase 6 UI)
- **Use todo tools** — create phase-specific todo list, mark tasks in-progress/complete as you go

### ✅ Progress Tracking
- **Update `progress.md`** after every task completion:
  - Change status: `⏳ Pending` → `🔄 In Progress` → `✅ Done`
  - Add notes in "Notes / Blockers Log" section
  - Update phase progress bar
- **Commit progress.md** with each phase completion

### 🤖 Subagent Usage
- Spawn subagent for: multi-file creation, complex logic, test writing
- Subagent prompt must include: phase context, decision references, file list, acceptance criteria
- Main agent reviews subagent output, integrates, updates progress

---

## Phase 1: Plugin System Core (Foundation) — 3 Subphases

### 📋 Evolving Context: Phase 1 Start
> **What's done:** Decisions made in `decision.md` (plugin type, hooks, settings integration). No code exists yet.
> **What's next:** Build the plugin loader, hook registry, and settings integration so plugins can register UI.
> **Key decisions:** Runtime plugin system (not compile-time modules); hooks for settingsSections, settingsPages, dashboardWidgets, navItems; "Integrations" section at order 100.

### Subphase 1A: Core Types & Registry (Tasks P1-T1..P1-T4)
**Files:** 4 new files in `src/core/plugins/`
**Todo:** Create phase todo list → mark each task as you complete

| Task | File | Description |
|------|------|-------------|
| P1-T1 | — | Create dirs: `/src/content/plugins/`, `/public/content/plugins/` (gitignored) |
| P1-T2 | `manifest-schema.ts` | `PluginManifest` interface + Zod schema for validation |
| P1-T3 | `HookRegistry.ts` | Registry for sections, pages, widgets, nav + registration functions |
| P1-T4 | `PluginAPI.ts` | Typed plugin API context: `supabase`, `settings`, `router`, `toast`, `t` |

**Subagent recommended for:** P1-T2 + P1-T3 (related types)
**Update progress.md:** After each task → `✅ Done`

### Subphase 1B: Plugin Loader & Integration (Tasks P1-T5..P1-T6)
**Files:** 2 new + 1 barrel
**Todo:** Continue phase todo list

| Task | File | Description |
|------|------|-------------|
| P1-T5 | `PluginLoader.tsx` | Scans `/public/content/plugins/`, loads manifests, validates, registers hooks |
| P1-T6 | `index.ts` | Barrel export for all plugin system APIs |

**Subagent recommended for:** P1-T5 (complex React component with file scanning logic)
**Update progress.md:** After each task

### Subphase 1C: Settings Dashboard Integration (Tasks P1-T7..P1-T9)
**Files:** Modify 2 existing files in `src/core/settings/`
**Todo:** Continue phase todo list

| Task | File | Description |
|------|------|-------------|
| P1-T7 | `settings-schema.ts` | Integrate hook registry — plugin sections/pages merge with core |
| P1-T8 | `SettingsPage.tsx` | Render plugin-registered sections/pages (deep-link support) |
| P1-T9 | `settings-schema.ts` | Register core "Integrations" section (order: 100) |

**Subagent recommended for:** P1-T7 + P1-T8 (tight coupling, modify existing code)
**Update progress.md:** After each task → Phase 1 complete

---

## Phase 2: Elvanto Sync Plugin — Manifest & Settings Shell — 3 Subphases

### 📋 Evolving Context: Phase 2 Start
> **What's done:** Plugin system core complete (loader, hooks, API, settings integration). "Integrations" section exists in Settings.
> **What's next:** Create the Elvanto Sync plugin manifest, entry point, and 6-tab settings shell.
> **Key decisions:** WordPress-style `manifest.json`; 6 tabs (Connection, Field Mappings, Location↔Track, Schedule, History, Dead Letter); 1 dashboard widget.

### Subphase 2A: Plugin Structure & Manifest (Tasks P2-T1..P2-T3)
**Files:** Directory structure + 2 files
**Todo:** Create Phase 2 todo list

| Task | File | Description |
|------|------|-------------|
| P2-T1 | — | Create `/src/content/plugins/elvanto-sync/{settings,widgets,sync,api,db/migrations,utils}` |
| P2-T2 | `manifest.json` | Name, version, hooks, permissions, settings sections/pages, dashboard widget |
| P2-T3 | `index.ts` | Entry point — exports hook registration functions (lazy-load components) |

**Update progress.md:** After each task

### Subphase 2B: Settings Page Container + Connection Tab (Tasks P2-T4..P2-T5)
**Files:** 2 components
**Todo:** Continue Phase 2 todo list

| Task | File | Description |
|------|------|-------------|
| P2-T4 | `ElvantoSyncSettingsPage.tsx` | Tab container (6 tabs) with navigation |
| P2-T5 | `ConnectionTab.tsx` | API key input (password), "Test Connection", "Save" (encrypts) |

**Subagent recommended for:** P2-T4 (container with 6 lazy-loaded tabs)
**Update progress.md:** After each task

### Subphase 2C: Remaining 5 Tabs + Widget (Tasks P2-T6..P2-T11)
**Files:** 5 tab components + 1 widget
**Todo:** Continue Phase 2 todo list

| Task | File | Description |
|------|------|-------------|
| P2-T6 | `FieldMappingTab.tsx` | Two-column table skeleton (loads later in Phase 6) |
| P2-T7 | `LocationTrackTab.tsx` | Location↔track pairing skeleton (loads later in Phase 7) |
| P2-T8 | `ScheduleTab.tsx` | Cron editor, "Sync Now" button, direction toggle (pull_only/bidirectional) |
| P2-T9 | `HistoryTab.tsx` | History table skeleton (loads later in Phase 8) |
| P2-T10 | `DeadLetterTab.tsx` | Dead letter queue skeleton (loads later in Phase 8) |
| P2-T11 | `ElvantoSyncStatusWidget.tsx` | Last sync time, status, item counts, "Sync Now" button |

**Subagent recommended for:** P2-T6..P2-T10 (similar skeleton components, can batch)
**Update progress.md:** After each task → Phase 2 complete

---

## Phase 3: Database Migrations (Plugin-Owned Tables) — 2 Subphases

### 📋 Evolving Context: Phase 3 Start
> **What's done:** Plugin system + plugin manifest + settings shell exist. No database tables yet.
> **What's next:** Create 4 plugin-owned tables with RLS, TypeScript types, run migrations.
> **Key decisions:** Plugins own tables (rule from decision.md); RLS super_admin for settings/config, admin+ for history/dead-letter; 4 tables: settings, config, history, dead_letter.

### Subphase 3A: Migration Files (Tasks P3-T1..P3-T4)
**Files:** 4 SQL files in `db/migrations/`
**Todo:** Create Phase 3 todo list

| Task | File | Description |
|------|------|-------------|
| P3-T1 | `001_create_elvanto_settings.sql` | Encrypted API key, OAuth tokens, environment, RLS super_admin |
| P3-T2 | `002_create_elvanto_sync_config.sql` | Key/value JSONB (unique key), environment, RLS super_admin |
| P3-T3 | `003_create_elvanto_sync_history.sql` | Sync run log: entity, timestamps, status, counts, RLS admin+ |
| P3-T4 | `004_create_elvanto_sync_dead_letter.sql` | Failed items: entity, payload JSONB, error, attempts, RLS admin+ |

**Subagent recommended for:** All 4 (similar structure, can batch)
**Update progress.md:** After each task

### Subphase 3B: Types, Aggregation, Apply (Tasks P3-T5..P3-T7)
**Files:** 1 TS file + aggregation script + command
**Todo:** Continue Phase 3 todo list

| Task | File | Description |
|------|------|-------------|
| P3-T5 | `db/types.ts` | TypeScript types for all 4 tables (Row, Insert, Update) |
| P3-T6 | — | Add 4 migrations to `supabase/migrations/` aggregation script |
| P3-T7 | — | Run `supabase db push` to apply to remote |

**Update progress.md:** After each task → Phase 3 complete

---

## Phase 4: Sync Engine (Edge Function) — 4 Subphases

### 📋 Evolving Context: Phase 4 Start
> **What's done:** Plugin system, plugin manifest, settings shell, database tables exist. No sync logic yet.
> **What's next:** Build the Edge Function sync engine: transforms, mapping engine, entity sync logic, main entry.
> **Key decisions:** 14 pure transform functions; mapping engine evaluates conditions (AND/OR), applies transforms by priority; sync order per `ELVANTO_SYNC_CONTRACT.md` §5; watermarks in `elvanto_sync_config`; dead-letter queue for failures.

### Subphase 4A: Pure Transforms (Task P4-T1)
**Files:** 1 file (`transforms.ts`)
**Todo:** Create Phase 4 todo list

| Task | File | Description |
|------|------|-------------|
| P4-T1 | `transforms.ts` | 14 pure functions: category_to_journey_stage, location_to_journey_tracks, defacto_to_partner, school_grade_to_kindy_year, kindy_year_to_school_grade, admin_to_access_permission, access_permission_to_admin, bool_to_yes_no, yes_no_to_bool, int_flag_to_bool, bool_to_int_flag, capitalize_enum, lowercase_enum, trim_suffix, parse_departments, format_departments |

**Subagent strongly recommended:** 14 functions, pure, unit-testable — perfect for subagent
**Update progress.md:** After task

### Subphase 4B: Watermark & Mapping Engine (Tasks P4-T2..P4-T3)
**Files:** 2 files
**Todo:** Continue Phase 4 todo list

| Task | File | Description |
|------|------|-------------|
| P4-T2 | `watermark.ts` | Load/save `_source_modified` per entity from `elvanto_sync_config` (key: `watermark_<entity>`) |
| P4-T3 | `mapping-engine.ts` | Loads `field_mappings` config, evaluates conditions (AND/OR), applies transforms by priority, handles multi-target (journey tracks) |

**Subagent recommended for:** P4-T3 (complex logic)
**Update progress.md:** After each task

### Subphase 4C: Entity Sync Logic (Tasks P4-T4..P4-T6)
**Files:** 3 files
**Todo:** Continue Phase 4 todo list

| Task | File | Description |
|------|------|-------------|
| P4-T4 | `people-sync.ts` | People sync: full scan diff (people/getAll), search cursor (people/search with date_modified), upsert via service_role |
| P4-T5 | `household-sync.ts` | Household/family sync: derive from family_id changes, address via Primary Contact only |
| P4-T6 | `journey-sync.ts` | Journey grid: Sunday Services (category-derived) + Campus tracks (location-derived) |

**Subagent recommended for:** Each entity sync file (independent, can parallelize)
**Update progress.md:** After each task

### Subphase 4D: Edge Function Entry + Tests (Tasks P4-T7..P4-T8)
**Files:** 1 main entry + test file
**Todo:** Continue Phase 4 todo list

| Task | File | Description |
|------|------|-------------|
| P4-T7 | `edge-function.ts` | Main entry: orchestrates entities in sync order, logs to history, dead-letters failures, returns summary |
| P4-T8 | `transforms.test.ts` | Vitest unit tests for all 14 transforms + mapping engine conditions |

**Subagent recommended for:** P4-T7 (orchestration logic), P4-T8 (tests)
**Update progress.md:** After each task → Phase 4 complete

---

## Phase 5: Elvanto API Client — 1 Subphase

### 📋 Evolving Context: Phase 5 Start
> **What's done:** Sync engine core exists. Need typed API client for Elvanto's 47 endpoints.
> **What's next:** Build client with auth, pagination, rate limiting, error handling; define all endpoints.
> **Key decisions:** Base URL `https://api.elvanto.com/v1/`; API Key as Basic Auth username; POST JSON; envelope parsing; page/page_size pagination (max 1000); ≤2 concurrent, honor 429.

### Subphase 5A: Client + Endpoints (Tasks P5-T1..P5-T2)
**Files:** 2 files
**Todo:** Create Phase 5 todo list

| Task | File | Description |
|------|------|-------------|
| P5-T1 | `client.ts` | Base client: auth, pagination, rate limit, error handling, envelope parsing |
| P5-T2 | `endpoints.ts` | 47 typed endpoints from `ELVANTO_API_REFERENCE.md` with request/response interfaces |

**Subagent recommended for:** P5-T2 (47 endpoints, repetitive but needs accuracy)
**Update progress.md:** After each task → Phase 5 complete

---

## Phase 6: Field Mapping UI (Two-Column Table) — 3 Subphases

### 📋 Evolving Context: Phase 6 Start
> **What's done:** Plugin settings shell exists (FieldMappingTab skeleton). API client provides Elvanto field list. Config table exists for persistence.
> **What's next:** Build the two-column mapping table with condition editor, transform selector, and persistence.
> **Key decisions:** App fields from `peopleFields.md` (organized by profile sections); Elvanto fields from API (standard + custom_<uuid>); 14 transforms; conditions with AND/OR groups; priority ordering.

### Subphase 6A: Row Components (Tasks P6-T1..P6-T3)
**Files:** 3 components in `settings/components/`
**Todo:** Create Phase 6 todo list

| Task | File | Description |
|------|------|-------------|
| P6-T1 | `MappingRow.tsx` | Single row: app field dropdown, Elvanto field dropdown, direction (pull/push/both), priority number |
| P6-T2 | `ConditionEditor.tsx` | Visual condition builder: AND/OR groups, field selectors, operators (equals, in, not_equals, exists) |
| P6-T3 | `TransformSelector.tsx` | Dropdown of 14 transforms with descriptions |

**Subagent recommended for:** All 3 (independent UI components)
**Update progress.md:** After each task

### Subphase 6B: Main Table + Persistence (Tasks P6-T4..P6-T5)
**Files:** 1 main table + wiring in tab
**Todo:** Continue Phase 6 todo list

| Task | File | Description |
|------|------|-------------|
| P6-T4 | `FieldMappingTable.tsx` | Main table: add/remove rows, inline editing, drag-to-reorder (priority), save button |
| P6-T5 | `FieldMappingTab.tsx` | Wire to load/save `field_mappings` key from `elvanto_sync_config` |

**Subagent recommended for:** P6-T4 (complex table with inline editing)
**Update progress.md:** After each task

### Subphase 6C: Default Mappings (Task P6-T6)
**Files:** Configuration in tab or separate file
**Todo:** Continue Phase 6 todo list

| Task | File | Description |
|------|------|-------------|
| P6-T6 | — | Pre-populate defaults: standard fields (identity), People Category→Sunday Services (category_to_journey_stage + status overrides), Locations→Campus (location_to_journey_tracks), custom fields (custom_<uuid>) |

**Update progress.md:** After task → Phase 6 complete

---

## Phase 7: Location ↔ Track Pairing UI — 2 Subphases

### 📋 Evolving Context: Phase 7 Start
> **What's done:** Field mapping UI complete. LocationTrackTab skeleton exists. Journey tracks table exists in DB.
> **What's next:** Build pairing UI to link Elvanto locations to journey tracks with auto-create.
> **Key decisions:** Table: Elvanto Location | Journey Track | Follow Elvanto (checkbox); "Fetch Fresh Locations" calls API; "Auto-Create Missing Tracks" creates journey tracks under "Campus" category; persists to `location_track_pairings` config key.

### Subphase 7A: Pairing Component (Tasks P7-T1..P7-T3)
**Files:** 1 component + wiring
**Todo:** Create Phase 7 todo list

| Task | File | Description |
|------|------|-------------|
| P7-T1 | `LocationTrackPairing.tsx` | Table with 3 columns: Elvanto Location (fetched), Journey Track (dropdown), Follow Elvanto (checkbox) |
| P7-T2 | `LocationTrackTab.tsx` | Add "Fetch Fresh Locations" button → calls Elvanto API via plugin API |
| P7-T3 | `LocationTrackTab.tsx` | Add "Auto-Create Missing Tracks" → creates journey tracks under "Campus" category |

**Subagent recommended for:** P7-T1 (table component)
**Update progress.md:** After each task

### Subphase 7B: Persistence (Task P7-T4)
**Files:** Wiring in tab
**Todo:** Continue Phase 7 todo list

| Task | File | Description |
|------|------|-------------|
| P7-T4 | `LocationTrackTab.tsx` | Wire to load/save `location_track_pairings` key from `elvanto_sync_config` |

**Update progress.md:** After task → Phase 7 complete

---

## Phase 8: Sync History & Dead Letter UI — 2 Subphases

### 📋 Evolving Context: Phase 8 Start
> **What's done:** Sync engine writes to `elvanto_sync_history` and `elvanto_sync_dead_letter`. HistoryTab and DeadLetterTab skeletons exist.
> **What's next:** Build history table with filters/details modal; dead letter table with JSON viewer + retry/resolve.
> **Key decisions:** History: entity, trigger, timestamps, status, counts, "View Details" modal; Dead Letter: entity, JSON payload viewer, error, attempts, "Retry"/"Resolve" buttons.

### Subphase 8A: History UI (Tasks P8-T1..P8-T2)
**Files:** 1 component + wiring
**Todo:** Create Phase 8 todo list

| Task | File | Description |
|------|------|-------------|
| P8-T1 | `SyncHistoryTable.tsx` | Columns: Entity, Trigger, Started, Completed, Status, Processed, Failed, Actions; filters; "View Details" modal |
| P8-T2 | `HistoryTab.tsx` | Wire to query `elvanto_sync_history` with pagination |

**Subagent recommended for:** P8-T1 (table with modal)
**Update progress.md:** After each task

### Subphase 8B: Dead Letter UI (Tasks P8-T3..P8-T4)
**Files:** 1 component + wiring
**Todo:** Continue Phase 8 todo list

| Task | File | Description |
|------|------|-------------|
| P8-T3 | `DeadLetterTable.tsx` | Columns: Entity, Payload (JSON viewer), Error, Attempts, Last Attempt, Actions; "Retry"/"Resolve" buttons |
| P8-T4 | `DeadLetterTab.tsx` | Wire to query `elvanto_sync_dead_letter` with actions |

**Subagent recommended for:** P8-T3 (JSON viewer + actions)
**Update progress.md:** After each task → Phase 8 complete

---

## Phase 9: Credential Management — 1 Subphase

### 📋 Evolving Context: Phase 9 Start
> **What's done:** ConnectionTab UI exists. `elvanto_settings` table exists. Encryption key in Supabase env vars.
> **What's next:** Implement AES-GCM encryption, wire ConnectionTab save/test, test connection via API.
> **Key decisions:** AES-GCM with 32-byte base64 key from `ELVANTO_ENCRYPTION_KEY` env var; encrypt returns base64(iv+ciphertext+authTag); decrypt reverses; "Test Connection" calls `people/getInfo`.

### Subphase 9A: Encryption + Connection (Tasks P9-T1..P9-T3)
**Files:** 1 utility + wiring in tab
**Todo:** Create Phase 9 todo list

| Task | File | Description |
|------|------|-------------|
| P9-T1 | `encryption.ts` | `encrypt(plaintext): string`, `decrypt(ciphertext): string` using AES-GCM |
| P9-T2 | `ConnectionTab.tsx` | Wire "Save" → encrypt API key → store in `elvanto_settings`; "Test Connection" → decrypt → call API |
| P9-T3 | `ConnectionTab.tsx` | "Test Connection" button → calls `people/getInfo` via Elvanto API client |

**Subagent recommended for:** P9-T1 (crypto utility)
**Update progress.md:** After each task → Phase 9 complete

---

## Phase 10: Deployment & Integration — 3 Subphases

### 📋 Evolving Context: Phase 10 Start
> **What's done:** All code complete: plugin system, plugin, sync engine, API client, UI, credentials. Ready to deploy.
> **What's next:** Deploy Edge Function, configure pg_cron, set env vars, run E2E tests, write docs.
> **Key decisions:** Edge Function deployed via Supabase CLI; pg_cron schedule reads `cron_expression` from config; `ELVANTO_ENCRYPTION_KEY` in Supabase dashboard; manual trigger via POST to Edge Function.

### Subphase 10A: Deploy & Configure (Tasks P10-T1..P10-T4)
**Files:** 1 utility + commands
**Todo:** Create Phase 10 todo list

| Task | File | Description |
|------|------|-------------|
| P10-T1 | `cron.ts` | Cron expression parsing/validation (for ScheduleTab) |
| P10-T2 | — | Deploy Edge Function: `supabase functions deploy elvanto-sync-worker --project-ref <ref>` |
| P10-T3 | — | Configure pg_cron: SQL schedule using `cron_expression` from config |
| P10-T4 | — | Set `ELVANTO_ENCRYPTION_KEY` (32-byte base64) in Supabase dashboard |

**Update progress.md:** After each task

### Subphase 10B: Manual Trigger + E2E Tests (Tasks P10-T5..P10-T6)
**Files:** Test files
**Todo:** Continue Phase 10 todo list

| Task | File | Description |
|------|------|-------------|
| P10-T5 | — | Manual trigger API: POST to Edge Function with `{"trigger": "manual", "entity": "people"}` |
| P10-T6 | — | E2E tests (Playwright): settings flow, sync trigger, history view, dead letter retry |

**Subagent recommended for:** P10-T6 (E2E test suite)
**Update progress.md:** After each task

### Subphase 10C: Documentation (Task P10-T7)
**Files:** Markdown docs
**Todo:** Continue Phase 10 todo list

| Task | File | Description |
|------|------|-------------|
| P10-T7 | — | Documentation + runbook: architecture, configuration, troubleshooting, rollback |

**Update progress.md:** After task → Phase 10 complete → **PROJECT COMPLETE**

---

## Quick Reference: Subphase Summary

| Phase | Subphases | Total Tasks | Est. Context Windows |
|-------|-----------|-------------|---------------------|
| 1 | 3 | 9 | 3-4 |
| 2 | 3 | 11 | 4-5 |
| 3 | 2 | 7 | 2-3 |
| 4 | 4 | 8 | 4-5 |
| 5 | 1 | 2 | 1-2 |
| 6 | 3 | 6 | 3-4 |
| 7 | 2 | 4 | 2 |
| 8 | 2 | 4 | 2 |
| 9 | 1 | 3 | 1-2 |
| 10 | 3 | 7 | 3-4 |
| **Total** | **24** | **61** | **25-34** |

---

## Commands Cheat Sheet

```bash
# Phase 1: Create directories
mkdir -p src/content/plugins/elvanto-sync/{settings,widgets,sync,api,db/migrations,utils}
mkdir -p public/content/plugins/elvanto-sync

# Phase 3: Migrations
supabase db push

# Phase 10: Deploy
supabase functions deploy elvanto-sync-worker --project-ref <ref>

# pg_cron (run in Supabase SQL editor)
SELECT cron.schedule('elvanto-sync', '0 2 * * *', $$ ... $$);
```

---

## References (Read When Needed)

| File | When to Read |
|------|--------------|
| `decision.md` | Architecture decisions, plugin system design |
| `ELVANTO_SYNC_CONTRACT.md` | Binding sync rules (watermarks, upserts, deny-lists) |
| `ELVANTO_MIGRATION_PLAN.md` | One-time migration runbook |
| `SYNC_PLUGIN_FIELD_MAPPING_UI.md` | Field mapping UI design (two-column, conditions, transforms) |
| `ELVANTO_API_REFERENCE.md` | Verified 47 endpoints, fields, enums, doc bugs |
| `task_plan.md` | Atomic tasks with dependencies |
| `progress.md` | Current status tracker |
|------|--------------|
| `decision.md` | Architecture decisions, plugin system design |
| `ELVANTO_SYNC_CONTRACT.md` | Binding sync rules (watermarks, upserts, deny-lists) |
| `ELVANTO_MIGRATION_PLAN.md` | One-time migration runbook |
| `SYNC_PLUGIN_FIELD_MAPPING_UI.md` | Field mapping UI design (two-column, conditions, transforms) |
| `ELVANTO_API_REFERENCE.md` | Verified 47 endpoints, fields, enums, doc bugs |
| `task_plan.md` | Atomic tasks with dependencies |
| `progress.md` | Current status tracker |