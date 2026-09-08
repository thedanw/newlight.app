# Decision: Core Drag-and-Drop Ordering (Reorder)

## What & Why

Build a **core reorder primitive** — a reusable drag-to-reorder list/grid capability that lives in `src/core` and can be consumed by **modules** (compile-time, `src/modules/*`) and **plugins** (runtime, `src/content/plugins/*` via the plugin system). Today the app has three ad-hoc, non-reusable ordering implementations:

1. Hand-rolled HTML5 `draggable` DnD in `JourneySettingsManager.tsx` (journey tracks/categories/stages)
2. Manual Up/Down buttons in `FormBuilderPage.tsx` (form fields)
3. In-memory `order??0` sort-on-register in `HookRegistry.ts` / `settings/lib/schema.ts` (nav items, settings sections/pages/links — no persistence, no UI)

The feature consolidates these into one core capability: a semantic, mobile-first, Park-UI-native `Reorder` compound component + an `useOrderedCollection` persistence hook + a plugin-facing `reorder` API.

## Who

- **End users** (mobile-first): church staff reordering journey stages, form fields, dashboard widgets, nav items on touch devices.
- **Module authors**: people, forms, journey, and future modules need ordered collections.
- **Plugin authors**: plugins (e.g. Elvanto Sync) need to declare/consume reorderable collections and contribute ordered UI (widgets, nav items, settings links).

## Constraints

- **Zero new runtime dependencies preferred.** `framer-motion@13.1.1` is already installed and exports `Reorder.Group` + `useDragControls` (verified). The `motion.dev/docs/react-reorder` API (investigated via jina.ai) is the same API framer-motion ships. `@use-gesture/react` is also installed (used by the waffle sidebar) but is a lower-level gesture primitive, not a sortable-list primitive.
- **React 19 + Ark UI portal guardrail (documented in repo memory):** `framer-motion` `AnimatePresence` is INCOMPATIBLE with Ark UI `Portal` components (Select/Dialog) under React 19 — "Invalid hook call"/blank page. `Reorder.Group`/`Reorder.Item` do NOT use portals, so they are safe; but the plan must forbid wrapping `Reorder.Item` content in `AnimatePresence` + Ark portals, and prefer CSS keyframe animations for enter/exit.
- **Park UI components first, minimal inline styles.** Reorder chrome (items, handles, icons) must be built from `src/core/ui` components + a slot recipe; inline styles only for dynamic custom properties (per the `--module-number` lesson: dynamic custom props go in `style`, not `css`).
- **Semantic & hierarchical naming.** Follow the `Page.Root/Header/Body` compound pattern: `Reorder.Root`, `Reorder.Item`, `Reorder.Handle`. Persistence layer: `useOrderedCollection`, `OrderedCollectionDefinition`, `OrderedCollectionService`.
- **Mobile first.** Pointer events (framer Reorder uses pointer events → works for touch), `touch-action` handling, ≥44px touch targets, auto-scroll inside scroll containers, reduced-motion safe (drag tracking must NOT be gated on reduced motion — only release animation; per waffle-sidebar lesson).
- **Token enforcement.** `pnpm lint:tokens` must pass — no raw px/hex on tokenized props.
- **Barrel discipline.** Any new `src/core/ui` export must be added to `src/core/ui/index.ts`; `@park-ui/cli add` regenerates the barrel and drops custom exports (repo memory GOTCHA) — re-add after any CLI use.
- **Persistence model.** Supabase tables already use `sort_order int` columns (`journey_track_categories`, `journey_tracks`, `journey_stages`, `form_fields`, `service_plan_items`). The core service must write `sort_order` optimistically and roll back on failure.

## Non-Goals

- No new drag library installation (unless a hard a11y/keyboard requirement emerges — see decision #2 fallback).
- No runtime-dynamic plugin loading changes (plugin system already exists; we only extend its API surface).
- No virtualization of long lists (YAGNI for current data sizes).
- No cross-list drag (moving items between different collections) in v1 — single-collection reorder only.
- No touch long-press vs scroll disambiguation beyond what framer Reorder provides out of the box.
- No reordering of profile sections (hardcoded composition) in v1 — listed as a future adoption candidate only.

## Assumptions

- ⚠️ `framer-motion` `Reorder` remains the chosen primitive and is not removed from the dependency tree (it is already a hard dependency of the app shell).
- ⚠️ Plugins can import core exports (they already do — `src/content/plugins/elvanto-sync` imports from `@/core/ui` barrel; note it has pre-existing barrel-import errors that are out of scope).
- ⚠️ `sort_order` is the canonical ordering column for all ordered collections (verified for journey + forms; new collections must add it).

## Decision Log

| # | Decision | Alternatives | Rationale |
|---|----------|-------------|-----------|
| 1 | Build core reorder on **`framer-motion` `Reorder`** (already installed) | `@dnd-kit/core`, `@hello-pangea/dnd`, `sortablejs`, hand-rolled `@use-gesture` | Zero new deps; verified `Reorder.Group`/`useDragControls` export in `framer-motion@13.1.1`; matches motion.dev docs; house already depends on framer-motion. Reorder Group/Item don't use Ark portals → avoids the documented React 19 incompatibility. |
| 2 | Wrap the primitive in a **thin core abstraction** (`Reorder` compound + `useOrderedCollection`) so the underlying lib is swappable | Direct framer-motion usage everywhere | Modules/plugins must not import framer-motion directly; core owns the dependency. If keyboard-first a11y becomes a hard requirement, swap to `@dnd-kit/core` behind the same API. |
| 3 | **Compound naming** `Reorder.Root` / `Reorder.Item` / `Reorder.Handle` | Flat `ReorderList`/`ReorderItem`/`ReorderHandle` | Matches `Page.Root/Header/Body` and Park UI compound conventions; semantic + hierarchical. |
| 4 | Persistence via **`useOrderedCollection`** hook + `OrderedCollectionService` (optimistic `sort_order` writes) | Direct Supabase calls in each module | Single source of truth for optimistic update + rollback; modules/plugins get a consistent API. |
| 5 | Extend **`PluginAPIContext`** with a `reorder` API + `HookRegistry.registerOrderedCollection` | Separate plugin-only registry | Reuses the existing plugin seam (`PluginAPI.tsx` context, `HookRegistry` per-plugin tracking); plugins declare reorderable collections and consume the same core hook. |
| 6 | **Mobile-first**: pointer events, `touch-action`, ≥44px handles, auto-scroll | Mouse-only drag | App is mobile-first; framer Reorder uses pointer events natively. |
| 7 | **Reduced motion**: drag tracking never gated on `prefers-reduced-motion`; only release animation suppressed | Gate whole drag on reduced motion | Waffle-sidebar lesson: gating drag on reduced motion breaks the essential interaction. |
| 8 | Enter/exit animations via **CSS keyframes**, not `AnimatePresence` | `AnimatePresence` around items | Documented React 19 + Ark portal incompatibility; CSS keyframes already the house pattern (settings panel stack). |
| 9 | v1 = **single-collection reorder** only | Cross-list drag | YAGNI; cross-list adds drop-target complexity not needed by current collections. |
| 10 | Adopt in **JourneySettingsManager** + **FormBuilderPage** first | Adopt everywhere at once | Replaces the two worst ad-hoc implementations; proves the API on real data before broader rollout. |

## Approaches Considered

### Recommended: Core `Reorder` compound + `useOrderedCollection` + plugin `reorder` API (framer-motion-backed)

A single core primitive in `src/core/ui/reorder.tsx` (slot recipe + compound `Root/Item/Handle`), a persistence hook in `src/core/lib/useOrderedCollection.ts`, and a plugin-facing `reorder` API on `PluginAPIContext`. Modules and plugins both consume the same core exports. Zero new dependencies. The abstraction layer keeps framer-motion contained in core.

### Alternative: `@dnd-kit/core` as the primitive

Best-in-class keyboard/a11y sensors and touch handling. But it is a **new dependency**, and the app's stated preference is to consider installed libraries first. Keep as the fallback if keyboard-first a11y becomes a hard requirement (decision #2).

### Alternative: Hand-rolled on `@use-gesture/react`

Consistent with the waffle sidebar's gesture infra and gives total control, but reinvents sortable-list mechanics (drop-target math, auto-scroll, a11y) that framer Reorder already provides. Higher maintenance, higher risk.

### Alternative: Keep ad-hoc implementations

Zero work but perpetuates three divergent ordering systems, no plugin story, no mobile-first consistency. Rejected.