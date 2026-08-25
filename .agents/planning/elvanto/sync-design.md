# Elvanto ↔ Supabase Sync Design Contract
Audience: LLM agents implementing/maintaining sync. Source research: `findings.md`. Schema: `schema.dbml`.
Rules here are binding — deviations require updating this file first.

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
- PKs mirror Elvanto IDs verbatim → upsert is idempotent, no mapping table.
- Exception: `families.id` is INT (Elvanto quirk). Families have no endpoint — derive from distinct `people.family_id` values each people-sync pass.
- Upsert = `INSERT ... ON CONFLICT (id) DO UPDATE`. Never delete+insert.
- Denormalized fields in payloads (e.g., transaction.person_first_name) are never stored — resolve FKs instead.

## 4. Deletes & Soft State
| Signal | Meaning | Action |
|---|---|---|
| Missing from full-scan | hard-deleted in Elvanto | delete row (cascade children) |
| person.archived=true | archived | keep row, flag |
| person.status=suspended | login suspended | keep row, flag |
| group.status=suspended | inactive | keep row, flag |
| song.status=1 | archived | keep row, flag |
| financial_categories.status=0 | archived | keep row, flag |

- Full-scan entities: reconcile deletes via ID-set diff (DB ids − payload ids = deletions).
- Date-filtered entities cannot detect deletes by diff → periodic (weekly) full reconciliation sweep.

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

## 7. Write-back Rules (Supabase → Elvanto)
Allowed targets & endpoints:
- people: create/edit/remove; family moves via family_id (`"new"` creates; blank-but-present removes from family)
- groups: create/edit/remove/addPerson/removePerson
- songs/arrangements/keys: create/edit
- calendar_events: create/edit/remove (locations/assets via *_replace/*_remove params)
- transactions/categories: create/edit/remove

Never write back:
- Any denormalized/read-only field: admin_notes, interval, batch obj, person_* on transactions, generated_in/status envelope
- transaction_amounts.external_notes (immutable upstream)
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
