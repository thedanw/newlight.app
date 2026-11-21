# Song Arrangement Fields Reference

Source: `https://www.elvanto.com/api/song-arrangement-fields/`

## Default Fields (returned by songs/arrangements/getAll, songs/arrangements/getInfo)

| Field | Type | Description |
|-------|------|-------------|
| id | string | The ID of the arrangement. |
| date_added | datetime | UTC date the arrangement was added. |
| date_modified | datetime | UTC date the arrangement was last modified. |
| name | string | The name of the arrangement. |
| copyright | string | Copyright information. |
| sequence | array | The arrangement's sequence (array of strings). |
| minutes | integer | Total number of minutes. |
| seconds | integer | Seconds that follow the minutes. |
| bpm | integer | Beats per minute. |
| key_male | string | Male key. |
| key_female | string | Female key. |
| lyrics | string | Lyrics of the arrangement. |
| chord_chart_key | string | The key the chord chart is outputted in. |
| chord_chart | string | Chord chart in ChordPro format. |

## Notes

- Chord charts use ChordPro format with `\n` for newlines.
- The `chord_chart_key` parameter on getAll/getInfo transposes the chord chart to the specified key.
- When creating arrangements via `songs/create`, keys can be nested inside arrangements using the `keys` parameter.
- Each key object in the `keys` array must have `name` and `key_starting` parameters.