# Decision: Core Drag-and-Drop Ordering (Reorder)

## What & Why

Build a **core reorder primitive** in `src/core` for modules (`src/modules/*`) and plugins (`src/content/plugins/*`). Consolidates three ad-hoc implementations:
1. HTML5 `draggable` in `JourneySettingsManager.tsx` (tracks/categories/stages)
2. Up/Down buttons in `FormBuilderPage.tsx` (form fields)
3. In-memory `order??0` sort in `HookRegistry.ts` (nav/settings items — no persistence)

Delivers: `Reorder` compound component + `useOrderedCollection` hook + plugin `reorder` API.

## Who

- **End users** (mobile-first): church staff reordering journey stages, form fields, dashboard widgets, nav items on touch devices.
- **Module authors**: people, forms, journey, and future modules need ordered collections.
- **Plugin authors**: plugins (e.g. Elvanto Sync) need to declare/consume reorderable collections and contribute ordered UI (widgets, nav items, settings links).

## Constraints

- **Zero new deps preferred.** `framer-motion@13.1.1` already installed — exports `Reorder.Group` + `useDragControls`. `@use-gesture/react` present (waffle sidebar) but is a gesture primitive, not a sortable-list primitive.
- **React 19 + Ark UI portal guardrail:** `AnimatePresence` is INCOMPATIBLE with Ark `Portal` components (Select/Dialog) under React 19. `Reorder.Group`/`Reorder.Item` do NOT use portals → safe. Forbid `AnimatePresence` + Ark portals around reorder items; use CSS keyframes.
- **Park UI components first.** Build from `src/core/ui` + slot recipe; inline styles only for dynamic custom properties.
- **Compound naming** following `Page.Root/Header/Body`: `Reorder.Root`, `Reorder.Item`, `Reorder.Handle`. Persistence: `useOrderedCollection`, `OrderedCollectionService`.
- **Mobile first.** Pointer events, `touch-action`, ≥44px touch targets, auto-scroll, reduced-motion safe (drag tracking NOT gated — only release animation; per waffle-sidebar lesson).
- **Token enforcement** (`pnpm lint:tokens` must pass). **Barrel discipline** — re-add custom exports after any `@park-ui/cli add`.
- **Persistence model.** Supabase tables use `sort_order int`; core service writes optimistically, rolls back on failure.

## Non-Goals

- No new drag lib (unless hard a11y/keyboard requirement emerges)
- No plugin loading changes — only extend API surface
- No list virtualization (YAGNI)
- No cross-list drag in v1
- No long-press vs scroll disambiguation beyond framer Reorder defaults
- No profile-section reordering in v1

## Assumptions

- `framer-motion` `Reorder` stays (hard dep of app shell)
- Plugins can import core exports (already do — `elvanto-sync` imports `@/core/ui`)
- `sort_order` is canonical ordering column for all ordered collections

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)

1. **Core primitive = `framer-motion` `Reorder`** (already installed) → zero new deps; `Reorder.Group`/`useDragControls` verified; no Ark portals → avoids React 19 incompatibility
   1.1 **Thin core abstraction** (`Reorder` compound + `useOrderedCollection`) → modules/plugins never import framer-motion directly; swap-ready behind same API
   1.2 **Compound naming** `Reorder.Root`/`Item`/`Handle` → matches `Page.Root/Header/Body` + Park UI conventions
   1.3 **Persistence** via `useOrderedCollection` + `OrderedCollectionService` (optimistic `sort_order` writes + rollback) → single source of truth, consistent API across modules/plugins
   1.4 **Plugin integration** — extend `PluginAPIContext` with `reorder` API + `HookRegistry.registerOrderedCollection` → reuses existing plugin seam, no separate registry
2. **Mobile-first** → pointer events, `touch-action`, ≥44px handles, auto-scroll; framer Reorder uses pointer events natively
   2.1 **Reduced motion**: drag tracking never gated; only release animation suppressed → waffle-sidebar lesson: gating breaks essential interaction
3. **Enter/exit via CSS keyframes**, not `AnimatePresence` → React 19 + Ark portal incompatibility; CSS keyframes already house pattern
4. **v1 scope = single-collection reorder** → YAGNI; cross-list adds drop-target complexity not needed
5. **Adopt first in** JourneySettingsManager + FormBuilderPage → replaces two worst ad-hoc impls; proves API before broader rollout

## Approaches Considered

**Recommended: framer-motion `Reorder` compound + `useOrderedCollection` + plugin API** — zero new deps, abstraction keeps framer-motion contained in core.
- `@dnd-kit/core`: best a11y/keyboard sensors but new dep → keep as fallback if keyboard-first a11y becomes hard requirement
- Hand-rolled on `@use-gesture/react`: reinvents sortable-list mechanics (drop-target, auto-scroll, a11y); high maintenance risk
- Keep ad-hoc: no work but perpetuates three divergent systems, no plugin story, no mobile consistency