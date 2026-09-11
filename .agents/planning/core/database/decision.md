# Decision: Database Architecture (Supabase / PostgreSQL)

**Status:** Consolidated 2026-09-11 · **Single source of truth** for DB architecture. Implementation plan/progress/findings archived in `plan-archive/` (historical). Canonical schema stays in `../../schema.dbml`.

## Aliases
- SSOT = this doc for decisions; `schema.dbml` for schema; migrations for ground truth — conflicts: decisions govern
- Partition = ownership class: APP-OWNED · SYNC-SHADOW (`elvanto_*` columns, sync-written, never in UI) · MIRROR (Elvanto governs)
- Tombstone = soft-delete via `deleted_at` (sync never SQL-DELETEs)
- RLS = Row Level Security (DB-layer authority; app UI gating is UX only)
- Watermark = per-entity last-synced cursor (`_source_modified` column / `elvanto_sync_config` key)

## Sources (priority order)
1. `core/decision.md` — platform architecture, auth, settings, roles
2. `people/decision.md` — people model, journey grid, child-safety, saved lists, forms
3. `people/peopleFields.md` — field-level SSOT
4. `core/elvanto/ELVANTO_SYNC_CONTRACT.md` + `core/elvanto/archive/{sync-design,compatibility-design}.md` — partitions, dual-key, write-back
5. `plugin-architecture/decision.md` — plugin tables, credentials, watermark
6. `core/settings/decision.md` — platform_settings, brand-assets bucket
7. `core/login/decision.md` — auth join key, RLS posture
8. `schema.dbml` — canonical schema (42 tables; lags migrations)
9. `plan-archive/*` — implemented plan, progress, findings (archived 2026-09-11)

## What & Why
Supabase (Postgres + Auth + Realtime + Storage + Edge Fns) on free tier is the single backend. Schema = versioned `supabase/migrations/*.sql` (**49 tables, 22 enums** — superset of schema.dbml), security = RLS, Elvanto identity = dual-key, settings/roles/toggles = dedicated tables.

> **Cross-doc pointer:** This is the single source of truth for database architecture. Decisions referenced from `people/`, `core/login/`, `core/settings/`, and `plugin-architecture/` live here; those docs link to numbered § anchors below.

## Constraints
- Supabase free tier: 500MB DB, 2GB bandwidth, 50MB storage
- RLS on all tables (Australian child-safety data); `service_role` bypass for Edge Fn writes only
- Soft-delete tombstones; hard delete only for error entries
- Elvanto sync: dual-key identity, no SQL DELETE, write-back explicit-action-only
- Church-scale data (people ~1k–50k)

## Implementation status (audited 2026-09-11 vs migrations)
| Area | Status |
|---|---|
| Migrations `20260825221018` → `20260908200000` (33 files) | ✅ applied; prod hot-fixed idempotently |
| Tables 49 (superset of dbml 42) · Enums 22 | ✅ |
| RLS enabled | ⚠️ partial — people/households/settings/tags/plugin/saved_lists only; mirror + service/song/calendar/forms tables still open RLS |
| RLS MVP posture (anon = `access_permission='public'`; authenticated = all non-deleted) | ✅ people only |
| Seeds (6 journey_stages, 5 user_roles, module_config) | ❌ not in migrations (plan Batch 7 not started) |
| Grants (authenticated rw, anon select/service_role) | ✅ idempotent fix migrations |
| `brand-assets` bucket (public read, authed+anon write) | ✅ |
| `search_people` RPC + `people_public` view + pg_trgm GIN indexes | ✅ |
| Elvanto sync tables + edge-fn worker (`supabase/functions/elvanto-sync-worker`) | ✅ tables + fn skeleton |
## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)

### A Platform & storage
A.1 Supabase backend: Postgres + Auth + Realtime + Storage + Edge Fn on free tier → serverless DB, RLS at DB layer, no self-hosted ops
    A.1.1 Direct DB access + shared generated TS types (`src/core/lib/database.types.ts`) → no API layer; monorepo simplicity
    A.1.2 No ORM; Supabase CLI + versioned migrations → reproducible local→hosted
A.2 RLS on ALL tables via auth.uid() → DB-layer security; UI gating is UX only
    A.2.1 MVP posture: anon = `access_permission='public'` rows only; authenticated = all non-deleted → public browsing + invite-only writes
    A.2.2 `people_public` view: `lastname_initial` (first char) only for anon → full last name never public (ppl 4.8)
    A.2.3 `search_people()` RPC NOT `security_definer` → inherits caller RLS selection scope (ppl 4.10)
    A.2.4 `service_role` bypasses RLS but still needs explicit GRANTs → sync writes w/ app audit trail
    A.2.5 Grants: authenticated rw + anon select per table; idempotent `drop policy if exists` pattern → prod-safe rerun
A.3 Soft-delete tombstones `deleted_at` on people/households/journey_tracks; sync never SQL-DELETEs; hard delete only for error entries → legal/child-safety + FK integrity
A.4 Settings in DB, hybrid: typed core columns + per-module JSONB → type safety + flexibility
    A.4.1 `platform_settings` (id, key, environment, value jsonb, UNIQUE key+environment) → DB-only settings, no env-var drift
    A.4.2 Single `app-settings` key, nested JSON → atomic writes + simple Realtime payload
    A.4.3 Env vars only for CI/staging secrets + non-settings config → dev parity without DB
A.5 `module_config` (module pk, enabled, config jsonb) → runtime toggle; disable-only (data kept)
A.6 `brand-assets` Storage bucket: public read; super_admin write (lab: anon + authenticated) → pre-auth logo/favicon
A.7 PG enums for fixed domains (22) → integrity; admin-customizable lists = table rows, not enums
### B People & identity
B.1 Household-centric model: `households` (elvanto_family_id int unique) + `addresses`; `contact_channels` designed but not migrated → family CRM; `people.mobile` is the implemented phone field
B.2 `people.auth_user_id uuid unique` → auth.users join key; no row → fallback user_metadata/email (login #2)
B.3 Roles: `people.access_permission` 5-level enum (public→super_admin); `user_roles` = seed reference table → consistent role model
B.4 Journey grid: `people.journey` JSONB `{track_id → stage_id}`; CHECK (`journey <> '{}'`); GIN index → one stage/track by construction, no PK
    B.4.1 `journey_stages`: `id uuid PK` + unique editable `slug` (20260908200000) → slug edits never orphan `people.journey` values (now stage UUIDs)
    B.4.2 Invariants: ≥1 track at create; unchecking last track forces `archived`; track delete needs migration target
B.5 Child-safety (WWCC/SMT/SMC), consents, medical columns on `people` → AUS legal compliance
B.6 `people_audit` (field_changed, old/new jsonb, change_reason enum incl. `migration`|`sync`) → full audit; manual vs auto filterable
B.7 `saved_lists` (owner_id, conditions jsonb, is_shared; owner-only rw RLS) → cross-module segment filtering
B.8 Forms: `forms`/`form_fields`/`form_submissions` + `form_submit_action`/`form_field_type` enums; public URL submit → admin-created collection
B.9 Search: pg_trgm `search_people` RPC (`field_strength`, `person_matches_query`, `person_match_scores`) + 3 GIN trgm indexes → typo-tolerant omni search; app falls back to ILIKE pre-migration

### C Elvanto sync & partitions
C.1 Three partitions → single owner per column: APP-OWNED (decisions govern) · SYNC-SHADOW (`elvanto_*`, sync-written, never in UI) · MIRROR (Elvanto governs: groups, services, songs, calendar, flows)
C.2 Dual-key identity: `id uuid pk` + `elvanto_id uuid unique null`; sync joins `elvanto_id` ONLY; migrated rows `id = elvanto_id`; app-origin adopt on first push; pure mirror tables `id` IS Elvanto uuid
C.3 Every synced table carries `_synced_at`; watermarked tables add `_source_modified` → per-record watermark
C.4 Sync never SQL-DELETEs → `deleted_at` tombstone + audit; missing-from-scan = tombstone; 5y archived → GDPR scrub exits sync scope
C.5 FK-safe upsert order (sync-design §5); upsert = `ON CONFLICT (elvanto_id) DO UPDATE`; never delete+insert
C.6 App-owned sync infra: `sync_errors` (retry 429/5xx ×3 → dead-letter; 401 fatal; 250/400/404 no retry), `sync_watermarks` (entity pk, full/poll ts), `sync_conflicts` (pending/app_wins/elvanto_wins/merged) → observability + admin recovery
C.7 Plugin-owned `elvanto_*` tables (settings, sync_config, sync_history, sync_dead_letter):
    C.7.1 Credentials: `elvanto_settings.api_key_encrypted`, AES-GCM envelope (base64 iv(12)+cipher+authTag), key `ELVANTO_ENCRYPTION_KEY` else dev-default; singleton id `00000000-…-0001` → never env var
    C.7.2 Config: `elvanto_sync_config` (key UNIQUE-not-PK, value jsonb) → upsert MUST `onConflict:'key'`; `date_modified` watermark stored here
    C.7.3 History (`trigger` cron|manual|webhook; status running/completed/partial/failed) + dead-letter admin-readable, service_role-writable
C.8 `calendar_events.calendar_id` NULLABLE → Elvanto "services" pseudo-calendar (199 events, 0 calendar rows)
C.9 `plugins` (id text pk, enabled) → plugin enable/disable state (lab + authenticated rw)
### D Lifecycle & migration strategy
D.1 Versioned aggregate migrations in `supabase/migrations/`; module-local migrations + aggregation script (core #46) planned, not yet used
D.2 Idempotent hot-fix migrations (`drop policy if exists`, `IF NOT EXISTS`) → production-safe re-runs (20260906xx–0700 prod GRANT/RLS repairs)
D.3 Seeds deferred (Batch 7 not started): 6 journey_stages (deterministic UUIDs pinned for contact/guest/linked/regular/archived/deleted_privacy_data), 5 user_roles, module_config people=enabled
D.4 Canonical `schema.dbml` — edit schema then generate migration; never edit migrations ad hoc. DBML currently lags (42 vs 49: missing saved_lists, forms×3, elvanto×4, plugins)

### E Deferred / future implementation (kept — not removed)
E.1 pg_cron demographic progression (Jan 1: child→youth at Yr5→6; youth→adult post-Yr12) + Kindy prompt (Nov/Dec) → paid tier; fallback Edge Fn + GH Actions cron
E.2 Contact-only parent auto-reconcile trigger (ppl #46–47: no child links + no own journey → auto-archive) → needs app logic layer
E.3 GDPR full data-erasure workflow (`deleted_privacy_data` → hard delete, RLS interplay)
E.4 Read-cache sync/invalidation (refresh offline cache on reconnect)
E.5 JSONB migration strategy (journey/custom_fields evolution)
E.6 Full per-role RLS visibility matrix (post-MVP; login gap #1)
E.7 Admin invite UI (create auth user + link auth_user_id)
E.8 Phone OTP + `before_user_created` hook + people.mobile → auth phone sync
E.9 OAuth Google/Entra + MFA (TOTP/WebAuthn opt-in later)
E.10 Multi-tenancy future-proofing
E.11 `contact_channels` table CRUD (designed; `people.mobile` implemented)

## Findings (divergence plan → implementation)
- Prod DB set up manually → original GRANTs never executed (reads returned 403); repaired by idempotent GRANT/RLS migrations (20260906000001→20260907000001)
- `search_people` broke on multi-token queries: `string_to_array` returns an array, not rows → `t.token` was the whole array; fixed with `unnest` (20260908140000)
- `journey_stages` PK moved slug→uuid; `people.journey` values are now stage UUIDs (peopleFields.md still documents slugs)
- Plan claimed 40 tables; actual = 49 (saved_lists, forms×3, elvanto×4, plugins added post-plan); enums 21→22
- RLS-for-all (plan Batch 6) and seeds (plan Batch 7) remain open implementation gaps
- brand-assets + plugin tables carry anon write policies (lab, no auth) — tighten with super_admin gating when role matrix lands

## Decision Gap Log
1. Full RLS coverage on mirror/service/song/calendar/forms tables → open (feeds E.6)
2. Seed migration for journey_stages/user_roles/module_config → open
3. contact_channels migration → open
4. Brand-assets write policy tightening → open (lab anon-write)
5. Deterministic UUIDs for custom journey_stages (only 6 seeded slugs pinned) → open