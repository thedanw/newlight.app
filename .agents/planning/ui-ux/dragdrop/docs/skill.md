---
name: dndkit-expert
description: "Expert on dnd-kit Latest for React (the @dnd-kit/react 0.5.0 generation) covering draggable/droppable/sortable hooks, kanban multi-list reorder, drag overlays, provider events, and modifiers. Uses a line-level index to read only the relevant lines of the local docs library. Use when building or debugging drag-and-drop UIs, sortable lists, kanban boards, or reorder trees."
category: ui-ux
risk: safe
source: local
tags: [dnd-kit, drag-drop, sortable, kanban, reorder, overlay, modifiers, react]
triggers: [drag-drop, sortable, reorder, kanban, overlay, dnd-kit]
allowed-tools: Read Glob Grep Bash
---

# dnd-kit Expert (Latest / React)

## Overview

Expert navigator for the dnd-kit docs library in this folder — 16 docs, ~1,100 lines, ~9k tokens total. Answers drag-and-drop questions by reading **only the indexed line ranges** needed, never whole files. Current generation only: dndkit.com **Latest** (`@dnd-kit/react` 0.5.0); the Legacy v1 API is actively rejected (see Version Guard).

## When to Use

- Build/adjust drag-and-drop, sortable, kanban, or reorder-tree UI with dnd-kit.
- Look up hook props, event payloads, `accept`/`type` rules, or modifier options.
- Verify whether an import or API belongs to the current or the legacy generation.
- NOT for: installing the package in a specific app, or topics absent from this library (see Coverage Gaps).

## Token Protocol (follow in order)

| Step | Action | Cost |
|------|--------|------|
| 1 | Pick targets from **Task Router** or **Doc Map** below — no tool call needed | 0 |
| 2 | If unsure: `python scripts/dnd.py find <topic>` → doc, section, line range | ~40 tok |
| 3 | Read **one section**: `python scripts/dnd.py read <doc> -s <n>` | 100–300 tok |
| 4 | Widen only if needed: `-l A-B` for extra lines, `sections <doc>` for the full map | as needed |

Rules: never `read` a whole doc unless its total is under ~400 tokens (see Doc Map). Never re-read a section you already have. Prefer 1–3 sections over a full refs file.

## Commands

```bash
python scripts/dnd.py map                 # one line per doc (start here)
python scripts/dnd.py find <topic...>     # topic -> doc#section + line range
python scripts/dnd.py topics [filter]     # compact reverse index
python scripts/dnd.py sections <doc>      # numbered sections + line ranges
python scripts/dnd.py read <doc> -s <n>   # read ONE section
python scripts/dnd.py read <doc> -l A-B   # read an exact line range (-v for token cost)
python scripts/dnd.py context <doc> -s <n># section + heading trail, self-contained
python scripts/dnd.py stats               # token totals
python scripts/dnd.py verify              # validate skill.md section refs
python scripts/dnd.py build               # regenerate index.json after editing docs
```

`index.json` is the machine-readable index (docs → sections → line ranges + topic map); auto-built if missing. **Never read it raw** — query it through the CLI. Re-run `build` after editing any doc, and `verify` after editing `skill.md`.

## Doc Map

Run `python scripts/dnd.py map` for the live list with line/token counts (~350 tok). Largest docs — **always read by section**, never whole: `refs/sortable-kanban-examples.md` (189L/1223tok), `refs/modifier-examples.md` (152L/904tok), `refs/provider-examples.md` (101L/627tok). Smallest (safe to read whole): `utilities/use-drag-operation.md` (39L), `guides/modifiers.md` (38L).

## Task Router

| Task | Read |
|------|------|
| Install + minimal working example | `quickstart.md#1-4` |
| Provider events / event payload fields | `components/drag-drop-provider.md#2` |
| Configure sensors / plugins / modifiers on provider | `components/drag-drop-provider.md#3` |
| Isolated drag contexts (two independent areas) | `refs/provider-examples.md#2` |
| Drag preview or clone while dragging | `components/drag-overlay.md#1-2` |
| Per-source overlay content | `refs/drag-overlay-examples.md#1` |
| Disable/customize drop animation | `components/drag-overlay.md#3` |
| Drag handle only (no whole-item drag) | `hooks/use-draggable.md#3` |
| Draggable options or return values | `hooks/use-draggable.md#1-2` |
| Restrict which draggables a target accepts | `hooks/use-droppable.md#4` |
| Sortable item setup (`id`, `index`) | `hooks/use-sortable.md#1-2` |
| Cross-list / kanban reorder | `guides/multiple-sortable-lists.md#1` |
| Kanban full code (Item/Column/App) | `refs/sortable-kanban-examples.md#1-3` |
| Revert on canceled drag | `refs/sortable-kanban-examples.md#5` |
| Restrict movement (axis/window/container/grid) | `guides/modifiers.md#1-2` |
| Modifier code by case | `refs/modifier-examples.md#1-6` |
| Highlight a drop zone / ambient drag state | `utilities/use-drag-operation.md#1-3` |
| Log or react to drag lifecycle events | `utilities/use-drag-drop-monitor.md#1-2` |
| Access manager (`monitor`, `registry`) | `utilities/use-drag-drop-manager.md#1-3` |
| Check Latest vs Legacy API | `README.md#1` |

## Version Guard (critical)

Current generation = dndkit.com **Latest** (`@dnd-kit/react@0.5.0`, with `dom`/`abstract`/`helpers`/`collision` at 0.5.0).

Reject these **legacy v1** markers — they must never appear in generated code:

| Legacy (reject) | Latest (use) |
|---|---|
| `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | `@dnd-kit/react` (+ `/sortable`), `@dnd-kit/dom`, `@dnd-kit/abstract`, `@dnd-kit/helpers` |
| `DndContext`, `SortableContext` | `DragDropProvider` (context is automatic) |
| `useSensor`, `useSensors` | `sensors` prop on `DragDropProvider` |
| `activationConstraint` (singular) | `PointerSensor.configure({activationConstraints: [...]})` |
| `MouseSensor`, `TouchSensor` | `PointerSensor` (handles mouse + touch + pen) |
| `arrayMove`, `closestCenter`, `sortableKeyboardCoordinates`, `onDragCancel` | `move()` from `@dnd-kit/helpers`; `closestCenter` from `@dnd-kit/collision`; `dragEnd.canceled` |

"v8"/"v10" are **legacy** version numbers of `@dnd-kit/sortable` — they are not newer than 0.5.0. Confirm with `README.md#1`.

## Key Rules

1. **Imports:** components/hooks ← `@dnd-kit/react`; `useSortable` ← `@dnd-kit/react/sortable`; sensors ← `@dnd-kit/dom`; `RestrictToElement`/`RestrictToWindow` ← `@dnd-kit/dom/modifiers`; `CollisionPriority` + axis/snap modifiers ← `@dnd-kit/abstract[/modifiers]`; `move()` ← `@dnd-kit/helpers`.
2. **`onDragEnd`:** test `event.canceled` first; `operation.source`/`operation.target` may be null — use `target?.id`.
3. **Sortable:** requires `id` + `index`; `group` enables cross-list sorting; give containers a lower `collisionPriority` (e.g. `CollisionPriority.Low`) so child items win collisions.
4. **`DragOverlay`:** render once per provider; children render only during a drag; function child receives `source`; `dropAnimation={null}` disables the drop animation.
5. **`accept` vs `type`:** the droppable's `accept` is evaluated against the **draggable's** `type`; the droppable's own `type` is metadata only.
6. **Provider event props:** array form **replaces** defaults; function form **extends** them.
7. **Pick the right hook:** reactive read → `useDragOperation`; lifecycle events → `useDragDropMonitor`; raw manager → `useDragDropManager`.

## Coverage Gaps

Not in this library — fetch upstream, **Latest only** (never `/legacy/`): sensors guide (`/react/guides/sensors/`), collision detection (`/react/guides/collision-detection/`), feedback (`/react/guides/feedback/`), sortable state (`/react/guides/sortable-state-management/`), v1→v2 migration (`/react/guides/migration/`), concepts & non-React (`/concepts/*`, `/<framework>/quickstart`).

## Budget

Entry cost ~2.2k tok (this file) + 100–300 tok per section read. Typical answer = **2.5–3k tok** vs 4–12k for reading whole docs. If context is tight: skip this file's tables and rely on `find` alone (~40 tok per query).

## Examples

1. **"Sort items across two lists"** → `find cross-list` → top hit `guides/multiple-sortable-lists.md#1` (L7-16, 10L) → `read guides/multiple-sortable-lists.md -s 1`. Answer: `useSortable({id, index, group: column})` + `useDroppable` with `collisionPriority: CollisionPriority.Low` + `move(items, event)` in `onDragOver`.
2. **"Does dnd-kit have `useSensor`?"** → `find useSensor` reaches only `README.md#1` → answer: No. `useSensor`/`useSensors` are legacy v1 markers; Latest uses the `sensors` prop with `PointerSensor.configure({activationConstraints})` (upstream sensors guide).

Always cite the doc + lines you actually read as the source of an answer.

## Related

`README.md` (version baseline) · `index.json` (auto-built section/topic index) · `scripts/dnd.py` (navigator CLI)