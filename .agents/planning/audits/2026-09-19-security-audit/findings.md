# Findings — Remediation of the 2026-09-19 security audit

Source of truth: `../../2026-09-19-security-audit.md` (§2 findings table, §3 details, §5 remediation waves, §9 REQ-1/REQ-2). This file holds only what an executor needs that is *not* restated in `plan.md`.

## Environment facts

- Repo: `d:\daniel\Documents\vibecoding\newlight.app`, branch `main` @ `5df0237` (workspace hint `feat/dndkit-latest-refactor` is stale — actual HEAD is `main`).
- Working tree is dirty with **planning/docs only** (`.agents/planning/...`, `.agents/skills/...`). No `src/` or `supabase/` dirt. Never `git add -A`; stage per-task paths only.
- Tooling: pnpm@10.34.5, TypeScript 5.8, Vitest 4 (`pnpm test`), ESLint (`pnpm lint`), `pnpm typecheck` = `tsc -b`, Vite 7 build. No CI exists yet (audit L3).
- Supabase: `pnpm dlx supabase` CLI; migrations run in filename order; repo convention = new idempotent migration per change (guardrail in audit §5). Edge Functions configured in `supabase/config.toml` (check `verify_jwt` per function).
- Verification targets: a **staging** Supabase project first, then production. Required inputs: `$url` (project REST root), `$anon` (publishable anon key), `$svc` (service_role, staging only, never committed). Both keys go in local `.env` (gitignored — verified).

## Evidence map (finding → where the fix lands)

| Finding | Evidence (file:line) | Fix artifact |
|---|---|---|
| C1 email-send unauthenticated, body-controlled `from` | `supabase/functions/email-send/index.ts` (no `getUser()`; consent bypass by omitting `person_id`) | `email-send` authZ + from-allowlist (batch 1) |
| C2 sync worker on service role, anon-triggerable | `supabase/functions/elvanto-sync-worker/index.ts:400-560` (`SUPABASE_SERVICE_ROLE_KEY`); `src/content/plugins/elvanto-sync/sync/trigger-sync.ts:52-59` (Bearer anon key) | worker authZ (batch 1) |
| C3 anon writes `platform_settings`/`plugins` | `20260906000001_fix_production_rls_and_grants.sql:38-71` (anon INSERT/UPDATE + blanket authenticated `USING (true)`); `20260829000001_grant_anon_settings_write.sql`; `20260829120000_add_anon_settings_write_policies.sql`; `20260829000000_create_plugins_table.sql`; `20260906100000_fix_plugins_authenticated_rls.sql` | migrations (batches 2, 6) |
| C4 anon read/write `elvanto_*` + `brand-assets` | `20260829130000_create_elvanto_settings.sql`; `20260907000001_fix_production_grants_for_app_tables.sql`; `20260829000000_create_brand_assets_bucket.sql`; `20260829140000_fix_anon_storage_and_settings_write.sql` | migrations (batch 2) |
| C5 anon address book + family graph | `USING (true)` SELECT policies on `addresses`, `households`, `people_relationships`, `people_tags` (lab-era 2026-08 migrations, re-confirmed by `20260907000001_fix_production_grants_for_app_tables.sql`) | migration (batch 3) |
| H2 `people_public` view gap | `20260908120000_create_people_public_view.sql` (missing `access_permission='public'` filter, `security_invoker = off`) | migration (batch 3) |
| H7 all-column PII + public `search_people` | `people` anon policy filters rows not columns; `20260908130000_create_people_search.sql` + `20260908140000_fix_people_search_token_split.sql` (EXECUTE defaults to PUBLIC) | migration (batch 3) |
| H1 no route guard; settings tile unconditional | `src/core/ui/sidebar.tsx:412-416`, `src/core/ui/app-shell.tsx:37`, `src/core/settings/routes.tsx`, `src/core/routes.tsx` | guards (batch 6) |
| H3/M4 unsubscribe broken | `supabase/functions/email-unsubscribe/index.ts` (`email_hash: ''` → suppression never matches; no rate limit) | function + tables (batch 5) |
| H4 email tables `authenticated`-wide | `20260913000000_create_email_system.sql` | migration (batch 5) |
| H6 build ships plugin TS + SQL | `scripts/copy-plugins.mjs` → `dist/content/plugins/**` (worker `edge-function.ts`, `db/migrations/*.sql`) | allowlist (batch 7) |
| M8 no security headers | `index.html`/`vite.config.ts`/`wrangler.jsonc` — no `_headers` | `public/_headers` (batch 7) |
| REQ-2 settings must be super-admin | enum has `super_admin` (`20260825221018_create_enums.sql:6`); sync can grant it (`src/content/plugins/elvanto-sync/sync/people-sync.ts:376-381`); **zero** policies reference any tier (grep = 0 hits) | helper + policies + UI (batch 6) |
| REQ-1 people PII members-only | anon plane leaks via C5/H2/H7 (above); `people` table columns incl. `wwcc_number` (`20260826002000_create_people_table.sql`) | migration (batch 3) |
| 1.8 drift: no versioned people write policies | only SELECT policies in `20260906000000_refine_people_rls_for_auth.sql`; fresh `supabase db reset` → create/edit person fails 42501 | migration (batch 8) |

## Reusable patterns

- Role resolution for UI: `getCurrentOperatorPermission()` — `src/modules/people/lib/queries.ts:9-22`, consumed at `src/core/auth/hooks.ts:81-82`. Sidebar account tile already switches on auth state (`sidebar.tsx:405-410`) — copy that pattern for the Settings tile; render **nothing while loading** (fail closed).
- `AdminSection` picker tops out at `admin` (`src/modules/people/components/ProfileSections/AdminSection/AdminSection.tsx:32-34`) — granting `super_admin` stays SQL/sync-only for now (decision D-3 in plan).
- `is_super_admin()` must be `security definer` so its `people` read can't recurse into `people` RLS (audit §9 fix sketch has the SQL).

## Assumptions (skill allows ≤2 blocking questions; recording decisions instead)

- **D-1 Scope**: all three audit waves (0, 1, 2) are in scope, in that order. Wave 2 items requiring product decisions (forms 2.4, posture 2.6) are executed as *decision + record*, with implementation only if the decision says so.
- **D-2 Testing model**: TDD via "verification-first" — the anon-key smoke probes are written and run *before* each fix (red), re-run after (green). SQL has no unit-test harness here; the smoke script + `supabase db reset` is the test. TS changes get Vitest where a harness exists.
- **D-3 Super-admin granting**: stays via SQL/sync; picker change deferred (audit §9 note) — recorded as accepted for this pass.
- **D-4 Deploys**: staging project first; production deploy is a separate, explicit step per wave, never automated inside these tasks.

## Baseline (red) — Phase 0 output

- (fill after batch 0: probe → code → count, `verify_jwt` values per function)

## Execution facts (2026-09-20)

- **Account ↔ profile linkage** (the "role: authenticated" symptom): the AccountPage Role field fell back to the JWT claim `user.role` (`authenticated`) whenever no `people` row was linked. Fixed: field shows `person.access_permission`, warns when unlinked. Live data fix applied: people `0f120a77-b02e-4b15-ae6e-1afe0a4f7119` ↔ auth user `8909603f-9847-43b1-b0f4-68d54a256172` (daniel@newlight.au), `access_permission = 'super_admin'`. Any future login must get the same link (set `people.auth_user_id`); the account page now tells the user when it's missing.
- **Pre-auth read key is `app-settings`** (`src/main.tsx` boot theme + `SettingsProvider` logo), not the audit's `brand.logo_url`/`favicon_url` sketch — the anon policy uses `key = 'app-settings'`.
- **Live RLS state after batch 6** (project `rupujdsalfekudambviu`): anon SELECT across the whole settings/PII family = `platform_settings` only (narrow `app-settings` row); `elvanto_settings` = super-admin-only policy alone; `plugins` = super-admin-only; `user_roles` anon revoked; `is_super_admin()` live; anon smoke GREEN 0/11.
- **Deferred**: `20260919110000` (email scoping) awaits `20260913000000_create_email_system.sql` being applied live (its base tables don't exist there yet).
- **Pre-existing breakage**: `pnpm lint` needs an ESLint 10 flat config (repo-wide failure); `pnpm typecheck` red on `main` (~30 errors, dragndrop/forms/plugin files); EmailComposer test flaky under full-suite load only.

- **Plugin loading after the lockout (fixed 2026-09-20, this session):** `PluginLoader` previously ran `loadAll()` once at boot — before the RLS change anon could read `plugins`, but afterwards the boot query fails for a signed-out visitor and **no retry happened after sign-in**, leaving super admins without the Integrations section (incl. Elvanto Sync settings) until a hard reload. `PluginLoader` is now session-aware: loads on session arrival, `pluginManager.unloadAll()` on sign-out; 6 new Vitest tests. Combined with the live `plugins` row `elvanto-sync (enabled=true)` and `is_super_admin() = true` for daniel@newlight.au (JWT-claims simulation), super admins reach the Elvanto Sync settings; plain members correctly get nothing.

- **Deep-link refresh bounce (fixed 2026-09-22, user-reported):** refreshing/typing any guarded URL landed on `/people`. Root cause chain: `RequireSuperAdmin` sent *signed-in* non-super-admins to `/login`, and `LoginPage`'s signed-in effect hardcoded `navigate('/people')` — nobody honored `location.state.from`. Fixed three ways: (1) new `RequireAuth` wraps the whole AppShell subtree in `router.tsx` (audit 1.3 remainder) so signed-out refreshes go to `/login` with `state.from`; (2) `LoginPage` returns to `getPostLoginTarget(location.state)` (same-app paths only, `login-redirect.ts` + tests); (3) `RequireSuperAdmin` sends signed-in non-super-admins directly to `/people` (no login hop). Verified server-side too: Cloudflare Pages `not_found_handling: "single-page-application"` + `_worker.ts`/`_middleware.ts` preserve deep paths (nothing server-side rewrites them); `functions/_middleware.ts` only injects `__CF_PAGES_CONFIG__`. Live DB: daniel's login `8909603f-9847-43b1-b0f4-68d54a256172` ↔ person `0f120a77…` `super_admin`, exactly one linked row (no maybeSingle 406 risk). Full suite 47 files green; `pnpm typecheck` now 0 errors (stale `tsc-baseline.txt` says 73).

- **Deep-link bounce — real root cause found 2026-09-24 (fix shipped):** the first report ("refresh always lands on /people") was fixed by the `RequireAuth` + `getPostLoginTarget` + direct-`/people` changes above, but the user then reported the bounce *persisted for logged-in super admins* ("public pages work, guarded pages always go to the root"). RLS and the data were verified healthy first: daniel's auth id `8909603f-9847-43b1-b0f4-68d54a256172` ↔ person `0f120a77-b02e-4b15-ae6e-1afe0a4f7119` (`access_permission = super_admin`, `deleted_at IS NULL`), `has_table_privilege('authenticated','people','SELECT') = true`, `anon = false`, RLS enabled, exactly one link row. The actual cause was a **render-timing race in `AuthProvider`**: `isProfileLoading` was a stored boolean initialised to `false`, so the render between "session resolved" (`setUser` + `setIsLoading(false)`) and "profile effect ran" published `user != null, person == null, isProfileLoading == false`; `RequireSuperAdmin` evaluated that as "not a super admin" and fired `<Navigate to="/people" replace>` before the profile query could resolve. Unguarded routes never consult the flag, which is exactly why public pages were unaffected. Fixed by making the flag **derived** — `profileResolvedForUserId` (`null` until the first lookup settles) with `isProfileLoading = user !== null && profileResolvedForUserId !== user.id` — so it cannot report "resolved" before the query has run, and re-enters loading on an account switch. 4 regression tests in `src/core/auth/__tests__/provider.test.tsx` (2 fail against the old code). Full suite 48 files / 506 tests green; `tsc -b` reports **0 errors in `src/core/auth` / `src/core/guards`** (48 remaining errors are pre-existing, in other workstreams' files).

- **Deployment reality check (2026-09-24):** `https://newlight.app` currently serves a **different application (ChurchCRM)**, not this SPA — deep paths there never reach this code. Browser verification of these fixes must be done against the local Vite dev server (`http://localhost:5173`, which serves the updated `provider.tsx` module) or a fresh Cloudflare Pages deploy; a Cloudflare build has not been run or deployed in this session.

## Open risks

- Production DB runs unversioned policies (`20260907000001` header says prod was set up manually) — every fix migration must be idempotent against **both** the migration-chain state and the drifted prod state (drop-then-create, `if exists` everywhere).
- `pnpm audit` is clean for prod deps but 1 high dev-only advisory remains (audit §4.1) — out of scope here, tracked by 2.7 CI work.


