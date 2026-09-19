# Decision Log: @dnd-kit v2 / @dnd-kit/react 0.5.0 (Latest — corrected 2026-09-18)

**Correction to previous version:** The previous `decision.md` incorrectly treated `@dnd-kit/core` 6.3.1 and `@dnd-kit/sortable` 10.0.0 as "latest stable" and claimed `@dnd-kit/react` was not installed/not needed. Both claims are false. The installed packages (`package.json`) are `@dnd-kit/react@^0.5.0`, `@dnd-kit/dom@^0.5.0`, `@dnd-kit/abstract@^0.5.0`, `@dnd-kit/helpers@^0.5.0`, `@dnd-kit/collision@^0.5.0`. The `0.5.0` versions are the current generation; `core` 6.3.1 / `sortable` 10.0.0 are legacy version numbers from the previous generation. This document is corrected to match the installed `0.5.0` API.

All packages at current stable (`0.5.0`) as of 2026-09-18.

## Installed Versions (corrected — from `package.json` + `pnpm-lock.yaml`)

| Package | Version | Status |
|---------|---------|--------|
| `@dnd-kit/react` | **0.5.0** | Installed — required |
| `@dnd-kit/dom` | **0.5.0** | Installed |
| `@dnd-kit/abstract` | **0.5.0** | Installed |
| `@dnd-kit/helpers` | **0.5.0** | Installed (`move()`) |
| `@dnd-kit/collision` | **0.5.0** | Installed |
| `@dnd-kit/core` | **REMOVED** (was 6.3.1 — legacy) | Not in `package.json` |
| `@dnd-kit/sortable` | **REMOVED** (was 10.0.0 — legacy) | Not in `package.json` |
| `@dnd-kit/utilities` | **REMOVED** (was 3.2.2 — legacy) | Not in `package.json` |
| `@dnd-kit/accessibility` | **REMOVED** (was 3.1.1 — legacy) | Not in `package.json` |

## Key API Facts (v2 / 0.5.0 — verified from installed declarations 2026-09-18)

### `@dnd-kit/react` (0.5.0) — installed and required
- **`DragDropProvider`**: root provider — accepts `sensors`, `collisionDetector`, `onBeforeDragStart`, `onDragStart`, `onDragMove`, `onDragOver`, `onDragEnd`, `onCollision`. Events receive `(event, manager)`; `event.operation` has `source`, `target`, `position`, `transform`, `canceled`.
- **`useDragDropMonitor`**: monitors events inside provider; handlers receive `(event, manager)`.
- **`DragOverlay`**: renders drag preview; accepts `dropAnimation` (`undefined` = default, `null` = disabled, `{duration,easing}` = custom, `(context) => ...` = custom fn).
- **`useDraggable`** / **`useDroppable`**: direct hooks; no wrapper components required.
- **`useDragOperation`**: returns `{ source, target }`.
- **No `DndContext`**, **no `SortableContext`**, **no `useSensor`**, **no `MouseSensor`**, **no `arrayMove`**.

### `@dnd-kit/react/sortable` (0.5.0) — installed
- **`useSortable`**: input `{ id, index, group?, type?, accept?, disabled?, transition?, target?, handle?, element?, sensors?, plugins?, data?, effects?, collisionDetector?, collisionPriority?, modifiers? }`. Returns `{ sortable, isDragging, isDropping, isDragSource, isDropTarget, handleRef, ref, sourceRef, targetRef }`.
- **`group`**: `UniqueIdentifier` (`string | number | Symbol`) — same-group items sort together; enables multi-list layouts.
- **`type`** / **`accept`**: govern cross-type drop rules (`accept` can be `Type | Type[] | ((source: Draggable) => boolean)`).
- **`collisionPriority`**: `CollisionPriority.Lowest` / `Low` / `Normal` / `High` / `Highest` (from `@dnd-kit/abstract`).
- **No `SortableContext`** — grouping is per-entity via `group` prop.
- **No `verticalListSortingStrategy`** or `horizontalListSortingStrategy` — sorting handled by `Sortable` class + `OptimisticSortingPlugin`.

### `@dnd-kit/dom` (0.5.0) — installed
- **`PointerSensor`** (not `MouseSensor`/`TouchSensor`): handles mouse, touch, pen. `PointerSensor.configure({ activationConstraints?, activatorElements?, preventActivation? })`.
- **`PointerActivationConstraints`**: `Delay` (`{value, tolerance}`) and `Distance` (`{value, tolerance}`). `activationConstraints` is plural and callable: `(event: PointerEvent, source: Draggable) => ActivationConstraints | undefined`.
- **`KeyboardSensor`**: keyboard navigation sensor.
- Default `PointerSensor` behavior: mouse with handle → no delay; touch → delay 250ms; text input → delay 200ms; else → delay 200ms + distance 5.

### `@dnd-kit/abstract` (0.5.0) — installed
- **`UniqueIdentifier`**: `string | number`.
- **`DragOperationSnapshot`**: `{ canceled, source, target, position, transform, status, shape, activatorEvent, modifiers, sourceIdentifier, targetIdentifier }`.
- **`DragDropEventMap`**: `dragstart`, `dragmove`, `dragover`, `dragend`, `collision`, `beforedragstart`.
- **`Sensors`**: `(SensorConstructor | SensorDescriptor)[]`.

### `@dnd-kit/helpers` (0.5.0) — installed
- **`move(items, event)`**: supports arrays (`Items[]`) and grouped records (`Record<UniqueIdentifier, Items>`). `event` is `DragOverEvent` or `DragEndEvent`.
- **`arrayMove`** / **`arraySwap`**: also exported but `move()` is preferred.
- **No `arrayMove` as the primary reorder mechanism** — `move()` handles both flat and grouped structures.

## Parser Bug: JSX in Callbacks

### The Bug
esbuild/Rollup parser **cannot parse** `.tsx` files where a function returning JSX is defined **inside the same file** that contains the main component's JSX `return`. Triggers: `Expected '>' but found '<'` at the closing tag of the outer component.

### Root Cause
The parser gets confused by nested JSX contexts — an arrow function with a block body that returns JSX, embedded within a component that also returns JSX. The parser fails to properly delimit the inner function's JSX from the outer component's JSX.

### Workaround: Component Extraction Pattern
**DO NOT** define render callbacks with JSX inline in the component:

```tsx
// BAD — triggers parser bug
renderItem={(item, index, isDragging) => {
  const field = items[index]
  if (!field) return null
  return <Box>...</Box>  // JSX in inner function → parser confused
}}
```

**DO** extract to a separate component file (or `React.createElement` for trivial cases):

```tsx
// FieldCard.tsx — separate file, NO main component JSX
export function FieldCard({ field, index, isDragging, ... }) {
  const spec = getFieldSpec(field.field_type)
  return (
    <Box>...</Box>  // JSX is fine — this IS the component return
  )
}

// BuilderPage.tsx — imports FieldCard, uses simple reference
<Dragndrop.SortableList
  items={items.map(toDragItem)}
  renderItem={(item, index, isDragging) => (
    <FieldCard field={items[index]} index={index} isDragging={isDragging} />
  )}
/>
```

### Alternative Workarounds
1. **`React.createElement`** — avoids JSX entirely in the callback (but verbose for complex UIs)
2. **Module-level function** — define the function outside the component (but needs all data passed as parameters, and parser may still confuse cross-file JSX)
3. **`// @ts-nocheck`** — skips TypeScript check but **NOT** the esbuild/Rollup parser error
4. **IIFE with expression body** — `(() => { ... })()` — parser may still confuse

### Verified Working Pattern
The **component extraction pattern** is the only reliable solution. Each component that returns JSX must be in its own file with no other JSX-returning functions in that file.

## Decision Log: decision → Rationale (hierarchical)

### 1. Use @dnd-kit v2 / 0.5.0 API (`@dnd-kit/react` + `/sortable` + `/dom` + `/abstract` + `/helpers`) → Rationale
- **1.1 Rationale**: Installed `package.json` uses `@dnd-kit/react@^0.5.0` and related `0.5.0` packages. Previous `core` 6.3.1 / `sortable` 10.0.0 / `utilities` 3.2.2 are legacy version numbers from the previous generation.
- **1.2 Rationale**: `docs/README.md` and installed declarations confirm `DragDropProvider`, `useSortable`, `PointerSensor`, `move()` as the current APIs.
- **1.3 Rationale**: React 19.1.0 compatibility verified with current `0.5.0` packages.

### 2. Keep `@dnd-kit/react` in dependencies → Rationale
- **2.1 Rationale**: Installed (`^0.5.0`) and required — `DragDropProvider`, `useSortable`, `useDragDropMonitor`, `DragOverlay` all come from this package.
- **2.2 Rationale**: Previous claim that it was "not installed / not needed" was incorrect.
- **2.3 Rationale**: Removing it would break the entire drag-drop system.

### 3. Extract renderItem JSX to separate component files → Rationale
- **3.1 Rationale**: esbuild/Rollup parser bug triggers on any function returning JSX in same file as component.
- **3.2 Rationale**: Component extraction (`FieldCard.tsx`) is the ONLY reliable workaround (tested all alternatives).
- **3.3 Rationale**: Each `.tsx` file should contain exactly ONE component with JSX in its return.

### 4. Per-entity `useSortable` replaces `SortableContext` → Rationale
- **4.1 Rationale**: `SortableContext` does NOT exist in `@dnd-kit/react@0.5.0` or `@dnd-kit/react/sortable`. Verified by inspecting installed declarations.
- **4.2 Rationale**: Per-entity `useSortable({ id, index, group, type, accept, collisionPriority })` provides grouping (`group`), cross-type rules (`type`/`accept`), and collision priority (`collisionPriority`) without any context component.
- **4.3 Rationale**: `move()` from `@dnd-kit/helpers` handles both flat arrays and grouped records (`Record<UniqueIdentifier, Items>`), replacing `arrayMove`.

## Action Items (corrected 2026-09-18)

1. **Keep `@dnd-kit/react`** (`^0.5.0`) — it IS installed and IS required. Do NOT remove.
2. Extract `renderFieldCardItem` from `BuilderPage.tsx` to `FieldCard.tsx` — completed (`FieldCard.tsx` exists and is reusable).
3. Commit message: `feat: migrate drag-drop to dnd-kit v2 / @dnd-kit/react 0.5.0`.
4. **No `SortableContext` replacement** — it does not exist in current API. Use per-entity `useSortable({ id, index, group, type, accept, collisionPriority })`.
5. `PointerSensor.configure({activationConstraints: ...})` must use pointer-type-aware callbacks (mouse → distance; touch/pen → delay) rather than applying both constraints to all pointer types.
6. `move()` from `@dnd-kit/helpers` replaces `arrayMove`; supports arrays and grouped records.
7. `DragDropProvider` replaces `DndContext`; `useDragDropMonitor` replaces `useDndMonitor`; `dragEnd.canceled` replaces `onDragCancel`.