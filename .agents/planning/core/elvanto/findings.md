# Elvanto API — Field & Schema Research
Source: www.elvanto.com/api · Scraped: 2026-08-24 · 47 endpoints, 8 categories
Purpose: schema reference for 2-way sync Elvanto ↔ Supabase

## Conventions
`str`=string `int`=integer `dt`=datetime UTC `date`=yyyy-mm-dd `bool`=boolean `arr`=array `obj`=object `uuid`=UUID `pk`=primary key `fk`=foreign key `?`=nullable

## Global Envelope (all responses)
```
{ generated_in: str-secs, status: "ok", <resource>: {...} }
```
Errors: `{error: {code, message}}`. Codes seen: 250 invalid pagination/params, 400 missing ID, 401 missing ID/auth, 404 not found.
All endpoints accept POST. Auth: API key or OAuth (`people/currentUser` = OAuth only).
Pagination (all list endpoints): `page` int dflt 1, `page_size` int dflt 1000 range 10–1000. List wrapper: `{on_this_page, page, per_page, total, <item_singular>: arr}`. No cursor pagination. No webhooks documented → sync must poll on `date_modified`.

---

## Entity Schemas (DB-oriented)

### person (people/getAll|getInfo|search|currentUser)
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
| locations | obj{location: arr<{id uuid, name}>} | getInfo via `fields` param |
| custom_<uuid> | str | EAV — one key per custom field |

### people_category (people/categories/getAll)
`id` uuid pk · `name` str · `color` str-hex ?

### custom_field (people/customFields/getAll) — EAV pattern
CustomField: `id` uuid pk · `name` str · `type` enum (observed select_multi, text; more exist)
CustomFieldValue: `id` uuid pk · `custom_field_id` fk · `name` str (predefined options for choice types)

### group (groups/getAll|getInfo)
| field | type | notes |
|---|---|---|
| id | uuid pk | |
| date_added / date_modified | dt | |
| name | str | required on create |
| status | str | active\|suspended |
| description | str-html | |
| logo / picture | str-url | |
| meeting_address / meeting_city / meeting_state / meeting_postcode / meeting_country | str | |
| meeting_start_date / meeting_end_date | date ? | |
| meeting_start_time / meeting_end_time | str-time | "1:00 PM"\|"13:00" |
| meeting_day | str day-name | |
| meeting_time | str | getAll/getInfo response |
| meeting_frequency | obj{type weekly\|monthly, count int, day str, occurrence arr<int\|"last">} | monthly-only occurrence |
| people | nested arr<{id uuid, firstname, preferred_name, lastname, email, mobile, phone, picture, position str}> | position=Leader\|Assistant Leader; M2M person_group w/ position attr |

### people_flow (peopleFlows/getAll)
`id` uuid pk · `name` str · `status` str · `access` str · `admins` arr<uuid> · `locations` arr · `demographics` arr · `steps` recursive arr<step>

### people_flow_step (peopleFlows/steps/getAll) — recursive tree
`id` uuid pk · parent implicit via nested `steps` arr · `priority` str-int · `name` str · `description` str · `instructions` str · `notifications` str "y"\|"" · `entry_point` str · `step_due` obj?\{type e.g."days", days int\} · `admins` arr<{id uuid, role}> · `steps` arr<self>

### people_flow_step_member (peopleFlows/steps/people)
`flow_step_member_id` uuid · `id` uuid pk · person denorm: member_firstname/preferred_name/middle_name(?)/lastname · `date_added` dt · `assigned_admin_id` uuid? · `status` enum complete\|notstarted\|pending\|inprogress · `completed_date` dt? · `completed_member` str · `due_date` date. No pagination.

### service (services/getAll|getInfo)
`id` uuid pk · `status` int · `date_added`/`date_modified` dt · `name` str · `series_name` str (opt-in via fields) · `date` dt · `description` str-html · `service_type` obj{id,name} · `location` obj{id,name}
Nested (via `fields` param):
- service_times: arr<{id uuid, date_added, date_modified, name, starts dt, ends dt}>
- plans: per time_id → {service_length int-sec, total_length int, items arr<{id uuid, heading bool-int, duration "mm:ss", when str, title, description html, song str\|obj{...song shape}}> }
- volunteers: per time_id → positions arr<{department_id/name, sub_department_id/name, position_id/name, volunteers arr<{person{id,firstname,preferred_name,lastname}, status Confirmed\|Unconfirmed}>}>
- songs: arr<song-shape> · files: arr<{id,title,type="File",html bool,content url}> · notes: arr<{id,date_added,date_modified,note html}> · rehearsal_times/other_times: arr (getInfo only, empty in samples)

### song (songs/getAll|getInfo)
`id` uuid pk · `status` int 0=published,1=archived · `date_added`/`date_modified` dt · `title` str req · `permalink` str · `number` str CCLI · `item` bool-int 0=song,1=item · `learn` bool-int · `allow_downloads` bool-int · `artist`/`album`/`notes` str · `categories` arr<{id,name}> · `locations` arr<{id,name}>

### arrangement (songs/arrangements/*)
`id` uuid pk · `song_id` fk · `date_added`/`date_modified` dt · `name` str req · `copyright` str · `sequence` arr<str> · `minutes`/`seconds` num · `bpm` num · `key_male`/`key_female` str · `lyrics` str · `chord_chart_key` str (transpose target on read) · `chord_chart` str ChordPro `\n`

### song_key (songs/keys/*)
`id` uuid pk · `arrangement_id` fk · `date_added`/`date_modified` dt · `name` str req · `key_starting` str req valid musical key · `key_ending` str ? (key change) · keys_alternate arr<{key_starting, name}> capo keys

### song_category (songs/categories/getAll)
`id` uuid pk · `name` str

### calendar (calendar/getAll)
`id` uuid pk · `name` str · `color` str-hex ? · `members` bool(str "true"/"false") · `published` bool(str)

### calendar_event (calendar/events/*)
| field | type | notes |
|---|---|---|
| id | uuid pk | |
| calendar_id | uuid fk→calendar | "services" pseudo-ID for service events |
| name | str req | |
| status | str | public\|private\|draft dflt public |
| start_date / end_date | dt GMT 24h req | |
| all_day | int 0/1 | |
| where | str | venue text |
| description | str basic-html | |
| admin_notes | str | read-only observed |
| url | str | |
| color | str-hex | |
| picture | str-url | |
| interval | str | recurrence summary (read) |
| organizer | person-id req on create | |
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
| transaction_total | decimal | str-decimal in getInfo sample ("360.00") |
| amounts | arr<{id uuid, category_id fk, category_name, total decimal, tax_deductible 0/1, memo str, external_notes str-immutable}> | line items |
| created_by_id / created_by_first_name / created_by_last_name / created_at | audit | names ? |
| updated_by_id / updated_by_first_name / updated_by_last_name / updated_at | audit | |

### financial_category (chart of accounts)
`id` uuid pk · `name` str req unique-ish · `status` int 0=archived,1=active · `tax_deductible` y/n dflt n

### batch (implied by transactions/create)
`id` uuid pk · `number` int · `name` str. Create: pass {id} or {number}/{name}; no match → new batch; omitted → new batch.

---

## Endpoint Reference (47)

### People (9)
- `people/getAll` POST — Req: page, page_size, category_id str|arr, suspended yes/no, contact yes/no, archived yes/no, fields arr. Res: paginated person[]
- `people/search` POST — Req: search obj req (keys: date_added, date_modified, category_id, firstname, preferred_name, lastname, email, phone, mobile, archived, contact, deceased, volunteer, last_login, gender, birthday, anniversary, school_grade, marital_status, development_child, special_needs_child, security_code, receipt_name, giving_number, groups), fields. dt keys matched as >=. Only ONE of contact/archived/deceased honored (last wins). Res: paginated person[]
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
- `groups/remove` POST — Req: id req. ⚠️ doc bug: res keyed `person` not `group`
- `groups/addPerson` POST — Req: id req, person_id req, position opt Leader|Assistant Leader (updates existing). Res: {id, person_id}
- `groups/removePerson` POST — Req: id req, person_id req. Res: {id, person_id}

### People Flows (4)
- `peopleFlows/getAll` POST — no params. Res: people_flow[] w/ nested steps+admins
- `peopleFlows/steps/getAll` POST — Req: flow_id req. Res: people_flow_step[] recursive
- `peopleFlows/steps/people` POST — Req: step_id req, status opt complete|notstarted|pending|inprogress, assigned opt admin-uuid|"unassigned". No pagination. Res: people_flow_step_member[]
- `peopleFlows/steps/addPerson` POST — Req: step_id req, person_id req, assign_to opt. Res: step_person[uuid]

### Services (2)
- `services/getAll` POST — Req: page, page_size, all yes/no(past), start, end, status published|draft, service_types, fields(series_name,service_times,plans,volunteers,songs,files,notes). Res: service[]
- `services/getInfo` POST — Req: id req, fields(+rehearsal_times,other_times). Res: service[1]

### Songs (13)
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
- `calendar/getAll` POST — no params. Res: calendar[{id,name,color,members,published}]
- `calendar/events/getAll` POST — Req: start req, end req, page, page_size, calendar str|arr("services"), fields(locations). Res: event[]
- `calendar/events/create` POST — Req: name req, calendar_id req, start req, end req, organizer req(person); status, all_day, where, description, color, register_url, register_form, who_can_attend, show_guest_list, repeat*, locations, assets opt. Res: {id}
- `calendar/events/edit` POST — Req: id req + create params opt + locations_replace/locations_remove/assets_replace/assets_remove. Res: {id}
- `calendar/events/remove` POST — Req: id req. Res: {id}

### Financial (7)
- `financial/transactions/getAll` POST — Req: start req, end req, page, page_size, category_id. Res: transaction[]
- `financial/transactions/getInfo` POST — Req: id req. Res: transaction obj
- `financial/transactions/create` POST — Req: person arr req ({id}|{firstname,lastname,email,mobile,phone} auto-create), transaction_date req, amounts arr req [{category_id,total,tax_deductible,memo,external_notes-immutable}]; batch arr, transaction_datetime, transaction_method, check_number opt. Res: {transaction{id}, batch{id,number,name}, person{id,firstname,lastname}}
- `financial/transactions/edit` POST — Req: id req; batch(empty→new), person(doc says req but omit keeps current — contradictory), transaction_date, transaction_method, check_number, amounts_add/amounts_edit(id req)/amounts_remove[id]. Res: same as create
- `financial/transactions/remove` POST — Req: id req. Res: {id}
- `financial/categories/getAll` POST — Res: category[{id,status 0/1,name}]
- `financial/categories/create` POST — Req: name req, status 1/0 dflt 1, tax_deductible y/n dflt n. Res: {id,status,name,tax_deductible}

---

## Sync Design Notes (Elvanto → Supabase)
1. **PK strategy**: all entity PKs are UUID except `family_id` (int) — model families as separate table with int PK.
2. **Change detection**: poll `date_modified >= last_sync`; no webhooks in API index. Most `getAll` endpoints lack date filters (only services/calendar events/transactions have start/end) → full-scan diff for people/groups/songs.
3. **Deletes**: `remove` endpoints hard-delete; soft signals: person.archived, person.status=suspended, group.status, song.status=1, financial_category.status=0. Reconcile via full-list ID diff.
4. **Custom fields**: EAV (`custom_<uuid>` on person). Mirror as JSONB column keyed by custom-field UUID + `custom_fields`/`custom_field_values` lookup tables from `people/customFields/getAll`.
5. **M2M tables**: person↔group (+position), person↔family (+relationship), flow_step↔person (step_member w/ status), event↔location, song↔category, transaction↔amount(line-items)↔category.
6. **Type gotchas**: booleans arrive as int 0/1 (people/services/songs) but str "true"/"false" (calendar.members/published) and yes/no strings (request params). Money = decimal-as-string. Datetimes UTC; event times GMT 24h; dates yyyy-mm-dd.
7. **Pagination**: offset-based, max 1000/page — iterate until `on_this_page < page_size`.
8. **Upsert order** (FK deps): people_categories → custom_fields(+values) → people → families → groups → group_members → calendars → events → flows(+steps) → step_members → song_categories → songs → arrangements → keys → financial_categories → batches → transactions(+amounts).
9. **Write-back**: create/edit accept subset of read fields; read-only/denormalized fields (person_* on transactions, batch obj, interval, admin_notes) must never be pushed back.
10. **Doc bugs noted**: groups/remove returns `person` key; transactions/edit person required-vs-optional contradiction; financial/categories/create error msg swaps status labels.

## Live Probe Verification (2026-08-25)
Script: `scripts/elvanto-schema-probe.mjs` (read-only). Output: `scripts/elvanto-probe/` (gitignored — PII).
19/21 calls ok against production account.

| Fact | Value |
|---|---|
| people total | **5,039** |
| groups / songs / services(±1y) / events(±1y) | 45 / 142 / 200 / 199 |
| custom fields defined | **0** — EAV mirror empty until account defines some |
| financial module | unused — transactions & categories return 404-empty |
| calendars | `calendar/getAll` = 0 rows yet 199 events exist → events live on "services" pseudo-calendar or restricted visibility; don't require calendar row for event FK |
| NEW field confirmed | `person.deceased` present on read objects (docs listed it search-only) |
| ⚠️ Enum casing | values arrive **Capitalized**: status="Active"/"Suspended", family_relationship="Child"\|"Spouse"\|"Primary Contact"\|"Other" → lowercase+snake_case on ingest |
| Unverified (no data) | transactions, financial categories, custom fields, gender/marital_status values |

## Decision Log: decision → Rationale
- Poll-based sync via date_modified → no webhooks documented in API
- EAV mirror for custom fields → API exposes custom_<uuid> dynamic keys
- Full-scan ID diff for deletes → remove is hard-delete, no trash endpoint
