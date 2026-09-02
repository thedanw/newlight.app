# Elvanto Sync Plugin — Task Plan (Small Context Optimized)

**Source:** `elvanto-sync-plugin-plan.md` | **Decision Log:** `decision.md`  
**Format:** Atomic tasks with dependencies. One task = one LLM context window.

---

## Task Notation
- `[P#]` = Phase number
- `[T#]` = Task number within phase
- `→` = depends on
- `✓` = done | `○` = pending | `◐` = in-progress

---

## Phase 1: Plugin System Core (Foundation)

| Task | Description | Depends On | Status |
|------|-------------|------------|--------|
| P1-T1 | Create `/src/content/plugins/` dir (gitignored) + `/public/content/plugins/` | — | ○ |
| P1-T2 | Create `src/core/plugins/manifest-schema.ts` — `PluginManifest` interface + Zod schema | — | ○ |
| P1-T3 | Create `src/core/plugins/HookRegistry.ts` — registry for sections, pages, widgets, nav | — | ○ |
| P1-T4 | Create `src/core/plugins/PluginAPI.ts` — typed plugin API context (supabase, settings, router, toast) | — | ○ |
| P1-T5 | Create `src/core/plugins/PluginLoader.tsx` — scans plugins, loads manifests, registers hooks | P1-T2, P1-T3 | ○ |
| P1-T6 | Create `src/core/plugins/index.ts` — barrel export | P1-T2..P1-T5 | ○ |
| P1-T7 | Modify `src/core/settings/settings-schema.ts` — integrate hook registry for plugin sections/pages | P1-T3 | ○ |
| P1-T8 | Modify `src/core/settings/SettingsPage.tsx` — render plugin-registered sections/pages | P1-T7 | ○ |
| P1-T9 | Register core "Integrations" section (order: 100) in `settings-schema.ts` | P1-T7 | ○ |

---

## Phase 2: Elvanto Sync Plugin — Manifest & Settings Shell

| Task | Description | Depends On | Status |
|------|-------------|------------|--------|
| P2-T1 | Create `/src/content/plugins/elvanto-sync/` directory structure | P1-T1 | ○ |
| P2-T2 | Create `manifest.json` with hooks, permissions, settings sections/pages | P1-T2 | ○ |
| P2-T3 | Create `index.ts` — exports hook registration functions (lazy-load components) | P2-T2 | ○ |
| P2-T4 | Create `settings/ElvantoSyncSettingsPage.tsx` — tab container (6 tabs) | P1-T8 | ○ |
| P2-T5 | Create `settings/ConnectionTab.tsx` — API key input, test connection, save | P2-T4 | ○ |
| P2-T6 | Create `settings/FieldMappingTab.tsx` — two-column table skeleton | P2-T4 | ○ |
| P2-T7 | Create `settings/LocationTrackTab.tsx` — location↔track pairing skeleton | P2-T4 | ○ |
| P2-T8 | Create `settings/ScheduleTab.tsx` — cron editor, sync now, direction toggle | P2-T4 | ○ |
| P2-T9 | Create `settings/HistoryTab.tsx` — history table skeleton | P2-T4 | ○ |
| P2-T10 | Create `settings/DeadLetterTab.tsx` — dead letter queue skeleton | P2-T4 | ○ |
| P2-T11 | Create `widgets/ElvantoSyncStatusWidget.tsx` — last sync, status, counts, sync now | P1-T3 | ○ |

---

## Phase 3: Database Migrations (Plugin-Owned Tables)

| Task | Description | Depends On | Status |
|------|-------------|------------|--------|
| P3-T1 | Create `db/migrations/001_create_elvanto_settings.sql` — encrypted API key, RLS super_admin | — | ○ |
| P3-T2 | Create `db/migrations/002_create_elvanto_sync_config.sql` — key/value JSONB, RLS super_admin | — | ○ |
| P3-T3 | Create `db/migrations/003_create_elvanto_sync_history.sql` — sync runs log, RLS admin+ | — | ○ |
| P3-T4 | Create `db/migrations/004_create_elvanto_sync_dead_letter.sql` — failed items queue, RLS admin+ | — | ○ |
| P3-T5 | Create `db/types.ts` — TypeScript types for all 4 tables | P3-T1..P3-T4 | ○ |
| P3-T6 | Add migrations to `supabase/migrations/` aggregation script | P3-T1..P3-T4 | ○ |
| P3-T7 | Run `supabase db push` to apply migrations | P3-T6 | ○ |

---

## Phase 4: Sync Engine — Edge Function Core

| Task | Description | Depends On | Status |
|------|-------------|------------|--------|
| P4-T1 | Create `sync/transforms.ts` — 14 transform functions (pure, unit-testable) | P3-T5 | ○ |
| P4-T2 | Create `sync/watermark.ts` — load/save watermarks from `elvanto_sync_config` | P3-T5 | ○ |
| P4-T3 | Create `sync/mapping-engine.ts` — loads mappings, evaluates conditions, applies transforms | P4-T1, P4-T2 | ○ |
| P4-T4 | Create `sync/people-sync.ts` — people sync logic (full scan, search cursor) | P4-T3 | ○ |
| P4-T5 | Create `sync/household-sync.ts` — household/family sync logic | P4-T3 | ○ |
| P4-T6 | Create `sync/journey-sync.ts` — journey grid sync (Sunday Services + Campus tracks) | P4-T3 | ○ |
| P4-T7 | Create `sync/edge-function.ts` — main entry: orchestrates entities, logs history, dead-letters | P4-T4..P4-T6 | ○ |
| P4-T8 | Unit tests for transforms + mapping engine conditions (Vitest) | P4-T1, P4-T3 | ○ |

---

## Phase 5: Elvanto API Client

| Task | Description | Depends On | Status |
|------|-------------|------------|--------|
| P5-T1 | Create `api/client.ts` — base client (auth, pagination, rate limit, error handling) | P3-T5 | ○ |
| P5-T2 | Create `api/endpoints.ts` — 47 typed endpoints from `ELVANTO_API_REFERENCE.md` | P5-T1 | ○ |

---

## Phase 6: Field Mapping UI (Two-Column Table)

| Task | Description | Depends On | Status |
|------|-------------|------------|--------|
| P6-T1 | Create `settings/components/MappingRow.tsx` — single row: app dropdown, elvanto dropdown, direction, priority | P2-T6 | ○ |
| P6-T2 | Create `settings/components/ConditionEditor.tsx` — visual AND/OR condition builder | P2-T6 | ○ |
| P6-T3 | Create `settings/components/TransformSelector.tsx` — dropdown of 14 transforms | P2-T6 | ○ |
| P6-T3 | Create `settings/components/FieldMappingTable.tsx` — main table with inline editing, add/remove rows | P6-T1..P6-T3 | ○ |
| P6-T4 | Wire `FieldMappingTab.tsx` to load/save from `elvanto_sync_config` (`field_mappings` key) | P6-T4, P3-T7 | ○ |
| P6-T5 | Pre-populate default mappings (standard fields, category→journey, location→tracks) | P6-T4 | ○ |

---

## Phase 7: Location ↔ Track Pairing UI

| Task | Description | Depends On | Status |
|------|-------------|------------|--------|
| P7-T1 | Create `settings/components/LocationTrackPairing.tsx` — table: Elvanto Location | Journey Track | Follow Elvanto | P2-T7 | ○ |
| P7-T2 | Add "Fetch Fresh Locations" → calls Elvanto API via plugin API | P7-T1, P5-T2 | ○ |
| P7-T3 | Add "Auto-Create Missing Tracks" → creates journey tracks under "Campus" category | P7-T1 | ○ |
| P7-T4 | Wire `LocationTrackTab.tsx` to load/save from `elvanto_sync_config` (`location_track_pairings` key) | P7-T1, P3-T7 | ○ |

---

## Phase 8: Sync History & Dead Letter UI

| Task | Description | Depends On | Status |
|------|-------------|------------|--------|
| P8-T1 | Create `settings/components/SyncHistoryTable.tsx` — columns, filters, "View Details" modal | P2-T9 | ○ |
| P8-T2 | Wire `HistoryTab.tsx` to query `elvanto_sync_history` with pagination | P8-T1, P3-T7 | ○ |
| P8-T3 | Create `settings/components/DeadLetterTable.tsx` — JSON payload viewer, retry/resolve buttons | P2-T10 | ○ |
| P8-T4 | Wire `DeadLetterTab.tsx` to query `elvanto_sync_dead_letter` with actions | P8-T3, P3-T7 | ○ |

---

## Phase 9: Credential Management

| Task | Description | Depends On | Status |
|------|-------------|------------|--------|
| P9-T1 | Create `utils/encryption.ts` — AES-GCM encrypt/decrypt with env key | P3-T5 | ○ |
| P9-T2 | Wire `ConnectionTab.tsx` — encrypt API key on save, decrypt for test connection | P9-T1, P2-T5 | ○ |
| P9-T3 | Add "Test Connection" → calls `people/getInfo` via Elvanto API client | P9-T2, P5-T2 | ○ |

---

## Phase 10: Deployment & Integration

| Task | Description | Depends On | Status |
|------|-------------|------------|--------|
| P10-T1 | Create `utils/cron.ts` — cron expression parsing/validation | — | ○ |
| P10-T2 | Deploy Edge Function: `supabase functions deploy elvanto-sync-worker` | P4-T7, P3-T7 | ○ |
| P10-T3 | Configure pg_cron schedule via SQL (uses `cron_expression` from config) | P10-T1, P10-T2 | ○ |
| P10-T4 | Set `ELVANTO_ENCRYPTION_KEY` in Supabase dashboard (32-byte base64) | P9-T1 | ○ |
| P10-T5 | Manual trigger API: POST to Edge Function with `{"trigger": "manual"}` | P10-T2 | ○ |
| P10-T6 | E2E tests: settings flow, sync trigger, history view (Playwright) | P2-T4..P2-T10, P10-T2 | ○ |
| P10-T7 | Documentation + runbook | All | ○ |

---

## Dependency Graph (Critical Path)

```
P1-T1 → P1-T2 → P1-T3 → P1-T5 → P1-T6
                    ↓
              P1-T7 → P1-T8 → P1-T9
                    ↓
              P2-T4 → P2-T5..P2-T11
                    ↓
              P3-T1..P3-T4 → P3-T5 → P3-T6 → P3-T7
                    ↓
              P4-T1 → P4-T2 → P4-T3 → P4-T4..P4-T6 → P4-T7
                    ↓
              P5-T1 → P5-T2
                    ↓
              P6-T1..P6-T3 → P6-T4 → P6-T5
                    ↓
              P7-T1 → P7-T2..P7-T4
                    ↓
              P8-T1 → P8-T2, P8-T3 → P8-T4
                    ↓
              P9-T1 → P9-T2 → P9-T3
                    ↓
              P10-T1..P10-T7
```

---

## Quick Start Commands

```bash
# 1. Create plugin directories
mkdir -p src/content/plugins/elvanto-sync/{settings,widgets,sync,api,db/migrations,utils}
mkdir -p public/content/plugins/elvanto-sync

# 2. Create core plugin system files
touch src/core/plugins/{manifest-schema.ts,HookRegistry.ts,PluginAPI.ts,PluginLoader.tsx,index.ts}

# 3. Create plugin manifest
cat > src/content/plugins/elvanto-sync/manifest.json << 'EOF'
{ "name": "elvanto-sync", "displayName": "Elvanto Sync", "version": "1.0.0", ... }
EOF

# 4. Run migrations after creation
supabase db push

# 5. Deploy edge function
supabase functions deploy elvanto-sync-worker --project-ref <ref>
```