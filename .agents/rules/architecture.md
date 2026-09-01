# Architecture - New Light App

Module + shell conventions. Enforced by lint + Panda recipes. Keep this file token-efficient: one rule per line where possible.

## App shell (single source of truth)
- `src/core/ui/app-shell.tsx` (`AppShell`) is the ONLY app chrome. It renders the left `Sidebar` + `PagePanel` + `ErrorBoundary` + `Suspense`, and routes content via `<Outlet/>` (or `children`).
- `src/core/router.tsx` mounts `AppShell` once and nests ALL authenticated routes beneath it: `/` (styleguide), `/people`, `/settings`. Never render `Sidebar`/`PagePanel` inside a page or module.
- Public / unauthenticated routes (e.g. `/forms/:formId`) live OUTSIDE `AppShell`.
- `ErrorBoundary` lives in `src/core/ui`. Route-level errors use `ErrorPage` as `errorElement`; render errors inside a route use `AppShell`'s `ErrorBoundary`. Do not add a second boundary per module.

## Module contract
Each module under `src/modules/<id>/` exports exactly:
- `manifest.ts` — id, name, icon, basePath, nav.
- `public.ts` — public API surface (re-exported types).
- `routes.tsx` — an array of RouteObject CHILDREN (no `element` layout wrapper, no `errorElement`). The `index` route is the dashboard.
- `index.tsx` — the module's dashboard page (mounted at the `index` route, i.e. `/<id>`).
- `pages/*` — non-dashboard pages.
- `settings.ts` — (optional) registers a settings section via `registerSettingsSection`.

Rules:
- NO layout component per module. The shared `AppShell` provides chrome.
- Dashboard file is `./index.tsx` at the module root, NOT `pages/index.tsx`.
- Keep pages tiny: data via hooks in `lib/`, UI from the barrel, no business logic in JSX.

## UI / styling
- Import UI ONLY from `@/core/ui` (barrel). No direct `@ark-ui/*`, `@park-ui/*`, or `@/core/ui/<file>` imports. (`createListCollection` from `@ark-ui/react` is the one accepted utility exception.)
- Zero-runtime CSS: no inline `style={{}}`, no `css()`/`cva` outside rare shell recipes. Use Panda `defineRecipe`/`defineSlotRecipe`; atomic `css()` only for one-off shell layout.
- Sidebar is left-pinned (`fixed; left:0`). `PagePanel` reserves space with `marginLeft`, not `marginRight`. Change both together if side ever flips.
- Use semantic tokens (`fg.default`, `colorPalette.solid`); never raw palette values (`accent.9`, `gray.12`).

## Routes
- ONLY `src/core/router.tsx` calls `createBrowserRouter`. Core owns `src/core/routes.tsx` and spreads `coreRoutes` as children of `AppShell`; modules contribute their own `routes.tsx` children.
- Lazy-load pages with `React.lazy`.

## Plugins
- Plugins extend modules via the HookRegistry / settings-schema extension points — never by editing core or module files directly.
