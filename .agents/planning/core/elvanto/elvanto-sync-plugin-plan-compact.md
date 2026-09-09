# Elvanto Sync Plugin — Consolidated

**This phase-by-phase plan has been consolidated into `plugin-architecture/decision.md`** (single source of truth for plugin architecture). The old `progress.md` and `task_plan.md` were consolidated into it and deleted.

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

## Read next
- **`plugin-architecture/decision.md`** — decisions, scope, constraints, decision log
- **`ELVANTO_SYNC_PLUGIN_RUNBOOK.md`** — deployment & ops
- **`ELVANTO_AGENTS.md`** — doc map + hard rules