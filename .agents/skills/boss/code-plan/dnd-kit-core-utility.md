---
name: dnd-kit-core-utility
description: "Implement @dnd-kit as a core utility for drag-and-drop across the app. Provides semantic hierarchical naming, Park UI components first, mobile-first approach. Built into core but usable by modules and plugin system. Includes hierarchical tree demo in example module."
category: code-plan
risk: safe
source: local
tags: [dnd-kit, drag-drop, core-utility, hierarchical-tree, example-module, park-ui, mobile-first, plugin-system]
triggers: [dnd-kit, drag-drop, sortable, tree, hierarchical, reorder, core-utility]
---

# Feature Plan: @dnd-kit Core Utility

## What & Why

**What:** Implement `@dnd-kit` as a first-class core utility in `src/core/dnd/` that provides:
- Semantic, hierarchical drag-and-drop primitives (Draggable, Droppable, Sortable, Tree)
- Park UI styled components with minimal inline styling
- Mobile-first touch support with proper accessibility
- Plugin system integration via `PluginAPIContext` and `HookRegistry`
- Module-consumable hooks and components

**Why:** The app needs a consistent, accessible drag-and-drop foundation for:
- Reordering lists (journey tracks, form fields, service plan items)
- Hierarchical tree structures (nested categories, org charts, menu builders)
- Plugin-provided sortable interfaces (Elvanto field mappings)
- Future module features (kanban boards, dashboard widgets)

## Who

- **Primary:** Module developers building sortable/reorderable UIs
- **Secondary:** Plugin authors needing drag-and-drop in their components
- **Tertiary:** Core team maintaining the utility layer

## Constraints

- **Semantic & Hierarchical Naming:** All exports follow `dnd.<Concept>` pattern (e.g., `dnd.Sortable`, `dnd.Tree`, `dnd.useDraggable`)
- **Park UI First:** Use Park UI components (`Card`, `Button`, `Icon`) for all visible UI; minimal inline styles via Panda CSS tokens only
- **Mobile First:** Touch sensors, ≥44px hit targets, handle-only drag, reduced-motion respect
- **No AnimatePresence around Ark Portals:** React 19 incompatibility — use CSS keyframe animations only
- **Plugin System Integration:** Expose via `PluginAPIContext.dnd` and `HookRegistry.registerDndCollection`
- **Tree Demo:** Build hierarchical tree demo in `src/modules/example/pages/demos/dnd-tree.tsx`
- **Zero New Runtime Deps for Core:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` only

## Non-Goals

- Full kanban board component (deferred to module)
- Virtualized lists (deferred)
- Multi-drag selection (deferred)
- Server-side rendering of drag state (not needed for SPA)

## Assumptions

- ✅ `@dnd-kit` v6+ is stable and maintained
- ✅ Park UI components cover all needed primitives (Card, Button, Icon, Stack, Box)
- ✅ Panda CSS tokens provide spacing, colors, radii for drag overlays/previews
- ✅ Plugin system can accept new API surface in `PluginAPIContext`
- ⚠️ Tree implementation requires flattening nested data to single-level `SortableContext` (per dnd-kit best practice)

## Decision Log

| # | Decision | Alternatives | Rationale |
|---|----------|-------------|-----------|
| 1 | Use `@dnd-kit` over `framer-motion Reorder` | Framer Motion Reorder (already in deps) | `@dnd-kit` has superior keyboard a11y, tree support, sensor abstraction, and plugin architecture. Framer Motion Reorder lacks nested sortable and keyboard navigation. |
| 2 | Core utility in `src/core/dnd/` | Scattered in modules | Single source of truth, consistent API, tree-shakeable, plugin-consumable |
| 3 | Flatten tree to single `SortableContext` | Nested `SortableContext` per level | dnd-kit docs explicitly warn against nested contexts — causes collision detection conflicts. Flatten with `depth` prop for indentation. |
| 4 | CSS keyframe animations for drag feedback | Framer Motion `AnimatePresence` | Ark UI portals (Combobox, Select) break inside `AnimatePresence` under React 19 (verified in settings dashboard). |
| 5 | Handle-only drag by default | Whole-item drag | Mobile-first: prevents scroll interference, meets 44px target, clearer affordance |
| 6 | Export `dnd` namespace from `@/core/ui` barrel | Separate `@/core/dnd` import | Consistency with existing Park UI pattern — modules import from `@/core/ui` |

## Approaches Considered

### Recommended: Core Utility Layer with Park UI Components

```
src/core/dnd/
├── index.ts                    # Barrel: export dnd namespace
├── provider.tsx                # DragDropProvider + DragOverlay wrapper
├── hooks/
│   ├── useDraggable.ts         # Typed useDraggable with Park UI refs
│   ├── useDroppable.ts         # Typed useDroppable
│   ├── useSortable.ts          # Typed useSortable + useSortableTree
│   └── useDragDropMonitor.ts   # Global drag state for plugins
├── components/
│   ├── DraggableHandle.tsx     # Park UI IconButton handle (≥44px)
│   ├── DraggableItem.tsx       # Compound: Root + Handle + Preview
│   ├── DroppableZone.tsx       # Visual drop zone with CSS keyframe enter
│   ├── SortableList.tsx        # Flat list with reorder
│   ├── SortableTree.tsx        # Hierarchical tree (flattened internally)
│   └── TreeNode.tsx            # Recursive tree node component
├── sensors/
│   └── touchSensor.ts          # Mobile-first touch config
├── modifiers/
│   └── restrictToParent.ts     # Keep drag within container
├── types.ts                    # Shared types: DndItem, TreeNode, DndCollection
├── utils/
│   ├── flattenTree.ts          # Tree → flat array with depth/path
│   ├── reorderTree.ts          # Immutable tree reorder logic
│   └── cssKeyframes.ts         # Drag animation keyframes
└── plugin.ts                   # PluginAPIContext.dnd + HookRegistry integration
```

### Alternative: Framer Motion Reorder Only

- Simpler, zero new deps
- **Rejected:** No tree support, poor keyboard a11y, no sensor abstraction

### Alternative: HTML5 Drag & Drop API

- Zero deps
- **Rejected:** Terrible mobile support, no touch, accessibility nightmares

## Plan Structure

### Batch 1: Core Infrastructure (Setup)
- [ ] Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- [ ] Create `src/core/dnd/` directory structure
- [ ] Implement `provider.tsx` with `DragDropProvider` + `DragOverlay`
- [ ] Add `dnd` namespace export to `@/core/ui/index.ts` barrel
- [ ] **Commit:** `chore: add @dnd-kit deps and core/dnd scaffold`

### Batch 2: Typed Hooks & Sensors (TDD)
- [ ] Write failing tests for `useDraggable`, `useDroppable`, `useSortable`
- [ ] Implement typed hooks with Park UI ref forwarding
- [ ] Configure `touchSensor` with `activationConstraint: { distance: 8 }` for mobile
- [ ] Add `KeyboardSensor` with arrow key navigation for tree
- [ ] **Commit:** `feat(dnd): typed hooks and mobile-first sensors`

### Batch 3: Core Components (TDD)
- [ ] Write failing tests for `DraggableHandle`, `DraggableItem`, `DroppableZone`
- [ ] Implement `DraggableHandle` using `IconButton` + `GripVertical` icon
- [ ] Implement `DraggableItem` compound component (Root/Handle/Preview)
- [ ] Implement `DroppableZone` with CSS keyframe `dnd-drop-enter`/`dnd-drop-leave`
- [ ] **Commit:** `feat(dnd): core Park UI components`

### Batch 4: Sortable List & Tree (TDD)
- [ ] Write failing tests for `SortableList` and `SortableTree`
- [ ] Implement `SortableList` — flat reorder with `useSortable`
- [ ] Implement `flattenTree` / `reorderTree` utilities (immutable)
- [ ] Implement `SortableTree` + `TreeNode` recursive component
- [ ] Add `depth` prop for indentation, `isExpanded` state
- [ ] **Commit:** `feat(dnd): SortableList and SortableTree components`

### Batch 5: Plugin System Integration
- [ ] Add `dnd` property to `PluginAPIContext` in `PluginAPI.tsx`
- [ ] Add `registerDndCollection` to `HookRegistry.ts`
- [ ] Export `DndCollection` type for plugins to register sortable collections
- [ ] **Commit:** `feat(dnd): plugin system integration`

### Batch 6: Example Module Tree Demo (TDD)
- [ ] Write failing test for tree demo page
- [ ] Create `src/modules/example/pages/demos/dnd-tree.tsx`
- [ ] Add hierarchical demo data (nested categories, people org chart)
- [ ] Register demo in `toc.ts` under new `drag-drop` category
- [ ] Add route `/example/category/drag-drop` in `exampleRoutes`
- [ ] **Commit:** `feat(example): dnd hierarchical tree demo`

### Batch 7: Polish & Accessibility
- [ ] Audit keyboard navigation (Tab, Arrow keys, Enter/Space, Escape)
- [ ] Verify screen reader announcements (live regions)
- [ ] Test reduced-motion: disable drag animations, keep instant reorder
- [ ] Verify touch targets ≥44px on mobile
- [ ] Lint + typecheck + build
- [ ] **Commit:** `chore(dnd): a11y polish, lint, typecheck`

### Batch 8: Documentation & Export Verification
- [ ] Verify `@/core/ui` barrel exports `dnd` namespace correctly
- [ ] Add JSDoc to all public exports
- [ ] Update `toc.ts` with dnd category
- [ ] **Commit:** `docs(dnd): export verification and documentation`

## Validation Gates

- [ ] All tests pass (vitest)
- [ ] Coverage ≥ 70% for new code
- [ ] No lint/type errors (`pnpm lint && pnpm typecheck`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Tree demo renders and functions at `/example/category/drag-drop`
- [ ] Plugin can import `dnd` from `@/core/ui` and use `PluginAPIContext.dnd`
- [ ] Mobile touch drag works on device/simulator
- [ ] Keyboard navigation works for tree (expand/collapse, reorder)

## Open Questions

- [ ] Should `SortableTree` support cross-tree drag (move between trees)?
- [ ] Do we need a `useDndCollection` hook for optimistic persistence?
- [ ] Should drag preview use `DragOverlay` portal or inline clone?

---

## Phase 2.5: OPTIMIZE (Applied to Plan Above)

### Batch 1: Setup
**Evolving Context:** No prior dnd-kit code in repo. Fresh install.
**Mandatory Tools:** `run_in_terminal` for install, `create_file` for scaffold.
**Compaction:** After install, only keep `package.json` diff and file list.
**Sync:** Commit after scaffold complete.

### Batch 2: Typed Hooks
**Evolving Context:** Provider exists, sensors configured.
**Mandatory Tools:** `read_file` existing hooks pattern (e.g., `useNavContext`), `create_file` for new hooks.
**Compaction:** Keep only hook signatures and sensor config.
**Sync:** Commit after tests pass.

### Batch 3: Core Components
**Evolving Context:** Hooks work, Park UI patterns established.
**Mandatory Tools:** `read_file` Park UI components (Button, IconButton, Card), `create_file` for dnd components.
**Compaction:** Keep component props and render logic only.
**Sync:** Commit after visual verification.

### Batch 4: Sortable List & Tree
**Evolving Context:** Components work, need tree logic.
**Mandatory Tools:** `read_file` example module patterns, `create_file` for tree utils/components.
**Compaction:** Keep `flattenTree`/`reorderTree` algorithms and `TreeNode` recursion.
**Sync:** Commit after tree demo data renders.

### Batch 5: Plugin Integration
**Evolving Context:** Core utility complete, plugin system exists.
**Mandatory Tools:** `read_file` `PluginAPI.tsx` and `HookRegistry.ts`, `replace_string_in_file` for additions.
**Compaction:** Keep only new type exports and registration functions.
**Sync:** Commit after typecheck passes.

### Batch 6: Example Tree Demo
**Evolving Context:** All core pieces work, example module pattern known.
**Mandatory Tools:** `read_file` `demos/layout.tsx` and `toc.ts`, `create_file` for demo, `replace_string_in_file` for registration.
**Compaction:** Keep demo data structure and component composition.
**Sync:** Commit after route works.

### Batch 7: Polish
**Evolving Context:** Feature complete, needs a11y audit.
**Mandatory Tools:** `run_in_terminal` for test/lint/build, manual keyboard/touch testing.
**Compaction:** Keep only fixes applied.
**Sync:** Final commit.

### Batch 8: Documentation
**Evolving Context:** All code done, exports verified.
**Mandatory Tools:** `read_file` barrel exports, `replace_string_in_file` for JSDoc.
**Compaction:** Keep only export list and JSDoc samples.
**Sync:** Final push.

---

## File Tracking

| File | Status | Batch |
|------|--------|-------|
| `package.json` | Modified | 1 |
| `src/core/dnd/index.ts` | Created | 1 |
| `src/core/dnd/provider.tsx` | Created | 1 |
| `src/core/dnd/types.ts` | Created | 1 |
| `src/core/dnd/hooks/useDraggable.ts` | Created | 2 |
| `src/core/dnd/hooks/useDroppable.ts` | Created | 2 |
| `src/core/dnd/hooks/useSortable.ts` | Created | 2 |
| `src/core/dnd/hooks/useDragDropMonitor.ts` | Created | 2 |
| `src/core/dnd/sensors/touchSensor.ts` | Created | 2 |
| `src/core/dnd/components/DraggableHandle.tsx` | Created | 3 |
| `src/core/dnd/components/DraggableItem.tsx` | Created | 3 |
| `src/core/dnd/components/DroppableZone.tsx` | Created | 3 |
| `src/core/dnd/components/SortableList.tsx` | Created | 4 |
| `src/core/dnd/components/SortableTree.tsx` | Created | 4 |
| `src/core/dnd/components/TreeNode.tsx` | Created | 4 |
| `src/core/dnd/utils/flattenTree.ts` | Created | 4 |
| `src/core/dnd/utils/reorderTree.ts` | Created | 4 |
| `src/core/dnd/utils/cssKeyframes.ts` | Created | 4 |
| `src/core/dnd/plugin.ts` | Created | 5 |
| `src/core/plugins/PluginAPI.tsx` | Modified | 5 |
| `src/core/plugins/HookRegistry.ts` | Modified | 5 |
| `src/core/ui/index.ts` | Modified | 1, 8 |
| `src/modules/example/pages/demos/dnd-tree.tsx` | Created | 6 |
| `src/modules/example/pages/toc.ts` | Modified | 6 |
| `src/modules/example/routes.tsx` | Modified | 6 |
| `src/index.css` | Modified | 4, 7 (keyframes) |

---

## Git Strategy

- **Branch:** `feature/dnd-kit-core-utility` from `main`
- **Commits:** Per batch (8 commits)
- **Push:** After Batch 8 approval

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Nested SortableContext conflicts | Flatten tree to single context (proven pattern) |
| Ark UI portal + AnimatePresence crash | CSS keyframes only, no Framer Motion for drag |
| Mobile touch scroll interference | Handle-only drag, `touch-action: none` on handle |
| Plugin API breaking changes | Additive only — new `dnd` property, new `registerDndCollection` |
| Barrel export collision | Namespace under `dnd` (not top-level) |
| Tree performance on large datasets | Virtualization deferred; current scope <500 nodes |

---

## Success Criteria

1. **Core utility** loads and works in isolation
2. **Modules** import `dnd` from `@/core/ui` and build sortable UIs
3. **Plugins** access `PluginAPIContext.dnd` and register collections
4. **Example tree demo** at `/example/category/drag-drop` demonstrates:
   - Nested hierarchical data (3+ levels)
   - Drag to reorder siblings
   - Drag to change parent (move between branches)
   - Expand/collapse nodes
   - Keyboard navigation
   - Touch drag on mobile
5. **Zero regressions** in existing modules/plugins