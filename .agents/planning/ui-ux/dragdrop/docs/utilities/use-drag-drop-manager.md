# useDragDropManager — dnd kit for React

> Source: https://dndkit.com/react/hooks/use-drag-drop-manager/
> Returns the `DragDropManager` from the nearest `DragDropProvider`. Advanced use only.

## When to use

- Register custom listeners on `manager.monitor`
- Look up plugins via `manager.registry`
- Dispatch actions imperatively

Prefer `useDragOperation`, `useDragDropMonitor`, or provider event handlers for most cases (rendering UI from drag state, reordering in `onDragEnd`).

## Usage

```jsx
import {useDragDropManager} from '@dnd-kit/react';
import {useEffect} from 'react';

function DragLogger() {
  const manager = useDragDropManager();

  useEffect(() => {
    if (!manager) return;

    const cleanup = manager.monitor.addEventListener('dragstart', (event) => {
      console.log('drag started for', event.operation.source.id);
    });

    return cleanup;
  }, [manager]);

  return null;
}
```

## Output

| Prop | Type | Notes |
|------|------|-------|
| `manager` | `DragDropManager \| null` | Nearest provider's manager, or a **shared default manager** if no provider is present. |

## Related

- [use-drag-operation](use-drag-operation.md)
- [use-drag-drop-monitor](use-drag-drop-monitor.md)
- [DragDropManager reference](https://dndkit.com/concepts/drag-drop-manager)