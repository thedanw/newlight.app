# Findings — dnd-kit Latest Refactor

## Verified Installed API (2026-09-18 — authoritative over `decision.md`)
- `package.json`: `@dnd-kit/react@^0.5.0`, `@dnd-kit/dom@^0.5.0`, `@dnd-kit/abstract@^0.5.0`, `@dnd-kit/helpers@^0.5.0`, `@dnd-kit/collision@^0.5.0`. Legacy `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `@dnd-kit/accessibility` removed.
- `node_modules/@dnd-kit/react/index.d.ts`: exports `DragDropProvider`, `DragOverlay`, `useDraggable`, `useDroppable`, `useDragDropMonitor`, `useDragOperation`, `useInstance`. **No `SortableContext`, no `DndContext`, no `useSensor`, no `MouseSensor`.**
- `node_modules/@dnd-kit/react/sortable.d.ts`: exports `useSortable`, `isSortable`, `isSortableOperation`. `useSortable` input: `{ id, index, group?, type?, accept?, disabled?, transition?, target?, handle?, element?, sensors?, plugins?, data?, effects?, collisionDetector?, collisionPriority?, modifiers? }`. Returns `{ sortable, isDragging, isDropping, isDragSource, isDropTarget, handleRef, ref, sourceRef, targetRef }`.
- `node_modules/@dnd-kit/dom/index.d.ts`: `PointerSensor` (not `MouseSensor`/`TouchSensor`); `PointerActivationConstraints` with `Delay` and `Distance`; `PointerSensorOptions.activationConstraints` is `ActivationConstraints<PointerEvent> | ((event: PointerEvent, source: Draggable) => ActivationConstraints<PointerEvent> | undefined)` — **plural, callable**.
- `node_modules/@dnd-kit/abstract/index.d.ts`: `UniqueIdentifier = string | number`; `DragOperationSnapshot` has `canceled`, `source`, `target`, `position`, `transform`, `status`; events (`DragEndEvent`, `DragOverEvent`, etc.) expose `operation`.
- `node_modules/@dnd-kit/helpers/dist/index.d.cts`: `move(items, event)` accepts arrays or `Record<UniqueIdentifier, Items>`; `arrayMove` and `arraySwap` also exported but `move()` is the current reorder helper.
- **No `SortableContext` exists** in `@dnd-kit/react/sortable` or any installed package. Per-entity `useSortable({ id, index, group, type, accept, collisionPriority })` is the only grouping mechanism.
- `docs/skill.md` Version Guard is correct: reject `DndContext`, `SortableContext`, `useSensor`, `MouseSensor`, `arrayMove`, `onDragCancel`.
- `decision.md` is outdated: claims `@dnd-kit/core` 6.3.1 and `@dnd-kit/sortable` 10.0.0 are latest; claims `@dnd-kit/react` is not installed and not needed. Both are false — installed packages are `0.5.0` and `@dnd-kit/react` is required.
- `docs/skill.md` Task Router: provider events → `components/drag-drop-provider.md#2`; sensors → `#3`; cross-list → `guides/multiple-sortable-lists.md#1`; overlay → `components/drag-overlay.md#1-2`.

## Parser Bug (from decision.md)
- JSX in callbacks inside same file as component return triggers esbuild/Rollup parser error (`Expected '>' but found '<'`).
- Only reliable fix: Component Extraction Pattern — separate `.tsx` file per JSX-returning component.
- Verified working: `FieldCard.tsx` separate file; `BuilderPage.tsx` imports and uses simple reference.

## Dependency Actions (from decision.md Action Items — corrected)
1. `pnpm remove @dnd-kit/react` — NOT needed; `@dnd-kit/react` IS installed (`^0.5.0`) and IS required. `decision.md` claim that it is not installed is incorrect.
2. Extract `renderFieldCardItem` from `BuilderPage.tsx` to `FieldCard.tsx` — completed (`FieldCard.tsx` exists).
3. Commit message: `feat: migrate drag-drop to dnd-kit Latest (v2 / @dnd-kit/react 0.5.0)`.
4. **No `SortableContext` replacement needed** — it does not exist in current API. Per-entity `useSortable` with `group`/`type`/`accept` replaces all grouping behavior.
5. `PointerSensor.configure({activationConstraints: ...})` must use pointer-type-aware callbacks (mouse → distance; touch/pen → delay) rather than applying both constraints to all pointer types.

## Replacement of Previous Plan (`.agents/planning/ui-ux/dragdrop/plan.md`)
- Previous plan superseded: marked `# SUPERSEDED` with redirect to `plans/plan.md`.
- Previous plan's legacy v8+ framing (`core` 6.3.1, `sortable` 10.0.0 as "upgrade target") removed — these are legacy version numbers.
- Previous plan's `pnpm add @dnd-kit/sortable@latest` direction removed — Latest uses `@dnd-kit/react/sortable`, not legacy `sortable`.
- Previous plan's custom wrapper hooks (`useSortableTree`, `useSortableList`, `useDragOverlay`, `useSensors`) removed — Latest uses direct hooks.
- Previous plan's `DndContext` / `SortableContext` (legacy import) / `useSensor` / `MouseSensor` / `arrayMove` / `onDragCancel` references removed.
- Parser-bug workaround now enforced: Component Extraction Pattern (separate `.tsx` files) per `decision.md`.

## Key Constraints
- `docs/skill.md` allowed-tools: Read, Glob, Grep, Bash — no edit/write of source files via this skill; use standard edit tools for code changes.
- `docs/skill.md` never reads whole docs >400 tok; always use `python scripts/dnd.py` CLI.
- `docs/README.md` import paths: `@dnd-kit/react`, `@dnd-kit/react/sortable`, `@dnd-kit/dom`, `@dnd-kit/abstract`, `@dnd-kit/helpers`.

## Provider Checkpoint (2026-09-18)
- `DragDropProviderProps` is inferred from `ComponentProps<typeof DragDropProvider>`; native callbacks and props are forwarded without fabricated semantic event types or casts.
- `DragStatusAnnouncer` uses `useDragDropMonitor` and `event.operation.source/target`; `event.canceled` is read from the native drag-end event.
- `DragDropProvider` accepts current `Sensors` or the compatibility `DragDropSensorConfig`; `DragOverlay` remains available from the app wrapper.
- `createPointerSensorOptions()` now uses a pointer-type callback: mouse → `Distance(8px)`; touch/pen → `Delay(250ms, tolerance 5)`. This matches `useSortableList.ts` and the installed callable `activationConstraints` API.
- Scoped TypeScript check reports no diagnostics in `provider.tsx`, `types.ts`, `index.ts`, `sensors/index.ts`, or `useSortableList.ts`.
- Full `tsc --project tsconfig.app.json` still reports later migration files and unrelated existing errors; those are intentionally outside this checkpoint.
- Scoped ESLint could not run because the repository has no `eslint.config.*` or `.eslintrc*` configuration file. `git diff --check` passes for this checkpoint.

## Sortable Form Consumer Checkpoint (2026-09-19)
- Added reusable `src/core/dragndrop/components/SortableItem.tsx`; it owns current `useSortable({ id, index, group, type, data })` registration and exposes a render-function API for handle refs and drag-state flags.
- `FieldCard` now composes with `SortableItem`, uses a 44px accessible `GripVertical` handle, and forwards source/target/dragging state to DOM attributes.
- `BuilderPage` resolves preview items by sortable ID instead of array position, commits IDs as strings, removes obsolete `SortableContext`/`getItemProps`/`removeField` wiring, and delegates card rendering to `FieldCard`.
- Both `useFormBuilderRenderItem` and `createRenderFieldCardItem` now resolve fields by ID and delegate to `FieldCard`, preserving the extracted-JSX workaround.
- Verification: `git diff --check` passed for all six batch paths. Full TypeScript still fails on later migration and unrelated baseline errors; detached-`HEAD` comparison confirms the three remaining `BuilderPage` diagnostics predate this batch.
- No batch regression was identified in direct API, React rendering, callback dependency, or accessibility review.

