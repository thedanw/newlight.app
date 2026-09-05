# Plan: Heading Breadcrumb System

**Goal:** Add a unified heading/breadcrumb system. `Page.Heading` is a sticky compound component that renders the heading content (icon, title, breadcrumbs). `Page.Header` becomes the scrolling background wrapper with `::before`. Any content placed in `Page.Header` but outside `Page.Heading` scrolls away with the background. The page uses an internal scroll wrapper slot (`Page.Main`) that contains `Page.Header` + `Page.Body`, while `Page.Footer` stays outside the scroll container so it remains visible at the bottom.
**Approach:** Create `Page.Heading` compound component (`Page.Heading.Root`, `Page.Heading.Icon`, `Page.Heading.Title`) that applies `position: sticky; top: 0` to its root. Move the hero header `_before` background to the `Page.Header` outer wrapper. Add a `main` slot to the Page recipe that wraps `header` + `body` with `overflow-y: auto`. `Page.Footer` stays as a sibling of `Page.Main` in `Page.Root` so it never scrolls. `Page.Heading` reads module manifest from context and renders the correct breadcrumb pattern for levels 0, 1, 2.
**Branch:** `feature/heading-breadcrumb-system` (from `main`)

## Scope
- In: Page.Heading component, sticky header behavior, breadcrumb rendering logic, module/settings integration
- Out: Sidebar navigation changes, Page.Body modifications, new layout wrappers

## Action Items

---

### Batch 1: Foundation (Page.Heading Component + Context)

**Context:** You are adding a new compound component `Page.Heading` and a context provider for module manifests. The existing `Page` component uses `createStyleContext` with slots (`root`, `header`, `body`, `footer`). You need to add `main` slot later in Batch 2.

**Files you will touch:**
- `src/core/ui/breadcrumb.tsx` — add `ModuleBreadcrumbContext` and `ModuleBreadcrumbProvider`
- `src/core/ui/page.tsx` — add `Page.Heading` compound component (Root, Icon, Title)
- `src/core/ui/index.ts` — export new exports

**Instructions:**
1. Keep changes minimal and focused. Do NOT modify page recipe yet.
2. `ModuleBreadcrumbContext` should provide: `{ manifest: { id, name, icon, basePath } }`
3. `Page.Heading.Root` renders a `<div>` with `position: sticky; top: 0; z-index: 1`
4. `Page.Heading.Icon` and `Page.Heading.Title` are context slots for layout
5. Level rendering: level 0 = icon + title, level 1 = icon + title + back chevron, level 2 = icon + back chevron + title
6. Use `createStyleContext` pattern matching existing components (Heading, Breadcrumb)

- [x] Task 1.1: Create `ModuleBreadcrumbContext` in `src/core/ui/breadcrumb.tsx` with module manifest provider
- [x] Task 1.2: Define `BreadcrumbLevel` type and `useBreadcrumb` hook
- [x] Task 1.3: Create `Page.Heading` compound component (`Page.Heading.Root`, `Page.Heading.Icon`, `Page.Heading.Title`) in `src/core/ui/page.tsx`
- [x] Task 1.4: Page.Heading reads module manifest from context and renders level 0/1/2 patterns (icon + title, icon + back chevron + title)
- [x] Task 1.5: Export new components from `src/core/ui/index.ts`

**After this batch:** Update `plan.md` to mark all Batch 1 tasks complete.

---

### Batch 2: Page.Scroll Container + Sticky Behavior

**Context:** Currently `Page.Root` is `flex column, height: 100%, overflow: hidden`. `Page.Body` has `overflow-y: auto` and is the only scroll container. `Page.Header` and `Page.Footer` are static. You are adding an internal `Page.Main` slot that becomes the scroll container, containing `Page.Header` + `Page.Body`. `Page.Footer` stays outside `Page.Main` so it remains visible. The hero header `_before` background moves from `HeaderBase` to the outer `Page.Header` wrapper so it scrolls away with the background. `Page.Heading.Root` uses `position: sticky; top: 0` to stick to the top of `Page.Main`.

**Files you will touch:**
- `src/core/theme/recipes/page.ts` — add `main` slot, remove `overflowY: auto` from `body`, update `root` if needed
- `src/core/ui/page.tsx` — update `Page.Root` to render `Page.Main` wrapper, move hero `_before` to `Page.Header`, add sticky to `Page.Heading.Root`

**Instructions:**
1. Add `main` slot to page recipe: `flex: 1`, `overflow-y: auto`, `position: relative`
2. Remove `overflowY: auto` from `body` slot
3. Update `Page.Root` render to wrap `header` + `body` in `<main className={page.main}>`, render `footer` as sibling outside
4. Move hero header `_before` styles from `HeaderBase` to the outer `Page.Header` wrapper (the slot element)
5. `Page.Heading.Root` gets `position: sticky; top: 0; z-index: 1` via its own styles or compound component structure
6. Ensure `Page.Header` preserves its padding above/below the heading content
7. Do NOT change any module pages yet — just the infrastructure

- [x] Task 2.1: Add `main` slot to Page recipe: `flex: 1`, `overflow-y: auto`, `position: relative`
- [x] Task 2.2: Remove `overflowY: auto` from `body` slot (no longer the scroll container)
- [x] Task 2.3: Add `Page.Main` compound slot to Page component; module pages will compose `<Page.Main>` around `<Page.Header>` + `<Page.Body>` in Batch 3
- [x] Task 2.4: Hero header `_before` styles remain on `HeaderBase` (outer `Page.Header` wrapper) — scrolls away when `Page.Header` is inside `Page.Main`
- [x] Task 2.5: `Page.Header` outer wrapper preserves padding from recipe (`pt: 8px, pb: 8px`) and hero variant padding
- [x] Task 2.6: Add `position: sticky; top: 0; z-index: 1` to `Page.Heading.Root` so heading content sticks to viewport top
- [x] Task 2.7: Verify sibling content in `Page.Header` (e.g., PeopleSearch) scrolls away with the background while heading stays fixed
- [x] Task 2.8: Verify `Page.Footer` stays visible at bottom (outside scroll container)

**After this batch:** Update `plan.md` to mark all Batch 2 tasks complete.

---

### Batch 3: People Module Integration

**Context:** The People module has a dashboard page (`src/modules/people/index.tsx`) and several subpages (`PersonProfilePage`, `EditPersonPage`, `HouseholdPage`, `JourneyGridPage`, `TagsPage`, `FormsListPage`). The dashboard currently uses `<Page.Header headerVariant="hero">` with an `<HStack>` containing an `<Icon>` and `<Heading>`. The search component (`PeopleSearch`) is inside `Page.Body`. You will replace the manual header with `<Page.Heading>` and move `PeopleSearch` into `Page.Header` so it scrolls away with the background.

**Files you will touch:**
- `src/modules/people/index.tsx` — replace manual header with `<Page.Heading level={0} icon={Users} title="People" />`, move `PeopleSearch` into `Page.Header`
- `src/modules/people/pages/PersonProfilePage.tsx` — replace manual header with `<Page.Heading level={1} icon={Users} title="Profile" />`
- `src/modules/people/routes.tsx` — wrap routes with `ModuleBreadcrumbProvider` using `peopleManifest`
- Other People subpages — update to use appropriate `Page.Heading` levels

**Instructions:**
1. Import `Page.Heading` from `@/core/ui`
2. Import `ModuleBreadcrumbProvider` from `@/core/ui` or `@/core/ui/breadcrumb`
3. Wrap `peopleRoutes` with `<ModuleBreadcrumbProvider manifest={peopleManifest}>`
4. Dashboard (`index.tsx`): `<Page.Heading level={0} icon={Users} title="People" />` inside `Page.Header`. Move `<PeopleSearch />` to be a sibling of `Page.Heading` inside `Page.Header` so it scrolls away.
5. Subpages: use `level={1}` for direct children (Profile, Edit, Household, Journey, Tags, Forms)
6. If any subpage has a deeper route (e.g., `/people/:id/edit`), use `level={2}` with back chevron
7. Keep `headerVariant="hero"` on dashboard, `headerVariant="default"` on subpages

- [x] Task 3.1: Wrap People routes with `ModuleBreadcrumbProvider` using `peopleManifest`
- [x] Task 3.2: Replace manual header in `src/modules/people/index.tsx` with `<Page.Heading level={0} icon={Users} title="People" />`
- [x] Task 3.3: Move `PeopleSearch` outside `Page.Heading` so it scrolls away with the background
- [x] Task 3.4: Update `src/modules/people/pages/PersonProfilePage.tsx` to use `<Page.Heading level={1} icon={Users} title="Profile" />`
- [x] Task 3.5: Update remaining People subpages (Edit, Household, Journey, Tags, Forms) with correct breadcrumb levels

**After this batch:** Update `plan.md` to mark all Batch 3 tasks complete.

---

### Batch 4: Settings Integration

**Context:** The Settings module (`src/core/settings/`) has a dashboard (`src/core/settings/index.tsx`) and section pages (`ChurchInformationPage`, `IntegrationsPage`). Settings uses dynamic route params (`:section?/:page?`). The dashboard currently uses `<Page.Header headerVariant="hero">` with an `<HStack>` containing `<Icon>` and `<Heading>`. Section pages have their own `Page.Header` with manual breadcrumbs. You will replace manual headers with `<Page.Heading>` and wrap settings routes with `ModuleBreadcrumbProvider`.

**Files you will touch:**
- `src/core/settings/index.tsx` — replace manual header with `<Page.Heading level={0} icon={Settings} title="Settings" />`
- `src/core/settings/pages/ChurchInformationPage.tsx` — replace manual header with `<Page.Heading level={1} icon={Settings} title="Church Information" />`, remove manual breadcrumbs
- `src/core/settings/pages/IntegrationsPage.tsx` — replace manual header with `<Page.Heading level={1} icon={Settings} title="Integrations" />`, remove manual breadcrumbs
- `src/core/settings/routes.tsx` — wrap routes with `ModuleBreadcrumbProvider` using `settingsManifest`

**Instructions:**
1. Import `Page.Heading` and `ModuleBreadcrumbProvider`
2. Wrap `settingsRoutes` with `<ModuleBreadcrumbProvider manifest={settingsManifest}>`
3. Dashboard: `<Page.Heading level={0} icon={Settings} title="Settings" />` inside `Page.Header` with `headerVariant="hero"`
4. Section pages: `<Page.Heading level={1} icon={Settings} title="[Section Title]" />` inside `Page.Header` with `headerVariant="default"`
5. Remove existing manual `<Breadcrumb.Root>` and `<BackButton>` from section pages — `Page.Heading` handles breadcrumbs
6. If a section page has sub-pages (e.g., Integrations with plugin details), use `level={2}` for those sub-pages

- [x] Task 4.1: Wrap Settings routes with `ModuleBreadcrumbProvider` using `settingsManifest`
- [x] Task 4.2: Update `src/core/settings/index.tsx` dashboard to use `<Page.Heading level={0} icon={Settings} title="Settings" />`
- [x] Task 4.3: Update `src/core/settings/pages/ChurchInformationPage.tsx` to use `<Page.Heading level={1} icon={Settings} title="Church Information" />`
- [x] Task 4.4: Update `src/core/settings/pages/IntegrationsPage.tsx` to use `<Page.Heading level={1} icon={Settings} title="Integrations" />`

**After this batch:** Update `plan.md` to mark all Batch 4 tasks complete.

---

### Batch 5: Polish

**Context:** All integration is done. Now verify the implementation works correctly across devices, fix any visual issues, and ensure code quality.

**Instructions:**
1. Run `npx tsc --noEmit` and fix any type errors
2. Run `npx panda cssgen --clean` to regenerate styles
3. Run `npm run lint` if available, fix any lint errors
4. Check responsive behavior: mobile padding, desktop padding, font sizes
5. Verify hero header `::before` background works correctly with the new structure
6. Manually test: People dashboard, Settings dashboard, PersonProfilePage, ChurchInformationPage
7. Check that Page.Footer stays visible on all pages
8. Check that Page.Heading sticks correctly on scroll
9. Check that background scrolls away

- [x] Task 5.1: Verify responsive behavior (mobile/desktop padding)
- [x] Task 5.2: Ensure hero header background ::before layer works with sticky positioning
- [x] Task 5.3: Run typecheck and panda cssgen
- [x] Task 5.4: Manual visual verification on People dashboard, Settings dashboard, and 1 subpage each

**After this batch:** Update `plan.md` to mark all Batch 5 tasks complete. Proceed to Phase 4 Review.

---

## Global Validation
- [x] All existing module pages render without errors
- [x] Page.Main is the scroll container (overflow-y: auto)
- [x] Page.Body no longer has overflow-y: auto
- [x] Page.Heading content sticks to top when scrolling
- [x] Page.Header background scrolls off with sibling content (search, description)
- [x] Page.Body content scrolls naturally as part of Page.Main
- [x] Page.Footer stays visible at bottom (outside scroll container)
- [x] Breadcrumb levels 0, 1, 2 render correct patterns
- [x] No console errors or accessibility warnings
- [x] Typecheck passes

## Open Questions
- Should the back chevron on level 2 use `navigate(-1)` or navigate to the section dashboard?
- Should settings subsections (e.g., Integrations > specific plugin) map to level 2?
