# Findings: dnd-kit v8+ Upgrade

## Parser Bug Root Cause

**Error:** `Transform failed: Expected ">" but found "<"` at `</Dragndrop.SortableList>` in `BuilderPage.tsx`

**Cause:** Rollup/esbuild parser bug when:
1. A function returning JSX is defined in the **same file** as a component
2. That function is used as a prop in JSX: `<Component renderItem={fn} />`

The parser's cross-file JSX analysis gets confused by the function's JSX return type.

**Workaround (v2 era):** Move render function to separate non-component file. **Root fix (v8+):** Eliminate `renderItem` pattern entirely — use `useSortable` hook directly with inline component mapping.

---

## v8+ Hook Patterns (Official)

### Flat List (replaces SortableList)
```tsx
import { useSortable } from '@dnd-kit/react/sortable'

function MyList({ items, onReorder }) {
  const { handleDragEnd } = useSortable({ items, onReorder }) // Not actual API
  
  // Actual v8 pattern: use useSortable on EACH item
  return items.map((item, index) => (
    <MyItem key={item.id} item={item} index={index} />
  ))
}

function MyItem({ item, index }) {
  const { ref, isDragging, handleRef } = useSortable({ 
    id: item.id, 
    index,
    data: { /* custom data for projection */ }
  })
  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <button ref={handleRef}>☰</button>
      {item.label}
    </div>
  )
}
```

### Tree (replaces SortableTree)
```tsx
// Same pattern — each node gets useSortable
// Container manages flattening, depth projection, descendant handling
// Use DragDropProvider at tree root (one per tree)
```

### Sensors (v8)
```tsx
import { PointerSensor, KeyboardSensor } from '@dnd-kit/dom'
import { useSensor, useSensors } from '@dnd-kit/react'

const sensors = useSensors(
  useSensor(PointerSensor, { 
    activationConstraint: { 
      distance: 8, 
      tolerance: 5 
    } 
  }),
  useSensor(KeyboardSensor, { 
    coordinateGetter: sortableKeyboardCoordinates 
  })
)
```

### Drag Overlay
```tsx
import { DragOverlay } from '@dnd-kit/react'

<DragOverlay dropAnimation={null}>
  {({ source }) => (
    <div>{source?.data?.label}</div>
  )}
</DragOverlay>
```

---

## v2 → v8 Migration Mapping

| v2 (0.5.0) | v8+ |
|------------|-----|
| `@dnd-kit/react` (core + sortable) | `@dnd-kit/react` + `@dnd-kit/sortable` |
| Custom `SortableList` wrapper | Direct `useSortable` per item |
| Custom `SortableTree` wrapper | Direct `useSortable` per node + flattening logic |
| `renderItem` prop | Inline component mapping |
| `DragDropProvider` (app-level) | `DragDropProvider` per tree (isolated) |
| `createDefaultSensors()` | `useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))` |
| `DragOverlay` from `@dnd-kit/react` | `DragOverlay` from `@dnd-kit/react` (same) |
| `move()` from `@dnd-kit/helpers` | `move()` from `@dnd-kit/sortable` |
| `useSortable` from `@dnd-kit/react/sortable` | `useSortable` from `@dnd-kit/sortable` |

---

## Consumer Impact Analysis

### 1. JourneySettingsManager.tsx
- **Uses:** `SortableTree` with `renderRow` (custom grid row with handle, expand/collapse, stage cells)
- **Impact:** Low — same import, same props. `renderRow` helpers interface unchanged.
- **Verify:** `handleTreeReorder` callback, `renderRow` receives `handleRef`, `isDragging`, `isExpanded`, `hasChildren`, `onToggle`

### 2. SortableStageColumns.tsx
- **Need to check:** Does it use `SortableList`?
- **If yes:** Refactor to `useSortableList` hook
- **If no:** No changes needed

### 3. dnd-tree.tsx (example)
- **Uses:** `SortableTree` with default rendering (no `renderRow`)
- **Impact:** Zero — same import, same `TreeNode` data structure, same `onReorder` callback

### 4. BuilderPage.tsx
- **Uses:** `Dragndrop.SortableList` with inline `renderFieldCardItem` function
- **Impact:** **High** — this is the source of the parser bug
- **Fix:** Replace with `useSortableList` hook + direct `.map()` rendering

---

## Tree Logic Preservation

**DO NOT CHANGE** — these work identically in v8:
- `flattenTree()` — converts nested tree → flat array with depth/parentId
- `buildTree()` — converts flat array → nested tree
- `getProjection()` — computes target depth/parentId from horizontal drag offset
- `getDragDepth()` — converts pixel offset → depth levels
- `getDescendants()` — finds all descendants of a node
- `move()` from `@dnd-kit/sortable` — array reorder helper

Only the **React component layer** changes (how `useSortable` is called and how items are rendered).

---

## Sensor Config (v8)

```tsx
// src/core/dragndrop/sensors/index.ts
import { PointerSensor, KeyboardSensor } from '@dnd-kit/dom'
import { useSensor, useSensors } from '@dnd-kit/react'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

export function createDefaultSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
}
```

---

## Files to Delete (Obsolete v2 Wrappers)

```
src/core/dragndrop/components/SortableList.tsx
src/core/dragndrop/components/DraggableItem.tsx
src/core/dragndrop/components/DraggableHandle.tsx
src/core/dragndrop/components/DroppableZone.tsx
src/core/dragndrop/hooks/useDragndrop.ts
```

---

## Test Strategy

**TDD per batch:**
1. Write failing test for new behavior
2. Run test → verify fails
3. Implement
4. Run test → verify passes

**Key test files to create/update:**
- `SortableTree.v8.test.tsx` — tree render, reorder, expand/collapse
- `useSortableList.test.tsx` — flat list reorder
- `JourneySettingsManager.tree.test.tsx` — integration
- `dnd-tree.v8.test.tsx` — example integration
- `BuilderPage.sortable.test.tsx` — form builder integration

---

## Lessons Learned (for decision.md)

1. **Wrapper components cause parser bugs** — The `renderItem` pattern with inline JSX functions triggers Rollup/esbuild cross-file analysis failures. v8's hook-based composition avoids this entirely.

2. **Tree logic is portable** — The flattening/projection algorithms are pure functions, unchanged between v2 and v8. Only the React integration layer changes.

3. **Sensor API changed** — v2 had `createDefaultSensors()` helper; v8 uses `useSensors` + `useSensor` hooks with `PointerSensor`/`KeyboardSensor` from `@dnd-kit/dom`.

4. **One DragDropProvider per tree** — v8 isolates drag contexts per tree instance, preventing cross-tree interference.

5. **`useSortable` data prop** — Still accepts custom data (depth, parentId, label) for projection calculations. API stable.

6. **DragOverlay** — `dropAnimation={null}` + CSS keyframes pattern still works. Overlay receives `source` with `source.data`.

7. **Migration is mechanical** — Replace `SortableList` → `.map(item => <Item key={item.id} ... />)` with `useSortable` inside `Item`. Replace `SortableTree` → same pattern with tree flattening in parent.