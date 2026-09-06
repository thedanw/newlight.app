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