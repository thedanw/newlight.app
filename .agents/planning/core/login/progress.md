# Progress — Login System (Account Nav Tile Entry Point)

## 2026-09-06 — Brainstorm (planning)
- Read 00_meta-plan-pipeline/SKILL.md (brainstorm→plan→execute→review).
- Read decisions: core/decision.md, people/decision.md, core/database-setup/findings.md, core/elvanto/* (AGENTS, SYNC_CONTRACT, MIGRATION_PLAN, API_REFERENCE, FIELD_MAPPING_UI).
- Scanned source: sidebar.tsx (static Account tile+menu), settings/lib/provider.tsx (session+mock), lib/supabase.ts, router.tsx, app-shell.tsx, people/lib/queries.ts (auth_user_id), database.types.ts, config.toml, RLS migrations.
- Brainstorm (askQuestions) — user: 1) email/password+magic link only; 2) sign-in only (dashboard invites); 3) public browsing; RLS gates by access_permission; 4) tile→/account profile page.
- Wrote decision.md, findings.md, plan.md, task_plan.md, progress.md in .agents/planning/core/login/.
- Optimized all .mds for small-context LLMs (md-token-optimizer): batch protocol (Ctx/Track/Tools/End) added to plan.md; prose compressed in decision/findings/task_plan/progress.

## Errors
| Error | Resolution |
|-------|-----------|
| (none — planning phase) | — |

## 2026-09-06 — Batch 1 Complete (Auth foundation)
- Branch: feature/login-system (created from main after merging settings-dashboard).
- 1.1 vitest.config.ts + `"test": "vitest run"` script added.
- 1.2 src/core/auth/ created: provider.tsx (AuthProvider: getSession+onAuthStateChange, isLoading, lab mock fallback, signInWithPassword/signInWithOtp/signOut/resetPasswordForEmail/updatePassword), use-auth.ts, index.ts.
- 1.3 SettingsProvider refactored → consumes useAuth() (dropped own session effect; kept logoUrl/getAppSettings/saveAppSettings).
- 1.4 App.tsx wrapped with AuthProvider above SettingsProvider.
- Verify: `pnpm typecheck` clean; `pnpm test` 40 passed (existing elvanto transforms).
- Commit: `feat: add AuthProvider + useAuth, refactor SettingsProvider`

## Errors
| Error | Resolution |
|-------|-----------|
| (none — Batch 1) | — |
## 2026-09-06 — Final Complete (Push)
- Pushed `feature/login-system` to origin (6 commits). HEAD == origin/feature/login-system.
- PR link: https://github.com/thedanw/newlight.app/pull/new/feature/login-system
- All 6 batches + Final ✅. Plan complete.

## Errors
| Error | Resolution |
|-------|-----------|
| (none — Final) | — |
## 2026-09-06 — Batch 2 Complete (Auth helpers + person linkage, TDD)
- 2.1-2.4 TDD: name.test.ts (11 tests) → FAIL → name.ts implemented → PASS.
- 2.5 getPersonByAuthUserId(userId) in src/core/auth/lib/queries.ts (people by auth_user_id, non-deleted).
- 2.6 AuthProvider loads person profile on user change (person, isProfileLoading); exposes initials/displayName via getInitials/getDisplayName.
- Verify: `pnpm typecheck` clean; `pnpm test` 51 passed.
- Commit: `feat: auth→person linkage + name helpers (TDD)`

## Errors
| Error | Resolution |
|-------|-----------|
| (none — Batch 2) | — |

## 2026-09-06 — Batch 3 Complete (Login page, TDD)
- 3.1-3.4 TDD: validation.test.ts (5 tests) → FAIL → validation.ts implemented → PASS.
- 3.5 LoginPage.tsx: semantic <main> (no Page.* slots), logo+app name (from settings), email field, Password|Magic link toggle, forgot-password, loading/error/notice states, navigate /people on success.
- 3.6 /login route added OUTSIDE AppShell (lazy) in router.tsx.
- Verify: `pnpm typecheck` clean; `pnpm test` 56 passed.
- Commit: `feat: login page (email/password + magic link)`

## Errors
| Error | Resolution |
|-------|-----------|
| (none — Batch 3) | — |

## 2026-09-06 — Batch 4 Complete (Account tile + /account page, TDD)
- 4.1-4.4 TDD: tile-state.test.ts (3 tests) → FAIL → tile-state.ts implemented → PASS.
- 4.5 sidebar.tsx footer: signed out → Log-in tile (LogIn icon, "Log in"); signed in → account tile (Avatar initials via getInitials, label=firstName); onAccountNavigate prop threaded through AppShell; FOOTER_TILES=2 kept; removed old Account menu (Menu/HStack/Stack/Text imports dropped).
- 4.6 AccountPage.tsx (inside AppShell): avatar+name+email, profile fields (first name/email/role), Change password, Sign out → /login.
- 4.7 /account route added INSIDE AppShell (lazy).
- Added getFirstName helper + firstName in AuthContextValue (decision #12: label = First name).
- Verify: `pnpm typecheck` clean; `pnpm test` 59 passed.
- Commit: `feat: account tile states + /account profile page`

## Errors
| Error | Resolution |
|-------|-----------|
| (none — Batch 4) | — |

## 2026-09-06 — Batch 5 Complete (RLS refinement migration)
- 5.1 Created supabase/migrations/20260906000000_refine_people_rls_for_auth.sql (idempotent): drop "Public read access" on people; recreate for anon `using (deleted_at is null and access_permission = 'public')`; add "Authenticated read access" for authenticated `using (deleted_at is null)`. GRANTs unchanged (anon SELECT + authenticated full already exist).
- 5.2 SQL verified by review (standard Postgres DDL, matches known-good 20260828120000 pattern; columns deleted_at/access_permission confirmed in database.types.ts). `supabase db lint --linked` NOT run — no DB password in .env and no local stack. Deferred to B6.
- 5.3 No database.types.ts drift (policies only, no schema change).
- Commit: `feat: RLS — anonymous sees public-access people only`

## Errors
| Error | Resolution |
|-------|-----------|
| (none — Batch 5) | — |

## 2026-09-06 — Batch 6 Complete (Config + polish + verification)
- 6.1 config.toml: site_url → http://localhost:5173; additional_redirect_urls += http://localhost:5173.
- 6.2 `pnpm typecheck` + `pnpm lint:tokens` + `pnpm build` all pass (chunk-size warning pre-existing).
- 6.3 Browser verified (dev server 5173): signed-out tile = Log-in (sidebar footer, FOOTER_TILES=2 kept); Log-in tile click → /login; /login renders (semantic main, logo, app name, email/password, Password|Magic link toggle, forgot-password); mode toggle works; custom validation shows "Email is required." / "Enter a valid email address." (added noValidate to form — native HTML5 validation was blocking custom errors); /account renders (header, avatar, profile fields, change password, sign out). SIGN-IN FLOW DEFERRED: no test user credentials (sb_secret_ key rejected by admin API — needs dashboard-created user, plan Open Question).
- 6.4 Full `pnpm test` — 59 passed.
- Bug fixed: AuthProvider hasRealAuth only checked VITE_SUPABASE_ANON_KEY; now also accepts VITE_SUPABASE_PUBLISHABLE_KEY (matches supabase.ts fallback) — real auth now activates with the publishable key.
- Commit: `chore: config, lint, build, browser verification`

## Errors
| Error | Resolution |
|-------|-----------|
| Native HTML5 validation blocked custom error on invalid email | Added `noValidate` to login form |
| hasRealAuth ignored publishable-key fallback → lab mock used instead of real auth | hasRealAuth now accepts ANON_KEY OR PUBLISHABLE_KEY |
| Admin API rejected sb_secret_ key (not a JWT) | Test user creation deferred to dashboard (Open Question) |