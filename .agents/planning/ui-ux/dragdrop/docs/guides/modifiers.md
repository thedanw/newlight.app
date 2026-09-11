# Modifiers — dnd kit for React

> Source: https://dndkit.com/react/guides/modifiers/
> Modifiers transform draggable movement: restrict to axis/bounds, snap to grid, custom logic. Set globally on `DragDropProvider` (all children) or per-draggable via `useDraggable`/`useSortable` `modifiers` (takes precedence over global). Multiple modifiers apply in order.

## Built-in modifiers

| Modifier | Import | Effect |
|----------|--------|--------|
| `RestrictToElement` | `@dnd-kit/dom/modifiers` | Clamp to container element |
| `RestrictToWindow` | `@dnd-kit/dom/modifiers` | Clamp to viewport |
| `RestrictToVerticalAxis` | `@dnd-kit/abstract/modifiers` | Lock Y movement |
| `RestrictToHorizontalAxis` | `@dnd-kit/abstract/modifiers` | Lock X movement |
| `SnapModifier` | `@dnd-kit/abstract/modifiers` | Snap to grid: `configure({size})` — `size` = number or `{x, y}` |

## Apply

```jsx
import {useDraggable} from '@dnd-kit/react';
import {RestrictToVerticalAxis} from '@dnd-kit/abstract/modifiers';

function VerticalOnlyDraggable() {
  const {ref} = useDraggable({
    id: 'vertical-only',
    modifiers: [RestrictToVerticalAxis],
  });

  return <div ref={ref}>I can only move vertically</div>;
}
```

Full examples (container ref, window, axis, snap grid, combine, global vs per-draggable): [refs/modifier-examples.md](../refs/modifier-examples.md)

## Related

- [use-draggable](../hooks/use-draggable.md)
- [Sensors guide](https://dndkit.com/react/guides/sensors)
- [Modifiers reference](https://dndkit.com/extend/modifiers)