# Module File Naming Convention (Layer-Prefixed, Entry-Point Marked, FSD-compatible)

A naming convention for module code that combines **feature-based colocation**,
**screaming architecture** (folder = context), **BEM-style layer prefixes**
(the layer name prefixes every component in it), and **`+`-marked entry points**
(SvelteKit-style). Modeled on **Feature-Sliced Design (FSD)** layers/slices/
segments and **SvelteKit's `+page` routing convention**.

## Core idea

Every filename = **`[+]<LayerName><Domain><Role>.tsx`** (PascalCase).

- **`+`** — entry-point marker. Only the route's entry file carries it. It sorts
  first in any folder (ASCII `+` = 43, before digits and all letters).
- **`<LayerName>`** — the layer the component belongs to, used as a prefix
  (BEM-style: the layer "block" prefixes its "elements"). E.g. `Section`,
  `Widget`, `Dialog`, `Row`, `Cell`, `Field`.
- **`<Domain>`** — the page/section the file belongs to, shared by all files in
  that route or section (`People`, `PersonProfile`, `Household`).
- **`<Role>`** — the file's purpose (`Dashboard`, `Header`, `Table`, `Form`).

The folder groups related files; the layer prefix + domain prefix make each file
self-describing in search results, open tabs, and error traces.

## Layer cascade (BEM-style)

Layers cascade from the top of the UI down. Each layer is a folder; every
component in it carries the **layer name as a PascalCase prefix** (like BEM's
`block__element`). The entry point of a page is marked with `+`.

| Layer (folder) | Prefix | Example |
|---|---|---|
| page (route folder) | `+` (entry) | `+PeopleDashboardPage.tsx` |
| section | `Section` | `SectionPersonal.tsx` |
| widget | `Widget` | `WidgetPeopleTable.tsx` |
| dialog | `Dialog` | `DialogSendEmail.tsx` |
| row | `Row` | `RowPeopleTable.tsx` |
| cell | `Cell` | `CellJourneyGrid.tsx` |
| field | `Field` | `FieldProfileSection.tsx` |

Cascade: `Page → Section → Widget → Dialog → Row/Cell → Field`

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
- **Page entry point**: `+<Domain>Page.tsx` — e.g. `+PeopleDashboardPage.tsx`,
  `+PersonProfilePage.tsx`, `+EditPersonPage.tsx`. The `+` marks the route
  target and sorts it first. Never a bare `Page.tsx`.
- **Section**: `Section<Domain>.tsx` — e.g. `SectionPersonal.tsx`,
  `SectionDemographics.tsx`, `SectionHouseholdAddress.tsx`.
- **Widget**: `Widget<Domain>.tsx` — e.g. `WidgetPeopleTable.tsx`,
  `WidgetSavedListSidebar.tsx`, `WidgetCreatePersonForm.tsx`.
- **Dialog**: `Dialog<Domain>.tsx` — e.g. `DialogSendEmail.tsx`.
- **Nested sub-component**: `Row<Domain>.tsx` / `Cell<Domain>.tsx` — e.g.
  `RowPeopleTable.tsx` (row of `WidgetPeopleTable`), `CellJourneyGrid.tsx`.
- **Field**: `Field<Domain>.tsx` — e.g. `FieldProfileSection.tsx`.
- **Settings**: `+<Domain>SettingsPage.tsx` / `Widget<Domain>SettingsManager.tsx`.

### Non-components (kebab-case)
- `lib/` utilities: `types.ts`, `queries.ts`, `hooks.ts`, `validation.ts`.
- No layer prefix, no PascalCase for non-component files.

## Rules

- **`+` marks the entry point** — exactly one `+`-prefixed file per route folder
  (the route target). It sorts first in the folder listing.
- **Layer name prefixes its components** — every component in a layer folder
  carries that layer's name as a PascalCase prefix (`Section`, `Widget`,
  `Dialog`, `Row`, `Cell`, `Field`), cascading top-down like BEM.
- **Descriptive names everywhere** — a filename must be self-describing without
  its folder. No bare `Page.tsx`, `Header.tsx`, `Table.tsx`, `Grid.tsx`.
- **Common prefix per page/section** — all files for a route share its domain
  prefix (`People*`, `PersonProfile*`, `Household*`). Related content is
  discoverable by prefix.
- **Co-locate page-private components with their route** — a component used by
  one route lives in that route's folder, not `components/`.
- **Nested sub-components live with their parent** — `RowPeopleTable.tsx` under
  `WidgetPeopleTable.tsx`, `CellJourneyGrid.tsx` under `WidgetJourneyGrid.tsx`.
- **`components/` = shared only** — a component must be used by 2+ routes to
  earn a place there.
- **Settings co-locates its own private components** in `settings/`, not in
  `components/`.
- **No module prefix** — the module name (`people`) never appears in filenames;
  the folder provides that context. The *layer* + *domain* prefixes are what
  appear.
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

What layer is it? (prefix = layer name)
  route entry point        → +<Domain>Page.tsx
  section of a page        → Section<Domain>.tsx
  self-contained chunk     → Widget<Domain>.tsx
  overlay/modal            → Dialog<Domain>.tsx
  list row                 → Row<Domain>.tsx
  grid cell                → Cell<Domain>.tsx
  form field               → Field<Domain>.tsx
  lib utility              → kebab-case.ts
```

## Example (people module)

```
src/modules/people/
  pages/
    Dashboard/
      +PeopleDashboardPage.tsx
      SectionPeopleFilters.tsx
      WidgetPeopleTable.tsx
      RowPeopleTable.tsx
      WidgetSavedListSidebar.tsx
    CreatePerson/
      +CreatePersonPage.tsx
      WidgetCreatePersonForm.tsx
    PersonProfile/
      +PersonProfilePage.tsx
      SectionPersonProfileHeader.tsx
    EditPerson/
      +EditPersonPage.tsx
    Household/
      +HouseholdPage.tsx
      SectionHouseholdAddress.tsx
      SectionHouseholdMembers.tsx
    JourneyGrid/
      +JourneyGridPage.tsx
      WidgetJourneyGrid.tsx
      CellJourneyGrid.tsx
    Tags/
      +TagsPage.tsx
      WidgetTagsManager.tsx
  settings/
    +PeopleSettingsPage.tsx
    WidgetJourneySettingsManager.tsx
  components/          # ONLY truly shared (used by 2+ routes)
    WidgetPageSkeleton.tsx
    DialogSendEmail.tsx
    WidgetErrorBoundary.tsx
    sections/          # shared Edit + Profile
      SectionProfile.tsx
      FieldProfileSection.tsx
      SectionPersonal.tsx
      SectionDemographics.tsx
      SectionContact.tsx
      SectionGuardians.tsx
      SectionMedical.tsx
      SectionConsents.tsx
      SectionChildSafety.tsx
      SectionJourney.tsx
      SectionTags.tsx
  lib/                 # kebab-case utilities
    types.ts
    queries.ts
    hooks.ts
```

> Note: the standalone `forms` module lives at `src/modules/forms/` and follows
> the same convention (`forms/pages/*`, `forms/lib/*`, `forms/components/*`).
