# Findings — Supabase Database Setup

**Last audit:** 2026-08-25 (plan v2 — optimized for small-context LLM)

## Schema Source
- Canonical schema: `.agents/planning/schema.dbml` (40 tables, 20 enums)
- Elvanto-specific: `.agents/planning/elvanto/schema.dbml` (subset)

## Key Decisions Affecting Schema
- Core #11: RLS on ALL tables via auth.uid()
- Core #13: people always-on; other modules import its API
- Core #14: module_config for toggle (people always-on)
- Core #20: settings hybrid (typed core cols + JSONB per-module)
- Core #23: settings DB-only with environment column (platform_settings)
- Core #25: 5-level roles (public/member_area/team_leaders/admin/super_admin)
- Core #26: soft-delete via deleted_at (tombstones, never SQL DELETE)
- Core #46: module-local migrations → aggregate into supabase/migrations
- People #42: CHECK (journey <> '{}') — non-empty JSONB
- People #46–47: contact-only parents as people rows, auto-reconciled journey
- People #48: audit change_reason includes migration|sync
- Compat §1: dual-key identity (id + elvanto_id) on synced tables
- Compat §3: journey seeding algorithm at migration time
- Compat §5: FK-safe upsert order for sync

---

## Audit: plan.md vs core/plan.md + core/decision.md

### ✅ Covered
| Decision | How covered |
|---|---|
| #11 RLS on all tables | Batch 6 — policies for all 40 tables |
| #13 people always-on | Batch 7 seed: `module_config people=enabled` |
| #14 module_config toggle | Batch 7 seeds |
| #20 settings hybrid (typed + JSONB) | platform_settings in Batch 3a |
| #23 DB-only settings + environment col | platform_settings schema |
| #25 5-level platform roles | Batch 7 seeds user_roles |
| #26 soft-delete (deleted_at) | Schema has deleted_at on households, people, journey_tracks |

### ❌ Remaining Gaps
| Gap | Source | Severity | Status |
|---|---|---|---|
| **#46 module-local migrations** | Core #46: module migrations should be `src/modules/{name}/migrations/` then aggregated. Plan uses bare `supabase migration new`. | **High** | Acknowledged — will matter when modules are added |
| **#32/#33 PWA / offline cache** | Core #32–33: PWA with IndexedDB. | Low | Correctly out of scope |

---

## Audit: plan.md vs people/decision.md

### ✅ Covered
| Decision | How covered |
|---|---|
| #12 Journey grid | Batch 3c: journey_stages, journey_tracks, journey_track_categories |
| #10 Relationship uniqueness | Batch 3b: UNIQUE(person_id, related_person_id, relationship_type) |
| #42 CHECK (journey <> '{}') | Batch 3b: CHECK constraint + verify step |
| #19 Seed default stages | Batch 7 seeds 6 stages |
| #48 audit change_reason | Batch 2: audit_change_reason enum includes 'migration' and 'sync' |
| #18 Soft-delete (deleted_at) | Schema throughout |
| #43 JSONB journey GIN index | Batch 3b: GIN index on journey |

### ❌ Remaining Gaps
| Gap | Source | Severity | Status |
|---|---|---|---|
| **pg_cron for demographic progression** | People #23, #28, #30 | **High** | ✅ Deferred to Batch 10 with note |
| **Kindy prompt cron** | People #30, #32 | Medium | ✅ Deferred to Batch 10 with note |
| **#46–47 contact-only parents** | People #46–47 | Medium | ✅ Deferred to Batch 11 with note |
| **Name search GIN index** | People scope: "name search GIN (first+last+preferred)" | Low | Not in plan — schema has `(lastname, firstname)` B-GIN but no `preferred_name` |

---

## Audit: plan.md vs elvanto/compatibility-design.md

### ✅ Covered (improvements over previous audit)
| Item | How covered |
|---|---|
| Source Documents section | Plan header now lists compatibility-design.md as source #4 |
| Key Schema Patterns | Plan header describes dual-key, partitions, _synced_at, tombstones |
| Households + elvanto_family_id | Batch 3a: "elvanto_family_id integer UNIQUE (compatibility-design §2)" |
| Shadow columns (elvanto_*) | Batch 3b subagent prompt: "all 18+ elvanto_* shadow columns" |
| `_synced_at` / `_source_modified` | Batch 3a, 3b, 4a: explicitly listed on every table |
| MIRROR partition | Batch 3c, 4a, 4b: "MIRROR: id IS Elvanto UUID" |
| calendar_events.calendar_id nullable | Batch 5: "**calendar_id is NULLABLE**" |
| follow_elvanto on journey_tracks | Batch 3c: "follow_elvanto boolean DEFAULT false" |
| Runbook phases P0–P9 | Scope section: "Out: Elvanto sync worker (separate feature)" |
| 40 table total | Batch 5 verify: "Total tables: 40" |

### ❌ Remaining Gaps
| Gap | Source | Severity | Status |
|---|---|---|---|
| **access_permission promote-only rule** | Compat §4: pull only promotes, never demotes | Medium | Sync-specific — belongs in sync worker, not schema setup |
| **Value mapping tables** (Defacto→partner, kindy↔school_grade) | Compat §4 matrix | Low | Sync-specific — belongs in sync worker |
| **auth.users.id → people.id mapping** | Compat §1: migrated rows have id = Elvanto UUID | **Medium** | Plan's RLS uses `auth.uid()` to match `people.id` — this only works if Supabase auth links to people.id. Schema has `auth_user_id` FK but plan doesn't clarify the relationship. |

---

## Table Count Verification
Plan batch breakdown: 5 (3a) + 4 (3b) + 7 (3c) + 6 (4a) + 12 (4b) + 6 (5) = **40 total** ✅
Enum count: 13 app + 8 mirror = **21** ✅

---

## Pending
- [ ] Verify Supabase free tier supports 40 tables within 500MB
- [ ] Confirm pg_cron availability on free tier (people Gap #4)
- [ ] Verify auth.uid() maps correctly to people.id for RLS (compat §1 dual-key)
