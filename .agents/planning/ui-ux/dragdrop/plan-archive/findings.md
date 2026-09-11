# Findings: @dnd-kit Core Utility

Research digest gathered 2026-09-11. Sources: `dndkit.com` docs (via jina.ai), `.agents/planning/ui-ux/dragdrop/docs/*` (10 dnd-kit reference docs), `package.json`, repo memory (`framework-stack.md`, `module-system.md`, `dragdrop-reorder-plan.md`, `ui-design-lab.md`).

## 1. Library decision (supersedes framer-motion Reorder plan)

| Option | Installed? | Mobile | Keyboard/a11y | Tree support | React 19 + Ark portal safety | Notes |
|---|---|---|---|---|---|---|
| **`@dnd-kit`** | ❌ (new) | Excellent (TouchSensor) | Excellent (KeyboardSensor) | ✅ (flatten-to-single-context pattern) | Clean, no portal coupling | **Chosen.** Best-in-class a11y + tree support. |
| `framer-motion` `Reorder` | ✅ `framer-motion@13.1.1` | Good | Partial (no built-in keyboard) | ❌ (no nested sortable) | Safe (no portals) but no tree | Rejected for tree + keyboard a11y. |
| HTML5 DnD | — | Terrible | None | — | — | Rejected. |

**Key dnd-kit facts (from docs/):**
- **Package (v2, dndkit.com):** `@dnd-kit/react` is the React integration layer (install `@dnd-kit/react`; sortable is a subpath `@dnd-kit/react/sortable`). Supporting packages: `@dnd-kit/dom` (sensors, Feedback plugin, `RestrictToWindow`/`RestrictToElement`), `@dnd-kit/abstract` (+ `/modifiers` for axis modifiers, `SnapModifier`, `CollisionPriority`), `@dnd-kit/helpers` (`move`), `@dnd-kit/collision` (collision detectors). Legacy v1 names `@dnd-kit/core`/`@dnd-kit/sortable`/`@dnd-kit/utilities` are NOT v2 packages.
- **`DragDropProvider`** orchestrates all interactions; event handlers: `onBeforeDragStart`, `onDragStart`, `onDragMove`, `onDragOver`, `onDragEnd` (has `canceled` flag replacing old `onDragCancel`). Multiple independent contexts allowed.
- **`useDraggable`** → `{ ref, handleRef, isDragSource, isDragging, isDropping, draggable }`. `handle`/`handleRef` for handle-only drag.
- **`useDroppable`** → `{ ref, isDropTarget, droppable }`. `accept`/`type` govern drop rules.
- **`useSortable`** (from `@dnd-kit/react/sortable`) → `{ ref, targetRef, sourceRef, handleRef, isDropTarget, isDragSource, isDragging, isDropping }`. Requires `id` + `index`. `group` enables multi-list; `type`/`accept` govern cross-type drops.
- **`DragOverlay`** renders custom overlay during drag; children can be a function receiving `source`. `dropAnimation` prop: `null` disables, `{duration, easing}` customizes.
- **`useDragDropMonitor`** subscribes to lifecycle events without binding to a specific entity; must be inside `DragDropProvider`.
- **`useDragDropManager`** returns the manager for advanced cases (registry lookups, custom listeners).
- **Modifiers:** `RestrictToElement` (`@dnd-kit/dom/modifiers`), `RestrictToWindow`, `RestrictToVerticalAxis`/`RestrictToHorizontalAxis` (`@dnd-kit/abstract/modifiers`), `SnapModifier`. Configure `element` as a function to resolve latest ref.
- **Sensors (v2):** `PointerSensor` (handles **mouse + touch + pen** via Pointer Events; from `@dnd-kit/dom`) + `KeyboardSensor` (`@dnd-kit/dom`) are auto-registered on every `DragDropProvider`. **No `TouchSensor` class in v2** (consolidated into PointerSensor). Configure touch via function-form `activationConstraints(event)`: `event.pointerType === 'touch'` → `PointerActivationConstraints.Delay({value: 250, tolerance: 5})`; mouse/pen → `PointerActivationConstraints.Distance({value: 8})`.

## 2. Tree implementation pattern (critical)

- **Nested `SortableContext` is NOT feasible** — dnd-kit docs + community (dev.to fupeng_wang, medium) confirm: multi-level nested SortableContext causes collision detection conflicts.
- **Proven pattern:** Flatten tree → single-level `SortableContext` with `depth` prop for indentation. Each flattened item carries `{ id, parentId, depth, children }`.
- **Reorder logic:** `flattenTree(tree)` → flat array + item map; `reorderTree(flat, activeId, overId)` → new flat array (handles move-within-parent and move-to-new-parent). Rebuild nested tree from flat on drop.
- **Reference implementations:** `Shaddix/dnd-kit-sortable-tree` (npm), `alexjoyner/react-dnd-tree` (GitHub) — both use flatten-to-single-context.

## 3. Framework constraints (from repo memory — must not be violated)

- **React 19 + Ark UI portal incompatibility:** `framer-motion` `AnimatePresence` is INCOMPATIBLE with Ark UI `Portal` components (Select/Dialog) under React 19 → "Invalid hook call"/blank page. House pattern = **pure CSS keyframe animations**. → dnd-kit `DragOverlay` drop animation should be `null`; enter/exit via CSS keyframes.
- **Reduced motion:** OS `prefers-reduced-motion: reduce` is ON for the user. Direct-manipulation drag tracking must NEVER be gated on reduced motion; only release animation suppressed.
- **`@park-ui/cli add` regenerates `src/core/ui/index.ts`** and drops custom exports → re-add custom exports after any CLI use.
- **Dynamic custom properties** must go in the `style` prop, not `css` (Panda static extraction can't resolve dynamic values).
- **Token enforcement:** `pnpm lint:tokens` flags raw px/hex on tokenized props; `strictPropertyValues: true` in panda.config.ts.
- **`tsc -b` is ground truth** (plain `npx tsc --noEmit` false-passes on solution-style tsconfig).
- **Hidden automation browser:** rAF never fires, CSS transitions frozen → verify drag state via React state/DOM, not animation. Physical clicks can be swallowed by drag handlers → use `dispatchEvent('click')`/programmatic clicks.

## 4. Plugin system surface (integration seam)

- **Loading:** `PluginLoader.tsx` wraps children in nested `PluginProvider`s; `pluginManager.ts` validates manifests (Zod), builds `apiContext` via `createPluginAPIContext(...)`.
- **Extension points (HookRegistry):** settings sections, settings pages, dashboard widgets, nav items, settings links — all sorted by `order??0` except widgets.
- **`PluginAPIContext` shape:** `{ supabase, settings, router, toast, i18n, pluginName, pluginVersion }` — the `dnd` API slots in here.
- **Manifest schema:** `PluginManifest` with `settings?`, `dashboardWidgets?`, `navItems?`, `hooks?`, `permissions` (zod enum).
- **Barrel:** `src/core/plugins/index.ts` re-exports `manifest-schema`, `HookRegistry`, `PluginAPI`, `PluginLoader`.

## 5. Naming & component conventions (from repo memory)

- Compound slot pattern: `Page.Root/Header/Body/Footer` (createStyleContext + slot recipe). dnd mirrors: `dnd.Provider`, `dnd.DragOverlay`, `dnd.SortableList`, `dnd.SortableTree`, `dnd.TreeNode`, `dnd.DraggableHandle`, `dnd.DraggableItem`, `dnd.DroppableZone`.
- Flat primitives: `BackButton`, `IconButton`, `Card`, etc. in `src/core/ui/*.tsx`, exported alphabetically from `src/core/ui/index.ts`.
- Recipes in `src/core/theme/recipes/*.ts` via `defineSlotRecipe`; recipe files must NOT export runtime values (build-time-only `@pandacss/dev` import).
- `Stack`/`HStack` come from `styled-system/jsx`, NOT the core/ui barrel.
- Semantic/hierarchical naming is a stated app principle (user requirement #1).

## 6. Existing ordering implementations (future adoption targets)

1. **`src/modules/people/components/JourneySettingsManager.tsx`** — hand-rolled HTML5 `draggable` DnD (tracks/categories/stages). **Deferred** — the framer-motion `Reorder` plan already adopted this; dnd-kit core utility should eventually replace it.
2. **`src/modules/people/pages/FormBuilderPage.tsx`** — manual Up/Down buttons. **Deferred.**
3. **`src/content/plugins/elvanto-sync/settings/components/FieldMappingTable.tsx`** — plugin case study (rows keyed by index, Ark Combobox portals, JSON blob persistence). **Deferred** — validates pluggable persist + handle-only drag.

> **Note:** The framer-motion `Reorder` plan (`.agents/planning/ui-ux/dragdrop/plan-archive/`) was already EXECUTED (all batches marked complete). This dnd-kit plan is a NEW core utility that supersedes it for tree + keyboard a11y use cases. The `Reorder` compound component remains for simple flat lists; `dnd.SortableTree` covers hierarchical needs.

## 7. Supabase ordered-collection candidates (future)

Tables with explicit `sort_order` column: `journey_track_categories`, `journey_tracks`, `journey_stages`, `form_fields`, `service_plan_items`. Plausible future: `custom_fields`, `people_categories`, `people_flow_steps`, `service_types`, `song_categories`, `calendars`, `saved_lists`, dashboard widgets, nav items. → `useDndCollection` persistence hook deferred (out of scope).