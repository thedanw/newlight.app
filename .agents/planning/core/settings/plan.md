# Plan: App Settings Dashboard

**Goal:** Build an app-wide Settings dashboard at `/settings/:section?` with a Church Information sub-section (migrated BrandForm content + Church Name, App Name, Church Email, Website), and replace the sidebar brand nav-tile with a settings nav-tile. The dashboard exposes a registration API so modules can declare their own settings sub-pages/sections (core #41 settings-schema extension point).

**Approach:** Create a core settings surface under `src/core/settings/` with a typed section/page registry. Migrate the 8 BrandForm fields verbatim into a ChurchInformationSection, add 4 new fields, keep live re-theme + logo save-on-apply. Add a `/settings/:section?` route via a new `src/core/routes.tsx`. Wire platform_settings persistence via a SettingsProvider context and Supabase Storage for logo. Swap the sidebar footer tile + Account menu item to "Settings" and remove the legacy styleguide BrandForm drawer.

**Branch:** `feature/settings-dashboard` (from `main`)

## Scope
- **In:** Settings dashboard at `/settings/:section?` + Church Information section (8 BrandForm fields + 4 new); `registerSettingsSection`/`registerSettingsPage` API; `SettingsProvider` context; `platform_settings` persistence (single `app-settings` key); Supabase Storage `brand-assets` bucket; sidebar settings nav-tile; Account menu rename; removal of legacy BrandForm drawer/file.
- **Out:** Auth gating (lab has no auth), Realtime broadcast, other sub-sections (Appearance/Notifications/Modules — registry exists), unit-test runner, Playwright E2E.

## Execution Protocol (MANDATORY — every batch)

Each batch follows this sequence:
1. **Progress sync** — Mark completed tasks in plan.md; update progress.md with prior batch summary; read findings.md
2. **Context statement** — State overall goal, current batch goal, previous batch outcome, key findings, budget
3. **Tools** — Use manage_todo_list (atomic tasks, max 1 in-progress); use subagents for independent >5min subtasks; update progress.md after each action
4. **Execute** sub-batches in order
5. **Compact** — Summarize in progress.md; store detail in findings.md; mask verbose outputs; check context budget

---

## Action Items

### Batch 1: Scaffold core settings route + provider

**Batch 1 Context:**
- Overall Goal: Build Settings dashboard at `/settings/:section?` with Church Information section and registration API
- Current Batch Goal: Scaffold settings provider, core route slice, and Storage bucket
- Previous Batch: Planning complete (6 batches planned, 0 executed)
- Key Findings: [ref findings.md#settings] — no `src/core/routes.tsx` exists; module convention via `src/core/router.tsx`; BrandForm at `src/styleguide/BrandForm.tsx` (read before Batch 3)
- Current State: Starting Batch 1
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%

**Mandatory Tools:** `manage_todo_list` (atomic tasks); subagents OK for parallel file ops; `progress.md` log after each action.

**Context & Critical Info:**
- No `src/core/routes.tsx` exists — must be created. Module convention: core owns `src/core/routes.tsx`; ONLY `src/core/router.tsx` calls `createBrowserRouter`.
- Reference pattern: `src/modules/people/routes.tsx` — `lazy(() => import(...))` + `RouteObject[]`.
- `src/core/router.tsx` currently: `createBrowserRouter([{ path: '/', element: <StyleguideApp/> }, { path: '/people', children: peopleRoutes }, { path: '/forms/:formId', element: <FormPublicPage/> }])`. Spread `coreRoutes` into this array.
- `@supabase/supabase-js` v2.112.4 installed. `platform_settings` table exists (key, environment, value jsonb, UNIQUE(key, environment)) with public-read RLS.
- `SettingsProvider` = React context exposing supabase client + session. Lab has NO auth → provide a mock/fallback (localStorage or anonymous).
- Storage bucket `brand-assets` does NOT exist — create a migration (public read, super_admin write).
- Verify with `pnpm typecheck` (no test runner exists).

**Sub-batch 1a: Directory + SettingsProvider**
- [ ] Create `src/core/settings/` directory
- [ ] Create `src/core/settings/SettingsProvider.tsx` — context providing `supabase` + `session` (real in app, mock/fallback in lab)
- Progress: update progress.md, log findings to findings.md

**Sub-batch 1b: Core route slice + router wiring**
- [ ] Create `src/core/routes.tsx` — `coreRoutes: RouteObject[]` with `{ path: '/settings/:section?', element: <SettingsPage/> }` (lazy import)
- [ ] Wire `coreRoutes` into `src/core/router.tsx` (spread into top-level array)
- Progress: update progress.md

**Sub-batch 1c: Storage bucket migration**
- [ ] Create Supabase migration for `brand-assets` Storage bucket + RLS policies (public read, super_admin write)
- Progress: update progress.md, log migration SQL to findings.md

**Sub-batch 1d: Verify**
- [ ] `pnpm typecheck` passes; `/settings` renders a placeholder (temporary stub SettingsPage)
- [ ] **Commit:** `feat(settings): scaffold core settings route + provider + storage bucket`
- Progress: update progress.md, mark Batch 1 complete in task_plan.md

**Batch 1 Compaction:**
- Summarize: scaffolded SettingsProvider, core route slice, Storage bucket migration, typecheck green
- Store detailed migration SQL in findings.md (ref: findings.md#storage-bucket-migration)
- Mask: no verbose outputs to retain (minimal)
- Context well under 70%: proceed to Batch 2 without compaction

---

### Batch 2: Settings dashboard shell (section/page registry)

**Batch 2 Context:**
- Overall Goal: Build Settings dashboard at `/settings/:section?` with Church Information section and registration API
- Current Batch Goal: Create section/page registry API and SettingsPage shell
- Previous Batch: Scaffolded SettingsProvider, core route, Storage bucket, typecheck green (progress.md #batch-1)
- Key Findings: [ref findings.md#settings] — `@/core/ui` barrel exports: Field, Input, Select, RadioCardGroup, Slider, Checkbox, FileUpload, Avatar, Button, Text, Heading, PageHeader, PagePanel, Card, Icon, Breadcrumb, BackButton, NavTile, Menu, Drawer, Dialog, Toaster
- Current State: Starting Batch 2
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%

**Mandatory Tools:** `manage_todo_list`; subagents OK for parallel type definitions; `progress.md` log after each action.

**Context & Critical Info:**
- PageHeader = styled `header` (px-6 py-2, borderBottom, flex space-between). PagePanel = flex column, flex-1, overflow hidden.
- Route is `/settings/:section?` — read `section` via `useParams()` from react-router-dom.
- settings-schema.ts types: `SettingsSection = { id, title, description, component, order? }`; `SettingsPage = { sectionId, id, title, component, path, order? }`
- API: `registerSettingsSection`, `registerSettingsPage`, `getSettingsSections()`, `getSettingsPages(sectionId)`
- Church Information section id = `church-info`, title = "Church Information".

**Sub-batch 2a: settings-schema.ts (registry + API)**
- [ ] Create `src/core/settings/settings-schema.ts` — typed `SettingsSection[]` + `SettingsPage[]` registries + `registerSettingsSection`/`registerSettingsPage`/`getSettingsSections`/`getSettingsPages`
- Progress: update progress.md, log exported API surface to findings.md

**Sub-batch 2b: SettingsPage shell**
- [ ] Create `src/core/settings/SettingsPage.tsx` — PagePanel + PageHeader (breadcrumb "Settings") + reads `section` from URL params; renders section component, or section list if no section
- Progress: update progress.md

**Sub-batch 2c: Church Information stub + register**
- [ ] Create `src/core/settings/sections/ChurchInformationSection.tsx` — stub (migrated in Batch 3)
- [ ] Register Church Information section in settings-schema.ts (id: church-info)
- Progress: update progress.md

**Sub-batch 2d: Verify**
- [ ] `pnpm typecheck` + `pnpm lint` pass; browser shows dashboard shell with Church Information section
- [ ] **Commit:** `feat(settings): add dashboard shell with section/page registry`
- Progress: update progress.md, mark Batch 2 complete

**Batch 2 Compaction:**
- Summarize: created settings-schema.ts registry + SettingsPage shell + ChurchInformationSection stub, registered; typecheck + lint green
- Store API surface in findings.md (ref: findings.md#settings-schema-api)
- Context under 70%: proceed to Batch 3

---

### Batch 3: Church Information section — migrate BrandForm + new fields + persistence

**Batch 3 Context:**
- Overall Goal: Build Settings dashboard at `/settings/:section?` with Church Information section and registration API
- Current Batch Goal: Migrate BrandForm fields, add 4 new fields, wire persistence (theme + logo)
- Previous Batch: Scaffolded settings shell with registry + stub ChurchInformationSection (progress.md #batch-2)
- Key Findings: [ref findings.md#brandform-migration] — Source: `src/styleguide/BrandForm.tsx` (8 fields: Logo, Color scheme, Sidebar style, Gray, Accent, Corner radius, Font, Heading style). Live re-theme via `switchTheme({...})` + `applyFont()`. Logo upload to Storage `brand-assets` → write to `platform_settings` key `app-settings`. 4 new fields: Church Name, App Name, Church Email, Website. Persistence shape: `{ theme: {...}, churchInfo: {...}, logoUrl: '...' }`.
- Current State: Starting Batch 3
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%

**Mandatory Tools:** `manage_todo_list`; read `src/styleguide/BrandForm.tsx` fully before implementing; `progress.md` log after each action.

**Sub-batch 3a: Migrate 8 BrandForm fields**
- [ ] Implement `ChurchInformationSection.tsx` — copy all 8 BrandForm fields verbatim with live re-theme `useEffect` + `getInitialState()`
- Progress: update progress.md

**Sub-batch 3b: Add 4 new fields**
- [ ] Add Church Name, App Name, Church Email, Website using `Field` + `Input` from `@/core/ui`; hold in local state
- Progress: update progress.md

**Sub-batch 3c: Logo upload + persistence**
- [ ] On Apply: upload file to Storage `brand-assets` → public URL → write `logoUrl` to `platform_settings` (key `app-settings`) via SettingsProvider
- [ ] On mount: read `platform_settings` (key `app-settings`) to hydrate initial state (theme + church info + logoUrl)
- Progress: update progress.md, log persistence shape to findings.md

**Sub-batch 3d: Verify**
- [ ] `pnpm typecheck` + `pnpm lint` pass; browser: all 12 fields render, theme knobs re-theme live, logo uploads to Storage + persists to DB on Apply
- [ ] **Commit:** `feat(settings): add Church Information section with persistence`
- Progress: update progress.md, mark Batch 3 complete

**Batch 3 Compaction:**
- Summarize: migrated 8 BrandForm fields + added 4 new fields; live re-theme working; logo upload + persistence wired
- Store BrandForm field mapping in findings.md (ref: findings.md#brandform-migration)
- Context under 70%: proceed to Batch 4

---

### Batch 4: Sidebar settings nav-tile

**Batch 4 Context:**
- Overall Goal: Replace sidebar brand nav-tile with settings; remove legacy BrandForm drawer
- Current Batch Goal: Update sidebar tile + Account menu; rewire styleguide App; delete BrandForm
- Previous Batch: Church Information section migrated with persistence (progress.md #batch-3)
- Key Findings: [ref findings.md#sidebar] — `src/core/ui/sidebar.tsx` footer has 2 tiles: Account + Brand. `FOOTER_TILES = 2`. `SidebarProps.onBrandSettings?: () => void`. `src/styleguide/App.tsx` wires `onBrandSettings={openBrandForm}` → `openOverlay('brand')` → `Drawer.Root` with `<BrandForm/>`. `src/styleguide/router.ts` has `OverlayKey = 'demo-dialog' | 'demo-drawer' | 'brand'`.
- Current State: Starting Batch 4
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%

**Mandatory Tools:** `manage_todo_list`; subagent OK for parallel file edits (sidebar + App.ts + router.ts); `progress.md` log after each action.

**Sub-batch 4a: Sidebar tile + prop rename**
- [ ] Replace footer Brand tile with settings tile: label "Settings", `Settings` icon, `onClick={onSettingsNavigate}`; keep `FOOTER_TILES = 2`
- [ ] Rename `SidebarProps.onBrandSettings` → `onSettingsNavigate` (update Sidebar + SidebarInner signatures)
- Progress: update progress.md

**Sub-batch 4b: Account menu item**
- [ ] Rename Account menu item `value="brand-settings"` → `"settings"`, label "Brand settings" → "Settings", `onSelect={onSettingsNavigate}`
- Progress: update progress.md

**Sub-batch 4c: Styleguide App rewiring**
- [ ] Update `src/styleguide/App.tsx` — pass `onSettingsNavigate` navigating to `/settings`; remove brand overlay + BrandForm drawer wiring + brandLogo/brandLogoRef state
- Progress: update progress.md

**Sub-batch 4d: Verify**
- [ ] `pnpm typecheck` + `pnpm lint` pass; browser: sidebar shows "Settings" tile; clicking navigates to `/settings`; Account menu shows "Settings"
- [ ] **Commit:** `feat(settings): replace brand nav-tile with settings nav-tile`
- Progress: update progress.md, mark Batch 4 complete

**Batch 4 Compaction:**
- Summarize: replaced sidebar brand tile with settings tile; renamed Account menu; rewired styleguide App to navigate to /settings
- Store sidebar structure in findings.md (ref: findings.md#sidebar)
- Context under 70%: proceed to Batch 5

---

### Batch 5: Remove legacy BrandForm

**Batch 5 Context:**
- Overall Goal: Remove legacy BrandForm after migration to settings page
- Current Batch Goal: Delete BrandForm.tsx, remove all references
- Previous Batch: Sidebar tile + Account menu updated to "Settings" (progress.md #batch-4)
- Key Findings: [ref findings.md#brandform-migration] — BrandForm fully superseded by ChurchInformationSection. Must grep for `BrandForm`/`onBrandSettings` references and remove. `src/styleguide/router.ts` has `'brand'` in `OverlayKey` — remove if unused.
- Current State: Starting Batch 5
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%

**Mandatory Tools:** `manage_todo_list`; grep for residual references; `progress.md` log after each action.

**Sub-batch 5a: Delete + remove references**
- [ ] Delete `src/styleguide/BrandForm.tsx`
- [ ] Remove `BrandForm` import + remaining references from `src/styleguide/App.tsx`; remove `'brand'` from `OverlayKey` in `src/styleguide/router.ts` if unused
- Progress: update progress.md, grep verify

**Sub-batch 5b: Verify**
- [ ] `pnpm typecheck` + `pnpm lint` + `pnpm build` all pass; grep confirms no `BrandForm` / `onBrandSettings` references remain
- [ ] **Commit:** `refactor(settings): remove legacy styleguide BrandForm`
- Progress: update progress.md, mark Batch 5 complete

**Batch 5 Compaction:**
- Summarize: deleted BrandForm.tsx; removed all references from App.tsx and router.ts; typecheck + lint + build green
- Store grep results in findings.md (ref: findings.md#brandform-cleanup)
- Context under 70%: proceed to Batch 6

---

### Batch 6: Module deep-linking + test & polish

**Batch 6 Context:**
- Overall Goal: Settings dashboard complete — verify module registration + deep-linking + all gates pass
- Current Batch Goal: Demo module deep-link registration; full verification; cleanup
- Previous Batch: Legacy BrandForm removed; build green (progress.md #batch-5)
- Key Findings: [ref findings.md#settings] — verify `/settings/<section>/<page>` deep link works with a demo module registration
- Current State: Starting Batch 6
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%

**Mandatory Tools:** `manage_todo_list`; read task_plan.md for full status; `progress.md` log after each action.

**Sub-batch 6a: Demo module registration**
- [ ] Add a demo module settings page registration (e.g., in `src/modules/people/`) to verify deep-linking: register a page under a section, navigate to `/settings/<section>/<page>` directly
- Progress: update progress.md, log registration pattern to findings.md

**Sub-batch 6b: Full verification**
- [ ] Run `pnpm lint` (max-warnings 0) + `pnpm typecheck` + `pnpm build` — all green
- [ ] Manual browser pass: `/settings` renders; `/settings/church-info` deep link works; all 12 fields; live re-theme; logo uploads to Storage + persists to DB on Apply; sidebar tile + Account menu navigate; Back button from `/settings` returns to previous page
- Progress: update progress.md

**Sub-batch 6c: Cleanup**
- [ ] Remove dead code / debug statements; confirm no unused imports
- [ ] **Commit:** `chore(settings): lint, typecheck, build, cleanup`
- Progress: update progress.md, mark Batch 6 complete

**Batch 6 Compaction:**
- Summarize: demo module registration verified; all gates pass; cleanup done
- Store manual test results in findings.md (ref: findings.md#verification)

### Final
- [ ] **Push:** `git push origin feature/settings-dashboard`

---

## Validation
- [ ] `pnpm typecheck` passes (no TS errors)
- [ ] `pnpm lint` passes (max-warnings 0)
- [ ] `pnpm build` succeeds
- [ ] Browser: `/settings` dashboard renders Church Information with all 12 fields
- [ ] Browser: `/settings/church-info` deep link works; module deep-link pattern verified
- [ ] Browser: theme knobs re-theme the whole shell live; logo uploads to Storage + persists to DB on Apply
- [ ] Browser: sidebar settings tile + Account menu "Settings" navigate to `/settings`
- [ ] No `BrandForm` / `onBrandSettings` references remain
- [ ] Section/page registration API exported and typed; modules can import and register

## Open Questions
- [ ] Should the theme knobs be split into a separate "Appearance" sub-section now, or stay inside Church Information? (Current: inside Church Information)
- [ ] Should `platform_settings` use a single `app-settings` key (recommended) or separate keys per section?

---

## Progress Tracking
| Batch | Status | Commit |
|-------|--------|--------|
| 1 — Scaffold | pending | |
| 2 — Shell + registry | pending | |
| 3 — Church Information | pending | |
| 4 — Sidebar nav-tile | pending | |
| 5 — Remove BrandForm | pending | |
| 6 — Deep-link + verify | pending | |
| Final — Push | pending | |