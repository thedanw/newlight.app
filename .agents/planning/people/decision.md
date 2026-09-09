# Decision: People Module

## Aliases
- Journey grid = journey tracks (rows) × universal stages (columns); one stage per track per person; categories = structural headings only
- Stage = journey_stage_slug (values/colors in peopleFields.md); WWCC/SMT/SMC = child-safety checks; RLS = Row Level Security
- kindy_start_year = calendar year started Kindy; school year = CURRENT_YEAR − kindy_start_year (Kindy=0…Year 12=12)
- Demographic progression = auto demographic update Jan 1 via pg_cron; Kindy prompt = Nov/Dec cron for age 3–5 without kindy_start_year
- Field mapping source = peopleFields.md (SSOT for field names, enums, conditional visibility, journey-grid mapping)
- Profile type = `people.demographic` (adult/youth/child); surfaced in UI as "Profile Type"; drives heading + visible field groups

## Reference documents
- **peopleFields.md** — SSOT for people field-level data
- **schema.dbml** — canonical database schema
- **core/decision.md** — platform architecture, auth, RLS, soft-delete
- **core/elvanto/compatibility-design.md** — migration seeding, field ownership, limitations, runbook

## What & Why
Baseline always-on people CRM: households, people, relationships, tags, journey grid, contact channels, child safety, consents, medical, saved lists, forms, email. Journey grid replaces flat people_category + locations[] to track engagement per track. Foundation for all other modules.

## Who
Church admins/staff managing people; household members self-viewing; groups/services/calendar modules consuming via module API.

## Scope
### Tables (app-owned)
households, addresses, contact_channels, people (journey JSONB), people_relationships, tags, people_tags, user_roles, journey_tracks, journey_track_categories, journey_stages, people_audit, saved_lists, forms, form_fields, form_submissions

### Tables (mirror — Elvanto-owned)
people_categories, custom_fields, custom_field_values, people_flows, people_flow_steps, people_flow_step_members

### Shadow columns (Elvanto-written, app-readable, never in UI)
people.elvanto_*, people.mobile (mirrors primary mobile for auth OTP), people.elvanto_locations (raw locations[] — journey seeding input), people.elvanto_custom_fields (EAV mirror)

### Field groups by demographic
Personal/Demographics/Address: All · Contact (email + contact_channels): Adult · Guardians: Youth+Child · Medical: Youth+Child · Consents: Youth+Child · Child Safety (WWCC/SMT/SMC): Youth+Adult · Admin (access_permission, date_professed, legacy_*, country, timezone, picture_url): Admin role

### Profile type UI
Edit heading `Edit Adult/Youth/Child`; view heading `<Demographic> Profile`; banner `Profile Type: <demographic>` + `Change Type` → edit page (DemographicsSection)

### Module API
getById(s), getByHousehold, getGuardians, getByDemographic, getByJourneyTrack, getWithValidWWCC, getWithSafeMinistry, getJourneyGrid, search

### Tags categories
location, journey_track, demographic, status, custom

## Constraints
- Australian child-safety compliance (WWCC, SMT, SMC); conditional field visibility by demographic
- One journey stage per track per person (JSONB key = track; GIN-indexed); ≥1 track per person (CHECK journey <> '{}'); last track unchecked → forced archived; track delete → required migration target
- Demographic progression: Year 5→6 child→youth; post-Year 12 youth→adult; Jan 1 via pg_cron; logged in people_audit
- RLS: household sees own people + journeys; admins all; users own profile; people_audit admin-only
- Soft-delete (deleted_at); hard delete only for error entries (core #26); auth link people.auth_user_id = auth.users.id (core #11/#58), no people row → fall back to user_metadata/email
- Sync write-back explicit-action-only; pull automatic; never SQL-DELETE (missing upstream → deleted_at tombstone); app-owned data never pushed to Elvanto; dual-key identity: id (app UUID) + elvanto_id (sync join; migrated rows share both; mirror tables' id IS Elvanto UUID)

## Deferred / Non-Goals
Workflows, Reporting, Duplicate detection/merge, CSV import/export, PWA offline (core #33), Self-service editing, Automation, In-app notifications, pg_cron free-tier, Contact-only parent UX, Native UI controls in forms (barrel primitives) — see 2.4

---

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)

### 1 Foundational data model
1.1 Keep people module always-on → foundation for all modules
1.2 Model household-centric (people in households) → family-centric CRM
1.3 Contact channels first-class: contact_channels table + phone_type enum (home/mobile/work/other) → replaces separate Phone/Mobile columns; communication priority
1.4 JSONB custom_fields → church-specific extensibility (app-owned; Elvanto customs shadowed in elvanto_custom_fields)
1.5 PG enums for fixed domains → data integrity
    1.5.1 Active enums: demographic, gender, marital_status, phone_type, yes_no, tag_category, audit_change_reason, safe_ministry_leader_type, smt_type, smc_result, access_permission, relationship_type, address_kind, person_status (shadow), family_relationship (mirror)
    1.15.2 Journey stages = table rows (journey_stages, id uuid PK + slug unique), not enum → admin-customizable; slug remains unique + editable (upsert by id); consent + school_email_permission use yes_no; wwcc_verification_outcome varchar; wwcc_exemption jsonb multi-select
1.6 Demographic-gated field visibility → relevant data per person; admin fields (access_permissions, legacy_*, date_professed) restricted → privacy
1.7 Child-safety fields (WWCC/SMT/SMC) → legal compliance; safe_ministry_start_date as DATE
1.8 RLS: household sees own people + journeys; admin override; users update own profile; people_audit admin-only → privacy + control
1.9 Guardians via people_relationships → child oversight
1.10 Tags for custom locations/journey tracks → flexible categorization
1.11 Journey grid (tracks × stages) replaces people_category + locations[] → per-track engagement; single status source (legacy category → elvanto_category_id; locations[] → elvanto_locations jsonb); universal stages contact→deleted_privacy_data; admin-customizable journey_tracks; rows named "journey tracks" (admin-replaceable label)
1.12 One stage per track via JSONB key on people.journey → uniqueness by construction, no PK needed
1.13 Unified people_audit: field_changed = journey_track | demographic | gdpr_deletion | email_sent; change_reason = manual | auto_progression | gdpr_request | migration | sync (field_changed varchar; changed_by uuid; changed_at timestamptz) → full audit trail; migration/sync events filterable from manual corrections
1.14 Seed default stages with colors + terminal flags → consistent UI
1.15 Expose journey grid + track APIs to modules → cross-module queries
1.16 Soft-delete (deleted_at); hard delete only for error entries → never lose legitimate records (child safety)
1.17 Demographic progression: Jan 1 pg_cron; Year 5→6 child→youth; post-Year 12 youth→adult; no admin confirmation; logged (auto_progression); admins notified in-app + email → mirrors Australian school structure, no manual effort
1.18 School year: kindy_start_year integer replaces school_year enum; school year = CURRENT_YEAR − kindy_start_year → never drifts; preschool separate; Kindy prompt = Nov/Dec cron for age 3–5 without kindy_start_year (in-app + email); 5+ without → admin warning → data ready before Jan 1
1.19 school_email_permission single source of truth (yes_no), removing Demographics/Consents duplicate → no dual-write drift
1.20 access_permission maps to base 5-level platform roles (public|member_area|team_leaders|admin|super_admin) → consistent role model
1.21 Journey Grid Settings page owned by module; gated by assignable permissions (not hard-coded super_admin); variable hierarchy (self-referencing journey_track_categories) + drag-and-drop organizer; categories = headings only → module autonomy + unlimited nesting
1.22 Journey invariants: ≥1 track at creation (explicit pick + CHECK journey <> '{}'); JSONB map (track_id → stage) with GIN index + scrub on track delete; track delete requires migration target; unchecking last track forces archived (terminal "removed from active") → every person stays on grid
1.23 Contact-only (unregistered) parents as people rows; journey auto-reconciled from linked children ('contact' stage on each child's track); no active child links + no own journey → auto-archive (restorable/promotable), never hard-delete → one people table + JSONB single source; no orphan data or loss

### 2 Cross-module features
2.1 Saved Lists: YES — saved_lists (id uuid, name, owner_id ref auth_users, conditions jsonb, is_shared, created_at/updated_at); ownership-aware CRUD; conditions = [{field, operator, value}]
2.2 Forms: YES, BASIC — forms + form_fields + form_submissions; form_submit_action (create_person|update_person|add_to_tag|none); form_field_type (text|email|phone|number|select|multi_select|checkbox|textarea|date); admin builder, public URL (/forms/:formId), field-to-person mapping; submitForm() validates + creates/updates people + links tags
2.3 Email: YES — core email service (src/core/lib/email.ts); bulk to saved lists, individual from profile; logged (field_changed='email_sent'); provider wiring deferred
2.4 Deferred: Workflows (Elvanto mirror tables untouched), Reporting (counts/badges sufficient), Duplicate detection/merge (manual; future auto-suggest + merge UI), CSV import/export (Elvanto migration handles initial; export later), PWA offline (core #33), Self-service editing (RLS allows own-profile; Church Center deferred), Automation/triggers, In-app notifications (email done; in-app deferred to core), pg_cron free-tier (fallback = Edge Function + GH Actions cron), Contact-only parent UX (modelled; full dedup/promotion/guardian-listing UX deferred)

### 3 Migration & sync
3.1 Dual-key identity: id (app UUID) + elvanto_id (uuid unique, nullable); sync joins use elvanto_id; migrated rows seed id = elvanto_id; app-origin rows excluded from pull-matches until first push
3.2 Journey seeding (P4): demographic from People Category (name→enum; unmapped→'adult'+review queue); stage from People Category (Sunday track: archived/deleted_privacy_data/guest/linked/regular/contact) + Elvanto locations[] (Campus tracks: contact) + status flags; logged change_reason='migration'
3.3 Journey ownership: app-owned after cutover; elvanto_locations shadowed, never written automatically; optional follow_elvanto (default off) toggles person on/off track at 'contact'; stages never pushed (deny-list)
3.4 Demographic push: map enum→existing Elvanto category by name; no match → sync error (L-4)
3.5 Household address: app-owned; seeded from Primary Contact home_* on pull; pushed to Primary Contact only (L-2); rename/merge/delete impossible upstream (L-1)
3.6 Contact-only parents: elvanto_id = null → excluded from pull-matches until explicitly pushed (L-3)
3.7 App-owned deny-list (never pushed): journey, tags, child-safety, consents, medical, school_name, custom_fields, access_permission (push promote-only: Admin/SuperAdmin→1, others→0)
3.8 Gender: blank→'' maps to null on pull; null pushes back as ''
3.9 Deleted-person lifecycle: missing-from-scan/upstream remove/user delete → deleted_at tombstone + audit; reappears → restore (admin confirm); 5yr archived → GDPR scrub (deleted_privacy_data), exit sync scope
3.10 Elvanto custom fields: pulled to elvanto_custom_fields shadow (EAV); app custom_fields never pushed

### 4 UX implementation
4.1 Multipurpose profile view: single inline-edit component for admin view/edit + self-view; fields toggle display vs edit-in-place; no separate edit page; single profile page renders as form with editability by role — Super Admin: all; Admin: all except RLS role fields (visible, locked); Team Leader: all except RLS role fields + "Change Password"/"Send Magic Link" (visible, locked); Member: all visible but locked; Public: only RLS public fields visible and locked
4.2 Self-view edit scope: broad — all self-visible fields inline-editable (name, email, phone/mobile, DOB, school, school_email_permission, kindy_start_year); admin-only hidden; RLS server-side
4.3 RLS gating: non-admin/team_leader actions (edit journey stage, add/remove tags, edit child safety, delete person, add guardian, edit admin fields) hidden at UI; "New person" hidden without admin/team_leaders; RLS remains authority
4.4 Child Safety inline: collapsible card with inline editing for WWCC/SMT/SMC
4.5 Guardians display: read-only list with View (same profile component) + Add (modal); registered + contact-only parents
4.6 Address: managed on HouseholdPage (HouseholdAddress); profile links to household, no inline address card
4.7 Form field mapping scope: PersonForm covers Personal + Demographics + Household + Journey + Admin (admin-only); contact channels, child safety, consents, medical are profile-view-only; full contact_channels CRUD deferred
4.8 Supabase privacy safeguard: Supabase controls privacy data incl. last name; public last_initial stored/extracted automatically on backend; full last name never exposed publicly
4.9 Person create/edit flow: ≥1 journey track required; household selection/creation (pick existing or create inline); Zod validation (names, email, DOB range); operator-aware admin fields (server-side RLS is authority; client gating is UX only); RLS allows own-profile updates; admin-only fields conditionally shown by operator role; mutations log journey/demographic changes to people_audit
4.10 Search UX: global search bar + per-page filtering; debounced server-backed via searchPeople() hook; offset pagination
4.11 Tag management UI: CRUD tags by category, assign to people (inline on profile), filter in directory
4.12 Journey Grid Settings UI: tabbed Tracks/Categories/Stages; drag-and-drop reorder; track delete requires migration target; seeded/terminal stages have no delete action; category tree with self-parenting protection
