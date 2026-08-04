# Decision: People Module — Data Model & Ministry Journey Grid

## Aliases
- Journey grid = ministries (rows) × universal stages (columns); one stage per ministry per person
- Stage = journey_stage_slug (contact, guest, linked, regular, archived, deleted_privacy_data)
- WWCC = Working With Children Check; SMT = Safe Ministry Training; SMC = Safe Ministry Check
- RLS = Row Level Security
- kindy_start_year = calendar year the person started Kindy (replaces mutable school_year enum)
- Calculated school year = CURRENT_YEAR − kindy_start_year (Kindy=0, Year 1=1, … Year 12=12)
- Demographic progression = auto-update of demographic column on Jan 1 each year via pg_cron
- Kindy prompt = Nov/Dec cron notification asking admin to confirm kindy start for age 3–5 children

## What & Why
Baseline always-on people module: CRM of people, households, relationships, tags, roles. Journey grid replaces flat people_category + locations[] to track ministry-specific engagement.

## Who
Church admins/staff managing people; household members self-viewing; groups/services/calendar modules consuming people data.

## Constraints
- Australian Anglican child-safety compliance (WWCC, SMT, SMC)
- Conditional field visibility by demographic (adult/youth/child)
- One journey stage per ministry per person (PK-enforced)
- Stable IDs, RLS, API for other modules
- Demographic progression rules: Year 5→6 triggers child→youth; post-Year 12 triggers youth→adult
- school_year enum column replaced by kindy_start_year integer (migration required)
- pg_cron fires Jan 1 00:00 AEDT (Dec 31 13:00 UTC); kindy prompt cron fires Nov/Dec
- All auto-progression changes recorded in people_audit with change_reason = 'auto_progression'
- Children aged 5+ with no kindy_start_year flagged as admin warning (separate from kindy prompt)

## Non-Goals
- No separate people.status column — journey grid is the status
- No ministry-specific terminal stages — universal "archived"
- Audit only journey + GDPR changes (people_audit)
- No admin confirmation required before demographic changes are applied (auto-apply)
- No preschool year tracking — only kindy_start_year is stored
- No rollback UI for demographic progression (manual correction via person edit; audit trail exists)

## Assumptions
- Ministries are admin-customizable (seeded defaults)
- Legacy people_category + locations[] migrated (gap open)
- user_roles values align to base 5-level platform roles (verify)
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
11 Use tags for custom locations/ministries → flexible categorization
12 Adopt journey grid (ministries × stages) → ministry-specific engagement
13 Drop people_category + locations[] → journey grid = single status source
14 Use universal stages contact→deleted_privacy_data → one vocabulary
15 Use "archived" terminal (not "departed") → universal term all ministries
16 Admin-customizable ministries table → adapts to church ministries
17 Enforce one stage per ministry via PK(person_id, ministry_id) → no conflicts
18 Track journey + GDPR changes in single people_audit → unified audit
19 Seed default stages with colors + terminal flags → consistent UI
20 RLS: household reads own journeys; admin manages → privacy + control
21 Expose journey grid + ministry APIs to modules → cross-module queries
22 Soft-delete people (deleted_at) → never truly delete (child safety)
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

## Decision Gap Log
1 Table architecture: single people vs vertical partitioning → open
2 Journey grid UI (render, inline edit, bulk actions) → open
3 Migration: people_category + locations[] → people_ministry_journey → open
4 Performance: large households, search, pagination → open
5 Align user_roles values to base 5-level platform roles → open
6 pg_cron availability on Supabase tier → if free tier, fallback to Edge Function + GitHub Actions schedule cron → open
7 Migration: school_year enum column → kindy_start_year integer (data mapping for existing records) → open
8 Notification system architecture: in-app notifications table + email provider integration → open
9 Kindy prompt response flow: how admin sets kindy_start_year from the notification (inline action vs navigate to person) → open
10 Demographic progression UI: dedicated admin review screen vs notification-only → open
