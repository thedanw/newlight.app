# New Light App — Security Audit

**Date:** 2026-09-19 · **Re-audit triggers:** §7 · **Remediation:** see §5 (Resolution log — 2026-09-20)
**Scope:** full application — React SPA (Vite → Cloudflare Pages), Supabase (PostgREST/RLS, Edge Functions, Storage), plugin content pipeline, build output, git history.
**Method:** `security-and-hardening` skill — threat model per trust boundary, STRIDE, migration-by-migration RLS/grant review, Edge Function read, dependency audit, secret-history scan, dist inventory. **Static review only** (§8).
**Result:** **5 Critical · 7 High · 9 Medium · 7 Low.** Both product requirements (§9) failed at audit time. REQ-2 (super-admin settings) remediation was applied to the live project on 2026-09-20 — see §5 Resolution log.

> Reconstruction note (2026-09-20): the original file was truncated by an editor accident. §5–§9 are
> restored verbatim from the working record; §1–§4 are rebuilt from the audit's evidence base
> (`2026-09-19-security-audit/findings.md` + remediation plan). All findings, severities and
> file:line evidence are preserved.

## 1. Threat model

**Trust boundaries (10):** ① anonymous PostgREST caller (the publishable anon key ships in the
bundle, so every `TO anon` policy is remotely reachable); ② authenticated member via PostgREST
(any role tier); ③ Edge Functions — `email-send`, `email-unsubscribe`, `elvanto-sync-worker` (the
worker runs DB queries with `SUPABASE_SERVICE_ROLE_KEY`); ④ Elvanto API (constant host
`api.elvanto.com`, Basic-auth API key); ⑤ public plugin content `public/content/plugins` →
`dist/content`; ⑥ public form route `/forms/:formId`; ⑦ browser session storage (supabase-js
localStorage) and the account page's use of JWT claims; ⑧ CI / build artifacts
(`scripts/copy-plugins.mjs`, lockfiles); ⑨ secret surfaces (`.env` is gitignored, function secrets,
`VITE_SUPABASE_SECRET_KEY`); ⑩ Cloudflare Pages deploy (`_headers`, redirects).

**Assets:** member PII — names, addresses, household graph, contact numbers, emails, dates of birth,
WWCC / safe-ministry fields; the Elvanto API key (encrypted in `elvanto_settings`) and SMTP
credentials; the church's send identity and consent/suppression state; administrative configuration
(`platform_settings`, `module_config`, `plugins`, `elvanto_sync_config`); sync history/dead-letter
telemetry; availability of the sync worker and the public directory.

**STRIDE highlights:** Spoofing — Edge Functions accepted any bearer token (C1, C2). Tampering —
anon writes on settings/plugin state (C3) and storage uploads (C4). Repudiation — prod write rules
unversioned (L5). Information disclosure — anon address book + family graph (C5), all-column PII of
public people (H7), view gap (H2), error internals (M6), missing headers (M8). Denial of service —
no rate limits on app functions (M4), public form writes (M5). Elevation — no route guards at all
(H1), undefined `authenticated` posture (H5).

## 2. Findings

| ID | Sev | Area | Evidence (file:line) | Impact | Fix |
|---|---|---|---|---|---|
| C1 | Critical | Edge Function | `supabase/functions/email-send/index.ts` — no `getUser()` gate; `from` taken from request body; consent bypassed by omitting `person_id` | Open SMTP relay under the church identity; any anon key holder can send as the church | Caller authZ + role gate + `from` allowlist (0.1) |
| C2 | Critical | Edge Function | `supabase/functions/elvanto-sync-worker/index.ts:400-560` runs `SUPABASE_SERVICE_ROLE_KEY`; invoked with Bearer **anon** key (`src/content/plugins/elvanto-sync/sync/trigger-sync.ts:52-59`); relays caller-supplied `api_key` | Anon-triggered service-role sync; Elvanto key proxy | Same authZ + user session token + stored-key-only (0.1) |
| C3 | Critical | RLS | `20260906000001_fix_production_rls_and_grants.sql:38-71` — anon INSERT/UPDATE + blanket `authenticated` policies on `platform_settings`; same pattern on `plugins` (`20260830100000`) | Anonymous defacement of config/plugin state | Revoke anon writes; super-admin-only writes (0.2, 1.6) |
| C4 | Critical | RLS/Storage | `20260829150000_fix_plugin_rls.sql:13-47` — anon CRUD on `elvanto_settings`, `elvanto_sync_config`; anon read of history/dead-letter; bucket write policies drifted open | Elvanto credential download; free hosting on the church domain | Revoke anon; bucket read-only (0.2, 1.6) |
| C5 | Critical | RLS | `USING (true)` SELECT policies + anon grants on `addresses`, `households`, `people_relationships`, `people_tags` (lab-era 2026-08 chain, re-confirmed by `20260907000001`) | Anonymous full address book + family graph | Revoke + `to authenticated` policies (0.6) |
| H1 | High | Router/UI | `src/core/router.tsx` — no guards; `src/core/ui/sidebar.tsx:412-416` settings tile unconditional; `src/core/ui/app-shell.tsx:37` | `/people`, `/settings` render for signed-out visitors | Route guards + conditional tile (1.3, 1.7) |
| H2 | High | RLS/view | `20260908120000_create_people_public_view.sql` — `security_invoker = off`, **no** `access_permission='public'` filter | Anon directory lists the whole congregation | Recreate view with filter (0.3) |
| H3 | High | Edge Function | `supabase/functions/email-unsubscribe/index.ts` stores `email_hash: ''` | Suppression never matches; unsubscribed people keep receiving | Token table + hash from token row (1.1) |
| H4 | High | RLS | `20260913000000_create_email_system.sql` — email tables `authenticated`-wide | Any member reads/deletes suppression evidence | Role-scope tables (1.2) |
| H5 | High | Posture | No policy in the chain references any role tier; `authenticated` = `member_area`+ (decision A.2.2 MVP) | Undefined member-access surface; deliberate MVP risk | Decide + record (2.6); review at first prod accounts |
| H6 | High | Build | `scripts/copy-plugins.mjs` copies whole plugin trees → `dist/content/plugins/**` includes the worker `edge-function.ts` + `db/migrations/*.sql` | Source + migration logic published to the site | Allowlist (1.4) |
| H7 | High | RLS/RPC | `people` anon policy filters rows, not columns — `?select=email,mobile,wwcc_number` returns PII of public people; `search_people` EXECUTE defaults to PUBLIC (`20260908130000`) | PII enumeration + membership search by anon | Column-safe view only; RPC to authenticated (0.7) |
| M1/M2 | Medium | Plugin UI | `src/content/plugins/elvanto-sync/utils/encryption.ts`, `settings/ConnectionTab.tsx` (`secure:false`, client-side decrypt) | Elvanto key decryptable in any signed-in browser | Server-side credentials (2.1) |
| M3 | Medium | Edge Functions | Permissive CORS + internal error bodies echoed | Info disclosure / cross-origin abuse | Origin allowlist + coded errors (2.2) |
| M4 | Medium | Edge Functions | No rate limit on the app's own functions | Cost/DoS | Simple counters (1.1, 2.7) |
| M5 | Medium | Forms | `src/modules/forms/pages/PublicPage.tsx` — anon table writes (`20260828100000_create_forms.sql`) | Public spam writes into `form_submissions` | `submit_form` RPC or drop the route (2.4) |
| M6 | Medium | UI | `src/core/ui/error-boundary.tsx`, `src/core/errors/ErrorPage.tsx` — internals exposed | Info disclosure | Private details (2.3) |
| M7 | Medium | Contract | Email client/function drift on `id` vs `{sendId}` (`src/core/email/lib/client.ts`, `sending.ts`) | Broken status links | Align contract (2.5) |
| M8 | Medium | Headers | No `public/_headers` (CSP/HSTS/nosniff/frame-ancestors) | Clickjacking/MIME/transport gaps | Add `_headers` (1.5) |
| M9 | Medium | Session | supabase-js localStorage persistence default (`src/core/lib/supabase.ts`, `src/core/auth/provider.tsx`) | XSS-token-steal trade-off | Decide + record (2.6) |
| L1 | Low | Git | `supabase/.temp`, `supabase/.branches` tracked | CLI state committed | untrack (2.8) |
| L2 | Low | Supply chain | Two lockfiles present | Non-reproducible installs | Single authoritative lockfile + CI (2.7) |
| L3 | Low | CI | No `.github/workflows` | No gates at all | CI with audit + anon smoke (2.7) |
| L4 | Low | Docs | Role catalogue (`user_roles`) semantics undocumented | Review confusion | Document (2.6) |
| L5 | Low | Migrations | Prod DB set up manually (`20260907000001` header); people write rules unversioned — fresh `db reset` breaks person writes (42501) | Drift; chain not the source of truth | Version the writes (1.8) |
| L6 | Low | Functions | `verify_jwt` recorded only in the dashboard, not in the repo | Config drift risk | Record (0.5) |
| L7 | Low | Privacy | No purpose/retention/export/erasure note for PII tables | Compliance gap | Privacy lifecycle note (2.8) |

## 3. Finding details (condensed)

**C1/C2 — functions as open endpoints.** Both functions performed zero caller authorization: no
`supabase.auth.getUser(jwt)`, no role check, and `email-send` trusted the request body for `from`
and treated a missing `person_id` as "consented". The worker executes with `SUPABASE_SERVICE_ROLE_KEY`
and — because `verify_jwt` alone only validates token signature, not identity or role — any caller
with the public anon key (published in the SPA bundle) could invoke it, including with a
caller-supplied Elvanto `api_key` (proxy abuse). Fixed 2026-09-20: `assertCanSend()`/`getUser` gates
on both functions, `from` allowlisted server-side, consent requires `person_id`, worker ignores
caller keys, and `trigger-sync.ts:52-59` now sends the signed-in user's access token.

**C3/C4 — lab-era grants shipped to prod.** The 2026-08 lab preamble ("no auth — tighten when auth
lands") produced blanket `USING (true)` policies that later "fix" migrations re-confirmed instead of
tightening: anon and every member could write `platform_settings`/`plugins`, and anon could read and
write `elvanto_settings` (the encrypted Elvanto key) and `elvanto_sync_config`, plus upload to the
`brand-assets` bucket. Fixed 2026-09-20: `20260919100000` (anon write revokes), `20260919100100`
(bucket read-only), `20260919110100` (super-admin-only settings family via `is_super_admin()`).

**C5/H2/H7 — the people PII plane.** Three distinct anon doors onto the same data: (a) full
`SELECT` on `addresses`/`households`/`people_relationships`/`people_tags` (C5) exposing the family
graph; (b) the `people_public` view without the public flag filter (H2); (c) the `people` base table
with row-filtered but not column-filtered anon access (H7) — `?select=email,mobile,wwcc_number` —
plus a PUBLIC-executable `search_people(text, integer)` RPC. All closed 2026-09-20 by
`20260919100200` (grants revoked, `to authenticated` policies, narrow view, RPC locked).

**H1/H5 — the app trusted the client.** No route guard anywhere; the sidebar settings tile rendered
for signed-out visitors; the AccountPage displayed the JWT role claim (`authenticated`) as the
user's "Role". Posture (which tiers may read which domains) was never decided. Addressed 2026-09-20
for settings (RequireSuperAdmin + conditional tile + AccountPage fix + `is_super_admin()` RLS);
the broader guard/posture work remains 1.3/2.6.

**H3/H4/M4 — email consent machinery.** The unsubscribe endpoint stored `email_hash: ''`, so
suppression rows never matched and unsubscribed people kept receiving mail; email tables were
`authenticated`-wide; no rate limits. DB scoping deferred pending the email-system migration being
applied to the project (see Resolution log).

**M1/M2/M3/M5/M6/M7/M8/M9 — depth items.** Client-side credential decrypt (`secure:false`), CORS +
error echo, anon form writes, error-page internals, `id`/`{sendId}` contract drift, missing
`_headers`, localStorage session trade-off. All mapped to Wave 2 batches 9–11.

**L1–L7 — hygiene.** CLI state tracked, two lockfiles, no CI, undocumented role catalogue,
unversioned prod policy drift, dashboard-only `verify_jwt`, no privacy lifecycle note.

## 4. Dependency & supply chain

- `pnpm audit --prod --audit-level moderate` → **No known vulnerabilities found** (pnpm@10.34.5 per `packageManager`).
- `pnpm audit --audit-level low` → 1 high + 2 moderate, **all dev-only toolchain** (not bundled into `dist/`, not reachable at runtime). Triaged: no forced upgrade; the CI gate (2.7) enforces `--prod --audit-level high`.
- `pnpm audit signatures` is unsupported on pnpm 10 → registry provenance not verified; revisit on the next pnpm upgrade.
- Two lockfiles exist (L2) and `supabase/.temp`/`.branches` are tracked (L1) — both scheduled for the CI batch (2.7/2.8).

## 5. Remediation plan

### Wave 0 — stop the bleeding (before any production traffic)

| # | Action | Exit criteria |
|---|---|---|
| 0.1 | Add caller authorization to `email-send` and `elvanto-sync-worker` (C1, C2) | anon-key request → 401/403; authenticated non-admin → 403; admin → 200; `from` must be an allowlisted alias |
| 0.2 | Revoke anon writes on `platform_settings`, `plugins`, `elvanto_settings`, `elvanto_sync_config`, `elvanto_sync_dead_letter` and `brand-assets` (C3, C4) | anon `insert`/`update`/`delete` returns 42501/403 for all six; anon `select` still serves pre-auth branding |
| 0.3 | Fix the `people_public` view filter + `security_invoker` (H2) | anon `select count(*) from people_public` == count of `access_permission='public'` |
| 0.4 | Rotate the Elvanto API key and SMTP credentials (both were client-side / reachable through open endpoints) | new secrets stored as Supabase function secrets only; old values revoked |
| 0.5 | Confirm `verify_jwt=true` on all three functions and that no function treats the anon key as a privilege | dashboard/`supabase functions list` output recorded |
| 0.6 | Revoke anon SELECT on `addresses`, `households`, `people_relationships`, `people_tags` and replace the four `USING (true)` policies with `to authenticated` ones (C5, REQ-1) | anon REST read of each table → 403/empty; authenticated member reads still work; public profile pages verified after the change |
| 0.7 | Revoke anon SELECT on `people`; make `people_public` the only anon people surface (fix per H2); `REVOKE EXECUTE` on `search_people` from PUBLIC, grant to `authenticated` (H7, REQ-1) | anon `/rest/v1/people?select=email…` and `rpc('search_people')` → 403/empty; view serves only public-directory columns of `access_permission='public'` rows |

### Wave 1 — correctness of advertised controls

| # | Action | Exit criteria |
|---|---|---|
| 1.1 | Fix unsubscribe: token table, `email_hash` from the token row, fail closed, idempotent POST (H3, M4) | end-to-end test: unsubscribe → next send records `suppressed`; replayed token → 200, one row |
| 1.2 | Role-scope the email tables (H4) | member `authenticated` cannot read `email_unsubscribes` or delete rows; `team_leaders+` can send |
| 1.3 | Add `RequireAuth` route guard; gate the lab mock session to lab builds (H1) → **partial 2026-09-24**: `RequireAuth` wraps the whole authenticated shell (`router.tsx`), post-login deep-link return landed (`login-redirect.ts` + `LoginPage` honoring `state.from`), and the **profile-loading race that caused every guarded deep link to bounce to `/people` is fixed** (`AuthProvider` now derives `isProfileLoading` from the resolved user id instead of a stored boolean); mock-session gating still open | anonymous deep URLs redirect to `/login` and return to the requested page after sign-in; signed-in super admin refreshing `/settings/*` renders in place; no mock session in production builds |
| 1.4 | Replace `copy-plugins.mjs` with an allowlist; delete the duplicated `edge-function.ts` (H6, L5) | `dist/content/plugins` contains no `*.ts`/`*.sql`; build assertion fails otherwise |
| 1.5 | Add `public/_headers` with CSP/HSTS/nosniff/frame-ancestors (M8) | headers present in the deployed response (`curl -I`) |
| 1.6 | Super-admin gate for settings data: add `is_super_admin()` security-definer helper; re-point `platform_settings`, `module_config`, `plugins`, `elvanto_settings`, `elvanto_sync_config` policies to it; drop the anon write grants/policies (C3, C4, REQ-2); keep a **narrow** anon SELECT for pre-auth branding keys only | member-role `UPDATE platform_settings` → 42501; `super_admin` account succeeds; anon reads return only branding keys |
| 1.7 | Settings UI gating: sidebar Settings tile conditional on the resolved role (hidden while the role query loads), plus a `RequireSuperAdmin` guard on `/settings/*` (H1, REQ-2) | signed-out and plain-member users: tile not rendered, direct `/settings` URL redirects to `/login`; `super_admin` sees and saves settings |
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

### Resolution log (2026-09-20 — applied to the live project)

Evidence per item, from `scripts/security/smoke-anon.ps1` (GREEN, 0/11) and live `pg_policies`:

- **0.1 ✅** `email-send`/`elvanto-sync-worker` anon probes → 401/403; both functions hold `getUser`/`assertCanSend` gates; `trigger-sync.ts` sends the user's access token.
- **0.2 ✅** anon `INSERT platform_settings` → 42501/403; `elvanto_settings`/`plugins` reads → 403; brand-assets anon writes dropped (`20260919100000`, `20260919100100` applied live).
- **0.3 / 0.6 / 0.7 ✅** C5/H2/H7 closed: anon SELECT revoked on `people`, `addresses`, `households`, `people_relationships`, `people_tags` (`20260919100200`); `people_public` = public-flagged rows only, safe columns; `search_people` EXECUTE = authenticated only. Anon probes → 403.
- **1.6 / 1.7 ✅ (REQ-2)** `20260919110100` applied live: `is_super_admin()` definer verified by JWT-claims simulation (Daniel Walmsley → `true`, plain user → `false`); settings family = super-admin writes; `elvanto_settings` super-admin-only; `plugins` super-admin-only; anon left with the single `app-settings` branding read; `user_roles` anon revoked. `RequireSuperAdmin` guard on `/settings/*` + conditional sidebar tile + 19 passing Vitest tests. Account→profile link set for daniel@newlight.au.
- **1.1 / 1.2 ⏳ deferred** — live DB lacks the email-system tables (`20260913000000` unapplied); `20260919110000` awaits it.
- **0.4 / 0.5 ⏳ ops pending** — secret rotation + `verify_jwt` confirmation still to be recorded.
- **Plugin loading after the lockout:** `PluginLoader` re-loads on session change and unloads on sign-out (plugins table is now super-admin-only); live `plugins` row `elvanto-sync` is `enabled=true`, so super admins reach the Elvanto Sync settings page; plain members correctly get none.

## 6. Skill verification checklist (current state)

| Check (from `security-and-hardening`) | Status |
|---|---|
| Native audit has no unmitigated reachable critical/high findings; CI preserves the lockfile and blocks unreviewed scripts | ⚠️ runtime audit clean; 1 high + 2 moderate dev-only advisories (§4); no CI (L3); two lockfiles (L2) |
| No secrets in source code or git history | ✅ verified (pattern scan across tracked files and history) |
| All user input validated at system boundaries | ❌ not at the Edge Function boundary pre-fix (C1, C2 — gates added 2026-09-20); partially at the client (zod validators exist in `people/forms` but are UI-side) |
| Destructive filesystem operations resolve symlinks, check allowlisted root/depth/ownership | n/a — none in app runtime (`scripts/*.mjs` only read/copy from fixed repo paths) |
| Authentication AND authorization on every protected endpoint | ❌ pre-fix (C1, C2, H1) → functions gated + settings guarded 2026-09-20; global `RequireAuth` + post-login deep-link return added 2026-09-22 (mock-session gating still open) |
| Security headers present in response | ❌ M8 |
| Error responses don't expose internal details | ❌ M3 (server), M6 (client) |
| Rate limiting on auth endpoints, shared store when multi-instance | ⚠️ delegated to Supabase Auth; none on the app's own Edge Functions (M4) |
| Server-side URL fetches validated against an allowlist (no SSRF) | ⚠️ no user-supplied URL is fetched; Elvanto host is constant. The worker did relay an attacker-supplied **API key** (C2) — closed 2026-09-20 |
| LLM/model output validated and encoded before use | n/a — no LLM features |
| Personal data classified, minimized to a purpose, retention-limited | ❌ L7 (also H2, H5) |
| Deletion and export work end-to-end incl. backups/caches/analytics | ❌ not implemented or documented (L7) |

## 7. Re-audit triggers

Re-run this audit (new dated file in this folder) when any of the following lands:

1. A new or modified Edge Function, or any change to `verify_jwt` / function secrets.
2. A new migration that adds a table, a policy, a grant, a view, a bucket rule or an RPC.
3. The first production deployment with real member accounts (H5 decision).
4. Any file upload, form, webhook or third-party integration going live publicly (e.g. the forms route M5), or any change to `people_public` / the search RPC surface.
5. A dependency upgrade touching `@supabase/supabase-js`, Vite, or anything in the runtime bundle.

## 8. Limitations

- **Static review only.** No live exploitation, no DAST, no RLS fuzzing; conclusions rest on code/migration reading plus targeted REST probes with the anon key.
- Hosted `verify_jwt` values were not inspected via the dashboard at audit time (0.5 ops item).
- `pnpm audit signatures` is unsupported in pnpm 10 — registry provenance unverified.
- H5 is a documented MVP posture, flagged as an accepted risk needing an explicit decision (2.6) and a review date before the first real member accounts go live.
- The migration chain and the production DB had drifted (L5); findings reflect the **union** of chain + live state, and every fix migration was written idempotently against both.

## 9. Product requirements traced

### REQ-1 — People PII (last name, address, email, contact number, WWCC number, …) locked behind login for members only

**Requirement** — no anonymous caller may read or write people PII; every signed-in member keeps
full people access; the public directory keeps working with its intentionally public rows.

**Verdict at audit: FAIL on the anon plane; PASS on the `authenticated` plane.**

The `authenticated` plane already honoured "behind login" — the `people` anon policy was
row-scoped to `access_permission='public'` and the signed-in path read via `auth.uid()`. But four
separate doors leaked PII to logged-out visitors, all rooted in the lab-era "no auth" migrations
that the Sept-6/7 production "fix" migrations re-confirmed rather than tightened:

| Door | Leak | Finding |
|---|---|---|
| `addresses` | street address of every household, unscoped (`USING (true)` + anon grant) | C5 |
| `households`, `people_relationships`, `people_tags` | full guardian/family graph + tag assignments for every person | C5 |
| `people` base table | anon policy filtered *rows* but not *columns* → `?select=email,mobile,wwcc_number,date_of_birth` returned the full PII set for public-flagged people | H7 |
| `search_people` RPC | `EXECUTE` defaulted to PUBLIC and returned whole rows, with email/mobile matching → membership enumeration | H7 |

Also discovered: the migration chain defined **no INSERT/UPDATE/DELETE policy on `people`** — a
fresh `supabase db reset` broke create/edit person with `42501`; production ran unversioned
policies (drift, L5).

**Fix (REQ-1)** — `20260919100200_lock_people_pii_from_anon.sql` (applied live 2026-09-20):
1. `REVOKE SELECT` from anon on `people`, `addresses`, `households`, `people_relationships`, `people_tags` (grants are the enforcement).
2. Drop the lab-era `USING (true)` SELECT policies by their live names; recreate `FOR SELECT TO authenticated` replacements (`tags` keeps anon-readable names — not PII).
3. `REVOKE EXECUTE ON FUNCTION search_people(text,integer) FROM PUBLIC, anon; GRANT … TO authenticated`.
4. Recreate `people_public` with `AND access_permission = 'public' AND deleted_at IS NULL`, same safe column set as `20260908120000` (id, firstname, lastname_initial, demographic). `security_invoker` stays **off** on purpose — with anon's `people` SELECT revoked, invoker rights would blank the public directory; the narrow column list is the security boundary.
5. Versioned `authenticated` people write policies remain item 1.8.

**Verify (REQ-1)** — with the anon key only (all green after the fix):

```powershell
# these must return 403/42501/[] after the fix (previously: rows/PII)
curl.exe -s "$url/rest/v1/addresses?select=*&limit=1" -H "apikey: $anon"
curl.exe -s "$url/rest/v1/people?access_permission=eq.public&select=email,mobile,wwcc_number&limit=1" -H "apikey: $anon"
curl.exe -s -X POST "$url/rest/v1/rpc/search_people" -H "apikey: $anon" -H "Authorization: Bearer $anon" `
  -H "Content-Type: application/json" -d '{"search_query":"jane","max_results":5}'
# this one must still work (the public directory)
curl.exe -s "$url/rest/v1/people_public?select=id,firstname,lastname_initial&limit=5" -H "apikey: $anon"
```

and with a member session: full people read works (the "members only" bar), view unchanged.

### REQ-2 — Settings pages locked to Super Admin; sidebar Settings tile only for signed-in super admins

**Requirement** — settings surfaces require an authenticated account whose
`people.access_permission = 'super_admin'`; the sidebar tile is hidden from everyone else,
including signed-out visitors.

**Verdict at audit: FAIL at all three layers — database, route, UI.**

| Layer | Current state | Evidence |
|---|---|---|
| Database (RLS) | `super_admin` exists in the enum (`20260825221018_create_enums.sql:6`) and is sync-assignable (`src/content/plugins/elvanto-sync/sync/people-sync.ts:376-381`), but **no policy in the whole migration chain referenced any role tier**: `platform_settings` was anon-writable and member-writable; `module_config` anon-readable with `USING (true)` | `20260906000001_…sql:38-71`; `20260828120000_…sql:11-12`; grep over `supabase/migrations` for `access_permission = 'admin'`/`'super_admin'` → 0 hits |
| Route | `/settings/*` rendered with no guard of any kind | `src/core/settings/routes.tsx`, `src/core/settings/dashboard.tsx:20-37` |
| UI | The Settings tile rendered unconditionally — even signed-out | `src/core/ui/sidebar.tsx:412-416` → `handleSettingsClick` → `app-shell.tsx:37` → `navigate('/settings')` |

**Fix (REQ-2)** — `20260919110100_super_admin_settings_rls.sql` (applied live 2026-09-20) + two UI changes:
1. Helper (security-definer so the `people` read can't recurse into its own RLS):
   `is_super_admin()` = exists(`people` row with `auth_user_id = auth.uid()`, `access_permission = 'super_admin'`, not soft-deleted).
2. Settings-family policies: dropped the anon INSERT/UPDATE policies and grants plus every blanket
   authenticated policy on `platform_settings`, `module_config`, `plugins`, `elvanto_settings`,
   `elvanto_sync_config`; replaced with `FOR ALL TO authenticated USING/WITH CHECK (is_super_admin())`.
   Read scoping: `module_config` readable by all authenticated; `elvanto_sync_config` readable by
   all authenticated (plugin config values); `elvanto_settings` (contains the encrypted API key)
   **super-admin-only, full stop**; `plugins` super-admin-only; sync history/dead-letter keep
   authenticated reads, anon reads dropped; `user_roles` anon revoked.
3. Narrow anonymous read kept for the **pre-auth boot key only**: `platform_settings` SELECT to anon
   with `USING (key = 'app-settings')` — the login screen and sidebar read theme/logo from that row
   (`src/main.tsx` boot, `src/core/settings/lib/provider.tsx`). No other anon read.
4. `src/core/guards/RequireSuperAdmin.tsx` — fail-closed guard (renders nothing while auth/profile
   loads; everyone else → `/login`) wrapped around the whole `/settings/*` subtree in
   `src/core/settings/routes.tsx`.
5. `src/core/ui/sidebar.tsx` — Settings tile rendered only when
   `isSettingsTileVisible(person, isProfileLoading)` (`src/core/auth/lib/permissions.ts`,
   unit-tested); hidden while the linked person loads, hidden for every non-super-admin.
6. AccountPage "Role" shows the linked person's `access_permission` (never the JWT role claim) and
   warns when the login has no linked people profile — logins must be linked via `people.auth_user_id`.

**Verify (REQ-2)** — all green 2026-09-20:
- Signed out: no Settings tile; `/settings` → redirect to `/login`; anon `PATCH /rest/v1/platform_settings` → 403/42501; anon `GET /rest/v1/platform_settings` → only `app-settings` visible.
- Signed in as `member_area`/`admin`: no tile; `/settings` → `/login`; writes → 42501.
- Signed in as `super_admin`: tile visible; settings load and save; elvanto-sync settings reachable (plugin enabled row `elvanto-sync=true`, `is_super_admin()` = `true` by JWT-claims simulation).
- 19 Vitest tests cover the guard, tile visibility helper, and session-aware plugin loading.

### Disposition of the §9 items

| Item | Severity | Where it lives |
|---|---|---|
| C5 — anon address book + family graph | Critical | §2 table, §3 detail, remediation 0.6, §9 REQ-1 |
| H7 — all-column PII of public people + public `search_people` | High | §2 table, §3 detail, remediation 0.7, §9 REQ-1 |
| REQ-2 super-admin gating (DB/route/UI) | High (tracked via C3 + H1 + this section) | remediation 1.6/1.7, §9 |
| Missing people write policies / `people_audit` RLS (drift symptom) | tracked under H4/H5/L5 | remediation 1.8, §9 REQ-1 |







