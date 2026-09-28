# Database — Elvanto Sync Schema

**Authority:** `supabase\migrations\` (deployed). Plugin-local `src\...\db\migrations\` and `archive\schema.dbml` are secondary — divergences below. Table names are `public.*`.

## The four plugin tables

| Table | Columns (type · default) | Purpose |
|---|---|---|
| `elvanto_settings` | `id uuid PK` (singleton `00000000-0000-0000-0000-000000000001`) · `api_key_encrypted text NOT NULL` · `encryption_key_encrypted text NOT NULL DEFAULT ''` · `oauth_tokens_encrypted text` · `environment text NOT NULL DEFAULT 'production'` · `updated_at timestamptz NOT NULL` · `updated_by uuid → auth.users` | Encrypted Elvanto API key (edge + UI both address the singleton row) |
| `elvanto_sync_config` | `id uuid PK` · `key text NOT NULL UNIQUE` · `value jsonb NOT NULL` · `environment text NOT NULL DEFAULT 'production'` · `updated_at` · `updated_by` | All plugin config: mappings, pairings, cron, direction, field catalog, watermarks |
| `elvanto_sync_history` | `entity text` · `trigger text` (`cron`/`manual`/`webhook`) · `started_at timestamptz` · `completed_at` · `status text` (`running`/`completed`/`partial`/`failed`) · `items_processed int` · `items_failed int` · `error_summary text` (first 5 errors) · `triggered_by_user uuid` | One row per entity per run |
| `elvanto_sync_dead_letter` | `entity text` · `payload jsonb` · `error text` · `attempt_count int DEFAULT 0` · `last_attempt_at` · `created_at` · `resolved_at` · `resolved_by uuid` | Failed sync errors; edge inserts with `attempt_count 1` |

Indexes: settings(env) · config(key), (env) · history(entity, started_at DESC), (status) · dead_letter(entity), partial `(resolved_at) WHERE resolved_at IS NULL`.

## Migration chain (what each did to these tables)

| Migration | Effect |
|---|---|
| `20260829130000`–`130003` | Create the four tables; super-admin manage policies; authenticated grants on settings/config; admin-read history/dead-letter; service_role grants; **settings create includes `encryption_key_encrypted`** |
| `20260829150000_fix_plugin_rls` | Added **anon** read/write policies + grants on all four (later reversed) |
| `20260908100000_fix_elvanto_plugin_authenticated_rls` | Authenticated r/w policies on settings/config; authenticated read on history/dead-letter (fixes `42501` for logged-in app) |
| `20260919100000_revoke_anon_writes_settings_plugins` | Revoke anon writes on settings/config/dead-letter |
| `20260919110100_super_admin_settings_rls` | Creates `public.is_super_admin()` (security definer); **final policy state**: `elvanto_settings` → super-admin manage only, all anon revoked; `elvanto_sync_config` → `Authenticated read sync config` (select, any authenticated) + `Super admin manage sync config` (FOR ALL); history/dead-letter anon reads dropped; drops the earlier permissive authenticated write policies; hygiene drops of drifted policy names; revokes TRUNCATE |
| `20260920120100_fix_elvanto_super_admin_write_grants` | Grants `DELETE` on dead_letter, `UPDATE/DELETE` on sync_config to authenticated (RLS still gates writes to super-admin/admin) |
| `20260927124952_add_encryption_key_to_elvanto_settings` | `ADD COLUMN IF NOT EXISTS encryption_key_encrypted text NOT NULL DEFAULT ''` + backfill + `SET NOT NULL` (handoff fix: column missing remotely) |

**Net effect today:** reads of `elvanto_sync_config` for any signed-in user; config/settings writes effectively super-admin (via `is_super_admin()`); dead-letter manage for admin+super_admin (`Admins manage dead letter queue` FOR ALL from create) with authenticated read + delete grant (retry deletes rows); edge function uses service_role (bypasses RLS, needs the grants).

## Divergences to know

- **Plugin-local DDL** (`src\...\db\migrations\001-004`, mirrored in `db\types.ts`): missing `encryption_key_encrypted`; missing service_role grants; embeds authenticated policies inline (pre-`super_admin`-lock shape). Reference only — never apply.
- **`archive\schema.dbml`** models the whole app (42-table target incl. app-owned/mirror partitions, dual-key `id` + `elvanto_id`). Useful for app-model context; the **plugin tables' authoritative source is the migrations above**. Its `elvanto_*` table definitions were never reconciled to the four-table reality.
- Sync writes to core tables (outside this folder's schema): `people` (upsert on `elvanto_id`, PK `id` = Elvanto UUID), `households` (upsert on `elvanto_family_id`), `journey_tracks` (upsert on `elvanto_location_id`) — those tables are governed by the people/journey migrations, not this set. `people.journey` carries a DB CHECK requiring a non-empty object (edge falls back to `DEFAULT_JOURNEY`).
- No `sync_conflicts` / `sync_errors` tables exist (legacy contract/runbook references are unsupported — audit verdict).

## Config keys (`elvanto_sync_config`)

| Key | Writer | Reader |
|---|---|---|
| `elvanto-sync_field_mappings` | UI `FieldMappingTable` (via `setConfig('field_mappings')` + `${pluginName}_` prefix) | edge `people-sync.loadFieldMappings` |
| `elvanto-sync_location_track_pairings` | UI `LocationTrackPairing` | edge `people-sync` + `journey-sync` |
| `elvanto-sync_cron_expression`, `elvanto-sync_sync_direction` | UI Schedule tab | **none (stored only)** |
| `elvanto-sync_elvanto_field_catalog` | UI Field Mappings (discovery) | UI (dropdown options) |
| `watermark_<entity>` (unprefixed) | edge `watermark.saveWatermark` (service-role, `updated_by: null`, `onConflict: 'key'`) | edge `getDateFilterForEntity` |
