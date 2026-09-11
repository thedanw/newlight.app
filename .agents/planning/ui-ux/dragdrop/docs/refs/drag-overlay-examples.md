# DragOverlay — Full Examples

> Referenced by: [drag-overlay.md](../components/drag-overlay.md), [use-draggable.md](../hooks/use-draggable.md)
> Source: https://dndkit.com/react/components/drag-overlay/

## Per-source rendering

Render `DragOverlay` once; pass a function child that receives `source`:

```jsx
import {DragDropProvider, DragOverlay} from '@dnd-kit/react';

function App() {
  return (
    <DragDropProvider>
      <Draggable id="foo" />
      <Draggable id="bar" />
      <DragOverlay>
        {source => (
          <div>Dragging {source.id}</div>
        )}
      </DragOverlay>
    </DragDropProvider>
  );
}
```

## Drop animation variants

```jsx
{/* Disable the drop animation */}
<DragOverlay dropAnimation={null}>
  <div>No animation on drop</div>
</DragOverlay>

{/* Customize the animation timing */}
<DragOverlay dropAnimation={{ duration: 150, easing: 'ease-out' }}>
  <div>Fast drop animation</div>
</DragOverlay>

{/* Provide a custom animation function */}
<DragOverlay dropAnimation={async ({ element, feedbackElement, translate }) => {
  // Custom animation logic using Web Animations API, GSAP, etc.
}}>
  <div>Custom animation</div>
</DragOverlay>
```

## Placement

`DragOverlay` lives inside a `DragDropProvider` (typically near the draggable). Children render **only while a drag is active**.