# People Fields Reference

Source: `https://www.elvanto.com/api/people-fields/`

## Default Fields (people/getAll, people/getInfo, people/search)
| Field | Type | Description |
|-------|------|-------------|
| id | string | Person ID |
| date_added | datetime | UTC date added |
| **date_modified** | **datetime** | **UTC date last modified — PRIMARY FIELD FOR INCREMENTAL SYNC** |
| category_id | string | Category ID |
| firstname | string | First name |
| preferred_name | string | Preferred name |
| middle_name | string | Middle name |
| lastname | string | Last name |
| email | string | Email address |
| phone | string | Phone number |
| mobile | string | Mobile number |
| admin | int | 1 if admin user |
| archived | int | 1 if archived |
| contact | int | 1 if contact |
| volunteer | int | 1 if volunteer |
| status | string | Person status |
| username | string | Username |
| last_login | datetime | UTC last login |
| country | string | Country |
| timezone | string | Timezone |
| picture | string | Profile picture URL |
| family_id | string | Family ID |
| family_relationship | string | Family relationship |

> **Incremental Sync Note:** `date_modified` is the recommended field for incremental synchronization. Use `people/search` with `search: { "date_modified": "YYYY-MM-DD" }` to fetch all records modified on or after a given UTC date. The search uses `>=` comparison (greater than or equal). All datetime searches are in UTC — provide dates as `YYYY-MM-DD` (midnight UTC) or `YYYY-MM-DD HH:MM:SS`.

## Optional Fields (people/create, people/edit)
| Field | Type | Description |
|-------|------|-------------|
| gender | string | `Male`, `Female`, `Not Specified` |
| birthday | date | `YYYY-MM-DD` |
| anniversary | date | `YYYY-MM-DD` |
| school_grade | string | School grade |
| marital_status | string | Marital status |
| development_child | int | 1 if development child |
| special_needs_child | int | 1 if special needs child |
| security_code | string | Security code |
| receipt_name | string | Receipt name |
| giving_number | string | Giving number |
| mailing_address | string | Mailing address line 1 |
| mailing_city | string | Mailing city |
| mailing_state | string | Mailing state |
| mailing_postcode | string | Mailing postcode/zip |
| mailing_country | string | Mailing country |
| home_address | string | Home address line 1 |
| home_city | string | Home city |
| home_state | string | Home state |
| home_postcode | string | Home postcode/zip |
| home_country | string | Home country |
| access_permissions | array | Add/replace/remove with suffix |
| departments | array | 3-level `||` separator, replace/remove supported |
| service_types | array | Replace/remove supported |
| demographics | array | Replace/remove supported |
| locations | array | Replace/remove supported |
| family | array | Family members: `[{id, relationship}]` |
| reports_to | string | Person ID this person reports to |
| custom_{ID} | various | Custom field; ID from people/customFields/getAll |

## Demographics Field Structure (people/getAll, people/getInfo, people/search)

When requesting `fields: ['demographics']` in `people/getAll`, the response includes a `demographics` object on each person:

```json
{
  "demographics": {
    "demographic": [
      {
        "id": "2e1b6878-281d-4faa-bd34-da5e1ea7592c",
        "name": "Adults"
      }
    ]
  }
}
```

- **Path**: `person.demographics.demographic[]` (array of objects)
- **Each item**: `{ "id": "<uuid>", "name": "<string>" }` — e.g., "Adults", "Youth", "Child"
- **Empty case**: People without demographics have `"demographics": []` (empty array)
- **Note**: The `demographics` field is an object containing a `demographic` array, NOT a direct array of strings

## Key Patterns

### Department `||` Separator (People: 3 levels)
`Department||Sub-department||Position` — e.g., `Music||Vocals||BV1`

### Access Permissions Pattern
- `access_permissions` — add/append
- `access_permissions_replace` — replace all
- `access_permissions_remove` — remove specified

Same `_replace`/`_remove` suffix pattern: `departments`, `service_types`, `demographics`, `locations`.

### Custom Fields
Referenced as `custom_{ID}` where `{ID}` is the numeric ID from `people/customFields/getAll`. Type determines value format (text, dropdown, date, etc.).
