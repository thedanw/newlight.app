# Security Audit — newlight.app (2026-09-19)

**Status:** Complete · **Scope:** whole repository at `dd4cb53` (`feat/dndkit-latest-refactor`) ·
**Method:** `security-and-hardening` skill — threat model first, then STRIDE over each trust
boundary, then code/RLS/supply-chain review · **Result:** 5 Critical, 7 High, 9 Medium, 7 Low
(C5 and H7 added in the §9 requirement re-check of the same day).

**Headline:** the app's authorization story is implemented **in the UI only**. The database
grants anonymous write on settings and plugin state, and the deployed Edge Functions
(`email-send`, `elvanto-sync-worker`) run with `service_role` and perform **no caller check of
their own** — so anyone holding the public anon key (which ships inside the JS bundle) can
change app configuration, enable/disable plugins, and drive the church's SMTP relay and Elvanto
sync. Two controls the app believes it has (anon-only-sees-`public` people, unsubscribe
suppression) do not actually hold.

---

## 1. Threat model (what a control must protect)

### 1.1 Trust boundaries

| # | Boundary | What crosses it | Who writes the value |
|---|---|---|---|
| B1 | Browser → PostgREST/Supabase (`anon` role, no login) | every table read/write the app performs pre-auth | **anyone** (`VITE_SUPABASE_ANON_KEY` is in the bundle) |
| B2 | Browser → PostgREST (`authenticated` role) | all PII reads/writes | any signed-in person (single flat role today) |
| B3 | Browser → Edge Fn `email-send` | `from`, `subject`, `body`, recipient list, `consentCategory` | any caller whose JWT the gateway accepts — incl. the anon key |
| B4 | Browser → Edge Fn `elvanto-sync-worker` | `action`, `api_key`, `trigger`, `entity`, `fullScan` | same as B3; worker then writes with `service_role` |
| B5 | Public internet → Edge Fn `email-unsubscribe` | `?token`, `reason` | anyone (by design) |
| B6 | Supabase → Elvanto API (`api.elvanto.com`) | Elvanto API key + PII payloads | server worker (trusted) and, separately, the **browser** (M1) |
| B7 | Browser → `public/content/plugins/**` | plugin manifests and **full plugin source + SQL migrations** fetched at runtime | build (but analyzable by anyone) |
| B8 | Elvanto API responses → DB (`service_role`) | upstream third-party data treated as trusted | third party (must be treated as untrusted) |
| B9 | Public route `/forms/:formId` | form answers from an unauthenticated visitor | anyone — currently half-wired (M5) |
| B10 | Developer machine → CLI artifacts, lockfiles, scripts | project ref/org id, lockfile authority | repository |

### 1.2 Assets

Member PII (names, DOB, addresses, phone/email, child-safety fields) · Elvanto API key and sync
config · the outbound email channel (Google Workspace SMTP reputation = the church's ability to
email anyone) · admin actions (settings, plugin toggles, sync triggers, broadcasts) ·
audit/suppression evidence (unsubscribe records) · staff/child-safety notes.

### 1.3 STRIDE summary (highest-value rows)

| Boundary | Threat | Result |
|---|---|---|
| B1 | **E**levation of privilege | `platform_settings`, `plugins`, `elvanto_settings`, `elvanto_sync_config`, `brand-assets` grant anon INSERT/UPDATE/DELETE → C3, C4 |
| B1 | **I**nformation disclosure | `people_public` view bypasses base-table RLS and lists **all** people (H2); `elvanto_settings.api_key_encrypted` readable by anon (C4) |
| B3 | **S**poofing | `from` comes from the request body; no caller check → open relay / phishing as the church (C1) |
| B4 | **D**enial of service / **T**ampering | anon key invokes the worker → attacker-triggered syncs, service-role writes, attacker-supplied `api_key` proxied to Elvanto (C2) |
| B5 | **R**epudiation / consent | unsubscribe writes `email_hash: ''` so suppression never matches → unsubscribed people keep receiving mail (H3) |
| B2 | **E**levation | one flat `authenticated` role: every member can read all PII and read/delete the suppression list (H4, H5) |
| B8 | **T**ampering | no validation/size cap on sync payloads before service-role writes; malformed upstream data lands in the DB (M4) |
| B7 | **I**nformation disclosure | full plugin source, worker source and `db/migrations/*.sql` publicly served (H6) |

### 1.4 Abuse cases (make these the first tests)

1. With only the anon key: overwrite `platform_settings.app-settings` (deface the app), flip
   `plugins.elvanto-sync.enabled`, read `elvanto_settings.api_key_encrypted`.
2. With only the anon key: `POST /functions/v1/email-send` with `from=office@<victim-domain>` and
   500 recipients → mail from the church's SMTP identity.
3. With only the anon key: repeat `POST /functions/v1/elvanto-sync-worker
   {trigger:'manual',fullScan:true}` → quota burn and `elvanto_sync_history` spam.
4. As anon: `SELECT * FROM people_public` → every member's first name + last initial + demographic.
5. Unsubscribe via the emailed link, then run a broadcast → the person must not be emailed again.

---

## 2. Findings summary

| ID | Sev | Area | Finding | Evidence |
|---|---|---|---|---|
| C1 | Critical | Edge Fn authZ | `email-send` has no caller check and trusts client `from` → open SMTP relay / spoofing | `supabase/functions/email-send/index.ts:157-320`, `src/core/email/lib/client.ts:17-37` |
| C2 | Critical | Edge Fn authZ | `elvanto-sync-worker` (service-role) has no caller check and is invoked with the **anon** key | `supabase/functions/elvanto-sync-worker/index.ts:12-40,425-560`, `…/sync/trigger-sync.ts:51-61` |
| C3 | Critical | RLS | anon INSERT/UPDATE on `platform_settings` and `plugins` (`USING (true)`) | `20260829140000_…sql:23-36`, `20260906000001_…sql:38-71`, `20260830100000_…sql:17-27` |
| C4 | Critical | RLS / secret | anon read+write on `elvanto_settings` (encrypted API key) and `elvanto_sync_config`; anon write on `brand-assets` storage | `20260829150000_fix_plugin_rls.sql:13-32,42-48`, `20260829140000_…sql:4-21` |
| C5 | Critical | RLS / PII | anon SELECT on `addresses`/`households`/`people_relationships`/`people_tags` with `USING (true)` policies → the full address book and family graph are readable logged-out (violates REQ-1) | `20260828120000_…sql:18-41`, grants `20260828120001_…sql:7-11`, `20260907000001_…sql:16,31,57` |
| H1 | High | Access control | No route guard: `/people`, `/settings`, `/forms`, `/example` render for anonymous visitors | `src/core/router.tsx`, `src/core/ui/app-shell.tsx` |
| H2 | High | RLS / PII | `people_public` view is `security_invoker=off`, granted to anon, **not** filtered by `access_permission` | `20260908120000_create_people_public_view.sql:6-21` |
| H3 | High | Consent | Unsubscribe writes `email_hash: ''`; suppression hashes the email → suppression never matches | `email-unsubscribe/index.ts:125-134` vs `email-send/index.ts:57-73` |
| H4 | High | RLS / consent | Email tables: `for all to authenticated using (true)` — any member can read PII and delete suppression records | `20260913000000_create_email_system.sql:116-161` |
| H5 | High | Access control | One flat `authenticated` role: all non-deleted people readable by every signed-in member (incl. child-safety fields) | `20260906000000_…sql:14-18`, `core/database/decision.md` A.2.1 |
| H6 | High | Info disclosure | Build publishes plugin source, worker source and SQL migrations to the web root | `scripts/copy-plugins.mjs:4-38`, `dist/content/plugins/**` |
| H7 | High | RLS / PII | anon SELECT on the `people` base table exposes **all columns** (email, mobile, DOB, WWCC, medical, consents) of every `access_permission='public'` row, and `search_people` RPC is EXECUTE-to-PUBLIC returning full rows — defeats the `people_public` column restriction (violates REQ-1) | `20260906000001_…sql:77-82`, `20260908130000_create_people_search.sql:161-172` |
| M1 | Medium | Credentials | Elvanto API key sent from the browser (Basic header) to `api.elvanto.com`; dev proxy sets `secure:false` | `…/settings/ConnectionTab.tsx:55-95`, `vite.config.ts:41-50` |
| M2 | Medium | Crypto | API-key "encryption at rest" uses a key available to the browser / a hardcoded dev key | `…/utils/encryption.ts:15-45`, worker `index.ts:97-117` |
| M3 | Medium | Error handling | Edge Fn CORS is `*` and 500s echo `err.message` | `email-send/index.ts:23-27,300-320` (+ both other functions) |
| M4 | Medium | DoS | No rate limiting or size caps on the `email-send` recipient loop, sync trigger, unsubscribe POST | `email-send/index.ts:190-226`, `email-unsubscribe/index.ts:111-156` |
| M5 | Medium | Design | `forms`/`form_fields`/`form_submissions` have no RLS; the public form path cannot work, and a naive fix would open anonymous PII injection | `20260828100000_create_forms.sql` (no `ENABLE ROW LEVEL SECURITY`), `forms/lib/queries.ts:154-227` |
| M6 | Medium | Info disclosure | Error page offers a "technical details" panel with stack traces | `src/core/errors/ErrorPage.tsx:34-42` |
| M7 | Medium | Design | Client/function contract mismatch: client sends `{to,subject,body}`, function requires `{sendId,recipients,from,consentCategory}` | `src/core/email/lib/client.ts:21-26` vs `email-send/index.ts:40-48,172-179` |
| M8 | Medium | Misconfig | No CSP / HSTS / X-Frame-Options / X-Content-Type-Options anywhere; no `_headers` for the Cloudflare deploy | `index.html`, `wrangler.jsonc`, `dist/` (no `_headers`) |
| M9 | Medium | Session | Supabase session persisted in `localStorage` (no httpOnly cookie) + PWA auto-update shell — XSS = token theft | `core/login/decision.md:22`, `vite.config.ts:11-32` |
| L1 | Low | Hygiene | `supabase/.temp/*` (project ref, org id) committed despite `supabase/.gitignore`; production PII samples in `scripts/elvanto-probe/` | `git ls-files`, `scripts/elvanto-probe/report.json` |
| L2 | Low | Supply chain | Two competing lockfiles (`pnpm-lock.yaml` **and** `package-lock.json`) at one install boundary | `git ls-files`, `package.json:6` |
| L3 | Low | Supply chain | No CI: audit, typecheck, lint and RLS verification are not enforced on push | no `.github/workflows` |
| L4 | Low | Info disclosure | Sync/plugin internals logged to the browser console | `pluginManager.ts:85-126`, `PluginAPI.tsx:63-114` |
| L5 | Low | Hygiene | Deployed worker duplicated at `src/content/plugins/elvanto-sync/sync/edge-function.ts`; root temp scripts (`fix_useSortableList.cjs`, `tmp-*.mjs`, `tsc-baseline.txt`, empty `Continue`) | repo root |
| L6 | Low | Misconfig | Third-party font/CSS origins (rsms.me, Google Fonts) loaded without SRI and must be CSP-allowlisted | `index.html:15-24` |
| L7 | Low | Ops / privacy | No `robots.txt`/`_headers`; no documented retention or erasure path for the PII the app collects | repo, `core/database/decision.md` |

---

## 3. Detailed findings

### C1 · Critical · `email-send` is an unauthenticated, client-controlled SMTP relay

**Evidence** — `supabase/functions/email-send/index.ts`

```ts
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, …)      // :29  ← service_role
serve(async (req) => {
  if (req.method !== 'POST') …                                                 // :162
  const body = await req.json() as SendRequest                                 // :172
  const { sendId, recipients, subject, body: htmlBody, from, consentCategory } = body  // :173
  if (!from) throw new Error('from is required')                               // :179 ← no allowlist
  … for (const recipient of recipients) { … }                                  // :190 ← no cap
  const info = await transporter.sendMail({ from: { email: from, … }, to: recipient.email, … }) // :135
```
No `auth.uid()` / `getUser()` / role check exists anywhere in the function (verified: no
`getUser`/`auth.uid` matches in `supabase/functions/**`). The permission model lives only in
`src/core/email/lib/permissions.ts` (`canSendEmail`, `filterRecipientsByRole`) — UI code the
caller can ignore. `src/core/email/lib/client.ts:21` invokes the function with whatever token
supabase-js holds, which for a signed-out visitor is the **public anon key**.

**Impact** — anyone can send arbitrary mail from the church's Google Workspace SMTP identity
(`SMTP_USER`/`SMTP_PASS` are the church account) to arbitrary recipients, with an arbitrary
`from` (spoof), subject and HTML body: phishing, spam, domain-reputation and Workspace-account
damage. Consent/suppression checks run only when `recipient.person_id` is supplied, so an
attacker-controlled recipient list bypasses them entirely. No rate limit → SMTP amplification
per request.

**Fix**
1. In-function authorization first: resolve the caller from the `Authorization` header with an
   anon-key client, `getUser()`, load `people.access_permission` for that `auth.uid()`, and
   reject anything below `team_leaders` (or require a `service_role`/cron caller). 401/403 on
   failure — never fall through to sending.
2. Derive `from` server-side from `email_sender_aliases` (or `SMTP_FROM`) and reject a body
   `from` that is not in the allowlist; record the resolved alias on the send row.
3. Require the `email_sends` row to exist, belong to the caller, and have `status='queued'`;
   derive `subject`/`body`/`recipients` server-side from that row rather than trusting the body.
4. Cap `recipients.length` (e.g. 500) and per-caller sends/minute; add a shared-store rate
   limiter (Upstash/Redis) because Edge Functions are per-invocation.

### C2 · Critical · `elvanto-sync-worker` runs with `service_role` and accepts the public anon key

**Evidence** — `supabase/functions/elvanto-sync-worker/index.ts`

```ts
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''   // :13
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, …)           // :36
serve(async (req) => { … const body = await req.json()                              // :425,449
  if (body.action === 'test_connection' && body.api_key) { … Authorization: Basic btoa(api_key + ':') } // :451-457
  if (body.action === 'list_locations'  && body.api_key) { … }                      // :525
  … full multi-entity sync, service-role writes … }                                 // :300-421
```
and the caller — `src/content/plugins/elvanto-sync/sync/trigger-sync.ts`

```ts
const apiKey = getSupabaseAnonKey()                                    // :52 ← public key
fetch(getElvantoSyncWorkerUrl(), { headers: { apikey: apiKey,
       Authorization: `Bearer ${apiKey}` } … })                       // :54-59
```
The gateway's `verify_jwt` is satisfied by *any* project-signed JWT, and the anon key is one.
`supabase/config.toml` declares no `[functions.*]` block, so the hosted default
(`verify_jwt = true`) applies — which the anon key passes.

**Impact** — anonymous users can trigger full syncs (`people`, `services`, `batches`,
`transactions`, …) that write with `service_role`: DoS, Elvanto API quota burn, DB write
amplification, `elvanto_sync_history`/dead-letter spam, and — via `test_connection` /
`list_locations` — a free oracle that validates any Elvanto API key an attacker supplies
(the response body mirrors Elvanto's upstream response).

**Fix** — reject requests whose JWT role is not a genuine signed-in user: verify with
`supabase.auth.getUser(token)` using the anon-key client, then require
`access_permission IN ('admin','super_admin')` for `trigger`/`fullScan`/`test_connection`;
keep a separate `service_role` path for `pg_cron` triggers (check `role === 'service_role'`
explicitly). Stop using the anon key as a bearer for privileged functions.

### C3 · Critical · Anonymous users can rewrite app settings and toggle plugins

**Evidence** — three migrations, each idempotently re-asserting the same permissive policy:

```sql
-- 20260829140000_fix_anon_storage_and_settings_write.sql:23-36 (re-applied by 20260906000001 / 20260906000003)
create policy "Anon write settings"  on platform_settings for insert to anon with check (true);
create policy "Anon update settings" on platform_settings for update to anon using (true);
GRANT INSERT, UPDATE ON public.platform_settings TO anon;   -- 20260829000001_grant_anon_settings_write.sql:9

-- 20260830100000_create_plugins_table.sql:17-27
create policy "Anon update plugins" on public.plugins for update to anon USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugins TO anon;
```
The stated intent was "lab has no auth — tighten these when auth lands"
(`20260829000001_…sql:1-7`, `20260829120000_…sql:5-7`). Auth has landed (`AuthProvider`,
`people.auth_user_id`, `access_permission`), but the anon policies were never tightened — and
three later "fix" migrations re-assert them.

**Impact** — anyone with the public key (no account) can overwrite the `app-settings` row
(`churchInfo`, `appName`, `logoUrl`, theme → defacement, phishing-ready branding) and flip
`plugins.enabled`: disable `elvanto-sync` (stops syncs) or enable a plugin for a tenant it is
not meant for. Because `saveAppSettings` upserts on `(key, environment)`, one POST replaces
production settings.

**Fix** — revoke the anon INSERT/UPDATE grants and drop those policies (keep anon SELECT for
pre-auth branding), then add role-scoped policies:

```sql
revoke insert, update, delete on public.platform_settings from anon;
drop policy if exists "Anon write settings"  on public.platform_settings;
drop policy if exists "Anon update settings" on public.platform_settings;

create policy "Super admins write settings" on public.platform_settings
  for all to authenticated
  using (exists (select 1 from people p where p.auth_user_id = auth.uid()
                  and p.access_permission = 'super_admin' and p.deleted_at is null))
  with check (exists (select 1 from people p where p.auth_user_id = auth.uid()
                  and p.access_permission = 'super_admin' and p.deleted_at is null));
```
Same pattern for `plugins`, and mirror it in the app layer so the UI hides actions it cannot
perform (defense in depth, never the control).

### C4 · Critical · Anonymous users can read and rewrite the Elvanto credential/config tables

**Evidence** — `supabase/migrations/20260829150000_fix_plugin_rls.sql`

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.elvanto_settings TO anon;                          -- :13
create policy "Anon read settings"   on public.elvanto_settings for select to anon using (true);  -- :19
create policy "Anon update settings" on public.elvanto_settings for update to anon using (true);  -- :21
GRANT SELECT, INSERT, UPDATE, DELETE ON public.elvanto_sync_config TO anon;                       -- :24
create policy "Anon read config"     on public.elvanto_sync_config for select to anon using (true);
create policy "Anon update config"   on public.elvanto_sync_config for update to anon using (true);
GRANT SELECT, INSERT ON public.elvanto_sync_dead_letter TO anon;                                  -- :42
```
plus `20260829140000_…sql:4-21`, which grants anon INSERT/UPDATE/DELETE on the **public**
`brand-assets` storage bucket.

**Impact** — the encrypted Elvanto API key (`elvanto_settings.api_key_encrypted`) and OAuth
tokens are downloadable without an account; sync field mappings, watermarks and schedule
(`elvanto_sync_config`) are attacker-writable, as are dead-letter rows (which carry raw PII from
failed syncs). `brand-assets` becomes free public file hosting on the church's domain and the
logo can be replaced by anyone.

**Fix** — revoke all anon grants on plugin tables, keep only what the plugin needs server-side,
and scope `brand-assets` writes to `authenticated` + super admin. The credential path
(`getCredentials`/`setCredentials`) must move behind an Edge Function (see M2) rather than
reading the encrypted key into the browser.

### C5 · Critical · The address book and the family graph are readable by anonymous users

**Requirement context** — REQ-1 (added to this audit 2026-09-19): people's personal details —
lastname, address, email, contact number, WWCC number, medical and consent data — must be locked
behind login for authenticated members only (see §9).

**Evidence** — the 2026-08-28 "lab, no auth" migration enabled RLS but gave every people-adjacent
table a `USING (true)` SELECT policy, and `anon` holds SELECT grants on all of them:

```
20260828120000_add_rls_policies.sql:18-41   policies "Public read access" USING (true)
                                            on households, addresses, people_relationships,
                                            tags, people_tags (people was later re-scoped;
                                            these four were never refined)
20260828120001_grant_anon_permissions.sql:7-11   GRANT SELECT … TO anon (all of them)
20260907000001_…sql:16,31,57                grants re-affirmed in the production "fix" migration
```

`people` itself was re-scoped on 2026-09-06 (`USING (deleted_at is null AND access_permission =
'public')`), but `addresses`, `households`, `people_relationships` and `people_tags` kept their
unconditional policies. PostgREST therefore serves, to a logged-out visitor with the anon key:

- `GET /rest/v1/addresses?select=*` → **every household's street address** (line1, line2, suburb,
  state, postcode) — no scoping at all;
- `GET /rest/v1/people_relationships?select=*` → the **complete family/guardian graph** for every
  person in the database (including non-public ones), joinable to `people_public` to name them;
- `households` (names) and `people_tags` (tag/journey assignments for everyone) likewise.

**Impact** — a direct violation of REQ-1 and, on its own, a serious PII disclosure: street-level
addresses of the whole congregation and the household structure of every member (guardians of
children included) are world-readable. It also undermines the H2/H7 column story — even with the
view fixed, anon can pivot through relationships and addresses.

**Fix** — `REVOKE SELECT ON addresses, households, people_relationships, people_tags FROM anon;`
and replace the four `USING (true)` policies with `FOR SELECT TO authenticated` ones (or drop
them — the authenticated SELECT comes from the policy in `20260828120000`, so a replacement is
needed). Keep `tags` readable if the tag picker must work pre-auth (tag names are not PII). If
any public profile page legitimately needs the family graph, expose it through a filtered
`security_invoker = on` view like `people_public`, never through the base table. Listed as
remediation 0.6.

### H1 · High · No route guard — the authenticated surface renders for anonymous visitors

**Evidence** — `src/core/router.tsx:14-40` mounts `AppShell` around `/people`, `/forms`,
`/settings`, `/example`, `/account` with no loader or guard; `src/core/ui/app-shell.tsx:29-51`
renders the Sidebar from `useSettings()` without consulting `useAuth()`. The only
`navigate('/login')` in the codebase is the *post-sign-out* redirect
(`src/core/auth/AccountPage.tsx:22`), and `LoginPage` redirects signed-in users the other way.
The pre-auth posture is further masked by the lab mock session
(`src/core/auth/provider.tsx:69-88`).

**Impact** — anonymous visitors get the full shell and every module UI (people dashboard,
journeys, forms builder, settings editors, email composer). What they can *do* is limited only
by RLS — which is exactly what C3, C4 and H2 break. UI role gating
(`useCurrentOperatorPermission`) is not a control: the same supabase-js calls can be made from
the browser console.

**Fix** — introduce a guard wrapper and move authenticated routes under it:

```tsx
function RequireAuth() {
  const { session, isLoading } = useAuth()
  if (isLoading) return <Loader />
  return session ? <Outlet /> : <Navigate to="/login" replace />
}
// children: [ { element: <RequireAuth />, children: [ AppShell routes… ] } ]
```
Keep `/login` and `/forms/:formId` (public form) outside. Gate the mock-session fallback to lab
builds only (`import.meta.env.MODE === 'development' && import.meta.env.VITE_LAB_MODE`).

### H2 · High · `people_public` bypasses RLS and exposes every person to anon

**Evidence** — `supabase/migrations/20260908120000_create_people_public_view.sql`

```sql
create or replace view people_public as
select id, firstname, substr(lastname,1,1) as lastname_initial, demographic
from people where deleted_at is null;                     -- no access_permission filter
ALTER VIEW people_public SET (security_invoker = off);    -- :18 owner rights → RLS not applied
GRANT SELECT ON people_public TO anon;                    -- :20
```
The documented posture is the opposite: `core/database/decision.md` A.2.1 ("anon =
`access_permission='public'` rows only") and A.2.2 ("`people_public` view: `lastname_initial` …
full last name never public"). `20260908130000_create_people_search.sql:9-12` even claims
`search_people` matches "the same scoping as the `people_public` view" — it does not, because
`search_people` is deliberately **not** `SECURITY DEFINER` and therefore *is* filtered by RLS
(`20260906000000_…sql:9-12`). The view is the one place the filter is missing.

**Impact** — anyone can enumerate the whole congregation (first name, last initial, demographic)
including children and `member_area`-only people, with the row `id` attached — a ready-made
target list for the child-safety-sensitive dataset this project names as its hardest constraint.

**Fix** — add the predicate and let the view honour the caller:

```sql
create or replace view people_public with (security_invoker = true) as
select id, firstname, substr(lastname,1,1) as lastname_initial, demographic
from people
where deleted_at is null and access_permission = 'public';
```
Verify with the anon key: `select count(*) from people_public` must equal the
`access_permission='public'` count, not the table count.

### H3 · High · Unsubscribe suppression is broken — unsubscribed people still get broadcasts

**Evidence** — `supabase/functions/email-unsubscribe/index.ts`

```ts
await supabase.from('email_unsubscribes').insert({
  id: crypto.randomUUID(),
  email_hash: '',              // :129 ← never derived from the token or the address
  token_hash: tokenHash,       // :130
  …
})
```
The consumer compares a **fresh SHA-256 of the recipient address**:

```ts
// email-send/index.ts:57-73 (mirrored in src/core/email/lib/sending.ts:13-33)
async function hashEmail(email) { … crypto.subtle.digest('SHA-256', …) }
async function isSuppressed(email) {
  const emailHash = await hashEmail(email)
  return (await supabase.from('email_unsubscribes').select('email_hash')
           .eq('email_hash', emailHash).maybeSingle()).data !== null
}
```
`email_hash` must be the hash of the address the token was issued for, so an empty string can
never match any address. The `reason` and token are stored, so the unsubscribe *looks* recorded
(`GET` on an already-unsubscribed token returns "Already Unsubscribed") while suppression
silently fails open.

**Impact** — a person who unsubscribes keeps receiving broadcasts and team updates. That is a
privacy/consent failure (Spam Act 2003 / GDPR-style expectations) with reputational and legal
exposure, and it makes `email_recipients.status='suppressed'` untrustworthy as evidence. It also
leaves `filterByConsent` (audience resolution) as the only gate — bypassable when `person_id` is
omitted (C1).

**Fix**
1. Issue tokens that resolve back to the address server-side: a `email_unsubscribe_tokens` table
   with `token_hash`, `email_hash`, `send_id`, `used_at`, `expires_at`; on POST copy `email_hash`
   from the matched token row — never from a blank literal.
2. Fail closed: no matching token row → 400, and insert nothing.
3. Add an end-to-end test: unsubscribe a known address, then assert
   `isSuppressed(address) === true` and that `email-send` records `status='suppressed'`.
4. Fix the confirmation form `action` (`/email/unsubscribe?token=…` is a relative path — use the
   function's absolute URL) so the flow works at all.

### H4 · High · Email tables are `authenticated`-wide — any member can tamper with consent evidence

**Evidence** — `supabase/migrations/20260913000000_create_email_system.sql:116-161`

```sql
create policy "Authenticated can manage templates"    on email_templates    for all to authenticated using (true);
create policy "Authenticated can manage sends"        on email_sends        for all to authenticated using (true);
create policy "Authenticated can manage recipients"   on email_recipients   for all to authenticated using (true);
create policy "Authenticated can manage unsubscribes" on email_unsubscribes for all to authenticated using (true);
create policy "Authenticated can manage aliases"      on email_sender_aliases for all to authenticated using (true);
grant select, insert, update, delete on email_unsubscribes to authenticated;
```
No `access_permission` scoping, while the app layer says sending needs `team_leaders+` and
SMTP/aliases need `super_admin` (`src/core/email/lib/permissions.ts`).

**Impact** — any signed-in member (including `member_area` — a volunteer, or a compromised
low-privilege account) can delete unsubscribe rows (re-enabling mail to people who opted out),
read every recipient address and send record, edit `from_email` on templates and change sender
aliases — i.e. rewrite the audit trail for outbound mail.

**Fix** — replace `for all … using (true)` with role-scoped policies: SELECT/INSERT on
sends/recipients/templates for `team_leaders+` (own rows where possible); `email_unsubscribes`
insert-only for the app, read/delete `admin+`; `email_sender_aliases` `super_admin` only. Leave
service-role writes to the Edge Function.

### H5 · High (accepted, time-boxed) · One flat authenticated role over all PII

**Evidence** — `20260906000000_refine_people_rls_for_auth.sql:14-18`

```sql
create policy "Authenticated read access" on people
  for select to authenticated using (deleted_at is null);
```
This is the documented MVP posture (`core/database/decision.md` A.2.1) and also the largest
remaining blast radius: any signed-in account can read every member's full record — DOB, address,
phone/email, consents, journey, and child-safety fields that the profile UI only *displays*
conditionally (`src/modules/people/lib/profile-permissions.ts` computes `isPublic`/`isYouth`
**after** the row has been fetched).

**Impact** — one low-privilege leak (a shared login, a volunteer account not disabled at
offboarding) exposes the entire congregation's PII, including minors. RLS currently cannot
distinguish `member_area` from `super_admin`.

**Fix (decision required)** — pick one and record it in `core/database/decision.md` with a review
date: (a) split `authenticated` reads by `access_permission` scope (public directory / team /
admin), or (b) move private fields behind a projection view so the wide row never reaches the
browser. Either way, stop returning child-safety columns to callers who cannot see them in the UI.

### H6 · High · The build publishes plugin source, worker source and SQL migrations

**Evidence** — `scripts/copy-plugins.mjs` copies **everything** from `src/content/plugins` into
`public/content/plugins` (`:7-38`) and runs in `dev`, `build` and `build:cfp` (`package.json:9-11`).
The result is served from the web root:

```
dist/content/plugins/elvanto-sync/sync/edge-function.ts  ← duplicate of the deployed worker
dist/content/plugins/elvanto-sync/db/migrations/*.sql    ← plugin schema + RLS model
dist/content/plugins/elvanto-sync/settings/**/*.tsx      ← admin UI + settings keys
dist/content/plugins/elvanto-sync/utils/encryption.ts    ← dev encryption key, IV layout
```
**Impact** — anyone can read the sync implementation, the credential-handling design, the
`elvanto_*` schema and the exact `elvanto_settings` row id the client uses — i.e. a map for the
attacks in C2/C4. `edge-function.ts` is also drifting dead weight (it duplicates
`getEncryptionKey`, `corsHeaders`, sync order, …).

**Fix** — copy an explicit allowlist (`manifest.json`, plus `index.ts` only if the plugin is truly
loaded over HTTP rather than via the eager `import.meta.glob` in
`src/core/plugins/pluginManager.ts:26`). Delete `src/content/plugins/elvanto-sync/sync/edge-function.ts`
and keep the worker only in `supabase/functions/`. Add a build assertion that fails when any
`*.ts`/`*.sql` appears under `public/content/plugins`.

### H7 · High · The `people` base table and the `search_people` RPC leak all PII columns of "public" people to anon

**Requirement context** — REQ-1 (see §9). The `people_public` view was designed to be the *only*
anonymous people surface, exposing exactly `id, firstname, lastname_initial, demographic`
(`20260908120000_create_people_public_view.sql:6-16`). Two other doors bypass that column
restriction:

**Evidence**

```
20260906000001_…sql:77        GRANT SELECT ON public.people TO anon;
20260906000001_…sql:79-82     policy "Public read access" TO anon
                              USING (deleted_at is null AND access_permission = 'public')
20260908130000_…sql:161-172   search_people(search_query, max_results) RETURNS SETOF people
                              — no EXECUTE grant/revoke → defaults to PUBLIC
```

The policy filters **rows** but not **columns**: `GET
/rest/v1/people?access_permission=eq.public&select=email,mobile,date_of_birth,wwcc_number,medical_anaphylaxis_allergy,elvanto_security_code`
returns those columns for every public-flagged person. The RPC is a security-invoker function
returning **whole rows** (`p.*`), so anon callers get the same column set, plus an email/phone
enumeration oracle (`person_matches_query` matches on `email` and `mobile`,
`20260908130000_…sql:101-102`).

**Impact** — full contact, birth, WWCC/safe-ministry, medical, consent and Elvanto-code data of
everyone whose `access_permission` is `'public'` is anonymous-readable. Severity escalates to
Critical in proportion to how many records are flagged public; treat as High with an immediate
fix either way. Children's DOB/school fields are included in the leak set.

**Fix** — `REVOKE SELECT ON public.people FROM anon;` (keep the view as the sole anon people
surface) and `REVOKE EXECUTE ON FUNCTION search_people(text,integer) FROM PUBLIC; GRANT EXECUTE
ON FUNCTION search_people(text,integer) TO authenticated;` (also revoke `EXECUTE` on the
`field_strength`/`tag_score`/`person_matches_query`/`person_match_scores` helpers from PUBLIC for
tidiness). Then apply the H2 view fix. Listed as remediation 0.7. This pairs with the missing
`people` write policies noted in §9 (fresh-DB writes fail with 42501 — production is running
unversioned policies).

### M1 · Medium · The Elvanto API key is used from the browser; the dev proxy disables TLS checks

**Evidence**

```ts
// src/content/plugins/elvanto-sync/settings/ConnectionTab.tsx:55-95
const keyToTest = apiKey.trim() || (savedKey ? await decrypt(savedKey) : '')   // :56 plaintext key in JS
const base = isDev ? '/api/elvanto' : 'https://api.elvanto.com'                // :68
fetch(`${base}/v1/people/getAll.json`, { method: 'POST',
  headers: { Authorization: `Basic ${btoa(keyToTest + ':')}` }, … })            // :73

// vite.config.ts:41-50
server: { proxy: { '/api/elvanto': { target: 'https://api.elvanto.com',
          changeOrigin: true, secure: false, … } } }                           // secure:false = no cert check
```
**Impact** — (a) the integration credential is decrypted and used inside the browser, so any XSS
or malicious extension on a staff machine steals the Elvanto API key (which is an account-admin
key per `.env.example:16-19`); (b) in development the proxy accepts any certificate, so a
network attacker can capture the Basic-auth header. Elvanto does not send CORS headers, so this
cross-origin call in production is also fragile.

**Fix** — move credential entry and the test/locations calls into an Edge Function
(`test_connection`/`list_locations` already exist in the worker — keep them server-side, never
hand the key to the client; C2 covers their auth). Remove `secure: false` from the dev proxy.
Treat the Elvanto key as a server-only secret (`SUPABASE_…` function secret), and rotate the
existing key because it has been handled client-side.

### M2 · Medium · "Encrypted at rest" uses a browser-visible key

**Evidence** — `src/content/plugins/elvanto-sync/utils/encryption.ts`

```ts
const envKey = import.meta.env.VITE_ELVANTO_ENCRYPTION_KEY || process.env.ELVANTO_ENCRYPTION_KEY  // :16
…
if (import.meta.env.DEV) { const devKey = 'dev-key-elvanto-sync-plugin-change-in-production'     // :31-34
  … padEnd(32,'0').slice(0,32) }
throw new Error('ELVANTO_ENCRYPTION_KEY environment variable not set')                            // :44
```
Any `VITE_`-prefixed variable is inlined into the client bundle, so encrypt-and-decrypt both
happen where the attacker is: the ciphertext protects nothing against a determined reader (the
key ships with the code). The worker's `getEncryptionKey()` (`index.ts:97-117`) additionally falls
back to a hardcoded dev key when `ELVANTO_ENCRYPTION_KEY` is unset — so a misconfigured
production deploy silently uses a public key, and the "development only" comment cannot enforce
itself.

**Impact** — false assurance: the audit trail says the key is encrypted, but the confidentiality
of a full Elvanto admin credential rests on a key stored beside it (or on a literal in the repo).
If an anon-readable row is dumped (C4), the key is recoverable.

**Fix** — encrypt/decrypt only inside the Edge Function with a function secret (no `VITE_`
prefix); make the worker **fail hard** when `ELVANTO_ENCRYPTION_KEY` is absent outside
`Deno.env.get('ENVIRONMENT') === 'development'`; store the key in Supabase Vault or function
secrets, never in a bundle; re-encrypt the existing row after rotation.

### M3 · Medium · Wildcard CORS and internal error messages from every Edge Function

**Evidence** — identical header block in all three functions, e.g.
`supabase/functions/email-send/index.ts:23-27`, and the 500 handler at `:300-319`

```ts
const corsHeaders = { 'Access-Control-Allow-Origin': '*', … }
…
return new Response(JSON.stringify({
  error: 'Internal server error',
  message: err instanceof Error ? err.message : String(err)   // :313 ← internals echoed to caller
}), { status: 500, headers: { ...corsHeaders, … } })
```
**Impact** — any origin can drive these functions with a victim's token (no origin restriction),
and error strings leak SMTP host/auth failures, DB constraint names and stack messages.

**Fix** — restrict `Access-Control-Allow-Origin` to the app origins (Cloudflare Pages domain +
`http://localhost:5173` in dev); log detail server-side (`console.error`) and return a
correlation id plus a generic message.

### M4 · Medium · No rate limiting, size caps or loop bounds on abuse-shaped endpoints

**Evidence**

```ts
for (const recipient of recipients) { … await isSuppressed(email) }  // email-send/index.ts:190 (unbounded;
                                                                     // one SMTP/suppression call per recipient)
toSend.map(async (recipient) => sendIndividualEmail(…))              // :217-220 (unbounded concurrency fan-out)
serve(async (req) => { … await syncAll(body.entity, …) })            // elvanto-sync-worker/index.ts:300-421
                                                                     // (full entity list, no per-caller throttle)
if (req.method === 'POST') { … insert one row per POST }             // email-unsubscribe/index.ts:111-134
```
**Impact** — request amplification (one HTTP call → hundreds of outbound SMTP/Elvanto calls),
quota and cost burn, DB write amplification, and suppression-table pollution from repeated POSTs
(a replayed token hits the `token_hash` unique constraint and returns 500).

**Fix** — cap `recipients.length`; bound concurrency with a small worker pool; add a shared-store
rate limit per caller/IP (`@upstash/ratelimit` — Edge Functions are per-invocation, so in-memory
counters do not work); make unsubscribe idempotent (`upsert` / `on conflict do nothing` → 200)
and cap `reason` length; enforce a body-size limit before `req.json()`/`req.text()`.

### M5 · Medium · Forms have no RLS; the public-submission path is unwired and dangerous to wire naively

**Evidence** — `supabase/migrations/20260828100000_create_forms.sql` creates `forms`,
`form_fields`, `form_submissions` and never runs `ENABLE ROW LEVEL SECURITY`;
`20260907000001_fix_production_grants_for_app_tables.sql:72-79` grants only
`authenticated`/`service_role`. Meanwhile the route is public (`src/core/router.tsx:30-34`) and
`submitForm()` runs entirely as the visitor:

```ts
// src/modules/forms/lib/queries.ts:154-227
const form = await getFormById(formId)                       // anon read of forms/form_fields
if (form.submit_action === 'create_person') { await supabase.from('people').insert({ … access_permission: 'member_area' }) }  // :178-195
else if (form.submit_action === 'update_person') { … update(personPatch).eq('id', data.id) }                                 // :197-207 (by email match)
await supabase.from('form_submissions').insert({ … answers })                                                                // :220-224
```
**Impact** — as shipped, an anonymous visitor cannot load or submit a form (no anon grant): the
feature is broken. If the obvious "grant anon + open policy" fix is applied, the same code becomes
anonymous PII injection plus **unauthenticated update of existing people** via email match
(`update_person`) — an account-data-takeover primitive on a public URL, with no rate limit, no
captcha and no validation of `maps_to_field` against `MAPPABLE_PERSON_FIELDS`.

**Fix** — pick and document the design in `core/database/decision.md`. If public submission is
required: expose only a narrow `forms_public` view (`id,name,description,settings`) plus a
`submit_form(form_id, answers)` RPC that (i) validates answers against the field definitions
server-side, (ii) whitelists mappable columns, (iii) never updates an existing person from an
anonymous caller, (iv) is rate-limited/captcha-gated, and (v) writes `form_submissions` only.
Revoke `update_person`/`add_to_tag` for anon entirely.

### M6 · Medium · Stack traces offered to end users

**Evidence** — `src/core/errors/ErrorPage.tsx:10-42` renders `error.stack` and `location.pathname`
behind a "Show technical details" toggle; `ErrorBoundary` prints `error.message`
(`src/core/ui/error-boundary.tsx:34-41`).

**Impact** — information disclosure (file paths, library internals, table/column names from
supabase-js errors) to any user — and it contradicts the skill's Never-Do list ("never expose
stack traces"). Source maps are not published (`dist/` has no `*.map`), which limits damage but
does not remove it.

**Fix** — show a generic message plus a correlation id in production; keep details behind
`import.meta.env.DEV`; ship the details to a server-side log/telemetry sink instead.

### M7 · Medium · The email client and the email function disagree on the contract

**Evidence** — the client sends the UI-facing shape and never creates a send row:

```ts
// src/core/email/lib/client.ts:20-26
const { data, error } = await supabase.functions.invoke('email-send', { body: input })
// input: { to: EmailRecipient[], subject, body }        ← src/core/email/lib/types.ts:8-13
```
while the function requires `sendId`, `recipients`, `from`, `consentCategory` and throws
`sendId is required` / `recipients are required` otherwise (`email-send/index.ts:172-184`), then
updates `email_sends` by id (`:181-184`) and reads `consent_*` columns.

**Impact** — the only caller that works today is a hand-crafted one (curl/console): (a) the SMTP
path is effectively dead from the UI, and (b) the C1 abuse surface is reachable *only* by
attackers, not by the product — the worst combination for detection.

**Fix** — have the app create the `email_sends` row first (with `created_by`, audience, consent
category, resolved `from` alias) and let the function accept only `{sendId}`, deriving everything
else from that row; then test the real client → function path.

### M8 · Medium · No security headers on the deployed app

**Evidence** — no CSP meta tag and no `_headers` file anywhere (`index.html` has only
`charset`/`viewport`/`icon`/`manifest`/font links); deploy is Cloudflare assets
(`wrangler.jsonc:8-11`, `not_found_handling: single-page-application`); `dist/` has no `_headers`.
`scripts/clean-redirects.mjs` shows header work is not yet part of the build.

**Impact** — no defense-in-depth against XSS (M9 makes the session token the prize), no
clickjacking protection for admin screens, no HSTS, no MIME-sniffing protection.

**Fix** — add `public/_headers` (copied verbatim into `dist/`):

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://rsms.me https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://rsms.me; img-src 'self' data: blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.elvanto.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), camera=(), microphone=()
```
(tighten `connect-src` once M1 moves Elvanto calls server-side; verify against the built bundle —
Panda emits inline styles, hence `style-src 'unsafe-inline'` unless hashes are added).

### M9 · Medium · Session tokens in `localStorage` with no CSP is one XSS from account theft

**Evidence** — `core/login/decision.md:22`: "PWA session persists via supabase-js localStorage";
`src/core/lib/supabase.ts:17` uses default auth storage (no cookie/storage override);
`vite.config.ts:11-32` registers a PWA with `registerType: 'autoUpdate'`.

**Impact** — XSS (or a malicious extension) can read `sb-*-auth-token` from `localStorage` and
impersonate the user, including `super_admin` actions. This is the standard Supabase trade-off,
not a code bug — but the skill's "never store sessions in client-accessible storage" rule means it
must be a **recorded decision with compensating controls**, which are currently absent (M8) even
though the app injects remote CSS from `rsms.me` (`index.html:20-24`) — a supply-chain path into
the same origin.

**Fix** — record the decision in `core/login/decision.md` with a review date; compensate by
shipping the M8 CSP, self-hosting Inter instead of remote CSS, and requiring re-auth for admin
actions.

### L1 · Low · Committed CLI artifacts and local PII samples

`supabase/.temp/*` (`linked-project.json` holds the project ref + org id; plus `project-ref` and
version stamps) and `supabase/.branches/_current_branch` are tracked even though
`supabase/.gitignore:2-3` lists `.temp` and `.branches` — gitignore does not untrack. Separately,
`scripts/elvanto-probe/*` (production PII samples — correctly gitignored) and
`supabase/run-output.log` exist in the working tree; keep them out of commits and backups.
**Fix:** `git rm -r --cached supabase/.temp supabase/.branches`.

### L2 · Low · Two lockfiles at one install boundary

`package.json:6` declares `packageManager: pnpm@10.34.5` and `pnpm-lock.yaml` is the authoritative
lockfile, but `package-lock.json` is also committed. Installs are therefore non-reproducible across
npm/pnpm and the audit target is ambiguous. **Fix:** delete `package-lock.json`, document pnpm as
the only manager, and use `pnpm install --frozen-lockfile` everywhere.

### L3 · Low · No CI enforcement

There is no `.github/workflows` (verified), so the audit gate, `pnpm typecheck`, `pnpm lint`,
`pnpm test` and any RLS check run only when a human remembers; the previous RLS verification
script was deleted (`scripts/rls-verify.mjs`, commit `a5d133d`). **Fix:** add CI running
`pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm test`,
`pnpm audit --prod --audit-level high`, plus a smoke check that the anon key cannot insert/update
`platform_settings`, `plugins`, `elvanto_settings` or `brand-assets`.

### L4 · Low · Internals logged to the browser console

`src/core/plugins/pluginManager.ts:85-126` and `src/core/plugins/PluginAPI.tsx:63-114` log plugin
state, config keys and error objects in production builds. **Fix:** route through a `DEBUG` flag
that is stripped from production builds.

### L5 · Low · Drift and root clutter

`src/content/plugins/elvanto-sync/sync/edge-function.ts` duplicates the deployed worker (see H6);
`fix_useSortableList.cjs`, `tmp-fix-triggers.mjs`, `tmp-tsconfig-dnd-form.json`, `tsc-baseline.txt`
and an empty `Continue` file sit at the repo root. **Fix:** delete or move under `scripts/`.

### L6 · Low · Third-party asset origins without SRI

`index.html:20-24` loads CSS from `rsms.me` and preconnects to Google Fonts with no SRI and (until
M8) no CSP to constrain them. **Fix:** self-host the fonts (also improves offline PWA behaviour) or
pin with integrity attributes where supported.

### L7 · Low · No privacy lifecycle for collected PII

The app collects consents (`people.consent_broadcasts`/`consent_team_updates`), DOB, addresses and
child-safety notes, but no document states purpose, retention limit, export path or erasure path
(including the `people_public` view, search indexes, and `elvanto_sync_dead_letter`, which stores
raw sync payloads). **Fix:** add a short privacy note beside `core/database/decision.md` covering
purpose per data class, retention (soft-delete tombstones are not erasure), who can export, and how
a deletion request reaches `people`, `people_public`, search indexes, `form_submissions`,
`email_recipients` and `elvanto_sync_dead_letter`.

---

## 4. Controls verified (do not regress these)

| Area | Status | Evidence |
|---|---|---|
| Dependency audit (runtime) | ✅ `pnpm audit --prod --audit-level moderate` → **"No known vulnerabilities found"** | run 2026-09-19 against `pnpm-lock.yaml` |
| Dependency install-script policy | ✅ fail-closed: only `esbuild` approved (`pnpm-workspace.yaml:1-3`); no blanket approvals; pnpm 10 blocks postinstall by default | `pnpm-workspace.yaml` |
| Secrets in tracked files / history | ✅ none: key-pattern scan (`eyJhbGciOi`, `sk_live_`, `AKIA…`, `AIza…`, `ghp_…`, PEM) clean; `.env` is ignored and untracked; `.env.example` holds placeholders only | `git grep`, `git check-ignore -v .env` |
| XSS via raw HTML | ✅ zero `dangerouslySetInnerHTML` in `src`; React auto-escaping used for every rendered field; the only `innerHTML` assignments are test clean-up (`ChildSafety.test.tsx:37,65`) | codebase scan |
| `eval` / dynamic code | ✅ none in `src`; `scripts/generate-theme-colors.mjs:63` evaluates Panda's own vendored token definition, not user input | codebase scan |
| SQL injection | ✅ no concatenated SQL in app code (PostgREST/parameterized); `search_people` is **not** `SECURITY DEFINER` so RLS still applies, and it strips `% _ \` from tokens before `ILIKE` (`20260908140000_…sql:24-28`) | migrations |
| Password storage | ✅ no passwords in the app schema — Supabase Auth owns hashing; `AccountPage` only forwards to `auth.updateUser` | `src/core/auth/*` |
| Plugin code-execution model | ✅ compile-time: `import.meta.glob('/src/content/plugins/*/index.ts', { eager: true })` + manifest schema validation; no remote script loading (H6 is disclosure only) | `src/core/plugins/pluginManager.ts:26,145-182` |
| HTTPS in transit | ✅ Cloudflare assets + Supabase APIs are HTTPS-only (dev proxy is the exception — M1) | `wrangler.jsonc`, `vite.config.ts` |
| Consent data model | ✅ `consent_broadcasts`/`consent_team_updates` columns + server-side `hasConsent()` check (gate sound; suppression half broken — H3) | `20260913000000_…sql:108-110`, `email-send/index.ts:75-84` |
| Soft-delete + audit | ✅ `deleted_at` tombstones and `people_audit` writes on sensitive updates | `20260826002000_…sql`, `src/modules/people/lib/email.ts:72-100` |

### 4.1 Dependency triage (skill decision tree applied)

| Package | Sev | Path | Reachable? | Decision |
|---|---|---|---|---|
| `effect <3.20.0` (GHSA-38f7-945m-qr2g) | high | `.>@park-ui/cli>effect` | dev-only CLI, never imported by app code or the build graph | **Fix when convenient** — bump `@park-ui/cli`; not a release blocker |
| `postcss <=8.5.17` / `<=8.5.22` (source-map path traversal) | high / moderate | `.>@pandacss/dev>@pandacss/node>postcss` | build-time CSS pipeline over **local** files; no attacker-supplied CSS processed | **Fix next dependency cycle** — bump `@pandacss/dev` or pin `postcss` via `pnpm.overrides` |
| `browserslist` (GHSA-73wf-gq98-2v4g) | moderate | `@pandacss/dev` chain | build-time only | **Backlog** |
| `postcss-selector-parser` (AST recursion DoS) | low | `@pandacss/dev` chain | build-time only, local input | **Track** with routine updates |

No forced remediation was applied (per the skill). Registry *signature* verification could not be
performed: `pnpm audit signatures` is unsupported in pnpm 10 (the command re-ran the advisory
scan), and the redundant `package-lock.json` (L2) muddies provenance — resolve L2 first, then
verify provenance against the single authoritative lockfile.

---

## 5. Remediation plan

### Wave 0 — stop the bleeding (before any production traffic)

| # | Action | Exit criteria |
|---|---|---|
| 0.1 | Add caller authorization to `email-send` and `elvanto-sync-worker` (C1, C2) | anon-key request → 401/403; authenticated non-admin → 403; admin → 200; `from` must be an allowlisted alias |
| 0.2 | Revoke anon writes on `platform_settings`, `plugins`, `elvanto_settings`, `elvanto_sync_config`, `elvanto_sync_dead_letter` and `brand-assets` (C3, C4) | anon `insert`/`update`/`delete` returns 42501/403 for all six; anon `select` still serves pre-auth branding |
| 0.3 | Fix the `people_public` view filter + `security_invoker` (H2) | anon `select count(*) from people_public` == count of `access_permission='public'` |
| 0.4 | Rotate the Elvanto API key and SMTP credentials (both have been client-side / reachable through open endpoints) | new secrets stored as Supabase function secrets only; old values revoked |
| 0.5 | Confirm `verify_jwt=true` on all three functions and that no function treats the anon key as a privilege | dashboard/`supabase functions list` output recorded in this audit |
| 0.6 | Revoke anon SELECT on `addresses`, `households`, `people_relationships`, `people_tags` and replace the four `USING (true)` policies with `to authenticated` ones (C5, REQ-1) | anon REST read of each table → 403/empty; authenticated member reads still work; public profile pages verified after the change |
| 0.7 | Revoke anon SELECT on `people`; make `people_public` the only anon people surface (fix per H2); `REVOKE EXECUTE` on `search_people` from PUBLIC, grant to `authenticated` (H7, REQ-1) | anon `/rest/v1/people?select=email…` and `rpc('search_people')` → 403/empty; view serves only public-directory columns of `access_permission='public'` rows |

### Wave 1 — correctness of advertised controls

| # | Action | Exit criteria |
|---|---|---|
| 1.1 | Fix unsubscribe: token table, `email_hash` from the token row, fail closed, idempotent POST (H3, M4) | end-to-end test: unsubscribe → next send records `suppressed`; replayed token → 200, one row |
| 1.2 | Role-scope the email tables (H4) | member `authenticated` cannot read `email_unsubscribes` or delete rows; `team_leaders+` can send |
| 1.3 | Add `RequireAuth` route guard; gate the lab mock session to lab builds (H1) | anonymous `/people` and `/settings` redirect to `/login`; no mock session in production builds |
| 1.4 | Replace `copy-plugins.mjs` with an allowlist; delete the duplicated `edge-function.ts` (H6, L5) | `dist/content/plugins` contains no `*.ts`/`*.sql`; build assertion fails otherwise |
| 1.5 | Add `public/_headers` with CSP/HSTS/nosniff/frame-ancestors (M8) | headers present in the deployed response (`curl -I`) |
| 1.6 | Super-admin gate for settings data: add `is_super_admin()` security-definer helper; re-point `platform_settings`, `module_config`, `plugins`, `elvanto_settings`, `elvanto_sync_config` policies to it; drop the anon write grants/policies (C3, C4, REQ-2); keep a **narrow** anon SELECT for pre-auth branding keys only (`brand.logo_url`, `brand.favicon_url`) | member-role `UPDATE platform_settings` → 42501; `super_admin` account succeeds; anon reads return only branding keys; `super_admin` never world-writable through the sync (confirm mapping) |
| 1.7 | Settings UI gating: sidebar Settings tile conditional on `getCurrentOperatorPermission() === 'super_admin'` (hidden while the role query loads), plus a `RequireSuperAdmin` guard on `/settings/*` (H1, REQ-2) | signed-out and plain-member users: tile not rendered, direct `/settings` URL redirects to `/login`; `super_admin` sees and saves settings |
| 1.8 | Version the missing write rules: people INSERT/UPDATE/DELETE policies for `authenticated`; enable RLS + policies on `people_audit` (REQ-1, H4/H5 drift) | fresh `supabase db reset`: create/edit person works; member cannot edit `people_audit`; write rules exist in migrations, not just in the production DB |

### Wave 2 — defense in depth

| # | Action |
|---|---|
| 2.1 | Move Elvanto credential entry/test server-side; drop `secure:false`; stop decrypting in the browser (M1, M2) |
| 2.2 | Restrict CORS to known origins; stop echoing internal errors (M3) |
| 2.3 | Private error page + server-side telemetry (M6) |
| 2.4 | Decide the forms submission design, then implement `submit_form` RPC + `forms_public` view — or drop the public route (M5) |
| 2.5 | Align the email client/function contract on `{sendId}` (M7) |
| 2.6 | Decide and record the `authenticated` access posture (H5) and the `localStorage` session trade-off (M9) |
| 2.7 | CI: frozen-lockfile install, typecheck, lint, test, `pnpm audit --prod --audit-level high`, anon-denial smoke test (L2, L3) |
| 2.8 | Privacy lifecycle note (purpose/retention/export/erasure); `git rm --cached supabase/.temp supabase/.branches` (L7, L1) |

**Guardrail:** every item that changes a policy, grant or bucket rule ships as a new idempotent
migration (repo convention) and is re-verified with the anon key. The "lab has no auth — tighten
these when auth lands" preamble in the 2026-08 migrations must not be reintroduced.

---

## 6. Skill verification checklist (current state)

| Check (from `security-and-hardening`) | Status |
|---|---|
| Native audit has no unmitigated reachable critical/high findings; CI preserves the lockfile and blocks unreviewed scripts | ⚠️ runtime audit clean; 1 high + 2 moderate dev-only advisories (4.1); no CI (L3); two lockfiles (L2) |
| No secrets in source code or git history | ✅ verified |
| All user input validated at system boundaries | ❌ not at the Edge Function boundary (C1, C2); partially at the client (zod validators exist in `people/forms` but are UI-side) |
| Destructive filesystem operations resolve symlinks, check allowlisted root/depth/ownership | n/a — none in app runtime (`scripts/*.mjs` only read/copy from fixed repo paths; `copy-theme`/`copy-plugins` use constants) |
| Authentication AND authorization on every protected endpoint | ❌ no route guard (H1), no function-level authZ (C1, C2) |
| Security headers present in response | ❌ M8 |
| Error responses don't expose internal details | ❌ M3 (server), M6 (client) |
| Rate limiting on auth endpoints, shared store when multi-instance | ⚠️ delegated to Supabase Auth; none on the app's own Edge Functions (M4) |
| Server-side URL fetches validated against an allowlist (no SSRF) | ⚠️ no user-supplied URL is fetched; Elvanto host is constant (`api.elvanto.com`). The worker does relay an attacker-supplied **API key** (C2) — fix with authZ, and keep the host constant |
| LLM/model output validated and encoded before use | n/a — no LLM features in this repo |
| Personal data classified, minimized to a purpose, retention-limited | ❌ L7 (also H2, H5) |
| Deletion and export work end-to-end incl. backups/caches/analytics | ❌ not implemented or documented (L7) |

---

## 7. Re-audit triggers

Re-run this audit (new dated file in this folder) when any of the following lands:

1. A new or modified Edge Function, or any change to `verify_jwt` / function secrets.
2. A new migration that adds a table, a policy, a grant, a view, a bucket rule or an RPC.
3. The first production deployment with real member accounts (H5 decision).
4. Any file upload, form, webhook or third-party integration (e.g. forms going live publicly — M5).
5. Any change to the email send/suppression path or the audience resolver.
6. A dependency major bump, a new direct dependency, or a lockfile-manager change.
7. Any PII category added to `people` (child-safety, medical, payment).

---

## 8. Method, assumptions and how to confirm the Criticals

**Method** — static review of the repository at `dd4cb53`: all 36 migrations, all three Edge
Functions, the auth/settings/email/plugin cores, the People and Forms modules, build scripts,
lockfiles, git history and the produced `dist/`. No live probing of the hosted project was
performed.

**Assumptions / not verified**
- The repo migrations are treated as the source of truth. `core/database/decision.md` states the
  production DB was "hot-fixed idempotently", which makes it *likely* the permissive anon policies
  are live in production — confirm with the commands below.
- Hosted `verify_jwt` defaults were not inspected via the dashboard; C1/C2 assume the anon key is
  accepted as a bearer token, which is the documented and observed behaviour of `trigger-sync.ts`.
- `pnpm audit signatures` (registry provenance) is unavailable in pnpm 10 — not verified.
- No penetration test, no DAST, no RLS fuzzing; findings are code/DDL-level.

**Confirm the Criticals against the deployed project (read-only, safe)**

```powershell
$url = $env:VITE_SUPABASE_URL; $anon = $env:VITE_SUPABASE_ANON_KEY
# C3/C4: anonymous write attempts must fail (42501/403). Today they likely succeed.
curl.exe -s -o NUL -w "%{http_code}`n" -X POST "$url/rest/v1/platform_settings" `
  -H "apikey: $anon" -H "Authorization: Bearer $anon" -H "Content-Type: application/json" `
  -H "Prefer: resolution=merge-duplicates" `
  -d '{"id":"00000000-0000-0000-0000-0000000000ff","key":"__audit_probe","environment":"development","value":{}}'
# C4: read of the credential row must be denied
curl.exe -s -w "`n%{http_code}`n" "$url/rest/v1/elvanto_settings?select=api_key_encrypted" `
  -H "apikey: $anon" -H "Authorization: Bearer $anon"
# H2: anon view must expose only access_permission='public' rows
curl.exe -s "$url/rest/v1/people_public?select=id&limit=1" -H "apikey: $anon"
# C1/C2: anon-key invocation of privileged functions must be rejected
curl.exe -s -w "`n%{http_code}`n" -X POST "$url/functions/v1/elvanto-sync-worker" `
  -H "apikey: $anon" -H "Authorization: Bearer $anon" -H "Content-Type: application/json" `
  -d '{"action":"test_connection","api_key":"invalid"}'
```
Delete the `__audit_probe` row afterwards if it is created (that creation is itself evidence for C3).

---

## 9. Requirement verification — PII lockdown & super-admin settings (added 2026-09-19)

Two explicit product requirements were re-checked against the schema and UI after the initial
audit was written. Both currently **FAIL**. The database-level gaps were folded into the findings
table as **C5** and **H7**; the UI/route gaps extend **H1**. This section records the full
traceability: requirement → current state → evidence → fix → verification.

### REQ-1 — People PII (lastname, address, email, contact number, WWCC number, …) locked behind login, RLS members only

**Requirement** — no personal detail is readable without a signed-in session; "members" =
`authenticated`. The only anonymous people surface is the intended public directory
(`people_public` view: `id`, `firstname`, `lastname_initial`, `demographic`).

**Verdict: FAIL — PII is anonymous-readable through four separate doors.**

| # | Door | What a logged-out visitor can read | Evidence |
|---|---|---|---|
| 1 | `addresses` | Street address of **every** household (line1/line2, suburb, state, postcode) | `USING (true)` policy `20260828120000_…sql:22-24` (never refined); anon grant `20260828120001_…sql:8`, re-affirmed `20260907000001_…sql:16` → **C5** |
| 2 | `households`, `people_relationships`, `people_tags` | Household names; the complete guardian/family graph of every person (incl. non-public); tag/journey assignments | same policy class `20260828120000_…sql:18-41`; grants `20260907000001_…sql:31,57`, `20260907000000` → **C5** |
| 3 | `people` base table | **All columns** — lastname, email, mobile, DOB, WWCC/safe-ministry set, medical, consents, school, `elvanto_security_code` — for every `access_permission='public'` row | anon grant `20260906000001_…sql:77`; row-filtered but **not column-filtered** policy `20260906000001_…sql:79-82` → **H7** |
| 4 | `search_people` RPC | Whole-row results of public people; EXECUTE defaults to PUBLIC; matching on email/mobile makes membership enumeration trivial | `20260908130000_create_people_search.sql:101-102,161-172` → **H7** |

Supporting facts: the PII inventory in `people` is large — `lastname`, `email`, `mobile`,
`date_of_birth`, `school_name`, `wwcc_number`/`wwcc_expiry_date`/`wwcc_verification_*`/`wwcc_exemption`,
`smt_*`/`smc_*`, `medical_*` (anaphylaxis, behavioural, medication), four `consent_*` flags,
`journey`/`custom_fields`, `legacy_member_id`, `elvanto_security_code`/`elvanto_giving_number`
(`20260826002000_create_people_table.sql:8-83`); addresses live in the `addresses` table
(`20260826000000_create_platform_tables.sql:31-41`). The authenticated plane satisfies the
"behind login" half of the requirement (anon policy `20260906000000_…sql:8-12`), but note the
flat-role posture (H5): every signed-in member can read every row, including other people's
WWCC/medical data — acceptable for the MVP per `core/database/decision.md` A.2.2, review
scheduled.

**Also broken (functional, found while verifying REQ-1):** the migration chain defines **no
INSERT/UPDATE/DELETE policy on `people` for `authenticated`** — only SELECT policies exist
(`20260906000000`, `20260906000001`). On a fresh `supabase db reset`, create/edit person and the
Contact/Demographics/Admin sections all fail with `42501`. Production clearly runs unversioned
write policies (the `20260907000001` header says the prod DB was set up manually) — the drift
already flagged in L5/H5, now with a concrete symptom. Fix in remediation 1.8.

**Fix (REQ-1)** — one idempotent migration:
1. `REVOKE SELECT ON public.addresses, public.households, public.people_relationships,
   public.people_tags, public.people FROM anon;`
2. Drop the lab-era `USING (true)` SELECT policies on those four tables and create
   `FOR SELECT TO authenticated` replacements (`tags` may stay anon-readable — tag names are not PII).
3. `REVOKE EXECUTE ON FUNCTION search_people(text,integer) FROM PUBLIC; GRANT EXECUTE … TO
   authenticated;` (same for the four helper functions).
4. Apply the H2 fix to `people_public` (add `AND access_permission = 'public'`; keep or tighten
   `security_invoker`).
5. Add explicit `people` write policies for `authenticated` (MVP: all non-deleted rows, per
   decision A.2.2) so the app's write paths are versioned.
6. Re-check anything that legitimately needed anon reads of addresses/relationships (no current
   caller does: `src/modules/people/lib/queries.ts` reads households/addresses only from the
   signed-in dashboard/profile surfaces).

**Verify (REQ-1)** — with the anon key only:

```powershell
# all of these must return [] or 403/42501 after the fix (today: rows/PII)
curl.exe -s "$url/rest/v1/addresses?select=*&limit=1" -H "apikey: $anon"
curl.exe -s "$url/rest/v1/people?access_permission=eq.public&select=email,mobile,wwcc_number&limit=1" -H "apikey: $anon"
curl.exe -s -X POST "$url/rest/v1/rpc/search_people" -H "apikey: $anon" -H "Authorization: Bearer $anon" `
  -H "Content-Type: application/json" -d '{"search_query":"jane"}'
# this one must still work (the public directory)
curl.exe -s "$url/rest/v1/people_public?select=id,firstname,lastname_initial&limit=5" -H "apikey: $anon"
```

and with a member session: full people read works (the "members only" bar), view unchanged.

### REQ-2 — Settings pages locked to Super Admin; sidebar Settings tile only for signed-in super admins

**Requirement** — settings surfaces require an authenticated account whose
`people.access_permission = 'super_admin'`; the sidebar tile is hidden from everyone else,
including signed-out visitors.

**Verdict: FAIL at all three layers — database, route, UI.**

| Layer | Current state | Evidence |
|---|---|---|
| Database (RLS) | `super_admin` exists in the enum (`20260825221018_create_enums.sql:6`) and is sync-assignable (`src/content/plugins/elvanto-sync/sync/people-sync.ts:376-381`), but **no policy in the whole migration chain references any role tier**: `platform_settings` is anon-writable (C3) and writable by every member; `module_config` is anon-readable with `USING (true)` | `20260906000001_…sql:38-71` (anon INSERT/UPDATE + blanket authenticated INSERT/UPDATE `USING/CHECK (true)`); `20260828120000_…sql:11-12`; grep over `supabase/migrations` for `access_permission = 'admin'`/`'super_admin'` → 0 hits |
| Route | `/settings/*` renders with no guard of any kind | `src/core/settings/routes.tsx`, `src/core/settings/dashboard.tsx:20-37`; part of **H1** |
| UI | The Settings tile is rendered unconditionally — even for signed-out visitors | `src/core/ui/sidebar.tsx:412-416` → `handleSettingsClick` → `app-shell.tsx:37` → `navigate('/settings')` |

The role plumbing the fix needs already exists: `getCurrentOperatorPermission()` resolves the
signed-in user's `access_permission` via `auth_user_id` (falling back to email)
(`src/modules/people/lib/queries.ts:9-22`, consumed by `hooks.ts:81-82`), and the account tile in
the same sidebar already switches on auth state (`sidebar.tsx:405-410`) — the Settings tile
should copy that pattern. Note: `AdminSection`'s picker tops out at `admin`
(`src/modules/people/components/ProfileSections/AdminSection/AdminSection.tsx:32-34`), so
`super_admin` can today only be granted by SQL or the sync; add it to the picker when REQ-2
lands, or keep it sync/SQL-only deliberately — record the decision either way.

**Fix (REQ-2)** — one idempotent migration + two small UI changes:
1. Helper (security-definer so the `people` read can't recurse into its own RLS or be blocked):
```sql
create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.people
    where auth_user_id = auth.uid()
      and access_permission = 'super_admin'
      and deleted_at is null
  );
$$;
```
2. Settings-family policies: drop the anon INSERT/UPDATE policies and grants
   (`20260906000001_…sql:45-57`, `20260829000001`, plus the C3/C4 grants) and replace every
   blanket authenticated policy on `platform_settings`, `module_config`, `plugins`,
   `elvanto_settings`, `elvanto_sync_config` with
   `FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin())`.
3. **Keep a narrow anonymous read** for pre-auth branding: the login screen and sidebar render
   `brand.logo_url` before anyone signs in. Keep anon SELECT on `platform_settings` only with
   `USING (key in ('brand.logo_url','brand.favicon_url'))`, or move those keys to a tiny public
   table. Do not keep blanket anon SELECT.
4. `REVOKE SELECT ON public.user_roles FROM anon;` — the role catalogue is not needed pre-auth.
5. Sidebar: render the Settings tile only when `useCurrentOperatorPermission()` returns
   `'super_admin'`; while the role query is loading, render nothing (fail closed). Follow the
   existing account-tile pattern (`sidebar.tsx:405-416`).
6. Routes: add `RequireSuperAdmin` (extends the `RequireAuth` guard from remediation 1.3) on
   `/settings/*`; everyone else redirects to `/login`.
7. Settings provider (`src/core/settings/lib/provider.tsx`) keeps working for super admins; for
   everyone else the server now rejects writes, so a fail-closed UI is enough (no optimistic writes).

**Verify (REQ-2)**
- Signed out: no Settings tile; `/settings` → redirect to `/login`;
  `PATCH /rest/v1/platform_settings` with anon key → 403/42501.
- Signed in as `member_area`/`admin`: no tile; `/settings` → `/login`;
  `PATCH` → 42501; anon-key `GET /rest/v1/platform_settings?key=eq.brand.logo_url` still 200.
- Signed in as `super_admin`: tile visible; settings load and save.

### Disposition of the new items

| Item | Severity | Where it lives |
|---|---|---|
| C5 — anon address book + family graph | Critical | §2 table, §3 detail, remediation 0.6, §9 REQ-1 |
| H7 — all-column PII of public people + public `search_people` | High | §2 table, §3 detail, remediation 0.7, §9 REQ-1 |
| REQ-2 super-admin gating (DB/route/UI) | High (tracked via C3 + H1 + this section) | remediation 1.6/1.7, §9 |
| Missing people write policies / `people_audit` RLS (drift symptom) | tracked under H4/H5/L5 | remediation 1.8, §9 REQ-1 |


