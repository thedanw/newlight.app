# dnd-kit Legacy v10 vs Current v2 API — Agent Reference

## Quick Version Map

| Era | Packages | Version | Status |
|-----|----------|---------|--------|
| **Legacy (Old)** | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`, `@dnd-kit/utilities` | v6, v10, v9, v3 | **Deprecated** |
| **Current (New)** | `@dnd-kit/react`, `@dnd-kit/react/sortable`, `@dnd-kit/helpers`, `@dnd-kit/abstract`, `@dnd-kit/dom` | v0.5.0 | **Active** |

**Key Insight**: Version numbers are INVERTED — legacy = higher (v10), current = lower (v0.5.0).

## API Migration Map

| Legacy (v10) | Current (v2) |
|--------------|--------------|
| `DndContext` | `DragDropProvider` |
| `SortableContext` | Built into `DragDropProvider` |
| `useSortable` from `@dnd-kit/sortable` | `useSortable` from `@dnd-kit/react/sortable` |
| `useDraggable`/`useDroppable` from `@dnd-kit/core` | `useDraggable`/`useDroppable` from `@dnd-kit/react` |
| `arrayMove` from `@dnd-kit/sortable` | `move` from `@dnd-kit/helpers` |
| `useSensor`/`useSensors` | Built into `DragDropProvider` |
| `MouseSensor`/`TouchSensor` | `PointerSensor` from `@dnd-kit/dom` |
| `KeyboardSensor` | `KeyboardSensor` from `@dnd-kit/dom` |
| `DragOverlay` from `@dnd-kit/core` | `DragOverlay` from `@dnd-kit/react` |
| `DragEndEvent.canceled` | `!DragEndEvent.over` |
| `collisionDetection` on DndContext | `collisionDetector` on `useDroppable`/`useSortable` |
| `useSensor`/`useSensors` hooks | Built-in; customize via `sensors` prop |

## Import Path Changes

```ts
// Legacy (REMOVE)
import { DndContext, DragOverlay, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable'
import { MouseSensor, TouchSensor, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'

// Current (ADD)
import { DragDropProvider, DragOverlay, useDraggable, useDroppable, useSortable } from '@dnd-kit/react'
import { move } from '@dnd-kit/helpers'
import { CollisionPriority } from '@dnd-kit/abstract'
import { PointerSensor, KeyboardSensor } from '@dnd-kit/dom'
```

## Package.json Updates

```json
{
  "dependencies": {
    "@dnd-kit/react": "^0.5.0",
    "@dnd-kit/react/sortable": "^0.5.0",
    "@dnd-kit/helpers": "^0.5.0",
    "@dnd-kit/abstract": "^0.5.0",
    "@dnd-kit/dom": "^0.5.0",
    "@dnd-kit/collision": "^0.5.0",
    "@dnd-kit/dom/modifiers": "^0.5.0",
    "@dnd-kit/abstract/modifiers": "^0.5.0"
  }
}
```

## Critical Code Patterns

### Provider Setup
```tsx
// Legacy
<DndContext sensors={sensors} onDragEnd={handleDragEnd}>

// Current
<DragDropProvider sensors={sensors} onDragEnd={handleDragEnd}>
```

### useSortable Hook
```tsx
// Legacy
const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, index })

// Current
const { ref, isDragging } = useSortable({ id, index })
// ref wires drag + drop together; split via sourceRef/targetRef if needed
```

### Reorder Helper
```tsx
// Legacy
import { arrayMove } from '@dnd-kit/sortable'
const reordered = arrayMove(items, from, to)

// Current
import { move } from '@dnd-kit/helpers'
const reordered = move(items, event) // handles cross-list moves
```

### DragEnd Cancellation
```tsx
// Legacy
onDragEnd={(event) => { if (event.canceled) return; ... }}

// Current
onDragEnd={(event) => { if (!event.over) return; ... }}
```

### Sortable Columns (Empty Drop Zones)
```tsx
import { useDroppable } from '@dnd-kit/react'
import { CollisionPriority } from '@dnd-kit/abstract'

function Column({ id, children }) {
  const { ref } = useDroppable({ id, collisionPriority: CollisionPriority.Low })
  return <div ref={ref}>{children}</div>
}
```

### Sensors (v2)
```tsx
import { PointerSensor, KeyboardSensor } from '@dnd-kit/dom'

<DragDropProvider sensors={[
  PointerSensor,
  KeyboardSensor
]}>
```

## URL Reference

| Type | URL |
|------|-----|
| Current Docs | `https://dndkit.com/react/...` |
| Migration Guide | `https://dndkit.com/react/guides/migration` |
| Legacy (avoid) | `https://dndkit.com/legacy/...` |

## Files in This Project Needing Migration

```
src/core/dragndrop/components/SortableTree.tsx
src/core/dragndrop/components/SortableStageColumns.tsx
src/core/dragndrop/components/TreeNode.tsx
src/core/dragndrop/hooks/useSortableTree.ts
src/core/dragndrop/hooks/useSortableList.ts
src/core/dragndrop/hooks/useSensors.ts
src/core/dragndrop/sensors/index.ts
src/core/dragndrop/provider.tsx
src/modules/people/settings/SortableStageColumns.tsx
src/modules/people/settings/JourneySettingsManager.tsx (consumer)
```

## Quick Verification Checklist

- [ ] `DragDropProvider` from `@dnd-kit/react` (not `DndContext`)
- [ ] `useSortable` from `@dnd-kit/react/sortable`
- [ ] `move` from `@dnd-kit/helpers` (not `arrayMove`)
- [ ] `DragOverlay` from `@dnd-kit/react`
- [ ] `DragEndEvent` uses `!event.over` for cancel check
- [ ] Columns use `useDroppable` with `CollisionPriority.Low`
- [ ] Sensors from `@dnd-kit/dom` (`PointerSensor`, `KeyboardSensor`)
- [ ] `@dnd-kit/react`, `@dnd-kit/helpers`, `@dnd-kit/abstract` in deps