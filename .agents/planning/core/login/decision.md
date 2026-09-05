# Decision: Login System — Account Nav Tile Entry Point

> Sources: core/decision.md (auth #7–9, #25, #49–59), people/decision.md (RLS, auth_user_id), core/database-setup/findings.md (auth↔people gap), core/elvanto/* (identity, mobile mirror). Skill: 01_brainstorming.

## Aliases
- Auth user = Supabase auth.users row (credentials/session)
- Person = people table row (CRM record; auth_user_id FK → auth user)
- Operator = signed-in user's person profile
- access_permission = 5-level role (public→super_admin), core #25
- RLS = Row Level Security; Magic link = passwordless email OTP

## What & Why
Login system; Account nav tile = entry point. Signed out → Log-in tile (default) → /login. Signed in → account tile (first+last initials avatar, First-name label) → /account. Auth: email/password + magic link (core #8 partial). Phone OTP + OAuth deferred. Invite-only (core #9) — invites via Supabase dashboard. App stays publicly browsable; RLS gates anon to access_permission='public'.

## Who
Admins/staff/leaders/volunteers/members (sign in for member data); anonymous visitors (public-access data only).

## Constraints
- Supabase Auth: email/password + magic link only (core #8 partial)
- In-app auth UI (core #7); invite-only (core #9)
- Join key: people.auth_user_id = auth.users.id (core #11/#58; verified queries.ts)
- 5-level roles via people.access_permission (core #25)
- RLS: anon sees access_permission='public' only; authenticated sees all non-deleted (MVP)
- PWA: session persists via supabase-js localStorage
- TS strict; Panda/Park UI; React Router 7; supabase-js installed
- Lab mock fallback (no env vars) must keep working
- access_permission defaults 'member_area' — public rows set explicitly

## Non-Goals
- Phone OTP (touchSMS) — deferred (core #49–59)
- OAuth Google/Entra — deferred (core #8)
- Admin invite UI — deferred (Supabase dashboard)
- MFA — removed (core #55)
- Route gating/redirect-to-login — public browsing (RLS is gate)
- Full per-role RLS matrix — MVP: anon=public-only, auth=all non-deleted
- Elvanto login provisioning — out of scope (Supabase owns identity)
- Email template branding — Supabase dashboard config

## Assumptions
- people.auth_user_id = join key (verified queries.ts getCurrentOperatorPermission)
- Auth users may lack people row → display falls back to user_metadata/email
- Magic link needs site_url/additional_redirect_urls incl. dev origin (5173)
- createClient default detectSessionInUrl:true handles magic-link hash
- Lab (no env vars) keeps mock session
- SettingsProvider refactored to consume AuthProvider (single source)

## Decision Log
| # | Decision | Alt | Why |
|---|----------|-----|-----|
| 1 | Dedicated src/core/auth/ (AuthProvider+useAuth) | Extend SettingsProvider | Single auth owner (core #7) |
| 2 | Join key people.auth_user_id=auth.users.id | people.id=auth uid | Schema FK exists; queries.ts uses it; closes findings gap |
| 3 | /login full-page outside AppShell | Drawer/panel | Matches /forms/:formId; no sidebar chrome |
| 4 | /account page inside AppShell | Tile menu | User chose profile page; sign out there |
| 5 | Email-only identifier this phase | Email OR mobile | Phone deferred; concept preserved |
| 6 | Password + magic-link modes | Single mode | Core #8 surface; toggle |
| 7 | RLS: anon sees access_permission='public' only | anon sees all | User requirement; access_permission gates |
| 8 | Authenticated sees all non-deleted (MVP) | Per-role matrix | Any user ≥ member_area; matrix deferred |
| 9 | AuthProvider owns session; SettingsProvider consumes | Duplicate state | Single source of truth |
| 10 | Lab mock fallback in AuthProvider | Remove mock | Styleguide runs without env vars |
| 11 | Sign out on /account | Tile menu | User chose profile page |
| 12 | Initials first+last; label First name | Full name | User requirement; fallback user_metadata/email |
| 13 | Tile: logged-in→/account; logged-out→/login | Tile menu | User chose navigate-to-profile |
| 14 | RLS refinement = new idempotent migration | Edit existing | Remote already applied; idempotent safe path |

## Approaches
### Recommended: Dedicated auth module + in-app login + RLS refinement
src/core/auth/ owns session/profile/actions; AuthProvider wraps app; SettingsProvider consumes useAuth(). /login branded page outside shell; /account profile inside. Sidebar tile switches by auth. New idempotent migration narrows anon people policy + adds authenticated policy. Smallest surface; public browsing; closes auth↔people gap.

### Alt A: Extend SettingsProvider with auth actions
Less new code; mixes auth+settings; duplicates session lifecycle. Rejected (auth = core platform concern, core #7).

### Alt B: Supabase-hosted Auth UI
Fastest; violates core #7 (brand+UX control); can't render tile states. Rejected.

### Alt C: Gate app behind login (redirect)
Simplest UX; user chose public browsing + RLS. Rejected.

## Decision Gap Log
1. Full per-role RLS visibility matrix → open
2. Admin invite UI (create auth user + link auth_user_id) → deferred
3. Phone OTP + before_user_created hook + mobile→auth sync → deferred
4. OAuth Google/Entra → deferred
5. Password change UX on /account → stretch in plan
6. Magic-link/reset email template branding → dashboard config
7. user_roles vs people.access_permission single source → open