# useDraggable — dnd kit for React

> Source: https://dndkit.com/react/hooks/use-draggable/
> Requires an `id`; accepts the same options as the `Draggable` class.

## Input

| Arg | Type | Notes |
|-----|------|-------|
| `id` | `string \| number` | **Required.** Unique identifier. |
| `type` | `string \| number \| Symbol` | Matched against droppable `accept`. |
| `element` | `Element \| Ref<Element>` | Existing element ref (instead of returned `ref`). |
| `handle` | `Element \| Ref<Element>` | Existing handle ref (instead of returned `handleRef`). |
| `disabled` | `boolean` | `true` blocks dragging. |
| `plugins` | `PluginDescriptor[]` | Per-entity via `Plugin.configure()` (e.g. `Feedback.configure({feedback: 'clone'})`). |
| `modifiers` | `Modifier[]` | Restrict/alter drag movement. |
| `sensors` | `Sensors[]` | Per-element input sensors. |
| `alignment` | `{x, y: 'start' \| 'center' \| 'end'}` | Feedback overlay placement. |
| `data` | `{[key: string]: any}` | Opaque payload for handlers/modifiers/sensors/plugins. |
| `effects` | `() => Effect[]` | Auto-cleaned on unmount. |

## Output

| Prop | Type | Notes |
|------|------|-------|
| `ref` | `(element: Element) => void` | [Ref callback](https://react.dev/reference/react-dom/components/common#ref-callback) for the draggable element. |
| `handleRef` | `(element: Element) => void` | Ref callback for the drag handle. |
| `isDragSource` | `boolean` | Is source of the in-progress drag. |
| `isDragging` | `boolean` | Currently being dragged. |
| `isDropping` | `boolean` | Being dropped — style the drop animation. |
| `draggable` | `Draggable` | Hook-created instance. |

## Drag handle example

```jsx
import {useDraggable} from '@dnd-kit/react';

function Draggable(props) {
  const {ref, handleRef} = useDraggable({id: props.id});

  return (
    <div ref={ref}>
      Draggable
      <button ref={handleRef}>Drag handle</button>
    </div>
  );
}
```

## Related patterns

- Drag overlay (per-source content): [drag-overlay](../components/drag-overlay.md) → [refs/drag-overlay-examples.md](../refs/drag-overlay-examples.md)
- Modifiers (axis/container/window/snap): [modifiers](../guides/modifiers.md) → [refs/modifier-examples.md](../refs/modifier-examples.md)

## Related

- [use-droppable](use-droppable.md)
- [use-sortable](use-sortable.md)