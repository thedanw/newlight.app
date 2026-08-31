# Elvanto ↔ Supabase Sync Contract

**Audience:** LLM agents implementing/maintaining sync.  
**Source:** `ELVANTO_API_REFERENCE.md` (verified API), `schema.dbml` (logical model).  
**Rules here are binding** — deviations require updating this file first.

---

## 0. Data Partitioning & Ownership

Every synced column/table has exactly one owner:

| Partition | Governing rules | Sync may touch |
|---|---|---|
| **App-owned** | Core + people decision logs govern | Only mapped columns (see §4 matrix) |
| **Sync-shadow** (`elvanto_*` prefix) | Written by sync only; never surfaced in app UI/API | Wholly |
| **Mirror tables** | Elvanto governs; consumed by future modules (giving, songs, services, calendar, flows) | Wholly |

Field-level pull/push rules: **§4 matrix is authoritative**.

---

## 1. Direction & Topology

- Elvanto = source of truth for all 17 entities. Supabase = mirror + app-local extensions.
- Write-back to Elvanto **only via explicit user action** in the app (never automatic), and only through fields listed in §7.
- One sync worker (Cloudflare Worker cron or Supabase pg_cron + edge function). No client-side sync.
- **Auth:** API-key as standard (OAuth token refresh not implemented — 401 = fatal credentials). If OAuth adopted later, add token-refresh before 401-fatal branch.

---

## 2. Change Detection

- No webhooks exist. Poll only.
- Watermark per entity: store `_source_modified` = Elvanto `date_modified`; next poll uses it as cursor where API allows date filters.
- Date-filterable endpoints: `services/getAll` (start/end), `calendar/events/getAll` (start/end req), `financial/transactions/getAll` (start/end req).
- NOT filterable → full-scan diff every cycle: people, groups, songs, flows, calendars, categories.
  - Full-scan cost control: `page_size=1000`, iterate until `on_this_page < page_size`.
- `people/search` accepts `date_modified` as >= filter — usable as pseudo-cursor for people despite being a search endpoint.
- Clock rule: all Elvanto datetimes are UTC (`yyyy-mm-dd hh:mm:ss`). Store timestamptz; compare in UTC.

---

## 3. Identity & Upserts

- **Dual-key scheme** on every synced table:
  - `id uuid pk` (app PK, UUIDv7 for new rows)
  - `elvanto_id uuid unique null` (sync join key)
- Migrated rows: `id = elvanto_id` (adopted at import — runbook in `ELVANTO_MIGRATION_PLAN.md`).
- App-origin rows: app-generated UUID; `elvanto_id` stays null until first explicit push backfills it.
- **ALL sync joins use `elvanto_id`, never `id`.** Rows with null `elvanto_id` are invisible to pull matching.
- Exception: Elvanto family ids are INT → `households.elvanto_family_id integer unique`; app-created households capture the int lazily via the `family_id:"new"` push response.
- Upsert = `INSERT ... ON CONFLICT (elvanto_id) DO UPDATE`. Never delete+insert.
- Denormalized fields in payloads (e.g., transaction.person_first_name) are never stored — resolve FKs instead.

---

## 4. Field-Level Compatibility Matrix (Authoritative)

| App field (decision source) | Elvanto counterpart | Owner | Pull rule | Push rule |
|---|---|---|---|---|
| `households` + `addresses` | `family_id` int + person `home_*` block | app | seed/move per migration plan | member push w/ family_id; address via Primary Contact only |
| `contact_channels(type,value,is_primary)` | `phone`, `mobile` columns | app | `phone`→channel(home), `mobile`→channel(mobile, primary) | primary mobile channel→`mobile`; primary home channel→`phone` |
| `people.mobile` mirror (auth) | `mobile` | shadow | — | maintained by trigger/sync from channels; OTP resolution reads it |
| `journey` JSONB | `locations[]` (+ legacy category) | app | seed per migration plan; then shadow-only | **never** (deny-list) |
| `demographic` | People Category name | app | normalize; unmapped→review queue | map to existing category; missing→sync error (L-4) |
| `journey` JSONB (Sunday Services track) | People Category + `contact`/`archived`/`deceased`/`suspended` flags | app | **People Category mapping (see §4.1):**<br>• `Sunday Guest` → `guest`<br>• `Sunday Linked` → `linked`<br>• `Sunday Regular` → `regular`<br>• `Community Connection*` → `contact`<br>**Status overrides (applied in order):**<br>1. If `contact=1` OR `suspended=1` → `archived`<br>2. Else if `archived=1` OR `deceased=1` → `deleted_privacy_data`<br>3. Else apply category mapping above | **never** (deny-list — journey is app-owned) |
| `journey` JSONB (Campus tracks) | `locations[]` array | app | **Location → Track pairing (see §4.2):**<br>Each Elvanto location maps to a journey track via `journey_tracks.elvanto_location_id`.<br>If person has location L → set stage `contact` on that track (or `archived`/`deleted_privacy_data` per status overrides above).<br>If location not yet mapped → auto-create track under "Campus" category + review queue. | **never** (deny-list) |
| `marital_status` (incl. `partner`) | enum incl. `Defacto` | app | `Defacto`→`partner` | `partner`→`Defacto`; others identity |
| `kindy_start_year` | `school_grade` string | app | parse "Kindy"/"Year N" → `k = CURRENT_YEAR − N`; unparseable→null+review | derive at write: 0→"Kindy", N→"Year N"; only when Youth/Child |
| `school_name` | *(none)* | app | — | **never** (deny-list) |
| `access_permission` | `admin` 0/1 | app | `1`→`Admin` (**promote-only, never demote on pull**) | Admin/SuperAdmin→`1`; others→`0` |
| `custom_fields` JSONB | `custom_<uuid>` EAV | app | → `elvanto_custom_fields` shadow | app custom_fields never pushed; Elvanto customs pulled to shadow |
| child-safety WWCC/SMT/SMC, consents, medical | *(none)* | app | — | **never leaves the app** (deny-list, privacy) |
| `tags`, `people_tags` | *(none)* | app | — | never |
| `deleted_at` tombstone | hard removes; archived flags | app | missing-from-scan → `deleted_at=now()` + audit; `archived=1`/`deceased` → shadows (+ optional journey auto-archive) | explicit user delete → `people/remove` then local tombstone |
| GDPR `deleted_privacy_data` | *(none)* | app | row excluded from all sync once staged | upstream erase = manual admin checklist (L-5) |
| `gender` (blank) | Male/Female/'' | app | ''→null | null→'' |
| giving shadows (`receipt_name`, `giving_number`, `security_code`, `deceased`) | same-name fields | shadow | pull always | future Giving module decides |

---

## 4.1 People Category → Journey Grid Mapping (Sunday Services Track)

**Source:** Elvanto `people.category_id` → `people_categories.name`  
**Target:** `people.journey[<sunday_services_track_id>]` = stage slug

| Elvanto People Category | Mapped Journey Stage | Notes |
|---|---|---|
| `Sunday Guest` | `guest` | |
| `Sunday Linked` | `linked` | |
| `Sunday Regular` | `regular` | |
| `Community Connection*` (or any non-Sunday category) | `contact` | Default fallback |

**Status Overrides (applied in priority order, override category mapping):**

1. **If `contact=1` OR `suspended=1`** → stage = `archived` (person is contact-only or login-suspended)
2. **Else if `archived=1` OR `deceased=1`** → stage = `deleted_privacy_data` (terminal; PII scrubbed after 5 years)
3. **Else** → apply category mapping above

**Implementation notes:**
- The "Sunday Services" journey track must be seeded at migration (see `ELVANTO_MIGRATION_PLAN.md` §3) with a known `elvanto_location_id` = null (it's a category-derived track, not a location-derived track).
- Category names are matched case-insensitively after trimming `*` and `_` suffixes (Elvanto data has `Community Connection*`, `Sunday Regular_`).
- Unmapped categories → `contact` + review queue entry.

---

## 4.2 Elvanto Locations → Journey Tracks (Campus Tracks)

**Source:** Elvanto `person.locations.location[]` (array of `{id, name}`)  
**Target:** `people.journey[<track_id>]` = stage slug per track

**Pairing mechanism:** `journey_tracks.elvanto_location_id` (uuid, nullable, unique) stores the Elvanto location UUID.

| Elvanto Location | Journey Track | Stage Logic |
|---|---|---|
| `Central Campus` (uuid) | Track with `elvanto_location_id = Central Campus uuid` | If person has this location → `contact` (or `archived`/`deleted_privacy_data` per status overrides in §4.1) |
| `North Campus` (uuid) | Track with `elvanto_location_id = North Campus uuid` | Same |
| *Any other location* | Auto-create track under "Campus" category | Stage = `contact` + review queue |

**Sync behavior (ongoing, post-migration):**
- Pull: `people.elvanto_locations` (shadow JSONB) updated from `locations[]` for reference.
- Optional per-track switch `journey_tracks.follow_elvanto` (boolean, default `false`):
  - When `true`: location add/remove upstream toggles person on/off that track at stage `contact`.
  - When `false` (default): journey stages never auto-written from locations; admin manages manually.
- Stage overrides from §4.1 (contact/suspended → archived; archived/deceased → deleted_privacy_data) apply to location-derived tracks too.
- Never push journey stages to Elvanto (deny-list).

---

## 4.3 Elvanto Custom Fields → App Custom Fields

**Source:** Elvanto `custom_<uuid>` keys on person object (EAV pattern)  
**Target:** `people.elvanto_custom_fields` (shadow JSONB) + optional mapping to `people.custom_fields` (app-owned JSONB)

**Configuration:** Admin-configurable field mapping UI (see Sync Plugin UI Design) with:
- Column 1: App field (from `peopleFields.md` — all person profile fields)
- Column 2: Elvanto field dropdown (all `people/getInfo` fields + `custom_<uuid>` keys)
- Pre-populated from migration mappings (§4.1, §4.2, and standard field mappings in §4 matrix)
- Conditional logic support for complex mappings (e.g., "if category=Sunday Guest AND contact=0 → guest")

---

## 5. Sync Order (FK-safe, run topologically)

```
1  people_categories        8  service_types, locations
2  custom_fields (+values)  9  services → service_times → plan_items/volunteers/files/notes
3  families                 10 songs → song_categories → memberships → arrangements → song_keys
4  people                   11 calendars → calendar_events → event_locations
5  groups → group_members   12 people_flows → flow_steps → step_members
6  financial_categories     13 batches → transactions → transaction_amounts
7  (parallel safe: 5–13 after 4)
```
- Steps 6–12 are independent subtrees — parallelize across them, serialize within.

---

## 6. Type Normalization (API → Postgres)

| API shape | Postgres |
|---|---|
| int 0/1 flags | boolean |
| "true"/"false" strings (calendars.members/published) | boolean |
| yes/no request params | boolean (convert on write) |
| decimal-as-string ("360.00") **or bare number (125)** | numeric(12,2) |
| dt `yyyy-mm-dd hh:mm:ss` UTC | timestamptz |
| ISO8601+00:00 (transaction_datetime) | timestamptz |
| yyyy-mm-dd | date |
| HTML text | text (store raw; sanitize at render) |
| nested arr<{id,name}> | junction table or jsonb (see schema notes) |
| enum values arrive Capitalized ("Active", "Primary Contact") | lowercase snake_case before storing |
| marital_status `Defacto` ⇄ app `partner` | value map, both directions |
| People Category name ⇄ `demographic` enum | normalize adult/youth/child; unmapped → review queue; push requires an existing upstream category (L-4) |
| `school_grade` "Kindy"/"Year N" ⇄ `kindy_start_year` int | k = CURRENT_YEAR − N on pull; derive string at write |
| `admin` 0/1 ⇄ `access_permission` | pull promote-only (1→admin); push admin/super_admin→1, else 0 |
| money arrives as bare number OR decimal-string ("360.00") | accept both into numeric(12,2) |
| step `notifications` = `"y"`/"" | boolean |
| category `tax_deductible` input `y`/`n` output int `1`/`0` | boolean |

---

## 7. Write-back Rules (Supabase → Elvanto)

### Allowed targets & endpoints:
- **people:** create/edit/remove; family moves via family_id (`"new"` creates; blank-but-present removes from family); household address push via Primary Contact only (L-2)
- **groups:** create/edit/remove/addPerson/removePerson
- **songs/arrangements/keys:** create/edit (no delete endpoints exist — L-6)
- **calendar_events:** create/edit/remove (locations/assets via *_replace/*_remove params)
- **transactions:** create/edit/remove
- **financial categories:** **create only** — no edit/remove endpoints exist upstream (L-7) — **FIXED per api-audit**

### Push eligibility:
- Only rows with non-null `elvanto_id` participate in updates; app-origin rows push only on explicit user action (which backfills `elvanto_id`).
- Contact-only parents are never auto-pushed.

### Never write back (deny-list):
- Any denormalized/read-only field: admin_notes, interval, batch obj, person_* on transactions, generated_in/status envelope
- transaction_amounts.external_notes (immutable upstream)
- **App-owned partitions:** journey grid, tags, people_relationships guardian/carer types, child-safety (WWCC/SMT/SMC), consents, medical, school_name, app custom_fields JSONB
- Fields not accepted by create/edit (read shape ⊃ write shape)
- `peopleFlows/steps/addPerson` — documented but no consumer; explicit N/A

### Conflict policy:
Last-writer-wins with audit log (`sync_conflicts` table: entity, id, local_change, remote_change, resolved_as).

---

## 8. Error Handling

- Envelope `{error:{code,message}}`. Retry matrix:
  - 250/400/404 = no retry (fix request)
  - 401 = fatal (credentials) — **API-key standard; OAuth not implemented**
  - 429/5xx = exponential backoff ×3 then dead-letter queue row
- Every failed item logged to `sync_errors` (endpoint, payload, error, attempt_count) — sync continues past failures.
- Partial-page failure mid-scan: restart that entity's scan from its watermark, not global.

---

## 9. Rate & Volume Limits

- page_size max 1000. Throttle: ≤2 concurrent requests, honor 429 Retry-After.
- people_flow_step_members has NO pagination — single-shot fetch per step_id.
- Expected volumes (church-scale): people ~1k–50k, transactions ~10k/yr, songs ~1k. Full scans are cheap at this scale; don't over-engineer deltas.

---

## 10. Verification Checklist (per release)

- [ ] All 47 endpoints mapped in `ELVANTO_API_REFERENCE.md` have a consumer or explicit N/A note
- [ ] Upsert order (§5) enforced in code
- [ ] Delete reconciliation runs for full-scan entities
- [ ] Type normalization table (§6) covered by transform unit tests
- [ ] Write-back deny-list (§7) enforced by serializer allow-list
- [ ] Financial categories: create only (no edit/remove) — **verified**
- [ ] OAuth token refresh or API-key declaration documented — **API-key standard declared**

---

## Limitations Register (Declared Lossy/Impossible)

- **L-1** Household rename/merge/delete never propagates upstream (no family endpoints).
- **L-2** Address push updates Primary Contact only; other members' upstream addresses stale.
- **L-3** Non-resident / contact-only guardians cannot exist upstream.
- **L-4** New demographic values can't create Elvanto categories (read-only endpoint).
- **L-5** GDPR scrub is local-only; upstream erasure is a manual checklist (extends core Gap #4).
- **L-6** Songs/arrangements/keys have no delete endpoints — app archive only.
- **L-7** Financial categories are create-only upstream; edits/deletes app-local.
- **L-8** Services & flows are read-only mirrors (no write endpoints).