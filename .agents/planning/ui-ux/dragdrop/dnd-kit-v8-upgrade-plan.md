# dnd-kit v8+ Upgrade & Full Refactor Plan

**Goal:** Upgrade from @dnd-kit v2 (0.5.0) to v8+ and refactor all custom wrapper components to use modern hook-based API, eliminating the `renderItem` parser bug.

**Approach:** 
- Upgrade all @dnd-kit packages to latest v8+
- Replace custom `SortableList` / `SortableTree` wrappers with direct `useSortable` hook usage
- Update all consumers: `JourneySettingsManager.tsx`, `dnd-tree.tsx`, `BuilderPage.tsx`
- Remove obsolete wrapper components and legacy utilities
- Maintain all existing functionality: tree nesting, expand/collapse, drag overlay, touch/mouse sensors

**Branch:** `feat/dnd-kit-v8-upgrade` (from `main`)

**Scope:**
- **In:** Package upgrades, core dragndrop refactor, consumer updates (JourneySettingsManager, dnd-tree, BuilderPage), test updates, cleanup
- **Out:** New features, UI redesign, virtualization, cross-tree drag (deferred)

---

## Phase 1: Setup & Dependencies

### Batch 1.1: Upgrade Packages
**Context:** Current: v2 (0.5.0) with custom wrappers → Target: v8+ with direct hook usage

**Todo:**
- [ ] `pnpm add @dnd-kit/react@latest @dnd-kit/dom@latest @dnd-kit/abstract@latest @dnd-kit/helpers@latest @dnd-kit/collision@latest @dnd-kit/sortable@latest @dnd-kit/accessibility@latest`
- [ ] Verify `package.json` shows v8+ versions
- [ ] Run `pnpm install` to update lockfile
- [ ] **Commit:** `chore: upgrade @dnd-kit to v8+`

### Batch 1.2: Create New Modern Hooks
**Context:** Packages upgraded → Need modern typed hooks replacing old wrapper hooks

**Todo:**
- [ ] Create `src/core/dragndrop/hooks/useSortableTree.ts` — modern tree hook using `useSortable` directly
- [ ] Create `src/core/dragndrop/hooks/useSortableList.ts` — modern flat list hook using `useSortable` directly
- [ ] Create `src/core/dragndrop/hooks/useDragOverlay.ts` — overlay hook
- [ ] Create `src/core/dragndrop/hooks/useSensors.ts` — sensor configuration hook
- [ ] **Commit:** `feat: add modern dnd-kit v8 hooks`

---

## Phase 2: Core Component Refactor

### Batch 2.1: Refactor SortableTree
**Context:** New hooks exist → Replace custom `SortableTree` with modern implementation

**Todo:**
- [ ] **Write failing test** for new `SortableTree` — renders tree, supports reorder, expand/collapse
  - Code: `src/core/dragndrop/components/__tests__/SortableTree.v8.test.tsx`
- [ ] **Run test** → `pnpm test -- SortableTree.v8`
- [ ] Implement new `SortableTree` in `src/core/dragndrop/components/SortableTree.tsx`:
  - Use `useSortable` directly on each node (no custom `SortableItem` wrapper)
  - Use `useSensors` hook for sensor config
  - Use `useDragOverlay` for overlay
  - Flatten tree internally, manage `expanded` state
  - Accept `renderNode` and `renderRow` props (same API for consumers)
- [ ] **Run test** → verify pass
- [ ] **Commit:** `refactor: modernize SortableTree for dnd-kit v8`

### Batch 2.2: Remove SortableList Wrapper
**Context:** `SortableTree` refactored → Replace `SortableList` with direct `useSortable` usage

**Todo:**
- [ ] **Write failing test** for `useSortableList` hook — flat list reorder
  - Code: `src/core/dragndrop/hooks/__tests__/useSortableList.test.tsx`
- [ ] **Run test** → `pnpm test -- useSortableList`
- [ ] Implement `useSortableList` hook (returns item components with refs)
- [ ] Create `src/core/dragndrop/components/SortableList.tsx` as thin wrapper using `useSortableList`
- [ ] **Run test** → verify pass
- [ ] **Commit:** `refactor: replace SortableList with useSortableList hook`

### Batch 2.3: Update TreeNode
**Context:** SortableTree refactored → TreeNode needs to work with new API

**Todo:**
- [ ] Update `TreeNode.tsx` to use `useSortable` from `@dnd-kit/react/sortable` (already does, verify compatibility)
- [ ] Ensure `renderRow` helpers work with new flat index approach
- [ ] **Commit:** `refactor: update TreeNode for v8 compatibility`

### Batch 2.4: Update Utilities
**Context:** Components updated → Tree utilities need v8 compatibility check

**Todo:**
- [ ] Review `src/core/dragndrop/utils/tree.ts` — `flattenTree`, `buildTree`, `getProjection`, `getDragDepth` (logic unchanged, verify)
- [ ] Review `src/core/dragndrop/utils/reorderTree.ts` — verify compatibility
- [ ] Update `src/core/dragndrop/sensors/index.ts` — use v8 sensor API (`PointerSensor`, `KeyboardSensor` from `@dnd-kit/dom`)
- [ ] **Commit:** `refactor: update utilities for v8`

### Batch 2.5: Update Provider & Index
**Context:** Core components refactored → Update barrel exports

**Todo:**
- [ ] Update `src/core/dragndrop/provider.tsx` — use v8 `DragDropProvider`, `DragOverlay` (API compatible)
- [ ] Update `src/core/dragndrop/index.ts` — export new hooks, remove old wrapper exports
- [ ] Update `src/core/ui/index.ts` — ensure `dragndrop` namespace exports modern API
- [ ] **Commit:** `refactor: update provider and exports`

---

## Phase 3: Consumer Updates

### Batch 3.1: Update JourneySettingsManager.tsx
**Context:** Core refactored → Update main consumer (JourneySettingsManager)

**Todo:**
- [ ] **Write failing test** for tree reorder in JourneySettingsManager
  - Code: `src/modules/people/settings/__tests__/JourneySettingsManager.tree.test.tsx`
- [ ] **Run test** → `pnpm test -- JourneySettingsManager.tree`
- [ ] Update `JourneySettingsManager.tsx`:
  - Import `SortableTree` from `@/core/dragndrop` (same import)
  - Verify `renderRow` callback works with new helpers (same interface)
  - Verify `handleTreeReorder` callback signature unchanged
  - Verify `renderColumn` for stages still works with `SortableStageColumns` (separate component)
- [ ] **Run test** → verify pass
- [ ] **Commit:** `refactor: update JourneySettingsManager for dnd-kit v8`

### Batch 3.2: Update SortableStageColumns
**Context:** JourneySettingsManager updated → Stage columns component may need update

**Todo:**
- [ ] Check `src/modules/people/settings/SortableStageColumns.tsx` — uses `SortableList`?
- [ ] If yes, refactor to use `useSortableList` hook directly
- [ ] **Commit:** `refactor: update SortableStageColumns for v8`

### Batch 3.3: Update dnd-tree.tsx Example
**Context:** Core consumers updated → Update example module

**Todo:**
- [ ] **Write failing test** for dnd-tree demo
  - Code: `src/modules/example/pages/demos/__tests__/dnd-tree.v8.test.tsx`
- [ ] **Run test** → `pnpm test -- dnd-tree.v8`
- [ ] Update `dnd-tree.tsx`:
  - Import `SortableTree` from `@/core/dragndrop` (same)
  - Verify tree data structure compatible (TreeNode type)
  - Verify `onReorder` callback works
- [ ] **Run test** → verify pass
- [ ] **Commit:** `refactor: update dnd-tree example for v8`

### Batch 3.4: Update BuilderPage.tsx
**Context:** Example updated → Update forms builder (uses SortableList)

**Todo:**
- [ ] **Write failing test** for BuilderPage field reorder
  - Code: `src/modules/forms/pages/__tests__/BuilderPage.sortable.test.tsx`
- [ ] **Run test** → `pnpm test -- BuilderPage.sortable`
- [ ] Update `BuilderPage.tsx`:
  - Replace `Dragndrop.SortableList` with `useSortableList` hook
  - Replace inline `renderFieldCardItem` with direct component mapping
  - Remove `renderItem` prop pattern, map items directly with `useSortable`
- [ ] **Run test** → verify pass
- [ ] **Commit:** `refactor: update BuilderPage for dnd-kit v8`

---

## Phase 4: Cleanup & Removal

### Batch 4.1: Remove Obsolete Files
**Context:** All consumers migrated → Remove legacy wrapper code

**Todo:**
- [ ] Delete `src/core/dragndrop/components/SortableList.tsx` (replaced by hook)
- [ ] Delete `src/core/dragndrop/components/SortableItem` (internal, was in SortableList)
- [ ] Delete `src/core/dragndrop/hooks/useDragndrop.ts` (legacy)
- [ ] Delete `src/core/dragndrop/components/DraggableItem.tsx` (unused after migration)
- [ ] Delete `src/core/dragndrop/components/DraggableHandle.tsx` (unused after migration)
- [ ] Delete `src/core/dragndrop/components/DroppableZone.tsx` (unused)
- [ ] Delete `src/core/dragndrop/utils/index.ts` (if empty)
- [ ] **Commit:** `chore: remove obsolete dnd-kit v2 wrapper components`

### Batch 4.2: Update Tests
**Context:** Old files removed → Update/remove associated tests

**Todo:**
- [ ] Delete `src/core/dragndrop/components/__tests__/SortableList.test.tsx`
- [ ] Delete `src/core/dragndrop/components/__tests__/DraggableItem.test.tsx`
- [ ] Delete `src/core/dragndrop/components/__tests__/DraggableHandle.test.tsx`
- [ ] Delete `src/core/dragndrop/components/__tests__/DroppableZone.test.tsx`
- [ ] Update `src/core/dragndrop/components/__tests__/SortableTree.test.tsx` for new API
- [ ] Update `src/core/dragndrop/components/__tests__/TreeNode.test.tsx` for new API
- [ ] **Commit:** `test: update tests for dnd-kit v8`

---

## Phase 5: Quality Gates & Verification

### Batch 5.1: Full Test Suite
**Context:** All code updated → Run complete test suite

**Todo:**
- [ ] `pnpm test` — all tests pass
- [ ] `pnpm typecheck` — no TypeScript errors
- [ ] `pnpm lint` — no lint errors
- [ ] `pnpm build` — production build succeeds
- [ ] **Commit:** `chore: quality gates pass`

### Batch 5.2: Manual Verification
**Context:** Automated tests pass → Manual functional verification

**Todo:**
- [ ] Verify `JourneySettingsManager` tree drag/reorder/nesting works
- [ ] Verify `JourneySettingsManager` stage column reorder works
- [ ] Verify `dnd-tree` example both trees work
- [ ] Verify `BuilderPage` field reorder works
- [ ] Verify touch drag on mobile simulator
- [ ] Verify keyboard navigation (Tab, arrows, Enter/Space, Escape)
- [ ] Verify expand/collapse works
- [ ] Verify drag overlay shows correct label + child count
- [ ] Verify reduced-motion disables animations
- [ ] **Commit:** `test: manual verification complete`

---

## Phase 6: Documentation & Archival

### Batch 6.1: Update Decision Log
**Context:** Implementation complete → Capture lessons learned

**Todo:**
- [ ] Read `.agents/planning/ui-ux/dragdrop/decision.md`
- [ ] Add lessons learned:
  - v2 → v8 migration patterns (wrapper → hooks)
  - Parser bug root cause: `renderItem` function in same file as JSX usage
  - Tree flattening logic unchanged, only API surface changed
  - Sensor config: `PointerSensor` + `KeyboardSensor` from `@dnd-kit/dom`
  - Drag overlay: `DragOverlay` with `dropAnimation={null}` + CSS keyframes
  - `useSortable` `data` prop for depth/parentId still works
- [ ] Document any deviations from plan
- [ ] Record performance observations
- [ ] **Commit:** `docs: update decision.md with v8 migration lessons`

### Batch 6.2: Archive Planning Documents
**Context:** Decision log updated → Archive all planning files

**Todo:**
- [ ] Move current plan → `.agents/planning/ui-ux/dragdrop/plan-archive/dnd-kit-v8-upgrade-plan.md`
- [ ] Move findings (if any) → `.agents/planning/ui-ux/dragdrop/plan-archive/findings.md`
- [ ] Move progress (if any) → `.agents/planning/ui-ux/dragdrop/plan-archive/progress.md`
- [ ] Move decision.md → `.agents/planning/ui-ux/dragdrop/plan-archive/decision.md`
- [ ] Verify archive folder contains all docs
- [ ] **Commit:** `chore: archive dnd-kit v8 upgrade planning docs`

---

## Validation Gates

- [ ] All tests pass (`pnpm test`)
- [ ] TypeScript clean (`pnpm typecheck`)
- [ ] Lint clean (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] JourneySettingsManager tree works (drag, nest, expand/collapse)
- [ ] JourneySettingsManager stages reorder works
- [ ] dnd-tree example both trees work
- [ ] BuilderPage field reorder works
- [ ] Touch drag works on mobile
- [ ] Keyboard navigation works
- [ ] Reduced motion respected
- [ ] No parser errors ("Expected > but found <")

---

## File Tracking

| File | Status | Phase |
|------|--------|-------|
| `package.json` | Modified | 1.1 |
| `pnpm-lock.yaml` | Modified | 1.1 |
| `src/core/dragndrop/hooks/useSortableTree.ts` | Created | 1.2 |
| `src/core/dragndrop/hooks/useSortableList.ts` | Created | 1.2 |
| `src/core/dragndrop/hooks/useDragOverlay.ts` | Created | 1.2 |
| `src/core/dragndrop/hooks/useSensors.ts` | Created | 1.2 |
| `src/core/dragndrop/components/SortableTree.tsx` | Modified | 2.1 |
| `src/core/dragndrop/components/TreeNode.tsx` | Modified | 2.3 |
| `src/core/dragndrop/components/SortableList.tsx` | **Deleted** | 4.1 |
| `src/core/dragndrop/hooks/useDragndrop.ts` | **Deleted** | 4.1 |
| `src/core/dragndrop/components/DraggableItem.tsx` | **Deleted** | 4.1 |
| `src/core/dragndrop/components/DraggableHandle.tsx` | **Deleted** | 4.1 |
| `src/core/dragndrop/components/DroppableZone.tsx` | **Deleted** | 4.1 |
| `src/core/dragndrop/utils/tree.ts` | Modified | 2.4 |
| `src/core/dragndrop/sensors/index.ts` | Modified | 2.4 |
| `src/core/dragndrop/provider.tsx` | Modified | 2.5 |
| `src/core/dragndrop/index.ts` | Modified | 2.5 |
| `src/modules/people/settings/JourneySettingsManager.tsx` | Modified | 3.1 |
| `src/modules/people/settings/SortableStageColumns.tsx` | Modified | 3.2 |
| `src/modules/example/pages/demos/dnd-tree.tsx` | Modified | 3.3 |
| `src/modules/forms/pages/BuilderPage.tsx` | Modified | 3.4 |
| Test files | Modified/Deleted | 4.2, 5.1 |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API breaking changes in v8 | Test each hook in isolation first; use official migration guide |
| Tree nesting logic regression | Keep `flattenTree`/`buildTree`/`getProjection` unchanged; only API surface changes |
| Parser bug reappears | Ensure no function returning JSX in same file as component using it |
| SortableStageColumns uses SortableList | Check and migrate in Batch 3.2 |
| Test coverage gaps | Write failing tests first for each migration (TDD) |
| Build regression | Run `pnpm build` after each batch |

---

## Success Criteria

1. **All @dnd-kit packages at v8+** (verified in `package.json`)
2. **Zero custom wrapper components** — `SortableList`, `SortableItem`, `DraggableItem`, `DraggableHandle`, `DroppableZone` removed
3. **All consumers use modern hooks** — `useSortable`, `useSortableList`, `useSortableTree`
4. **Parser bug eliminated** — no "Expected > but found <" errors
5. **All functionality preserved** — tree nesting, expand/collapse, drag overlay, stage columns, form builder
6. **All quality gates pass** — tests, typecheck, lint, build