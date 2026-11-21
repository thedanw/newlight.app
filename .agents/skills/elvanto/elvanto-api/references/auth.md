# Authentication Reference

**Base URL:** `https://api.elvanto.com/v1/{endpoint}.{json|xml|php}` — POST only.

## Authentication Methods

### API Key
- `auth` parameter — `auth={API_KEY}` as POST param
- `Authorization` header — `Authorization: {API_KEY}` (no Bearer prefix)

Found in **Settings > API**.

### OAuth 2.0
Access token sent as: `Authorization: Bearer {access_token}`

**URLs:**
| Endpoint | URL |
|----------|-----|
| Authorization | `https://www.elvanto.com/oauth/authorize` |
| Token | `https://www.elvanto.com/oauth/token` |

**Flows:**
| Flow | response_type | Use Case |
|------|---------------|----------|
| Web Server | `code` | Server-side apps (returns refresh token) |
| User Agent | `token` | Mobile/SPAs (no refresh token) |

**Web Server flow:**
1. Redirect: `?response_type=code&client_id={}&redirect_uri={}&scope={}&state={}`
2. Receive `code` via redirect callback
3. POST `{grant_type=authorization_code&code={}&client_id={}&client_secret={}&redirect_uri={}}` to token URL
4. Response: `access_token` + `refresh_token`

**Refresh (Web Server only):**
POST `{grant_type=refresh_token&refresh_token={}&client_id={}&client_secret={}}` to token URL

## Scopes
| Scope | Access |
|-------|--------|
| `people.manage` | People & Volunteers |
| `people.financial` | Financial & Giving |
| `groups.manage` | Groups & Classes |
| `services.manage` | Services & Service Types |
| `calendar.manage` | Calendar & Events |
| `songs.manage` | Resources & Songs |
| `administration` | Administration Settings |

## Response

**Status codes:** `200` OK | `400` Bad Request | `401` Unauthorized | `404` Not Found | `405` POST Required | `406` Invalid Format | `500` Server Error

**Structure:** `{generated_in, status: "ok|fail", {resource}, ...}` or `{status: "fail", error: {code, message}}`

## Pagination
Params: `page` (int, default 1), `page_size` (int, default 1000, max endpoint-specific).

Paginated responses include: `on_this_page`, `page`, `per_page`, `total`.

Response keys match endpoint prefix (`people`, `groups`, etc.).
