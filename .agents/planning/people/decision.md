# Decision: People Module — Data Model & Ministry Journey Grid

## Aliases
- Journey grid = ministries (rows) × universal stages (columns); one stage per ministry per person
- Stage = journey_stage_slug (contact, guest, linked, regular, archived, deleted_privacy_data)
- WWCC = Working With Children Check; SMT = Safe Ministry Training; SMC = Safe Ministry Check
- RLS = Row Level Security

## What & Why
Baseline always-on people module: CRM of people, households, relationships, tags, roles. Journey grid replaces flat people_category + locations[] to track ministry-specific engagement.

## Who
Church admins/staff managing people; household members self-viewing; groups/services/calendar modules consuming people data.

## Constraints
- Australian Anglican child-safety compliance (WWCC, SMT, SMC)
- Conditional field visibility by demographic (adult/youth/child)
- One journey stage per ministry per person (PK-enforced)
- Stable IDs, RLS, API for other modules

## Non-Goals
- No separate people.status column — journey grid is the status
- No ministry-specific terminal stages — universal "archived"
- Audit only journey + GDPR changes (people_audit)

## Assumptions
- Ministries are admin-customizable (seeded defaults)
- Legacy people_category + locations[] migrated (gap open)
- user_roles values align to base 5-level platform roles (verify)

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

## Decision Gap Log
1 Table architecture: single people vs vertical partitioning → open
2 Journey grid UI (render, inline edit, bulk actions) → open
3 Migration: people_category + locations[] → people_ministry_journey → open
4 Performance: large households, search, pagination → open
5 Align user_roles values to base 5-level platform roles → open
