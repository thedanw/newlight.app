# Multiple Sortable Lists — dnd kit for React

> Source: https://dndkit.com/react/guides/multiple-sortable-lists/
> Pattern: reorder sortable items across lists — kanban boards, Trello-like managers, multi-column layouts where items move within AND across columns.
> Prereq: [use-sortable](../hooks/use-sortable.md)

## Steps

1. **Make items sortable** — `useSortable({id, index, type: 'item', accept: 'item', group: column})`. `group` (the column id) enables cross-list sorting; items without `group` share one implicit group.
2. **Make columns droppable** — `useDroppable({id, collisionPriority: CollisionPriority.Low})` so items land in **empty** columns. `CollisionPriority` (from `@dnd-kit/abstract`): `Lowest`, `Low`, `Normal`, `High`, `Highest` — lower priority on containers lets child items win collisions.
3. **Move items between lists** — in `DragDropProvider onDragOver`, call `move(items, event)` from `@dnd-kit/helpers` (array mutation across lists). Skip when `source?.type === 'column'`.
4. **Make columns sortable (optional)** — `useSortable({id, index, type: 'column'})` inside `Column`; pass `index` from `App`. Reorder columns in `onDragEnd` via `move(columnOrder, event)`. Column order updated on drop (not on drag-over) avoids re-renders — dnd-kit handles optimistic order during the drag.
5. **Handle canceled drags** — snapshot state in `onDragStart`; on `event.canceled` in `onDragEnd`, restore the snapshot for item moves. dnd-kit auto-reverts its own optimistic updates on cancel.

Complete code (`Item.js`, `Column.js`, `App.js`, cancel-aware `App.js`): [refs/sortable-kanban-examples.md](../refs/sortable-kanban-examples.md)

## Related

- [use-sortable](../hooks/use-sortable.md)
- [drag-drop-provider](../components/drag-drop-provider.md)
- [Sortable state management](https://dndkit.com/react/guides/sortable-state-management)