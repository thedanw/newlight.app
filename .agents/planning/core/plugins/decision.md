# Decision: Plugin Architecture — Elvanto Sync as First Plugin

**Date:** 2026-08-29  
**Status:** Decided via interactive brainstorm

---

## Core Decisions

### 1. Plugin Type: Runtime Plugin System (WordPress-style)
- **Decision:** Elvanto Sync is a **runtime plugin**, not a compile-time module
- **Location:** `/src/content/plugins/elvanto-sync/` (dev) → compiles to `/public/content/plugins/elvanto-sync/`
- **Rationale:** User data separation; plugins can be added/updated without touching system files; survives repo updates/migrations
- **Implication:** Need a plugin loader, manifest system, and sandboxing — distinct from `src/modules/*` architecture

### 2. User Data Separation
- **Decision:** Root folder at `/public/content/` (production) / `/src/content/` (dev)
- **Structure:**
  ```
  /public/content/
  ├── plugins/
  │   └── elvanto-sync/
  │       ├── manifest.json
  │       ├── config.json (gitignored)
  │       └── assets/
  └── uploads/
      └── (user uploads)
  ```
- **Gitignore:** `/public/content/` and `/src/content/` are gitignored
- **Rationale:** Clear differentiation between system files (src/) and user files (content/); survives updates/migrations

### 3. Sync Runtime: Supabase pg_cron + Edge Function
- **Decision:** Sync worker runs as Supabase Edge Function triggered by pg_cron
- **Rationale:** Native to Supabase; free tier eligible; same region as DB; no extra infrastructure
- **Schedule:** Configurable cron expression (default: daily 02:00 UTC)
- **Manual trigger:** HTTP endpoint callable from admin UI

### 4. Configuration Storage: Dedicated Table
- **Decision:** `elvanto_sync_config` table (not `module_config` or `platform_settings`)
- **Rule:** **Plugins must create dedicated tables and avoid modifying existing tables**
- **Columns:** `id`, `key`, `value` (JSONB), `environment`, `updated_at`, `updated_by`
- **RLS:** Super admin only read/write

### 5. Credentials: Dedicated Table with RLS
- **Decision:** `elvanto_settings` table with RLS for super admins only
- **Columns:** `id`, `api_key_encrypted`, `oauth_tokens_encrypted`, `environment`, `updated_at`, `updated_by`
- **Encryption:** Application-level encryption before insert (Supabase Vault alternative if needed)
- **RLS:** `auth.uid()` must have `access_permission = 'super_admin'`

### 6. Sync Scheduling & Monitoring
- **Features:** Cron expression editor + "Sync Now" button + sync history table + retry failed items UI + dead-letter queue visibility
- **History table:** `elvanto_sync_history` (id, entity, started_at, completed_at, status, items_processed, items_failed, error_summary)
- **Dead-letter queue:** `elvanto_sync_dead_letter` (id, entity, payload, error, attempt_count, created_at)

### 7. Multi-Environment: Not for MVP
- **Decision:** Single Elvanto account (prod); dev uses mock data / cautious live testing
- **Caution:** Prioritize Elvanto → Supabase sync; Supabase → Elvanto write-back requires explicit admin action and careful review
- **Future:** Separate Elvanto accounts per environment when needed

### 8. Module Manifest: WordPress-style Plugin Manifest
- **Decision:** `manifest.json` in plugin folder (not TypeScript manifest like modules)
- **Fields:**
  ```json
  {
    "name": "elvanto-sync",
    "displayName": "Elvanto Sync",
    "version": "1.0.0",
    "description": "Two-way sync with Elvanto ChMS",
    "author": "New Light",
    "entryPoint": "index.js",
    "settings": {
      "sections": [
        { "id": "elvanto-sync", "title": "Elvanto Sync", "page": "ElvantoSyncSettingsPage" }
      ]
    },
    "permissions": ["people.read", "people.write", "households.write", "journey_tracks.write"],
    "hooks": {
      "settingsSections": "registerElvantoSyncSettings",
      "dashboardWidgets": "registerElvantoSyncWidget"
    }
  }
  ```
- **Hooks system:** Plugins can register settings sections, pages, dashboard widgets, nav items via declared hooks

### 9. Settings Integration: New 'Integrations' Section + Hooks
- **Decision:** New top-level "Integrations" section in Settings dashboard
- **Hooks available for plugins:**
  - `settingsSections` — register new settings sections
  - `settingsPages` — register pages within any section (including core sections)
  - `dashboardWidgets` — register dashboard widgets
  - `navItems` — register top-level navigation items
- **Elvanto Sync registers:** Section `integrations` with page `elvanto-sync` at `/settings/integrations/elvanto-sync`

### 10. Data Ownership: Service Role in Edge Function
- **Decision:** Sync Edge Function runs with `service_role` key (bypasses RLS)
- **Audit:** All writes logged to `sync_conflicts` table (entity, id, local_change, remote_change, resolved_as)
- **RLS:** Not applied to sync writes; application-level audit trail instead
- **People module:** Unaware of sync writes; sync is a privileged system operation

### 11. Sync Direction Priority
- **Decision:** MVP = **Elvanto → Supabase only** (pull)
- **Write-back (Supabase → Elvanto):** Explicit admin action only; behind feature flag; careful review required
- **Rationale:** Risk of corrupting Elvanto data; church data is source of truth in Elvanto

---

## Plugin System Architecture (New)

### Plugin Loader (Core Responsibility)
- Scans `/public/content/plugins/` at app startup
- Loads `manifest.json` from each plugin
- Validates permissions against user role
- Registers hooks (settings, dashboard, nav)
- Provides plugin API: `supabase`, `settings`, `router`, `toast`, `t`

### Plugin Sandbox
- Plugins receive limited API surface (no direct DOM, no raw fetch)
- All DB access via provided `supabase` client (RLS enforced by user context)
- Settings read/write via provided `settings` API (validates against plugin's declared permissions)
- UI components must use core/ui barrel (same as modules)

### Plugin Manifest Schema
```typescript
interface PluginManifest {
  name: string;                    // kebab-case, unique
  displayName: string;
  version: string;                 // semver
  description: string;
  author: string;
  entryPoint: string;              // relative to plugin folder
  settings?: {
    sections?: PluginSettingsSection[];
    pages?: PluginSettingsPage[];
  };
  dashboardWidgets?: PluginDashboardWidget[];
  navItems?: PluginNavItem[];
  hooks?: Record<string, string>;  // hookName -> exported function name
  permissions: PluginPermission[]; // declared permissions for RLS/API access
}

type PluginPermission = 
  | 'people.read' | 'people.write'
  | 'households.read' | 'households.write'
  | 'journey_tracks.read' | 'journey_tracks.write'
  | 'tags.read' | 'tags.write'
  | 'forms.read' | 'forms.write'
  | 'platform_settings.read' | 'platform_settings.write'
  | 'elvanto_settings.read' | 'elvanto_settings.write'
  | 'elvanto_sync_config.read' | 'elvanto_sync_config.write'
  | 'elvanto_sync_history.read'
  | 'elvanto_sync_dead_letter.read' | 'elvanto_sync_dead_letter.write';
```

### Hook System
```typescript
// Core provides:
interface PluginHooks {
  settingsSections: (register: (section: SettingsSection) => void) => void;
  settingsPages: (register: (page: SettingsPage) => void) => void;
  dashboardWidgets: (register: (widget: DashboardWidget) => void) => void;
  navItems: (register: (item: NavItem) => void) => void;
}

// Plugin exports:
export function registerElvantoSyncSettings(register: (section: SettingsSection) => void) {
  register({ id: 'integrations', title: 'Integrations', description: 'Third-party integrations', component: IntegrationsSection, order: 100 });
  register({ id: 'elvanto-sync', sectionId: 'integrations', title: 'Elvanto Sync', component: ElvantoSyncSettingsPage, order: 0 });
}

export function registerElvantoSyncWidget(register: (widget: DashboardWidget) => void) {
  register({ id: 'elvanto-sync-status', title: 'Elvanto Sync Status', component: ElvantoSyncStatusWidget, size: 'medium' });
}
```

---

## Elvanto Sync Plugin Structure

```
/src/content/plugins/elvanto-sync/
├── manifest.json
├── index.ts                    // Entry point, exports hooks
├── settings/
│   ├── ElvantoSyncSettingsPage.tsx
│   ├── FieldMappingTable.tsx
│   ├── LocationTrackPairing.tsx
│   ├── SyncHistoryTable.tsx
│   └── DeadLetterQueue.tsx
├── widgets/
│   └── ElvantoSyncStatusWidget.tsx
├── sync/
│   ├── edge-function.ts        // Supabase Edge Function (deployed separately)
│   ├── mapping-engine.ts       // Applies field mappings from config
│   ├── transforms.ts           // Transform functions (category_to_journey_stage, etc.)
│   ├── people-sync.ts          // People sync logic
│   ├── household-sync.ts       // Household/family sync logic
│   └── journey-sync.ts         // Journey grid sync logic
├── db/
│   ├── migrations/
│   │   ├── 001_create_elvanto_settings.sql
│   │   ├── 002_create_elvanto_sync_config.sql
│   │   ├── 003_create_elvanto_sync_history.sql
│   │   └── 004_create_elvanto_sync_dead_letter.sql
│   └── types.ts                // TypeScript types for plugin tables
├── api/
│   ├── client.ts               // Elvanto API client
│   └── endpoints.ts            // Endpoint definitions
└── utils/
    ├── encryption.ts           // Credential encryption/decryption
    └── cron.ts                 // Cron expression parsing/validation
```

---

## Database Migrations (Plugin-Owned)

### 001_create_elvanto_settings.sql
```sql
CREATE TABLE elvanto_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_encrypted text NOT NULL,
  oauth_tokens_encrypted text,
  environment text NOT NULL DEFAULT 'production',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE elvanto_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage Elvanto settings" ON elvanto_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM people 
      WHERE auth_user_id = auth.uid() 
      AND access_permission = 'super_admin'
    )
  );
```

### 002_create_elvanto_sync_config.sql
```sql
CREATE TABLE elvanto_sync_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  environment text NOT NULL DEFAULT 'production',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE elvanto_sync_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage sync config" ON elvanto_sync_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM people 
      WHERE auth_user_id = auth.uid() 
      AND access_permission = 'super_admin'
    )
  );
-- Default config keys:
-- 'field_mappings' -> JSONB array of MappingRule
-- 'location_track_pairings' -> JSONB array of {elvanto_location_id, journey_track_id, follow_elvanto}
-- 'cron_expression' -> string (e.g., "0 2 * * *")
-- 'sync_direction' -> 'pull_only' | 'bidirectional'
```

### 003_create_elvanto_sync_history.sql
```sql
CREATE TABLE elvanto_sync_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL,           -- 'people', 'groups', 'households', etc.
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL,           -- 'running', 'completed', 'failed', 'partial'
  items_processed int NOT NULL DEFAULT 0,
  items_failed int NOT NULL DEFAULT 0,
  error_summary text,
  triggered_by text NOT NULL,     -- 'cron', 'manual', 'webhook'
  triggered_by_user uuid REFERENCES auth.users(id)
);
CREATE INDEX idx_elvanto_sync_history_entity_started ON elvanto_sync_history(entity, started_at DESC);
ALTER TABLE elvanto_sync_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read sync history" ON elvanto_sync_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM people 
      WHERE auth_user_id = auth.uid() 
      AND access_permission IN ('admin', 'super_admin')
    )
  );
```

### 004_create_elvanto_sync_dead_letter.sql
```sql
CREATE TABLE elvanto_sync_dead_letter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL,
  payload jsonb NOT NULL,
  error text NOT NULL,
  attempt_count int NOT NULL DEFAULT 0,
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id)
);
CREATE INDEX idx_elvanto_sync_dead_letter_entity ON elvanto_sync_dead_letter(entity);
ALTER TABLE elvanto_sync_dead_letter ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage dead letter queue" ON elvanto_sync_dead_letter
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM people 
      WHERE auth_user_id = auth.uid() 
      AND access_permission IN ('admin', 'super_admin')
    )
  );
```

---

## Edge Function: `elvanto-sync-worker`

**Deploy:** `supabase functions deploy elvanto-sync-worker --project-ref <ref>`

**Trigger:** pg_cron `SELECT cron.schedule('elvanto-sync', '0 2 * * *', $$ SELECT net.http_post(url := 'https://<ref>.supabase.co/functions/v1/elvanto-sync-worker', headers := '{"Content-Type": "application/json", "Authorization": "Bearer <service_role_key>"}'::jsonb, body := '{"trigger": "cron"}'::jsonb) $$);`

**Manual trigger:** POST to Edge Function URL with `{"trigger": "manual", "entity": "people"}` (optional entity filter)

**Logic:**
1. Load config from `elvanto_sync_config` (field mappings, location pairings, cron)
2. Load credentials from `elvanto_settings` (decrypt API key)
3. For each entity in sync order (ELVANTO_SYNC_CONTRACT.md §5):
   - Fetch watermark from `elvanto_sync_config` (`_source_modified` per entity)
   - Call Elvanto API with pagination + date filter where supported
   - Apply mapping engine (transforms, conditions, priority)
   - Upsert to Supabase using service_role client
   - Update watermark
   - Log to `elvanto_sync_history`
   - Failed items → `elvanto_sync_dead_letter`
4. Return summary

---

## Settings UI Pages

### `/settings/integrations/elvanto-sync` (ElvantoSyncSettingsPage)
Tabs:
1. **Connection** — API key input (encrypted save), connection test, OAuth setup (future)
2. **Field Mappings** — Two-column table (SYNC_PLUGIN_FIELD_MAPPING_UI.md) with condition/transform editors
3. **Location ↔ Track Pairing** — Pair Elvanto locations to journey tracks (SYNC_PLUGIN_FIELD_MAPPING_UI.md §5.3)
4. **Schedule** — Cron expression editor, "Sync Now" button, sync direction toggle (pull_only/bidirectional)
5. **History** — Sync history table with status, counts, error summary, "View Details"
6. **Dead Letter Queue** — Failed items with retry button, "Resolve" action

---

## Integration with Existing Sync Contracts

- **ELVANTO_SYNC_CONTRACT.md** — Binding sync rules (watermarks, upserts, type maps, deny-lists) — **unchanged**
- **ELVANTO_MIGRATION_PLAN.md** — One-time migration runbook — **unchanged**
- **SYNC_PLUGIN_FIELD_MAPPING_UI.md** — Field mapping UI design — **implemented in plugin settings**
- **ELVANTO_API_REFERENCE.md** — Verified API reference — **used by plugin's api/endpoints.ts**

---

## Open Questions (Deferred)

1. **Plugin sandbox enforcement** — How strict? TypeScript-only? Runtime proxy?
2. **Plugin update mechanism** — Git-based? Admin UI upload? Supabase Storage?
3. **Plugin dependencies** — Can plugins depend on other plugins?
4. **Plugin API versioning** — How to handle breaking changes in core plugin API?
5. **Elvanto webhook support** — Edge Function endpoint for future webhooks
6. **Multi-tenant (multi-church)** — Plugin config per church (future)

---

## Implementation Priority

| Phase | Deliverable |
|-------|-------------|
| 1 | Plugin system core: loader, manifest schema, hooks API, sandbox |
| 2 | Elvanto Sync plugin: manifest, settings pages (Connection, Schedule, History) |
| 3 | Field Mapping UI (two-column table, conditions, transforms) |
| 4 | Location ↔ Track Pairing UI |
| 5 | Sync Edge Function (pg_cron + manual trigger) |
| 6 | Mapping engine + transforms (category→journey, location→tracks) |
| 7 | People/Household/Journey sync logic |
| 8 | Dead letter queue + retry UI |
| 9 | Dashboard widget (sync status) |
| 10 | Documentation + testing |