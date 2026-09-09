# Decision: Plugin Architecture — Elvanto Sync as First Plugin

**Status:** Decided 2026-08-29; consolidated 2026-09-08 · Sole source of truth for plugin arch (`progress.md`/`task_plan.md` folded in + removed).

**Glossary:** Plugin = optional integration ext (≠ module=tool) · Runtime plugin loads from `/public/content/plugins/` · Twin pipeline = deployed Edge Function + bundled plugin sync copy · RLS = row level security · Watermark = per-entity last-synced `date_modified` · Dead letter = failed-post-retry queue · Journey grid = journeys×universal stages (`people.journey` JSONB).

**References:** `core/elvanto/{ELVANTO_SYNC_CONTRACT, ELVANTO_API_REFERENCE, ELVANTO_MIGRATION_PLAN, SYNC_PLUGIN_FIELD_MAPPING_UI, ELVANTO_SYNC_PLUGIN_RUNBOOK}.md`, `schema.dbml`, `core/decision.md`.

**Purpose:** Optional WP-style runtime plugins; Elvanto Sync = first. Two-way Elvanto↔Supabase sync, surfaced in Super Admin only when enabled. Audience: church staff configuring sync; LLM agents implementing plugins.

## Scope
- **Plugin core** `src/core/plugins/`: `manifest-schema.ts` (Zod), `HookRegistry.ts`, `PluginAPI.tsx`, `PluginLoader.tsx`, `pluginManager.ts`, `discovery.ts`, `index.ts`
- **Elvanto plugin** `src/content/plugins/elvanto-sync/`: `manifest.json`, `index.ts`, `settings/` (6 tabs + `components/`), `widgets/`, `sync/`, `api/`, `db/`, `utils/`
- **Owned tables:** `elvanto_settings`, `elvanto_sync_config`, `elvanto_sync_history`, `elvanto_sync_dead_letter`

## Constraints
- **Twin pipeline:** sync logic duplicated — deployed `supabase/functions/elvanto-sync-worker/*` AND plugin twin `src/content/plugins/elvanto-sync/sync/*`. Edit BOTH or they silently diverge.
- **Credentials:** key encrypted in `elvanto_settings.api_key_encrypted` (singleton `00000000-…-0001`), NOT `ELVANTO_API_KEY` env. Envelope = `base64(iv(12)+aes-gcm-ciphertext+authTag)`; key prio `ELVANTO_ENCRYPTION_KEY` (32-byte b64) else dev-default.
- **Partial success:** edge fn returns HTTP 207 `success:false` on any entity failure → gate `!response.ok || body.success === false`.
- **Watermark upsert:** `elvanto_sync_config.key` UNIQUE-not-PK → upsert MUST pass `{ onConflict: 'key' }`.
- **Schema traps:** `people.id` uuid PK, no default → payload MUST carry `id`; `people.journey` jsonb NOT NULL + CHECK `<> '{}'` → always emit non-empty journey.
- **Enum sanitizers:** mapped enums wrapped (`capitalize_enum` → `Male`/`Female`; `gender` enum lowercase).
- **RLS:** authed rw settings/config; authed ro history/dead-letter; service_role bypasses RLS for sync writes.
- **No SQL DELETE:** missing upstream ⇒ `deleted_at` tombstone + audit entry.
- **`people.journey` JSONB** = single status source — never a separate status column.
- **Reorder hygiene:** plugins consume the core `Reorder` compound + `useOrderedCollection` — never import `framer-motion` directly (keeps the abstraction boundary; animations centralized in `src/core/ui/reorder.tsx`).

## Deferred / Non-Goals
- Plugin sandbox, update mechanism, dependencies, API versioning (open)
- Elvanto webhooks (unavailable upstream; poll `date_modified`)
- Multi-tenant / multi-church config
- Bidirectional push (explicit admin action only; feature-flagged)
- Multi-environment (single prod account; dev uses mock data)

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)

1 **Plugin system core**
    1.1 Runtime plugin system (WP-style) → hot-add/update plugins without touching system files
        1.1.a Dev `/src/content/plugins/` → prod `/public/content/plugins/` (both gitignored) → survives repo updates
        1.1.b `manifest.json` (not TS) → runtime-loadable, Zod-validated at load
        1.1.c Hooks (`settingsSections`, `settingsPages`, `dashboardWidgets`, `navItems`, `settingsLinks`) → UI extensible without core changes
        1.1.d Limited typed Plugin API (`supabase`, `settings`, `router`, `toast`, `i18n`)
        1.1.e **Reorder API** (`api.reorder.register`) → plugins declare ordered collections for `useOrderedCollection` + core `Reorder` compound component (framer-motion `Reorder.Group`/`Item`/`Handle`). Registered collections flow through `HookRegistry.pluginOrderedCollections` and are available via `getOrderedCollections()`. Declarative path: `manifest.json` → `orderedCollections[]` → auto-registered at load. Imperative path: `api.reorder.register({ id, definition, label })` in a `useEffect`. `OrderedCollectionDefinition`: `{ collectionId: string; table: string; orderColumn?: string (default 'sort_order'); scope: Record<string, unknown>; primaryKey?: string (default 'id') }`. Plugin components use `useOrderedCollection({ definition, initialItems, persist? })` to wire `Reorder.Root/Item/Handle` with optimistic reorder + rollback. Persist function receives `string[]` of new IDs; returns `Promise<boolean>`. Plugins own their tables (e.g. `elvanto_sync_config`) — no shared ordering tables.
    1.2 User-data roots `/public/content/` + `/src/content/` (gitignored) → isolated from `src/modules/*`
    1.3 Settings hook: "Integrations" section (order 100) → surfaces in Super Admin only when enabled
    1.4 Dedicated plugin-owned tables → avoid modifying existing tables
2 **Sync runtime**
    2.1 Supabase Edge Function + pg_cron → native, free tier, same region as DB
    2.2 Pull-first (MVP: Elvanto → Supabase) → Elvanto source of truth; write-back explicit admin action only
    2.3 Data owner = service_role in Edge Function → bypasses RLS; app-level audit trail
    2.4 Config in `elvanto_sync_config` (JSONB key/value) → dedicated, not `module_config`/`platform_settings`
    2.5 Credentials in `elvanto_settings` (encrypted, RLS-authed) → AES-GCM envelope
    2.6 Cron + manual trigger + history + dead letter → admin visibility & recovery
3 **Sync engine**
    3.1 Transforms (14 pure) + mapping-engine + watermark + entity syncs → unit-testable, config-driven
    3.2 Incremental via `date_modified` watermark → stored in `elvanto_sync_config`
    3.3 Retry matrix → 429/5xx backoff ×3 → dead letter; 401 fatal; 250/400/404 no retry
    3.4 Twin pipeline (edge fn + plugin twin) → must stay in lockstep (edit BOTH)
4 **Elvanto API client**
    4.1 Typed client (`client.ts` auth/pagination/rate-limit + `endpoints.ts` 47) → single typed access layer
5 **Field mapping UI**
    5.1 Two-column table with conditions & transforms → visual config, persisted to `field_mappings` key
    5.2 Location ↔ track pairing: auto-create missing tracks under "Campus" → persisted to `location_track_pairings` key
6 **Deployment**
    6.1 pg_cron schedule via SQL + `ELVANTO_ENCRYPTION_KEY` env + manual trigger API → native scheduling, no extra infra