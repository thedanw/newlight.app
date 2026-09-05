# Decision: Module Architecture & Agent Containment

## Aliases
- Module = self-contained feature folder under `src/modules/*` (lib, components, server, migrations, manifest.ts, public index)
- Barrel = locked UI export surface `src/core/ui/index.ts` — only UI import point for modules
- Scaffold = `create-module` generator emitting a valid skeleton AND wiring the registry entry (no manual registry edits)
- Fail-closed = types + lint + CI reject anything outside the prescribed framework
- Manifest = typed TS module contract (static; runtime state stays in module_config); declares cross-module deps
- Disable = module_config off (data retained); no uninstall (YAGNI)

## What & Why
Architecture that lets small-context LLM agents build 'bolt-on' modules that are 99% consistent with the app (Goal 3). One command (create-module) scaffolds AND registers a module; cross-module deps are declared in the manifest; runtime disable is module_config-only. Fail-closed: an agent that loses context physically cannot go rogue, create stray components, or emit atomic classes outside the prescribed framework.

## Who
Small-context LLM agents authoring modules; solo developer reviewing; future contributors.

## Constraints
- Compile-time same-repo modules in `src/modules/*` + core in `src/core/*` (core #12) — no runtime plugins / package workspaces
- Typed TS manifest per module (core #40); central registry auto-wired by scaffold (core #43); public index API (core #44); thin route glue routes.tsx (core #48)
- Cross-module imports only via declared manifest deps (core + people API + module public indexes); ESLint no-restricted-imports + CI enforce
- UI imports only from the core/ui barrel (see `ui-ux/decision.md`); base DS = Park UI recipes vendored into src/core/ui
- Lifecycle: disable-only via module_config (data retained); no uninstall (YAGNI)
- CI gates: ESLint + tsc + bundle + Playwright (core #29/#39/#45)

## Page Layout Structure
- Dashboard = root module/settings page. Uses `<Page.Main>` with `<Page.HeaderTop>`, `<Page.Header>` (sticky, contains `<Page.Heading>`), and `<Page.HeaderBottom>` (description, search, tools). All three receive `--module-number` for the hue-rotate background.
- Subpage = any nested route. Uses `<Page.Main>` with only `<Page.Header>` (sticky, contains `<Page.Heading>`). No `<Page.HeaderTop>` or `<Page.HeaderBottom>`.
- `<Page.Heading>` reads `ModuleBreadcrumbContext` for icon/title and renders level 0/1/2 breadcrumb patterns automatically.

## Decision Log: decision → Rationale
1 Keep compile-time same-repo modules in src/modules/* (no runtime plugins / pkg workspaces) → CF static + PWA offline + solo-dev simplicity (YAGNI)
2 Lock module UI imports to single core/ui barrel → agents can't reach atomic css()/Panda internals (Goal 3)
3 Ban styled-system/* imports + css()/cva/sva/styled outside core recipes (ESLint no-restricted-imports) → rogue CSS structurally impossible
4 Scaffold-writes-registry: create-module emits skeleton + wires registry entry → no hand registry edits; agents start valid + wired
5 Declare cross-module deps in manifest (core + people API + module public indexes) → controlled coupling; ESLint+CI enforce
6 Enforce UI via ESLint+tsc+bundle+Playwright in CI → nothing outside framework merges (fail-closed)
7 Use typed manifest + central registry + public index API → type safety + tree-shaking (core #40/#43/#44)
8 Use thin glue routes.tsx slice per module; only src/core/router.tsx calls createBrowserRouter → self-contained + single app router (core #48)
9 Disable-only lifecycle via module_config (data retained); no uninstall → YAGNI; retired modules stay disabled

## Decision Gap Log
1 Module-local recipe authoring template + lint scope → open
2 New-component process (add base vs module-local recipe) → open
3 Recipe ownership before promotion (2nd-reuse flow, core #42) → open
4 Module-owned Realtime subscriptions / server routes beyond migrations (#46) → open
5 Module API versioning field (compat contract) → deferred
