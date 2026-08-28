# Elvanto Migration Plan — One-Time Cutover

**Date:** 2026-08-25  
**Premise:** The database is built to the decision logs (households, contact channels, journey grid, kindy_start_year, soft delete…), but **all existing data lives in Elvanto** and migrates once. After cutover, both systems stay in sync per `ELVANTO_SYNC_CONTRACT.md`.

---

## 0. Principles

1. **Decision log governs the app model; Elvanto governs only what it owns.** Every synced column gets an explicit owner: `app` · `elvanto` · `shadow` (Elvanto-written, app-readable, never in UI).
2. **Migration adopts Elvanto identity** (IDs, timestamps); divergence starts at cutover, not before.
3. **Write-back stays explicit-action-only** (`ELVANTO_SYNC_CONTRACT.md` §1). Pull is automatic; push never fires from a cron.
4. **Lossy mappings are allowed but must be declared** in the compatibility matrix (§4 of sync contract) — no silent truncation.
5. **Idempotent, resumable migration** — every phase re-runnable; counts verified against probe totals (5,039 people / 45 groups / 142 songs / 200 services / 199 events).

---

## 1. Identity & Primary Keys (Resolves Dual-Key Strategy)

Dual-key scheme on every synced table:

```
id          uuid pk            -- app PK. Migrated rows: = Elvanto UUID. New rows: app-generated UUIDv7.
elvanto_id  uuid unique null   -- sync join key. Migrated rows: same as id. App-origin rows: null until first push.
```

Rules:
- **All sync joins use `elvanto_id`, never `id`.** Elvanto-side ID references inside payloads (category_id, family_id…) resolve via this column.
- Migration seeds `id = elvanto_id` → zero remapping of internal Elvanto FKs during import.
- App-created rows (admin invite form) get `id = uuidv7()`, `elvanto_id = null`, and are **excluded from pull-matches** until pushed. Push happens only on explicit user action; `people/create` response `{id}` backfills `elvanto_id`.
- Contact-only parents (people #46–47) are app rows with `elvanto_id = null` → naturally not synced until an admin explicitly pushes them.

---

## 2. Households ⇄ Elvanto Families (The Model Case)

**Reality:** Elvanto has no family endpoints — `family_id` (int) is only readable from person objects and writable only via `people/create|edit` (`family_id: <int>` joins, `"new"` creates, blank-but-present removes). No rename, merge, delete, or address-on-family exists upstream.

**Mechanism:**

```dbml
Table households {
  id uuid [pk]                       -- app UUID
  elvanto_family_id integer [unique] -- captured at migration or on first push
  name varchar                        -- app-only label ("The Smith Family")
  deleted_at timestamptz
}
Table addresses {
  id uuid [pk]
  household_id uuid [ref: > households.id]
  line1 varchar
  line2 varchar
  suburb varchar
  state varchar
  postcode varchar
  kind address_kind                   -- home | postal (app extensible)
}
```

| Operation | How it works |
|---|---|
| **Migrate** | One household per distinct `people.family_id`; members linked via `people.household_id`. `elvanto_family_id` = that int. Household name derived `"{Surname} Family"` (editable). |
| **Pull membership change** | Person's `family_id` changes upstream → move `household_id` to household with matching `elvanto_family_id`; if unseen int → auto-create household shell + review flag. |
| **Create household in app** | Local-only until a member is pushed. On member push, send `family_id: "new"` → capture returned int into `households.elvanto_family_id`. Subsequent members pushed with that int. |
| **Move person between households (app)** | Explicit action → `people/edit {id, family_id: <target int>}`. |
| **Remove from household** | `people/edit {id, family_id: ""}` (blank-but-present semantics). |
| **Rename / merge / delete household** | **App-only — impossible upstream.** Limitation L-1. |
| **Address** | Owner: `app` for household address. Pull seeds it once from the Primary Contact's `home_*` fields. Push writes the household address to the **Primary Contact only** via `people/edit` fields (`home_address…`) — other members' upstream addresses go stale (L-2). |

Family-role vocabulary: adopted verbatim from Elvanto (`Primary Contact|Spouse|Partner|Child|Sibling|Grandfather|Grandmother|Other`) as the seed list for `people_relationships.relationship_type`, extended app-side with `guardian`, `carer`. Pairwise guardian links are **derived at migration**: parent-type × child-type within a family → `guardian` rows (plus `is_primary` for Primary Contact). Push-back of guardians is limited to keeping `family_relationship` correct on family members; non-resident/contact-only guardians cannot be represented upstream (L-3).

---

## 3. Journey Grid ⇄ Categories + Locations[] (Resolves Gap #8)

**One-time seeding algorithm** (migration phase P4):

```
for each migrated person:
  demographic ← normalize(people_category.name)     # adult/youth/child; unmapped → 'adult' + review queue
  for each location L in person.locations[]:
    track ← journey_tracks WHERE elvanto_location_id = L.id
            (auto-create track under seeded category if new)
    stage ← 'archived' if person.elvanto_archived or deceased
            else 'regular' if person.volunteer=1 or person ∈ any group
            else 'contact'
    people.journey[track.id] = stage
  audit(person, field='journey_track', change_reason='migration')
```

Every seeded value is logged with a new `change_reason = 'migration'` so admins can filter the whole batch in the grid and correct en masse. Conservative default (`contact`) understates engagement rather than fabricating it.

**Ongoing ownership:** `journey` is **app-owned** after cutover. Elvanto `locations[]` continues to be pulled into `people.elvanto_locations jsonb` (shadow) for reference/re-seeding, but never writes `journey` automatically. Optional per-track switch `follow_elvanto boolean` (default off): when on, membership add/remove upstream toggles the person on/off that track at stage `contact`. Stages themselves have **no upstream destination — never pushed** (deny-list).

Demographic ⇄ People Category: pull normalizes name→enum. Push maps enum→existing Elvanto category by name; if no matching category exists upstream it **cannot be created** (no category write endpoints) → surfaced as a sync error, not a silent skip (L-4).

---

## 4. Schema Delta (People Core — from decision-alignment.md C-3)

```dbml
Table people {
  id uuid [pk]                       -- app UUIDv7 — NOT Elvanto id
  elvanto_id uuid [unique]           -- adopted on first sync
  auth_user_id uuid [unique]         -- core #11/#58
  household_id uuid [ref: > households.id]
  deleted_at timestamptz             -- core #26 / people #22
  firstname varchar [not null]
  preferred_name varchar
  lastname varchar [not null]
  middle_name varchar
  email varchar
  demographic demographic            -- Adult|Youth|Child
  gender gender
  date_of_birth date                 -- = Elvanto birthday
  anniversary date
  marital_status marital_status      -- app enum incl. partner
  kindy_start_year integer
  school_name varchar
  access_permission access_permission
  journey jsonb                      -- {track_id: stage_slug} CHECK <> '{}'
  custom_fields jsonb                -- app-owned extensibility
  // ── sync shadow ──
  mobile varchar                     -- maintained mirror of primary mobile channel
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
// journey_track_categories, journey_stages, people_audit
```

---

## 5. Migration Runbook (Ordered, Idempotent)

| Phase | Action | Verify |
|---|---|---|
| P0 | Create unified schema (app-owned + shadows + mirrors, dual keys, RLS) | migration lint |
| P1 | Reference pulls: people_categories, custom_fields (0 today), song/service/financial categories, calendars | row counts vs probe |
| P2 | People pass: persons → dual-key rows; derive households + addresses (§2); contact_channels; shadows; demographics | **5,039** people; households = distinct family_ids |
| P3 | Groups + memberships (nested people arrays) | 45 groups |
| P4 | Journey seeding algorithm (§3) + `change_reason='migration'` audit rows | every person ≥1 track (#42 CHECK holds) |
| P5 | Flows/steps/members (read-mostly) | counts |
| P6 | Services/times/plans/volunteers/files/notes; songs/arrangements/keys | 200 services ±1y; 142 songs |
| P7 | Calendar events (incl. `"services"` pseudo-calendar events; calendar_id nullable) | 199 events |
| P8 | Financial (currently empty upstream — tables ready, zero rows) | 0 expected |
| P9 | Cutover: enable poll worker; freeze pushes for first cycle; diff report | second-run zero-delta |

**Re-run safety:** Every phase upserts on `elvanto_id`; phases skip already-complete work via `_synced_at`.

---

## 6. Required Amendments (Apply After Migration)

1. **`people/decision.md`**: extend `people_audit.change_reason` enum with `'migration'` and `'sync'`.
2. **`ELVANTO_SYNC_CONTRACT.md`**: already incorporates §0 partitioning rule; §3 dual-key rewrite; §4 tombstone-not-delete; §6 add mapping table; §7 deny-list additions (journey, tags, child-safety, consents, medical, school_name).
3. **`schema.dbml`**: apply renames (`elvanto_*` shadows), add `households`, `addresses`, `contact_channels`, `people_relationships`, `tags`, `user_roles`, `journey_*`, `people_audit`, `module_config`, `platform_settings`; add `elvanto_id` to every synced table; make `calendar_events.calendar_id` nullable.

---

## 7. Limitations Register (Declared Lossy/Impossible)

- **L-1** Household rename/merge/delete never propagates upstream (no family endpoints).
- **L-2** Address push updates Primary Contact only; other members' upstream addresses stale.
- **L-3** Non-resident / contact-only guardians cannot exist upstream.
- **L-4** New demographic values can't create Elvanto categories (read-only endpoint).
- **L-5** GDPR scrub is local-only; upstream erasure is a manual checklist (extends core Gap #4).
- **L-6** Songs/arrangements/keys have no delete endpoints — app archive only.
- **L-7** Financial categories are create-only upstream; edits/deletes app-local.
- **L-8** Services & flows are read-only mirrors (no write endpoints).

---

## 8. Open Questions for Decision Owners (from decision-alignment.md §E)

1. Address ownership: household-canonical with person override, or person-level? (affects Elvanto write-back path)
2. `user_roles` table vs single `access_permission` column — pick one.
3. Does GDPR erasure propagate upstream (queue `people/remove` in Elvanto)? (extends core Gap #4)
4. Journey-track ↔ Elvanto-location mapping: auto-create locations on push, or read-only mapping? (gap #8)
5. Are Elvanto accounts/logins (`username`, `elvanto_login_status`) ever provisioned by the app, or is Elvanto login out of scope given Supabase auth owns identity?