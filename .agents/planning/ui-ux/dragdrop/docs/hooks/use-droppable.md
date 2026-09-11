# useDroppable — dnd kit for React

> Source: https://dndkit.com/react/hooks/use-droppable/
> Requires an `id`; accepts the same options as the `Droppable` class.

## Usage

```jsx
import {useDroppable} from '@dnd-kit/react';

function Droppable(props) {
  const {isDropTarget, ref} = useDroppable({id: props.id});

  return (
    <div ref={ref}>
      {isDropTarget ? 'Draggable element is over me' : 'Drag something over me'}
    </div>
  );
}
```

## Input

| Arg | Type | Notes |
|-----|------|-------|
| `id` | `string \| number` | **Required.** Unique identifier. |
| `element` | `Element \| Ref<Element>` | Existing element ref (instead of returned `ref`). |
| `accept` | `Type \| Type[] \| ((source: Draggable) => boolean)` | Which draggables land here; omitted ⇒ accepts all. |
| `type` | `string \| number \| Symbol` | Metadata only — NOT consulted by `accept` rules. |
| `collisionDetector` | `(input) => Collision \| null` | Custom collision detection. |
| `collisionPriority` | `number` | Higher wins overlapping droppables. |
| `disabled` | `boolean` | `true` blocks being a drop target. |
| `data` | `{[key: string]: any}` | Opaque payload. |
| `effects` | `() => Effect[]` | Auto-cleaned on unmount. |

## Output

| Prop | Type | Notes |
|------|------|-------|
| `ref` | `(element: Element) => void` | Ref callback for the target element. |
| `isDropTarget` | `boolean` | Drag is currently over this target. |
| `droppable` | `Droppable` | Hook-created instance. |

## Key concepts

- **`accept` vs `type`:** acceptance = this droppable's `accept` rule evaluated against the **draggable's** `type`; the droppable's own `type` is metadata.
- **`collisionPriority`** breaks overlap ties.

## Related

- [use-draggable](use-draggable.md)
- [use-sortable](use-sortable.md)
- [Concept: collisions](https://dndkit.com/concepts/droppable#detecting-collisions)