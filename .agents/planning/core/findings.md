# Findings: Authentication — SMS / Phone Login Option

## Goal context
Add an optional phone + SMS-code login path alongside the existing email/password + magic link + OAuth auth (core decision #8). Login uses a single "email or mobile" identifier, then password OR SMS code; phone path via touchSMS, available to all users, very low volume (~a few users/month). MFA-for-admin (core #10) removed. Brainstorm session per `01_brainstorming` skill; decisions logged in `core/decision.md`.

## Current auth posture (from core decision.md)
- #7 Hide Supabase Auth UI; host auth UI in-app (brand/UX control)
- #8 Auth via Supabase surface: email/password, magic links, phone OTP, OAuth Google/Entra
- #9 Admin invites only; no self-signup (phone login available to all existing accounts)
- #10 REMOVED — no enforced MFA for admin roles
- Phone login: single identifier (email or mobile) → password OR SMS code (touchSMS)
- RLS on all tables via auth.uid() (#11); people module stores contact channels incl. `phone_type` = mobile (people decision #3)

## Supabase phone OTP (verified from docs)
- Native phone login: `signInWithOtp({ phone })` sends 6-digit PIN; `verifyOtp({ phone, token, type: 'sms' })` returns session
- Defaults: one OTP request per 60s; OTP expires after 1 hour; 6-digit code
- Native SMS providers ONLY: Twilio, Twilio Verify, MessageBird, Vonage, TextLocal — **NOT** touchSMS / mobilemessage
- **Custom SMS provider via Auth Hook** (`send_sms` / Send SMS Message hook) → Edge Function that calls any REST API. This is the integration path for touchSMS / mobilemessage
- WhatsApp OTP channel only available via Twilio/Twilio Verify (not relevant here)
- SMS-as-MFA (`mfa_phone`) is a separate entitlement (paid); SMS-as-passwordless-login is the standard OTP flow
- Docs recommend CAPTCHA + rate limits to control SMS cost/abuse
- Test OTP map (`auth.sms.test_otp`) available for dev/CI

## Provider research (AUD, both Australian-owned)
| | touchSMS.com.au | mobilemessage.com.au |
|---|---|---|
| Price | 5c / SMS (1 credit) | 3c / SMS regular (1.6c first purchase, 500+ msgs) |
| Minimums | 400 credits = $20 | 500 msgs |
| Fees | None (no setup/monthly) | None; free dedicated number after first purchase |
| Credits | Never expire | Never expire |
| Extras | NFP (church) discounts; ACMA-certified telco, SMS Sender ID Register; 10-credit free trial | 24/7 Melbourne support; free dedicated number; SLA |
| API | REST API (free) | REST API (free) |
| Caveat | — | Dedicated numbers cannot receive auth codes (only relevant if using inbound) |

Cost at expected volume (~a few SMS/month): effectively negligible (<$1/month) with either provider.

## Key decision gaps (resolved)
1. ✅ Primary purpose — passwordless phone login for low-tech users (NOT an MFA factor)
2. ✅ Who can use it — all user accounts; no per-user toggle (invite-only retained; unknown-number behaviour still open)
3. ✅ Provider — touchSMS (NFP discount, ACMA-certified, prepaid credits)
4. ✅ MFA — enforced admin MFA removed (#10 deleted); SMS OTP is login-only
5. ✅ Integration approach — Supabase built-in phone auth + custom send-sms hook (touchSMS via Edge Function); unknown numbers blocked via `before_user_created` hook
6. ✅ Fallback — email/password remains if SMS fails
7. ✅ Privacy — OTP sent at user request; APP-compliant phone handling

## Open items to verify later
- touchSMS exact API auth scheme (API key vs token) — confirm at build time
- Whether church is a registered NFP (qualifies for touchSMS NFP discount)
- Supabase free-tier eligibility for phone auth + custom `send_sms` + `before_user_created` hooks (verify at implementation)
- Sync mechanism: people-module mobile → auth user phone (when/how to push updates)
