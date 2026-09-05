# Elvanto ↔ Supabase Sync Design Contract
Audience: LLM agents implementing/maintaining sync. Source research: `findings.md`. Schema: `schema.dbml`.
Rules here are binding — deviations require updating this file first.

## 0. Data Partitioning & Ownership
Every synced column/table has exactly one owner:
| Partition | Governing rules | Sync may touch |
|---|---|---|
| **App-owned** | core + people decision logs | only mapped columns (see `compatibility-design.md` §4 matrix) |
| **Sync-shadow** (`elvanto_*` prefix) | written by sync only; never surfaced in app UI/API | wholly |
| **Mirror tables** | Elvanto governs; consumed by future modules (giving, songs, services, calendar, flows) | wholly |

Field-level pull/push rules: `compatibility-design.md` §4 is the authoritative mapping matrix.

## 1. Direction & Topology
- Elvanto = source of truth for all 17 entities. Supabase = mirror + app-local extensions.
- Write-back to Elvanto only via explicit user action in the app (never automatic), and only through fields listed in §7.
- One sync worker (Cloudflare Worker cron or Supabase pg_cron + edge function). No client-side sync.

## 2. Change Detection
- No webhooks exist. Poll only.
- Watermark per entity: store `_source_modified` = Elvanto `date_modified`; next poll uses it as cursor where API allows date filters.
- Date-filterable endpoints: `services/getAll` (start/end), `calendar/events/getAll` (start/end req), `financial/transactions/getAll` (start/end req).
- NOT filterable → full-scan diff every cycle: people, groups, songs, flows, calendars, categories.
  - Full-scan cost control: page_size=1000, iterate until `on_this_page < page_size`.
- `people/search` accepts `date_modified` as >= filter — usable as pseudo-cursor for people despite being a search endpoint.
- Clock rule: all Elvanto datetimes are UTC (`yyyy-mm-dd hh:mm:ss`). Store timestamptz; compare in UTC.

## 3. Identity & Upserts
- Dual-key scheme on every synced table: `id uuid pk` (app PK) + `elvanto_id uuid unique null` (sync join key).
  - Migrated rows: `id = elvanto_id` (adopted at import — runbook in `compatibility-design.md` §6).
  - App-origin rows: app-generated UUID; `elvanto_id` stays null until first explicit push backfills it.
- ALL sync joins use `elvanto_id`, never `id`. Rows with null `elvanto_id` are invisible to pull matching.
- Exception: Elvanto family ids are INT → `households.elvanto_family_id integer unique`; app-created households capture the int lazily via the `family_id:"new"` push response.
- Upsert = `INSERT ... ON CONFLICT (elvanto_id) DO UPDATE`. Never delete+insert.
- Denormalized fields in payloads (e.g., transaction.person_first_name) are never stored — resolve FKs instead.

## 4. Deletes & Soft State
Sync NEVER issues SQL DELETE (core #26 / people #22 soft-delete mandate). Missing upstream ⇒ tombstone.

| Signal | Meaning | Action |
|---|---|---|
| Missing from full-scan | removed in Elvanto | set `deleted_at=now()` + people_audit('sync'); cascades become cascade tombstones |
| person.archived=true | archived upstream | shadow `elvanto_archived`; optional journey auto-archive (per-track switch) |
| person.deceased=true | deceased | shadow + journey archived; excluded from notifications/OTP |
| person.status=suspended | login suspended | shadow `elvanto_login_status` |
| group.status=suspended / song.status=1 / financial_categories.status=0 | inactive/archived | keep row, flag |

- Full-scan entities: reconcile via ID-set diff (DB elvanto_ids − payload ids = tombstones).
- Date-filtered entities cannot detect deletes by diff → periodic (weekly) full reconciliation sweep.
- GDPR: once `journey = deleted_privacy_data`, scrub PII columns and exclude the row from all sync scopes; upstream erase = manual admin checklist (L-5).
- Explicit user delete in app → push the `remove` endpoint first, then local tombstone (row retained).

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

## 6. Type Normalization (API → Postgres)
| API shape | Postgres |
|---|---|
| int 0/1 flags | boolean |
| "true"/"false" strings (calendars.members/published) | boolean |
| yes/no request params | boolean (convert on write) |
| decimal-as-string ("360.00") | numeric(12,2) |
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

## 7. Write-back Rules (Supabase → Elvanto)
Allowed targets & endpoints:
- people: create/edit/remove; family moves via family_id (`"new"` creates; blank-but-present removes from family); household address push via Primary Contact only (L-2)
- groups: create/edit/remove/addPerson/removePerson
- songs/arrangements/keys: create/edit (no delete endpoints exist — L-6)
- calendar_events: create/edit/remove (locations/assets via *_replace/*_remove params)
- transactions: create/edit/remove; financial categories: **create only** — no edit/remove endpoints exist upstream (L-7)

Push eligibility:
- Only rows with non-null `elvanto_id` participate in updates; app-origin rows push only on explicit user action (which backfills `elvanto_id`).
- Contact-only parents (#46–47) are never auto-pushed.

Never write back:
- Any denormalized/read-only field: admin_notes, interval, batch obj, person_* on transactions, generated_in/status envelope
- transaction_amounts.external_notes (immutable upstream)
- App-owned partitions: journey grid, tags, people_relationships guardian/carer types, child-safety (WWCC/SMT/SMC), consents, medical, school_name, app custom_fields JSONB
- Fields not accepted by create/edit (read shape ⊃ write shape)

Conflict policy: last-writer-wins with audit log (`sync_conflicts` table: entity, id, local_change, remote_change, resolved_as).

## 8. Error Handling
- Envelope `{error:{code,message}}`. Retry matrix: 250/400/404 = no retry (fix request); 401 = fatal (credentials); 429/5xx = exponential backoff ×3 then dead-letter queue row.
- Every failed item logged to `sync_errors` (endpoint, payload, error, attempt_count) — sync continues past failures.
- Partial-page failure mid-scan: restart that entity's scan from its watermark, not global.

## 9. Rate & Volume Limits
- page_size max 1000. Throttle: ≤2 concurrent requests, honor 429 Retry-After.
- people_flow_step_members has NO pagination — single-shot fetch per step_id.
- Expected volumes (church-scale): people ~1k–50k, transactions ~10k/yr, songs ~1k. Full scans are cheap at this scale; don't over-engineer deltas.

## 10. Verification Checklist (per release)
- [ ] All 47 endpoints mapped in findings.md have a consumer or explicit N/A note
- [ ] Upsert order (§5) enforced in code
- [ ] Delete reconciliation runs for full-scan entities
- [ ] Type normalization table (§6) covered by transform unit tests
- [ ] Write-back deny-list (§7) enforced by serializer allow-list
