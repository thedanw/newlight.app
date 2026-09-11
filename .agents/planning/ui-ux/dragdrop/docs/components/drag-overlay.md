# DragOverlay — dnd kit for React

> Source: https://dndkit.com/react/components/drag-overlay/
> Role: Renders a custom overlay while dragging — a different element than the source (styled clone, preview, simplified). Children render **only during an active drag**.

## Usage

```jsx
import {useDraggable, DragOverlay} from '@dnd-kit/react';

function Draggable() {
  const {ref} = useDraggable({id: 'draggable'});

  return (
    <>
      <button ref={ref}>Draggable</button>
      <DragOverlay><div>I will be rendered while dragging...</div></DragOverlay>
    </>
  );
}
```

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `children` | `ReactNode \| ((source: Draggable) => ReactNode)` | — | Function child receives drag `source`. |
| `tag` | `string` | `'div'` | Overlay wrapper tag. |
| `disabled` | `boolean \| ((source: Draggable \| null) => boolean)` | — | Disable overlay; function form gets `source`. |
| `dropAnimation` | `DropAnimation \| null` | `undefined` | End-of-drag animation. |
| `className` | `string` | — | Wrapper class. |
| `style` | `React.CSSProperties` | — | Wrapper style. |

### dropAnimation modes

- `undefined` — default (250ms ease)
- `null` — disabled
- `{duration, easing}` — custom timing
- `(context) => Promise<void> | void` — custom fn (`context`: `element`, `feedbackElement`, `translate`)

Full examples (per-source content, animation variants): [refs/drag-overlay-examples.md](../refs/drag-overlay-examples.md)

## Related

- [drag-drop-provider](drag-drop-provider.md)
- [use-draggable](../hooks/use-draggable.md)