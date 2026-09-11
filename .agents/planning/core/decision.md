# Decision: New Light Anglican Church CRM — Base Platform

## Aliases
- Module = self-contained feature folder under src/modules/* (own routes.tsx slice; router assembly in src/core/router.tsx)
- Core = base platform under src/core/* (manifest types, registry, navigation, settings, toggles, guards, design system)
- Supabase = PostgreSQL + Auth + Realtime + Storage + Edge Fns backend
- RLS = Row Level Security
- PWA = Progressive Web App (installable/offline)

> **Database architecture SSOT:** [`core/database/decision.md`](database/decision.md) — schema, RLS, settings storage, sync tables, seeds

## What & Why
Lightweight modular web CRM for New Light Anglican Church: always-on "people" module plus independently developed, toggleable modules (groups, services, calendar). Login uses a single "email or mobile" identifier, then password, SMS code, magic link, or OAuth — phone/SMS path via touchSMS for low-tech users. Users: church admins, staff, team leaders, volunteers; household members self-viewing their own data

## Constraints
- Supabase free tier: 500MB DB, 2GB bandwidth, 50MB storage
- Modules independently developed/toggled without system-wide impact
- CF Pages free tier hosting; TypeScript strict; solo developer
- Australian child-safety data handling (people module)
- Multi-tenancy for MVP — future-proofed only
- Settings changYAGNI)
- Self-signup — nly
- Realtime for all settings — UI-critical only
- Offline editing / write queue — offline is read-only
- Native app builds — PWA only; wrappers = future option
- Enforced MFA (removed); SMS OTP is login-only, never a second factor
- Financial/giving workflows — no financial module or tables provisioned

## Assumptions
- Single church tenant (multi-tenancy gap open)
- Church-scale data fits Supabase free tier (uncertain — verify)
- Offline cache stores all people fields incl. child-safety (WWCC/SMT/SMC) — device access not gated
- "All users" = every user account (invite-only retained); unknown-phone registration not enabled
- Phone identifiers sourced from people-module mobile channel (single source of truth)
- Email/password remains the fallback when SMS delivery fails
- Church qualifies for touchSMS NFP discount (verify)

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)
1 Tech stack: Vite + React + React Router (SPA) on CF Pages → lightweight edge deploy; SSR dropped (PWA shell)
   1.1 TypeScript strict + pnpm → type safety + fast installs
   1.2 Backend on Supabase → Postgres + Auth + Realtime + Edge Fns free tier
   1.3 Deploy on CF Pages → free unlimited bandwidth + 300+ edge locations
2 Design system: Panda recipes (defineRecipe/defineSlotRecipe; hash:false) → zero-runtime typed tokens + BEM classes; single cached global.css
   2.1 Park UI (Ark UI + Panda recipes, vendored into src/core/ui) → free MIT design system, editable recipes, one semantic naming language
   2.2 Theme via CSS custom properties (light, church-brand, module-scoped) → token→semantic→pattern pipeline
   2.3 Preload Inter variable font via service worker → fast + consistent typography
   2.4 Branded auth email templates (Supabase dashboard) → brand consistency
3 Auth & login: hide Supabase Auth; host auth UI in-app → brand + UX control
   3.1 Supabase auth surface: email/password, magic links, phone OTP, OAuth Google/Entra → full coverage incl. passwordless; OAuth + magic-link retained on login screen
   3.2 Admin invites only; no self-signup → controlled church access
   3.3 Phone login (SMS OTP) for all users → passwordless path for low-tech users
       3.3.1 Single login identifier (email OR mobile) → users needn't recall registered email
       3.3.2 Password OR SMS code after identifier → per-device convenience
       3.3.3 SMS via touchSMS → NFP discount + ACMA-certified sender ID + prepaid credits
       3.3.4 SMS OTP login-only, never MFA → SMS-MFA weaker; skip for MVP
       3.3.5 Drop enforced MFA → invite-only + strong passwords + RLS suffice; TOTP/WebAuthn opt-in later
       3.3.6 Phone identifiers from people-module mobile → single phone truth
       3.3.7 Phone login via Supabase phone auth + custom send-sms hook → OTP security by Supabase; touchSMS via Edge Fn
       3.3.8 Sync people-module mobile → auth user phone → OTP resolves to existing account
       3.3.9 Block unknown phone numbers on OTP (before_user_created hook) → preserves invite-only
4 Security & data → DB-layer (RLS on all tables, soft-delete tombstones): [database/decision.md §A.2–A.3](database/decision.md)
5 Modules: self-contained in src/modules/* + core in src/core/* → clear ownership + independent dev
   5.1 People always-on; others import its API → shared types foundation
   5.2 Runtime toggle via module_config → on/off without redeploy
       5.2.1 Propagate toggles via Realtime → instant cross-client updates
       5.2.2 Validate module deps in server actions → friendly errors + complex rules
       5.2.3 Cache toggles 1min + client stores; route guards in layout → perf + security
   5.3 Typed TS manifest per module → type safety + tree-shakeable + strict TS/Zod; runtime state in module_config
   5.4 Base extension points: nav-menu + settings-schema + dashboard-widget → required hooks; detail-page tabs + event bus deferred
   5.5 Promote module component to base design system on 2nd reuse → shared lib stays lean (YAGNI)
   5.6 Central typed module registry (registry.ts) auto-wired by create-module scaffold → type safety + tree-shaking; no manual edits
   5.7 Module API = public index.ts; base types in src/core/; no server bundle → minimal ceremony; cross-module types from owning module
   5.8 React Router lazy route imports + CI bundle-size gate → edge size safe without build-time exclusion (YAGNI)
   5.9 Module-local migrations + aggregation script into supabase/migrations → [database/decision.md §D.1](database/decision.md)
   5.10 Thin glue routes.tsx per module; only src/core/router.tsx calls createBrowserRouter → single app router
6 Settings: direct DB access + shared TS types; no API layer → monorepo simplicity (DB storage → [database/decision.md §A.4](database/decision.md))
       6.1 Hybrid settings (typed core cols + per-module JSONB) → [database/decision.md §A.4.1](database/decision.md)
       6.2 module_config toggle (DB) + per-module tables → [database/decision.md §A.5](database/decision.md)
       6.3 DB-only settings + environment column → [database/decision.md §A.4.1](database/decision.md)
   6.4 Env vars for CI/staging secrets + non-settings config → dev parity without DB
   6.5 Skip settings audit trail → no regulatory need; solo maintenance
   6.6 Admin forms generated from Zod schemas + escape hatches → 80% auto; custom complex
   6.7 Realtime only UI-critical settings → toggles/branding/public config
7 Roles: 5-level platform roles (public→super_admin) → consistent across modules (storage → [database/decision.md §B.3](database/decision.md))
8 PWA: vite-plugin-pwa + Workbox → installable + offline app shell
   8.1 Cache people data read-only in IndexedDB; edits require online → offline view + RLS-safe writes
   8.2 PWA only for MVP; native wrappers (Capacitor/TWA/Tauri) future option → single codebase
9 Dev workflow: trunk-based main-only + feature flags → solo velocity
   9.1 CI GitHub Actions: check/lint/test/build/deploy → automated gates
   9.2 E2E-heavy tests (Playwright) + minimal unit → catches real regressions
   9.3 Conventional commits + Husky pre-commit hooks → consistent history + local lint gates
   9.4 ESLint + Prettier for lint/format gates → consistent code
   9.5 Local→Preview→Production via tagged releases → controlled rollouts
10 i18n: defer; English-only MVP → YAGNI; paraglide + messages field later if needed

## Findings
- Supabase phone OTP: `signInWithOtp`/`verifyOtp`; 6-digit; 60s cooldown; 1h expiry; `auth.sms.test_otp` map for dev/CI
- Native SMS providers only: Twilio, Twilio Verify, MessageBird, Vonage, TextLocal → touchSMS needs custom `send_sms` Auth Hook (Edge Fn → REST API)
- WhatsApp OTP + SMS-as-MFA are separate paid entitlements (skip); CAPTCHA + rate limits recommended
- Verify at build: touchSMS API auth scheme; NFP eligibility; free-tier hook eligibility; people-mobile → auth-phone sync timing

## Decision Gap Log
1 Multi-tenancy future-proofing → open
2 JSONB migration strategy → open
3 Read-cache sync/invalidation strategy (refresh offline cache on reconnect) → open
4 GDPR full data-erasure workflow (deleted_privacy_data → hard delete, RLS interaction) → open
5 Error-entry hard-delete criteria & enforcement → open
6 Native wrapper path (Capacitor vs TWA vs Tauri) → deferred
7 Detail-page tabs + runtime event bus scope → deferred
