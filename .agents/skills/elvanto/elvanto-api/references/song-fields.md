# Song Fields Reference

Source: `https://www.elvanto.com/api/song-fields/`

## Default Fields (returned by songs/getAll, songs/getInfo)

| Field | Type | Description |
|-------|------|-------------|
| id | string | The ID of the song. |
| status | integer | 1 = Published, 0 = Archived |
| date_added | datetime | UTC date the song was added. |
| date_modified | datetime | UTC date the song was last modified. |
| title | string | The title of the song. |
| permalink | string | The permalink of the song. |
| number | integer | The CCLI number of the song. |
| item | integer | 1 = Item, 0 = Song |
| artist | string | The name of the song's artist. |
| album | string | The name of the song's album. |
| notes | string | Notes attached to the song. |
| categories | array | Categories the song is assigned to. |
| locations | array | Locations the song is assigned to. |
| learn | integer | 1 if marked as "To Learn" |
| allow_downloads | integer | 1 if audio downloads are allowed |

## Additional Fields in songs/getInfo

When `files=true` is passed, an additional `files` array is included with attached file objects.