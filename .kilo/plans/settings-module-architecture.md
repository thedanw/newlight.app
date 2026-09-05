# Plan: Restructure settings pages to match module boilerplate

## Goal
Make `src/core/settings` follow the same page architecture as modules:
- `index.tsx` = dashboard page with `<Page.Header>` + `<Page.Body>`, **no** `<Page.Root>`
- `pages/*` = self-contained page components, each with their own `<Page.Header>` + `<Page.Body>` + breadcrumbs
- No shared `<Page.Body>` wrapper in `index.tsx`
- No centralized breadcrumb management in `index.tsx`

## Current State Problems
1. `src/core/settings/index.tsx` renders its own `<Page.Root>` inside the app shell's `<Page.Root>` (nested Page.Root)
2. `index.tsx` manages a panel stack with slide animations and wraps all sections/pages in a shared `<Page.Body>`
3. `index.tsx` renders breadcrumbs for all subpages
4. Section components in `sections/` are not self-contained — they lack `<Page.Header>` and `<Page.Body>`
5. `SettingsActionsProvider` + `SettingsInner` in `index.tsx` render the Apply/Cancel footer centrally

## Target Structure
```
src/core/settings/
├── manifest.ts
├── index.tsx                    # Settings dashboard (section list)
├── routes.tsx
├── settings.ts                  # Core registrations
├── lib/                         # Framework logic
├── pages/
│   ├── ChurchInformationPage.tsx    # Self-contained page
│   └── IntegrationsPage.tsx         # Self-contained page
└── sections/                    # (to be removed after migration)
```

## Steps

### 1. Create `src/core/settings/pages/` directory
Move section components here and make each self-contained.

### 2. Convert `ChurchInformationSection` → `ChurchInformationPage`
- New file: `src/core/settings/pages/ChurchInformationPage.tsx`
- Add `<Page.Header>` with:
  - `headerVariant="hero"`
  - Back button + breadcrumbs (Settings › Church Information)
  - `--module-number` from `settingsManifest.number`
- Wrap all existing content in `<Page.Body>`
- Add `<Page.Footer>` with Apply/Cancel buttons directly in the page
- Remove dependency on parent `SettingsActionsProvider` for UI rendering
- Keep `useSettings` for Supabase/app settings access

### 3. Convert `IntegrationsSection` → `IntegrationsPage`
- New file: `src/core/settings/pages/IntegrationsPage.tsx`
- Add `<Page.Header>` with back button + breadcrumbs (Settings › Integrations)
- Wrap content in `<Page.Body>`

### 4. Simplify `src/core/settings/index.tsx`
- Remove `<Page.Root>` wrapper
- Remove panel stack, slide animation, and shared `<Page.Body>` wrapper
- Remove centralized breadcrumb rendering
- Extract `SettingsDashboard` component:
  - `<Page.Header>` with hero variant, Settings icon, "Settings" heading
  - `<Page.Body>` with section list cards
- If `section` param exists, resolve the page component from registry and render it directly
- Each resolved page is fully self-contained

### 5. Update `src/core/settings/routes.tsx`
- Keep single route `:section?/:page?` → `<SettingsPage />`
- `SettingsPage` acts as thin dispatcher:
  - No section param → render `SettingsDashboard`
  - Section param → resolve and render page component directly

### 6. Update `src/core/settings/settings.ts`
- Update `component` references to new `pages/` paths:
  - `ChurchInformationPage` from `./pages/ChurchInformationPage`
  - `IntegrationsSection` → `./pages/IntegrationsPage`

### 7. Update imports across codebase
- `src/core/settings/sections/ChurchInformationSection.tsx` → `pages/ChurchInformationPage.tsx`
- `src/core/settings/sections/IntegrationsSection.tsx` → `pages/IntegrationsPage.tsx`
- Any other files importing from `sections/`

### 8. Remove `src/core/settings/sections/` directory
After verifying all imports are updated.

### 9. Verify
- `npx tsc -b` passes
- `/settings` renders dashboard with section cards
- `/settings/church-info` renders self-contained page with header, body, breadcrumbs, footer
- `/settings/integrations` renders self-contained page
- No nested `<Page.Root>` in React DevTools
