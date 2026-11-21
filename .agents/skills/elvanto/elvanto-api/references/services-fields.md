# Service Fields Reference

Source: `https://www.elvanto.com/api/services-fields/`

## Default Fields (returned by services/getAll, services/getInfo)

| Field | Type | Description |
|-------|------|-------------|
| id | string | Service ID |
| status | integer | 1 = Published, 0 = Draft |
| date_added | datetime | UTC date added |
| date_modified | datetime | UTC date last modified |
| name | string | Service name (e.g., "Sunday Morning") |
| date | datetime | Service date/time |
| description | string | Description (can include HTML) |
| service_type | object | `{id, name}` of the service type |
| location | object | `{id, name}` of the location |

## Optional Fields

Pass these in the `fields` array parameter to retrieve additional data:

| Field | Type | Description |
|-------|------|-------------|
| series_name | string | The name of the series |
| service_times | array | Service time objects with `id`, `date_added`, `date_modified`, `name`, `starts`, `ends` |
| rehearsal_times | array | Rehearsal time objects (same structure as service_times) |
| other_times | array | Other time objects (same structure as service_times) |
| plans | array | Service plan objects with `time_id`, `service_length`, `service_length_formatted`, `total_length`, `total_length_formatted`, and nested `items` array |
| volunteers | array | Volunteer assignments with `time_id` and nested `positions` array |
| songs | array | Songs attached to the service |
| files | array | Files attached to the service |
| notes | array | Notes with `id`, `date_added`, `date_modified`, `note` |
| picture | string | URL for the service picture |

## Plan Item Fields

Each item in a `plans[].items` array contains:

| Field | Type | Description |
|-------|------|-------------|
| id | string | Item ID |
| heading | integer | 1 if a heading, 0 if regular item |
| duration | string | Duration (e.g., "05:00") |
| when | string | When the item occurs (e.g., "during") |
| title | string | Title of the item |
| song | object\|string | Song object or empty string |
| description | string | Description (can include HTML) |

## Volunteer Fields

Each position in `volunteers[].positions` contains:

| Field | Type | Description |
|-------|------|-------------|
| department_id | string | Department UUID |
| department_name | string | Department name |
| sub_department_id | string | Sub-department UUID |
| sub_department_name | string | Sub-department name |
| position_id | string | Position UUID |
| position_name | string | Position name (e.g., "BV1") |
| volunteers | array | Array of `{person: {id, firstname, preferred_name, lastname}, status}` |