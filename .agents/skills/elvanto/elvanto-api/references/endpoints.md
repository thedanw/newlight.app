# Endpoint Reference

All: `POST https://api.elvanto.com/v1/{endpoint}.{json|xml|php}`

---

## People

### people/getAll
`people` → `person[]`. **Params:** `query`, `category_id`, `include` (archived, unconsented, contact, volunteers), `fields[]`, `order_by`, `order_direction`, `custom_field`. **Errors:** 250, 401.

### people/search
`people` → `person[]`. **Required:** `search` (object). **Params:** `page`, `page_size`, `fields[]`. **Errors:** 250, 404.

**Searchable fields** — See `references/people-fields.md` for full field definitions. The following fields can be used as keys in the `search` object:
- `date_added`, `date_modified`, `last_login` — datetime (UTC, `>=` comparison)
- `category_id` — exact match
- `firstname`, `preferred_name`, `lastname`, `email`, `phone`, `mobile` — partial match
- `archived`, `contact`, `deceased` — `"Yes"`/`"No"` (mutually exclusive)
- `volunteer` — `"Yes"`/`"No"`
- `gender` — `"Male"`/`"Female"`
- `birthday`, `anniversary` — date (`YYYY-MM-DD`)
- `school_grade`, `marital_status`, `development_child`, `special_needs_child`, `security_code`, `receipt_name`, `giving_number`
- `groups` — string or array of group names/IDs
- `custom_{ID}` — custom field by ID from `people/customFields/getAll`

**Date search behavior:**
- All datetime fields (`date_added`, `date_modified`, `last_login`) use **UTC** and **greater-than-or-equal** comparison (`>=`).
- Date-only format (`YYYY-MM-DD`) is treated as midnight UTC start of that day.
- To find all profiles modified after a specific date: `search: { "date_modified": "2026-01-01" }` returns all people with `date_modified >= 2026-01-01 00:00:00 UTC`.
- date_entered, `date_modified` and `last_login` parameters will be searched as: `parameter.date_modified >= person.date_modified` (greater than or equal to).
- `date_modified` is the **primary field for incremental sync** (see `people-fields.md`).

**Example — Incremental sync by date_modified:**
```json
{
  "page": 1,
  "page_size": 1000,
  "search": {
    "date_modified": "2026-01-01"
  },
  "fields": ["id", "date_modified", "firstname", "lastname", "email", "mobile", "archived", "volunteer"]
}
```
Loop pages while `page * page_size < total` to fetch all modified records.

### people/getInfo
`people` → `person[]`. **Required:** `id` (string|array). **Params:** `fields[]`, `include` (unconsented, archived). **Errors:** 404.

### people/create
`person` → `{id}`. **Required:** `firstname`, `lastname`. **Key params:** `email`, `phone`, `department_id` (3-level `||`), `service_type_id[]`, `location_id[]`, `custom_{ID}`, `family` (array of `{id, relationship}`), `reports_to`. **Errors:** 401.

### people/edit
Same as `create`, plus `id` (required). **Errors:** 404.

### people/remove
`person` → `{id}`. **Required:** `id`. **Errors:** 404.

### people/currentUser
No params. `person` with current user info.

### people/categories/getAll
`categories` → `category[]` (id, name). Pagination only.

### people/customFields/getAll
`custom_fields` → `custom_field[]` (id, name, type, category_id). Pagination only.

---

## People Flows

### peopleFlows/getAll
`people_flows` → `people_flow[]`. **Params:** `status` (active|completed).

### peopleFlows/steps/getAll
`people_flow_steps` → `people_flow_step[]`. **Required:** `flow_id`. Steps use `step_due` type-based calculation.

### peopleFlows/steps/people
`people_flow_step_members` → `people_flow_step_member[]`. **Required:** `step_id`. **Params:** `status` (complete, notstarted, pending, inprogress), `assigned` (admin UUID|unassigned). No pagination. **Errors:** 250.

### peopleFlows/steps/addPerson
`step_person[]` (IDs). **Required:** `step_id`, `person_id`. **Params:** `assign_to` (admin UUID). **Errors:** 250.

---

## Groups

### groups/getAll
`groups` → `group[]` (id, name, status, meeting_address, etc.).

### groups/getInfo
`group` with full details + `people[]`. **Required:** `id`. **Errors:** 404.

### groups/create
`group` → `{id}`. **Required:** `name`. **Params:** `status` (active|suspended), `meeting_address`, `meeting_city`, `meeting_state`, `meeting_postcode`, `meeting_country`, `meeting_start_date`, `meeting_start_time`, `meeting_end_time`, `meeting_end_date`, `meeting_frequency` (object), `fields[]`.

### groups/edit
Same as `create`, plus `id` (required). **Errors:** 404.

### groups/remove
`person` → `{id}` (returns person key). **Required:** `id`. **Errors:** 404.

### groups/addPerson
`group` → `{id, person_id}`. **Required:** `id`, `person_id`. **Params:** `position` (Leader|Assistant Leader). **Errors:** 404.

### groups/removePerson
`group` → `{id, person_id}`. **Required:** `id`, `person_id`. **Errors:** 404.

---

## Services

### services/getAll
`services` → `service[]`. **Params:** `all` (yes for past), `start`, `end`, `status` (published|draft), `service_types[]`, `fields[]`. **Errors:** 250, 404.

### services/getInfo
`service[]` (full + `fields[]`). **Required:** `id`. **Errors:** 401, 404.

### services/planTemplates/getAll
`templates` → `template[]`. Pagination only.

---

## Songs

### songs/getAll
`songs` → `song[]` (id, status, title, number, artist, etc.). **Params:** `search`, `filter`, `fields[]`, `include` (archived).

### songs/getInfo
`song[]` (with categories, locations arrays). **Required:** `id`. **Params:** `files`. **Errors:** 401, 404.

### songs/create
`song` → `{id, arrangements: [{id, keys: [{id}]}]}`. **Required:** `title`, `arrangements[]` (each needs `name`). **Params:** `status` (0=Published, 1=Archived), `number` (CCLI), `item` (0=Song, 1=Item), `learn`, `allow_downloads`. **Arrangement fields:** name, `keys[]`, copyright, `sequence[]`, minutes, seconds, bpm, chord_chart_key, chord_chart.

### songs/edit
`song` → `{id}`. **Required:** `id`. **Params:** `title`, `status`, `number`, `item`, `learn`, `allow_downloads`.

### songs/remove
`song` → `{id}`. **Required:** `id`. **Errors:** 404.

### songs/categories/getAll
> Status: Documentation page returns HTTP 500. Endpoint exists per Songs section but details unknown.

### songs/arrangements/getAll
`arrangements` → `arrangement[]`. **Required:** `song_id`. **Params:** `chord_chart_key` (transpose), `files`. **Errors:** 250, 401, 404.

### songs/arrangements/getInfo
`arrangement[]` (full fields). **Required:** `id`. **Params:** `chord_chart_key`, `files`. **Errors:** 250, 401, 404.

### songs/arrangements/create
`arrangements` → `{id, keys: [{id, name}]}`. **Required:** `song_id`, `name`. **Params:** `copyright`, `sequence[]` (section names), `minutes`, `seconds`, `bpm`, `key_male`, `key_female`, `chord_chart_key`, `chord_chart` (ChordPro), `keys[]`.

### songs/arrangements/edit
`arrangement` → `{id}`. **Required:** `id` (not `song_id`). Same params as `create`.

### songs/keys/getAll
`keys` → `key[]`. **Required:** `arrangement_id`. **Params:** `files`. **Errors:** 250, 401, 404.

### songs/keys/getInfo
`key[]` (full fields). **Required:** `id`. **Params:** `files`. **Errors:** 250, 401.

### songs/keys/create
`key` → `{id}`. **Required:** `arrangement_id`, `name`, `key_starting`. **Params:** `key_ending`, `keys_alternate[]`. **Errors:** 250.

### songs/keys/edit
`key` → `{id}`. **Required:** `id`, `key_starting`. **Params:** `name`, `key_ending`, `keys_alternate[]` (note: uses `key` not `key_starting`). **Errors:** 250.

---

## Calendar

### calendar/getAll
No params. `calendars` → `calendar[]` (id, name, color, members, published).

### calendar/events/getAll
`events` → `event[]` (id, name, where, start_date, end_date, all_day, color, url). **Required:** `start`, `end`. **Params:** `calendar[]` (ID(s)), `fields[]`. **Errors:** 250, 404.

### calendar/events/create
`event` → `{id}`. **Required:** `name`, `calendar_id`, `start`, `end`, `organizer` (person ID). **Params:** `status` (public|private|draft), `all_day`, `where`, `description` (HTML), `color`, `register_url`, `register_form`, `who_can_attend`, `show_guest_list`, `repeat` (daily|weekly|monthly|yearly|...), `repeat_frequency`, `repeat_on`, `repeat_occurrences`, `repeat_end_date`, `locations[]`, `assets[]`. **Errors:** 250.

### calendar/events/edit
`event` → `{id}`. Same as `create`, plus `id`. Additional: `locations_replace`, `locations_remove`, `assets_replace`, `assets_remove`. **Errors:** 250.

### calendar/events/remove
`event` → `{id}`. **Required:** `id`. **Errors:** 250.

---

## Financial

### financial/transactions/getAll
`transactions` → `transaction[]`. Fields: id, person_id, person_first_name, person_last_name, person_email, transaction_date, transaction_datetime, transaction_method, check_number, `batch{}`, transaction_total, `amounts[]`. **Required:** `start`, `end`. **Params:** `category_id`. **Errors:** 250.

### financial/transactions/getInfo
`transaction` (full details). **Required:** `id`. **Errors:** 400, 404.

### financial/transactions/create
`transaction` → `{id, batch{}, person{}}`. **Required:** `person` (object), `transaction_date`, `amounts[]` (`[{category_id, total, tax_deductible, memo, external_notes}]`). **Params:** `batch` (`{id}` or `{number, name}`), `transaction_datetime` (ISO 8601), `transaction_method` (Cash|Check|Credit Card|Bank Transfer|Automatic Direct Debit|Online), `check_number`. **Errors:** 250.

### financial/transactions/edit
`transaction` → `{id, batch{}, person{}}`. **Required:** `id`. **Params:** `batch`, `person`, `transaction_date`, `transaction_method`, `check_number`, `amounts_add[]`, `amounts_edit[]` (`[{id, category_id, total, tax_deductible, memo}]`), `amounts_remove[]` (IDs). **Errors:** 250.

### financial/transactions/remove
`transaction` → `{id}`. **Required:** `id`. **Errors:** 250.

### financial/categories/getAll
`categories` → `category[]` (id, status {0=archived, 1=active}, name).

### financial/categories/create
`category` → `{id, status, name, tax_deductible}`. **Required:** `name`. **Params:** `status` (1=active default), `tax_deductible` (y|n). **Errors:** 250.

---

> **Note:** All endpoints support `page` (default 1) and `page_size` (default 1000) for pagination.

## Field Reference
| Resource | Fields |
|----------|--------|
| people/* | `people-fields.md` |
| peopleFlows/* | `peopleFlows-fields.md` |
| groups/* | `group-fields.md` |
| services/* | `services-fields.md` |
| songs/* | `song-fields.md` |
| songs/arrangements/* | `song-arrangement-fields.md` |
| songs/keys/* | `song-key-fields.md` |
| calendar/events/* | `calendar-events-fields.md` |
