# Plan: Login System — Account Nav Tile Entry Point

**Goal:** Account nav tile = login entry. Signed out → Log-in tile (default) → /login. Signed in → account tile (initials avatar + First-name label) → /account. Supabase email/password + magic link; RLS gates anon to public-access data.

**Approach:** `src/core/auth/` owns session+profile+actions (AuthProvider/useAuth); SettingsProvider consumes it. /login = branded page outside AppShell; /account = profile page inside. Sidebar tile switches by auth. New idempotent migration: anon people policy → access_permission='public'; add authenticated policy. (decision #1–14)

**Branch:** `feature/login-system` (from main)

## Scope
- In: AuthProvider+useAuth; session/profile; /login (password+magic link+forgot); /account (profile+sign out+password change); sidebar tile states; RLS migration; dev redirect config; vitest tests + browser verify.
- Out: phone OTP, OAuth, invite UI, MFA, route gating, per-role RLS matrix, Elvanto login (decision Non-Goals).

## Batch Protocol (every batch)
- **Ctx:** Overall goal (above) + this batch goal.
- **Track:** Mark each task ✅ in plan.md; log results/errors in progress.md.
- **Tools:** Use --todo tool; subagents for multi-file/complex work (fresh context).
- **End:** Verify → commit → update task_plan.md → report. Next batch.

## Action Items

### Batch 1: Auth foundation
**Ctx:** Overall: login via account tile. Now: AuthProvider+useAuth; SettingsProvider refactor.
**Track:** ✅ plan.md tasks; progress.md log per task.
**Tools:** --todo tool; subagent for SettingsProvider refactor (cross-file).
- [x] 1.1 Add vitest.config.ts + `"test": "vitest run"` script
- [x] 1.2 Create src/core/auth/ (provider.tsx AuthProvider, use-auth.ts, index.ts): getSession+onAuthStateChange; isLoading; lab mock fallback (from SettingsProvider); expose signInWithPassword/signInWithOtp/signOut/resetPasswordForEmail/updatePassword
- [x] 1.3 Refactor SettingsProvider → consume useAuth() (drop own session effect)
- [x] 1.4 Wrap App.tsx with AuthProvider (above SettingsProvider)
**End:** tsc -b clean → commit `feat: add AuthProvider + useAuth, refactor SettingsProvider` → task_plan.md B1 ✅ → report. Next: B2.

### Batch 2: Auth helpers + person linkage (TDD)
**Ctx:** Overall: login via account tile. Now: name helpers + auth→person profile load.
**Track:** ✅ plan.md tasks; progress.md log per task.
**Tools:** --todo tool; subagent for AuthProvider profile-load wiring.
- [x] 2.1 Write failing test: getInitials/getDisplayName → src/core/auth/lib/name.test.ts
- [x] 2.2 Run `pnpm test` → FAIL
- [x] 2.3 Implement src/core/auth/lib/name.ts (initials first+last; display preferred_name??firstname; fallback user_metadata/email)
- [x] 2.4 Run `pnpm test` → PASS
- [x] 2.5 Add getPersonByAuthUserId(userId) → src/core/auth/lib/queries.ts (people by auth_user_id, non-deleted)
- [x] 2.6 AuthProvider loads person profile after session change (person, isProfileLoading; expose initials/displayName)
**End:** tests green → commit `feat: auth→person linkage + name helpers (TDD)` → task_plan.md B2 ✅ → report. Next: B3.

### Batch 3: Login page (TDD)
**Ctx:** Overall: login via account tile. Now: /login page (password+magic link+forgot).
**Track:** ✅ plan.md tasks; progress.md log per task.
**Tools:** --todo tool; subagent for LoginPage UI (branded, outside AppShell).
- [x] 3.1 Write failing test: identifier validation → src/core/auth/lib/validation.test.ts
- [x] 3.2 Run `pnpm test` → FAIL
- [x] 3.3 Implement src/core/auth/lib/validation.ts
- [x] 3.4 Run `pnpm test` → PASS
- [x] 3.5 Create src/core/auth/LoginPage.tsx: semantic <main> (NO Page.* slots — outside AppShell); logo+app name; email field; mode toggle Password|Magic link; forgot-password; loading/error; success → navigate (default /people)
- [x] 3.6 Add /login route OUTSIDE AppShell in src/core/router.tsx (lazy)
**End:** tests green; route renders → commit `feat: login page (email/password + magic link)` → task_plan.md B3 ✅ → report. Next: B4.

### Batch 4: Account tile + /account page (TDD)
**Ctx:** Overall: login via account tile. Now: tile states + /account profile page.
**Track:** ✅ plan.md tasks; progress.md log per task.
**Tools:** --todo tool; subagent for sidebar tile swap (layout-sensitive).
- [x] 4.1 Write failing test: getAccountTileState(auth) → 'login'|'account' → src/core/auth/lib/tile-state.test.ts
- [x] 4.2 Run `pnpm test` → FAIL
- [x] 4.3 Implement src/core/auth/lib/tile-state.ts
- [x] 4.4 Run `pnpm test` → PASS
- [x] 4.5 Update src/core/ui/sidebar.tsx footer: signed out → Log-in tile (LogIn icon, "Log in") → onAccountNavigate('/login'); signed in → account tile (Avatar initials, label=First name) → onAccountNavigate('/account'); keep FOOTER_TILES=2; add onAccountNavigate prop; thread through AppShell
- [x] 4.6 Create src/core/auth/AccountPage.tsx (inside AppShell): avatar, name, email, role, Sign out, optional Change password
- [x] 4.7 Add /account route INSIDE AppShell in src/core/router.tsx (lazy)
**End:** tests green; tile states verified → commit `feat: account tile states + /account profile page` → task_plan.md B4 ✅ → report. Next: B5.

### Batch 5: RLS refinement (migration)
**Ctx:** Overall: login via account tile. Now: anon sees public-access people only.
**Track:** ✅ plan.md tasks; progress.md log per task.
**Tools:** --todo tool; subagent for migration authoring (idempotent).
- [x] 5.1 New idempotent migration supabase/migrations/<ts>_refine_people_rls_for_auth.sql: drop+recreate anon policy `using (deleted_at is null AND access_permission = 'public')`; add authenticated SELECT policy `using (deleted_at is null)`; keep GRANTs
- [x] 5.2 Verify migration SQL (lint / db push dry-run)
- [x] 5.3 Update database.types.ts if drift (expected none)
**End:** SQL verified → commit `feat: RLS — anonymous sees public-access people only` → task_plan.md B5 ✅ → report. Next: B6.

### Batch 6: Config + polish + verification
**Ctx:** Overall: login via account tile. Now: config, lint/build, browser verify.
**Track:** ✅ plan.md tasks; progress.md log per task.
**Tools:** --todo tool; subagent for browser verification (automation techniques in repo memory).
- [x] 6.1 Update supabase/config.toml: site_url + additional_redirect_urls include http://localhost:5173
- [x] 6.2 Run `pnpm typecheck` + `pnpm lint:tokens` + `pnpm build`; fix errors
- [x] 6.3 Browser verify: logged-out tile=Log-in; /login renders; sign in (test user) → account avatar+initials+first name; /account profile; sign out → Log-in; magic link if email server available
- [x] 6.4 Run full `pnpm test` — all green
**End:** all checks green → commit `chore: config, lint, build, browser verification` → task_plan.md B6 ✅ → report. Next: Final.

### Final
- [x] **Push:** `git push origin feature/login-system`

## Validation
- [x] All vitest tests pass — `pnpm test` → 59 passed (name 11, validation 5, tile-state 3, + existing)
- [x] No lint/type errors (tsc -b, lint:tokens) — both clean
- [x] Build succeeds (pnpm build) — ✓ built in 8.23s
- [x] Browser: tile transitions, login flow, sign out verified — full flow: signed out → Log-in tile; /login renders; sign in (test@newlight.app) → /people; account tile shows initials+name; /account shows profile + Change password + Sign out; sign out → /login; tile returns to Log-in
- [x] RLS: anon query returns only access_permission='public' people — verified against local stack (`supabase start` + `scripts/rls-verify.mjs`): anon sees only public non-deleted; authenticated sees all non-deleted. Migration `20260906000000_refine_people_rls_for_auth.sql` NOT yet applied to remote DB (needs `supabase db push` with DB password or dashboard SQL editor)

## Open Questions
- [x] Dev Supabase test user with known password for browser verify — created via admin API: `test@newlight.app` / `TestPass123!` (id `b6a303c9-1dff-4a29-893a-cbbad741550c`)
- [x] Include Change-password on /account this phase? — resolved: included minimal (Change password card on /account using `updatePassword`)