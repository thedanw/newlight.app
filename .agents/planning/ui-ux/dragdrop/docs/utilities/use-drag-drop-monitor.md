# useDragDropMonitor — dnd kit for React

> Source: https://dndkit.com/react/hooks/use-drag-drop-monitor/
> Monitors drag/drop events inside a `DragDropProvider` without binding to a specific element. Must be used inside a provider. Handlers receive `(event, manager)`.

## Usage

```jsx
import {useDragDropMonitor} from '@dnd-kit/react';

function DragMonitor() {
  useDragDropMonitor({
    onBeforeDragStart(event, manager) {
      if (shouldPreventDrag(event.operation.source)) event.preventDefault();
    },
    onDragStart(event, manager) { console.log('Started dragging', event.operation.source); },
    onDragMove(event, manager)  { console.log('Current position:', event.operation.position); },
    onDragOver(event, manager)  { console.log('Over droppable:', event.operation.target); },
    onDragEnd(event, manager) {
      const {operation, canceled} = event;
      if (canceled) return console.log('Drag cancelled');
      if (operation.target) console.log(`Dropped ${operation.source.id} onto ${operation.target.id}`);
    },
    onCollision(event, manager) { console.log('Collisions:', event.collisions); },
  });

  return null;
}
```

## Events

| Event | Preventable | Data |
|-------|-------------|------|
| `beforeDragStart` | Yes | `operation` |
| `dragStart` | No | `operation`, `nativeEvent` |
| `dragMove` | **Yes** | `operation`, `to`, `by`, `nativeEvent` |
| `dragOver` | Yes | `operation` |
| `collision` | Yes | `collisions` |
| `dragEnd` | No | `operation`, `canceled`, `nativeEvent` |

`event.preventDefault()` on preventable events stops their default behavior.

## Notes

- `dragEnd.canceled` **replaces the old `onDragCancel` event**.

## Related

- [use-drag-operation](use-drag-operation.md)
- [use-sortable](../hooks/use-sortable.md)