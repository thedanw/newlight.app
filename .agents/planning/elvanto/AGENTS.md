# Elvanto Integration — Agent Guide
Entry point for LLM agents working on the Elvanto ↔ Supabase sync. Read this first, then only the doc your task needs.

## Doc Map
| File | Contents | Read when… |
|---|---|---|
| `findings.md` | Raw API research: 47 endpoints, request/response fields, enums, doc bugs | Consuming an Elvanto endpoint; checking a field's API shape |
| `schema.dbml` | Logical DB model: 24 tables, columns, types, FKs, enums, indexes | Creating/migrating Supabase tables; checking where a field lives |
| `sync-design.md` | Binding sync contract: watermarks, deletes, upsert order, type maps, write-back rules | Writing/modifying sync code |
| `scripts/elvanto-schema-probe.mjs` | Read-only live schema probe (`node scripts/elvanto-schema-probe.mjs`, `--report-only` reuses cache) | Re-verifying schema after Elvanto changes; output in `scripts/elvanto-probe/` (gitignored, PII) |

## Hard Rules (all agents)
1. `sync-design.md` is normative — if code contradicts it, fix the code or update the doc first.
2. Schema changes: edit `schema.dbml` → generate migration → never edit migrations ad hoc.
3. Elvanto IDs are stored verbatim as PKs (exception: `families.id` = int). Never invent surrogate IDs for synced rows.
4. Reserved-word API fields renamed in DB: `where`→`where_label`, `when`→`when_label`, `number`(songs)→`ccli_number`.
5. Booleans normalize to Postgres `boolean`; money to `numeric(12,2)`; all datetimes UTC `timestamptz`.
6. Known upstream doc bugs (don't "fix" these client-side assumptions away): groups/remove returns key `person`; transactions/edit person param req-vs-opt contradiction.

## Task Recipes
- **"Add table X"** → check schema.dbml naming/types → write supabase migration → update sync order §5 if new entity.
- **"Sync entity X"** → findings.md endpoint section + sync-design.md §2–§5.
- **"Write back field Y"** → verify Y in create/edit params (findings.md) AND not in deny-list (§7).
- **"Debug missing record"** → sync_errors table → §8 retry matrix → watermark state for that entity.
