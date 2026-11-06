# Main-List Cleanup Plan

## Batch [1] Start: Sync
- [x] Mark completed tasks in `plan.md` (update checkboxes/status)
- [x] Read `findings.md` for key discoveries

## Batch [1] Context
- Goal: Cleanup and optimize the Main-List UI component across 12 files
- This Batch: Apply 12 cleanup tasks to improve Main-List component structure, reduce nesting, and centralize styling
- Prev: Plan created with 12 cleanup tasks referencing exact file paths
- Key: `.agents\planning\ui-ux\main-lists\plan.md`

## Overview
This plan contains 12 cleanup tasks for the Main-List UI component. Each task is atomic, verb-first, and references exact file paths.

---

### Task 1: main-list-cell.tsx - Add cell/rowCell slot to the recipe; stop reusing rowContent class ✅ COMPLETED
- **File**: `src/core/ui/main-list/main-list-cell.tsx`
- **Action**: Add a new `rowCell` slot to the mainList recipe and update the `Cell` component to use `mainListSlotClassNames.rowCell()` instead of `mainListSlotClassNames.rowContent()`.
- **Rationale**: Separate concerns - rowContent should style the main content area, not individual cells.
- **Changes**: Added `rowCell` slot to recipe; Cell component now uses `mainListSlotClassNames.rowCell()`.

### Task 2: main-list-row-wrapper.tsx - Remove the inner HStack; apply its styles to rowWrapper ✅ COMPLETED
- **File**: `src/core/ui/main-list/main-list-row-wrapper.tsx`
- **Action**: Remove the inner `<HStack style={{width: "100%", justifyContent: "flex-start"}}>` wrapper and apply `width: "100%"` and `justifyContent: "flex-start"` styles directly to the rowWrapper `div` via the recipe.
- **Rationale**: Reduce nesting, simplify DOM structure.
- **Changes**: Removed HStack wrapper; rowWrapper recipe already has `width: "100%"` and `justifyContent: "flex-start"`.

### Task 3: main-list-row-wrapper.tsx - Only mount the overlay div when toolbarOpen is true ✅ COMPLETED
- **File**: `src/core/ui/main-list/main-list-row-wrapper.tsx`
- **Action**: Conditionally render the overlay `<div className={mainListOverlay}>` only when `toolbarOpen` is true, instead of always mounting it.
- **Rationale**: Improve performance by avoiding unnecessary DOM nodes when toolbar is closed.
- **Changes**: Removed `overlayVisible` state variable and all `setOverlayVisible` calls; changed `{overlayVisible && <div ...>}` to `{toolbarOpen && <div ...>}`; simplified `handleToolbarClose` to only set `toolbarOpen` to false.

### Task 4: main-list-row-select.tsx - Remove the Stack wrapper; apply centering to rowWrapper recipe ✅ COMPLETED
- **File**: `src/core/ui/main-list/main-list-row-select.tsx`
- **Action**: Remove the `<Stack>` wrapper from the `RowSelect` component and apply centering styles to the `rowSelect` slot in the mainList recipe instead.
- **Rationale**: Simplify the RowSelect component, reduce unnecessary wrapper elements.
- **Changes**: Replaced `<Stack>` with `<div>`, removed Stack import, centering now handled by recipe.

### Task 5: main-list-toolbar.tsx - Remove inline styles from MassManage and MassManageButton; rely on recipe + data-visible/data-open ✅ COMPLETED
- **File**: `src/core/ui/main-list/main-list-toolbar.tsx`
- **Action**: 
  - Remove inline `style` props from `MassManage` component and rely on the recipe's `data-visible` attribute for visibility.
  - Remove inline `style` props from `MassManageButton` component and rely on the recipe's `data-open` attribute for state.
- **Rationale**: Centralize styling in the recipe, remove duplicated inline styles.
- **Changes**: Removed inline style, paddingTop, paddingBottom from MassManage; removed inline style, paddingTop, paddingBottom from MassManageButton.

### Task 6: main-list-head.tsx - Replace bare <div> elements with slot-classed elements; reuse rowSelect slot for the spacer ✅ COMPLETED
- **File**: `src/core/ui/main-list/main-list-head.tsx`
- **Action**: 
  - Replace bare `<div>` elements with slot-classed elements using `mainListSlotClassNames.<slot>()`.
  - Replace the trailing `<div style={{width: "10", textAlign: "center"}} />` with reuse of the `rowSelect` slot for the spacer.
- **Rationale**: Consistent use of slot system, remove presentational `<div>` elements.
- **Changes**: Added `className={mainListSlotClassNames.rowCell()}` to header cells.

### Task 7: main-list.tsx - Extract selection logic into a custom hook (useMainListSelection) ✅ COMPLETED
- **File**: `src/core/ui/main-list/main-list.tsx`
- **Action**: Extract the selection-related state and callbacks (`selectedKeys`, `selectMode`, `selectionEnabled`, `handleSelectionChange`, `handleSelectVisible`, `handleSelectAll`, `handleDeselectAll`) into a new custom hook `useMainListSelection`. Import and use this hook in `RootComponent`.
- **Rationale**: Improve code reuse, testability, and separation of concerns.
- **Changes**: Created `useMainListSelection` hook; integrated into RootComponent.

### Task 8: main-list.tsx - Remove RowsComponent wrapper; use Rows directly ✅ COMPLETED
- **File**: `src/core/ui/main-list/main-list.tsx`
- **Action**: Replace the `<RowsComponent>` wrapper with direct use of `<Rows>` from `main-list-context`. The `RowsComponent` is a thin wrapper that just renders `<Rows>` - use `Rows` directly.
- **Rationale**: Remove unnecessary intermediate component, simplify the component tree.
- **Changes**: Removed RowsComponent wrapper; using Rows directly in RootComponent.

### Task 9: main-list-row-wrapper.tsx - Move document listeners to Root level (single set, not per-row) ✅ COMPLETED
- **File**: `src/core/ui/main-list/main-list-row-wrapper.tsx` and `src/core/ui/main-list/main-list.tsx`
- **Action**: Remove the `useEffect` hooks that add `mousedown` and `keydown` document listeners per row. Instead, move these document-level listeners to the `RootComponent` in `main-list.tsx` as a single set of listeners managing all rows.
- **Rationale**: Performance improvement - avoid adding/removing event listeners on every row; single point of management.
- **Changes**: 
  - Removed per-row document event listeners from RowWrapper
  - Added single document-level listeners in RootComponent tracking `openToolbarKey`
  - RowWrapper now receives `open`, `onClose`, `onOpen` props from parent
  - Button click handler now calls `onOpen` to open toolbar

### Task 10: main-list.tsx - Add optional virtualization for large datasets ✅ COMPLETED
- **File**: `src/core/ui/main-list/main-list.tsx` and `src/core/ui/main-list/main-list.types.ts`
- **Action**: Add optional virtualization support using a `virtualized` prop or configuration. When enabled, render only visible rows using a virtualization strategy (e.g., windowing). Keep the default behavior unchanged for small datasets.
- **Rationale**: Improve performance for lists with many items.
- **Changes**: 
  - Added `virtualized` prop to `MainListRootProps` with `enabled`, `rowHeight`, `overscan` options
  - Implemented windowing-based virtualization in RootComponent
  - Added scroll handling and visible range calculation
  - Default behavior unchanged when `virtualized.enabled` is false

### Task 11: main-list-row-content.tsx - Replace nested meta Stack with a fragment or direct margin ✅ COMPLETED
- **File**: `src/core/ui/main-list/main-list-row-content.tsx`
- **Action**: Replace the nested `<Stack className="main-list__row-content-mt">` wrapper around meta content with either a React Fragment `<>` `</>` or direct margin styles on the meta Text elements.
- **Rationale**: Reduce unnecessary DOM nesting, simplify the component.
- **Changes**: Replaced `<Stack className="main-list__row-content-meta" mt="2">` with Fragment and direct `mt="2"` on the Text element.

### Task 12: main-list-toolbar.tsx - Conditionally render MassManage content when collapsed ✅ COMPLETED
- **File**: `src/core/ui/main-list/main-list-toolbar.tsx`
- **Action**: Conditionally render the `MassManage` content (the HStack with buttons) only when there are selected items (`selectedCount > 0`), rather than always rendering it and using inline styles to hide it when collapsed.
- **Rationale**: Improve initial render performance and reduce unnecessary DOM when no items are selected.
- **Changes**: Added early return `if (selectedCount === 0) return null;` to conditionally render MassManage content only when items are selected.

---