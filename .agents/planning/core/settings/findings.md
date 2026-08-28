# Findings: App Settings Dashboard

Research gathered before/while planning. Updated per phase.

## Current state (verified 2026-08-28)

### Sidebar (`src/core/ui/sidebar.tsx`)
- Footer grid has **2 tiles**: `Account` (avatar → Menu) + `Brand` (`SlidersHorizontal` icon, label `"Brand"`, `onClick={onBrandSettings}`).
- `FOOTER_TILES = 2 // Account + Brand` constant drives layout math in `calculateLayout`.
- `SidebarProps` exposes `onBrandSettings?: () => void` and `logo?: string | null`.
- The Account menu also has a `Menu.Item value="brand-settings" onSelect={onBrandSettings}` → "Brand settings".
- Brand header slot (top) renders the committed logo or a `Sun` fallback mark.

### BrandForm (`src/styleguide/BrandForm.tsx`)
- 8-field brand-settings surface: **Logo** (FileUpload, save-on-apply), **Color scheme** (Light/Dark segmented), **Sidebar style** (Select), **Gray** (RadioCardGroup, 6 options), **Accent color** (RadioCardGroup, 26 options), **Corner radius** (Slider, 7 marks), **Font** (Select via `FONT_OPTIONS`), **Heading style** (3 Checkboxes).
- Live re-theme: `useEffect` on `state` calls `switchTheme({...})` + `applyFont(state.font)` → writes `<html>` data-* attrs.
- Logo lifecycle: draft object URL → `onApplyLogo(url)` on Apply → parent (App.tsx) owns committed URL; unmount revokes untransferred drafts.
- `getInitialState()` reads current `<html>` data-* attributes.
- `ThemeSelect` helper wraps 4 of the 8 fields (Select + Field).
- Pure local emulation: **no persistence, no auth gate**.

### Styleguide App (`src/styleguide/App.tsx`)
- Root `/` route. Wires `onBrandSettings={openBrandForm}` → `openOverlay('brand')` → `Drawer.Root` with `<BrandForm logo={brandLogo} onApplyLogo={...} onClose={closeOverlay} />`.
- `brandLogo` state + `brandLogoRef` own the committed logo URL; also sets a `<link rel="icon">` from it.
- Overlay key `'brand'` tracked in `history.state` so Back closes the drawer first (router.ts `OverlayKey`).

### Router (`src/core/router.tsx`)
- `createBrowserRouter([{ path: '/', element: <StyleguideApp/> }, { path: '/people', children: peopleRoutes }, { path: '/forms/:formId', ... }])`.
- **No `src/core/routes.tsx` exists yet** — core route slice must be created (module-system convention).
- `src/modules/people/routes.tsx` is the reference pattern: lazy imports + `RouteObject[]`.

### UI primitives available (`src/core/ui/index.ts`)
- `Field`, `Input`, `Select`, `RadioCardGroup`, `Slider`, `Checkbox`, `FileUpload`, `Avatar`, `Button`, `Text`, `Heading`, `PageHeader`, `PagePanel`, `Card`, `Icon`, `Breadcrumb`, `BackButton`, `NavTile`, `Menu`, `Drawer`, `Dialog`, `Toaster`.

### Tooling
- `package.json` scripts: `dev`, `build` (tsc -b + vite build), `lint` (eslint, max-warnings 0), `typecheck` (tsc -b), `panda`, `theme:colors`.
- **No unit/E2E test runner installed** (no vitest/jest/playwright in devDependencies). CI gates per module-system memory = ESLint + tsc + bundle + Playwright (Playwright not yet set up).

## Relevant prior decisions (from planning docs)

- **core #41**: Base provides `nav-menu` + `settings-schema` + `dashboard-widget` extension points.
- **core #20/#21/#23**: settings hybrid (typed core columns + per-module JSONB) in `platform_settings`, DB-only with environment column.
- **core #27**: Realtime only UI-critical settings (toggles/branding/public config).
- **ui-ux 10.4**: Customizer = super-admin settings module (settings-schema ext, core #41); `platform_settings`; Realtime broadcast.
- **ui-ux 10.6**: Brand settings = whole-app surface (logo + 5 knobs + sidebar style + heading style); SG Page 1 prototypes → port to settings module.
- **ui-ux 10.7**: Logo = brand ASSET (image URL) → Storage URL in `platform_settings` → Realtime.
- **ui-ux 10.9**: Live re-theme = 5 knobs ONLY; logo applies on SAVE.
- **ui-ux 10.12**: Gate brand settings to super-admins (final app); always visible in lab.
- **ui-ux 10.13**: Style Guide = button at BOTTOM of brand form (NOT sidebar tile).
- **ui-ux 10.14**: Sidebar Style dropdown (dark/light/brand dark/brand light).

## New decisions from brainstorming (2026-08-28)

- **Decision #12**: Settings route = `/settings/:section?` with optional section param for deep linking.
- **Decision #13**: Core exports `registerSettingsSection(section)` + `registerSettingsPage(page)` API for module self-registration.
- **Decision #14**: Section registry = typed array in `settings-schema.ts`; page registry = map by section ID.
- **Decision #10**: Create `SettingsProvider` context in `src/core/settings/` for supabase client + session (lab mock, real in app).
- **Decision #11**: Logo → Supabase Storage public bucket (`brand-assets`) on Apply; public URL for favicon/login page pre-auth.
- **Decision #15**: `platform_settings` uses single `app-settings` key with nested JSON.
- **Decision #16**: Add Supabase Storage `brand-assets` bucket migration + RLS (public read, super_admin write).

## DB schema (context for the persistence batch)

- `platform_settings` table exists in `supabase/migrations/20260826000000_create_platform_tables.sql`:
  `id uuid PK, key varchar, environment varchar, value jsonb, updated_at timestamptz; UNIQUE(key, environment)`.
- RLS: public read on `platform_settings` (migrations `20260828120000`/`...001`).
- **Supabase Storage**: Need to create `brand-assets` public bucket + RLS policies (public read, super_admin write) — new migration required.