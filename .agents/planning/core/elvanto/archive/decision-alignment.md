# Decision-Log Alignment — Elvanto Schema vs Core + People

**Date:** 2026-08-25 · **vs:** `schema.dbml`+`sync-design.md`/`findings.md` ⟷ `core/decision.md`, `people/decision.md`, `peopleFields.md`.
**Principle:** Decision logs win; Elvanto adapts. Unlogged Elvanto modules kept as mirror placeholders.

Severity: 🔴 blocks build · 🟡 resolve before migration · 🔵 naming/doc hygiene

| Area | Result |
|---|---|
| Architecture | 🔴 PK/identity, hard-delete vs soft-delete, missing app-owned tables |
| People data model | 🟡 ~10 field conflicts (channels, journey, households, enums, roles) |
| Future modules | ✅ Mirror tables don't contradict decisions — keep |
| Sync contract | 🟡 §3 verbatim PKs & §4 hard DELETE must amend |

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)

```
Decision logs win (over Elvanto schema)
├── A-1  App-first PKs + nullable elvanto_id dual-key (replaces §3 verbatim-PK rule)
├── A-2  Soft-delete tombstones only; no SQL DELETE in sync (replaces §4 hard-delete)
├── A-3  Unified schema: app-owned / sync-shadow (elvanto_*) / mirror partitions
├── A-4  Rename shadow columns (elvanto_archived, elvanto_login_status, elvanto_is_contact)
└── A-5  Add auth_user_id + household_id for RLS + phone-login (#11/#56–59)
B-group  Fields (B-1..12): channels, journey, hhs, defacto, kindy, role, customs, deny-list
C-group  Contract: dual-key §3, tombstone §4, maps §6, deny §7, partition §0
D-group  Modules: giving, songs, services, calendar, flows → mirror unchanged
```

---

## A. Architecture inconsistencies

### 🔴 A-1 — PK strategy: verbatim Elvanto UUIDs vs app-first
§3 keys tables on Elvanto UUID; but app-first CRM (admin invite #9, in-app creation) yields rows whose Elvanto id is unknown upfront (server-generated).
**Resolution:** app UUID PKs; nullable unique `elvanto_id` per synced table. Elvanto-origin rows adopt UUID as both `id`+`elvanto_id`; app rows fill `elvanto_id` on first match. Join upserts on `elvanto_id`. Amend §3.

### 🔴 A-2 — Hard-delete vs soft-delete
Core #26 / people #22 demand `deleted_at` tombstones; `schema.dbml` lacks it; §4 hard-deletes missing rows.
**Resolution:** sync never DELETEs. Missing/upstream-remove → `deleted_at`; RLS filters `IS NULL`; cascades become tombstones. GDPR `deleted_privacy_data` nulls PII + exits sync (A-4).

### 🔴 A-3 — App-owned tables absent
Missing: `households`,`addresses`,`people_relationships`,`tags`,`people_tags`,`user_roles`,`journey_*`,`people_audit`,`module_config`,`platform_settings`.
**Resolution:** 3 partitions: **(1)** App-owned (decisions govern), **(2)** Sync-shadow (`elvanto_*`, sync-written), **(3)** Mirror (Elvanto-governed; future modules).

### 🔴 A-4 — Four overlapping "removed" vocabularies

| Concept | Source | State |
|---|---|---|
| Soft delete `deleted_at` | core #26 / people #22 | ❌ missing |
| Journey `archived` | people #15/#45 | ❌ no journey tables |
| Elvanto `archived` bool | API | collides with journey term |
| Elvanto `status` active/suspended | API | contradicts people "journey grid = status" |

Also collide: `is_contact` vs journey `contact`; GDPR `deleted_privacy_data` vs Elvanto.
**Resolution:** rename → `elvanto_archived`, `elvanto_login_status`, `elvanto_is_contact`. GDPR: journey=`deleted_privacy_data` → null PII, leave sync scope (extends core Gap #4).

### 🔴 A-5 — No auth linkage
Core #11 (`auth.uid()` RLS), #56–59 (phone-login) need `auth_user_id` + `household_id` on people; neither exists.
**Resolution:** add `auth_user_id` (nullable unique), `household_id`; per-table RLS notes (mirror = admin-only; app tables per people-RLS).

---

## B. Field-level inconsistencies (people)

| # | Decision | schema.dbml / Elvanto | Resolution |
|---|---|---|---|
| 🔴 B-1 | #34/#56/#58: contact_channels w/ `phone_type` enum; “the mobile” for auth | `phone`+`mobile` varchar | App `contact_channels` tbl; keep `mobile` as mirror (auth-phone + write-back) |
| 🔴 B-2 | #13/#38–45: journey grid replaces `people_category`+`locations[]` | `categories`+FK+`jsonb` | Shadow-only; map `demographic↔category`. Gap #8: `journey_tracks.elvanto_location_id` |
| 🔴 B-3 | Households: `households`,`addresses`, addr section | `families(int)` via `family_id`; no addr cols | App `households(uuid, elvanto_family_id)`+`addresses(hhid,…)`; `home_*`→hh addr of primary contact (lossy WB) |
| 🟡 B-4 | marital_status incl. Partner | Elvanto Defacto | Transform `partner↔defacto` bi-directional |
| 🟡 B-5 | #24–25: `kindy_start_year int` replaces school_year | `school_grade varchar` (search-only) | Add `kindy_start_year`+`school_name`; calc-year ↔ “Year N” (lossy shadow) |
| 🟡 B-6 | #37+: `access_permission` PG enum (5 lvl); scope `user_roles` | `is_admin boolean` | Enum (or `user_roles` — D-2). Admin/SuperAdmin ⇄ `admin=1` |
| 🟡 B-7 | #4: JSONB `custom_fields` ext | `custom_fields` = Elvanto EAV mirror | Rename mirror→`elvanto_custom_fields`; app `custom_fields` owned |
| 🟡 B-8 | Child-safety (WWCC/SMT)/consents/med/guardians | No Elvanto equiv | App-only; **never synced** — deny-list |
| 🔵 B-9 | gender Male/Female/Blank | `{male,female}` nullable | OK; blank=null |
| 🔵 B-10 | deceased/security_code/receipt/giving_no/volunteer | present | Shadow; tag “future giving” |
| 🔵 B-11 | Guardian rel-vocab vs `family_relationship` enum | — | Seed Elvanto superset + `guardian/carer`; WB guardian→PrimaryContact (lossy) |
| 🔵 B-12 | #11 tags-for-journeys vs #13/#43 | — | Mark #11 partly superseded by #43 (editorial) |

---

## C. Sync target design

### C-1 Partitioning rule (new §0 for sync-design.md)
```
App-owned    → decisions govern; sync touches only mapped columns
Sync-shadow  → elvanto_* prefix; written by sync only; never in app UI/API
Mirror       → Elvanto governs; keyed elvanto_id==id; future modules
```

### C-2 Per-field direction map (people)
| Field class | Pull (Elvanto→app) | Push (app→Elvanto) |
|---|---|---|
| names/email/bday/anniversary/gender | ✔ | ✔ on explicit action |
| contact_channels | `phone`/`mobile`←primaries | → Elvanto cols |
| household/addr | `family_id`+`home_*`→hh | fam via `family_id`; addr via prim-contact |
| demo/kindy/access | pull to shadow/app | push derived |
| journey/tags/rels/child-safe/consents/med | ✖ | ✖ (deny-list) |
| tombstone | miss→`deleted_at` | del→local tombstone |

### C-3 Schema sketch (people core)
```dbml
Table people {
  id uuid [pk]; elvanto_id uuid [unique]
  auth_user_id uuid [unique]; household_id uuid [ref: > households.id]
  deleted_at timestamptz               // #26/#22 (A-2)
  firstname/preferred/lastname/middle varchar; email varchar
  demographic demographic; gender gender
  date_of_birth date; anniversary date
  marital_status marital_status        // incl. partner (B-4)
  kindy_start_year int; school_name varchar     // B-5
  access_permission access_permission  // B-6
  journey jsonb                        // {track_id: stage_slug} (#42–45)
  custom_fields jsonb                  // app-owned (B-7)
  // sync shadow
  mobile varchar; elvanto_category_id; elvanto_archived boolean
  elvanto_login_status; elvanto_is_contact boolean; elvanto_deceased boolean
  elvanto_custom_fields; elvanto_school_grade varchar; elvanto_giving_number varchar
  _synced_at; _source_modified timestamptz
}
// + households, addresses, contact_channels, people_relationships,
//   tags, people_tags, user_roles, journey_tracks, journey_*, people_audit (A-3)
```

### C-4 Amendments (`sync-design.md`)
1. §3 dual-key (`id`+`elvanto_id`) replaces verbatim-PK
2. §4 DELETE→tombstone `deleted_at`; GDPR scrub-exclusion
3. §6 transforms: partner↔defacto, demogr↔cat, kindy↔grade, access⇔admin
4. §7 deny-list: child-safe/consents/med/journey/tags + renamed shadows
5. New §0 partitioning (C-1)

---

## D. Future Elvanto modules

Preserve mirror tables unchanged; register as toggled-off placeholders:

| Domain | Tables | Future module | Status |
|---|---|---|---|
| Giving | transactions, batches, financial_categories | "Giving" | none — `giving_number`/`receipt_name` shadows retained (B-10) |
| Songs | songs, arrangements, song_keys, memberships | "Songs/Worship" | none |
| Services | services, service_times, plan_items, volunteers | "Services" | mentioned only |
| Calendar | calendars, events, event_locations | "Calendar" | mentioned only |
| Flows | flows, steps, step_members | "Follow-up" — **not** journey grid (task pipelines vs engagement status) | none |

Guardrails: `_synced_at/_source_modified` on mirrors; app FKs via `elvanto_id==id` only.

## E. Open questions
1. Address ownership: household-canonical with person override, or person-level?
2. `user_roles` table vs single `access_permission` column — pick one (B-6/D-2)
3. GDPR erasure propagate upstream (queue `people/remove`)? — extends core Gap #4
4. Journey-track ↔ Elvanto-location: auto-create on push, or read-only mapping? (gap #8)
5. Elvanto accounts/logins provisioned by app, or out of scope (Supabase auth owns identity)?
