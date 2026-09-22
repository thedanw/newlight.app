# Decision: Module Architecture & Agent Containment

## Aliases
- Module = self-contained folder `src/modules/*`
- Barrel = locked UI exports `src/core/ui/index.ts` (sole UI import point)
- Scaffold = `create-module` emits valid skeleton + wires registry
- Fail-closed = types/lint/CI reject anything outside the framework
- Manifest = typed TS dep contract (runtime state lives in module_config)
- Disable = module_config off (data kept); no uninstall (YAGNI)

## What & Why
Lets small-context LLM agents bolt on modules ≥99% consistent with the app (Goal 3). One command scaffolds + registers; deps live in the manifest; disabling is module_config-only. Fail-closed stops a confused agent from going rogue, scattering components, or emitting atomic styles.

## Who
Agents authoring modules; solo reviewer; future contributors.

## Constraints
- Compiled same-repo modules `src/modules/*` (+ core `src/core/*`) — no runtime plugins/workspaces
- Per-module typed TS manifest; registry auto-wired by scaffold; public index API; thin routes.tsx glue
- Cross-module imports only via declared manifest deps; ESLint no-restricted-imports + CI enforce
- UI imported solely from core/ui barrel (vendored Park UI recipes)
- Lifecycle: disable-only via module_config (data kept); no uninstall (YAGNI)
- CI gates: ESLint + tsc + bundle + Playwright

## Page Layout Structure
```tsx
// Dashboard: Page.Main wraps HeaderTop → sticky Header (Heading) → HeaderBottom.
// Each slot gets --module-number for hue-rotate bg. Minimise inner containers.
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

// Subpage: sticky Header + Heading only (no Top/Bottom).
<Page.Main>
  <Page.Header style={{ '--module-number': peopleManifest.number } as CSSProperties}>
    <Page.Heading level={2} icon={Users} title="Person Details" />
  </Page.Header>
  <Page.Body>{/* subpage content */}</Page.Body>
</Page.Main>

// Settings hosted page (content-only): the settings split shell
// (src/core/settings/dashboard.tsx) owns the Page scaffold for the whole
// /settings tree; hosted pages render their content only — no Page.Main,
// Page.Header, or Page.Body (see core/settings/decision.md §12).
<Stack>{/* settings page content */}</Stack>

// Heading levels: 0 icon+title (home) · 1 ←back+icon+title (subpage) · 2 ←back+icon→title (deep).
// Icon/title auto-read from ModuleBreadcrumbContext; explicit props override.

// Action footer: shell-owned, rendered ONCE by AppShell as a direct child of
// Page.Root (absolute, out of flow, `inert` when idle). Forms hook in via
// `useRegisterPageActions({ cancel, apply, isSaving, isDirty, applyLabel? })`;
// the footer slides in only while `isDirty`. See `ui-ux/action-footer/decision.md`.
//
// SETTINGS EXCEPTION: hosted settings pages (sections/pages registered from a
// module settings.ts) render CONTENT ONLY — the split shell in
// src/core/settings/dashboard.tsx owns Page.Main/Header/Body, the header
// (title/icon, level 0/1), and the two-pane layout. Never render Page slots
// inside a hosted settings page. See core/settings/decision.md §12 and
// ui-ux/decision.md §19.
```

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)
1 Structure & no-runtime-plugins → static + PWA offline (YAGNI)
2 Containment & discipline → no rogue atoms
    2.1 core/ui barrel only → sole UI import point (Goal 3)
    2.2 styled-system banned outside recipes → structurally enforced (ESLint)
3 Generation & scaffolding → agents start valid
    3.1 create-module wires registry → no manual registry edits
4 Coupling declaration → controlled coupling
    4.1 manifest declares deps → ESLint no-restricted-imports + CI enforce
5 Governance & CI → fail-closed
    5.1 ESLint + tsc + bundle + Playwright gate → reject off-framework
6 Contracts & types → type safety + tree-shaking
    6.1 typed manifest + registry + public index → compile-time guarantees
7 Routing → single app router
    7.1 thin routes.tsx glue → one routing surface
8 Lifecycle → data retained
    8.1 disable-only via module_config → schema/migration → [core/database/decision.md §A.5](../core/database/decision.md); no uninstall (YAGNI)
9 Shell-owned action footer → one dirty-driven Save/Cancel bar
    9.1 PageActionsProvider + useRegisterPageActions (core/ui) → forms hook in, no per-page footer
    9.2 ActionFooter rendered once by AppShell (absolute in Page.Root, inert when idle) → no duplicate bars
    9.3 lint-pages.mjs bans Page.Footer in routed pages → single source of truth
    9.4 Settings sections/pages (core + modules) are CONTENT-ONLY: the settings split shell (`src/core/settings/dashboard.tsx`) owns their Page.Main/Header/Body for the whole `/settings` tree; recognized structurally by lint-pages (any file under a `settings/` dir must render zero Page slots) → one scaffold owner for the whole settings surface (see [core/settings/decision.md](../core/settings/decision.md) #12)
10 Settings split shell → hosted settings pages are content-only
    10.1 settings.ts registers { sectionId, id, title, icon?, component } → src/core/settings/dashboard.tsx owns Page.Main/Header/Body for every /settings route
    10.2 Hosted components render content only, never Page slots (lint-pages recognizes `settings/` dirs structurally — no allowlist upkeep) → no nested scaffold, no double headers; header (title/icon, level 0/1) + two-pane layout provided by the shell

## Decision Gap Log
1. Module-local recipe authoring template + lint scope → open
2. Add-base vs module-local recipe process → open
3. Recipe ownership before promotion (2nd-use flow) → open
4. Module-owned Realtime/server routes beyond migrations → open
5. Module API versioning field → deferred
6. Multi-section dirty aggregation (EditPersonPage registers `isDirty: true` first pass) → open
