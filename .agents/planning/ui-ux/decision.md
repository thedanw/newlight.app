# Decision: UI Architecture & CSS (Design System)

## Aliases
- DS = design system: recipe catalog + tokens + base components under `src/core/ui/*`
- BEM = Block__Element--Modifier class naming (block, block__element, block--modifier)
- Recipe = Panda config recipe (`defineRecipe`/`defineSlotRecipe`) emitting named BEM classes
- Atomic = raw `css()`/`cva`/`sva` utility classes (non-semantic; rare escape hatch only)
- Barrel = locked public export surface `src/core/ui/index.ts` — the only UI import point for modules
- Token→semantic→pattern = token scale → semantic component tokens → recipe patterns (theme pipeline)

## What & Why
Zero-runtime UI architecture for the CRM: every component/div carries a human-friendly BEM class (Goal 1), 99% consistent app-wide (Goal 2), via Panda config recipes compiled to a single cached `global.css`. Enforced by typed tokens + recipe-only CSS + lint so small-context agents can't escape the framework (Goal 3 → `module-design/decision.md`).

## Who
Solo developer; small-context LLM agents building bolt-on modules; future contributors.

## Constraints
- Panda config recipes (`defineRecipe`/`defineSlotRecipe`), `hash:false` (core #2)
- Park UI (Ark UI headless + Panda recipes, CLI-vendored) under src/core/ui; no shadcn styled layer (core #3)
- Single cached `global.css`; zero runtime CSS-in-JS; edge bundle gate (core #45)
- Theme via CSS custom properties (light, church-brand, module-scoped) — core #35
- Inter variable font preloaded — core #36
- Promote module component to base DS on 2nd reuse — core #42

## Decision Log: decision → Rationale
1 Use Panda config recipes (defineRecipe/defineSlotRecipe) → named BEM classes in compiled CSS + typed variants (extends core #2)
2 Keep hash:false (Panda default); never hash:true → readable BEM names in devtools + CSS (Goal 1)
3 Restrict atomic css()/cva to rare layout one-offs; lint-gate recipe-first in components → BEM preserved everywhere (Goal 1)
4 Register DS recipes centrally in panda.config.ts (theme.recipes/slotRecipes) → single typed catalog + JIT lean CSS (Goal 2)
5 Restrict CSS to .recipe.ts files; no <style>/inline style/class literals in components → nowhere in a component to go rogue
6 Gate invalid variants/tokens via typed recipes → compile-time guardrail survives agent context loss (Goal 3)
7 Theme via CSS custom properties (light, church-brand, module-scoped) → token→semantic→pattern pipeline (core #35)
8 Preload Inter variable font via service worker → fast + consistent typography (core #36)
9 Promote module component to base DS on 2nd reuse → shared lib stays lean (core #42)
10 Vendor Park UI components + recipes into src/core/ui via @park-ui/cli → free MIT DS, source owned + editable in-repo, BEM preserved (extends core #3)

## Findings (verified)
- Panda config recipes (defineRecipe/defineSlotRecipe) emit NAMED BEM classes under `@layer recipes` (`.button`, `.button--size-lg`, `.checkbox__control--size-sm`); `hash:false` (default) keeps readable
- `cva`/`sva` (atomic recipes) emit ATOMIC utility classes (`.d_flex`, `.bg_red_200`) — NOT BEM; compound-variant css atomizes into `@layer utilities` (e.g. `.px_2`) alongside named classes
- Dynamic variant props need `staticCss` pre-generation (JIT)
- `styled()` over a config recipe still emits named classes (canonical Park UI pattern via createStyleContext); the earlier 'class-based Radix conflict' note was Svelte/Radix-era — with Ark UI, styled() over config recipes is the standard
- Park UI (chakra-ui/park-ui, MIT): React-first, Ark UI headless + Panda config recipes; since Nov 2025 no preset — `@park-ui/cli add <component>` copies component source + recipe into your repo (own + edit; only add what you use = no bloat)
- Park UI recipes are defineSlotRecipe with className → named BEM classes, hash:false compatible (matches ui-ux #1/#2)

## Decision Gap Log
1 Module-scoped theme override mechanics → open
2 UI barrel contents + naming (core/ui package) → open
3 New-component process (add base vs module-local recipe) → open
