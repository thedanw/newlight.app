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
```tsx
// ── Dashboard (root module/settings page) ──────────────────────────
// Page.Main wraps HeaderTop → sticky Header (contains Heading) → HeaderBottom.
// Each header slot receives --module-number for the hue-rotate background.
// Minimise inner containers
<Page.Main>
  <Page.HeaderTop style={{ '--module-number': peopleManifest.number } as CSSProperties} />
  <Page.Header style={{ '--module-number': peopleManifest.number } as CSSProperties}>
    <Page.Heading level={0} icon={Users} title="People" />
  </Page.Header>
  <Page.HeaderBottom style={{ '--module-number': peopleManifest.number } as CSSProperties}>
    {/* description, search, tools */}
  </Page.HeaderBottom>
  <Page.Body>{/* module content */}</Page.Body>
</Page.Main>

// ── Subpage (any nested route) ─────────────────────────────────────
// Only a sticky Header with Heading. No HeaderTop / HeaderBottom.
<Page.Main>
  <Page.Header style={{ '--module-number': peopleManifest.number } as CSSProperties}>
    <Page.Heading level={2} icon={Users} title="Person Details" />
  </Page.Header>
  <Page.Body>{/* subpage content */}</Page.Body>
</Page.Main>

// ── Page.Heading breadcrumb levels ─────────────────────────────────
// Level 0: icon + title  (dashboard / module home)
// Level 1: ← back + icon + title  (subpage)
// Level 2: ← back + icon → title  (deep subpage)
// Icon & title auto-read from ModuleBreadcrumbContext manifest,
// but explicit `icon` / `title` props override.
```

## Decision Log: decision → Rationale
1. `src/modules/*`, no runtime plugins → static + PWA offline (YAGNI)
2. core/ui barrel only → no rogue atomic CSS (Goal 3)
3. Ban `styled-system/*` outside recipes → structurally impossible (ESLint)
4. `create-module` wires registry → no hand edits, agents start valid
5. Manifest declares cross-module deps → controlled coupling (ESLint+CI)
6. ESLint+tsc+Playwright CI → fail-closed
7. Typed manifest + registry + public index → type safety + tree-shaking
8. Thin routes.tsx glue → single app router (core #48)
9. Disable-only lifecycle → data retained (YAGNI)

## Decision Gap Log
1. Module-local recipe authoring template + lint scope → open
2. New-component process (add base vs module-local recipe) → open
3. Recipe ownership before promotion (2nd-reuse flow, core #42) → open
4. Module-owned Realtime subscriptions / server routes beyond migrations (#46) → open
5. Module API versioning field (compat contract) → deferred
