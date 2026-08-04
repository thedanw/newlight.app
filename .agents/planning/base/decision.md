# Decision: New Light Anglican Church CRM — Base Platform

## Aliases
- CRM = web app managing church people, groups, services, calendar
- Module = self-contained feature area under src/lib/modules/*
- Supabase = PostgreSQL + Auth + Realtime + Storage + Edge Fns backend
- CF Pages = Cloudflare Pages edge hosting
- RLS = Row Level Security
- Realtime = Supabase Realtime broadcast

## What & Why
Lightweight modular web CRM for New Light Anglican Church. Always-on "people" module plus independently developed, toggleable modules (groups, services, calendar). Storage on Supabase free tier.

## Who
Church admins, staff, team leaders, volunteers; household members self-viewing their own data.

## Constraints
- Supabase free tier: 500MB DB, 2GB bandwidth, 50MB storage
- Modules independently developed/toggled without system-wide impact
- CF Pages free tier hosting; TypeScript strict; solo developer
- Australian child-safety data handling (people module)
- PWA built-in: installable + offline app shell + read-only offline data cache
- Offline is read-only — editing requires online (RLS-safe writes)
- Module structure: routes, components, server API, types, config, public index.ts exports
- Themes: light + church-brand via CSS custom properties; module-scoped

## Non-Goals
- Multi-tenancy (multi-church) for MVP — future-proofed only
- Settings change audit trail (YAGNI)
- Self-signup — admin invites only
- Realtime for all settings — UI-critical only
- No offline editing / write queue for MVP — offline is read-only
- No native app builds for MVP — PWA only; native wrappers = future option

## Assumptions
- Single church tenant (multi-tenancy gap open)
- Church-scale data fits free tier (uncertain — verify)
- PWA required & built-in; offline read-only cache; edits require online
- Offline cache stores all people fields incl. child-safety (WWCC/SMT/SMC) — device access not gated

## Decision Log: decision → Rationale
1 Use SvelteKit + adapter-cloudflare → SSR + lightweight + edge deploy on CF Pages
2 Use Panda CSS → zero-runtime typed tokens; single cached global.css for theming
3 Use shadcn-svelte + Bits UI → ownable Radix primitives + native Svelte headless
4 Use TypeScript strict + pnpm → type safety + fast installs
5 Run backend on Supabase → PostgreSQL + Auth + Realtime + Edge Fns free tier
6 Deploy on CF Pages → free unlimited bandwidth + 300+ edge locations
7 Hide Supabase Auth; host auth UI in-app → brand + UX control
8 Auth via email/password + magic links; OAuth Google/Entra → staff + volunteer coverage
9 Restrict to admin invites; no self-signup → controlled church access
10 Require MFA for admin roles → protect privileged accounts
11 Enable RLS on all tables via auth.uid() → DB-layer security
12 Organize modules as src/lib/modules/* → native routing + independent dev
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
32 Build PWA in via @vite-pwa/sveltekit + Workbox → installable + offline app shell
33 Cache people data read-only in IndexedDB; edits require online → offline view + RLS-safe writes
34 Ship PWA only for MVP; native wrappers (Capacitor/TWA/Tauri) future option → single codebase
35 Theme via CSS custom properties (light, church-brand, module-scoped) → token→semantic→pattern pipeline
36 Preload Inter variable font via service worker (Workbox) → fast + consistent typography
37 Use custom branded auth email templates (Supabase dashboard) → brand consistency
38 Ship Local→Preview→Production via tagged releases → controlled rollouts
39 Use ESLint + Prettier for lint/format gates → consistent code

## Decision Gap Log
1 Multi-tenancy future-proofing → open
2 JSONB migration strategy → open
3 Read-cache sync/invalidation strategy (refresh offline cache on reconnect) → open
4 GDPR full data-erasure workflow (deleted_privacy_data → hard delete, RLS interaction) → open
5 Error-entry hard-delete criteria & enforcement → open
6 Native wrapper path (Capacitor vs TWA vs Tauri) → deferred
