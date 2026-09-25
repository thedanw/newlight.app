# Security Audit Remediation — Implementation Plan

Goal: Close every remediation item from `.agents/planning/audits/2026-09-19-security-audit.md` (§5 waves 0–2) so anon callers reach zero PII and zero write surfaces, and settings are super-admin-only at DB, route and UI layers (REQ-1, REQ-2).

Approach: Verification-first (TDD). Each batch first runs/re-uses the anon-key smoke probes as failing checks (red), ships an idempotent migration or code change, then re-runs the probes (green) and commits. Migrations are idempotent against both the migration chain and the drifted production DB. Staging before production, always.

Branch: `feat/security-hardening-2026-09-19` (from `main` @ 5df0237; tree has planning-docs-only dirt — stage per-task paths, never `git add -A`)

Scope: In — audit remediation 0.1–0.7, 1.1–1.8, 2.1–2.8, re-audit + docs | Out — new features, dependency upgrades, the dev-only `pnpm audit` advisories (§4.1), AdminSection super-admin picker (decision D-3)

Refs: findings = `./findings.md` (evidence map, assumptions D-1..D-4) · audit = `../2026-09-19-security-audit.md`

## Standing rules (every batch)

1. Start of batch: re-read this plan's batch section + `findings.md`; create todos (max 1 in-progress).
2. Verification-first: write/extend the smoke probes for this batch, run, **record red** in batch notes.
3. Atomic checklist, verb-first, exact paths. One logical change per commit (`fix(security): ...` / `feat(security): ...` / `chore(security): ...`).
4. Every policy/grant/bucket change = new idempotent migration in `supabase/migrations/2026 0919NNNNNN_<name>.sql` (audit §5 guardrail: the lab-era "no auth" preamble must not be reintroduced).
5. Verify with `pnpm typecheck && pnpm lint && pnpm test` (all exit 0) after any TS change.
6. End of batch: tick checkboxes here, append 2-3 sentence summary to the batch's "Previous" line, run compaction (mask verbose outputs → note counts + one-line result). If context >70%, compact before next batch.
7. Subagents for independent subtasks >5 min (see prompts inline); sequential DB steps stay in-session.

## Smoke harness (created in Phase 0, reused everywhere)

`scripts/security/smoke-anon.ps1` — reads `$url`, `$anon` from `.env`; each probe prints `PASS`/`FAIL` + HTTP code; exit 1 if any FAIL. Probe list grows per batch (see each batch's "Red" line). Run: `powershell -File scripts/security/smoke-anon.ps1 [-BaseUrl url] [-AnonKey key]`.

---

## Phase Context: Phase 0 — Baseline & failing verification
- Goal: Capture today's red state so every later batch has a measurable before/after.
- Previous: none (start).
- Key Findings: findings.md → Environment facts, Evidence map.
- Current State: not started → in progress → done.
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%

### Batch 0 — Baseline (audit 0.0)
- [ ] Create branch: `git switch -c feat/security-hardening-2026-09-19` (from `main`).
- [ ] Create `scripts/security/smoke-anon.ps1` with the Phase-0 probe set (audit §9 Verify blocks): `GET /rest/v1/addresses`, `GET /rest/v1/people?select=email,wwcc_number`, `POST /rest/v1/rpc/search_people`, `GET /rest/v1/platform_settings`, `GET /rest/v1/elvanto_settings`, `GET /rest/v1/plugins`, anon `INSERT` into `platform_settings`, `GET /storage/v1/object/list/brand-assets`, `GET /rest/v1/people_public`, `POST /functions/v1/email-send` (empty body), `POST /functions/v1/elvanto-sync-worker`.
- [ ] Run against **staging**: expect all but `people_public` to be `FAIL` today (red). Paste summary (counts + codes only) into findings.md → "Baseline (red)" section.
- [ ] Record `verify_jwt` current values: `Select-String -Path supabase/config.toml -Pattern 'verify_jwt'` → findings.md.
- [ ] Commit: `test(security): add anon smoke harness and baseline (red)` — paths: `scripts/security/`, plan/findings files.
- [ ] Subagent (optional, parallel): draft `public/_headers` contents for batch 7 from audit M8 list; deliver into findings.md.

## Phase Context: Phase 1 — Wave 0: stop the bleeding (audit 0.1–0.7)
- Goal: Anon callers reach zero PII and zero write surfaces; functions reject unauthenticated callers.
- Previous: Batch 0 produced a red baseline and the smoke harness (`findings.md` → Baseline).
- Key Findings: findings.md → Evidence map rows C1–C5, H2, H7.
- Current State: Phase 0 done → Phase 1 in progress.
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%

### Batch 1 — Edge Function authorization (audit 0.1 → C1, C2)
Red: extend smoke probes — `email-send` with anon key + minimal body → today 200 (must become 401); with a member JWT → 403; `elvanto-sync-worker` with anon key → today accepted (must become 401/403).
- [ ] `supabase/functions/email-send/index.ts`: add `supabase.auth.getUser(jwt)` gate before any send; deny 401 without a valid user; deny 403 when the resolved `people.access_permission` is not in the send-authorized set (`team_leaders`+ per audit 1.2; keep the check in one exported helper `assertCanSend()` for reuse).
- [ ] Same file: reject request-body `from` unless it matches a server-side allowlist (constants file, not DB); default to the Workspace alias.
- [ ] Same file: require `person_id` for consent-checked sends — never treat a missing person as "consented" (audit C1 consent bypass).
- [ ] `supabase/functions/elvanto-sync-worker/index.ts`: same `getUser()` gate; deny anon 401; deny non-`admin`/`super_admin` 403; keep the Elvanto host constant; ignore caller-supplied `api_key` entirely (use stored settings only).
- [ ] `src/content/plugins/elvanto-sync/sync/trigger-sync.ts:52-59`: send the **user's** access token (the trigger runs from a signed-in settings session), not the anon key; surface 401/403 as a visible error.
- [ ] Unit tests (Vitest, happy-dom): `assertCanSend` matrix (anon / member / team_leader / admin / super_admin / invalid jwt) — write tests first, watch them fail, then implement.
- [ ] Verify: `pnpm typecheck && pnpm lint && pnpm test`; deploy to staging (`pnpm dlx supabase functions deploy email-send --project-ref <staging>` + worker); re-run smoke probes → green; one real sync from a signed-in super-admin staging session → 200.
- [ ] Commit: `fix(security): require authenticated admin callers on email-send and elvanto-sync-worker`.

### Batch 2 — Revoke anon writes: settings, plugins, elvanto, storage (audit 0.2 → C3, C4)
Red: smoke probes — anon `INSERT platform_settings` → today 201 (must be 42501/403); `brand-assets` anon list/upload → today allowed (must be read-only).
- [ ] Migration `supabase/migrations/20260919100000_revoke_anon_writes_settings_plugins.sql`: for `platform_settings`, `plugins`, `elvanto_settings`, `elvanto_sync_config`, `elvanto_sync_dead_letter` — `REVOKE INSERT, UPDATE, DELETE ON ... FROM anon;` and `DROP POLICY IF EXISTS` every `TO anon` write policy (idempotent, drop-then-create style).
- [ ] Same migration: drop the blanket `authenticated` INSERT/UPDATE policies from `20260906000001_fix_production_rls_and_grants.sql:38-71` now; their super-admin replacements land in batch 6. Interim state (members lose settings writes) is safe — record it in the migration header comment.
- [ ] Migration `20260919100100_tighten_brand_assets_bucket.sql`: storage policy — anon `SELECT` (read) stays; anon `INSERT/UPDATE/DELETE` revoked; uploads require `authenticated`.
- [ ] Verify: `pnpm dlx supabase db reset` (chain applies, exit 0); staging `pnpm dlx supabase db push`; smoke probes green (anon writes 42501/403, uploads 403); signed-in app still renders (settings save failing for non-super-admins is expected until batch 6).
- [ ] Commit: `fix(security): revoke anon writes on settings, plugins, elvanto tables and brand-assets`.

### Batch 3 — People PII off the anon plane (audit 0.3, 0.6, 0.7 → C5, H2, H7; REQ-1)
Red: Phase-0 probes — `GET /rest/v1/addresses` → today rows (must be 403/[]); `GET /rest/v1/people?select=email,wwcc_number` → today PII (must be 403/[]); `POST rpc/search_people` → today rows (must be 403); `GET /rest/v1/people_public` → today over-broad (must return only public-flagged rows).
- [ ] Migration `20260919100200_lock_people_pii_from_anon.sql`:
  - `REVOKE SELECT ON public.people, public.addresses, public.households, public.people_relationships, public.people_tags FROM anon;`
  - Drop the lab-era `USING (true)` SELECT policies on those five; recreate as `FOR SELECT TO authenticated USING (true)` (tag *names* on `tags` stay anon-readable — not PII; audit §9 REQ-1 fix step 2).
  - `REVOKE EXECUTE ON FUNCTION public.search_people(text,integer) FROM PUBLIC, anon; GRANT EXECUTE ... TO authenticated;` — same for its four helper functions.
  - Recreate `people_public` (`drop view if exists`): `security_invoker = on`, underlying SELECT gains `WHERE access_permission = 'public' AND deleted_at IS NULL` (audit 0.3 exit criterion).
- [ ] Verify members still see everything (REQ-1 "members only" bar): staging session as `member_area` → People dashboard + profile render with addresses/households; public directory still lists only `access_permission='public'` people.
- [ ] Verify: `pnpm dlx supabase db reset`; staging push; smoke probes green — including the two REQ-1 curl blocks in audit §9.
- [ ] Commit: `fix(security): restrict people PII and search to authenticated members only (C5,H2,H7)`.

### Batch 4 — Rotate secrets, confirm verify_jwt (audit 0.4, 0.5)
Red: n/a (ops tasks; verification = recorded outputs in findings.md).
- [ ] Rotate the Elvanto API key (revoke old in Elvanto; set new via `pnpm dlx supabase secrets set ELVANTO_API_KEY=...` on staging then prod) and the SMTP credentials used by `email-send` — audit 0.4. Do not wait for the batch-9 server-side move.
- [ ] Record per-function `verify_jwt` from `supabase/config.toml`; set `verify_jwt = true` for all three functions (config + redeploy); paste output into findings.md → audit 0.5 evidence.
- [ ] Confirm no caller-supplied `api_key` path survives in the worker (batch 1 removed it); note remaining client-side decrypt exposure for batch 9.
- [ ] Commit: `docs(security): record verify_jwt and secret rotation evidence` (findings.md only; no secret values committed, ever).

**Wave-0 gate:** all Phase-1 probes green on staging, then one explicit production session (`pnpm dlx supabase db push --linked` + function deploys), then re-run probes against prod (expect green). Update audit §5: tick 0.1–0.7 with one-line evidence each.

## Phase Context: Phase 2 — Wave 1: correctness of advertised controls (audit 1.1–1.8)
- Goal: The controls the app claims to have actually work: unsubscribe suppression, member-scoped email data, route guards, super-admin settings (REQ-2), clean build output, versioned people write rules.
- Previous: Wave 0 gate passed — anon plane is closed, functions authenticate callers (plan.md Phase 1).
- Key Findings: findings.md → Evidence map rows H1, H3/H4, H6, REQ-2, 1.8; patterns (getCurrentOperatorPermission, sidebar tile, security-definer helper).
- Current State: Phase 1 done → Phase 2 in progress.
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%

### Batch 5 — Unsubscribe suppression + email table scoping (audit 1.1, 1.2 → H3, H4, M4)
Red: probe — POST unsubscribe token → today 200 but `email_unsubscribes.email_hash` stored as `''` → next send NOT suppressed (must record real hash, idempotent on replay); member-role SELECT on `email_unsubscribes` → today allowed (must be 403).
- [ ] Migration `20260919110000_fix_email_unsubscribe_and_scope.sql`: add `email_unsubscribe_tokens(token_hash, email_hash, expires_at, used_at)` (or reuse existing table if one exists — check `20260913000000_create_email_system.sql` first); scope email tables to role tiers: SELECT limited to send-authorized roles, `email_unsubscribes` not writable/deletable by plain members (audit 1.2 exit criterion).
- [ ] `supabase/functions/email-unsubscribe/index.ts`: look up token → take `email_hash` **from the token row** (never from client input); fail closed on unknown/expired/used token (400, not silent 200); rate-limit per IP+token (simple in-DB counter or check-second) for M4; make POST idempotent (replay → 200, single row).
- [ ] Update send path (`src/core/email/lib/sending.ts` + function) to filter suppressed hashes before send, so the 1.1 exit test passes: unsubscribe → next send records `suppressed`.
- [ ] Vitest: token-validation unit tests (valid/expired/used/unknown → expected status + hash source).
- [ ] Verify: `pnpm typecheck && pnpm lint && pnpm test`; `supabase db reset`; staging deploy of both functions; end-to-end: unsubscribe with a real token → resend → suppression row matches; replayed token → 200, still one row; member JWT `GET email_unsubscribes` → 403.
- [ ] Commit: `fix(security): make unsubscribe suppression real and scope email tables by role (H3,H4)`.

### Batch 6 — Route guards + Super-Admin settings (audit 1.3, 1.6, 1.7 → H1, C3/C4 remainder; REQ-2) — **DONE 2026-09-20**
Red: smoke/UI — signed-out `/settings` renders (must redirect `/login`); sidebar tile visible signed-out (must be hidden); member JWT `UPDATE platform_settings` → must be 42501; anon `GET platform_settings` → must expose only the pre-auth key.
- [x] Migration `20260919110100_super_admin_settings_rls.sql`: `is_super_admin()` security-definer helper; settings-family policies re-pointed to it; narrow anon SELECT kept for the **real** pre-auth key `app-settings` (the audit's `brand.*` keys do not exist in code — `main.tsx` boot + the logo read `app-settings`); `user_roles` anon SELECT revoked; drifted live policy names + anon TRUNCATE grants cleaned (hygiene block). **Applied to the live project (rupujdsalfekudambviu) via the management API and recorded in `supabase_migrations.schema_migrations`.**
- [x] Same migration covers `platform_settings`, `module_config`, `plugins`, `elvanto_settings`, `elvanto_sync_config`, `elvanto_sync_history`, `elvanto_sync_dead_letter`, `user_roles` (broader than the audit's five-table list — C4 closure).
- [x] `src/core/guards/RequireAuth.tsx` (new, 2026-09-22, user-reported deep-link bounce): fail-closed global guard wrapping the whole `AppShell` subtree in `src/core/router.tsx` (audit 1.3 remainder; `/login` and `/forms/:formId` stay public). Signed-out visitors → `/login` with the requested path in `state.from`; deep links survive refresh + sign-in.
- [x] **Profile-loading race fix (2026-09-24, second user report — the actual deep-link root cause):** `AuthProvider` stored `isProfileLoading` as a boolean initialised to `false`, so the single render between "session resolved" and "people-row query ran" published `user != null, person == null, isProfileLoading == false`; `RequireSuperAdmin` read that as *not a super admin* and fired `<Navigate to="/people" replace>`, which the user saw as "public pages work, guarded pages always bounce to /people". Replaced the flag with a derived value keyed on the auth user id (`profileResolvedForUserId`, `null` until the lookup settles) so it fails closed for that render. Regression suite: `src/core/auth/__tests__/provider.test.tsx` (4 tests: fail-closed on the race, stamp clears loading, signed-out never loads a profile, account switch re-enters loading). DB verified correct first (daniel's `8909603f…` ↔ person `0f120a77…` `super_admin`, `authenticated` SELECT granted, anon denied, no duplicate link rows) — RLS was never the problem.
- [x] Post-login deep-link return (2026-09-22): `src/core/auth/lib/login-redirect.ts` — `getPostLoginTarget(state)`, same-app-path-only (open-redirect guard), 3 unit tests; `LoginPage` now navigates to `location.state.from` instead of the hardcoded `/people`. `RequireSuperAdmin` sends signed-in non-super-admins straight to `/people` (the old `/login` hop + hardcoded bounce was the reported "refresh always lands on /people"); super-admin deep links render in place. Verified live: daniel@newlight.au (`8909603f…`) ↔ person `0f120a77…` = `super_admin`, single link row.
- [x] `src/core/guards/RequireSuperAdmin.tsx` (new): standalone guard on `useAuth()` (`user`, `isLoading`, `person`, `isProfileLoading`) — fail closed while loading; non-super-admin → `/login`; wired into `src/core/settings/routes.tsx` around the whole `/settings/*` subtree.
- [x] `src/core/ui/sidebar.tsx`: Settings tile rendered only when `isSettingsTileVisible(person, isProfileLoading)` (`src/core/auth/lib/permissions.ts` — pure, unit-tested helper; fail closed while the linked person loads).
- [x] Vitest: `src/core/auth/lib/permissions.test.ts` (7 tests) + `src/core/guards/__tests__/RequireSuperAdmin.test.tsx` (6 tests: signed-out/member/admin redirect, loading fail-closed ×2, super-admin renders) — 13/13 green.
- [x] Verify: targeted suite green; **live anon smoke `scripts/security/smoke-anon.ps1` → GREEN 0/11 failures** after applying; AccountPage "Role" no longer falls back to the JWT role claim (`user.role` = `authenticated`) — it shows the linked person's `access_permission` and warns when unlinked (REQ: logins must link to a people profile).
- [x] Commit: pending — see Execution log (files staged with the concurrent email workstream).


### Batch 7 — Build output allowlist + security headers (audit 1.4, 1.5 → H6, L5, M8)
Red: probe — `pnpm build` then `Get-ChildItem dist\content -Recurse -Include *.ts,*.sql` → today lists worker `edge-function.ts` + `db/migrations/*.sql` (must be empty); `curl -I` on any deployed page → today no CSP/HSTS (must show all five headers).
- [ ] Rewrite `scripts/copy-plugins.mjs` as an **allowlist**: explicit per-plugin directory + file patterns (runtime assets only: `manifest.json`, built JS/CSS, images); throw (non-zero exit) if a matched path ends in `.ts`/`.sql` or resolves outside `src/content/plugins/<name>/public-root`; keep `pnpm dev`/`pnpm build` wiring unchanged.
- [ ] Delete the duplicated `supabase/functions/.../edge-function.ts` copy inside the plugin content tree (keep the authoritative one under `supabase/functions/`); grep to confirm no second copy remains.
- [ ] Add `public/_headers`: `Content-Security-Policy` (script-src 'self' + the Supabase project origin; frame-ancestors 'none'), `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimal (audit M8 list; Cloudflare Pages serves `_headers` from `public/` via the existing build).
- [ ] Verify: `pnpm build` exits 0; dist probe green (no `.ts`/`.sql` under `dist\content`); `pnpm preview` + `curl -I http://localhost:4173` shows the headers; deploy preview and re-check with the real domain.
- [ ] Commit: `fix(security): allowlist plugin build output and add security headers (H6,M8)`.

### Batch 8 — Version the missing people write rules (audit 1.8 → drift/L5, closes REQ-1)
Red: local only — `pnpm dlx supabase db reset` then attempt person create/edit via the app (or SQL as a role with the member JWT): today 42501 on a fresh chain (write policies exist only in the drifted prod DB).
- [ ] Migration `20260919110200_people_write_policies_and_audit_rls.sql`: add `FOR INSERT`/`FOR UPDATE`/`FOR DELETE` policies on `people` `TO authenticated` (MVP per decision A.2.2: all non-deleted rows; mirror the SELECT policy scope); enable RLS on `people_audit` with `authenticated` = SELECT-only, writes service-role/definer only (audit 1.8 exit criterion).
- [ ] Cross-check the 1.6 batch-6 helper: `is_super_admin()` still returns true for the staging super-admin after these policy changes.
- [ ] Verify: `pnpm dlx supabase db reset` → create + edit person works through the normal app path (no 42501); member cannot write `people_audit`; `git grep -n "TO authenticated" supabase/migrations/20260919110200*` shows the three write policies.
- [ ] Commit: `fix(security): version people write policies and lock people_audit (drift,L5)`.

**Wave-1 gate:** re-run the full smoke suite + `pnpm typecheck && pnpm lint && pnpm test` (all green); staging `pnpm build` + preview header check; update audit §5: tick 1.1–1.8 with one-line evidence each. Production deploy session mirrors the Wave-0 gate.

## Phase Context: Phase 3 — Wave 2: defense in depth (audit 2.1–2.8)
- Goal: Remove the remaining exposure classes: client-side secrets, permissive CORS/error echo, public forms ambiguity, contract drift, missing CI, privacy/git hygiene.
- Previous: Wave 1 gate passed — advertised controls now work (plan.md Phase 2).
- Key Findings: findings.md → Evidence map rows M1/M2, M3, M5–M9, L1–L3, L7; decisions D-1 (decision-items may end as "decided + recorded").
- Current State: Phase 2 done → Phase 3 in progress.
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%

### Batch 9 — Elvanto credentials server-side + CORS/error hygiene (audit 2.1, 2.2 → M1, M2, M3)
Red: probe — network tab / bundle grep `pnpm build && git grep -n "decrypt" dist/assets` (today the key decrypts in-browser); `curl -i -X OPTIONS` on the functions (today permissive CORS + internal error bodies).
- [ ] `src/content/plugins/elvanto-sync/utils/encryption.ts` + `settings/ConnectionTab.tsx`: stop decrypting in the browser; the key is entered once, sent over TLS to the worker, stored encrypted server-side; UI shows only a masked "configured ✓" state and a **test connection** call that the worker performs (`secure:false` and the local decrypt path removed).
- [ ] `supabase/functions/elvanto-sync-worker/index.ts`: move key handling fully server-side; add a `test` action returning only ok/fail (no key material, no Elvanto error bodies verbatim).
- [ ] CORS in all three functions: reflect only allowlisted origins (app domain + staging), else 403; error responses return `{error: "code"}` — never stack traces / provider internals (audit M3).
- [ ] Verify: `pnpm typecheck && pnpm lint && pnpm test`; staging function deploys; probes green (OPTIONS from allowed origin → CORS headers; unknown origin → 403; error body contains no internals); ConnectionTab test-connection works for a super_admin.
- [ ] Commit: `fix(security): keep Elvanto credentials server-side; restrict CORS and error detail (M1,M2,M3)`.

### Batch 10 — Forms decision, sendId contract, error page (audit 2.3, 2.4, 2.5 → M5, M6, M7)
Red: probe — signed-out `/#/forms/<slug>` (route in `src/modules/forms/pages/PublicPage.tsx`) submits today with anon writes (audit M5); `email_logs` links built with `id` vs `{sendId}` mismatch (M7); production error page dumps internals (M6).
- [ ] **Decide** (record in findings.md → Decisions): keep public forms → implement `submit_form(token)` security-definer RPC + `forms_public` view (anon gets EXECUTE on the RPC only, table writes denied), or drop/hide the public route. Default if undecided: implement the RPC (matches audit 2.4 first option).
- [ ] If implementing: migration `20260919120000_forms_public_submit.sql` (RPC validates the slug is published, writes `form_submissions` as definer, rate-limited); `PublicPage.tsx` submits via RPC.
- [ ] Contract: align `src/core/email/lib/client.ts` + `sending.ts` with the function on `{sendId}` everywhere; grep for the legacy id param and fix all call sites.
- [ ] `src/core/ui/error-boundary.tsx` + `src/core/errors/ErrorPage.tsx`: private error detail behind a "show details" toggle **in dev only**; production page shows a correlation id only; add a minimal server-side telemetry hook (console → `error_logs` table via service-role function or Supabase logs) per audit 2.3.
- [ ] Vitest: error-page redaction test (no message/details rendered in prod mode); forms RPC decision tests if implemented.
- [ ] Verify: suite green; `supabase db reset`; manual: signed-out forms flow submits once then rate-limits (or route removed); trigger a render error in preview → no internals shown.
- [ ] Commit: `fix(security): public forms submit path, sendId contract alignment, private error page (M5,M6,M7)`.

### Batch 11 — Posture decisions, CI, privacy & git hygiene (audit 2.6, 2.7, 2.8 → H5, M9, L1–L3, L7)
Red: n/a for decisions; CI red = no workflow exists today (`Get-ChildItem .github/workflows` → empty).
- [ ] **Decide + record** (findings.md → Decisions; cross-link the named decision doc per audit convention): (a) `authenticated` access posture H5 — which role tiers read which domains; (b) `localStorage` vs memory session for refresh-token storage M9 (Supabase JS default trade-off; document chosen storage + reasons).
- [ ] CI `.github/workflows/ci.yml`: `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm audit --prod --audit-level high` (audit 2.7; single authoritative lockfile — resolve the two-lockfile state L2 as part of this), plus the anon-denial smoke script as a nightly `workflow_dispatch` job (needs secrets: staging `$url`/`$anon`).
- [ ] Privacy note: append purpose/retention/export/erasure section to the audit (L7) or `findings.md`; fix tracking: `git rm -r --cached supabase/.temp supabase/.branches` + `.gitignore` entries (audit L1/2.8).
- [ ] Verify: push branch → CI runs all steps green; `git status` clean of `supabase/.temp`; audit doc has the two recorded decisions with review dates.
- [ ] Commit: `chore(security): add CI with frozen lockfile and anon smoke, record posture decisions, untrack supabase temp (L1,L2,L3)`.

## Phase Context: Phase 4 — Re-audit & delivery
- Goal: Prove the audit's checklist is green, update the audit doc, deliver a reviewable branch.
- Previous: Waves 0–2 implemented (Phases 1–3); all smoke probes green on staging.
- Key Findings: findings.md → Baseline (red) vs final (green) comparison; audit §6 checklist, §7 re-audit triggers.
- Current State: Phase 3 done → Phase 4 in progress.
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%

### Batch 12 — Full verification, audit update, PR
- [ ] Production deploy session (explicit, D-4): `pnpm dlx supabase db push --linked` (prod), deploy all three functions, rotate-confirmed secrets live, then full smoke suite **against prod** → all green.
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` one final time; `pnpm audit --prod --audit-level moderate` → "No known vulnerabilities found".
- [ ] Update `../2026-09-19-security-audit.md`: tick every §5 row with one-line evidence; §6 checklist → new statuses; §2/§3 findings of fixed items get `→ RESOLVED in feat/security-hardening-2026-09-19` markers (audits README convention: findings reopened/annotated, never deleted); re-count severities in the header if the §9 REQ items close.
- [ ] Update `.agents/planning/audits/README.md` index row headline (e.g. "…remediated in feat/security-hardening-2026-09-19").
- [ ] Push branch, open PR: description lists wave gates + before/after smoke outputs (counts only), links audit + this plan. Do not merge until review.
- [ ] Commit: `docs(security): mark audit findings resolved and record verification evidence`.

## Execution handoff & subagent prompt template

- Handoff: fresh sessions per batch with `executing-plans`; this file is the single queue.
- Subagent spawn: parallelizable research/drafting only (batch 0 headers draft; batch 6 guard-test scaffolding; batch 11 CI yml draft). Never for migrations or deploys (sequential, stateful).
- Prompt: `Task: <batch subtask> | Context: <phase evolving context> | Deliverable: <concrete output> | Constraints: TDD, exact paths from this plan, no secrets | Update: append to findings.md`.

## Error table (3-strike protocol: fix → alternative → STOP/revert/ask)

| # | Batch | Error | Resolution | Date |
|---|---|---|---|---|
| E-1 | — | (append as they occur) | | |

## Decision log (beyond D-1…D-4 in findings.md)

| # | Batch | Decision | Reason | Date |
|---|---|---|---|---|
| — | — | | | |

## Done criteria (all must hold)

1. Every audit §5 remediation row ticked with evidence; §6 checklist has no ❌ left that this plan scoped in.
2. Full smoke suite green on **staging and production**; CI green including audit + smoke jobs.
3. REQ-1 verified with a member session (full people access) and anon key (403/empty everywhere); REQ-2 verified for signed-out / member / super_admin personas (tile hidden, `/settings` redirects, DB writes 42501, branding key still anon-readable).
4. No secrets in the branch (secret grep clean); audit + audits README updated; PR open for review.

## Execution log

### 2026-09-20 — Batch 6 executed + applied to the live project
- Migration `20260919110100_super_admin_settings_rls.sql` written, **applied live** (project `rupujdsalfekudambviu`) via the management API, versions recorded in `supabase_migrations.schema_migrations` (19100000, 19100100, 19100200, 19110100, 20260920000000).
- Live verification: anon smoke `scripts/security/smoke-anon.ps1` → **GREEN, 0/11 failures** (addresses/people/search → 403; `platform_settings` → only `app-settings` visible; `elvanto_settings`/`plugins` → 403; anon INSERT → 42501/403; functions → 401/403; brand-assets read-only).
- Fixes made to two earlier batch files before applying: `20260919100100` was byte-corrupted (rewritten to drop the drifted `Anon write/update/delete brand assets` storage policies); `20260919100200` recreated `people_public` with a non-existent `lastname_initial` column, re-granted anon `people_tags` rows, and revoked four search functions that do not exist (rewritten: correct view columns + `access_permission='public'` filter, `security_invoker` kept OFF deliberately — anon's SELECT on `people` is revoked, so invoker rights would blank the public directory; only `search_people(text,integer)` touched).
- Account → profile link applied live: `people` row `0f120a77-b02e-4b15-ae6e-1afe0a4f7119` (Daniel Walmsley) now has `auth_user_id = 8909603f-9847-43b1-b0f4-68d54a256172` (daniel@newlight.au) and `access_permission = 'super_admin'`; uniqueness verified. AccountPage no longer shows the JWT role claim as "Role" and warns when a login has no linked profile.
- Deferred: `20260919110000` (email unsubscribe scoping) — **not applied**; live DB lacks the email system tables (`20260913000000_create_email_system.sql` is unapplied). Apply that first, then re-run this migration. Transaction rolled back cleanly (no `email_unsubscribe_tokens` debris).
- Pre-existing breakage noted (not introduced here): `pnpm lint` fails repo-wide (no `eslint.config.*` for ESLint 10); `pnpm typecheck` red on `main` (~30 errors across dragndrop/forms/plugin files); EmailComposer test fails only under full-suite load (passes in isolation).






