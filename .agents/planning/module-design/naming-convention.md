# Module File Naming Convention (BEM-style, semantic utility)

Inside a module, the module name is NOT repeated in filenames.

## Block = utility (page, settings) — folder context
- `pages/<Route>/` → block = page (one folder per route)
- `settings/` → block = settings (own utility)

## Element = component grouping (folder)
- Route folder = location (e.g. `pages/JourneyGrid/` = route `/journey`)
- `components/` = ONLY truly shared elements (used by 2+ routes)

## Modifier = component or suffix
- Component file: semantic purpose name (`Grid.tsx`, `Form.tsx`, `Header.tsx`)
- Page file: `Page.tsx` (single route) or `ListPage.tsx`/`BuilderPage.tsx` (multi-route folder)
- Settings page: `SettingsPage.tsx`

## Rules
- **Co-locate page-private components with their route** — a component used by one route lives in that route's folder, not `components/`
- **Nested sub-components live with their parent** — `Row.tsx` under `Table.tsx`, `Cell.tsx` under `Grid.tsx`
- **`components/` = shared only** — a component must be used by 2+ routes to earn a place there
- **Settings co-locates its own private components** in `settings/` (e.g. `JourneySettingsManager.tsx`), not in `components/`
- **No module prefix** — `people` never appears in filenames

## Example (people module)
```
src/modules/people/
  pages/
    Dashboard/
      Page.tsx
      Filters.tsx
      Table.tsx
      Row.tsx
      SavedListSidebar.tsx
    CreatePerson/
      Page.tsx
      Form.tsx
    PersonProfile/
      Page.tsx
      Header.tsx
    EditPerson/
      Page.tsx
    Household/
      Page.tsx
      Address.tsx
      Members.tsx
    JourneyGrid/
      Page.tsx
      Grid.tsx
      Cell.tsx
    Tags/
      Page.tsx
      Manager.tsx
    Forms/
      ListPage.tsx
      BuilderPage.tsx
      SubmissionsPage.tsx
      PublicPage.tsx
  settings/
    SettingsPage.tsx
    JourneySettingsManager.tsx
  components/          # ONLY truly shared (used by 2+ routes)
    PageSkeleton.tsx
    SendEmailDialog.tsx
    sections/          # shared Edit + Profile
      ProfileSection.tsx
      ProfileSectionField.tsx
      Personal.tsx
      Demographics.tsx
      Contact.tsx
      Guardians.tsx
      Medical.tsx
      Consents.tsx
      ChildSafety.tsx
      Journey.tsx
      Tags.tsx
  lib/
    types.ts
    queries.ts
```
