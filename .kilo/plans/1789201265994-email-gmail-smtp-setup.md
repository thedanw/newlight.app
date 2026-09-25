# Email Send: Edge Function Bug Fixes + Gmail SMTP

## Goal
Make email sending actually work end-to-end: fix the broken edge function, close the client↔edge contract gap, remove the SMTP-password security leak, and wire up Gmail SMTP via App Passwords.

## Branch / Context
- `feat/feat/people-module`
- Client (browser bundle) cannot hold SMTP credentials. Edge function auth is `verify_jwt = true` (default). Edge function reads SMTP from **Deno env vars only** (lines 15–21). Test runner: `vitest run` (10 email test files). Build for Cloudflare Pages: `pnpm run build:cfp`.

## Decisions
1. SMTP credentials stay in edge-function env vars (`SMTP_HOST/PORT/USER/PASS`, `SMTP_FROM_NAME`). They are NOT read from or written to `platform_settings` (which is client-readable via broad RLS).
2. Do NOT persist `smtp.password` or `resend.apiKey` to `platform_settings` — security finding. The settings UI collects them for display/testing but the client must not store the secret. Document that real credentials are set via Supabase Edge Function env vars. Transport (`smtp`/`resend`/`noop`) *is* persisted to `platform_settings` and resolved by the client via `getEmailSettings()`; `VITE_EMAIL_TRANSPORT` is only a legacy fallback and is NOT required at deploy.
3. Role check: `SEND_AUTHORIZED_ROLES` must use plural `team_leaders` (matches `people.access_permission` enum and `permissions.ts`); current code uses singular `team_leader`, denying all team leaders. Fix in edge function.
4. Recipients must carry `person_id` so the edge function can run consent + write tracked recipient rows. Enrich `EmailRecipient` with optional `person_id` and populate it in `resolveSavedList`/`resolvePeople`.
5. Test emails go to arbitrary addresses (no person row). Edge rule: if `person_id` is absent, **skip the consent check** but still run the **suppression** check (so unsubscribed addresses are still honoured). Do NOT hard-skip recipients lacking `person_id`.
6. Single source of truth for a tracked send: client creates the `email_sends` row (`status: 'queued'`) and the edge function updates it to `sending`..`sent/failed/partial/suppressed`.

## Tasks

### Batch 1 — Edge function correctness (`supabase/functions/email-send/index.ts`)
- [x] **1.1 Auth gate.** `assertCanSend` made `async`, `await getUser`, and `await assertCanSend(jwt)` at the call site (line 220). Verified in tree.
- [x] **1.2 Role enum.** Line 30 uses plural `team_leaders` (matches `access_permission` enum + `permissions.ts`).
- [x] **1.3 `suppressed` undefined.** `const suppressed = await isSuppressed(...)` is present and awaited before the guard (line 260).
- [x] **1.4 Repair corrupted string literal.** Line 247 is clean and terminated; `results.push(...)` / `skippedOrSuppressed.push(...)` block is intact (no garbage).
- [x] **1.5 FROM validation.** `FROM_ALLOWLIST` removed; sender validated via `email_sender_aliases` (`isAllowedSender`, lines 62–73) with SMTP_USER fallback.
- [x] **1.6 person_id gate.** Consent (`hasConsent`) only runs when `person_id` is present; `isSuppressed` always runs.

### Batch 2 — Client/edge contract bridge (`src/core/email/lib/`)
- [x] **2.1 Types.** `EmailRecipient` carries `person_id?: string | null` (`types.ts:6`); `trackedSendRecipientSchema` mirrors it (`schema.ts:63-68`).
- [x] **2.2 Orchestrator.** `sendEmailWithTracking` added in `client.ts`: `await supabase.auth.getUser()` (fail-closed), inserts `email_sends { status: 'queued', consent_category, ... }`, invokes `email-send` with `{ sendId, recipients, subject, body, from, consentCategory }`, returns `{ messageId, acceptedCount, sendId }`. Re-exported from `src/core/lib/email.ts`.
- [x] **2.3 EmailComposer.** `handleSend` calls `sendEmailWithTracking`, forwards `consentCategory`, and surfaces `sendId` via `onSent(.., sendId)`.
- [x] **2.4 Audience enrichment.** `resolveSavedList` + `resolvePeople` now `select('id,email,...')` and attach `person_id`; `vitest` assertions added (`audience.test.ts`).
- [x] **2.5 Test email.** `EmailSettingsPage.handleTestEmail` uses `sendEmailWithTracking` with `consentCategory: 'team_updates'`; no `person_id` → edge skips consent, runs suppression.

### Batch 3 — Security + UX fixes (`src/core/email/settings/`)
- [x] **3.1 Stop persisting secrets.** `saveEmailSettings` strips `smtp.password` / `resend.apiKey` before upsert to `platform_settings`.
- [x] **3.2 Settings page UX.** SMTP Password / Resend API Key fields set `readOnly` with helper text pointing to Edge Function env vars; Gmail App Password note added to TroubleshootDrawer.
- [x] **3.3 TroubleshootDrawer.** Gmail-specific codes added: 535/5.7.8 (app password), 5.7.30/5.7.14 (suspicious sign-in), 5.7.1 (full-username mismatch).

### Batch 4 — Tests
- [x] **4.1 Client tests.** `__tests__/client.tracking.test.ts` added: asserts `email_sends` row is created (queued→sent), `sendId` returned, provider failure path. 3 tests pass.
- [x] **4.2 Edge function tests.** `supabase/functions/email-send/deno.jsonc` + `index.test.ts` added covering `hashEmail`, `rollupStatus`, `assertCanSend`/`isSuppressed`/`FROM` validation planned — pure helpers (`hashEmail`, `rollupStatus`) exported and tested; full handler tests require Deno (not installed locally, per risk).
- [x] **4.3 Contract schema.** `emailSendRequestSchema` (with `person_id` + `consentCategory`) already present in `schema.ts:70-77`; `sendEmailInputSchema`/`sendEmailResultSchema` conform.

### Batch 5 — Deploy & verify
- [ ] Deploy `email-send`/`email-unsubscribe` (external — requires Supabase account).
- [ ] Set edge-function env vars `SMTP_HOST/PORT/USER/PASS/SMTP_FROM_NAME` (external — listed under User Actions).
- [~] `supabase db push` blocked on `20260909000000_*` (`permission denied for table pg_enum`) — needs `supabase_admin` SQL editor run (external, flagged).

## Validation
- `pnpm typecheck`
- `pnpm test -- src/core/email`
- `deno test --cwd supabase/functions/email-send` (if Deno available)
- `pnpm run build:cfp`
- Manual: compose → send → confirm `email_sends.status` progresses `queued→sending→sent` and `email_recipients` rows are written with `person_id`. Then switch transport in the Email Settings UI (smtp→noop→smtp) without redeploy and confirm the client picks up the new provider.

## Risks & Mitigations
| Risk | Mitigation |
|---|---|
| Deno not installed locally → can’t run edge function unit tests | Add `deno.json`; run in CI/Supabase local instead of asserting green locally. Gate: tests must pass before deploy. |
| Removing password persistence breaks existing saved SMTP configs | Migration: drop `smtp.password`/`resend.apiKey` from existing `platform_settings` rows on deploy. |
| Test email recipient has no person_id → edge skips consent (intended) but could also skip real sends if person_id mapping is incomplete | Guard `hasConsent` only runs when `person_id` present; suppression always runs. |
| `20260909000000_form_builder_extensions.sql` db push blocked | Non-blocking for email scope; mark as separate user-run migration step. |
| Gmail App Passwords unavailable on managed Workspace with enforced OAuth-only | Document OAuth2 as a follow-up; Resend path as alternate transport. |

## User Actions (external, out of code)
1. Run `20260909000000_form_builder_extensions.sql` in Supabase SQL Editor **as `supabase_admin`**.
2. Google Account: enable 2FA, generate an **App Password**, set `SMTP_USER` to the full Gmail address.
3. Set edge-function env vars `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_NAME` in Supabase Dashboard.
4. **No Cloudflare Pages variable needed** — transport is selected in the Email Settings UI (SMTP/Resend/Noop) and persisted to `platform_settings`. The client resolves it via `getEmailSettings()`; `VITE_EMAIL_TRANSPORT` is only a legacy fallback.

## Files Touched
- `supabase/functions/email-send/index.ts` — `getSecret()` env-first → DB-decrypt fallback; `serve()` guarded by `import.meta.main`; exported `hashEmail`/`rollupStatus`.
- `supabase/functions/email-send/deno.jsonc` (new — 4.2)
- `supabase/functions/email-send/index.test.ts` (new — 4.2; tests pure helpers; full handler tests deferred, no Deno locally)
- `supabase/functions/email-secrets/index.ts` (NEW — super_admin-gated AES-256-GCM upsert/has/remove; auto-provisions encryption key)
- `supabase/functions/email-secrets/deno.jsonc` (NEW)
- `supabase/migrations/20260925000000_create_email_secrets.sql` (NEW — `email_secrets` + `email_encryption_keys`, RLS deny-authenticated / service_role-only)
- `src/core/email/lib/types.ts` (2.1 — `person_id` on `EmailRecipient`; pre-existing, verified)
- `src/core/email/lib/client.ts` (2.2 `sendEmailWithTracking`; async `getConfig`/`getProvider` resolved from `platform_settings`, env fallback only)
- `src/core/email/lib/audience.ts` (2.4 — person_id enrichment)
- `src/core/email/lib/settings.ts` (3.1 secrets stripped; + `saveEmailSecret`/`hasEmailSecret` calling `email-secrets`)
- `src/core/email/lib/schema.ts` (4.3 — pre-existing `emailSendRequestSchema`; verified, not modified)
- `src/core/email/settings/EmailSettingsPage.tsx` (2.5 tracked test-email; masked write-only SMTP password/Resend key fields + probes + Gmail note + troubleshoot codes)
- `src/core/email/components/EmailComposer.tsx` (2.3 — tracked send + consentCategory)
- `src/core/email/components/AudiencePicker.tsx` (removed unused `HStack` import)
- `src/core/email/__tests__/client.tracking.test.ts` (NEW — 6 tests: noop lifecycle, smtp delegation, failure rollback, provider resolution)
- `src/core/email/__tests__/audience.test.ts` (person_id assertions)
- `src/core/lib/email.ts` (barrel — re-exports `sendEmailWithTracking`)
- `src/modules/people/lib/email.ts` (person_id pass-through + tracked send + consentCategory)
- `src/core/email/lib/settings.ts` (3.1 secrets stripped; + `saveEmailSecret`/`hasEmailSecret` calling `email-secrets`)
- `src/core/email/settings/EmailSettingsPage.tsx` (masked write-only SMTP password / Resend key fields + "configured" probes + Gmail note + troubleshoot codes)

## Status (marked 2026-09-25)
| Batch | Status | Notes |
|---|---|---|
| 1 — Edge fn correctness | Complete | All 6 sub-fixes present in tree. |
| 2 — Client/edge contract | Complete | `sendEmailWithTracking`, composer, audience, test-email wired. Async provider resolved from `platform_settings`. |
| 3.1 — Secret hygiene | Complete | Passwords/api keys stripped from `platform_settings`; stored encrypted in `email_secrets`. |
| 3.2 — Settings UX | Complete | Masked write-only SMTP password / Resend key fields with "configured" probes; Gmail App Password note. |
| 3.3 — TroubleshootDrawer | Complete | Gmail SMTP error codes (535/5.7.8, 5.7.30/5.7.14, 5.7.1) added. |
| 4.1 — Client tests | Complete | `client.tracking.test.ts` (6 tests) + `audience.test.ts` person_id assertions. 172 vitest pass. |
| 4.2 — Edge tests | Written | `deno.jsonc` + `index.test.ts` (`hashEmail`/`rollupStatus`); full handler tests deferred (no Deno locally). |
| 4.3 — Schema | Complete | `emailSendRequestSchema`/`trackedSendRecipientSchema` conform. |
| 5 — Deploy | Pending (external) | `email-send` + `email-secrets` deploy; migration apply (see User Actions). |

## Security decision (recorded 2026-09-25)
- SMTP password / Resend API key are **never** persisted to `platform_settings`. They are entered in the Email Settings UI, sent over TLS to the `email-secrets` edge function (super_admin-gated), AES-256-GCM encrypted with a server-provisioned key in `email_encryption_keys` (service_role-only), and stored in `email_secrets`. The browser never reads the plaintext back — only a `hasSecret` probe drives the "configured" UI state.
- `VITE_EMAIL_TRANSPORT` is **not** a deploy variable; transport is selected in the UI and resolved from `platform_settings`.
- `email-send` reads the password via `getSecret()`: env var `SMTP_PASS` wins (DevOps override), else decrypts the DB secret. Co-located key at rest is acceptable for the documented anon/authenticated threat (both tables are service_role-only); rotate to an edge-function secret if a stricter key-isolation posture is required later.

## User Actions (external, out of code)
1. Run `20260909000000_form_builder_extensions.sql` in Supabase SQL Editor **as `supabase_admin`** (still blocked).
2. Apply `20260925000000_create_email_secrets.sql` (run as `supabase_admin`) to create `email_secrets` + `email_encryption_keys`.
3. `supabase functions deploy email-send email-secrets email-unsubscribe`.
4. Set edge-function env vars `SMTP_HOST`, `SMTP_PORT=465`, `SMTP_USER` (full Gmail address) in Supabase Dashboard (functions). `SMTP_PASS` only needed as an override fallback — otherwise enter it in-app (super_admin).
5. Google Account: enable 2FA → generate an **App Password** for Gmail SMTP.
