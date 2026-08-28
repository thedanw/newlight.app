# Decision: App Settings Dashboard

## What & Why

Build an app-wide **Settings dashboard** (iOS-settings-style page with sub-sections) that consolidates the brand/theme surface currently living in the styleguide `BrandForm` drawer, plus new **Church Information** fields (Church Name, App Name, Church Email, Website). The sidebar's `brand` nav-tile is replaced by a `settings` nav-tile that navigates to the dashboard.

This is the first concrete step toward the planned settings module (core #41: base provides a `settings-schema` extension point; ui-ux 10.4/10.6: the customizer/brand surface ports from the styleguide into a settings module).

## Who

- **Super-admins** configuring the app's identity + appearance (final app, gated per ui-ux 10.12).
- **Lab users** — always visible, no auth gate (lab has no auth, ui-ux 4.1).

## Constraints

- Settings is a **core** concern (planning README: "Settings and module registry" under Core platform; core #41).
- Follow ui-ux decisions: 10.4 (settings module + `platform_settings`), 10.6 (brand = whole-app surface), 10.7 (logo = asset URL), 10.9 (live re-theme = 5 knobs only; logo applies on SAVE), 10.12 (super-admin gate in final app), 10.13 (Style Guide link NOT a sidebar tile), 10.14 (sidebar style dropdown).
- Preserve the live whole-shell re-theme behavior (writes `<html>` data-* attrs via `switchTheme`/`applyFont`).
- Preserve logo **save-on-apply** semantics (decision #45) and object-URL lifecycle.
- Use only the locked `@/core/ui` barrel + `styled-system` primitives (fail-closed, recipe-only CSS).
- No new runtime dependencies.
- Route wiring follows the module-system convention: core owns `src/core/routes.tsx`; only `src/core/router.tsx` calls `createBrowserRouter`.
- **Module extensibility**: Settings dashboard must expose a registration API so modules can declare their own settings sub-pages/sections (core #41 `settings-schema` extension point).
- **Deep linking**: Any module must be able to navigate directly to its own settings sub-page via a stable URL (e.g., `/settings/groups`, `/settings/services`).

## Non-Goals

- **Auth gating** (lab has no auth).
- **Other sub-sections** (Appearance split, Notifications, Modules, etc.) — the dashboard is structured to add them later via the settings-schema extension point.
- **Realtime broadcast** of settings (core #27) — deferred with persistence.
- **Adding a unit-test runner** (none exists; verification uses existing gates — see plan.md Validation).

## Assumptions

- The styleguide `BrandForm` drawer is fully superseded by the settings dashboard and is removed (file + drawer wiring) after migration. ⚠️
- The Account menu's "Brand settings" item is renamed to "Settings" for consistency with the new tile. ⚠️
- The settings dashboard is a **page** (`/settings`), not a drawer — "dashboard" implies a page with sub-sections.
- The 4 new Church Information fields (Church Name, App Name, Church Email, Website) are persisted to `platform_settings` alongside theme/logo.
- Supabase client + auth context available in the settings page (lab has no auth yet — will read from localStorage/fallback for lab).

## Decision Log

| # | Decision | Alternatives | Rationale |
|---|----------|--------------|-----------|
| 1 | Settings dashboard lives in `src/core/settings/` | `src/modules/settings/` | Settings is a core platform concern (README, core #41); keeps it available to all modules |
| 2 | Sidebar `brand` tile → `settings` tile (label "Settings", `Settings` icon), navigates to `/settings` | Keep "Brand" label | User requirement; "settings" is the app-wide surface |
| 3 | BrandForm content migrates into a **Church Information** sub-section + 4 new fields (Church Name, App Name, Church Email, Website) | Split theme knobs into a separate "Appearance" section | User requirement; theme knobs can be split later without breaking the section pattern |
| 4 | Settings route added via `src/core/routes.tsx` (core route slice) wired into `src/core/router.tsx` | Inline route in router.tsx | Module-system convention (core owns `src/core/routes.tsx`) |
| 5 | Keep live re-theme (5 knobs) + logo save-on-apply | Persist on every change | ui-ux 10.9, decision #45 |
| 6 | Wire `platform_settings` persistence now | Local-only this pass | Core #20/#21/#23 + ui-ux 10.4/10.7 require DB-backed settings; Supabase client + auth context needed |
| 10 | Create `SettingsProvider` context in `src/core/settings/` for supabase client + session | Direct import or existing auth context | Lab needs mock/fallback; final app uses real auth; keeps settings page decoupled |
| 11 | Logo → Supabase Storage public bucket (brand-assets) on Apply | Base64 or local object URL | Favicon/login page need public URL pre-auth; public bucket + CDN; super-admin writes, public reads |
| 12 | Settings route = `/settings/:section?` with optional section param | Flat `/settings` only | Deep linking: modules navigate to `/settings/groups`, `/settings/services` etc. |
| 13 | Core exports `registerSettingsSection(section)` + `registerSettingsPage(page)` API | Modules import internal components | Core #41 `settings-schema` extension point; modules self-register at startup |
| 14 | Section registry = typed array in `settings-schema.ts`; page registry = map by section ID | Ad-hoc imports | Single source of truth for sidebar/nav; enables module discovery |
| 15 | `platform_settings` uses single `app-settings` key with nested JSON | Separate keys per section / flat keys | Core #20 hybrid model; atomic writes; simple Realtime payload; matches ui-ux 10.4 |
| 16 | Add Supabase Storage `brand-assets` bucket migration + RLS (public read, super_admin write) | Manual dashboard / defer | ui-ux 10.7 requires Storage URL; reproducible via migration |
| 7 | Remove styleguide `BrandForm.tsx` + drawer wiring after migration | Keep both in parallel | Single source of truth; avoids drift |
| 8 | Account menu "Brand settings" → "Settings" | Keep as-is | Consistency with the new tile |
| 9 | Verification via `pnpm typecheck` + `pnpm lint` + `pnpm build` + manual browser check | Add Vitest/Playwright now | No test runner installed; CI gates are ESLint + tsc + bundle (module-system memory); Playwright E2E is a separate future batch |

## Approaches Considered

### Recommended: Full settings page at `/settings` with sub-section cards
iOS-settings-style grouped page: `PagePanel` + `PageHeader` (breadcrumb "Settings") + a scrollable list of sub-section cards. First sub-section = **Church Information** (migrated BrandForm + 4 new fields). The section registry is a typed array so future sections (Appearance, Notifications, Modules) slot in without structural change — this is the seed of the core #41 `settings-schema` extension point.

### Alternative: Keep the drawer, just rename "Brand" → "Settings"
Minimal change, but a drawer cannot scale to a dashboard with multiple sub-sections and doesn't match the "settings dashboard" requirement.

### Alternative: Settings as a full module (`src/modules/settings/`)
Cleaner module boundary, but settings is a core platform concern (README) and modules depend on it; core #41 places the settings-schema extension point in the base. Deferred until a module genuinely needs to own settings.

## Decision Gap Log

| Gap | Status |
|-----|--------|
| Supabase Storage `brand-assets` bucket creation + RLS policies (not in migrations yet) | open |
| Lab auth fallback: localStorage vs. mock provider vs. anonymous session | open |