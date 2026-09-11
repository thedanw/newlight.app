# useSortable — dnd kit for React

> Source: https://dndkit.com/react/hooks/use-sortable/
> Requires `id` + `index`; accepts all `useDraggable`/`useDroppable` args plus sortable options. Import from `@dnd-kit/react/sortable`.

## Usage

```jsx
import {useSortable} from '@dnd-kit/react/sortable';

function SortableItem(props) {
  const {ref} = useSortable({
    id: props.id,
    index: props.index,
  });

  return <div ref={ref}>{props.children}</div>;
}
```

## Input (sortable-specific)

| Arg | Type | Notes |
|-----|------|-------|
| `id` | `string \| number` | **Required.** Unique identifier. |
| `index` | `number` | **Required.** Position in the list. |
| `transition` | `{duration?: number; easing?: string; idle: boolean} \| null` | Sort animation. `idle` = animate new position on index change when no drag in progress. |
| `target` | `Element \| Ref<Element>` | Existing target ref (instead of `targetRef`). |
| `group` | `string \| number \| Symbol` | Same-group items sort together; no group = one implicit group. Enables [multi-list layouts](../guides/multiple-sortable-lists.md). |
| `type` | `string \| number \| Symbol` | Consulted by other items' `accept` when **this** item is dragged. |
| `accept` | `Type \| Type[] \| ((source: Draggable) => boolean)` | Which draggables land here; omitted ⇒ all. |
| `disabled` | `boolean \| {draggable?: boolean; droppable?: boolean}` | Object form disables drag and drop independently. |
| `collisionDetector` / `collisionPriority` / `modifiers` / `sensors` / `plugins` / `data` / `effects` | Same as `useDraggable`/`useDroppable` | — |

## Output

| Prop | Type | Notes |
|------|------|-------|
| `ref` | `Ref<Element>` | Element as both draggable source and droppable target. |
| `targetRef` | `Ref<Element>` | Droppable target element. |
| `sourceRef` | `Ref<Element>` | Draggable source element. |
| `handleRef` | `Ref<Element>` | Drag handle element. |
| `isDropTarget` / `isDragSource` / `isDragging` / `isDropping` | `boolean` | State flags. |

## Key notes

- `ref` wires drag + drop together; split via `sourceRef`/`targetRef`.
- `group` enables multi-list layouts; `type`/`accept` govern cross-type drop rules.

## Related

- [use-droppable](use-droppable.md)
- [multiple-sortable-lists](../guides/multiple-sortable-lists.md)
- [use-drag-drop-monitor](../utilities/use-drag-drop-monitor.md)