# Decision-Log Alignment — Elvanto Schema vs Core + People Decisions

**Date:** 2026-08-25
**Compares:** `.agents/planning/elvanto/schema.dbml` (+ `sync-design.md`, `findings.md`) against `.agents/planning/core/decision.md` and `.agents/planning/people/decision.md` + `peopleFields.md`.
**Governing principle (per request):** **decision logs win**; the Elvanto integration must adapt to them, while staying backward-compatible for two-way sync. Elvanto-only capabilities with no decision log yet (giving, songs, services plans, calendar, people flows) are preserved as future-module mirrors.

Severity: 🔴 blocks build · 🟡 design conflict, resolve before migration · 🔵 naming/doc hygiene

---

## Verdict

| Area | Result |
|---|---|
| Architecture | 🔴 3 structural conflicts: PK/identity strategy, hard-delete sync vs soft-delete mandate, missing app-owned tables |
| People data model | 🟡 ~10 field-level conflicts (contact channels, journey grid, households, enums, school year, roles) |
| Future Elvanto modules | ✅ Mirror tables (groups/services/songs/calendar/financial/flows) don't contradict any decision — keep intact |
| Sync contract (`sync-design.md`) | 🟡 §3 (verbatim PKs) and §4 (hard DELETE on missing-from-scan) both violate decisions and must be amended |

---

## A. Architecture-level inconsistencies

### 🔴 A-1 — Primary-key strategy: verbatim Elvanto UUIDs vs app-first creation
- `sync-design.md` §3: *"PKs mirror Elvanto IDs verbatim → upsert idempotent, no mapping table."* `schema.dbml` keys every table on the Elvanto UUID.
- Decision logs assume an **app-first CRM**: admin invites (#9), people created/edited in-app, offline-tolerant workflows, write-back only on explicit user action (`sync-design.md` §1). Elvanto's `people/create` returns a **server-generated id** — an app-created person cannot know its Elvanto UUID beforehand, so "PK = Elvanto id" is unimplementable for app-originated rows.

**Resolution (recommended):** app-generated UUID PKs everywhere; add nullable unique `elvanto_id uuid` to every synced table (the new mapping column). Elvanto-originated rows adopt their Elvanto UUID as both `id` and `elvanto_id`; app-originated rows get `elvanto_id` on first successful push/pull match. Amend `sync-design.md` §3 accordingly. This keeps upserts idempotent (join on `elvanto_id`) without sacrificing app autonomy.

### 🔴 A-2 — Hard-delete sync vs soft-delete mandate
- Core #26 / people #22: soft-delete via `deleted_at`; hard delete only for error entries; child-safety records never lost.
- `sync-design.md` §4: *"Missing from full-scan → delete row (cascade children)"*, and all Elvanto `remove` endpoints are hard deletes upstream.
- Also missing: `people.deleted_at` doesn't exist anywhere in `schema.dbml`.

**Resolution:** sync never issues SQL `DELETE`. Missing-from-scan / upstream remove ⇒ set `deleted_at` (tombstone). RLS filters `deleted_at IS NULL`. Cascade deletes become cascade tombstones. GDPR `deleted_privacy_data` scrubbing (after 5 yrs archived) additionally nulls PII columns and **excludes the row from future sync** (see A-4).

### 🔴 A-3 — Two schemas, one database: app-owned tables absent
People decision Scope requires tables that `schema.dbml` (which `AGENTS.md` calls *the* logical DB model) does not contain:
`households`, `addresses`, `people_relationships`, `tags`, `people_tags`, `user_roles`, `journey_tracks`, `journey_track_categories`, `journey_stages`, `people_audit`.
Core decisions likewise require `module_config`, `platform_settings` (#14/#20/#21). None exist.

**Resolution:** one unified schema with three explicitly-labelled partitions:
1. **App-owned** (decisions govern): households, addresses, relationships, tags, journey_*, audit, roles, module config…
2. **Sync-shadow columns** on app tables (Elvanto mirror fields that have no app meaning — prefixed `elvanto_*`).
3. **Mirror tables** (Elvanto governs; future modules): groups, services, songs, calendar, financial, flows — unchanged from current `schema.dbml`.

### 🔴 A-4 — Four overlapping "removed" vocabularies, none disambiguated
| Concept | Source | Current schema state |
|---|---|---|
| Soft delete | core #26 / people #22 `deleted_at` | ❌ missing |
| Journey terminal stage `archived` | people #15/#45 | ❌ no journey tables yet |
| Elvanto person `archived` bool | API flag | present as `people.archived` — collides with journey term |
| Elvanto `status` active/suspended | login suspension | present as `people.status` — **directly contradicts people Non-Goal "No separate people.status column — journey grid is the status"** |

Also colliding: Elvanto `is_contact` bool vs journey stage `contact`; GDPR `deleted_privacy_data` stage vs anything Elvanto.

**Resolution:** rename sync-shadow columns: `people.elvanto_archived`, `people.elvanto_login_status`, `people.elvanto_is_contact`. Document that they never surface as app status. Add explicit GDPR rule: once `journey = deleted_privacy_data`, PII columns are nulled, row leaves sync scope, and (open question) an upstream `people/remove` erase job may be queued — extends core Gap #4 to Elvanto.

### 🔴 A-5 — No auth linkage despite RLS + phone-login decisions
Core #11 (RLS via `auth.uid()`), #56–#59 (phone identifiers sourced from people mobile; OTP resolves to existing account) require `people.auth_user_id uuid` joining `auth.users`. `schema.dbml` has no auth column and no RLS notes at all. Household-scoped RLS ("household sees own people") also needs `household_id` on people — absent.

**Resolution:** add `auth_user_id` (nullable unique), `household_id`, and per-table RLS posture notes (mirror tables = service-role/admin only; app tables per people-decision RLS section).

---

## B. Field-level inconsistencies (people)

| # | Decision says | schema.dbml / Elvanto says | Resolution |
|---|---|---|---|
| 🔴 B-1 | #34: contact channels first-class, `phone_type` enum, **replaces separate Phone/Mobile columns**; core #56/#58 need "the mobile" for auth | `people.phone varchar` + `people.mobile varchar` (Elvanto shape) | App table `contact_channels(person_id, type phone_type, value, is_primary)`; keep `mobile` as a **maintained mirror column** (primary mobile channel) used for auth-phone resolution + Elvanto write-back. Never edit the mirror directly. |
| 🔴 B-2 | #13/#38–45: journey grid replaces `people_category` + `locations[]`; gap-log #8 open on seeding | `people_categories` table + `people.category_id` FK + `people.locations jsonb` mirrored | Keep both **as sync-shadow only**: `elvanto_category_id`, drop app-facing category concept. Map `demographic ↔ Elvanto People Category` (Adult/Youth/Child ≈ category names). For gap #8: map each seeded journey track to an Elvanto location via `journey_tracks.elvanto_location_id`; derive initial stage per track from membership of `locations[]` (stage=regular default, admin reviews). |
| 🔴 B-3 | Households model (scope: `households`, `addresses`; address section on profile) | `families(id integer)` derived from int `family_id`; **no address columns at all** (also audit G-1: Elvanto home_/mailing_ blocks undocumented locally) | App `households(uuid pk, elvanto_family_id int unique null)` + `addresses(household_id, …)`. Elvanto person-level `home_*` fields read → household address of primary contact; write-back writes via primary contact only (lossy — document). |
| 🟡 B-4 | peopleFields marital_status: …**Partner**… | Elvanto enum uses **Defacto**; `schema.dbml` enum = `defacto` | App enum uses `partner`; transform maps partner↔defacto both directions. |
| 🟡 B-5 | #24–25: `kindy_start_year int` replaces school_year; School name field [Youth+Child] | `people.school_grade varchar` (Elvanto search-only field) | Add app columns `kindy_start_year int`, `school_name varchar`. Sync maps calculated year ↔ `school_grade` string ("Year N") — lossy, mark sync-shadow. |
| 🟡 B-6 | #37 + peopleFields: `access_permission` PG enum Public\|Member Area\|Team Leaders\|Admin\|SuperAdmin (= core #25 five levels); scope lists `user_roles` table | `people.is_admin boolean` only; Elvanto granular `access_permissions` string\|arr exists but unmapped | App stores enum (+ optional `user_roles` table per scope — decide which, see D-2). Transform: Admin/SuperAdmin ⇄ `admin=1`; others ⇄ `admin=0`. Elvanto `access_permissions` array left untouched (no decision yet). |
| 🟡 B-7 | #4: JSONB `custom_fields` for church-specific extensibility | `people.custom_fields jsonb` already means the **Elvanto EAV mirror** (`custom_<uuid>`) | Naming collision. Rename mirror to `elvanto_custom_fields`; app `custom_fields` JSONB stays app-owned. Note account currently defines 0 Elvanto custom fields (probe). |
| 🟡 B-8 | Child-safety (WWCC/SMT/SMC), consents, medical, guardian flags — full section set in peopleFields | **No Elvanto counterpart exists** (API has no such fields) | Store app-owned columns/tables; **never synced** (privacy-positive). Record explicitly in sync-design deny-list so nobody "helpfully" maps them to Elvanto custom fields later. |
| 🔵 B-9 | gender enum Male\|Female\|Blank | `Enum gender {male female}` (nullable col) | Fine; note blank=null convention. |
| 🔵 B-10 | Elvanto `deceased`, `security_code`, `receipt_name`, `giving_number`, `volunteer` have no decision-log consumer | present in schema | Keep as sync-shadow; tag "future giving module" consumers. |
| 🔵 B-11 | Guardian relationship vocabulary unspecified (`people_relationships.relationship_type`) vs Elvanto `family_relationship` enum (Primary Contact\|Spouse\|Partner\|Child\|Sibling\|Grandfather\|Grandmother\|Other) | — | Adopt Elvanto superset as seed values + add `guardian`/`carer` types app-side; Elvanto write-back maps guardian→Primary Contact where family-linked (lossy — document). |
| 🔵 B-12 | Internal tension: people #11 "tags for custom locations/journey tracks" vs #13/#43 (journey tables own this) | — | Mark #11 as partially superseded by #43 in decision doc (editorial fix). |

---

## C. Backward-compatible two-way sync — target design

### C-1 Partitioning rule (add to sync-design.md as new §0)
```
App-owned      → decisions govern; sync touches only mapped columns
Sync-shadow    → elvanto_* prefixed columns; written by sync only; never in app UI/API
Mirror tables  → Elvanto governs; keyed elvanto_id==id; future modules consume
```

### C-2 Per-field direction map (people)
| Field class | Pull (Elvanto→app) | Push (app→Elvanto) |
|---|---|---|
| names, email, birthday, anniversary, gender | ✔ | ✔ on explicit action |
| contact_channels | `phone`/`mobile` ← primary channels | `phone`/`mobile` → Elvanto columns |
| household/address | `family_id`+`home_*` → household mapping | family move via `family_id`; address via primary contact only |
| demographic ⇄ category, kindy_year ⇄ school_grade, access_permission ⇄ admin | pull to shadow/app columns | push derived values |
| journey grid, tags, relationships, child-safety, consents, medical | never pulled (no source) | never pushed (deny-list) |
| tombstone/deletion | missing-from-scan → `deleted_at` | explicit user delete → `people/remove` then tombstone locally |

### C-3 Schema delta sketch (people core)
```dbml
Table people {
  id uuid [pk]                       // app UUIDv7 — NOT Elvanto id (A-1)
  elvanto_id uuid [unique]           // adopted on first sync (A-1)
  auth_user_id uuid [unique]         // core #11/#58 (A-5)
  household_id uuid [ref: > households.id]
  deleted_at timestamptz             // core #26 / people #22 (A-2)
  firstname varchar [not null]
  preferred_name varchar
  lastname varchar [not null]
  middle_name varchar
  email varchar
  demographic demographic            // Adult|Youth|Child (B-2)
  gender gender
  date_of_birth date                 // = Elvanto birthday
  anniversary date
  marital_status marital_status      // app enum incl. partner (B-4)
  kindy_start_year integer           // B-5
  school_name varchar                // B-5
  access_permission access_permission // B-6
  journey jsonb                      // {track_id: stage_slug} CHECK <> '{}' (people #42–45)
  custom_fields jsonb                // app-owned extensibility (B-7)
  // ── sync shadow (B-1/B-2/A-4/B-10) ──
  mobile varchar                     // maintained mirror of primary mobile channel
  elvanto_category_id uuid
  elvanto_archived boolean
  elvanto_login_status person_status
  elvanto_is_contact boolean
  elvanto_deceased boolean
  elvanto_custom_fields jsonb
  elvanto_school_grade varchar
  elvanto_giving_number varchar
  _synced_at timestamptz [not null]
  _source_modified timestamptz
}
// plus: households(+elvanto_family_id), addresses, contact_channels,
// people_relationships, tags, people_tags, user_roles, journey_tracks(+elvanto_location_id),
// journey_track_categories, journey_stages, people_audit   (A-3)
```

### C-4 Contract amendments required in `sync-design.md`
1. §3: replace verbatim-PK rule with `id` + `elvanto_id` dual-key (A-1).
2. §4: DELETE → tombstone `deleted_at`; add GDPR scrub-exclusion rule (A-2/A-4).
3. §6: add mappings partner↔defacto, demographic↔category, kindy↔school_grade, access⇄admin (B-4..6).
4. §7 deny-list: add child-safety/consents/medical/journey/tags + renamed shadow columns (B-8).
5. New §0 partitioning rule (C-1).

---

## D. Future modules in Elvanto DB but absent from decision logs

Preserve all mirror tables unchanged; register as future module placeholders (module registry entries, toggled off):

| Elvanto domain | Tables | Suggested future module | Decision-log status |
|---|---|---|---|
| Giving/Financial | transactions, transaction_amounts, batches, financial_categories | "Giving" | none — keep mirror warm; people.giving_number/receipt_name shadows already retained (B-10) |
| Songs | songs, arrangements, song_keys, song_categories, memberships | "Songs/Worship" | none |
| Services plans | services, service_times, plan_items, volunteers, files, notes, service_types | "Services" (named in core plan as toggleable, undesigned) | mentioned only |
| Calendar | calendars, events, event_locations | "Calendar" (same) | mentioned only |
| People Flows | flows, steps, step_members | follow-up workflows — **do not conflate with journey grid** (flows = task pipelines; journey = engagement status) | none |

Design guardrails: mirror tables keep `_synced_at/_source_modified`; app FKs into mirrors only via `elvanto_id==id` stable keys; journey-grid redesign must not alter these tables.

## E. Open questions for decision owners
1. Address ownership: household-canonical with person override, or person-level? (affects Elvanto write-back path)
2. `user_roles` table vs single `access_permission` column — pick one (B-6/D-2).
3. Does GDPR erasure propagate upstream (queue `people/remove` in Elvanto)? (extends core Gap #4)
4. Journey-track ↔ Elvanto-location mapping: auto-create locations on push, or read-only mapping? (gap #8)
5. Are Elvanto accounts/logins (`username`, `elvanto_login_status`) ever provisioned by the app, or is Elvanto login out of scope given Supabase auth owns identity?
