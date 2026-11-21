---
name: elvanto-api
description: "Complete Elvanto Church Management REST API documentation and code patterns for LLM agents. Use when querying people/volunteers, managing groups, scheduling services/events, updating songs, or processing financial transactions via the Elvanto API."
category: elvanto
risk: safe
source: local
tags: [elvanto, church-management, rest-api, oauth2, api-key, people, groups, services, songs, calendar, financial, people-flows]
triggers: [elvanto, church-api, query-people, create-record, schedule-event, authenticate-elvanto]
allowed-tools: [Read, Write, Glob, Grep, Bash, WebFetch]
---

# Elvanto API

## Overview

Elvanto REST API for church management. All endpoints use POST to `https://api.elvanto.com/v1/{endpoint}.{json|xml|php}`. Auth via API key (`auth` param or `Authorization` header) or OAuth 2.0 (`Authorization: Bearer {token}`).

**When to use:** Querying/managing people, groups, services, songs, calendar events, or financial transactions. Trigger phrases: "elvanto", "church API", "query people", "create record", "schedule event".

## Quick Reference

| Aspect | Value |
|--------|-------|
| Base URL | `https://api.elvanto.com/v1/` |
| Method | POST (all endpoints) |
| Formats | `.json` \| `.xml` \| `.php` |
| Pagination | `page` (default 1), `page_size` (default 1000) |
| Response | `{generated_in, status, {resource_key}}` |
| Errors | 200/400/401/404/500 + Elvanto codes (250, 400, 401, 404) |

## Authentication

**API Key:** `auth={KEY}` as param or `Authorization: {KEY}` header.

**OAuth 2.0:** Two flows — Web Server (`response_type=code`, has refresh) and User Agent (`response_type=token`, no refresh). Token request: `POST https://www.elvanto.com/oauth/token` with `grant_type=authorization_code`.

**Scopes:** `people.manage`, `people.financial`, `groups.manage`, `services.manage`, `calendar.manage`, `songs.manage`, `administration`.

See `references/auth.md` for full OAuth flow diagrams and token refresh.

## Endpoints

| Section | Endpoints | Count | Field Reference |
|---------|-----------|-------|-----------------|
| People | getAll, search, getInfo, create, edit, remove, currentUser, categories/getAll, customFields/getAll | 9 | `references/people-fields.md` |
| People Flows | getAll, steps/getAll, steps/people, steps/addPerson | 4 | `references/peopleFlows-fields.md` |
| Groups | getAll, getInfo, create, edit, remove, addPerson, removePerson | 7 | `references/group-fields.md` |
| Services | getAll, getInfo, planTemplates/getAll | 3 | `references/services-fields.md` |
| Songs | getAll, getInfo, create, edit, remove, categories/getAll, arrangements/{getAll,getInfo,create,edit}, keys/{getAll,getInfo,create,edit} | 14 | `references/song-fields.md`, `song-arrangement-fields.md`, `song-key-fields.md` |
| Calendar | getAll, events/{getAll,create,edit,remove} | 5 | `references/calendar-events-fields.md` |
| Financial | transactions/{getAll,getInfo,create,edit,remove}, categories/{getAll,create} | 7 | — |

Full parameter tables, request/response examples, and error codes: `references/endpoints.md`.

## Agent Patterns

**Simple Read** — `getInfo` endpoints: pass `auto_paginate=False`, extract from singular `resource` key.

**Paginated Read** — `getAll` endpoints: set `page_size=1000`, loop while `page * page_size < total`, merge `person`/`group`/etc. arrays across pages.

**Incremental Sync (people/search)** — Use `people/search` with `search: { "date_modified": "YYYY-MM-DD" }` to fetch only records modified since a given UTC date. All datetime searches use `>=` comparison. Loop pages with `page_size=1000` until `page * page_size >= total`. See `references/endpoints.md` for full searchable fields and date format details.

**Write** — `create`/`edit`/`remove`: always `auto_paginate=False`, check `status=="ok"`, extract returned `id`.

**Token Refresh** — OAuth Web Server flow only: call `POST /oauth/token` with `grant_type=refresh_token` before expiry. User Agent flow has no refresh — user must re-authenticate.

Python client with all patterns implemented: `scripts/elvanto_client.py`

## Key Rules

1. **POST only** — All requests are POST; GET/PUT/DELETE unsupported
2. **Format suffix required** — Append `.json`/`.xml`/`.php`; no default
3. **Params in POST body** — Never in query string
4. **Custom fields** — Use `custom_{ID}` from `people/customFields/getAll`, not field names
5. **Department `||` separator** — People: 3-level (`Department||Sub-dept||Position`), Groups: 2-level (`Department||Sub-dept`)
6. **Array suffixes** — `field_replace` to clear, `field` to append, `field_remove` to delete
7. **Meeting frequency** — `{type: weekly\|monthly, count, day, occurrence}` (occurrence only for monthly)
8. **`songs/categories/getAll` returns HTTP 500** — endpoint listed but docs unavailable
9. **Calendar `organizer` is a person ID**, not a name — look up via `people/getAll` or `people/search`
10. **Financial `amounts` differs** — `create` uses `amounts` (with `category_id`+`total`); `edit` uses `amounts_add`/`amounts_edit`/`amounts_remove`
11. **All IDs are UUIDv4 strings** — treat as opaque strings, never integers
12. **Check field references before writes** — Undocumented fields are silently ignored, not rejected

## References

| Document | Path |
|----------|------|
| Full Endpoint Reference (48 endpoints) | `references/endpoints.md` |
| Authentication (OAuth flows, scopes) | `references/auth.md` |
| People Fields | `references/people-fields.md` |
| Group Fields | `references/group-fields.md` |
| Service Fields | `references/services-fields.md` |
| People Flows Fields | `references/peopleFlows-fields.md` |
| Song Fields | `references/song-fields.md` |
| Song Arrangement Fields | `references/song-arrangement-fields.md` |
| Song Key Fields | `references/song-key-fields.md` |
| Calendar Events Fields | `references/calendar-events-fields.md` |
| Python Client Template | `scripts/elvanto_client.py` |