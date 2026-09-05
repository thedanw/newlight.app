# Elvanto Sync Plugin — Documentation & Runbook

**Version:** 1.0.0  
**Last Updated:** 2026-08-29  
**Status:** Ready for deployment (pending Supabase auth)

---

## Overview

The Elvanto Sync Plugin provides two-way synchronization between Elvanto ChMS (Church Management System) and the New Light Church CRM (Supabase). It implements a runtime plugin system (WordPress-style) with a comprehensive admin UI for configuration.

### Key Features

- **Pull Sync (MVP):** Elvanto → Supabase (people, households, journey grid)
- **Push Sync (Optional):** Supabase → Elvanto (explicit admin action only)
- **Field Mapping:** Visual two-column mapping with conditions & transforms
- **Journey Grid Sync:** People Category → Sunday Services track; Locations → Campus tracks
- **Schedule:** Configurable cron + manual trigger
- **Monitoring:** Sync history, dead letter queue with retry/resolve
- **Security:** Encrypted credentials, RLS policies, service-role sync

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      New Light CRM (Supabase)                   │
├─────────────────────────────────────────────────────────────────┤
│  Plugin System (Runtime)                                        │
│  ├── PluginLoader.tsx          — Scans /public/content/plugins/ │
│  ├── HookRegistry.ts           — Registers settings, widgets    │
│  ├── PluginAPI.ts              — Typed API context for plugins  │
│  └── manifest-schema.ts        — Zod validation                 │
├─────────────────────────────────────────────────────────────────┤
│  Elvanto Sync Plugin (/src/content/plugins/elvanto-sync/)       │
│  ├── manifest.json             — Plugin metadata & hooks        │
│  ├── index.ts                  — Entry point, hook registration │
│  ├── settings/                 — 6-tab admin UI                 │
│  │   ├── ConnectionTab.tsx     — API key, test connection       │
│  │   ├── FieldMappingTab.tsx   — Two-column mapping table       │
│  │   ├── LocationTrackTab.tsx  — Location ↔ Track pairing      │
│  │   ├── ScheduleTab.tsx       — Cron, manual trigger          │
│  │   ├── HistoryTab.tsx        — Sync history table            │
│  │   └── DeadLetterTab.tsx     — Dead letter queue             │
│  ├── widgets/                  — Dashboard widget               │
│  ├── sync/                     — Edge Function sync engine      │
│  │   ├── edge-function.ts      — Main entry (Supabase Edge Fn) │
│  │   ├── transforms.ts         — 14 pure transform functions   │
│  │   ├── mapping-engine.ts     — Condition eval, transforms    │
│  │   ├── people-sync.ts        — People sync logic             │
│  │   ├── household-sync.ts     — Household/family sync         │
│  │   ├── journey-sync.ts       — Journey grid sync             │
│  │   └── watermark.ts          — Incremental sync watermarks   │
│  ├── api/                      — Elvanto API client             │
│  │   ├── client.ts             — Base client (auth, pagination)│
│  │   └── endpoints.ts          — 47 typed endpoints            │
│  ├── db/                       — Database migrations & types    │
│  │   ├── migrations/           — 4 SQL migrations              │
│  │   └── types.ts              — TypeScript types              │
│  └── utils/                    — Encryption, cron utilities    │
├─────────────────────────────────────────────────────────────────┤
│  Supabase Database                                            │
│  ├── elvanto_settings          — Encrypted API key            │
│  ├── elvanto_sync_config       — Field mappings, pairings     │
│  ├── elvanto_sync_history      — Sync run logs                │
│  └── elvanto_sync_dead_letter  — Failed items queue           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Installation & Deployment

### Prerequisites

- Supabase project with:
  - Database (PostgreSQL)
  - Auth (with RLS enabled)
  - Edge Functions
  - pg_cron extension
  - Storage (for brand assets)
- Elvanto account with API key
- Node.js 18+ / pnpm 10+

### 1. Database Migrations

Apply the 4 plugin migrations:

```bash
# Migrations are in supabase/migrations/
# 20260829130000_create_elvanto_settings.sql
# 20260829130001_create_elvanto_sync_config.sql
# 20260829130002_create_elvanto_sync_history.sql
# 20260829130003_create_elvanto_sync_dead_letter.sql

supabase db push --project-ref <your-project-ref>
```

### 2. Environment Variables (Supabase Dashboard)

Set these in Supabase Dashboard → Edge Functions → Environment Variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `ELVANTO_ENCRYPTION_KEY` | 32-byte base64 key for AES-GCM encryption | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-available in Edge Functions | Auto |

Generate encryption key:
```bash
# Run in browser console or Node.js
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
)
const exported = await crypto.subtle.exportKey('raw', key)
const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)))
console.log(base64)  # Copy this to ELVANTO_ENCRYPTION_KEY
```

### 3. Deploy Edge Function

```bash
supabase functions deploy elvanto-sync-worker --project-ref <your-project-ref>
```

### 4. Configure pg_cron

Run in Supabase SQL Editor:

```sql
-- Schedule daily sync at 02:00 UTC (adjust cron_expression in config to change)
SELECT cron.schedule(
  'elvanto-sync',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://<your-project-ref>.supabase.co/functions/v1/elvanto-sync-worker',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <service_role_key>"}'::jsonb,
    body := '{"trigger": "cron"}'::jsonb
  )
  $$
);
```

### 5. Verify Deployment

1. Go to `/settings/integrations/elvanto-sync` in the app
2. **Connection Tab:** Enter Elvanto API key, click "Test Connection"
3. **Schedule Tab:** Verify cron expression, click "Sync Now" for manual test
4. **History Tab:** Check sync run appears with "completed" status

---

## Configuration Guide

### Connection Tab

1. **API Key:** Enter your Elvanto API key (Settings → API in Elvanto)
2. **Test Connection:** Verifies key works by calling `people/getInfo`
3. **Save:** Encrypts and stores in `elvanto_settings` table

### Field Mappings Tab

- **Two-column table:** App Field ↔ Elvanto Field
- **Direction:** Pull (Elvanto→Supabase), Push (Supabase→Elvanto), Both
- **Transforms:** 14 built-in (category_to_journey_stage, defacto_to_partner, etc.)
- **Conditions:** AND/OR groups for conditional mapping
- **Priority:** Higher = applied first (for overrides)
- **Persistence:** Saved to `elvanto_sync_config` (`field_mappings` key)

**Default Mappings Included:**
- Standard fields (identity transform)
- People Category → Sunday Services journey track
- Locations → Campus tracks
- Marital status Defacto ↔ Partner
- School grade ↔ kindy_start_year
- Admin 0/1 ↔ access_permission 5-level

### Location ↔ Track Pairing Tab

1. **Fetch Fresh Locations:** Calls Elvanto API to get current locations
2. **Pair:** Select Elvanto location → Journey track
3. **Follow Elvanto:** Checkbox to auto-update stage on location changes
4. **Auto-Create Missing Tracks:** Creates journey tracks under "Campus" category
5. **Save:** Persists to `elvanto_sync_config` (`location_track_pairings` key)

**Pre-seeded (from migration):**
- Central Campus (8a631195-8914-4136-858c-f160885ab60d) → Central Campus track
- North Campus (9f3aec97-3d61-471d-ab50-5f28070d970d) → North Campus track

### Schedule Tab

- **Cron Expression:** Standard 5-field cron (minute hour day month weekday)
- **Sync Direction:** Pull Only (MVP) / Bidirectional (requires review)
- **Sync Now:** Manual trigger button
- **Common Presets:** Daily 02:00, Weekly, Monthly, etc.

### History Tab

- Paginated table with filters (entity, status, date range)
- Columns: Entity, Trigger, Started, Completed, Duration, Status, Processed, Failed
- "View Details" modal with error summary

### Dead Letter Tab

- Failed items after all retries
- JSON payload viewer with syntax highlighting
- **Retry:** Re-queues for next sync
- **Resolve:** Marks as handled

---

## Sync Logic Details

### Sync Order (FK-Safe)

From `ELVANTO_SYNC_CONTRACT.md` §5:

```
1. people_categories          8. service_types, locations
2. custom_fields (+values)    9. services → times → plans/volunteers/files/notes
3. families                   10. songs → categories → memberships → arrangements → keys
4. people                     11. calendars → events → event_locations
5. groups → group_members     12. people_flows → steps → step_members
6. financial_categories       13. batches → transactions → transaction_amounts
7. (parallel: 5-13 after 4)
```

### People Sync

- **Full Scan:** `people/getAll` (no date filter) — page_size=1000
- **Incremental:** `people/search` with `date_modified` >= watermark
- **Upsert:** `ON CONFLICT (elvanto_id) DO UPDATE`
- **Watermark:** Latest `date_modified` saved to `elvanto_sync_config`

### Household Sync

- Derived from `people.family_id` (Elvanto integer)
- One household per distinct `family_id`
- Address from Primary Contact only (L-2 limitation)
- `elvanto_family_id` stored on household

### Journey Grid Sync

**Sunday Services Track (Category-Derived):**
| Elvanto Category | Journey Stage |
|------------------|---------------|
| Sunday Guest     | guest         |
| Sunday Linked    | linked        |
| Sunday Regular   | regular       |
| Community Connection* | contact   |

**Status Overrides (Priority):**
1. `contact=1` OR `suspended=1` → `archived`
2. `archived=1` OR `deceased=1` → `deleted_privacy_data`
3. Else → category mapping

**Campus Tracks (Location-Derived):**
- Each Elvanto location → journey track via `elvanto_location_id`
- Stage: `contact` (or overridden by status)
- Optional `follow_elvanto` toggle for auto-updates

### Error Handling

**Retry Matrix:**
- 250/400/404: No retry (fix request)
- 401: Fatal (credentials)
- 429/5xx: Exponential backoff ×3 → dead letter queue

**Dead Letter Queue:**
- Failed items after 3 retries
- Stored in `elvanto_sync_dead_letter`
- Manual retry/resolve via UI

---

## Troubleshooting

### Common Issues

| Issue | Cause | Resolution |
|-------|-------|------------|
| "ELVANTO_ENCRYPTION_KEY not set" | Missing env var | Set in Supabase Dashboard |
| "Invalid API key (401)" | Wrong key | Check Elvanto Settings → API |
| "Connection test fails" | Network/firewall | Check Supabase egress |
| "Sync stuck at running" | Previous run didn't complete | Check dead letter queue |
| "No journey tracks found" | Migration not run | Run `supabase db push` |
| "Field mappings not saving" | RLS policy | Check super_admin role |

### Debug Commands

```bash
# Check Edge Function logs
supabase functions logs elvanto-sync-worker --project-ref <ref>

# Check pg_cron jobs
SELECT * FROM cron.job;

# View sync history
SELECT * FROM elvanto_sync_history ORDER BY started_at DESC LIMIT 10;

# View dead letters
SELECT * FROM elvanto_sync_dead_letter WHERE resolved_at IS NULL;

# Check watermarks
SELECT * FROM elvanto_sync_config WHERE key LIKE 'watermark_%';
```

### Manual Sync Trigger

```bash
curl -X POST https://<ref>.supabase.co/functions/v1/elvanto-sync-worker \
  -H "Authorization: Bearer <service_role_key>" \
  -H "Content-Type: application/json" \
  -d '{"trigger": "manual", "entity": "people"}'
```

---

## Security Considerations

- **API Key:** Encrypted with AES-GCM before storage
- **RLS Policies:** Super admin only for settings/config; Admin+ for history
- **Sync Writes:** Service role (bypasses RLS) with audit trail
- **Push Sync:** Disabled by default; explicit admin action required
- **PII:** Never logged in sync history; only counts and summaries

---

## Rollback Procedure

1. **Disable Cron:** `SELECT cron.unschedule('elvanto-sync');`
2. **Revert Migrations:** `supabase db reset` (careful - destroys data)
3. **Remove Edge Function:** `supabase functions delete elvanto-sync-worker`
4. **Remove Plugin Files:** Delete `/src/content/plugins/elvanto-sync/`

---

## Future Enhancements

- [ ] Elvanto webhook support (when available)
- [ ] Bidirectional push with conflict resolution UI
- [ ] Multi-environment config (dev/staging/prod)
- [ ] Plugin marketplace / auto-update
- [ ] Advanced mapping: groups, services, songs
- [ ] Real-time sync status via Supabase Realtime

---

## Support

- **Decision Log:** `.agents/planning/core/plugins/decision.md`
- **Sync Contract:** `.agents/planning/core/elvanto/ELVANTO_SYNC_CONTRACT.md`
- **Migration Plan:** `.agents/planning/core/elvanto/ELVANTO_MIGRATION_PLAN.md`
- **Field Mapping UI:** `.agents/planning/core/elvanto/SYNC_PLUGIN_FIELD_MAPPING_UI.md`
- **API Reference:** `.agents/planning/core/elvanto/ELVANTO_API_REFERENCE.md`

---

*Generated as part of Phase 10 deployment preparation. Update this document as the plugin evolves.*