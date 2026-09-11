# useDragOperation — dnd kit for React

> Source: https://dndkit.com/react/hooks/use-drag-operation/
> Reactive snapshot of the current drag's `source`/`target`. Any component inside a `DragDropProvider` can call it and re-render on change — no manual event subscriptions.

## When to use

Ambient awareness of an in-progress drag: highlight a drop zone, render an overlay, disable an unrelated UI affordance.

## Usage

```jsx
import {useDragOperation} from '@dnd-kit/react';

function DraggingIndicator() {
  const {source, target} = useDragOperation();

  if (!source) return null;

  return (
    <div role="status" aria-live="polite">
      Dragging <strong>{String(source.id)}</strong>
      {target ? <> over <strong>{String(target.id)}</strong></> : ' over no target'}
    </div>
  );
}
```

## Output

| Prop | Type | Notes |
|------|------|-------|
| `source` | `Draggable \| undefined` | Currently dragged element; `undefined` when idle. |
| `target` | `Droppable \| undefined` | Droppable the source is over; `undefined` if none. |

## Alternatives

- [use-drag-drop-monitor](use-drag-drop-monitor.md) — lifecycle events (`dragstart`, `dragmove`, `dragover`, `dragend`)
- [use-drag-drop-manager](use-drag-drop-manager.md) — raw manager access