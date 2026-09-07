# Decision: People Module

## Aliases
- Journey grid = journey tracks (rows) × universal stages (columns); one stage per track per person; categories/subcategories = structural headings only (never journey rows)
- Stage = journey_stage_slug — values & colors in peopleFields.md journey grid
- WWCC = Working With Children Check; SMT = Safe Ministry Training; SMC = Safe Ministry Check
- RLS = Row Level Security
- kindy_start_year = calendar year person started Kindy; calculated school year = CURRENT_YEAR − kindy_start_year (Kindy=0, Year 1=1, … Year 12=12)
- Demographic progression = auto-update of demographic on Jan 1 each year via pg_cron
- Kindy prompt = Nov/Dec cron notification for age 3–5 children without kindy_start_year
- Field mapping source = peopleFields.md (SSOT for field names, enums, conditional visibility, journey-grid migration mapping)

## Reference documents
- **peopleFields.md** — **single source of truth** for people field-level data (field names, enums, conditional visibility, journey-grid mapping). This doc is authoritative for model/behaviour decisions; field-level detail lives in peopleFields.md.
- **schema.dbml** — canonical database schema (tables, columns, enums, indexes, partitions)
- **core/decision.md** — platform architecture, auth, RLS (#11, #25, #26, #33, #56–58), soft-delete
- **core/elvanto/compatibility-design.md** — migration seeding (§3), field ownership matrix (§4), limitations L-1..L-8, runbook

## What & Why
Baseline always-on people CRM: households, people, relationships, tags, journey grid, contact channels, child safety, consents, medical, saved lists, forms, email. Journey grid replaces flat people_category + locations[] to track engagement per journey track. Foundation for all other modules.

## Who
Church admins/staff managing people; household members self-viewing; groups/services/calendar modules consuming people data via the module API.

## Scope
### Tables (app-owned)
households, addresses, contact_channels, people (journey JSONB), people_relationships, tags, people_tags, user_roles, journey_tracks, journey_track_categories, journey_stages, people_audit, saved_lists, forms, form_fields, form_submissions

### Tables (mirror — Elvanto-owned, future-module consumers)
people_categories, custom_fields, custom_field_values, people_flows, people_flow_steps, people_flow_step_members

### Shadow columns (Elvanto-written, app-readable, never in UI)
people.elvanto_*, people.mobile (mirrors primary mobile channel for auth OTP), people.elvanto_locations (raw locations[] pull — journey seeding input), people.elvanto_custom_fields (EAV mirror)

### People field groups & demographic visibility
| Group | Demographic |
|---|---|
| Personal, Demographics, Address | All |
| Contact (email + contact_channels) | Adult |
| Guardians (registered + contact-only) | Youth+Child |
| Medical | Youth+Child |
| Consents | Youth+Child |
| Child Safety (WWCC/SMT/SMC) | Youth+Adult |
| Admin (access_permission, date_professed, legacy_*, country, timezone, picture_url) | Admin role |

### Module API
getById(s), getByHousehold, getGuardians, getByDemographic, getByJourneyTrack, getWithValidWWCC, getWithSafeMinistry, getJourneyGrid, search

### Tags categories
location, journey_track, demographic, status, custom

## Constraints
- Australian child-safety compliance (WWCC, SMT, SMC)
- Conditional field visibility by demographic (adult/youth/child)
- One journey stage per journey track per person (JSONB object key = track; GIN-indexed)
- ≥1 journey track per person (CHECK journey <> '{}')
- Last track unchecked → forced archived; track delete → required migration target
- Demographic progression: Year 5→6 = child→youth; post-Year 12 = youth→adult; Jan 1 auto-apply via pg_cron; all logged in people_audit
- RLS: household sees own people + journeys; admins see/manage all; users update own profile; people_audit admin-only
- Soft-delete (deleted_at); hard delete only for error entries (core #26)
- Auth link: people.auth_user_id = auth.users.id (core #11/#58); users without a people row fall back to user_metadata/email
- Sync write-back is explicit-action-only; pull is automatic; never SQL-DELETE (missing upstream → deleted_at tombstone)
- App-owned data (journey, tags, child-safety, consents, medical, school_name, custom_fields) never pushed to Elvanto
- Dual-key identity: id (app UUID) + elvanto_id (sync join; migrated rows share both values; pure mirror tables' id IS the Elvanto UUID)

## Deferred / Non-Goals
- Workflows / follow-up cards — Elvanto mirror tables (people_flows, etc.) remain untouched for future
- Reporting / dashboard — counts/badges on existing pages sufficient
- Duplicate detection / merge UI — admins manually clean duplicates; future work
- CSV import/export — Elvanto migration handles initial data; export follows saved lists later
- PWA offline cache implementation (core #33)
- Self-service profile editing (Church Center)
- Automation / triggers
- In-app notifications — email integration implemented; in-app notification system deferred to core
- pg_cron free-tier availability — platform-level; fallback = Edge Function + GitHub Actions schedule cron
- Contact-only parent dedup/promotion UX, child-profile guardian listing — partially resolved; full UX deferred
- Native UI controls in forms/selects — barrel UI primitives (Batch 13 polish)

---

## Decision Log

### Foundational data model (#1–48)
1 Keep people module always-on → foundation for all modules
2 Model household-centric (people in households) → family-centric CRM
3 Treat contact channels first-class → communication priority
4 Use JSONB custom_fields → church-specific extensibility (app-owned; Elvanto customs shadowed separately in elvanto_custom_fields)
5 Use PostgreSQL enums for fixed domains → data integrity
   - **Active enums:** demographic, gender, marital_status, phone_type, yes_no, tag_category, audit_change_reason, safe_ministry_leader_type, smt_type, smc_result, access_permission, relationship_type, address_kind, person_status (shadow), family_relationship (mirror)
   - **Refinement (supersedes #33 enum list):** journey stages are table rows (`journey_stages`, slug PK), not a PG enum — admin-customizable
   - **Refinement:** consent values use `yes_no` enum (not `consent_status`); school_email_permission uses `yes_no`; wwcc_verification_outcome is varchar; wwcc_exemption is jsonb multi-select
6 Gate fields by demographic → relevant data per person
7 Add WWCC/SMT/SMC child-safety fields → legal compliance
8 Restrict admin fields (access_permissions, legacy_*, date_professed) → privacy
9 Enforce household-based RLS + admin override → privacy + control
10 Link guardians via people_relationships → child oversight
11 Use tags for custom locations/journey tracks → flexible categorization
12 Adopt journey grid (journey tracks × stages) → per-track engagement
13 Drop people_category + locations[] → journey grid = single status source (legacy Elvanto People Category shadowed in elvanto_category_id; locations[] in elvanto_locations jsonb)
15 Use universal stages contact→deleted_privacy_data → one vocabulary
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
26 Demographic trigger: Year 5→6 = child→youth; post-Year 12 = youth→adult → mirrors Australian school structure
27 Auto-progression does not require admin confirmation → speed + reduced admin burden
28 Log all auto-progressions in people_audit with change_reason = 'auto_progression' → full audit trail
29 Notify admins via in-app + email after Jan 1 rollover → admin can verify and manually correct if needed (email via core service; in-app notifications deferred to core)
30 Run Nov/Dec kindy prompt cron for age 3–5 children without kindy_start_year → ensures data is ready before Jan 1
31 Flag children aged 5+ with no kindy_start_year as admin warning (not kindy prompt) → data integrity alert
32 Kindy prompt notification: both in-app + email (same system as demographic change notifications)
33 people_audit: field_changed = journey_track | demographic | gdpr_deletion | email_sent; change_reason = manual | auto_progression | gdpr_request | migration | sync (refined: field_changed is varchar; changed_by uuid; changed_at timestamptz)
34 Model contact channels first-class with phone_type enum (home/mobile/work/other) in contact_channels table → replaces separate Phone/Mobile columns
35 Treat school_email_permission as single source of truth (yes_no enum), removing Demographics/Consents duplicate → no dual-write drift
36 Store safe_ministry_start_date as DATE (not free-text) → typed child-safety data
37 Map access_permission onto base 5-level platform roles (access_permission enum: public|member_area|team_leaders|admin|super_admin) → consistent role model across modules
38 Name journey grid rows "journey tracks" (admin-replaceable label) → universal + site-agnostic
39 Own journey-grid terminology + organizer in People module "Journey Grid Settings" page → module autonomy + single cohesive admin surface
40 Gate Journey Grid Settings by assignable permissions (not hard-coded super_admin) → designated managers
41 Use variable hierarchy (self-referencing journey_track_categories) + drag-and-drop tree organizer → unlimited nesting; categories = headings only
42 Require ≥1 journey track per person at creation (explicit pick in create flow + CHECK journey <> '{}') → every person enters the grid day one
43 Store journey as JSONB map on people.journey (track_id → stage) → person-centric reads + simple ≥1-track CHECK + offline/GDPR simplicity; scrub JSONB on track delete + GIN index for cross-person queries
44 Require migration target when deleting a journey track (person on it: deleted key dropped, target key added) → preserves the ≥1-track invariant; organizer blocks delete until target chosen
45 Never allow zero journey tracks — unchecking the last track forces it to archived → person stays on grid; archived = terminal "removed from active"
46 Model contact-only (unregistered) parents as people rows with people.journey auto-reconciled from linked children ('contact' stage on each child's track) → one people table + JSONB single source; parents visible as grid contacts
47 Contact-only parent lifecycle: reconcile on child-link change; no active child links + no own journey → auto-archive (restorable/promotable), never hard-delete → no orphan data or data loss
48 Extend people_audit.change_reason with 'migration' and 'sync' → Elvanto migration seeds journey/demographic in bulk (compatibility-design.md §3) and sync emits archive/tombstone events; both stay filterable from manual corrections

### Cross-module features (resolved 2026-08-26)
49 Saved Lists: YES — saved_lists table (id uuid, name varchar, owner_id uuid ref auth_users, conditions jsonb, is_shared boolean, created_at/updated_at); ownership-aware CRUD; filter conditions = array of {field, operator, value}
50 Forms: YES, BASIC — forms + form_fields + form_submissions tables; form_submit_action enum (create_person|update_person|add_to_tag|none); form_field_type enum (text|email|phone|number|select|multi_select|checkbox|textarea|date); admin builder, public URL (/forms/:formId), field-to-person-column mapping; submitForm() validates + creates/updates people + links tags
51 Email Integration: YES — via core platform email service (src/core/lib/email.ts: sendEmail, EmailRecipient, SendEmailInput, SendEmailResult); bulk email to saved lists, individual email from profile; sends logged to people_audit (field_changed='email_sent'); core provider wiring deferred
52 Workflows: DEFER — no workflow UI in this module; Elvanto mirror tables (people_flows, people_flow_steps, people_flow_step_members) remain untouched for future
53 Reporting: DEFER — counts/badges on existing pages sufficient; full dashboard deferred
54 Duplicate Detection & Merge: DEFER — admins manually find and clean duplicates; future auto-suggest + merge UI
55 CSV Import/Export: DEFER — Elvanto migration handles initial data; CSV export follows saved lists in future batch
56 PWA Offline Cache: DEFER — core #33 (read-only IndexedDB cache for people fields; implementation design pending)
57 Self-Service Profile Editing: DEFER — RLS allows own-profile update client-side, but Church Center self-service deferred
58 Automation / Triggers: DEFER — auto-send welcome email, auto-add to workflow, etc.
59 In-App Notifications: DEFER — email integration implemented (#51); in-app notification system deferred to core platform
60 pg_cron Free-Tier Availability: DEFER — platform-level; fallback = Edge Function triggered by GitHub Actions schedule cron
61 Contact-Only Parent UX: PARTIALLY RESOLVED — contact-only parents modelled as people rows with auto-reconciled journey; full dedup/promotion/child-profile-guardian-listing UX deferred
62 Person Create Flow: ≥1 journey track required; household selection/creation (pick existing or create inline); Zod validation (names, email, DOB range); operator-aware admin fields (server-side RLS is authority; client gating is UX only)
63 Person Edit Flow: RLS allows own-profile updates; admin-only fields conditionally shown based on operator role; create/edit mutations log journey/demographic changes to people_audit
64 Search UX: global search bar + per-page filtering; debounced server-backed via searchPeople() hook; offset pagination
65 Tag Management UI: CRUD tags by category, assign to people (inline on profile), filter in directory
66 Journey Grid Settings UI: tabbed Tracks/Categories/Stages; drag-and-drop reorder; track delete requires migration target; seeded/terminal stages have no delete action; category tree with self-parenting protection

### Migration & sync (per compatibility-design.md)
67 Dual-key identity: id (app UUID) + elvanto_id (uuid unique, nullable); all sync joins use elvanto_id; migrated rows seed id = elvanto_id; app-origin rows excluded from pull-matches until first push
68 Journey seeding (P4): demographic from People Category (name→enum; unmapped→'adult'+review queue); stage from People Category (Sunday track: archived/deleted_privacy_data/guest/linked/regular/contact) + Elvanto locations[] (Campus tracks: contact) + status flags; every seeded value logged with change_reason='migration'
69 Journey ongoing ownership: journey is app-owned after cutover; Elvanto locations[] shadowed in elvanto_locations jsonb for reference; never written automatically
70 Optional journey_tracks.follow_elvanto (boolean, default off): when on, upstream membership add/remove toggles person on/off that track at stage 'contact'
71 Stages never pushed to Elvanto (deny-list)
72 Demographic push: map enum→existing Elvanto category by name; no matching category → sync error (L-4)
73 Household address: app-owned per household; seeded from Primary Contact home_* on pull; pushed to Primary Contact only (L-2); rename/merge/delete impossible upstream (L-1)
74 Contact-only parents: elvanto_id = null → naturally excluded from pull-matches until explicitly pushed by admin (L-3)
75 App-owned deny-list (never pushed): journey, tags, child-safety (WWCC/SMT/SMC), consents, medical, school_name, custom_fields, access_permission (push promote-only: Admin/SuperAdmin→1, others→0)
76 Gender: blank→'' maps to null on pull; null pushes back as ''
77 Deleted-person lifecycle: missing-from-scan/upstream remove/user delete → deleted_at tombstone + audit; reappears upstream → restore (admin confirm); 5yr archived → GDPR scrub (deleted_privacy_data), exit sync scope
78 Elvanto custom fields: pulled to elvanto_custom_fields shadow (EAV); app custom_fields never pushed

### UX implementation (resolved 2026-09-06)
79 Multipurpose profile view: Single inline-edit component handles admin viewing, admin editing, and self-view; fields toggle between display mode (read-only) and edit-in-place mode. No separate edit page needed.
80 Self-view edit scope: Broad — all self-visible fields inline-editable (name, email, phone/mobile, DOB, school, school_email_permission, kindy_start_year); admin-only fields hidden; RLS enforces server-side
81 RLS-gated profile actions: Non-admin/team_leader operators' actions (edit journey stage, add/remove tags, edit child safety, delete person, add guardian, edit admin fields) hidden at UI level; RLS remains server-side authority
82 Child Safety inline: Full display in collapsible card with inline editing for all WWCC/SMT/SMC fields
83 Guardians display: Read-only list of linked guardians with View (opens same profile component) and Add (opens modal) buttons; supports registered members and contact-only parents
84 Address: Managed on HouseholdPage (HouseholdAddress component); profile links to household, no inline address card
85 Dashboard RLS gating: "New person" button hidden for operators without admin/team_leaders access_permission
86 Form field mapping scope: PersonForm edit covers Personal + Demographics + Household + Journey + Admin (admin-only). Contact channels, child safety, consents, and medical fields are profile-view-only (not editable via PersonForm). Full contact_channels CRUD deferred to future dedicated management page.
