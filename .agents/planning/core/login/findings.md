# Findings — Login System (Account Nav Tile Entry Point)

**Last audit:** 2026-09-06 (brainstorm). Sources: core/people/database-setup decisions, core/elvanto/*, live source scan.

## 1. Auth surface (core/decision.md)
- #7 hide Supabase Auth; in-app UI. #8 email/password+magic link+phone OTP+OAuth → **this phase: email/password+magic link**. #9 invite-only → **invites via dashboard**. #25 5-level roles. #50 single identifier → **email only this phase**. #51 password OR SMS → **password OR magic link**. #55 MFA dropped. #49–59 phone/touchSMS → **deferred**.

## 2. Auth ↔ people linkage (resolves database-setup gap)
- database-setup findings flagged Medium: auth.users.id→people.id mapping unclear; RLS uses auth.uid() vs people.id.
- **Resolution (verified):** people.auth_user_id uuid unique = join key. queries.ts getCurrentOperatorPermission: `.eq('auth_user_id', user.id)`. RLS matches auth.uid() against auth_user_id, NOT people.id.
- Tile fields: firstname, lastname, preferred_name, picture_url, access_permission, email, mobile.
- Fallback: no people row → user_metadata (first_name/last_name) or email local part.

## 3. Current app state (verified)
- Vite 7 + React 19 + TS strict + Panda 1.12 + Park UI (src/core/ui) + React Router 7 + @supabase/supabase-js@2.112.4.
- src/core/lib/supabase.ts: createClient<Database> from VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (fallback PUBLISHABLE_KEY); throws if missing.
- SettingsProvider (src/core/settings/lib/provider.tsx) ALREADY exposes supabase/session/user/isLoading via getSession()+onAuthStateChange + lab mock fallback → refactor into AuthProvider.
- App.tsx: SettingsProvider > AppTitleSync > PluginLoader > RouterProvider + Toaster.
- router.tsx: single createBrowserRouter; AppShell wraps /people,/settings,/example; public /forms/:formId outside.
- app-shell.tsx: Sidebar + Page.Root id="page-panel" + ErrorBoundary + Suspense.
- sidebar.tsx footer: static Account tile (Avatar.Fallback "Account" + label) opening Menu (Settings item) + Settings tile. FOOTER_TILES=2.
- people table (20260826002000): auth_user_id uuid unique; access_permission not null default 'member_area'; mobile; picture_url; firstname/lastname/preferred_name.
- database.types.ts PersonRow: all above; access_permission enum public|member_area|team_leaders|admin|super_admin.

## 4. RLS posture (verified)
- 20260828120000_add_rls_policies.sql: anon currently reads ALL non-deleted people (deleted_at is null) + public read on households/addresses/relationships/tags/people_tags/user_roles/module_config/platform_settings.
- 20260828120001_grant_anon_permissions.sql: GRANT SELECT anon on those tables.
- **Gap:** user wants anon → access_permission='public' only. New idempotent migration: narrow anon people policy + add authenticated SELECT policy (deleted_at is null). Repo memory: existing migrations idempotent (drop policy if exists); remote applied → new migration safe.
- Note: access_permission default 'member_area' → most people NOT public by default.

## 5. Elvanto (login-relevant)
- SYNC_CONTRACT §4: people.mobile = shadow mirror for OTP resolution (deferred phone phase).
- MIGRATION_PLAN §4: people.auth_user_id uuid unique (core #11/#58). §8 Q5: Supabase owns identity; Elvanto login out of scope.
- API_REFERENCE: people/currentUser OAuth-only (unusable this phase); username/last_login/picture Elvanto-side (shadow/read-only).
- FIELD_MAPPING_UI: picture field exists; access_permission ↔ Elvanto admin flag (promote-only pull).

## 6. Supabase config (verified)
- config.toml: [auth] enabled; site_url http://127.0.0.1:3000; additional_redirect_urls [https://127.0.0.1:3000]; email signup on; enable_confirmations false; SMS off; no hooks.
- **Gap:** dev origin http://localhost:5173 must be added to site_url/additional_redirect_urls for magic links.
- No auth-specific migrations (invite flow, hooks).

## 7. Testing setup
- vitest@4.11.1 in devDeps; NO vitest config/script, NO playwright config. One test file: src/content/plugins/elvanto-sync/sync/transforms.test.ts (external plugin, not main build).
- Plan: add vitest.config.ts + test script; unit-test pure helpers; browser verify (repo memory automation techniques).

## 8. Gotchas for plan
- SettingsProvider refactor must preserve lab mock fallback.
- Page.Body/Header are withContext slots needing Page.Root ancestor — /login OUTSIDE AppShell must use semantic <main> (like FormPublicPage).
- Sidebar footer layout (FOOTER_TILES=2, calculateLayout) — tile swap keeps 2 footer tiles.
- Avatar.Fallback name= derives initials — pass full name or compute explicitly.
- Magic link: detectSessionInUrl:true default handles hash; verify after click.
- RLS: GRANT alone insufficient — need matching policies per role (repo memory f7e8fd0).