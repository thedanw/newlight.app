# DragDropProvider — dnd kit for React

> Source: https://dndkit.com/react/components/drag-drop-provider/
> Role: Context enabling drag-and-drop for children; manages drag state, coordinates draggables/droppables.

## Usage

```jsx
import {DragDropProvider} from '@dnd-kit/react';

function App() {
  return (
    <DragDropProvider>
      <YourDraggableContent />
    </DragDropProvider>
  );
}
```

## Events

| Event | Fires | Notes |
|-------|-------|-------|
| `onBeforeDragStart` | Before drag begins | `event.preventDefault()` cancels |
| `onDragStart` | Drag begins | — |
| `onDragMove` | Element moves | — |
| `onDragOver` | Over a droppable | `preventDefault()` blocks default plugin responses |
| `onDragEnd` | Drag ends (drop or cancel) | — |
| `onCollision` | Collision detected | `preventDefault()` blocks auto target selection |

All handlers: `(event, manager)`. Event shape:

```js
onDragEnd={(event, manager) => {
  event.operation.source   // Draggable | null
  event.operation.target   // Droppable | null
  event.operation.position // {current:{x,y}, initial:{x,y}}
  event.operation.status   // operation status
  event.canceled           // true if canceled (e.g. Escape key)
  event.nativeEvent        // underlying browser event, if available
}}
```

Sortable fields via `isSortable(source)` (from `@dnd-kit/react/sortable`): `index`, `initialIndex`, `group`, `initialGroup`.

## Props

| Prop | Type | Notes |
|------|------|-------|
| `children` | `ReactNode` | **Required.** Content where drag/drop is enabled. |
| `manager` | `DragDropManager` | Custom manager; auto-created if omitted. |
| `sensors` | `Sensor[] \| (defaults: Sensor[]) => Sensor[]` | Input sensors. |
| `plugins` | `Plugin[] \| (defaults: Plugin[]) => Plugin[]` | Extensions. |
| `modifiers` | `Modifier[] \| (defaults: Modifier[]) => Modifier[]` | Movement tweaks. |

Array form **replaces** defaults; function form receives defaults to **extend**.

Full examples (event handling, multiple contexts, extend vs replace): [refs/provider-examples.md](../refs/provider-examples.md)

## Related

- [quickstart](../quickstart.md)
- [drag-overlay](drag-overlay.md)