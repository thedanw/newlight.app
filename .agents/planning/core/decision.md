# Decision: New Light Anglican Church CRM — Base Platform

## Aliases
- CRM = web app managing church people, groups, services, calendar
- Module = self-contained feature folder under src/modules/* (logic self-contained; routes = own routes.tsx slice; router assembly stays in src/core/router.tsx)
- Core = base platform under src/core/* (manifest types, registry, navigation, settings, toggles, guards, design system)
- Supabase = PostgreSQL + Auth + Realtime + Storage + Edge Fns backend
- CF Pages = Cloudflare Pages edge hosting
- RLS = Row Level Security
- Realtime = Supabase Realtime broadcast
- PWA = Progressive Web App (can be saved offline on devices)

## What & Why
Lightweight modular web CRM for New Light Anglican Church. Always-on "people" module plus independently developed, toggleable modules (groups, services, calendar). Storage on Supabase free tier. Login accepts a single "email or mobile" identifier, then password, SMS code, magic link, or OAuth — phone/SMS path via touchSMS for low-tech users.

## Who
Church admins, staff, team leaders, volunteers; household members self-viewing their own data. Phone login available to all users.

## Constraints
- Supabase free tier: 500MB DB, 2GB bandwidth, 50MB storage
- Modules independently developed/toggled without system-wide impact
- CF Pages free tier hosting; TypeScript strict; solo developer
- Australian child-safety data handling (people module)
- PWA built-in: installable + offline app shell + read-only offline data cache
- Offline is read-only — editing requires online (RLS-safe writes)
- Module structure: lib, components, server, migrations, manifest.ts, public index.ts; routes = own thin glue routes.tsx slice, assembled in src/core/router.tsx (single createBrowserRouter)
- Themes: light + church-brand via CSS custom properties; module-scoped
- Login: single identifier (email or mobile); then password or SMS code; phone path via touchSMS; OAuth/magic link retained

## Non-Goals
- Multi-tenancy (multi-church) for MVP — future-proofed only
- Settings change audit trail (YAGNI)
- Self-signup — admin invites only
- Realtime for all settings — UI-critical only
- No offline editing / write queue for MVP — offline is read-only
- No native app builds for MVP — PWA only; native wrappers = future option
- No enforced MFA (removed); SMS OTP is login-only, never a second factor

## Assumptions
- Single church tenant (multi-tenancy gap open)
- Church-scale data fits supabase free tier (uncertain — verify)
- PWA required & built-in; offline read-only cache; edits require online
- Offline cache stores all people fields incl. child-safety (WWCC/SMT/SMC) — device access not gated
- "All users" = every user account (invite-only retained); unknown-phone registration not enabled
- Phone identifiers sourced from people-module mobile channel (single source of truth)
- Email/password remains the fallback when SMS delivery fails
- Church qualifies for touchSMS NFP discount (verify)

## Decision Log: decision → Rationale
1 Use Vite + React + React Router (client SPA) on CF Pages → lightweight + edge deploy + best LLM codegen (Goal 3); SSR dropped (PWA shell)
2 Use Panda config recipes (defineRecipe/defineSlotRecipe; hash:false) → zero-runtime typed tokens + BEM classes visible in compiled CSS; single cached global.css
3 Use Park UI (Ark UI headless + Panda BEM recipes, CLI-vendored into src/core/ui) → free MIT design system, source-owned editable recipes, one semantic naming language app-wide (Goals 1-2)
4 Use TypeScript strict + pnpm → type safety + fast installs
5 Run backend on Supabase → PostgreSQL + Auth + Realtime + Edge Fns free tier
6 Deploy on CF Pages → free unlimited bandwidth + 300+ edge locations
7 Hide Supabase Auth; host auth UI in-app → brand + UX control
8 Use Supabase auth surface: email/password, magic links, phone OTP, OAuth Google/Entra → full coverage incl. passwordless
9 Restrict to admin invites; no self-signup → controlled church access
11 Enable RLS on all tables via auth.uid() → DB-layer security
12 Keep self-contained modules in src/modules/* + core in src/core/* → clear ownership + independent dev
13 Keep people always-on; others import its API → shared types foundation
14 Toggle modules runtime via module_config → on/off without redeploy
15 Propagate toggles via Realtime → instant cross-client updates
16 Validate module deps in server actions → friendly errors + complex rules
17 Cache toggles 1min + client stores; route guards in layout → perf + security
18 Use env vars for CI/staging secrets + non-settings config → dev parity without DB (settings stay DB-only per #23)
19 Use direct DB access + shared TS types; no API layer → monorepo simplicity
20 Store settings hybrid: typed core columns + per-module JSONB → type safety + flexibility
21 Own settings per module (module_config + tables + platform_settings) → module autonomy
22 Skip settings audit trail → no regulatory need; solo maintenance
23 Keep settings DB-only with environment column → no env var drift
24 Generate admin forms from Zod schemas + escape hatches → 80% auto; custom complex
25 Use 5-level platform roles (public→super_admin) → consistent across modules
26 Soft-delete core entities only (deleted_at); hard delete only for error entries → legal/child-safety + FK integrity
27 Realtime only UI-critical settings → toggles/branding/public config
28 Dev trunk-based main-only + feature flags → solo velocity
29 CI GitHub Actions: check/lint/test/build/deploy → automated gates
30 Test E2E-heavy (Playwright) + minimal unit → catches real regressions
31 Use conventional commits + Husky pre-commit hooks → consistent history + local lint gates
32 Build PWA via vite-plugin-pwa + Workbox → installable + offline app shell
33 Cache people data read-only in IndexedDB; edits require online → offline view + RLS-safe writes
34 Ship PWA only for MVP; native wrappers (Capacitor/TWA/Tauri) future option → single codebase
35 Theme via CSS custom properties (light, church-brand, module-scoped) → token→semantic→pattern pipeline
36 Preload Inter variable font via service worker (Workbox) → fast + consistent typography
37 Use custom branded auth email templates (Supabase dashboard) → brand consistency
38 Ship Local→Preview→Production via tagged releases → controlled rollouts
39 Use ESLint + Prettier for lint/format gates → consistent code
40 Use typed TypeScript manifest per module → type safety + tree-shakeable + strict TS/Zod integration (module static contract; runtime state stays in module_config #14)
41 Base provides nav-menu + settings-schema + dashboard-widget extension points → required integration hooks; detail-page tabs + runtime event bus deferred
42 Promote module component to base design system on 2nd reuse → shared lib stays lean (YAGNI)
43 Use central typed module registry (registry.ts) auto-wired by create-module scaffold → type safety + tree-shaking; no manual registry edits
44 Module API = public index.ts per module; base types in src/core/; no server bundle (client SPA) → minimal ceremony, cross-module types from owning module (#13/#19)
45 Rely on React Router lazy route imports + CI bundle-size gate → edge size stays safe without build-time exclusion (YAGNI)
46 Ship module migrations module-local + aggregation script into supabase/migrations → self-contained modules + native Supabase CLI
47 Defer i18n; English-only MVP → YAGNI; add paraglide + messages field later if needed
48 Use thin glue routes.tsx slice per module; only src/core/router.tsx calls createBrowserRouter → single app router; no /routes folder, no per-module router
49 Enable phone login (SMS OTP) for all users → passwordless path for low-tech users; no per-user toggle
50 Use single login identifier (email OR mobile) → users needn't recall registered email
51 Offer password OR SMS code after identifier → user picks per-device convenience
52 Retain Supabase OAuth + magic-link on login screen → full auth surface (#8) preserved
53 Send SMS via touchSMS gateway → NFP (church) discount + ACMA-certified sender ID + prepaid credits
54 Treat SMS OTP as login-only, never MFA → SMS-MFA weaker; skip for MVP
55 Drop enforced MFA (supersedes removed #10) → invite-only + strong passwords + RLS suffice; Supabase TOTP/WebAuthn opt-in later
56 Source phone identifiers from people-module mobile → single phone truth, no duplicate capture
57 Implement phone login via Supabase phone auth + custom send-sms hook → OTP security handled by Supabase; touchSMS via Edge Fn
58 Sync people-module mobile → auth user phone → OTP resolves to existing account (single identity)
59 Block unknown phone numbers on OTP (before_user_created hook) → preserves invite-only (#9); no phone self-signup

## Findings (verified)
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
