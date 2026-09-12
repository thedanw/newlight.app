# Module File Naming Convention (Domain-Prefixed Screaming, FSD-compatible)

A naming convention for module code that combines **feature-based colocation**,
**screaming architecture** (folder = context), and **domain-prefixed filenames**
(shared prefix across related content). Modeled on **Feature-Sliced Design (FSD)**
layers/slices/segments and enterprise domain-prefix naming (e.g. VA.gov).

## Core idea

Every filename = **`DomainPrefix` + `Role`** (PascalCase for components).

- **DomainPrefix** — the page/section/domain the file belongs to, shared by all
  files in that route or section (`PersonProfile`, `People`, `Household`).
- **Role** — the file's purpose (`Page`, `Header`, `Table`, `Form`, `Section`).

The folder groups related files; the prefix makes each file self-describing in
search results, open tabs, and error traces — no bare `Page.tsx`/`Header.tsx`.

## Structure (FSD-compatible)

```
src/modules/<slice>/          # business domain (FSD "slice")
  pages/<route>/              # page slice — one folder per route
  components/                 # shared segment — ONLY used by 2+ routes
  lib/                        # model/api segment — types, queries, hooks
  settings/                   # settings slice — co-locates its own components
```

- **Layers** (FSD): `shared → features → pages → app`. A module may only import
  from layers strictly below it (unidirectional flow).
- **Slices** partition by business domain (`people`, `forms`).
- **Segments** partition a slice by purpose (`ui`, `api`, `model`, `lib`).

## Naming rules

### Components (PascalCase)
- **Page file**: `DomainPrefixPage.tsx` — e.g. `PersonProfilePage.tsx`,
  `PeopleDashboardPage.tsx`, `EditPersonPage.tsx`. Never a bare `Page.tsx`.
- **Page-private component**: `DomainPrefixRole.tsx` — e.g.
  `PersonProfileHeader.tsx`, `PeopleTable.tsx`, `CreatePersonForm.tsx`.
- **Nested sub-component**: `DomainPrefixParentRole.tsx` — e.g.
  `PeopleTableRow.tsx` (row of `PeopleTable`), `JourneyGridCell.tsx`.
- **Shared section**: `RoleSection.tsx` — e.g. `PersonalSection.tsx`,
  `DemographicsSection.tsx` (folder `sections/` provides the grouping; the
  `Section` suffix keeps the role explicit).
- **Settings**: `DomainSettingsPage.tsx` / `DomainSettingsManager.tsx`.

### Non-components (kebab-case)
- `lib/` utilities: `types.ts`, `queries.ts`, `hooks.ts`, `validation.ts`.
- No PascalCase for non-component files.

## Rules

- **Descriptive names everywhere** — a filename must be self-describing without
  its folder. No bare `Page.tsx`, `Header.tsx`, `Table.tsx`, `Grid.tsx`.
- **Common prefix per page/section** — all files for a route share its domain
  prefix (`PersonProfile*`, `People*`, `Household*`). Related content is
  discoverable by prefix.
- **Co-locate page-private components with their route** — a component used by
  one route lives in that route's folder, not `components/`.
- **Nested sub-components live with their parent** — `PeopleTableRow.tsx` under
  `PeopleTable.tsx`, `JourneyGridCell.tsx` under `JourneyGridGrid.tsx`.
- **`components/` = shared only** — a component must be used by 2+ routes to
  earn a place there.
- **Settings co-locates its own private components** in `settings/`, not in
  `components/`.
- **No module prefix** — the module name (`people`) never appears in filenames;
  the folder provides that context. The *domain* prefix (page/section) is what
  appears.
- **Named exports preferred** — searchability and safer refactors.
- **No barrel re-exports** — import files directly (barrels break Vite
  tree-shaking). `index.ts` files must stay empty (`export {}`).
- **Tests colocated** — `*.test.ts(x)` next to the source file.
- **Unidirectional imports** — `shared → features → pages → app`; no
  cross-slice imports. Enforce with ESLint `import/no-restricted-paths` (or FSD
  `steiger`).

## Decision tree

```
Where does a component live?
  used by 2+ routes        → components/
  page-private             → pages/<Route>/
  nested sub-component     → parent's folder
  settings-private         → settings/

What is it named?
  page                     → <Domain>Page.tsx
  page-private component   → <Domain><Role>.tsx
  nested sub-component     → <Domain><Parent><Role>.tsx
  shared section           → <Role>Section.tsx
  lib utility              → kebab-case.ts
```

## Example (people module)

```
src/modules/people/
  pages/
    Dashboard/
      PeopleDashboardPage.tsx
      PeopleFilters.tsx
      PeopleTable.tsx
      PeopleTableRow.tsx
      SavedListSidebar.tsx
    CreatePerson/
      CreatePersonPage.tsx
      CreatePersonForm.tsx
    PersonProfile/
      PersonProfilePage.tsx
      PersonProfileHeader.tsx
    EditPerson/
      EditPersonPage.tsx
    Household/
      HouseholdPage.tsx
      HouseholdAddress.tsx
      HouseholdMembers.tsx
    JourneyGrid/
      JourneyGridPage.tsx
      JourneyGridGrid.tsx
      JourneyGridCell.tsx
    Tags/
      TagsPage.tsx
      TagsManager.tsx
  settings/
    PeopleSettingsPage.tsx
    JourneySettingsManager.tsx
  components/          # ONLY truly shared (used by 2+ routes)
    PageSkeleton.tsx
    SendEmailDialog.tsx
    ErrorBoundary.tsx
    sections/          # shared Edit + Profile
      ProfileSection.tsx
      ProfileSectionField.tsx
      PersonalSection.tsx
      DemographicsSection.tsx
      ContactSection.tsx
      GuardiansSection.tsx
      MedicalSection.tsx
      ConsentsSection.tsx
      ChildSafetySection.tsx
      JourneySection.tsx
      TagsSection.tsx
  lib/                 # kebab-case utilities
    types.ts
    queries.ts
    hooks.ts
```

> Note: the standalone `forms` module lives at `src/modules/forms/` and follows
> the same convention (`forms/pages/*`, `forms/lib/*`, `forms/components/*`).
