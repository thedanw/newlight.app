# Decision: Login System — Account Nav Tile Entry Point

> Sources: core/decision.md, people/decision.md, core/database-setup/findings.md, core/elvanto/*. Skill: 01_brainstorming.

## Aliases
- Auth user = Supabase auth.users row (credentials/session)
- Person = people table row (CRM record; auth_user_id FK → auth user)
- Operator = signed-in user's person profile
- access_permission = 5-level role (public→super_admin)
- RLS = Row Level Security; Magic link = passwordless email OTP

## What & Why
Login system; Account nav tile = entry point. Signed out → Log-in tile → /login; signed in → account tile (initials avatar, first-name label) → /account. Auth: email/password + magic link; phone OTP + OAuth deferred; invite-only via Supabase dashboard. App stays publicly browsable; RLS gates anon to access_permission='public'.

## Who
Admins/staff/leaders/volunteers/members (sign in for member data); anonymous visitors (public data only).

## Constraints
- Supabase Auth: email/password + magic link only; in-app auth UI; invite-only
- Join key: people.auth_user_id = auth.users.id
- 5-level roles via people.access_permission; RLS: anon=public only, auth=all non-deleted (MVP)
- PWA session persists via supabase-js localStorage; TS strict; Panda/Park UI; React Router 7
- Lab mock fallback (no env vars) must keep working; access_permission defaults 'member_area'

## Non-Goals
- Phone OTP, OAuth Google/Entra, MFA — deferred
- Admin invite UI — Supabase dashboard
- Route gating/redirect-to-login — public browsing (RLS is gate)
- Full per-role RLS matrix — MVP: anon=public-only, auth=all non-deleted
- Elvanto login provisioning; email template branding — out of scope

## Assumptions
- people.auth_user_id = join key (verified in queries.ts)
- Auth users may lack people row → fallback to user_metadata/email
- Magic link needs site_url/additional_redirect_urls incl. dev origin (5173)
- createClient detectSessionInUrl:true handles magic-link hash; Lab keeps mock session
- SettingsProvider refactored to consume AuthProvider (single source)

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)
1 Auth module: dedicated src/core/auth/ (AuthProvider+useAuth) → single auth owner
   1.1 AuthProvider owns session; SettingsProvider consumes → single source of truth
   1.2 Lab mock fallback lives in AuthProvider → styleguide runs without env vars
2 Join key: people.auth_user_id = auth.users.id → schema FK exists; joins → [core/database/decision.md §B.2](../core/database/decision.md); verified in queries.ts
3 Entry points: /login full-page outside AppShell → matches /forms/:formId, no sidebar chrome
   3.1 /account page inside AppShell → user chose profile page
   3.2 Sign out on /account → co-located with profile
   3.3 Tile: logged-in→/account, logged-out→/login → navigate-to-profile choice
   3.4 Avatar initials first+last; label First name → user requirement; fallback user_metadata/email
4 Identifier: email-only this phase → phone deferred, concept preserved
   4.1 Modes: password + magic-link toggle → core #8 surface
5 RLS: anon sees access_permission='public' only → schema/RLS → [core/database/decision.md §A.2.4/B.2](../core/database/decision.md); access_permission gates role
   5.1 Authenticated sees all non-deleted (MVP) → any user ≥ member_area; matrix deferred
   5.2 RLS refinement = new idempotent migration → remote already applied; safe path

## Approaches
Recommended: dedicated auth module (src/core/auth/) + in-app login + RLS refinement — smallest surface, keeps public browsing, closes auth↔people gap. Rejected: extending SettingsProvider (mixes auth+settings, duplicates session lifecycle), Supabase-hosted Auth UI (violates core #7 brand/UX control, can't render tile states), gating app behind login (user chose public browsing + RLS).

## Decision Gap Log
1. Full per-role RLS visibility matrix → open
2. Admin invite UI (create auth user + link auth_user_id) → deferred
3. Phone OTP + before_user_created hook + mobile→auth sync → deferred
4. OAuth Google/Entra → deferred
5. Password change UX on /account → stretch in plan
6. Magic-link/reset email template branding → dashboard config
7. user_roles vs people.access_permission single source → open