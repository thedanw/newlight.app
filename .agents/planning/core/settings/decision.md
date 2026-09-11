# Decision: App Settings Dashboard

App-wide Settings dashboard (iOS-settings-style page) consolidates BrandForm drawer + 4 Church Information fields (Church Name, App Name, Church Email, Website). Sidebar `brand` tile → `settings` tile. First step toward settings-schema extension point (core #41). Super-admins in final app; always visible in lab. Key constraints: core concern, ui-ux 10.4/10.6/10.7/10.9/10.12, live re-theme + logo save-on-apply, locked `@/core/ui` barrel, no new deps, module-system route convention, extensibility API, deep-linkable sub-pages. Non-goals: auth gating, other sub-sections, realtime broadcast, test runner. Assumptions: BrandForm drawer superseded (⚠️), Account menu rename to Settings (⚠️), page not drawer, Church Info fields persist to `platform_settings`, Supabase client available (lab fallback).

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)

1. Settings dashboard in `src/core/settings/` (not `src/modules/settings/`) → core platform concern; available to all modules
   1.1 Route via `src/core/routes.tsx` → `createBrowserRouter` in router.tsx only; module-system convention
   1.2 Route = `/settings/:section?` (optional section param) → deep linking for module sub-pages (`/settings/groups`, `/settings/services`)
2. Sidebar `brand` tile → `settings` tile (label + icon), navigates to `/settings` → user requirement; app-wide surface
3. BrandForm content → **Church Information** sub-section + 4 new fields (Church Name, App Name, Church Email, Website) → user requirement; theme knobs splittable later without breaking section pattern
4. Live re-theme (5 knobs) + logo **save-on-apply** → ui-ux 10.9, decision #45; not persist-on-every-change
5. Wire `platform_settings` persistence now → core #20/#21/#23 + ui-ux 10.4/10.7; DB schema → [core/database/decision.md §A.4.1](../core/database/decision.md); not local-only
   5.1 `SettingsProvider` context in `src/core/settings/` for supabase client + session → lab needs fallback; final uses real auth; decouples settings page
   5.2 Logo → Supabase Storage public bucket (`brand-assets`) on Apply → favicon/login need public URL pre-auth; public bucket + CDN; super-admin writes, public reads
6. Core exports `registerSettingsSection(section)` + `registerSettingsPage(page)` API → core #41 settings-schema extension point; modules self-register at startup
   6.1 Section registry = typed array; page registry = map by section ID → single source of truth for sidebar/nav; enables module discovery
7. `platform_settings` = single `app-settings` key, nested JSON → atomic writes; simple Realtime payload; matches ui-ux 10.4 (not separate keys / flat keys)
   7.1 Supabase Storage `brand-assets` bucket + RLS → schema → [core/database/decision.md §A.4.3](../core/database/decision.md); reproducible via migration
8. Remove styleguide `BrandForm.tsx` + drawer wiring after migration → single source of truth; avoids drift (not parallel coexistence)
9. Account menu "Brand settings" → "Settings" → consistency with new tile
10. Verification: `pnpm typecheck` + `pnpm lint` + `pnpm build` + manual browser check → no test runner installed; Playwright E2E is separate future batch
11. Church Information Apply/Cancel via shell-owned action footer → `useRegisterPageActions` (ui-ux 17); no per-page `Page.Footer`

## Approaches Considered

**Recommended:** Full page at `/settings` with sub-section cards — iOS-settings-style grouped layout (`PagePanel` + `PageHeader` breadcrumb + scrollable card list). First card = Church Information. Typed registry seeds settings-schema extension point for future sections.
- Drawer rejected: cannot scale to multi-section dashboard.
- Full module (`src/modules/settings/`) rejected: premature; settings is core platform concern; modules depend on it.

## Open Gaps

- `brand-assets` bucket creation + RLS (not yet in migrations).
- Lab auth fallback: localStorage vs. mock provider vs. anonymous session.