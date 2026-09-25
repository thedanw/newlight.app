# Decision: App Settings Dashboard

App-wide Settings dashboard (iOS-settings-style page) consolidates BrandForm drawer + 4 Church Information fields (Church Name, App Name, Church Email, Website). Sidebar `brand` tile → `settings` tile. First step toward settings-schema extension point (core #41). Super-admins in final app; always visible in lab. Key constraints: core concern, ui-ux 10.4/10.6/10.7/10.9/10.12, live re-theme + logo save-on-apply, locked `@/core/ui` barrel, no new deps, module-system route convention, extensibility API, deep-linkable sub-pages. Non-goals: auth gating, other sub-sections, realtime broadcast, test runner. Assumptions: BrandForm drawer superseded (⚠️), Account menu rename to Settings (⚠️), page not drawer, Church Info fields persist to `platform_settings`, Supabase client available (lab fallback).

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)

1. Settings dashboard in `src/core/settings/` (not `src/modules/settings/`) → core platform concern; available to all modules
   1.1 Route via `src/core/routes.tsx` → `createBrowserRouter` in router.tsx only; module-system convention
   1.2 Route = `/settings/:section?/:page?` (optional params) → deep linking for module sub-pages (`/settings/people`, `/settings/integrations/elvanto-sync`)
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
12. Layout = iOS split shell OWNED by the route wrapper `dashboard.tsx` (2026-09): the dashboard route (no `:section`) renders the card list inside a standard scaffold; a selected section/page renders `SettingsSplitShell`, which owns `Page.Main`/`Page.Header`/`Page.Body` and hosts the registered component as content → hosted pages stay scaffold-free; one owner, no nested scaffolds
   12.1 `Page.Body` renders padding-free (`p: 0`) because it hosts a two-column flex row; each column owns its padding (`{ base: '0', lg: '6' }`) → L1 gutter alignment restored inside columns, body stays a neutral host
   12.2 Shell heading level is conditional (`level={hasSelection ? 1 : 0}`) → level 1 renders back-chevron + breadcrumb title on mobile sub-pages (established pattern) without per-page scaffolds; icon + title resolve page > section > Settings
   12.3 `lg+`: 280px left nav column (`as="nav"`, `gray.subtle.bg`) persists and the selected page scrolls in the right panel; `base`: list collapses, selected page fills the viewport → deep-linkable, no panel-stack machinery needed
   12.4 Sections must declare an `icon` (module manifest icon; `SlidersHorizontal` fallback) → card list and shell heading share one source
   12.5 lint-pages recognizes hosted settings pages structurally — any file under a `settings/` directory must render zero `Page.*` slots (content-only), while the shell `dashboard.tsx` itself stays guarded → every future settings page is covered with no allowlist upkeep
   12.6 Card list is grouped (General Settings → Modules) via `SettingsSection.group` + `getSettingsSectionGroups()`; core registrations declare `group: 'general'`, module/plugin sections default to `modules` → grouped iOS list with no view-side section knowledge
   12.7 The former single "Church Information" section splits into `general` (church name/email/website/address) + `appearance` (app name, logo, theme knobs; `Palette` icon), both hosted content-only and sharing `useAppSettingsForm()` in `lib/app-settings.ts` → user request 2026-09; because `app-settings` is a single upserted JSON value, every page re-saves the whole payload (its own slice edited, the other page's fields passed through); `churchAddress` added to `AppSettings.churchInfo`

## Approaches Considered

**Recommended (2026-09):** Full page at `/settings` — iOS-settings **split shell**: `dashboard.tsx` owns the scaffold and renders the card list (nav column) beside the selected section/page in a right-hand panel on `lg+`; on mobile the list is the page and selection pushes the sub-page (level-1 breadcrumb header). Hosted section/page components are content-only. Typed registry (`registerSettingsSection`/`registerSettingsPage`) seeds the settings-schema extension point.
**Superseded (2026-09):** section/page components no longer self-scaffold — the wrapper-owned iOS split shell (#12) hosts them as content-only.
- Drawer rejected: cannot scale to multi-section dashboard.
- Full module (`src/modules/settings/`) rejected: premature; settings is core platform concern; modules depend on it.

## Open Gaps

- `brand-assets` bucket creation + RLS (not yet in migrations).
- Lab auth fallback: localStorage vs. mock provider vs. anonymous session.