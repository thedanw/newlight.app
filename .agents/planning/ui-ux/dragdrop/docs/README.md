# dnd-kit for React — Docs Library

Reference library for LLM agents building drag-and-drop UIs with dnd-kit's React API. Scraped from the **Latest** dndkit.com docs, token-optimized per md-token-optimizer. Full code examples live in `refs/`.

## Version baseline

These docs map to the **Latest** dndkit.com set (framework-agnostic v2) — verified 2026-09-18 against npm `latest`: `@dnd-kit/react@0.5.0` (with `dom`, `abstract`, `helpers`, `collision` all `0.5.0`). Source URLs use the bare host: `dndkit.com/react/…`.

**Do not** use the Legacy set (`dndkit.com/legacy/…` = v1). Legacy version numbers are confusingly *higher*: `@dnd-kit/sortable@10.0.0`, `@dnd-kit/modifiers@9.0.0`, `@dnd-kit/core@6.3.1`. "dnd-kit v10" is the **legacy** sortable preset, not the current release.

| | Latest (used here) | Legacy (reject) |
|---|---|---|
| Doc URL | `dndkit.com/…` | `dndkit.com/legacy/…` |
| Packages | `@dnd-kit/react`, `@dnd-kit/dom`, `@dnd-kit/abstract`, `@dnd-kit/helpers` | `@dnd-kit/core@6`, `@dnd-kit/sortable@10`, `@dnd-kit/utilities@3`, `@dnd-kit/modifiers@9` |
| Entry API | `DragDropProvider`, `useDraggable`/`useDroppable`/`useSortable` | `DndContext`, `SortableContext`, `useSensor`/`useSensors` |
| Sensors | `PointerSensor` (mouse+touch+pen) + `KeyboardSensor` | `MouseSensor`, `TouchSensor`, `PointerSensor` |
| Sortable import | `@dnd-kit/react/sortable` | `@dnd-kit/sortable` |
| Reorder helper | `move()` from `@dnd-kit/helpers` | `arrayMove()` from `@dnd-kit/sortable` |

Legacy markers that must NOT appear in these docs: `DndContext`, `SortableContext`, `useSensor`, `useSensors`, `MouseSensor`, `TouchSensor`, `activationConstraint` (singular), `closestCenter`, `arrayMove`, `onDragCancel` (as current API).

**Start here:** [`skill.md`](skill.md) — dnd-kit expert entry point with the task→section router. Query docs with `python scripts/dnd.py` (never read whole files).

## Structure

| Folder | Contents |
|--------|----------|
| `components/` | Render components (DragDropProvider, DragOverlay) |
| `guides/` | End-to-end patterns (kanban, modifiers) |
| `hooks/` | Per-entity hooks (useDraggable, useDroppable, useSortable) |
| `utilities/` | Ambient/manager hooks (useDragDropMonitor, useDragOperation, useDragDropManager) |
| `refs/` | Shared full code examples (referenced by multiple docs) |
| `scripts/` | `dnd.py` navigator: `map`, `find`, `topics`, `sections`, `read`, `verify`, `build` |

## Files (alphabetical)

### Root
- [skill.md](skill.md) — expert entry point + task→section router + navigator protocol
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