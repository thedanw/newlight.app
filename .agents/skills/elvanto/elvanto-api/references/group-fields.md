# Group Fields Reference

Source: `https://www.elvanto.com/api/group-fields/`

## Default Fields (returned by groups/getAll, groups/getInfo)

| Field | Type | Description |
|-------|------|-------------|
| id | string | The ID of the group. |
| date_added | datetime | UTC date the group was added. |
| date_modified | datetime | UTC date the group was last modified. |
| name | string | The name of the group. |
| status | integer | Status of the group. |
| meeting_address | string | Meeting address. |
| meeting_city | string | Meeting city. |
| meeting_state | string | Meeting state. |
| meeting_postcode | string | Meeting postcode/zip. |
| meeting_country | string | Meeting country. |

## Optional Fields (for groups/create and groups/edit)

| Field | Type | Description |
|-------|------|-------------|
| people | array | People assigned to the group. Supports `_replace` and `_remove` suffixes |
| categories | array | Category IDs. Supports `_replace` and `_remove` suffixes |
| departments | array | Departments. Supports `_replace` and `_remove` suffixes. Uses 2-level `||` separator |
| demographics | array | Demographics. Supports `_replace` and `_remove` suffixes |
| locations | array | Locations. Supports `_replace` and `_remove` suffixes |

## Key Patterns

### Department `||` Separator (Groups: 2 levels)

Groups use a 2-level pipe-separated format (one fewer level than People):

```
Department||Sub-department
```

Example: `Music||Vocals`

### Meeting Frequency

The `meeting_frequency` parameter supports these keys:

| Key | Accepted Values |
|-----|-----------------|
| type | `weekly` or `monthly` |
| count | Integer (weeks/months between meetings) |
| day | Day name (e.g., `Tuesday`) |
| occurrence | (monthly only) Array of `1`, `2`, `3`, `4`, `5`, `last` |

### People Assignment

The `people` parameter accepts an array of objects:

```json
{
    "people": [
        {
            "id": "person-uuid",
            "role": "Leader|Assistant Leader|Member"
        }
    ]
}
```

Can also use `groups/addPerson` and `groups/removePerson` endpoints to manage membership.