# Progress: Core Drag-and-Drop Ordering (Reorder)

**Branch:** `feature/core-reorder`
**Started:** 2026-09-08

## Session Log

### 2026-09-08 — Planning (Phase 1 + 2)
- Investigated `motion.dev/docs/react-reorder` via jina.ai (Reorder.Group/Item, useDragControls, axis detection, auto-scroll, z-index).
- Verified `framer-motion@13.1.1` exports `Reorder.Group` + `useDragControls` (terminal probe) → zero new dependency.
- Mapped plugin system (`PluginLoader`, `pluginManager`, `HookRegistry`, `PluginAPI`, `manifest-schema`), settings schema, people/forms ordering seams, Supabase `sort_order` columns.
- Documented constraints from repo memory: React 19 + Ark portal / AnimatePresence incompatibility, reduced-motion drag gating, barrel regeneration GOTCHA, token enforcement, `tsc -b` ground truth.
- Wrote `decision.md` (10 decisions), `findings.md`, `plan.md` (7 batches), `task_plan.md`.
- **Case study (FieldMappingTable):** analyzed `src/content/plugins/elvanto-sync/settings/components/FieldMappingTable.tsx` — confirmed the reorder feature applies. Requires: stable `id` per `MappingRule` (rows keyed by index today), handle-only drag (rows contain Ark Combobox portals), drag order = priority order (re-derive `priority` from position on save so the sync engine's priority sort keeps working), and a custom `persist` writing the reordered array to `settings.setConfig('field_mappings', ...)` (JSON blob, not a `sort_order` column). Added as **Batch 7**; polish batch renumbered to Batch 8.
- **Optimized plan (03_optimise-planning):** added consolidated `## Execution Protocol` table (Sync/Context/Tools/Budget/Gates) — references-over-inline, NOT 8 blocks × 8 batches (YAGNI). Removed 8 redundant "After this batch" sync lines + 5 duplicate per-batch verify tasks (covered by Quality Gates). Kept all signal: Context, Files, Instructions, TDD tasks. Batches 1-4,6 renumbered (last verify task dropped); 5,7,8 unchanged.
- **Plan update (user req):** every consecutive batch (2-9) now begins with a "mark previous batch complete" task (renumbered 2-8). Added **Batch 9: Cleanup & Consolidation** — deletes temp/test artifacts (verify-*.html, temp scripts, scratch fixtures) and consolidates planning files down to a single optimized `decision.md` in the hierarchical decision-log format (`## Decision Log: decision → Rationale (hierarchical numbered; parent = decision, sub = dependent)`, mirroring `.agents/planning/ui-ux/decision.md`); deletes findings/plan/task_plan/progress after consolidation.

### 2026-09-08 — Batch 1: Core `Reorder` compound component (TDD)
- Wrote failing test `src/core/ui/__tests__/reorder.test.tsx` (renders list+items, accessible handle, handle starts drag) → confirmed FAIL (module missing).
- Created `src/core/theme/recipes/reorder.ts` slot recipe (`root`/`item`/`handle`; root: list reset + flex column + gap; item: flex row + gap; handle: grab cursor + `touchAction: none` + active grabbing). Registered in `recipes` object in `src/core/theme/recipes/index.ts` (NOT `slotRecipes` — house pattern). Ran `pnpm panda` → `styled-system/recipes/reorder.*` generated.
- Created `src/core/ui/reorder.tsx` — `Reorder.Root` (wraps `MotionReorder.Group`), `Reorder.Item` (wraps `MotionReorder.Item`, handle-only drag via `useDragControls` + `dragListener={false}` + `dragControls` context), `Reorder.Handle` (IconButton `variant="plain"` + `GripVerticalIcon`, `aria-label="Reorder item"`, `onPointerDown` → `controls.start(e)`). Exported from `src/core/ui/index.ts` (alphabetical, between RatingGroup and ScrollArea).
- **Design deviation:** applied `reorder()` slot classes manually via `cx()` instead of `createStyleContext`/`styled` — Panda's `styled` treats `transition` as a CSS prop, incompatible with motion's `Transition` (see Errors/Gotchas).
- Gates: `pnpm test -- reorder` 3/3 PASS · `pnpm typecheck` clean · `pnpm lint:tokens` clean.

### 2026-09-08 — Batch 2: `useOrderedCollection` + `OrderedCollectionService` (TDD)
- Wrote failing test `src/core/lib/__tests__/useOrderedCollection.test.tsx` (hook: load/reorder/dirty/save/rollback/reset; service: per-row sort_order persist + failure) → confirmed FAIL (modules missing).
- Created `src/core/lib/ordered-collection.ts` — `OrderedCollectionDefinition` (`collectionId`, `table`, `orderColumn` default `sort_order`, `scope`, `primaryKey` default `id`), `OrderedCollectionService.persist(definition, orderedIds)` → one typed Supabase update per row (`sort_order = index` + scope, `.eq(primaryKey, id)`), returns false on first error. Generic table name cast to `keyof Database['public']['Tables']`; payload cast `as never` (dynamic keys vs typed Update union).
- Created `src/core/lib/useOrderedCollection.ts` — `{ definition, load, persist? }` → `{ items, reorder, isDirty, save, reset, error }`. Optimistic `reorder`, `save` persists (defaults to `orderedCollectionService.persist` bound to definition; custom `persist` for JSON-blob cases like FieldMapping) and rolls back to last saved order on failure. Refs (`loadRef`/`persistRef`/`itemsRef`) keep callbacks stable, avoid stale closures.
- Created `src/core/lib/index.ts` barrel (re-exports both modules).
- Gates: `pnpm test -- useOrderedCollection` 7/7 PASS · `pnpm typecheck` clean · `pnpm lint:tokens` 1 pre-existing violation (unrelated ProfileSections work).

### 2026-09-08 — Batch 3: Mobile-First + A11y + Motion Polish (TDD)
- Wrote failing test `src/core/ui/__tests__/reorder-a11y.test.tsx` (≥44px handle + aria-label; reduced-motion zeroes release transition; default transition when motion allowed; `useReducedMotion` hook true/false) → confirmed FAIL (module missing).
- Added local `useReducedMotion` hook in `reorder.tsx` (exported; `window.matchMedia('(prefers-reduced-motion: reduce)')` + change listener — NOT framer's, per house pattern). `Reorder.Item` passes `transition={reducedMotion ? { duration: 0 } : transition}` — drag tracking never gated, only release animation suppressed.
- Handle: `size="lg"` (44px via button recipe `h: '11'`) instead of `size="sm"`; keeps `variant="plain"`, `aria-label="Reorder item"`, grab/grabbing cursors, `touchAction: 'none'` (handle only — waffle-sidebar lesson). Focus-visible ring already provided by button recipe `focusVisibleRing: 'outside'`.
- Added `@keyframes reorder-item-enter` / `reorder-item-exit` (opacity-only) to `src/index.css` (house pattern: `settings-slide-in-*` precedent). Applied enter animation to `item` slot in recipe (NOT `AnimatePresence` — React 19 + Ark portal guardrail). Ran `pnpm panda` (codegen accepted custom keyframe name).
- Auto-scroll: framer handles it inside `Page.Body`; no `overflow` clipping added (verified no change needed).
- Gates: `pnpm test -- reorder` 8/8 PASS · `pnpm typecheck` my files clean (4 pre-existing errors in unrelated ProfileSections test) · `pnpm lint:tokens` 1 pre-existing violation (unrelated).

## Errors / Gotchas
- **Panda `styled()` is incompatible with framer-motion components:** `styled(MotionReorder.Group/Item)` treats `transition` as a CSS property (it IS a CSS prop), so it would mangle motion's `Transition` prop and its type conflicts (`Transition<any>` vs `ConditionalValue<...>`). Also `styled` intercepts `as`. → `Reorder` applies the `reorder()` slot recipe classes manually via `cx()` instead of `createStyleContext`/`styled`. Documented in a NOTE comment in `reorder.tsx`.
- **Button recipe has no `ghost` variant** (only `solid | surface | subtle | outline | plain`) → `Reorder.Handle` uses `variant="plain"`.
- **happy-dom `getByRole('button')` returns duplicates** (6 for 3 buttons) — a happy-dom quirk. Use `container.querySelectorAll('button[aria-label=...]')` in tests instead.
- **Mocking `useDragControls` needs a full `DragControls` shape:** `DragGesture.mount` calls `dragControls.subscribe(...)`; a `{ start }`-only mock throws `dragControls.subscribe is not a function`. Mock must include `subscribe` (returns unsubscribe fn), `start`, `cancel`, `componentControls`.

## Test Results
- **Batch 1 (2026-09-08):** `pnpm test -- reorder` — 3/3 PASS (renders list+items in order; accessible handle per item; handle starts drag on pointerdown). `pnpm typecheck` clean. `pnpm lint:tokens` clean.
- **Batch 2 (2026-09-08):** `pnpm test -- useOrderedCollection` — 7/7 PASS (loads initial; reorders locally + dirty; persists + clears dirty; rolls back on failure; reset restores; service persists sort_order per row with scope; service returns false on error). `pnpm typecheck` clean. `pnpm lint:tokens` — 1 pre-existing violation in `src/modules/people/components/ProfileSections/JourneySection/JourneySection.tsx:160` (unrelated in-progress people-module work, NOT Batch 2 files).
- **Batch 3 (2026-09-08):** `pnpm test -- reorder` — 8/8 PASS (Batch 1 3 tests + Batch 3 5 tests: ≥44px handle via `button--size_lg`, reduced-motion zeroes release transition, default transition when motion allowed, `useReducedMotion` true/false). `pnpm typecheck` — my files clean; 4 pre-existing errors in unrelated `ProfileSections/JourneySection.test.tsx`. `pnpm lint:tokens` — same 1 pre-existing violation (unrelated).