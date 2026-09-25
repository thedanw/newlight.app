# Email SMTP Setup & Bug Fixes Implementation Plan

**Goal:** Enable sending email via Gmail SMTP through the edge function, fix critical bugs, and bridge the client/edge function contract gap.

**Approach:** Fix edge function bugs first (undefined `suppressed`, auth scoping, FROM_ALLOWLIST), then update client to create `email_sends` rows before invoking the function, add tests for new client orchestration, and document Gmail SMTP setup in the settings UI.

**Branch:** `feat/feat/people-module`

**Scope:**
- In: Edge function bug fixes, client/edge contract bridge, send orchestration, tests, Gmail SMTP docs
- Out: OAuth2 integration (App Passwords only), form builder migration (blocked), Resend edge function support

**Validation:** `pnpm typecheck`, `pnpm test -- src/core/email`, `pnpm run build:cfp`

---

## Batch 1: Fix Edge Function Bugs

### Batch 1 Context
- **Goal:** Fix critical bugs in `supabase/functions/email-send/index.ts`
- **This Batch:** Fix undefined variable, auth scoping, and FROM_ALLOWLIST
- **Prev:** Build/typecheck/tests pass, but edge function has bugs discovered during audit
- **Key:** `findings.md#Critical Discrepancies`

### Batch 1 Start: Sync
- [ ] Mark completed tasks in `plan.md`
- [ ] Read `findings.md` for key discoveries

### Tasks

#### 1.1 Fix undefined `suppressed` variable
**File:** `supabase/functions/email-send/index.ts:266`  
**Problem:** `if (suppressed)` references undefined variable; `isSuppressed()` call is missing.  
**Fix:** Add `const suppressed = await isSuppressed(recipient.email)` before the check.
```typescript
// Line 258 (before the consent block ends, add):
const suppressed = await isSuppressed(recipient.email)

// Line 266 stays: if (suppressed) { ... }
```

#### 1.2 Fix `assertCanSend` async + destructuring
**File:** `supabase/functions/email-send/index.ts:35-58, 205`  
**Problem:** `assertCanSend` calls `supabase.auth.getUser(jwt)` (async) but is declared sync and called without `await`. Destructuring expects `{user}` but method returns `{data: {user}}`.  
**Fix:** Make `assertCanSend` async, fix destructuring, await the call at line 205.

#### 1.3 Replace `FROM_ALLOWLIST` with table query
**File:** `supabase/functions/email-send/index.ts:30, 223`  
**Problem:** Hardcoded allowlist `['workspace@newlight.app', 'no-reply@newlight.app']` blocks legitimate aliases.  
**Fix:** Query `email_sender_aliases` table inside the handler instead of the constant.

#### 1.4 Add edge function unit tests
**File:** `supabase/functions/email-send/test/email-send.test.ts` (new)  
Tests:
- `assertCanSend` returns `null` for invalid JWT
- `assertCanSend` returns `null` for unauthorized role  
- `rollupStatus` edge cases (all sent, all failed, mixed)
- `isSuppressed` returns `true` when unsubscribe record exists

### Batch 1 End: Compaction
- Summarize changes; flag any test failures
- Update `findings.md` if new issues discovered

---

## Batch 2: Bridge Client/Edge Function Contract

### Batch 2 Context
- **Goal:** Fix contract mismatch between client and edge function
- **This Batch:** Add `sendId` creation + orchestration in client, update types
- **Prev:** Edge function bugs fixed; client still sends wrong payload shape
- **Key:** `findings.md#Critical Discrepancies`

### Batch 2 Start: Sync
- [ ] Mark completed tasks in `plan.md`
- [ ] Read `findings.md` for key discoveries

### Tasks

#### 2.1 Update `SendEmailInput` type
**File:** `src/core/email/lib/types.ts:8-13`  
**Change:** Add `consentCategory?: EmailConsentCategory` field.

#### 2.2 Add `sendEmailWithTracking` function
**File:** `src/core/email/lib/client.ts` (append function)  
**New function:**
```typescript
export async function sendEmailWithTracking(
  input: SendEmailInput & { consentCategory: EmailConsentCategory }
): Promise<SendEmailResult & { sendId: string }>
```
1. Create `email_sends` row with `status: 'queued'`
2. Invoke edge function with `{ sendId, recipients: input.to, subject, body, from, consentCategory }`
3. Return `{ messageId, acceptedCount, sendId }`

#### 2.3 Update `EmailComposer` to use `sendEmailWithTracking`
**File:** `src/core/email/components/EmailComposer.tsx:117`  
**Change:** Replace `sendEmail({...})` with `sendEmailWithTracking({...consentCategory})`, handle returned `sendId`.

### Tests (TDD — write before implementation)

#### 2.4 Add client orchestration tests
**File:** `src/core/email/__tests__/client.test.ts` (update existing)  
- `sendEmailWithTracking` creates `email_sends` row with `status: 'queued'`
- Edge function invoked with `sendId` in body
- `consentCategory` passed through correctly

### Batch 2 End: Compaction
- Run `pnpm typecheck`
- Run `pnpm test -- src/core/email`
- Update `findings.md`

---

## Batch 3: Edge Function Reads from platform_settings

### Batch 3 Context
- **Goal:** Make edge function use settings stored in Supabase instead of only env vars
- **This Batch:** Fetch SMTP settings from `platform_settings` table
- **Prev:** Client/edge contract fixed; settings still don't reach the function
- **Key:** `findings.md#Env var gap`

### Batch 3 Start: Sync
- [ ] Mark completed tasks in `plan.md`
- [ ] Read `findings.md` for key discoveries

### Tasks

#### 3.1 Add SMTP settings fetch from platform_settings
**File:** `supabase/functions/email-send/index.ts` (inside `serve` handler, after auth)  
**Change:** After auth check, fetch `email-settings` from `platform_settings` for the current environment. Use those credentials instead of env vars directly.

#### 3.2 Add `APP_ENV` or accept env from request
**File:** `supabase/functions/email-send/index.ts:15`  
**Change:** Add `APP_ENV` env var fallback (default `'production'`) to select the right settings row.

### Batch 3 End: Compaction
- Update `findings.md`
- Flag any DB permission issues (service_role should have SELECT on `platform_settings`)

---

## Batch 4: Gmail SMTP Setup Docs + Test Email

### Batch 4 Context
- **Goal:** Document Gmail SMTP setup and fix test email flow
- **This Batch:** Update help drawers, test email uses correct contract
- **Prev:** Edge function reads settings; UI has generic docs
- **Key:** `findings.md#Gmail SMTP Requirements`

### Batch 4 Start: Sync
- [ ] Mark completed tasks in `plan.md`
- [ ] Read `findings.md` for key discoveries

### Tasks

#### 4.1 Add Gmail-specific instructions to MoreInfoDrawer
**File:** `src/core/email/settings/EmailSettingsPage.tsx:565-608`  
**Change:** Add Gmail SMTP setup section:
- Enable 2FA on Google account
- Create App Password (Google Account → Security → 2FA → App passwords)
- Use `smtp.gmail.com:465` with SSL=true
- Rate limits: ~500/day consumer, ~2000/day Workspace

#### 4.2 Add Gmail-specific errors to TroubleshootDrawer
**File:** `src/core/email/settings/EmailSettingsPage.tsx:610-658`  
**Change:** Add:
- 535-5.7.8 Username/Password not accepted → App Password required
- 530-5.7.1 Username not accepted → Must use full email address

#### 4.3 Fix test email in settings page
**File:** `src/core/email/settings/EmailSettingsPage.tsx:146-151`  
**Problem:** `handleTestEmail` calls `sendEmail({to, subject, body, from})` — needs `consentCategory`.  
**Change:** Update to use `sendEmailWithTracking` with `consentCategory: 'broadcasts'`.

### Batch 4 End: Compaction
- Verify build still passes after drawer updates

---

## Batch 5: Edge Function Deploy & Final Verification

### Batch 5 Context
- **Goal:** Deploy edge functions and verify end-to-end
- **This Batch:** Deploy edge functions, final tests
- **Prev:** All code changes complete; need deployment + integration test
- **Key:** `findings.md#Testing`

### Batch 5 Start: Sync
- [ ] Mark completed tasks in `plan.md`
- [ ] Read `findings.md` for key discoveries

### Tasks

#### 5.1 Deploy edge functions
```bash
supabase functions deploy email-send
supabase functions deploy email-unsubscribe
```

#### 5.2 Set edge function environment variables
Via Supabase Dashboard → Functions → email-send → Environment:
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=465`
- `SMTP_USER=church@example.com`
- `SMTP_PASS=<app-password>`
- `SMTP_FROM_NAME=New Light Church`

#### 5.3 Final verification
- [ ] `pnpm typecheck` — no errors
- [ ] `pnpm test -- src/core/email` — all tests pass
- [ ] `pnpm run build:cfp` — production build succeeds
- [ ] Test email send end-to-end with Gmail SMTP

### Batch 5 End: Final Compaction
- Update `findings.md` with final status
- List all changed files

---

## Risk Register
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Gmail App Password unavailable for managed accounts | Medium | High | Document OAuth2 as fallback |
| Env var vs platform_settings conflict | Low | Medium | Env vars take precedence; settings as fallback |
| `assertCanSend` async timing issues | Low | High | Add await, make async, test thoroughly |
| FROM_ALLOWLIST blocks valid senders | Low | Medium | Use `email_sender_aliases` table |

## User Actions (External)
1. **Supabase SQL Editor** — Run `20260909000000_form_builder_extensions.sql` with `supabase_admin` role
2. **Google Account** — Enable 2FA, create App Password
3. **Supabase Dashboard** — Deploy functions + set SMTP env vars
4. **Cloudflare Pages** — Set `VITE_EMAIL_TRANSPORT=noop` as Variable (already likely set)
