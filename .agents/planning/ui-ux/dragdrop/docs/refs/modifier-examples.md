# Modifiers — Full Examples

> Referenced by: [modifiers.md](../guides/modifiers.md), [use-draggable.md](../hooks/use-draggable.md)
> Source: https://dndkit.com/react/guides/modifiers/

## Restrict to a container element

`element` is configured as a function so it resolves the latest ref value:

```jsx
import {useRef} from 'react';
import {DragDropProvider, useDraggable} from '@dnd-kit/react';
import {RestrictToElement} from '@dnd-kit/dom/modifiers';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <DragDropProvider>
      <div ref={containerRef} style={{width: 400, height: 400, position: 'relative'}}>
        <DraggableItem container={containerRef} />
      </div>
    </DragDropProvider>
  );
}

function DraggableItem({container}: {container: React.RefObject<HTMLDivElement | null>}) {
  const {ref} = useDraggable({
    id: 'draggable-1',
    modifiers: [
      RestrictToElement.configure({
        element: () => container.current,
      }),
    ],
  });

  return <div ref={ref}>Drag me</div>;
}
```

## Restrict to the window

```jsx
import {useDraggable} from '@dnd-kit/react';
import {RestrictToWindow} from '@dnd-kit/dom/modifiers';

function DraggableItem() {
  const {ref} = useDraggable({
    id: 'draggable-1',
    modifiers: [RestrictToWindow],
  });

  return <div ref={ref}>Drag me</div>;
}
```

## Restrict to an axis

```jsx
import {useSortable} from '@dnd-kit/react/sortable';
import {RestrictToVerticalAxis} from '@dnd-kit/abstract/modifiers';

function SortableItem({id, index}: {id: string; index: number}) {
  const {ref} = useSortable({
    id,
    index,
    modifiers: [RestrictToVerticalAxis],
  });

  return <div ref={ref}>Item {id}</div>;
}
```

## Snap to a grid

`size` accepts a number (uniform) or `{x, y}` (asymmetric):

```jsx
import {useDraggable} from '@dnd-kit/react';
import {SnapModifier} from '@dnd-kit/abstract/modifiers';

function DraggableItem() {
  const {ref} = useDraggable({
    id: 'draggable-1',
    modifiers: [
      SnapModifier.configure({
        size: 20, // Snap every 20px in both directions
      }),
    ],
  });

  return <div ref={ref}>Drag me</div>;
}

// Asymmetric:
SnapModifier.configure({
  size: {x: 50, y: 25}, // 50px horizontal, 25px vertical
})
```

## Combining modifiers

Multiple modifiers apply in order:

```jsx
import {useDraggable} from '@dnd-kit/react';
import {RestrictToElement} from '@dnd-kit/dom/modifiers';
import {SnapModifier} from '@dnd-kit/abstract/modifiers';

function DraggableItem({container}: {container: React.RefObject<HTMLDivElement | null>}) {
  const {ref} = useDraggable({
    id: 'draggable-1',
    modifiers: [
      RestrictToElement.configure({element: () => container.current}),
      SnapModifier.configure({size: 20}),
    ],
  });

  return <div ref={ref}>Drag me</div>;
}
```

## Global (provider) vs per-draggable

Global applies to all draggables; per-draggable takes precedence:

```jsx
// Global — provider level
import {DragDropProvider} from '@dnd-kit/react';
import {RestrictToWindow} from '@dnd-kit/dom/modifiers';

function App() {
  return (
    <DragDropProvider modifiers={[RestrictToWindow]}>
      {/* All draggable elements are restricted to the window */}
    </DragDropProvider>
  );
}

// Per-draggable — overrides global
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