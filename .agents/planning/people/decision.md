# Decision: People Module — Data Model & Journey Grid

## Aliases
- Journey grid = journey tracks (rows) × universal stages (columns); one stage per journey track per person; categories/subcategories = structural headings only (never journey rows)
- Stage = journey_stage_slug — values & colors in peopleFields.md journey grid
- WWCC = Working With Children Check; SMT = Safe Ministry Training; SMC = Safe Ministry Check
- RLS = Row Level Security
- kindy_start_year = calendar year the person started Kindy (replaces mutable school_year enum)
- Calculated school year = CURRENT_YEAR − kindy_start_year (Kindy=0, Year 1=1, … Year 12=12)
- Demographic progression = auto-update of demographic column on Jan 1 each year via pg_cron
- Kindy prompt = Nov/Dec cron notification asking admin to confirm kindy start for age 3–5 children
- Field mapping source = `peopleFields.md` (field names, enums, and journey-grid migration mapping)

## Reference documents
- `peopleFields.md` — **single source of truth** for people field-level data (field names, enums, conditional visibility, journey-grid mapping). This decision log is authoritative for model/behaviour decisions; field-level detail lives in peopleFields.md. Keep them in sync; on conflict, decision.md governs.

## What & Why
Baseline always-on people module: CRM of people, households, relationships, tags, roles. Journey grid replaces flat people_category + locations[] to track engagement per journey track.

## Who
Church admins/staff managing people; household members self-viewing; groups/services/calendar modules consuming people data.

## Scope
- Core people tables: households, addresses, people (with `journey` JSONB map), people_relationships, tags, people_tags, user_roles, journey_tracks, journey_track_categories, journey_stages, people_audit
- People field groups: personal, demographics, contact (adult-only), medical, consents, child-safety (WWCC/SMT/SMC), admin-only (access_permissions, legacy_*, date_professed), metadata
- Conditional field visibility by demographic (adult/youth/child) — per-field rules annotated in peopleFields.md
- Field mapping (journey grid, kindy_start_year, contact channels, consents) defined in `peopleFields.md`; this doc is authoritative for the target model
- Contact channels first-class with `phone_type` (home/mobile/…) — replaces separate Phone/Mobile columns
- `school_email_permission` single source of truth — Demographics/Consents duplicate removed
- `safe_ministry_start_date` stored as DATE — free-text ("Text area") dropped
- PG enums (values defined in peopleFields.md): demographic, marital_status, gender, phone_type, consent_status, school_email_permission, safe_ministry_leader_type, wwcc_verification_outcome, wwcc_exemption_type, smt_type, smc_result, access_permission, journey_stage_slug
- Seeded stages: contact, guest, linked, regular + terminal archived, deleted_privacy_data (colors in peopleFields.md journey grid)
- people_audit: field_changed = journey_track | demographic | gdpr_deletion; change_reason = manual | auto_progression | gdpr_request | migration | sync (#48)
- RLS posture: household sees own people + journeys; admins see/manage all; users update own profile; journey tracks/stages readable by authenticated; people_audit admin-only
- Indexes: name search GIN (first+last+preferred), household, demographic, auth_user, parent/guardian relationships, journey JSONB GIN (track→stage containment), audit
- Module API: getById(s), getByHousehold, getGuardians, getByDemographic, getByJourneyTrack, getWithValidWWCC, getWithSafeMinistry, getJourneyGrid, search
- Tags categories: location, journey_track, demographic, status, custom
- Relationships: unique (person_id, related_person_id, relationship_type); is_primary guardian flag; contact-only parents = person rows (reconciled journey, #46–47)

## Constraints
- Australian Anglican child-safety compliance (WWCC, SMT, SMC)
- Conditional field visibility by demographic (adult/youth/child)
- One journey stage per journey track per person (JSONB object key = track; uniqueness by construction)
- Never zero journey tracks: unchecking the last track forces it to archived (#45); deleting a track requires a migration target (#44)
- Stable IDs, RLS, API for other modules
- Demographic progression rules: Year 5→6 triggers child→youth; post-Year 12 triggers youth→adult
- school_year enum column replaced by kindy_start_year integer (migration required)
- pg_cron fires Jan 1 00:00 AEDT (Dec 31 13:00 UTC); kindy prompt cron fires Nov/Dec
- All auto-progression changes recorded in people_audit with change_reason = 'auto_progression'
- Children aged 5+ with no kindy_start_year flagged as admin warning (separate from kindy prompt)

## Non-Goals
- No separate people.status column — journey grid is the status
- No per-track terminal stages — universal "archived"
- Audit only journey + GDPR changes (people_audit)
- No admin confirmation required before demographic changes are applied (auto-apply)
- No preschool year tracking — only kindy_start_year is stored
- No rollback UI for demographic progression (manual correction via person edit; audit trail exists)

## Assumptions
- Journey tracks are admin-customizable (seeded defaults)
- people_category + locations[] replaced by the journey grid (migration mapping in peopleFields.md)
- user_roles values align to base 5-level platform roles (access_permission values in peopleFields.md; decision #37)
- Australian school year: Kindy = year before Year 1; Year 1 = kindy_start_year + 1
- Demographic is auto-promoted without confirmation; admin reviews via notification after the fact
- pg_cron available on Supabase tier; if free tier, fallback = Edge Function triggered by GitHub Actions schedule (open)
- Admin notification = in-app banner/badge + email summary for both demographic changes and kindy prompts
- Age 3–5 children without kindy_start_year receive a separate kindy prompt notification (Nov/Dec), not a warning

## Decision Log: decision → Rationale
1 Keep people module always-on → foundation for all modules
2 Model household-centric (people in households) → family-centric CRM
3 Treat contact channels first-class → communication priority
4 Use JSONB custom_fields → church-specific extensibility
5 Use PostgreSQL enums for fixed domains → data integrity
6 Gate fields by demographic → relevant data per person
7 Add WWCC/SMT/SMC child-safety fields → legal compliance
8 Restrict admin fields (access_permissions, legacy_*, date_professed) → privacy
9 Enforce household-based RLS + admin override → privacy + control
10 Link guardians via people_relationships → child oversight
11 Use tags for custom locations/journey tracks → flexible categorization
12 Adopt journey grid (journey tracks × stages) → per-track engagement
13 Drop people_category + locations[] → journey grid = single status source
14 Use universal stages contact→deleted_privacy_data → one vocabulary
15 Use "archived" terminal (not "departed") → universal term across all journey tracks
16 Admin-customizable journey_tracks table → adapts to church journey tracks
17 Enforce one stage per journey track via JSONB object key on people.journey → uniqueness by construction, no PK needed
18 Track journey + GDPR changes in single people_audit → unified audit
19 Seed default stages with colors + terminal flags → consistent UI
20 RLS: household reads own journeys; admin manages → privacy + control
21 Expose journey grid + journey-track APIs to modules → cross-module queries
22 Soft-delete people (deleted_at); hard delete only for error entries → never lose legitimate records (child safety)
23 Auto-apply demographic progression on Jan 1 via pg_cron → no manual admin effort required
24 Replace school_year enum with kindy_start_year integer → calculated school year never drifts
25 Calculate school year as CURRENT_YEAR − kindy_start_year → single source of truth, preschool handled separately
26 Trigger demographic change: Year 5→6 = child→youth; post-Year 12 = youth→adult → mirrors Australian school structure
27 Auto-progression does not require admin confirmation → speed + reduced admin burden
28 Log all auto-progressions in people_audit with change_reason = 'auto_progression' → full audit trail
29 Notify admins via in-app + email after Jan 1 rollover → admin can verify and manually correct if needed
30 Run Nov/Dec kindy prompt cron for age 3–5 children without kindy_start_year → ensures data is ready before Jan 1
31 Flag children aged 5+ with no kindy_start_year as admin warning (not kindy prompt) → data integrity alert
32 Kindy prompt notification: both in-app + email, same system as demographic change notifications → consistent UX
33 Define field mapping in peopleFields.md (journey grid, kindy_start_year, contact channels, consents) → single authoritative reference for build + data migration
34 Model contact channels first-class with phone_type enum (home/mobile), replacing separate Phone/Mobile columns → extends #3; consistent contact data
35 Treat school_email_permission as single source of truth, removing the Demographics/Consents duplicate → no dual-write drift
36 Store safe_ministry_start_date as DATE (not free-text) → typed child-safety data
37 Map Access Permissions onto base 5-level platform roles (value list in peopleFields.md) → consistent role model across modules
38 Name journey grid rows "journey tracks" (default label, admin-replaceable) → most universal + site-agnostic label; grid = tracks × stages (fields: peopleFields.md)
39 Own journey-grid terminology + organizer in people-module "Journey Grid Settings" page → module autonomy + single cohesive admin surface
40 Gate Journey Grid Settings by assignable permissions → designated managers, not hard-coded super_admin
41 Use variable hierarchy (self-referencing journey_track_categories) + drag-and-drop tree organizer → unlimited nesting at zero schema cost; categories = headings only (fields: peopleFields.md)
42 Require ≥1 journey track per person at creation (explicit pick in create flow + CHECK journey <> '{}') → every person enters the journey grid day one
43 Store person's journey as JSONB map on people.journey (track_id → stage) → person-centric reads + simple ≥1-track CHECK + offline/GDPR simplicity; scrub JSONB on track delete + GIN index for cross-person queries
44 Require a migration target track when deleting a journey track (people on it move: deleted key dropped, target key added) → preserves the ≥1-track invariant; organizer blocks delete until a target is chosen
45 Never allow zero journey tracks — unchecking the last track forces it to archived → person stays on the grid; archived = terminal "removed from active"
46 Model contact-only (unregistered) parents as people rows with people.journey auto-reconciled from linked children ('contact' stage on each child's track) → one people table + JSONB single source; parents visible as grid contacts
47 Contact-only parent lifecycle: reconcile on child-link change; no active child links + no own journey → auto-archive (restorable/promotable), never hard-delete → no orphan data or data loss
48 Extend people_audit.change_reason with 'migration' and 'sync' → Elvanto migration seeds journey/demographic in bulk (compatibility-design.md §3) and sync emits archive/tombstone events; both stay filterable from manual corrections

## Decision Gap Log
1 Table architecture: single people vs vertical partitioning → open
2 Journey grid UI (render, inline edit, bulk actions) → open
3 Performance: large households, search, pagination → open
4 pg_cron availability on Supabase tier → if free tier, fallback to Edge Function + GitHub Actions schedule cron → open
5 Notification system architecture: in-app notifications table + email provider integration → open
6 Kindy prompt response flow: how admin sets kindy_start_year from the notification (inline action vs navigate to person) → open
7 Demographic progression UI: dedicated admin review screen vs notification-only → open
8 Journey seeding for existing people: source has one People Category + multiple Locations[] per person, but journey grid stores one stage per track in people.journey → how to derive each track's stage → open
10 Terminology replacement scope (which labels replaceable) → open
11 Contact-only parent UX: dedup by phone/email, promotion flow, child-profile guardian listing + contact-through-parent strategy → open
