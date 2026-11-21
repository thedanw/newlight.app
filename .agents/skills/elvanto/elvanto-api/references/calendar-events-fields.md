# Calendar Events Fields Reference

Source: `https://www.elvanto.com/api/calendar-events-fields/`

## Default Fields (returned by calendar/events/getAll)

| Field | Type | Description |
|-------|------|-------------|
| id | string | Event ID (UUID) |
| picture | string | Event picture URL |
| calendar_id | string | Calendar ID |
| interval | string | Recurrence interval |
| name | string | Event name |
| description | string | Description |
| admin_notes | string | Admin-only notes |
| where | string | Location description |
| start_date | datetime | Start date/time (UTC) |
| end_date | datetime | End date/time (UTC) |
| all_day | integer | 1 if all-day event |
| url | string | Frontend event URL |
| color | string | Hex color code |

## Optional Fields

Pass these in the `fields` array parameter of `calendar/events/getAll`:

| Field | Type | Description |
|-------|------|-------------|
| locations | array | Locations assigned to the event |
| assets | array | Assets assigned to the event |
| register_url | string | Form URL for registration |

## Event Creation Parameters

For `calendar/events/create` and `calendar/events/edit`:

| Parameter | Type | Required | Values |
|-----------|------|----------|--------|
| status | string | No | `public`, `private`, `draft` (default: public) |
| all_day | string | No | `yes`, `no` (default: no) |
| color | string | No | Hexadecimal (e.g., `#FF0000`) |
| repeat | string | No | `daily`, `weekdays`, `mon_wed_fri`, `tue_thu`, `weekly`, `fortnightly`, `monthly`, `yearly` |
| repeat_frequency | integer | No (req. for daily/monthly/yearly) | Integer |
| repeat_on | string | No (req. for weekly/fortnightly/monthly) | `monday`–`sunday` (weekly), `weekday`/`monthday` (monthly) |
| repeat_occurrences | integer | No | Integer |
| repeat_end_date | datetime | No | End date for repeats |

## Edit-Only Parameters

For `calendar/events/edit`:

| Parameter | Type | Description |
|-----------|------|-------------|
| locations_replace | string\|array | Replace all locations |
| locations_remove | string\|array | Remove specified locations |
| assets_replace | string\|array | Replace all assets |
| assets_remove | string\|array | Remove specified assets |