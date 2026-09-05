# Elvanto API Reference — Verified

**Source:** Live docs at https://www.elvanto.com/api/ scraped 2026-08-25 (index → 8 sections → 47 endpoint pages + `/api/people-fields/`).  
**Status:** All 47 endpoints confirmed; field shapes verified; doc bugs re-confirmed.  
**Purpose:** Single source of truth for API shapes, endpoints, enums, and known doc bugs. **No design decisions.**

---

## Conventions

- All endpoints: `POST https://api.elvanto.com/v1/<method>.{json|xml|php}`
- Auth: API key as Basic-auth **username** with blank/dummy password; or OAuth (scopes: `ManagePeople`, `ManageGroups`, `ManageServices`, `ManageSongs`, `ManageCalendar`, `ManageFinancials`, `AdministerAccount`; `web_server` + `user_agent` flows; token endpoint `POST /oauth/token`; `expires_in` ≈ 14 days; refresh-token grant)
- Envelope (success): `{ generated_in: str-secs, status: "ok", <resource>: {...} }`
- Envelope (error): `{ error: { code, message } }` — codes: 250 (invalid pagination/params), 400 (missing ID), 401 (missing ID/auth; code 102 "Invalid API Key"), 404 (not found), 500
- Pagination (all list endpoints): `page` int dflt 1, `page_size` int dflt 1000 range 10–1000; wrapper `{ on_this_page, page, per_page, total, <item_singular>: arr }`; **no cursor pagination**
- `peopleFlows/steps/people` has **no pagination** — single-shot fetch per `step_id`
- No webhooks documented anywhere; no documented rate limits → poll on `date_modified` with self-imposed throttling (≤2 concurrent, honor 429 Retry-After)
- Output formats: `.json` (default), `.xml`, `.php` (no `.html`)
- Reserved-word fields renamed in DB: `where`→`where_label`, `when`→`when_label`, `number`(songs)→`ccli_number`

---

## Type Conventions (API → Postgres)

| API shape | Postgres | Notes |
|---|---|---|
| int 0/1 flags | boolean | |
| "true"/"false" strings (calendars.members/published) | boolean | |
| yes/no request params | boolean (convert on write) | |
| decimal-as-string ("360.00") **or bare number (125)** | numeric(12,2) | **Accept both** |
| dt `yyyy-mm-dd hh:mm:ss` UTC | timestamptz | |
| ISO8601+00:00 (transaction_datetime) | timestamptz | |
| yyyy-mm-dd | date | |
| HTML text | text (store raw; sanitize at render) | |
| nested arr<{id,name}> | junction table or jsonb | |
| enum values arrive Capitalized ("Active", "Primary Contact") | lowercase snake_case before storing | |
| step `notifications` = `"y"`/"" | boolean | |
| category `tax_deductible` input `y`/`n` output int `1`/`0` | boolean | |

---

## Entity Schemas (DB-oriented)

### person (people/getAll \| getInfo \| search \| currentUser)

| field | type | notes |
|---|---|---|
| id | uuid pk | |
| date_added / date_modified | dt | sync watermark |
| category_id | uuid fk→people_category | |
| firstname / preferred_name / middle_name / lastname | str ? | |
| email | str-email | |
| phone / mobile | str | non-digits stripped+formatted server-side |
| admin / archived / contact / volunteer | int 0/1 | flags |
| status | str enum | active\|suspended (only when username set) |
| username | str ? | |
| last_login | dt ? | empty ok |
| country / timezone | str | |
| picture | str-url | |
| family_id | **int** fk→family ⚠️ not uuid | |
| family_relationship | str enum | Primary Contact\|Spouse\|Partner\|Child\|Sibling\|Grandfather\|Grandmother\|Other |
| birthday / anniversary | date ? | |
| gender | str ? | Male\|Female observed |
| marital_status | str ? | Single\|Engaged\|Married\|Widowed\|Divorced\|Separated\|Defacto |
| school_grade / security_code / receipt_name / giving_number | str ? | search-only confirmed; giving fields |
| deceased / development_child / special_needs_child | bool-ish str | search filters |
| locations | obj{location: arr<{id uuid, name}>} | getInfo via `fields` param; **unwrap nested** |
| custom_<uuid> | str | EAV — one key per custom field |
| **Opt-in fields (via `fields=[...]` on getAll/getInfo, writable on create/edit):** | | |
| mailing_address / mailing_address2 / mailing_city / mailing_state / mailing_postcode / mailing_country | str | full mailing address block |
| home_address / home_address2 / home_city / home_state / home_postcode / home_country | str | full home address block |
| departments | str | **3 levels joined by `\|\|`**: `Department\|\|Sub-department\|\|Position` — volunteer roles |
| service_types | str/arr | assignment field |
| demographics | str/arr | assignment field |
| access_permissions | str/arr | assignment field |
| reports_to | uuid | person reference |
| family | arr | retrieval-only array of family members |

### people_category (people/categories/getAll)
`id` uuid pk · `name` str · `color` str-hex ?

### custom_field (people/customFields/getAll) — EAV pattern
CustomField: `id` uuid pk · `name` str · `type` enum (observed `select_multi`, `text`; more exist at runtime)
CustomFieldValue: `id` uuid pk · `custom_field_id` fk · `name` str (predefined options for choice types)

### group (groups/getAll \| getInfo)

| field | type | notes |
|---|---|---|
| id | uuid pk | |
| date_added / date_modified | dt | |
| name | str | required on create |
| status | str | active\|suspended |
| description | str-html | |
| logo / picture | str-url | **getAll returns `logo`; getInfo returns `picture`** |
| meeting_address / meeting_city / meeting_state / meeting_postcode / meeting_country | str | |
| meeting_start_date / meeting_end_date | date ? | |
| meeting_start_time / meeting_end_time | str-time | "1:00 PM"\|"13:00" |
| meeting_day | str day-name | **deprecated** on create/edit (API 2.2) |
| meeting_time | str | read-side summary field; **deprecated** |
| meeting_frequency | **dual shape** | **Read (getAll):** display string "Every 2 Weeks" · **Write (create/edit):** object `{type: weekly\|monthly, count: int, day: str, occurrence: arr<int\|"last">}` (monthly-only occurrence) |
| people | nested arr<{id uuid, firstname, preferred_name, lastname, email, mobile, phone, picture, position str}> | position=Leader\|Assistant Leader; M2M person_group w/ position attr |

### people_flow (peopleFlows/getAll)
`id` uuid pk · `name` str · `status` str · `access` str · `admins` arr<uuid> (plain UUID strings) · `locations` arr · `demographics` arr · `steps` recursive arr<step>

### people_flow_step (peopleFlows/steps/getAll) — recursive tree
`id` uuid pk · parent implicit via nested `steps` arr · `priority` str-int · `name` str · `description` str · `instructions` str · `notifications` str "y"\|"" · `entry_point` str · `step_due` obj?\{type e.g."days", days int\} · `admins` arr<{id uuid, role}> (objects, not plain UUIDs) · `steps` arr<self>

### people_flow_step_member (peopleFlows/steps/people)
`flow_step_member_id` uuid · `id` uuid pk · person denorm: member_firstname/preferred_name/middle_name(?)/lastname · `date_added` dt · `assigned_admin_id` uuid? · `status` enum complete\|notstarted\|pending\|inprogress · `completed_date` dt? · `completed_member` str (name) · `due_date` date. **No pagination.**

### service (services/getAll \| getInfo) — **read-only (no write endpoints)**
`id` uuid pk · `status` int · `date_added`/`date_modified` dt · `name` str · `series_name` str (opt-in via fields) · `date` dt · `description` str-html · `service_type` obj{id,name} · `location` obj{id,name}
Nested (via `fields` param):
- service_times: arr<{id uuid, date_added, date_modified, name, starts dt, ends dt}>
- plans: per time_id → {service_length int-sec, total_length int, items arr<{id uuid, heading bool-int, duration "mm:ss", when str, title, description html, song str\|obj{...song shape}}> }
- volunteers: per time_id → positions arr<{department_id/name, sub_department_id/name, position_id/name, volunteers arr<{person{id,firstname,preferred_name,lastname}, status Confirmed\|Unconfirmed}>}>
- songs: arr<song-shape> · files: arr<{id,title,type="File",html bool,content url}> · notes: arr<{id,date_added,date_modified,note html}> · rehearsal_times/other_times: arr (getInfo only, empty in samples)

**Note:** `services.status` integer mapping uncertain — live sample shows `1` on published service; request-side filtering uses strings `published\|draft`. Treat as opaque int; filter with request strings.

### song (songs/getAll \| getInfo)
`id` uuid pk · `status` int 0=published,1=archived · `date_added`/`date_modified` dt · `title` str req · `permalink` str · `number` str CCLI → `ccli_number` · `item` bool-int 0=song,1=item · `learn` bool-int · `allow_downloads` bool-int · `artist`/`album`/`notes` str · `categories` arr<{id,name}> · `locations` arr<{id,name}>

### arrangement (songs/arrangements/*)
`id` uuid pk · `song_id` fk · `date_added`/`date_modified` dt · `name` str req · `copyright` str · `sequence` arr<str> · `minutes`/`seconds` num · `bpm` num · `key_male`/`key_female` str · `lyrics` str · `chord_chart_key` str (transpose target on read) · `chord_chart` str ChordPro `\n`

### song_key (songs/keys/*)
`id` uuid pk · `arrangement_id` fk · `date_added`/`date_modified` dt · `name` str req · `key_starting` str req valid musical key · `key_ending` str ? (key change) · keys_alternate arr<{key_starting, name}> capo keys
**Write hazard:** `keys/create` uses `keys_alternate[].key_starting`; `keys/edit` uses `keys_alternate[].key` — different keys!

### song_category (songs/categories/getAll)
`id` uuid pk · `name` str

### calendar (calendar/getAll)
`id` uuid pk · `name` str · `color` str-hex ? · `members` bool(str "true"/"false") · `published` bool(str)

### calendar_event (calendar/events/*)

| field | type | notes |
|---|---|---|
| id | uuid pk | |
| calendar_id | uuid fk→calendar | **"services" pseudo-ID for service events; may not exist in calendars table** → FK must be nullable |
| name | str req | |
| status | str | public\|private\|draft dflt public |
| start_date / end_date | dt GMT 24h req | |
| all_day | int 0/1 | |
| where | str | venue text → `where_label` |
| description | str basic-html | |
| admin_notes | str | read-only observed |
| url | str | |
| color | str-hex | |
| picture | str-url | |
| interval | str | recurrence summary (read) |
| organizer | person-id req on create | **Example passes a name, not ID — validate before write-back** |
| register_url | str ? | |
| register_form | form-id ? | |
| who_can_attend | str | ""=invited-only, "all" |
| show_guest_list | yes/no dflt no | |
| repeat | enum | daily\|weekdays\|mon_wed_fri\|tue_thu\|weekly\|fortnightly\|monthly\|yearly |
| repeat_frequency | int | daily/monthly/yearly |
| repeat_on | str | weekly/fortnightly: monday..sunday; monthly: weekday\|monthday |
| repeat_occurrences | int ? | |
| repeat_end_date | dt ? | |
| locations | arr<{id uuid,name}> | opt-in via fields; edit via locations_replace/locations_remove |
| assets | str\|arr | edit via assets_replace/assets_remove |

### financial_transaction (financial/transactions/*)

| field | type | notes |
|---|---|---|
| id | uuid pk | |
| person_id | uuid fk→person | auto-matches/creates person on create |
| person_first_name / person_last_name / person_email | denorm str | |
| transaction_date | date req | |
| transaction_datetime | dt ISO8601+00:00 ? | |
| transaction_method | enum | Cash\|Check\|Credit Card\|Bank Transfer\|Automatic Direct Debit\|Online\|Other |
| check_number | str ? | method=Check only |
| batch_id | uuid fk→batch | batch obj{id,number int,name} denorm |
| transaction_total | decimal | str-decimal in getInfo sample ("360.00") **or bare number** |
| amounts | arr<{id uuid, category_id fk, category_name, total decimal, tax_deductible 0/1, memo str, external_notes str-immutable}> | line items |
| created_by_id / created_by_first_name / created_by_last_name / created_at | audit | names ? |
| updated_by_id / updated_by_first_name / updated_by_last_name / updated_at | audit | |

### financial_category (chart of accounts)
`id` uuid pk · `name` str req unique-ish · `status` int 0=archived,1=active · `tax_deductible` y/n dflt n
**Write endpoints:** `getAll` and `create` **only** — no edit, no remove.

### batch (implied by transactions/create)
`id` uuid pk · `number` int · `name` str. Create: pass {id} or {number}/{name}; no match → new batch; omitted → new batch.

---

## Endpoint Reference (47)

### People (9)
- `people/getAll` POST — Req: page, page_size, category_id str\|arr, suspended yes/no, contact yes/no, archived yes/no, fields arr. Res: paginated person[]
- `people/search` POST — Req: search obj req (keys: date_added, date_modified, category_id, firstname, preferred_name, lastname, email, phone, mobile, archived, contact, deceased, volunteer, last_login, gender, birthday, anniversary, school_grade, marital_status, development_child, special_needs_child, security_code, receipt_name, giving_number, groups), fields. dt keys matched as >=. **Only ONE of contact/archived/deceased honored (last wins).** Res: paginated person[]
- `people/getInfo` POST — Req: id req, fields. Res: person[1]
- `people/create` POST — Req: firstname req, lastname req, optional: preferred_name, email, phone, mobile, category_id, archived, contact, volunteer, status, username, password(auto-gen if blank), family_id(int,"new"), family_relationship, fields(gender,birthday,anniversary,marital_status,access_permissions). Res: {id, family_id}
- `people/edit` POST — Req: id req + create params opt; family_id blank-but-present removes from family. Res: {id, family_id}
- `people/remove` POST — Req: id req. Res: {id}. Hard delete.
- `people/currentUser` POST — OAuth only. Res: person[1] (subset: no middle_name/family/birthday/gender/locations)
- `people/categories/getAll` POST — Res: category[{id,name,color}]
- `people/customFields/getAll` POST — Res: custom_field[{id,name,type,values?:value[{id,name}]}]

### Groups (7)
- `groups/getAll` POST — Req: page, page_size, category_id, suspended, fields(["people"]). Res: group[] incl nested people
- `groups/getInfo` POST — Req: id req, fields. Res: group[1]
- `groups/create` POST — Req: name req; status, meeting_* (address/city/state/postcode/country/start_date/start_time/end_time/end_date/frequency obj), fields. Res: {id}
- `groups/edit` POST — Req: id req + create params opt. Res: {id}
- `groups/remove` POST — Req: id req. ⚠️ **Doc bug: res keyed `person` not `group`** — verbatim in live docs
- `groups/addPerson` POST — Req: id req, person_id req, position opt Leader\|Assistant Leader (updates existing). Res: {id, person_id}
- `groups/removePerson` POST — Req: id req, person_id req. Res: {id, person_id}

### People Flows (4)
- `peopleFlows/getAll` POST — no params. Res: people_flow[] w/ nested steps+admins
- `peopleFlows/steps/getAll` POST — Req: flow_id req. Res: people_flow_step[] recursive
- `peopleFlows/steps/people` POST — Req: step_id req, status opt complete\|notstarted\|pending\|inprogress, assigned opt admin-uuid\|"unassigned". No pagination. Res: people_flow_step_member[]
- `peopleFlows/steps/addPerson` POST — Req: step_id req, person_id req, assign_to opt. Res: step_person[uuid]

### Services (2) — **read-only**
- `services/getAll` POST — Req: page, page_size, all yes/no(past), start, end, status published\|draft, service_types, fields(series_name,service_times,plans,volunteers,songs,files,notes). Res: service[]
- `services/getInfo` POST — Req: id req, fields(+rehearsal_times,other_times). Res: service[1]

### Songs (13) — **no delete endpoints anywhere**
- `songs/getAll` POST — Req: page, page_size, title, artist, lyrics, files bool. Res: song[]
- `songs/getInfo` POST — Req: id req, files. Res: song[1]
- `songs/create` POST — Req: title req, arrangements req ≥1 each{name req, keys?[{name,key_starting}], copyright, sequence, minutes, seconds, bpm, chord_chart_key, chord_chart}; status(0/1), number(CCLI), item, learn, allow_downloads. Res: {id, arrangements[{id}]}
- `songs/edit` POST — Req: id req; title,status,number,item,learn,allow_downloads opt. Res: {id}
- `songs/categories/getAll` POST — Res: category[{id,name}]
- `songs/arrangements/create` POST — Req: song_id req, name req, + arrangement fields, keys arr. Res: {id, keys[{id,name}]}
- `songs/arrangements/edit` POST — Req: id req + fields opt. Res: {id}
- `songs/arrangements/getAll` POST — Req: song_id req, page, page_size, chord_chart_key(transpose), files. Res: arrangement[] incl lyrics
- `songs/arrangements/getInfo` POST — Req: id req, chord_chart_key, files. Res: arrangement[1]
- `songs/keys/create` POST — Req: arrangement_id req, name req, key_starting req, key_ending, keys_alternate. Res: {id}
- `songs/keys/edit` POST — Req: id req, key_starting req, name, key_ending, keys_alternate(each needs `key`). Res: {id}
- `songs/keys/getAll` POST — Req: arrangement_id req, page, page_size, files. Res: key[{id,date_added,date_modified,name,key_starting,key_ending,arrangement_id}]
- `songs/keys/getInfo` POST — Req: id req, files. Res: key[1]

### Calendar (5)
- `calendar/getAll` POST — Res: calendar[{id,name,color,members,published}]
- `calendar/events/getAll` POST — Req: page, page_size, start, end req, calendar_id. Res: event[]
- `calendar/events/getInfo` POST — Req: id req. Res: event[1]
- `calendar/events/create` POST — Req: name req, calendar_id req, start_date req, end_date req, status, all_day, where, description, url, color, picture, organizer, register_url, register_form, who_can_attend, show_guest_list, repeat, repeat_frequency, repeat_on, repeat_occurrences, repeat_end_date, locations, assets. Res: {id}
- `calendar/events/edit` POST — Req: id req + create params opt; locations_replace, locations_remove, assets_replace, assets_remove. Res: {id}
- `calendar/events/remove` POST — Req: id req. Res: {id}

### Financial (7)
- `financial/transactions/getAll` POST — Req: page, page_size, start, end req, category_id, person_id. Res: transaction[]
- `financial/transactions/getInfo` POST — Req: id req. Res: transaction[1]
- `financial/transactions/create` POST — Req: person_id req, transaction_date req, transaction_method req, transaction_total req, amounts req arr<{category_id req, total req, tax_deductible, memo, external_notes}>, batch_id. Res: {id}
- `financial/transactions/edit` POST — Req: id req + create params opt; **person param marked Required in table but prose says omit to keep current assignee — effectively optional-with-side-effects**. Res: {id}
- `financial/transactions/remove` POST — Req: id req. Res: {id}
- `financial/categories/getAll` POST — Res: category[{id,name,status,tax_deductible}]
- `financial/categories/create` POST — Req: name req, status, tax_deductible. Res: {id}. ⚠️ **Doc bug: error text swaps status labels** ("Status must be set to 0 (Active) or 1 (Archived)" vs notes 1=active/0=archived)

---

## Known Doc Bugs (Re-confirmed Live)

1. **`groups/remove`** response keyed `person`, not `group` — verbatim in live docs
2. **`financial/transactions/edit`** `person` param: table says Required, prose says omit to keep current → effectively optional-with-side-effects
3. **`financial/categories/create`** error text swaps status labels ("0=Active, 1=Archived" vs actual 1=active/0=archived)

---

## Deprecation Notes (API 2.2)

- `groups` create/edit: `meeting_day` & `meeting_time` deprecated in favor of `meeting_frequency` object (back-compat kept). Write-back should prefer `meeting_frequency`.
- `groups.meeting_time` (read-side summary field) has no column in schema — document if needed.

---

## Envelope Inconsistencies (for serializer awareness)

- `arrangements/create` responds under plural `arrangements`; `arrangements/edit` singular
- Single-item getters return array-wrapped objects; mutators return bare objects
- `peopleFlowStepMember.completed_member` (string name) — denormalized, dropped from schema per denorm policy