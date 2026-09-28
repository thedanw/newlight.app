# Elvanto Sync — Single Source of Truth

**What it is.** Pull sync (Elvanto ChMS → Supabase) for people, households, and journey tracks, configured via a 6-tab settings page and executed by the `elvanto-sync-worker` Supabase Edge Function. MVP is pull-only: a `bidirectional` direction option exists in the UI but no push path is implemented. Authored for LLM agents; every statement here was verified against code (see [plan.md](plan.md) for the audit trail).

## Code map — which copy is authoritative

| Area | Path | Role |
|---|---|---|
| **Plugin source — EDIT THIS** | `src\content\plugins\elvanto-sync\` (36 files) | Entry/hooks, 6-tab settings UI, client trigger, utils, types |
| Generated copy | `public\content\plugins\elvanto-sync\` (37 files) | Byte-identical mirror written by `scripts\copy-plugins.mjs` on `dev`/`build`, plus one extra test file. Never edit directly. |
| **Edge function — DEPLOYED** | `supabase\functions\elvanto-sync-worker\` (8 files) | The code that actually runs syncs; authority for sync behaviour |
| Deployed migrations | `supabase\migrations\` (7+ elvanto-touching) | **Authoritative schema** for the four plugin tables |
| Plugin-local DDL | `src\...\db\migrations\`, `src\...\db\types.ts` | Reference only — STALE (missing `encryption_key_encrypted`, service-role grants). Never apply. |
| Stale mirrors | `src\...\sync\edge-function.ts`, `sync\people-sync.ts`, `household-sync.ts`, `journey-sync.ts`, `sync\mapping-engine.ts` | Pre-fix copies, not imported anywhere; the deployed function diverged substantially. Tests-only: `sync\transforms.ts` (via `transforms.test.ts`) |
| Live client helpers (used) | `sync\trigger-sync.ts`, `sync\elvanto-api.ts`, `utils\*` | Trigger/test/proxy + encryption/cron validation/field discovery |

## Source precedence

When sources disagree, the higher source wins: **1** working code (`src\` plugin + `supabase\functions\` + `supabase\migrations\`) → **2** handoff [archive\sync-now-fix-summary.md](archive/sync-now-fix-summary.md) → **3** skills ([supabase](../../../skills/supabase/SKILL.md), [elvanto-api](../../../skills/elvanto/elvanto-api/SKILL.md)) → **4** legacy `archive\` docs.

## Live documents

This README is the entry point; the map below covers every other file in the live set (validated in Phase 7).

| Doc | Purpose |
|---|---|
| [architecture.md](architecture.md) | End-to-end flow, auth model, orchestration, scheduling reality, copy relationships |
| [database.md](database.md) | Four plugin tables, RLS/grant chain, config keys, schema divergences |
| [elvanto-api.md](elvanto-api.md) | Endpoints actually called, client behaviour, proxies; links to skill references for the full API |
| [field-mapping.md](field-mapping.md) | Mapping rule storage/shape/transforms, location pairing, known engine gaps |
| [operations.md](operations.md) | Run syncs, history, dead letters, connection test, troubleshooting, environment facts |

## Skills — do not duplicate

- Supabase conventions (schema, auth, edge functions, migrations): [../../../skills/supabase/SKILL.md](../../../skills/supabase/SKILL.md)
- Elvanto API surface (auth, endpoints, per-entity field references): [../../../skills/elvanto/elvanto-api/SKILL.md](../../../skills/elvanto/elvanto-api/SKILL.md), references at [../../../skills/elvanto/elvanto-api/references/](../../../skills/elvanto/elvanto-api/references/)

## Start here

| Task | Read |
|---|---|
| Understand how sync works | [architecture.md](architecture.md) |
| Change a field mapping or transform | [field-mapping.md](field-mapping.md) |
| Debug a failed run / dead letters | [operations.md](operations.md) |
| Change schema or RLS | [database.md](database.md) |
| Call or verify an Elvanto endpoint | [elvanto-api.md](elvanto-api.md) + skill references |
| History / provenance | `archive\` (legacy docs), [plan.md](plan.md) (audit + decisions) |
