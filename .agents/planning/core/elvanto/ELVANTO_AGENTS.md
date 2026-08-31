# Elvanto Integration — Agent Guide

Entry point for LLM agents working on the Elvanto ↔ Supabase sync. Read this first, then only the doc your task needs.

## Doc Map

| File | Contents | Read when… |
|---|---|---|
| `ELVANTO_API_REFERENCE.md` | **Verified API reference:** 47 endpoints, request/response fields, enums, doc bugs, deprecation notes | Consuming an Elvanto endpoint; checking a field's API shape; verifying live behavior |
| `schema.dbml` | Unified logical model: 30+ tables in 3 partitions (app-owned / `elvanto_*` sync-shadows / Elvanto mirrors), dual-key ids (`id` + `elvanto_id`), enums, indexes | Creating/migrating Supabase tables; checking where a field lives |
| `../schema.dbml` | **Canonical app schema** — superset of elvanto `schema.dbml` + auth ref + sync infra (sync_errors, sync_watermarks, sync_conflicts) | Building the full Supabase DB; migration authoring |
| `ELVANTO_SYNC_CONTRACT.md` | **Binding sync contract:** watermarks, deletes, upsert order, type maps, write-back rules, field ownership matrix, limitations | Writing/modifying sync code; checking push/pull eligibility |
| `ELVANTO_MIGRATION_PLAN.md` | **One-time migration plan:** dual-key IDs, households⇄families, journey seeding, field ownership matrix, runbook, limitations L-1..L-8 | Building the DB or migration; implementing sync transforms for initial import |
| `SYNC_PLUGIN_FIELD_MAPPING_UI.md` | **Sync plugin UI design:** two-column field mapping table, conditional logic, transform functions, journey track pairing UI, validation rules | Building the admin mapping configuration UI; implementing sync worker mapping engine |
| `../database-setup/plan.md` | **Supabase DB setup plan** — 9 batches: CLI init → schema (44 tables + 3 sync infra) → RLS → seeds → TypeScript types → push | Starting database provisioning; creating migrations |
| `scripts/elvanto-schema-probe.mjs` | Read-only live schema probe (`node scripts/elvanto-schema-probe.mjs`, `--report-only` reuses cache) | Re-verifying schema after Elvanto changes; output in `scripts/elvanto-probe/` (gitignored, PII) |

## Hard Rules (all agents)

1. `ELVANTO_SYNC_CONTRACT.md` is normative — if code contradicts it, fix the code or update the doc first.
2. Schema changes: edit `schema.dbml` → generate migration → never edit migrations ad hoc.
3. Dual-key identity: app `id` + nullable unique `elvanto_id` (sync joins `elvanto_id` only; migrated rows share both values; pure mirror tables' id IS the Elvanto UUID). Households map Elvanto's int family ids via `households.elvanto_family_id`.
4. Reserved-word API fields renamed in DB: `where`→`where_label`, `when`→`when_label`, `number`(songs)→`ccli_number`.
5. Booleans normalize to Postgres `boolean`; money to `numeric(12,2)`; all datetimes UTC `timestamptz`.
6. Known upstream doc bugs (don't "fix" these client-side assumptions away): groups/remove returns key `person`; transactions/edit person param req-vs-opt contradiction.
7. `people.journey` JSONB is the single status source — never write a separate status column; Elvanto login/archive flags live in `elvanto_*` shadow columns only.
8. Sync never issues SQL DELETE — missing upstream ⇒ `deleted_at` tombstone + people_audit entry. Partitions and field ownership: `ELVANTO_SYNC_CONTRACT.md` §0/§4.

## Task Recipes

- **"Add table X"** → check schema.dbml naming/types → write supabase migration → update sync order §5 if new entity.
- **"Sync entity X"** → `ELVANTO_API_REFERENCE.md` endpoint section + `ELVANTO_SYNC_CONTRACT.md` §2–§5.
- **"Write back field Y"** → verify Y in create/edit params (`ELVANTO_API_REFERENCE.md`) AND not in deny-list (`ELVANTO_SYNC_CONTRACT.md` §7).
- **"Debug missing record"** → sync_errors table → `ELVANTO_SYNC_CONTRACT.md` §8 retry matrix → watermark state for that entity.
- **"Migrate data"** → `ELVANTO_MIGRATION_PLAN.md` runbook (§5) + identity rules (§1) + household/journey logic (§2–§3).
- **"Configure field mappings"** → `SYNC_PLUGIN_FIELD_MAPPING_UI.md` — mapping table, conditions, transforms, journey track pairing.
- **"Implement sync worker mapping engine"** → `SYNC_PLUGIN_FIELD_MAPPING_UI.md` §8 (integration pseudocode) + `ELVANTO_SYNC_CONTRACT.md` §4.1–§4.3.