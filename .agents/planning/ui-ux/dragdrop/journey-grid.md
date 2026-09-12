---
name: journey-grid-dnd
description: "Implement dnd-kit drag-and-drop in the journey grid manager (JourneySettingsManager.tsx): hierarchical row nesting for journey tracks + categories, and horizontal reordering of journey stage columns. Replaces the dead HTML5 DnD stub using the existing src/core/dragndrop/ SortableTree + a new horizontal stage sortable."
category: code-plan
risk: safe
source: local
tags: [dnd-kit, journey-grid, people-module, sortable-tree, hierarchical, stage-columns, drag-drop]
triggers: [journey-grid, journey-settings, journey-tracks, journey-stages, journey-categories, dnd-grid]
---

# Journey Grid Manager dnd-kit Implementation Plan

> **Status: `in_progress`** — executing via 04_executing-plans skill. Batch 1 (Journey Tree Helpers) in progress.

**Goal:** Replace the dead HTML5 DnD stub in `JourneySettingsManager.tsx` with dnd-kit — hierarchical row nesting for journey tracks + categories, and horizontal reordering of journey stage columns.

**Approach:** Two independent dnd contexts. **Rows:** convert `localTracks`/`localCategories` → `TreeNode[]` and render via the existing `SortableTree` (extended with a `renderRow` prop for full grid-row control); on reorder, convert back via a new `treeToJourneyData` helper. **Columns:** new `SortableStageColumns` horizontal sortable using `useSortable` directly. Remove the dead `dragOverId`/`dragPosition`/`getDropIndicator` stub.

**Branch:** `feat/people-module` (current) — journey grid is part of the people module; no new branch. **Pre-req:** commit the uncommitted dragndrop tree fix (`SortableTree.tsx`, `TreeNode.tsx`, `utils/tree.ts`, `utils/__tests__/tree.test.ts`) before starting — the journey grid builds on it.

## Scope
- **In:** `journey-tree-helpers.ts` (tracks/categories ↔ `TreeNode[]`), `renderRow` prop on `TreeNode`/`SortableTree`, `SortableStageColumns`, rewired `JourneySettingsManager`, tests, lint, typecheck, build.
- **Out:** Cross-tree drag between multiple grids, drag-to-reorder people within grid cells, virtualized rows, mobile touch editing (builder is desktop-only), new dnd-kit deps or v6 migration.

## What & Why
**What:** dnd-kit drag-and-drop in the journey grid manager — hierarchical row nesting (tracks + categories) + horizontal stage column reordering.
**Why:** The current grid has a dead HTML5 DnD stub (`dragOverId` is always `null`, no handlers wired). Staff need to visually reorganize journey tracks/categories (nesting) and stage columns. The dnd-kit core utility (`src/core/dragndrop/`) is already built and battle-tested — `SortableTree` follows the official dnd-kit tree example (descendant removal, depth projection, self-parent guard fixed 2026-09-12).

## Who
- **Primary:** Church admins/staff managing journey tracks, categories, stages.
- **Secondary:** Module developers reusing the `SortableTree` + `renderRow` pattern for grid-aligned tree rows.

## Constraints
- Must use existing @dnd-kit v2 infra (`src/core/dragndrop/`) — no new deps.
- Must preserve grid column alignment (`32px | Track/Category | stages ×N | 48px`) across header + rows.
- Must keep the save flow (`deriveAssignments` → `saveJourneyCategory`/`saveJourneyTrack`/`saveJourneyStage`).
- Must follow house patterns: `dropAnimation={null}` + CSS keyframes, reduced-motion (release only), 44px handles, `touch-action: none` on handles only.
- Must pass `tsc -b`, `vitest run`, `pnpm build` (token-lint gate).

## Non-Goals
- Cross-tree drag between multiple grids.
- Drag-to-reorder people within grid cells.
- Virtualized rows.
- Mobile touch editing (builder is desktop-only; form *filling* is mobile-first).
- New dnd-kit deps or v6 migration.

## Assumptions
- ✅ `SortableTree`'s drag lifecycle (descendant removal, depth projection, self-parent guard) is correct — fixed 2026-09-12, 260 tests pass.
- ✅ Nested `DragDropProvider`s (app + `SortableTree` + `SortableStageColumns`) work — verified pattern.
- ✅ Existing `journey-grid-helpers` (`buildRows`, `deriveAssignments`, `buildConnector`) remain the save/order source of truth.
- ⚠️ Browser automation can't complete dnd-kit v2 drags (`setPointerCapture` throws for synthetic pointerIds) — verify via unit tests + real user interaction.

## Current State Analysis (findings)
- `JourneySettingsManager.tsx` renders a CSS grid: `32px | Track/Category | stage columns ×N | 48px`.
- Rows built by `buildRows(tracks, categories, rowOrder)` → flat `GridRow[]` with `depth` + `connector` glyphs (`│`/`├`/`└`).
- `dragOverId` / `dragPosition` / `getDropIndicator` are a **dead stub** — `dragOverId` is always `null`, no drag handlers wired.
- Save flow: `deriveAssignments(rows, ...)` → `saveJourneyCategory` / `saveJourneyTrack` / `saveJourneyStage`.
- Data model: `JourneyTrackCategory.parent_id` (nullable → hierarchical), `JourneyTrack.category_id` (nullable), `JourneyStage.sort_order`.
- Existing infra: `SortableTree` (hierarchical tree, own `DragDropProvider`, official dnd-kit tree example), `TreeNode` (useSortable row), `SortableList` (vertical only).

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)
1. **Two independent dnd contexts (rows + columns)**
   - Rationale: rows and columns never interact; each `SortableTree` already owns its provider; avoids cross-axis collision complexity
2. **Tree as source of truth for rows**
   - Rationale: `SortableTree` already implements the official tree drag lifecycle (descendant removal, depth projection, reorder); convert tracks/categories ↔ `TreeNode[]`
   - Dependent: **New `journey-tree-helpers.ts`** (`tracksAndCategoriesToTree` + `treeToJourneyData`)
3. **Extend `TreeNode`/`SortableTree` with `renderRow` prop**
   - Rationale: journey grid rows must align to grid columns (connector + label + stage cells + delete); the default TreeNode layout (toggle + handle + label) can't express this
   - Dependent: **`renderRow(node, depth, { handleRef, isDragging, isDragSource, isExpanded, hasChildren, onToggle })`** replaces the whole row; no default `paddingLeft` when used
4. **Dedicated horizontal stage sortable (`SortableStageColumns`)**
   - Rationale: `SortableList` is vertical and double-registers (`useDragndropDraggable` + `useSortable`); stages need a flex-row layout using `useSortable` directly (proven `TreeNode` pattern)
5. **Remove the dead DnD stub**
   - Rationale: `dragOverId`/`dragPosition`/`getDropIndicator` are unused; dnd-kit provides drop feedback via `DragOverlay` + `isDropTarget`
6. **Keep connector glyphs via `renderRow`**
   - Rationale: visual continuity with the current grid; compute `│`/`├`/`└` from tree structure (reuse `buildConnector` logic)

## Approaches Considered
### Recommended: Two independent dnd contexts (SortableTree rows + SortableStageColumns columns)
```
<Stack>
  <Add buttons />
  <div grid>
    <header row>
      <div/> <div>Track/Category</div>
      <SortableStageColumns stages={orderedStages} onReorder={setStageOrder} />  ← own DragDropProvider
      <div/>
    </header>
    <SortableTree tree={treeNodes} onReorder={handleTreeReorder} renderRow={renderGridRow} />  ← own DragDropProvider
  </div>
  <Save/Cancel />
</Stack>
```
- Reuses the battle-tested `SortableTree` drag lifecycle; each context isolates its own provider; matches existing pattern.

### Alternative: Single combined DragDropProvider for rows + columns
- One manager handles both axes.
- **Rejected:** cross-axis collision complexity; rows and columns never interact; would require refactoring `SortableTree` to accept an external provider.

### Alternative: Custom journey tree component using `useSortable` directly
- Full control over row layout without touching core.
- **Rejected:** duplicates `SortableTree`'s drag lifecycle (descendant removal, depth projection, reorder, self-parent guard) — DRY violation, high bug risk.

### Alternative: Keep HTML5 DnD stub, add dnd-kit only for stages
- Minimal change.
- **Rejected:** no hierarchical nesting, no touch/keyboard a11y, no DragOverlay — fails requirement 1.

## Execution Protocol (apply every batch)
| Step | Action |
|------|--------|
| Sync | First task of each batch: mark PREVIOUS batch tasks complete in plan.md; update `progress.md` (summary, errors, decisions) |
| Context | Read `findings.md` refs only when needed; if context >70%, compact progress.md before next batch |
| Tools | `manage_todo_list` (1 in-progress); subagent for independent >5min subtasks; mask verbose tool output as `[Obs:N]` → progress.md |
| Budget | Stable 20% (plan/arch) · Current 30% · History 30% (progress.md refs) · Buffer 20% |
| Gates | Per-batch: `vitest` (TDD fail→pass), `tsc -b`, `pnpm build` |
| Masking | See `.agents/skills/boss/code-plan/03_optimise-planning/refs/MASKING-RULES.md` |
| KV-Cache | See `.agents/skills/boss/code-plan/03_optimise-planning/refs/KV-CACHE.md` |
| Partitioning | See `.agents/skills/boss/code-plan/03_optimise-planning/refs/PARTITIONING.md` |

---

## Phase 1: Setup & Foundation

### Batch 1: Journey Tree Helpers (TDD)

## Batch 1 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

## Batch 1 Context
- Overall Goal: dnd-kit journey grid — hierarchical rows + sortable stage columns
- Current Batch Goal: `journey-tree-helpers.ts` — tracks/categories ↔ `TreeNode[]`
- Previous Batch: (first batch) — dragndrop tree fix committed (pre-req)
- Key Findings: findings.md#tree (SortableTree lifecycle), journey-grid-helpers.ts (buildRows/deriveAssignments)
- Current State: Ready for tree helpers
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%
- Optimization Status: Clean

## Batch 1 Tools
- **Use `manage_todo_list`** — Create atomic tasks, max 1 in-progress
- **Use subagents** — For independent subtasks >5 min (context partitioning)
- **Apply Observation Masking** — After each tool call, summarize key findings in plan.md, replace verbose output with ref
- **Monitor Context** — If > 70% utilized, trigger compaction before next task

## Batch 1 Observation Masking
See `.agents/skills/boss/code-plan/03_optimise-planning/refs/MASKING-RULES.md`

## Batch 1 KV-Cache Optimization
See `.agents/skills/boss/code-plan/03_optimise-planning/refs/KV-CACHE.md`

## Batch 1 Context Partitioning
See `.agents/skills/boss/code-plan/03_optimise-planning/refs/PARTITIONING.md`

#### Subphase 1.1: `tracksAndCategoriesToTree`
**Context:** No tree helpers exist; `buildRows`/`deriveAssignments` operate on flat `GridRow[]`; `SortableTree` needs `TreeNode[]` (category nodes with children = sub-categories + tracks).
**Todo:**
- [ ] Write failing test: nested tree from tracks/categories (category → sub-category → track), prefixed ids `category:`/`track:`, `data.kind`
- [ ] Implement `tracksAndCategoriesToTree(tracks, categories)` in `src/modules/people/lib/journey-tree-helpers.ts`
- [ ] Refactor: reuse `gridCategoryId`/`gridTrackId` from `journey-grid-helpers`
**Subagent:** No (sequential, <5 min each)
**Deliverable:** Passing tree-build tests

#### Subphase 1.2: `treeToJourneyData`
**Context:** `SortableTree.onReorder` returns `TreeNode[]`; need tracks/categories with `parent_id`/`category_id`/`sort_order`.
**Todo:**
- [ ] Write failing test: round-trip (tree → data → tree), sibling `sort_order`, parent assignment, self-parent cycle guard
- [ ] Implement `treeToJourneyData(tree)` — depth-first walk, per-sibling-group counters, cycle guard
- [ ] Refactor: extract shared sibling-group logic
**Subagent:** No
**Deliverable:** Passing round-trip + guard tests
**Commit:** `feat(people): journey tree helpers for dnd grid`

## Batch 1 Compaction
- If context > 70%: compact before next batch — never exceed 80%
- Cache-friendly ordering: stable (plan, arch) → reusable (templates, patterns) → unique (current task)
- Quality check: Compaction must preserve decisions, commitments, context shifts — <5% quality degradation

---

## Phase 2: Core Implementation

### Batch 2: renderRow on TreeNode/SortableTree (TDD)

## Batch 2 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

## Batch 2 Context
- Overall Goal: dnd-kit journey grid — hierarchical rows + sortable stage columns
- Current Batch Goal: `renderRow` prop on `TreeNode`/`SortableTree` for grid-aligned rows
- Previous Batch: Batch 1 — tree helpers done (round-trip + guard tests pass)
- Key Findings: TreeNode.tsx (default toggle+handle+label layout), SortableTree.tsx (renderNode passthrough)
- Current State: Tree helpers done → renderRow
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%
- Optimization Status: Clean

## Batch 2 Tools
- **Use `manage_todo_list`** — Create atomic tasks, max 1 in-progress
- **Use subagents** — For independent subtasks >5 min (context partitioning)
- **Apply Observation Masking** — After each tool call, summarize key findings in plan.md, replace verbose output with ref
- **Monitor Context** — If > 70% utilized, trigger compaction before next task

## Batch 2 Observation Masking
See `.agents/skills/boss/code-plan/03_optimise-planning/refs/MASKING-RULES.md`

## Batch 2 KV-Cache Optimization
See `.agents/skills/boss/code-plan/03_optimise-planning/refs/KV-CACHE.md`

## Batch 2 Context Partitioning
See `.agents/skills/boss/code-plan/03_optimise-planning/refs/PARTITIONING.md`

#### Subphase 2.1: `TreeNode.renderRow`
**Context:** `TreeNode` renders default toggle + handle + label; journey grid rows need full grid-column control (connector + label + stage cells + delete).
**Todo:**
- [ ] Write failing test: `renderRow` replaces default layout, receives helpers (`handleRef`, `isDragging`, `isExpanded`, `hasChildren`, `onToggle`), no default `paddingLeft`
- [ ] Implement `renderRow` prop in `TreeNode.tsx`
- [ ] Refactor: keep `renderNode` backward-compatible
**Subagent:** No
**Deliverable:** Passing TreeNode renderRow tests

#### Subphase 2.2: `SortableTree.renderRow` passthrough
**Context:** `SortableTree` renders `TreeNode`; must forward `renderRow`.
**Todo:**
- [ ] Write failing test: `SortableTree` passes `renderRow` to `TreeNode`
- [ ] Implement passthrough in `SortableTree.tsx`
**Subagent:** No
**Deliverable:** Passing SortableTree renderRow tests
**Commit:** `feat(dragndrop): renderRow prop for custom tree rows`

## Batch 2 Compaction
- If context > 70%: compact before next batch — never exceed 80%
- Cache-friendly ordering: stable (plan, arch) → reusable (templates, patterns) → unique (current task)
- Quality check: Compaction must preserve decisions, commitments, context shifts — <5% quality degradation

### Batch 3: SortableStageColumns (TDD)

## Batch 3 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

## Batch 3 Context
- Overall Goal: dnd-kit journey grid — hierarchical rows + sortable stage columns
- Current Batch Goal: `SortableStageColumns` horizontal sortable
- Previous Batch: Batch 2 — `renderRow` prop done (TreeNode + SortableTree tests pass)
- Key Findings: TreeNode.tsx (useSortable pattern), SortableList.tsx (why NOT to reuse — vertical + double-register)
- Current State: renderRow done → stage sortable
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%
- Optimization Status: Clean

## Batch 3 Tools
- **Use `manage_todo_list`** — Create atomic tasks, max 1 in-progress
- **Use subagents** — For independent subtasks >5 min (context partitioning)
- **Apply Observation Masking** — After each tool call, summarize key findings in plan.md, replace verbose output with ref
- **Monitor Context** — If > 70% utilized, trigger compaction before next task

## Batch 3 Observation Masking
See `.agents/skills/boss/code-plan/03_optimise-planning/refs/MASKING-RULES.md`

## Batch 3 KV-Cache Optimization
See `.agents/skills/boss/code-plan/03_optimise-planning/refs/KV-CACHE.md`

## Batch 3 Context Partitioning
See `.agents/skills/boss/code-plan/03_optimise-planning/refs/PARTITIONING.md`

#### Subphase 3.1: Component
**Context:** Header stage columns are a flex row (`flex: 1 1 0; minWidth: STAGE_COL_MIN`); need horizontal reorder; `SortableList` is vertical + double-registers.
**Todo:**
- [ ] Write failing test: renders columns, reorder via mocked handlers, preserves flex layout
- [ ] Implement `SortableStageColumns.tsx` — own `DragDropProvider` + `DragOverlay dropAnimation={null}`, `useSortable` per column, `move()` on drag end
- [ ] Refactor: extract `StageColumn` sub-component
**Subagent:** No
**Deliverable:** Passing SortableStageColumns tests
**Commit:** `feat(people): horizontal sortable stage columns`

## Batch 3 Compaction
- If context > 70%: compact before next batch — never exceed 80%
- Cache-friendly ordering: stable (plan, arch) → reusable (templates, patterns) → unique (current task)
- Quality check: Compaction must preserve decisions, commitments, context shifts — <5% quality degradation

### Batch 4: Rewire JourneySettingsManager (TDD)

## Batch 4 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

## Batch 4 Context
- Overall Goal: dnd-kit journey grid — hierarchical rows + sortable stage columns
- Current Batch Goal: wire `SortableTree` + `SortableStageColumns` into `JourneySettingsManager`, remove dead stub
- Previous Batch: Batch 3 — `SortableStageColumns` done
- Key Findings: JourneySettingsManager.tsx (localTracks/localCategories/localStages, rowOrder/stageOrder, isDirty, handleSave)
- Current State: Stage sortable done → rewire manager
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%
- Optimization Status: Clean

## Batch 4 Tools
- **Use `manage_todo_list`** — Create atomic tasks, max 1 in-progress
- **Use subagents** — For independent subtasks >5 min (context partitioning)
- **Apply Observation Masking** — After each tool call, summarize key findings in plan.md, replace verbose output with ref
- **Monitor Context** — If > 70% utilized, trigger compaction before next task

## Batch 4 Observation Masking
See `.agents/skills/boss/code-plan/03_optimise-planning/refs/MASKING-RULES.md`

## Batch 4 KV-Cache Optimization
See `.agents/skills/boss/code-plan/03_optimise-planning/refs/KV-CACHE.md`

## Batch 4 Context Partitioning
See `.agents/skills/boss/code-plan/03_optimise-planning/refs/PARTITIONING.md`

#### Subphase 4.1: Wire tree + stage sortable
**Context:** `localTracks`/`localCategories`/`localStages` + `rowOrder`/`stageOrder` state; need `treeNodes` + `handleTreeReorder` + `SortableStageColumns`.
**Todo:**
- [ ] Write failing test: renders `SortableTree` + `SortableStageColumns`, reorder updates local state
- [ ] Add `treeNodes` useMemo + `handleTreeReorder` (`treeToJourneyData` → `setLocalTracks`/`setLocalCategories`)
- [ ] Replace header stage columns with `SortableStageColumns`
**Subagent:** No
**Deliverable:** JourneySettingsManager renders dnd grid

#### Subphase 4.2: Remove stub + fix isDirty/save
**Context:** dead `dragOverId`/`dragPosition`/`getDropIndicator`; `rowOrder` redundant; save uses `deriveAssignments`.
**Todo:**
- [ ] Write failing test: save payload reflects reordered tree (`parent_id`/`category_id`/`sort_order`)
- [ ] Remove dead stub; update `isDirty` (drop `rowOrder`); keep save via `deriveAssignments(buildRows(...))` or `treeToJourneyData` output
- [ ] Refactor: extract `renderGridRow` (connector + label + stage cells + delete)
**Subagent:** No
**Deliverable:** Full dnd grid with correct save
**Commit:** `feat(people): dnd-kit journey grid manager`

## Batch 4 Compaction
- If context > 70%: compact before next batch — never exceed 80%
- Cache-friendly ordering: stable (plan, arch) → reusable (templates, patterns) → unique (current task)
- Quality check: Compaction must preserve decisions, commitments, context shifts — <5% quality degradation

---

## Phase 3: Testing & Quality

### Batch 5: Integration & Quality Gates

## Batch 5 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
- [ ] **Context Check**: If estimated context > 70%, run compaction before proceeding

## Batch 5 Context
- Overall Goal: dnd-kit journey grid — hierarchical rows + sortable stage columns
- Current Batch Goal: component coverage + full quality gates
- Previous Batch: Batch 4 — JourneySettingsManager rewired, dead stub removed
- Key Findings: existing journey-grid-helpers tests, token-lint rules (scripts/lint-tokens.mjs)
- Current State: Manager rewired → quality gates
- Budget: Stable 20% | Current 30% | History 30% | Buffer 20%
- Optimization Status: Clean

## Batch 5 Tools
- **Use `manage_todo_list`** — Create atomic tasks, max 1 in-progress
- **Use subagents** — For independent subtasks >5 min (context partitioning)
- **Apply Observation Masking** — After each tool call, summarize key findings in plan.md, replace verbose output with ref
- **Monitor Context** — If > 70% utilized, trigger compaction before next task

## Batch 5 Observation Masking
See `.agents/skills/boss/code-plan/03_optimise-planning/refs/MASKING-RULES.md`

## Batch 5 KV-Cache Optimization
See `.agents/skills/boss/code-plan/03_optimise-planning/refs/KV-CACHE.md`

## Batch 5 Context Partitioning
See `.agents/skills/boss/code-plan/03_optimise-planning/refs/PARTITIONING.md`

#### Subphase 5.1: Component tests
**Context:** `JourneySettingsManager` rewired; need coverage for render + reorder + save.
**Todo:**
- [ ] Add `JourneySettingsManager` component tests (render, reorder handlers, save payload)
- [ ] Verify existing `journey-grid-helpers` tests still pass
**Subagent:** Yes (parallel test authoring)
**Deliverable:** ≥70% coverage on new code

#### Subphase 5.2: Full gates
**Context:** all code written; run quality gates.
**Todo:**
- [ ] `npx tsc -b` → exit 0 (real gate — root tsconfig is solution-style)
- [ ] `npx vitest run` → all pass
- [ ] `pnpm build` → exit 0 (token-lint gate)
- [ ] Manual browser verification (real user interaction — automation can't complete dnd-kit v2 drags)
**Subagent:** No
**Deliverable:** All gates green
**Commit:** `chore(people): journey grid dnd quality gates`

## Batch 5 Compaction
- If context > 70%: compact before next batch — never exceed 80%
- Cache-friendly ordering: stable (plan, arch) → reusable (templates, patterns) → unique (current task)
- Quality check: Compaction must preserve decisions, commitments, context shifts — <5% quality degradation

---

## Validation Gates
- [ ] `npx tsc -b` exit 0 (real typecheck gate — `tsc --noEmit` on root tsconfig is a false positive)
- [ ] `npx vitest run` all pass (incl. existing `journey-grid-helpers`)
- [ ] `pnpm build` exit 0 (token-lint gate)
- [ ] Tree round-trip tests pass (tracks/categories ↔ `TreeNode[]`)
- [ ] Self-parent cycle guard test passes
- [ ] `JourneySettingsManager` renders dnd grid; save payload correct
- [ ] Manual browser verification: drag row to nest under category; drag stage column to reorder

## Open Questions
- [ ] Keep connector glyphs (`│`/`├`/`└`) via `renderRow`, or indentation-only?
- [ ] Remove `rowOrder` entirely or keep for compat (`isDirty` + save depend on it)?
- [ ] Should `renderRow` be a core API or journey-local extension?

## Risks & Notes
- **Self-parent guard**: `getProjection` can return `parentId === source.id` (fixed in `SortableTree` 2026-09-12) — `treeToJourneyData` must also guard against cycles.
- **Nested providers**: app-level + `SortableTree` + `SortableStageColumns` = 3 providers; verified pattern, but keep each isolated.
- **Browser automation**: synthetic pointer events can't complete dnd-kit v2 drags (`setPointerCapture` throws); verify via unit tests + real user interaction.
- **Reduced motion**: `dropAnimation={null}` + CSS keyframes (house pattern); direct manipulation never gated on reduced motion.
- **`rowOrder`**: becomes redundant once the tree is the source of truth — remove carefully (`isDirty` + save depend on it).