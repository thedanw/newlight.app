# dnd-kit for React — Docs Library

Reference library for LLM agents building drag-and-drop UIs with dnd-kit's React API. Scraped from dndkit.com, token-optimized per md-token-optimizer. Full code examples live in `refs/`.

## Structure

| Folder | Contents |
|--------|----------|
| `components/` | Render components (DragDropProvider, DragOverlay) |
| `guides/` | End-to-end patterns (kanban, modifiers) |
| `hooks/` | Per-entity hooks (useDraggable, useDroppable, useSortable) |
| `utilities/` | Ambient/manager hooks (useDragDropMonitor, useDragOperation, useDragDropManager) |
| `refs/` | Shared full code examples (referenced by multiple docs) |

## Files (alphabetical)

### Root
- [quickstart.md](quickstart.md) — install + first draggable/droppable/provider

### components/
- [drag-drop-provider.md](components/drag-drop-provider.md)
- [drag-overlay.md](components/drag-overlay.md)

### guides/
- [modifiers.md](guides/modifiers.md)
- [multiple-sortable-lists.md](guides/multiple-sortable-lists.md)

### hooks/
- [use-draggable.md](hooks/use-draggable.md)
- [use-droppable.md](hooks/use-droppable.md)
- [use-sortable.md](hooks/use-sortable.md)

### utilities/
- [use-drag-drop-manager.md](utilities/use-drag-drop-manager.md)
- [use-drag-drop-monitor.md](utilities/use-drag-drop-monitor.md)
- [use-drag-operation.md](utilities/use-drag-operation.md)

### refs/
- [drag-overlay-examples.md](refs/drag-overlay-examples.md)
- [modifier-examples.md](refs/modifier-examples.md)
- [provider-examples.md](refs/provider-examples.md)
- [sortable-kanban-examples.md](refs/sortable-kanban-examples.md)

## Conventions

- Import paths: components/hooks from `@dnd-kit/react`; sortable from `@dnd-kit/react/sortable`.
- Every doc carries its canonical `> Source:` URL in the header.
- Internal links are relative (`../`) so agents can navigate the tree offline.