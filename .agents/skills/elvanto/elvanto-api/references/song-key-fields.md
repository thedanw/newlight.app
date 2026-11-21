# Song Key Fields Reference

Source: `https://www.elvanto.com/api/song-key-fields/`

## Default Fields (returned by songs/keys/getAll, songs/keys/getInfo)

| Field | Type | Description |
|-------|------|-------------|
| id | string | The ID of the key. |
| date_added | datetime | UTC date the key was added. |
| date_modified | datetime | UTC date the key was last modified. |
| name | string | The name of the key. |
| key_starting | string | The starting key. |
| key_ending | string | The ending key (if key change occurs). |
| arrangement_id | string | The ID of the arrangement this key belongs to. |

## Key Creation Notes

When creating keys (via `songs/keys/create` or nested in `songs/arrangements/create`):

| Required | Field | Description |
|----------|-------|-------------|
| Yes | `name` | Name of the key |
| Yes | `key_starting` | Starting key (must be valid) |
| No | `key_ending` | Ending key |
| No | `keys_alternate` | Array of alternate (capo) keys, each with `key_starting` + `name` |

## Alternate Key Fields

Each object in `keys_alternate` array:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| key_starting | string | Yes | Starting key |
| name | string | Yes | Display name |

**Note:** In create operations, alternate keys use `key_starting`; in edit operations (`songs/keys/edit`), the field is `key` instead of `key_starting`.