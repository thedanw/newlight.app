# Elvanto API — As Used By This Integration

Full API surface (47+ endpoints, auth flows, per-entity field lists) lives in the **elvanto skill** — don't restate it here: [SKILL.md](../../../skills/elvanto/elvanto-api/SKILL.md), [references/auth.md](../../../skills/elvanto/elvanto-api/references/auth.md), [references/endpoints.md](../../../skills/elvanto/elvanto-api/references/endpoints.md), [references/people-fields.md](../../../skills/elvanto/elvanto-api/references/people-fields.md). This doc records **what the plugin actually calls and how** — all evidence from code. Where code and skill disagree, code wins: e.g. this integration authenticates with **Basic** (`key:` as username), while the skill documents `auth=` param / raw `Authorization` header alternatives.

## Endpoints actually invoked at runtime

| Caller | Endpoint | Notes |
|---|---|---|
| edge `people-sync` (sync) | `people/getAll` | page_size **500**, max 200 pages, opt-in `fields: [gender, birthday, locations, custom_77493627-…]` (hardcoded demographics custom-field UUID), incremental filter sent as top-level `date_modified` |
| edge action `test_connection` | `people/getAll` | page_size 1, Basic auth — connectivity check |
| edge action `list_locations` | `calendar/getAll` | page_size 1000 — **locations are modelled as Calendars** |
| UI `field-discovery` | `people/categories/getAll`, `people/customFields/getAll`, `locations/getAll` | populate mapping dropdown catalog |
| UI `sync\elvanto-api.ts` (Locations tab) | `calendar/getAll` | dev via Vite proxy, prod via edge `list_locations` |

No other entity endpoints execute: `household-sync`/`journey-sync` are DB-only; the 12 placeholder entities in `SYNC_ORDER` never fetch (though `src\...\sync\mapping-engine.ts` declares an `elvantoEndpoint` per entity — that table is dormant).

## Declared-but-uninvoked API layer

`src\...\api\client.ts` + `api\endpoints.ts` form a typed reference library (**49 distinct endpoint strings**; the "47" in its header matches the skill/legacy docs' endpoint census, not this file's count). **Nothing imports it at runtime** (only type imports by `field-discovery`). Useful as a typed inventory; when changing endpoints, the live path is the edge function's inline fetches. Key client conventions it encodes (matches skill references): `POST https://api.elvanto.com/v1/<method>.json`, Basic auth `btoa(key + ':')`, envelope `{generated_in, status: 'ok', <resource>}`, errors `{error: {code, message}}`, list wrapper `{on_this_page, page, per_page, total, …}`, retries 3× exponential (no retry on 4xx except 429), 30 s timeout, ≤2 concurrent, default page_size 1000 (loop until a short page), 100 ms page delay.

## Transport paths (Elvanto has no CORS headers)

| Context | Path |
|---|---|
| Dev browser | Vite proxy `/api/elvanto → https://api.elvanto.com` (`vite.config.ts`, `changeOrigin`), Basic auth added client-side |
| Prod browser (locations) | Edge function action `list_locations` (server-side fetch, responds with CORS) |
| Prod browser (discovery) | `field-discovery` builds the direct `https://api.elvanto.com` URL outside dev — **likely CORS-blocked in prod builds**; only the Locations tab uses the sanctioned proxy/edge paths |
| Sync engine | Edge function server-side fetches only |

## Response handling facts

- Success: `status: 'ok'`; callers validate `response.ok && data.status === 'ok'` (field-discovery) or `status !== 'error' && !data.error`.
- Single-item getters return array-wrapped objects; mutators return bare objects; envelopes vary by endpoint (legacy `ELVANTO_API_REFERENCE.md` §Envelope Inconsistencies — removed, git history; verify against [references/endpoints.md](../../../skills/elvanto/elvanto-api/references/endpoints.md)).
- No webhooks; no documented rate limits → poll-only design (watermark/`date_modified`); throttle ≤2 concurrent + honour 429 Retry-After (client does; edge's simple fetches do not retry).
- Pagination: offset `page`/`page_size`, no cursors; `peopleFlows/steps/people` has no pagination (skill reference governs).
