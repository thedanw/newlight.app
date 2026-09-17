# Decision Log: @dnd-kit Core Utility

Implementation decisions and lessons learned, captured 2026-09-11.

## Key Decisions

| # | Decision | Rationale | Impact |
|---|----------|-----------|--------|
| 1 | Use `@dnd-kit` v2 over framer-motion Reorder | Superior keyboard a11y, tree support, sensor abstraction | Required learning v2 API (significant differences from v1) |
| 2 | Core utility in `src/core/dragndrop/` | Single source of truth, tree-shakeable, plugin-consumable | Semantic namespace `Dragndrop` exported from `@/core/ui` |
| 3 | Flatten tree to single SortableContext | Nested SortableContext causes collision detection conflicts | flattenTree + reorderTree utilities handle the transformation |
| 4 | CSS keyframe animations only | Ark UI portals break in AnimatePresence under React 19 | DragOverlay drop animation set to null; CSS keyframes in index.css |
| 5 | Handle-only drag by default | Mobile-first: prevents scroll interference, 44px touch target | All draggable components use handleRef pattern |
| 6 | Export `Dragndrop` namespace from `@/core/ui` | Consistency with Park UI pattern — modules import from `@/core/ui` | `import { Dragndrop } from '@/core/ui'` |
| 7 | v2 API is ref-based, not v1 attributes/listeners | `useSortable` returns refs + state flags; no `attributes`/`listeners` | All hooks and components rewritten for v2 |
| 8 | `useDragDropMonitor` for drag-end wiring | Cleanest way to subscribe to lifecycle events from any component | Used in `useSortableTree` and `DragStatusAnnouncer` |
| 9 | Unique `useId()` group per SortableTree | Prevents cross-tree reordering when multiple trees share a provider | Each SortableTree gets an isolated sortable group |
| 10 | Guard against self-parent in `getProjection` | Dragging a parent over the next item + horizontal offset yields `parentId === source.id`; official example tolerates it, our parent-chain walk froze | `handleDragOver` skips update when `parentId === source.id`; `visibleItems` walk is cycle-safe |

## Lessons Learned

### Verified v2 API Facts (from installed source — no need to re-read)
- **`useSortable`** (`@dnd-kit/react/sortable`): `{ id, index (required), group, data, alignment, transition, plugins, modifiers, disabled, handle, element, target, type, accept, sensors, collisionDetector, collisionPriority }` → `{ sortable, isDragging, isDropping, isDragSource, isDropTarget, handleRef, ref, sourceRef, targetRef }`.
- **`entity.data` is the PLAIN object** (NOT `.current` wrapper) — `source.data.depth` works directly; `source.data.current?.x` is a latent bug.
- **`move(items, event)`** (helpers, array case): if `source.index !== items.findIndex(source.id)` → `arrayMove(items, sourceIndex2, source.index)`; else `arrayMove(items, sourceIndex2, targetIndex2)`.
- **`onDragOver` + `event.preventDefault()`** blocks OptimisticSortingPlugin — you own reordering.
- **`dropAnimation={null}`** → Feedback plugin `cleanup()` immediately, NO WAAPI animation (avoids AnimatePresence crash).
- **PointerSensor**: handle → activates on pointerdown (no constraints); non-handle → 200ms delay + 5px distance.
- **Scheduler uses `requestAnimationFrame`** — rAF never fires in hidden automation browsers → move never flushes.

### Sensor Configuration
- **v2 PointerSensor handles mouse + touch + pen** — no separate TouchSensor in v2. Configure via `PointerSensor.configure({ activationConstraints })` with per-pointer-type branching.
- **Touch needs 250ms long-press delay** (not distance) to coexist with scroll. Mouse uses 8px distance.
- **KeyboardSensor auto-registered** — `keyboardCodes` config replaces v1's `coordinateGetter`.

### Tree Flattening
- **Move-between-branches is the trickiest case** — item must be removed from source parent's children AND re-inserted at target's position. Insert as sibling when target has a parent; insert as child of target when target is root.
- **Descendant detection must check both directions** — can't move a node into its own descendant.
- **TypeScript closure-CFA bug** — a `let` variable assigned only inside a nested function gets narrowed to `never` after the closure call. Fix: return values instead of mutating captured `let`s.

### Hard-Freeze: Self-Parent Projection (2026-09-12)
- **`getProjection(items, target.id, projectedDepth)` returns `parentId === source.id`** when the source is the item directly above the target + horizontal offset. Official example tolerates it (renders flat); ANY parent-chain walk must be cycle-safe (visited set) or guarded.
- **Guard:** in `handleDragOver`, skip the update when `parentId === source.id`.
- **Pass `index` from `flattenedItems` flat position** (docs: "position in the list"), NOT the visible index — visible index corrupts `move` when nodes are collapsed.

### CSS Keyframes
- **Direct-manipulation drag tracking must NEVER be gated on reduced motion** — only release animation suppressed.
- **`touch-action: none` on handle only** — not on the whole item, to preserve scroll on non-drag areas.
- **Panda CSS `css()` is build-time-only** — inline styles required for `transition: none` under `@media (prefers-reduced-motion)`.

### Plugin API Integration
- **Plugin API shape is `{ supabase, settings, router, toast, i18n, pluginName, pluginVersion }`** — `dragndrop` API slots in alongside existing properties.
- **Manifest schema uses Zod v4** — `z.record(z.string(), z.unknown())` requires key schema (v4 breaking change).

### Testing
- **`npx tsc --noEmit` on root tsconfig is a FALSE POSITIVE** — root `tsconfig.json` has `files: []` (solution-style). The real gate is `tsc -b`.
- **vitest and Vite don't typecheck** — tests passing ≠ types correct. Must run `tsc -b` separately.
- **Browser-level drag testing is unreliable** — dnd-kit v2 PointerSensor doesn't activate with synthetic PointerEvents dispatched via `page.evaluate`. KeyboardSensor is more testable but also has limitations under automation.
- **Synthetic pointer events DO start drags** (via `dispatchEvent(new PointerEvent(...))`), but collision detection doesn't reliably find the drop target under automation.
- **Synthetic pointer events CANNOT complete a drag** — `setPointerCapture` throws for synthetic pointerIds → drag cancels (`dragend {canceled:true}`).
- **rAF never fires in hidden automation browsers** → `manager.actions.move()` never flushes → position/collision never update. Verify drag state via React state/DOM, not animation.
- **Physical clicks can be swallowed by drag handlers** — use `dispatchEvent('click')`/programmatic clicks.

### Accessibility
- **Drag handles must be `<button>`** (not `<div>`) for keyboard focusability.
- **44px touch targets** on all interactive drag elements (minimum for WCAG 2.5.8).
- **`aria-live="polite"` region** for drag state announcements — auto-clear after 3s to avoid stale text.

## Deviations from Plan

| # | Deviation | Reason |
|---|-----------|--------|
| 1 | Did NOT add explicit `/example/category/drag-drop` route | Existing generic `category/:categoryId` route already serves this URL |
| 2 | Consolidated sensor files into single `sensors/index.ts` | v2 API doesn't need separate sensor files — configuration is inline |
| 3 | Used `useDragDropMonitor` in `useSortableTree` instead of passing `onDragEnd` through the component tree | More reliable wiring to dnd-kit lifecycle events; avoids N subscriptions when moved to SortableTree level |
| 4 | `DraggableItem` compound component uses `ForwardRefExoticComponent` intersection type | TypeScript couldn't see `.Handle`/`.Preview` sub-components on the compound component |
| 5 | `reorderTree` operates on nested tree directly (not flat array) | Simplifies the API — callers don't need to flatten before reordering |

## Performance Observations

- **Build time:** ~8-9s (Vite 7.3.6), no significant regression
- **Bundle size:** `index-D7YHFASV.js` at 1,753 kB (gzipped 508 kB) — pre-existing chunk-size warning, not caused by dnd-kit
- **Test suite:** 260 tests in ~9-23s (vitest 4.1.11), 26 test files
- **dnd-kit tree shaking:** `@dnd-kit/react` tree-shakes well — only used modules included in bundle

## v8+ Migration (2026-09-16)

### Migration Summary
Upgraded from @dnd-kit v0.5.0 (v2 API) to v10.0.0 (v8+ API). The v8+ API uses direct hook-based patterns instead of wrapper components.

### Key API Changes
| v2 (0.5.0) | v8+ (10.0.0) |
|------------|--------------|
| `useSortable` returns `{ sortable, isDragging, handleRef, ref }` | `useSortable` returns `{ setNodeRef, setActivatorNodeRef, setDroppableNodeRef, setDraggableNodeRef, isDragging, attributes, listeners }` |
| `attributes`/`listeners` spread on elements | Refs attached via `setNodeRef`, `setActivatorNodeRef` |
| Wrapper components: `SortableList`, `DraggableItem`, `DraggableHandle`, `DroppableZone` | Removed — use `useSortable`, `useSortableList`, `useSortableTree` directly |
| `sortableKeyboardCoordinates` | Built into `KeyboardSensor` via `keyboardCodes` |
| `DragDropManager` with 1 type arg | `DragDropManager<T, U>` requires 2 type args |

### Migration Approach
1. **Package upgrade**: Updated all `@dnd-kit/*` packages to latest (v10.0.0 for sortable, v0.5.x for others)
2. **New hooks created**: `useSortableTree`, `useSortableList`, `useDragOverlay`, `useSensorsHook`
3. **Core components updated**: `SortableTree`, `TreeNode` use modern `useSortable` API
4. **Consumer updates**: `JourneySettingsManager`, `SortableStageColumns`, `dnd-tree`, `BuilderPage` migrated to new hooks
5. **Obsolete files removed**: `SortableList.tsx`, `DraggableItem.tsx`, `DraggableHandle.tsx`, `DroppableZone.tsx`, `useDragndrop.ts`

### Lessons Learned
- **Wrapper → Hook pattern**: v8+ eliminates the need for wrapper components. Consumers call hooks directly and render their own JSX, avoiding the parser bug with nested JSX in callbacks.
- **`setNodeRef` vs `ref`**: The v2 `ref` prop is replaced by `setNodeRef` and `setActivatorNodeRef` in v8+. Components must call both refs appropriately.
- **Unused parameters**: The hook options (`renderNode`, `renderRow`, `gap`) are not used in `useSortableTree` — they are consumer concerns, not hook concerns. Prefix with `_` to silence TS warnings.
- **Sensor API**: `createPointerSensorOptions`/`createKeyboardSensorOptions` are functions returning options objects, not types. The test mocks must export these functions.
- **Event structure**: `DragOverEvent` now has `transform` on `event.operation.transform` instead of separate `manager` argument. Tests must be updated accordingly.
- **Test mocks**: All test mocks for sensors must include `createPointerSensorOptions` and `createKeyboardSensorOptions` exports.

### Remaining Pre-existing Issues
- `elvanto-sync` plugin: Duplicate `CheckIcon` imports
- `email` components: Semantic token violations
- `forms` module: Missing exports (`Heading`, `Text`, `DraggableHandle`, `FieldCard`, etc.)
- These are unrelated to dnd-kit migration and exist in the codebase prior to this work
