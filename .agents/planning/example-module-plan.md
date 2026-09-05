# Plan: Turn `src/styleguide` into the `example` module

## Goal
Migrate the standalone styleguide into a first-class module under `src/modules/example/`, matching the module boilerplate structure, and add an "Example" nav-tile to the sidebar.

## Source → Destination

| Source (`src/styleguide/`) | Destination (`src/modules/example/`) |
|---|---|
| `App.tsx` | `index.tsx` |
| `router.ts` | `pages/router.ts` |
| `toc.ts` | `pages/toc.ts` |
| `pages/Dashboard.tsx` | `pages/Dashboard.tsx` |
| `pages/Category.tsx` | `pages/Category.tsx` |
| `pages/SubpageTemplate.tsx` | `pages/SubpageTemplate.tsx` |
| `pages/TypographyShowcase.tsx` | `pages/TypographyShowcase.tsx` |
| `pages/demos.tsx` | `pages/demos.tsx` |
| `pages/demos/` | `pages/demos/` |
| `App.tsx.new` | *(delete — empty file)* |

## New module files to create

- `manifest.ts` — `id: 'example'`, `name: 'Example'`, `basePath: '/example'`, `number: 3` (or next available), nav label/route `/example`
- `public.ts` — re-export `exampleManifest` + `ExampleModuleApi` type
- `routes.tsx` — lazy-import `index.tsx` as `ExampleDashboardPage`; export `exampleRoutes: RouteObject[] = [{ index: true, element: <ExampleDashboardPage /> }]`
- `settings.ts` — register `ExampleSettingsPage` at `/settings/example`
- `settings/ExampleSettingsPage.tsx` — minimal settings placeholder
- `components/index.ts` — empty barrel
- `lib/types.ts` — empty/minimal types
- `lib/queries.ts` — empty/minimal
- `lib/hooks.ts` — empty/minimal
- `pages/.gitkeep`

## Files to modify

1. **`src/core/router.tsx`**
   - Replace `{ index: true, element: <StyleguideApp /> }` with `{ path: 'example', children: exampleRoutes }`
   - Update imports accordingly

2. **`src/core/ui/sidebar.tsx`**
   - Add `{ id: 'example', label: 'Example', icon: <Palette /> }` (or similar lucide icon) to the `MODULES` array

## Import fixes in moved files

- `index.tsx` (was `App.tsx`):
  - `./router` → `./pages/router`
  - `./toc` → `./pages/toc`
  - `./pages/Dashboard` → `./pages/Dashboard`
  - `./pages/Category` → `./pages/Category`
- `pages/Category.tsx`:
  - `../toc` → `./toc`
  - `./SubpageTemplate` → `./SubpageTemplate`
  - `./TypographyShowcase` → `./TypographyShowcase`
- `pages/Dashboard.tsx`:
  - `../toc` → `./toc`

## Files to delete

- `src/styleguide/App.tsx`
- `src/styleguide/App.tsx.new`
- `src/styleguide/router.ts`
- `src/styleguide/toc.ts`
- `src/styleguide/pages/` (entire directory, including `demos/` subdirectory)

## Verification

- Run `npm run typecheck` — must pass
- Run `npm run dev` and confirm:
  - Sidebar shows an "Example" tile
  - Navigating to `/example` renders the styleguide dashboard
  - Category navigation, breadcrumbs, and deep-links work
  - Back/forward browser navigation works
- Run `npm run lint` if available
