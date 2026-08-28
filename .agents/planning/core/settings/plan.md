# Plan: App Settings Dashboard

**Goal:** Build an app-wide Settings dashboard at `/settings/:section?` with a **Church Information** sub-section (migrated `BrandForm` content + Church Name, App Name, Church Email, Website), and replace the sidebar `brand` nav-tile with a `settings` nav-tile that navigates to it. The dashboard exposes a registration API so modules can declare their own settings sub-pages/sections (core #41 `settings-schema` extension point), and any module can deep-link directly to its settings via `/settings/<module-id>`.

**Approach:** Create a core settings surface under `src/core/settings/` (decision #1) with a typed section/page registry (seed of the core #41 `settings-schema` extension point). Migrate the 8 BrandForm fields verbatim into a `ChurchInformationSection`, add 4 new text/email/url fields, keep live re-theme + logo save-on-apply (decision #5). Add a `/settings/:section?` route via a new `src/core/routes.tsx` core route slice (decision #12). Wire `platform_settings` persistence via a `SettingsProvider` context (decision #10) and Supabase Storage for logo (decision #11). Swap the sidebar footer tile + Account menu item to "Settings" (decisions #2/#8) and remove the legacy styleguide `BrandForm` drawer (decision #7).

**Branch:** `feature/settings-dashboard` (from `main`)

## Scope

- **In:** Settings dashboard page at `/settings/:section?` + Church Information sub-section (all 8 BrandForm fields + 4 new fields); section/page registration API (`registerSettingsSection`, `registerSettingsPage`); `SettingsProvider` context for Supabase client + session; `platform_settings` persistence (single `app-settings` key); Supabase Storage public bucket for logo; sidebar `settings` nav-tile; Account menu rename; removal of legacy `BrandForm` drawer/file.
- **Out:** Auth gating (lab has no auth), Realtime broadcast, other sub-sections (Appearance/Notifications/Modules — but registry exists for them), unit-test runner setup, Playwright E2E.

## Execution Protocol (MANDATORY — every batch)

Optimized for small-context LLMs. **Every batch** (and every sub-batch) begins with this ritual, in order:

1. **Context compact** — Before reading anything, write a 3–5 line summary of what you already know about this task into `progress.md` (under a `## Context compact` heading). Drop stale details. This resets your working context.
2. **Read `task_plan.md`** — Get the overview of the plan + current state (which batches/sub-batches are done vs pending). Do NOT re-read the whole `plan.md`.
3. **Update `progress.md`** — Log work done so far (completed sub-batches, errors, test results). Append, don't rewrite.
4. **Read this batch's `Context & Critical Info` block** (below) — This is the self-contained summary of everything the LLM needs for THIS batch. It is authoritative; do not re-explore the codebase unless the block says so.
5. **Execute** the sub-batches in order.
6. **Update `task_plan.md`** — Mark completed sub-batches.
7. **Update `progress.md`** — Log results + any errors.
8. **Git commit** — Conventional message (given at end of each batch).
9. **Report to user** — What was built + verification. Await review before next batch.

> **Why:** Each batch is self-contained. The `Context & Critical Info` block means an LLM with a fresh/empty context can start the batch without reading the entire plan or searching the codebase. The ritual keeps `task_plan.md`/`progress.md` as the single source of truth for state.

---

## Action Items

### Batch 1: Scaffold core settings route + provider

**Context & Critical Info:**
- **No `src/core/routes.tsx` exists yet** — must be created. Module-system convention: core owns `src/core/routes.tsx`; ONLY `src/core/router.tsx` calls `createBrowserRouter`.
- Reference pattern for a route slice: `src/modules/people/routes.tsx` — `lazy(() => import(...))` + `RouteObject[]`.
- `src/core/router.tsx` currently: `createBrowserRouter([{ path: '/', element: <StyleguideApp/> }, { path: '/people', children: peopleRoutes }, { path: '/forms/:formId', element: <FormPublicPage/> }])`. Spread `coreRoutes` into this array.
- `@supabase/supabase-js` v2.112.4 is installed. `platform_settings` table exists (key, environment, value jsonb, UNIQUE(key, environment)) with public-read RLS.
- `SettingsProvider` = React context exposing `supabase` client + `session`. Lab has NO auth → provide a mock/fallback (localStorage or anonymous). Real client in final app.
- Storage bucket `brand-assets` does NOT exist yet — create a migration (public read, super_admin write).
- Verify with `pnpm typecheck` (no test runner exists).

**Sub-batch 1a: Directory + SettingsProvider**
- [ ] Create `src/core/settings/` directory
- [ ] Create `src/core/settings/SettingsProvider.tsx` — context providing `supabase` + `session` (real in app, mock/fallback in lab)

**Sub-batch 1b: Core route slice + router wiring**
- [ ] Create `src/core/routes.tsx` — `coreRoutes: RouteObject[]` with `{ path: '/settings/:section?', element: <SettingsPage/> }` (lazy import)
- [ ] Wire `coreRoutes` into `src/core/router.tsx` (spread into top-level array)

**Sub-batch 1c: Storage bucket migration**
- [ ] Create Supabase migration for `brand-assets` Storage bucket + RLS policies (public read, super_admin write)

**Sub-batch 1d: Verify**
- [ ] `pnpm typecheck` passes; `/settings` renders a placeholder (temporary stub `SettingsPage`)
- [ ] **Commit:** `feat(settings): scaffold core settings route + provider + storage bucket`

Continue to the next batch autonomously without user intervention
---

### Batch 2: Settings dashboard shell (section/page registry)

**Context & Critical Info:**
- `@/core/ui` barrel exports (verified): `Field`, `Input`, `Select`, `RadioCardGroup`, `Slider`, `Checkbox`, `FileUpload`, `Avatar`, `Button`, `Text`, `Heading`, `PageHeader`, `PagePanel`, `Card`, `Icon`, `Breadcrumb`, `BackButton`, `NavTile`, `Menu`, `Drawer`, `Dialog`, `Toaster`.
- `PageHeader` = styled `header` (px-6 py-2, borderBottom, flex space-between). `PagePanel` = flex column, flex-1, overflow hidden.
- Route is `/settings/:section?` — read `section` via `useParams()` from `react-router-dom`.
- `settings-schema.ts` is the seed of the core #41 `settings-schema` extension point. Types:
  - `SettingsSection = { id, title, description, component, order? }`
  - `SettingsPage = { sectionId, id, title, component, path, order? }`
  - API: `registerSettingsSection(section)`, `registerSettingsPage(page)`, `getSettingsSections()`, `getSettingsPages(sectionId)`
- Church Information section id = `church-info`, title = "Church Information".

**Sub-batch 2a: settings-schema.ts (registry + API)**
- [ ] Create `src/core/settings/settings-schema.ts` — typed `SettingsSection[]` + `SettingsPage[]` registries + `registerSettingsSection`/`registerSettingsPage`/`getSettingsSections`/`getSettingsPages`

**Sub-batch 2b: SettingsPage shell**
- [ ] Create `src/core/settings/SettingsPage.tsx` — `PagePanel` + `PageHeader` (breadcrumb "Settings") + reads `section` from URL params; renders the section's registered component, or the section list if no section

**Sub-batch 2c: Church Information stub + register**
- [ ] Create `src/core/settings/sections/ChurchInformationSection.tsx` — stub (migrated in Batch 3)
- [ ] Register Church Information section in `settings-schema.ts` (id: `church-info`)

**Sub-batch 2d: Verify**
- [ ] `pnpm typecheck` + `pnpm lint` pass; browser shows the dashboard shell with Church Information section
- [ ] **Commit:** `feat(settings): add dashboard shell with section/page registry`

### Batch 3: Church Information section — migrate BrandForm + new fields + persistence

**Context & Critical Info:**
- Source to migrate: `src/styleguide/BrandForm.tsx` (8 fields). Read it fully before starting — it is the authoritative reference.
- The 8 fields: **Logo** (FileUpload, save-on-apply), **Color scheme** (Light/Dark segmented), **Sidebar style** (Select), **Gray** (RadioCardGroup, 6 options), **Accent color** (RadioCardGroup, 26 options), **Corner radius** (Slider, 7 marks), **Font** (Select via `FONT_OPTIONS`), **Heading style** (3 Checkboxes).
- Live re-theme: `useEffect` on state calls `switchTheme({...})` (from `@/core/theme/theme-loader`) + `applyFont(state.font)` (from `@/core/theme/font-loader`). `getInitialState()` reads `<html>` data-* attrs.
- Logo lifecycle: draft object URL → on Apply upload to Storage `brand-assets` → public URL → write to `platform_settings` (key `app-settings`). Unmount revokes untransferred drafts.
- 4 new fields (use `Field` + `Input` from `@/core/ui`): Church Name (text), App Name (text), Church Email (email), Website (url). Held in local state alongside theme state.
- Persistence shape (decision #15): single `app-settings` key, value = `{ theme: {...}, churchInfo: {...}, logoUrl: '...' }`. Hydrate initial state on mount from this row via `SettingsProvider`.
- Verify with `pnpm typecheck` + `pnpm lint` (no test runner).

**Sub-batch 3a: Migrate 8 BrandForm fields**
- [ ] Implement `ChurchInformationSection.tsx` — copy all 8 BrandForm fields verbatim with live re-theme `useEffect` + `getInitialState()`

**Sub-batch 3b: Add 4 new fields**
- [ ] Add Church Name, App Name, Church Email, Website using `Field` + `Input`; hold in local state

**Sub-batch 3c: Logo upload + persistence**
- [ ] On Apply: upload file to Storage `brand-assets` → public URL → write `logoUrl` to `platform_settings` (key `app-settings`) via `SettingsProvider`
- [ ] On mount: read `platform_settings` (key `app-settings`) to hydrate initial state (theme + church info + logoUrl)

**Sub-batch 3d: Verify**
- [ ] `pnpm typecheck` + `pnpm lint` pass; browser: all 12 fields render, theme knobs re-theme live, logo uploads to Storage + persists to DB on Apply
- [ ] **Commit:** `feat(settings): add Church Information section with persistence`

Continue to the next batch autonomously without user intervention

---

### Batch 4: Sidebar settings nav-tile

**Context & Critical Info:**
- File: `src/core/ui/sidebar.tsx`. Footer grid has **2 tiles**: `Account` (avatar → Menu) + `Brand` (`SlidersHorizontal` icon, label `"Brand"`, `onClick={onBrandSettings}`). `FOOTER_TILES = 2` constant drives layout math — keep it.
- `SidebarProps` exposes `onBrandSettings?: () => void` and `logo?: string | null`. Rename `onBrandSettings` → `onSettingsNavigate` (update `Sidebar` + `SidebarInner` signatures).
- Account menu has `Menu.Item value="brand-settings" onSelect={onBrandSettings}` → "Brand settings". Rename to `value="settings"`, label "Settings".
- lucide-react exports a `Settings` icon (use it for the tile).
- `src/styleguide/App.tsx` wires `onBrandSettings={openBrandForm}` → `openOverlay('brand')` → `Drawer.Root` with `<BrandForm .../>`. Replace with `onSettingsNavigate` that calls `useNavigate()('/settings')`. Remove the `brand` overlay + `BrandForm` drawer wiring + `brandLogo`/`brandLogoRef` state (logo now lives in the settings page).

**Sub-batch 4a: Sidebar tile + prop rename**
- [ ] Replace footer `Brand` tile with `settings` tile: label `"Settings"`, `Settings` icon, `onClick={onSettingsNavigate}`; keep `FOOTER_TILES = 2`
- [ ] Rename `SidebarProps.onBrandSettings` → `onSettingsNavigate` (update `Sidebar`/`SidebarInner` signatures)

**Sub-batch 4b: Account menu item**
- [ ] Rename Account menu item `value="brand-settings"` → `"settings"`, label "Brand settings" → "Settings", `onSelect={onSettingsNavigate}`

**Sub-batch 4c: Styleguide App rewiring**
- [ ] Update `src/styleguide/App.tsx` — pass `onSettingsNavigate` navigating to `/settings`; remove `brand` overlay + `BrandForm` drawer wiring + `brandLogo`/`brandLogoRef` state

**Sub-batch 4d: Verify**
- [ ] `pnpm typecheck` + `pnpm lint` pass; browser: sidebar shows "Settings" tile; clicking navigates to `/settings`; Account menu shows "Settings"
- [ ] **Commit:** `feat(settings): replace brand nav-tile with settings nav-tile`

### Batch 5: Remove legacy BrandForm

**Context & Critical Info:**
- Delete `src/styleguide/BrandForm.tsx` (fully superseded by `ChurchInformationSection`).
- `src/styleguide/App.tsx` still imports `BrandForm` — remove the import + any remaining references (should be gone after Batch 4).
- `src/styleguide/router.ts` has `OverlayKey = 'demo-dialog' | 'demo-drawer' | 'brand'` — remove `'brand'` if now unused.
- Verify with grep: no `BrandForm` / `onBrandSettings` references remain anywhere.

**Sub-batch 5a: Delete + remove references**
- [ ] Delete `src/styleguide/BrandForm.tsx`
- [ ] Remove `BrandForm` import + remaining references from `src/styleguide/App.tsx`; remove `'brand'` from `OverlayKey` in `src/styleguide/router.ts` if unused

**Sub-batch 5b: Verify**
- [ ] `pnpm typecheck` + `pnpm lint` + `pnpm build` all pass; grep confirms no `BrandForm`/`onBrandSettings` references remain
- [ ] **Commit:** `refactor(settings): remove legacy styleguide BrandForm`

Continue to the next batch autonomously without user intervention

---

### Batch 6: Module deep-linking demo + test & polish

**Context & Critical Info:**
- Verify the registration API + deep-linking work end-to-end: register a demo module settings page (e.g., in `src/modules/people/` or a test module) and navigate to `/settings/<section>/<page>` directly.
- Full verification gates: `pnpm lint` (max-warnings 0) + `pnpm typecheck` + `pnpm build`.
- Manual browser pass checklist (below). No test runner exists — manual + gates only.
- Cleanup: remove dead code / debug statements / unused imports.

**Sub-batch 6a: Demo module registration**
- [ ] Add a demo module settings page registration (e.g., in `src/modules/people/`) to verify deep-linking: register a page under a section, navigate to `/settings/<section>/<page>` directly

**Sub-batch 6b: Full verification**
- [ ] Run `pnpm lint` (max-warnings 0) + `pnpm typecheck` + `pnpm build` — all green
- [ ] Manual browser pass: `/settings` renders; `/settings/church-info` deep link works; all 12 fields; live re-theme; logo uploads to Storage + persists to DB on Apply; sidebar tile + Account menu navigate; Back button from `/settings` returns to previous page

**Sub-batch 6c: Cleanup**
- [ ] Remove dead code / debug statements; confirm no unused imports
- [ ] **Commit:** `chore(settings): lint, typecheck, build, cleanup`

### Final
- [ ] **Push:** `git push origin feature/settings-dashboard`

## Validation

- [ ] `pnpm typecheck` passes (no TS errors)
- [ ] `pnpm lint` passes (max-warnings 0)
- [ ] `pnpm build` succeeds
- [ ] Browser: `/settings` dashboard renders Church Information with all 12 fields
- [ ] Browser: `/settings/church-info` deep link works; module deep-link pattern verified
- [ ] Browser: theme knobs re-theme the whole shell live; logo uploads to Storage + persists to DB on Apply
- [ ] Browser: sidebar `settings` tile + Account menu "Settings" navigate to `/settings`
- [ ] No `BrandForm` / `onBrandSettings` references remain
- [ ] Section/page registration API exported and typed; modules can import and register

## Open Questions

- [ ] Should the theme knobs be split into a separate "Appearance" sub-section now, or stay inside Church Information per the request? (Current: inside Church Information.)
- [ ] Should `platform_settings` use a single `app-settings` key (recommended) or separate keys per section? (Decision pending — see decision.md Gap Log)