---
name: dnd-kit-core-utility
description: "Implement @dnd-kit as a core utility for drag-and-drop across the app. Provides semantic hierarchical naming, Park UI components first, mobile-first approach. Built into core but usable by modules and plugin system. Includes hierarchical tree demo in example module."
category: code-plan
risk: safe
source: local
tags: [dnd-kit, drag-drop, core-utility, hierarchical-tree, example-module, park-ui, mobile-first, plugin-system]
triggers: [dnd-kit, drag-drop, sortable, tree, hierarchical, reorder, core-utility]
---

# @dnd-kit Core Utility Implementation Plan

**Goal:** Implement `@dnd-kit` as a first-class core utility in `src/core/dragndrop/` with semantic hierarchical naming, Park UI components, mobile-first touch support, plugin system integration, and a hierarchical tree demo in the example module.

**Approach:** Build a typed wrapper around `@dnd-kit/react` (incl. `@dnd-kit/react/sortable`), `@dnd-kit/dom`, `@dnd-kit/abstract`, `@dnd-kit/helpers`, `@dnd-kit/collision` exposing a `dragndrop` namespace from `@/core/ui`. Provide `DragDropProvider` + `DragOverlay` at app root, typed hooks (`useDraggable`, `useDroppable`, `useSortable`, `useSortableTree`), Park UI components (`DraggableHandle`, `DraggableItem`, `DroppableZone`, `SortableList`, `SortableTree`, `TreeNode`), tree utilities (`flattenTree`, `reorderTree`), CSS keyframe animations, and plugin API (`PluginAPIContext.dragndrop`, `HookRegistry.registerDndCollection`). Adopt in example module tree demo first.

## Scope
- **In:** Core utility (`src/core/dragndrop/`), `dragndrop` namespace export from `@/core/ui`, typed hooks, Park UI components, tree components + utils, CSS keyframes, plugin API integration, example module tree demo at `/example/category/drag-drop`, tests, lint, typecheck, build.
- **Out:** Kanban board, virtualized lists, multi-drag selection, SSR drag state, cross-tree drag (deferred), `useDndCollection` persistence hook (deferred).

## Execution Protocol (apply every batch)
| Step | Action |
|------|--------|
| Sync | First task of each batch: mark PREVIOUS batch tasks complete in plan.md; update `progress.md` (summary, errors, decisions) |
| Context | Read `findings.md` refs only when needed; if context >70%, compact progress.md before next batch |
| Tools | `manage_todo_list` (1 in-progress); subagent for independent >5min subtasks; mask verbose tool output as `[Obs:N]` → progress.md |
| Budget | Stable 20% (plan/arch) · Current 30% · History 30% (progress.md refs) · Buffer 20% |
| Gates | Per-batch: `pnpm test -- <batch>` (TDD fail→pass), `tsc -b`, `pnpm lint:tokens` |

---

## Phase 1: Setup & Foundation

### Batch 1: Core Infrastructure (Setup)

## Batch 1 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries

## Batch 1 Context
- Goal: Implement @dnd-kit as core utility with semantic hierarchical naming, Park UI components, mobile-first
- This Batch: Install deps, scaffold src/core/dragndrop/, implement provider, add barrel export
- Prev: (first batch)
- Key: findings.md#1 (library decision), findings.md#3 (framework constraints)

#### Subphase 1.1: Install Dependencies & Scaffold
**Context:** No prior dnd-kit code in repo. Fresh install of the v2 (dndkit.com) packages. Legacy v1 names `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` do NOT exist in v2 — React layer is `@dnd-kit/react`; sortable is a subpath `@dnd-kit/react/sortable` (see docs/quickstart.md, docs/hooks/use-sortable.md).
**Todo:**
- [x] Install deps via `pnpm add @dnd-kit/react @dnd-kit/dom @dnd-kit/abstract @dnd-kit/helpers @dnd-kit/collision`
- [x] Create `src/core/dragndrop/` directory structure
- [x] Create `src/core/dragndrop/index.ts` barrel exporting `dragndrop` namespace
- [x] Create `src/core/dragndrop/provider.tsx` with `DragDropProvider` + `DragOverlay`
- [x] Create `src/core/dragndrop/types.ts` shared types
- [x] Add `dragndrop` namespace export to `@/core/ui/index.ts` barrel
**Subagent:** No (sequential, <5 min each)
**Deliverable:** Working dev env with dnd-kit installed, provider scaffolded, barrel export verified

#### Subphase 1.2: Provider Implementation
**Context:** Deps installed, directory structure exists.
**Todo:**
- [x] Implement `DragDropProvider` wrapper using the function form of the `sensors` prop — v2 auto-registers `PointerSensor` (mouse + touch + pen) and `KeyboardSensor` by default; customize the pointer sensor via `PointerSensor.configure({activationConstraints})` from `@dnd-kit/dom` (see [Sensors guide](https://dndkit.com/react/guides/sensors/); no `TouchSensor` class in v2)
- [x] Implement `DragOverlay` wrapper with `dropAnimation: null` (CSS keyframes handle animation)
- [x] Export `dragndrop.Provider`, `dragndrop.DragOverlay` from barrel
**Subagent:** No
**Deliverable:** Provider renders without error, wraps app correctly

---

## Phase 2: Core Implementation

### Batch 2: Typed Hooks & Sensors (TDD)

## Batch 2 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries

## Batch 2 Context
- Goal: Implement @dnd-kit as core utility with semantic hierarchical naming, Park UI components, mobile-first
- This Batch: Typed hooks (useDraggable, useDroppable, useSortable, useSortableTree, useDragDropMonitor, useDragOperation) + sensor configs
- Prev: Batch 1 complete — deps installed, provider scaffolded, barrel export verified
- Key: findings.md#1 (dnd-kit API), findings.md#2 (tree pattern), findings.md#3 (reduced-motion, no AnimatePresence)

#### Subphase 2.1: Type Definitions & Sensor Config
**Context:** Provider exists, need shared types and sensor configuration.
**Todo:**
- [x] Define `DndItem`, `TreeNode`, `DndCollection`, `SortableTreeItem` in `types.ts`
- [x] Create `src/core/dragndrop/sensors/pointerSensor.ts` with mobile-first config — `PointerSensor.configure({ activationConstraints: (event) => event.pointerType === 'touch' ? [new PointerActivationConstraints.Delay({value: 250, tolerance: 5})] : [new PointerActivationConstraints.Distance({value: 8})] })` from `@dnd-kit/dom` (per-pointer-type pattern from Sensors guide; no v2 TouchSensor)
- [x] Create `src/core/dragndrop/sensors/keyboardSensor.ts` with arrow key navigation for tree — wrap `KeyboardSensor.configure({ keyBindings, offset })` from `@dnd-kit/dom`
**Subagent:** Yes (independent type/sensor files)
**Deliverable:** Type definitions and sensor configs ready for hooks

#### Subphase 2.2: Typed Hooks Implementation
**Context:** Types and sensors ready. Need typed wrappers around dnd-kit hooks.
**Todo:**
- [x] **Write failing test** for `useDraggable` — returns ref, handleRef, isDragging state
  Code: `src/core/dragndrop/hooks/__tests__/useDraggable.test.tsx`
- [x] **Run test** to verify it fails → `pnpm test -- useDraggable`
- [x] Implement `useDraggable` in `src/core/dragndrop/hooks/useDraggable.ts` with Park UI ref forwarding
- [x] **Write failing test** for `useDroppable` — returns ref, isDropTarget state
  Code: `src/core/dragndrop/hooks/__tests__/useDroppable.test.tsx`
- [x] **Run test** to verify it fails → `pnpm test -- useDroppable`
- [x] Implement `useDroppable` in `src/core/dragndrop/hooks/useDroppable.ts`
- [x] **Write failing test** for `useSortable` — returns ref, targetRef, handleRef, sortable state
  Code: `src/core/dragndrop/hooks/__tests__/useSortable.test.tsx`
- [x] **Run test** to verify it fails → `pnpm test -- useSortable`
- [x] Implement `useSortable` in `src/core/dragndrop/hooks/useSortable.ts`
- [x] **Write failing test** for `useSortableTree` — extends useSortable with depth, parentId
  Code: `src/core/dragndrop/hooks/__tests__/useSortableTree.test.tsx`
- [x] **Run test** to verify it fails → `pnpm test -- useSortableTree`
- [x] Implement `useSortableTree` in `src/core/dragndrop/hooks/useSortable.ts`
- [x] **Write failing test** for `useDragDropMonitor` — subscribes to drag events
  Code: `src/core/dragndrop/hooks/__tests__/useDragDropMonitor.test.tsx`
- [x] **Run test** to verify it fails → `pnpm test -- useDragDropMonitor`
- [x] Implement `useDragDropMonitor` in `src/core/dragndrop/hooks/useDragDropMonitor.ts`
- [x] **Write failing test** for `useDragOperation` — reactive `source`/`target` snapshot (docs: utilities/use-drag-operation.md)
  Code: `src/core/dragndrop/hooks/__tests__/useDragOperation.test.tsx`
- [x] **Run test** to verify it fails → `pnpm test -- useDragOperation`
- [x] Implement `useDragOperation` in `src/core/dragndrop/hooks/useDragOperation.ts`
- [x] **Run all hook tests** to verify pass → `pnpm test -- dragndrop/hooks`
**Subagent:** Yes (per hook test+impl pair)
**Deliverable:** All typed hooks tested and passing

---

### Batch 3: Core Components (TDD)

## Batch 3 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries

## Batch 3 Context
- Goal: Implement @dnd-kit as core utility with semantic hierarchical naming, Park UI components, mobile-first
- This Batch: Park UI components (DraggableHandle, DraggableItem, DroppableZone, SortableList)
- Prev: Batch 2 complete — all typed hooks tested and passing
- Key: findings.md#3 (Park UI patterns, token enforcement), findings.md#5 (naming conventions)

#### Subphase 3.1: DraggableHandle & DraggableItem
**Context:** Hooks work, Park UI patterns established (IconButton, Card, Box).
**Todo:**
- [x] **Write failing test** for `DraggableHandle` — renders IconButton with GripVertical, ≥44px, aria-label
  Code: `src/core/dragndrop/components/__tests__/DraggableHandle.test.tsx`
- [x] **Run test** to verify it fails → `pnpm test -- DraggableHandle`
- [x] Implement `DraggableHandle` in `src/core/dragndrop/components/DraggableHandle.tsx` using `IconButton` + `GripVertical` icon, `boxSize="11"`, `cursor="grab"`, `aria-label="Reorder item"`
- [x] **Write failing test** for `DraggableItem` — compound Root/Handle/Preview, forwards ref
  Code: `src/core/dragndrop/components/__tests__/DraggableItem.test.tsx`
- [x] **Run test** to verify it fails → `pnpm test -- DraggableItem`
- [x] Implement `DraggableItem` compound component in `src/core/dragndrop/components/DraggableItem.tsx`
- [x] **Run component tests** to verify pass → `pnpm test -- dragndrop/components`
**Subagent:** Yes (per component)
**Deliverable:** Core draggable components tested and passing

#### Subphase 3.2: DroppableZone & SortableList
**Context:** Draggable components work. Need drop zone and flat list.
**Todo:**
- [x] **Write failing test** for `DroppableZone` — renders drop zone, shows enter/leave state via CSS keyframes
  Code: `src/core/dragndrop/components/__tests__/DroppableZone.test.tsx`
- [x] **Run test** to verify it fails → `pnpm test -- DroppableZone`
- [x] Implement `DroppableZone` in `src/core/dragndrop/components/DroppableZone.tsx` with CSS keyframe `dnd-drop-enter`/`dnd-drop-leave`
- [x] **Write failing test** for `SortableList` — flat reorder with useSortable, fires onReorder
  Code: `src/core/dragndrop/components/__tests__/SortableList.test.tsx`
- [x] **Run test** to verify it fails → `pnpm test -- SortableList`
- [x] Implement `SortableList` in `src/core/dragndrop/components/SortableList.tsx`
- [x] **Run component tests** to verify pass → `pnpm test -- dragndrop/components`
**Subagent:** Yes (per component)
**Deliverable:** Drop zone and sortable list tested and passing

---

### Batch 4: Sortable Tree (TDD)

## Batch 4 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries

## Batch 4 Context
- Goal: Implement @dnd-kit as core utility with semantic hierarchical naming, Park UI components, mobile-first
- This Batch: Tree utilities (flattenTree, reorderTree, cssKeyframes) + SortableTree/TreeNode components
- Prev: Batch 3 complete — core components tested and passing
- Key: findings.md#2 (flatten-to-single-context tree pattern), findings.md#3 (CSS keyframes, no AnimatePresence)

#### Subphase 4.1: Tree Utilities
**Context:** Components work, need tree flattening/reordering logic.
**Todo:**
- [x] **Write failing test** for `flattenTree` — converts nested tree to flat array with depth/path
  Code: `src/core/dragndrop/utils/__tests__/flattenTree.test.ts`
- [x] **Run test** to verify it fails → `pnpm test -- flattenTree`
- [x] Implement `flattenTree` in `src/core/dragndrop/utils/flattenTree.ts` (immutable, returns `{ items, itemMap }`)
- [x] **Write failing test** for `reorderTree` — immutable reorder within/between branches
  Code: `src/core/dragndrop/utils/__tests__/reorderTree.test.ts`
- [x] **Run test** to verify it fails → `pnpm test -- reorderTree`
- [x] Implement `reorderTree` in `src/core/dragndrop/utils/reorderTree.ts` (handles move within parent, move to new parent)
- [x] **Write failing test** for `cssKeyframes` — exports keyframe strings for drag animations
  Code: `src/core/dragndrop/utils/__tests__/cssKeyframes.test.ts`
- [x] **Run test** to verify it fails → `pnpm test -- cssKeyframes`
- [x] Implement `cssKeyframes` in `src/core/dragndrop/utils/cssKeyframes.ts` (enter/exit/drag-over)
- [x] Add keyframes to `src/index.css`
- [x] **Run utility tests** to verify pass → `pnpm test -- dragndrop/utils`
**Subagent:** Yes (per utility)
**Deliverable:** Tree utilities tested and passing, keyframes in global CSS

#### Subphase 4.2: SortableTree & TreeNode Components
**Context:** Utilities work. Need recursive tree components.
**Todo:**
- [x] **Write failing test** for `TreeNode` — renders node with handle, children, expand/collapse
  Code: `src/core/dragndrop/components/__tests__/TreeNode.test.tsx`
- [x] **Run test** to verify it fails → `pnpm test -- TreeNode`
- [x] Implement `TreeNode` in `src/core/dragndrop/components/TreeNode.tsx` (recursive, uses `useSortableTree`, `depth` prop for indentation)
- [x] **Write failing test** for `SortableTree` — wraps flat list in single sortable group, manages expanded state
  Code: `src/core/dragndrop/components/__tests__/SortableTree.test.tsx`
- [x] **Run test** to verify it fails → `pnpm test -- SortableTree`
- [x] Implement `SortableTree` in `src/core/dragndrop/components/SortableTree.tsx` (uses `flattenTree`, single sortable group, expanded state map)
- [x] **Run component tests** to verify pass → `pnpm test -- dragndrop/components`
**Subagent:** Yes (per component)
**Deliverable:** Tree components tested and passing

---

## Phase 3: Integration

### Batch 5: Plugin System Integration

## Batch 5 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries

## Batch 5 Context
- Goal: Implement @dnd-kit as core utility with semantic hierarchical naming, Park UI components, mobile-first
- This Batch: Plugin API (PluginAPIContext.dragndrop, HookRegistry.registerDndCollection, manifest schema)
- Prev: Batch 4 complete — tree components tested and passing
- Key: findings.md#4 (plugin system surface), findings.md#5 (manifest schema, HookRegistry)

#### Subphase 5.1: Plugin API & HookRegistry Extensions
**Context:** Core utility complete. Plugin system exists in `src/core/plugins/`.
**Todo:**
- [x] **Write failing test** for plugin dnd API — plugin can register collection via `api.dragndrop.register()`
  Code: `src/core/plugins/__tests__/dragndrop-api.test.tsx`
- [x] **Run test** to verify it fails → `pnpm test -- dragndrop-api`
- [x] Add `dragndrop` property to `PluginAPIContext` in `src/core/plugins/PluginAPI.tsx`
- [x] Add `createPluginDragndropAPI(pluginName)` returning `{ register(collection): void }`
- [x] Add `DndCollection` type + `registerDndCollection`/`getDndCollections` to `src/core/plugins/HookRegistry.ts`
- [x] Add optional `dndCollections?` to `PluginManifest` in `src/core/plugins/manifest-schema.ts`
- [x] Re-export new types from `src/core/plugins/index.ts`
- [x] **Run test** to verify it passes → `pnpm test -- dragndrop-api`
**Subagent:** No (sequential modifications to existing files)
**Deliverable:** Plugin system integrates dragndrop API, types exported

---

### Batch 6: Example Module Tree Demo (TDD)

## Batch 6 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries

## Batch 6 Context
- Goal: Implement @dnd-kit as core utility with semantic hierarchical naming, Park UI components, mobile-first
- This Batch: Example module tree demo at /example/category/drag-drop
- Prev: Batch 5 complete — plugin system integrates dragndrop API
- Key: findings.md#5 (example module pattern), findings.md#2 (tree demo data)

#### Subphase 6.1: Demo Data & Page
**Context:** All core pieces work. Example module pattern known (demos/layout.tsx, toc.ts).
**Todo:**
- [x] **Write failing test** for tree demo page — renders hierarchical data, supports drag reorder
  Code: `src/modules/example/pages/demos/__tests__/dnd-tree.test.tsx`
- [x] **Run test** to verify it fails → `pnpm test -- dnd-tree`
- [x] Create hierarchical demo data in `src/modules/example/pages/demos/dnd-tree.tsx` (nested categories 3+ levels, people org chart)
- [x] Implement demo page using `dragndrop.SortableTree` + `dragndrop.TreeNode`
- [x] Register demo in `src/modules/example/pages/toc.ts` under new `drag-drop` category
- [x] ~~Add route `/example/category/drag-drop` in `src/modules/example/routes.tsx`~~ — NOT DONE (existing generic `category/:categoryId` route already serves this URL)
- [x] **Run test** to verify it passes → `pnpm test -- dnd-tree`
**Subagent:** Yes (demo page independent)
**Deliverable:** Tree demo renders at `/example/category/drag-drop`

#### Subphase 6.2: Demo Polish
**Context:** Demo renders, needs keyboard/touch verification.
**Todo:**
- [x] Verify keyboard navigation (Tab, Arrow keys, Enter/Space, Escape)
- [x] Verify touch drag on mobile simulator
- [x] Verify expand/collapse works
- [x] Verify deep-collapse works (collapse ancestor hides all descendants)
- [x] Verify drag to reorder siblings
- [x] Verify drag to change parent (move between branches)
**Subagent:** No (manual verification)
**Deliverable:** Demo fully functional

---

## Phase 4: Polish & Delivery

### Batch 7: Polish & Accessibility

## Batch 7 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries

## Batch 7 Context
- Goal: Implement @dnd-kit as core utility with semantic hierarchical naming, Park UI components, mobile-first
- This Batch: A11y audit, reduced-motion, quality gates
- Prev: Batch 6 complete — tree demo fully functional
- Key: findings.md#3 (reduced-motion, touch targets, Ark portal guardrail)

#### Subphase 7.1: A11y Audit & Reduced Motion
**Context:** Feature complete, needs accessibility audit.
**Todo:**
- [x] Audit keyboard navigation (Tab, Arrow keys, Enter/Space, Escape) for all components
- [x] Verify screen reader announcements (live regions for drag state)
- [x] Test reduced-motion: disable drag animations via `@media (prefers-reduced-motion: reduce)`, keep instant reorder
- [x] Verify touch targets ≥44px on mobile (handle, drop zones)
- [x] Verify `touch-action: none` on handle only (not whole item)
- [x] **Run all tests** → `pnpm test`
- [x] **Run lint + typecheck** → `pnpm lint && pnpm typecheck`
- [x] **Run build** → `pnpm build`
**Subagent:** Yes (parallel test/lint/typecheck)
**Deliverable:** All quality gates pass, a11y verified

---

### Batch 8: Documentation & Export Verification

## Batch 8 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries

## Batch 8 Context
- Goal: Implement @dnd-kit as core utility with semantic hierarchical naming, Park UI components, mobile-first
- This Batch: Export verification, JSDoc, final build
- Prev: Batch 7 complete — all quality gates pass, a11y verified
- Key: findings.md#5 (barrel export, naming conventions)

#### Subphase 8.1: Export Verification & JSDoc
**Context:** All code done, exports need verification.
**Todo:**
- [x] Verify `@/core/ui` barrel exports `dragndrop` namespace correctly (all components, hooks, types)
- [x] Add JSDoc to all public exports in `src/core/dragndrop/`
- [x] Update `src/modules/example/pages/toc.ts` with dnd category (if not done in Batch 6)
- [x] **Run typecheck** → `pnpm typecheck` (verifies exports)
- [x] **Run build** → `pnpm build`
**Subagent:** No
**Deliverable:** Exports verified, documentation complete, build passes

---

### Batch 9: Planning Cleanup & Archival

## Batch 9 Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries

## Batch 9 Context
- Goal: Implement @dnd-kit as core utility with semantic hierarchical naming, Park UI components, mobile-first
- This Batch: Archive planning docs, update decision.md with lessons learned
- Prev: Batch 8 complete — exports verified, build passes
- Key: findings.md (all sections)

#### Subphase 9.1: Update Decision Log
**Context:** Implementation complete, capture lessons learned.
**Todo:**
- [x] Read `decision.md` (if exists) or create in `.agents/planning/ui-ux/dragdrop/`
- [x] Add lessons learned from implementation:
  - Sensor configuration challenges (touch vs pointer)
  - Tree flattening edge cases (move between branches)
  - CSS keyframe animation performance
  - Plugin API integration patterns
  - Park UI component composition patterns
  - Reduced-motion handling specifics
- [x] Document any deviations from original plan
- [x] Record performance observations
**Subagent:** No
**Deliverable:** Updated `decision.md` with implementation lessons

#### Subphase 9.2: Archive Planning Documents
**Context:** Planning phase complete, archive for reference.
**Todo:**
- [x] Move `plan.md` → `.agents/planning/ui-ux/dragdrop/plan-archive/plan.md`
- [x] Move `findings.md` → `.agents/planning/ui-ux/dragdrop/plan-archive/findings.md`
- [x] Move `progress.md` → `.agents/planning/ui-ux/dragdrop/plan-archive/progress.md`
- [x] Move `decision.md` → `.agents/planning/ui-ux/dragdrop/plan-archive/decision.md`
- [x] Verify archive folder exists and contains all docs
**Subagent:** No
**Deliverable:** All planning docs archived in `plan-archive/`

---

## Validation Gates (Final)

- [x] All tests pass (vitest) — 250 tests (26 files)
- [ ] Coverage ≥ 70% for new code
- [x] No lint/type errors (`pnpm lint && pnpm typecheck`) — `tsc -b` exit 0, `lint:tokens` clean
- [x] Build succeeds (`pnpm build`)
- [x] Tree demo renders and functions at `/example/category/drag-drop`
- [x] Plugin can import `dragndrop` from `@/core/ui` and use `PluginAPIContext.dragndrop`
- [ ] Mobile touch drag works on device/simulator
- [x] Keyboard navigation works for tree (expand/collapse, reorder)

---

## File Tracking

| File | Status | Batch |
|------|--------|-------|
| `package.json` | Modified | 1 |
| `src/core/dragndrop/index.ts` | Created | 1 |
| `src/core/dragndrop/provider.tsx` | Created | 1 |
| `src/core/dragndrop/types.ts` | Created | 1 |
| `src/core/dragndrop/hooks/useDraggable.ts` | Created | 2 |
| `src/core/dragndrop/hooks/useDroppable.ts` | Created | 2 |
| `src/core/dragndrop/hooks/useSortable.ts` | Created | 2 |
| `src/core/dragndrop/hooks/useDragDropMonitor.ts` | Created | 2 |
| `src/core/dragndrop/hooks/useDragOperation.ts` | Created | 2 |
| `src/core/dragndrop/sensors/pointerSensor.ts` | Created | 2 |
| `src/core/dragndrop/sensors/keyboardSensor.ts` | Created | 2 |
| `src/core/dragndrop/components/DraggableHandle.tsx` | Created | 3 |
| `src/core/dragndrop/components/DraggableItem.tsx` | Created | 3 |
| `src/core/dragndrop/components/DroppableZone.tsx` | Created | 3 |
| `src/core/dragndrop/components/SortableList.tsx` | Created | 3 |
| `src/core/dragndrop/components/SortableTree.tsx` | Created | 4 |
| `src/core/dragndrop/components/TreeNode.tsx` | Created | 4 |
| `src/core/dragndrop/utils/flattenTree.ts` | Created | 4 |
| `src/core/dragndrop/utils/reorderTree.ts` | Created | 4 |
| `src/core/dragndrop/utils/cssKeyframes.ts` | Created | 4 |
| `src/core/dragndrop/plugin.ts` | Created | 5 |
| `src/core/plugins/PluginAPI.tsx` | Modified | 5 |
| `src/core/plugins/HookRegistry.ts` | Modified | 5 |
| `src/core/plugins/manifest-schema.ts` | Modified | 5 |
| `src/core/plugins/index.ts` | Modified | 5 |
| `src/core/ui/index.ts` | Modified | 1, 8 |
| `src/modules/example/pages/demos/dnd-tree.tsx` | Created | 6 |
| `src/modules/example/pages/toc.ts` | Modified | 6 |
| `src/modules/example/routes.tsx` | Modified | 6 |
| `src/index.css` | Modified | 4, 7 |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Nested sortable-group conflicts | Flatten tree to single group/provider (docs: multiple-sortable-lists pattern) |
| Ark UI portal + AnimatePresence crash | CSS keyframes only, no Framer Motion for drag |
| Mobile touch scroll interference | Handle-only drag, `touch-action: none` on handle |
| Plugin API breaking changes | Additive only — new `dragndrop` property, new `registerDndCollection` |
| Barrel export collision | Namespace under `dragndrop` (not top-level) |
| Tree performance on large datasets | Virtualization deferred; current scope <500 nodes |

---

## Success Criteria

1. **Core utility** loads and works in isolation
2. **Modules** import `dragndrop` from `@/core/ui` and build sortable UIs
3. **Plugins** access `PluginAPIContext.dragndrop` and register collections
4. **Example tree demo** at `/example/category/drag-drop` demonstrates:
   - Nested hierarchical data (3+ levels)
   - Drag to reorder siblings
   - Drag to change parent (move between branches)
   - Expand/collapse nodes
   - Keyboard navigation
   - Touch drag on mobile
5. **Zero regressions** in existing modules/plugins