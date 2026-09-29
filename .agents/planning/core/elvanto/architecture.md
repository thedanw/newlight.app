# Architecture — Elvanto Sync

## End-to-end flow (pull)

1. **Configure** — settings page `Settings → Integrations → Elvanto Sync` (registered by `src\content\plugins\elvanto-sync\index.ts` + `manifest.json` hooks; section `integrations`, page `elvanto-sync`, plus a People-settings link and a dashboard widget). Six tabs persist config/credentials through `PluginAPI.createPluginSettingsAPI` (keys prefixed `elvanto-sync_`) into `elvanto_sync_config` / `elvanto_settings`.
2. **Trigger** — `sync\trigger-sync.ts` `triggerElvantoSync()` POSTs to `<supabase-url>/functions/v1/elvanto-sync-worker` (absolute URL; falls back to local CLI `http://127.0.0.1:54321`) with the session JWT (`getSession`) + `apikey` (anon key) headers and body `{trigger: 'manual', …}`. Also invoked by the widget and (intended) Schedule tab. There is **no scheduler** — see Scheduling.
3. **Edge function** (`supabase\functions\elvanto-sync-worker\index.ts`) — global try/catch guarantees CORS on every response; auth gate (below); optional actions `test_connection` / `list_locations` short-circuit; otherwise `runSync`.
4. **Orchestration** — `SYNC_ORDER` lists 15 entities (people_categories, custom_fields, families, people, groups, financial_categories, service_types, locations, services, songs, calendars, calendar_events, people_flows, batches, transactions). **Only `people`, `households`, `journey` are implemented** (dynamic imports); the other 12 return success with 0 items. `request.entity` scopes a run; `fullScan` bypasses the watermark.
5. **Fetch + map** — `people-sync.ts`: `people/getAll` (page_size 500, max 200 pages, opt-in `fields` incl. a hardcoded demographics custom-field UUID), incremental via watermark (`date_modified` filter) unless `fullScan`; each record passes `applyMappings` (config rules: conditions → transforms → dot-path assignment, journey special-cases) then `preparePersonUpsert` (direct-field fallbacks, shadows, `_synced_at`/`_source_modified`); chunked upserts of 200 into `people` on `elvanto_id`. `household-sync.ts` groups `people.family_id` → upsert `households` (no API call). `journey-sync.ts` applies saved location pairings → upsert `journey_tracks` on `elvanto_location_id` (no API call).
6. **Record** — one `elvanto_sync_history` row per entity (`running` → `completed`/`partial`/`failed`); each error also lands in `elvanto_sync_dead_letter`. Watermark saved as latest `date_modified`.
7. **Response** — 200 on full success, **207 Multi-Status** when `totalFailed > 0` (client treats body `success === false` as failure), 401/400/405/500 otherwise — all with CORS.

## Auth model (three layers)

| Layer | Behaviour |
|---|---|
| Supabase gateway | `verify_jwt = true` (all functions, `supabase\config.toml`) — the gateway validates the JWT; requires the `apikey` header alongside `Authorization`. Legacy anon/service_role JWTs are rejected at the gateway (expected). |
| Function role gate | `Basic` Authorization → `service_role`; Bearer JWT → role from gateway headers `x-supabase-user-id/email/role`; else manual `validateJwtToken` fallback (local dev); else legacy payload role detection. `role = anon` → 401 + CORS. **Discovery actions** (`test_connection`, `list_locations`, `discover_fields`) run before the gate — allow any authenticated user. **Sync operations** (`trigger: cron/manual/webhook`) require `super_admin` access_permission in `people` table (checked via `auth_user_id`). |
| Elvanto API | Basic auth with the API key as username, blank password (server-side only — Elvanto sends no CORS headers, so the browser never calls it directly except via the Vite dev proxy). |

**Auth flow for UI actions:**
- Connection tab → `test_connection` action → any authenticated user
- Field Mappings tab → `discover_fields` action → any authenticated user  
- Locations tab → `list_locations` action → any authenticated user
- Schedule tab / Sync Now → `trigger: manual` → requires `people.access_permission = 'super_admin'` (via `auth_user_id`)

Credentials: edge reads singleton `elvanto_settings` row `00000000-0000-0000-0000-000000000001` — `encryption_key_encrypted` decrypts under the master key (`ELVANTO_ENCRYPTION_KEY`, dev fallback string shared with the client), which decrypts `api_key_encrypted` (AES-GCM, 12-byte IV, base64(iv+ciphertext+tag)); both fields blank-checked; fallback legacy env `ELVANTO_API_KEY`. Known gap: the UI's save path only persists `api_key_encrypted` (`setCredentials` takes one argument), so `encryption_key_encrypted` must be seeded out-of-band or the env fallback used — see [operations.md](operations.md) troubleshooting.

## Copy relationships (read before editing)

- `public\content\plugins\elvanto-sync\` = generated mirror of `src\content\plugins\elvanto-sync\` (byte-identical; produced by `scripts\copy-plugins.mjs` on every dev/build; committed to git). **Edit `src\` only.**
- `src\...\sync\edge-function.ts` and the src entity-sync files are **stale pre-fix copies** (no app imports them; the deployed function diverged by ~700 lines). The deployed function under `supabase\functions\elvanto-sync-worker\` is the only sync engine that runs.
- Plugin `db\migrations`/`db\types.ts` drift from deployed schema (see [database.md](database.md)).
- Tests (`sync\transforms.test.ts`) exercise the **src** transforms; the deployed edge `transforms.ts` has since diverged — treat tests as spec for intent, deployed code as truth.

## Scheduling reality

- Schedule tab stores `elvanto-sync_cron_expression` (default `0 2 * * *`) and `elvanto-sync_sync_direction` (`pull_only` default); `utils\cron.ts` validates expressions client-side.
- **Nothing consumes them**: no pg_cron job, no platform schedule, no server-side reader. Automated runs are currently impossible — syncs happen when a signed-in user presses Sync Now (or any other direct POST). Legacy docs claiming pg_cron are stale (audit C3/C4/C6).

## Push / write-back

Not implemented. UI `bidirectional` option, mapping directions `push`/`both`, and the archived contract's write-back rules are design intent only; the edge function contains no push code.
