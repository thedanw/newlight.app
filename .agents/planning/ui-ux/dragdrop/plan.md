# Plan: Core Drag-and-Drop Ordering (Reorder)

**Goal:** Build a reusable, mobile-first drag-to-reorder capability into `src/core` — a `Reorder` compound component (Park UI style), an `useOrderedCollection` persistence hook, and a plugin-facing `reorder` API — that modules and plugins consume instead of their current ad-hoc ordering code.

**Approach:** Wrap `framer-motion`'s `Reorder` (already installed, verified `Reorder.Group` + `useDragControls` in `framer-motion@13.1.1`) in a thin core abstraction: `Reorder.Root/Item/Handle` compound components (slot recipe, semantic/hierarchical naming) + `useOrderedCollection` (optimistic `sort_order` persistence with rollback) + `OrderedCollectionService`. Extend `PluginAPIContext` with a `reorder` API and `HookRegistry` with `registerOrderedCollection` so plugins declare/consume reorderable collections. Adopt first in `JourneySettingsManager` (replaces hand-rolled HTML5 DnD) and `FormBuilderPage` (replaces Up/Down buttons). Enter/exit via CSS keyframes (NOT `AnimatePresence` — React 19 + Ark portal guardrail). Drag tracking never gated on reduced motion.

**Branch:** `feature/core-reorder` (from `main`)

## Scope
- In: `Reorder` compound component + recipe, `useOrderedCollection` + `OrderedCollectionService`, plugin `reorder` API + `registerOrderedCollection`, Journey + Forms adoption, **Elvanto FieldMappingTable plugin adoption (case study)**, mobile-first + reduced-motion handling, CSS-keyframe enter/exit, tests, docs.
- Out: New drag library install, cross-list drag, list virtualization, profile-section reordering, dashboard-widget/nav-item reorder UI (API only), runtime plugin-loading changes.

## Execution Protocol (apply every batch)
| Step | Action |
|------|--------|
| Sync | First task of each batch: mark PREVIOUS batch tasks complete in plan.md; update `progress.md` (summary, errors, decisions); commit |
| Context | Read `findings.md` refs only when needed; if context >70%, compact progress.md before next batch |
| Tools | `manage_todo_list` (1 in-progress); subagent for independent >5min subtasks; mask verbose tool output as `[Obs:N]` → progress.md |
| Budget | Stable 20% (plan/arch) · Current 30% · History 30% (progress.md refs) · Buffer 20% |
| Gates | Per-batch: `pnpm test -- <batch>` (TDD fail→pass), `tsc -b`, `pnpm lint:tokens` (see Quality Gates) |

## Action Items

---

### Batch 1: Core `Reorder` Compound Component (TDD)

**Context:** You are adding a new compound component `Reorder` to `src/core/ui`, mirroring the `Page.Root/Header/Body` pattern (createStyleContext + slot recipe). It wraps `framer-motion`'s `Reorder.Group`/`Reorder.Item`/`useDragControls`. Modules/plugins must NOT import framer-motion directly — core owns the dependency. The recipe file must NOT export runtime values (build-time-only `@pandacss/dev` import).

**Files you will touch:**
- `src/core/theme/recipes/reorder.ts` — new `defineSlotRecipe` (`root`, `item`, `handle`)
- `src/core/ui/reorder.tsx` — `Reorder.Root`, `Reorder.Item`, `Reorder.Handle` compound component
- `src/core/ui/index.ts` — export `Reorder` (alphabetical; re-add after any `park-ui add`)

**Instructions:**
1. `Reorder.Root` wraps `Reorder.Group` from `framer-motion`; props: `values`, `onReorder`, `axis` (default auto-detect), `as` passthrough. Renders the recipe `root` slot with `position: relative` (enables dragged-item z-index).
2. `Reorder.Item` wraps `Reorder.Item`; props: `value`, `dragListener`, `dragControls` passthrough. Renders recipe `item` slot.
3. `Reorder.Handle` wraps `useDragControls` + `onPointerDown={(e) => controls.start(e)}`; renders an `IconButton` (Park UI) with `GripVertical` lucide icon; ≥44px target (`boxSize="11"`); `cursor="grab"` / `cursor="grabbing"` via recipe.
4. Recipe slots: `root` (list reset, `position: relative`, `display: flex`, `flexDirection: column`, `gap`), `item` (`position: relative`, `touchAction: 'none'` on handle only), `handle` (grab cursor, active:grabbing).
5. Do NOT use `AnimatePresence` anywhere in this batch.
6. Export `Reorder` from `src/core/ui/index.ts`.

- [x] Task 1.1: **Write failing test** — `Reorder` renders a list and fires `onReorder` with a reordered array when items are reordered programmatically
  Code: `src/core/ui/__tests__/reorder.test.tsx`
- [x] Task 1.2: **Run test** to verify it fails
  Run: `pnpm test -- reorder`
  Expected: FAIL (component doesn't exist)
- [x] Task 1.3: Create `src/core/theme/recipes/reorder.ts` slot recipe (`root`/`item`/`handle`)
- [x] Task 1.4: Create `src/core/ui/reorder.tsx` compound component (`Reorder.Root`, `Reorder.Item`, `Reorder.Handle`)
- [x] Task 1.5: Export `Reorder` from `src/core/ui/index.ts`
- [x] Task 1.6: **Run test** to verify it passes
  Run: `pnpm test -- reorder`
  Expected: PASS

---

### Batch 2: `useOrderedCollection` + `OrderedCollectionService` (TDD)

**Context:** You are adding the persistence layer in `src/core/lib`. `useOrderedCollection` manages an ordered id-array with optimistic updates and a persist callback. `OrderedCollectionService` is the Supabase-backed writer that updates `sort_order` columns (the canonical ordering column — verified on journey + forms tables). It must roll back on failure and expose `isDirty`/`save`/`reset`.

**Files you will touch:**
- `src/core/lib/ordered-collection.ts` — `OrderedCollectionDefinition`, `OrderedCollectionService`, `OrderedCollection` types
- `src/core/lib/useOrderedCollection.ts` — the React hook
- `src/core/lib/index.ts` — export new modules (if a barrel exists; else create one)

**Instructions:**
1. `OrderedCollectionDefinition`: `{ collectionId: string; table: string; orderColumn?: string (default 'sort_order'); scope: Record<string, unknown> (e.g. { journey_id }) ; primaryKey?: string (default 'id') }`.
2. `OrderedCollectionService.persist(definition, orderedIds)` → single Supabase update per row (`sort_order = index`) or a batched update; returns success/failure.
3. `useOrderedCollection({ definition, load, persist })` → `{ items, reorder, isDirty, save, reset, error }`. `reorder` updates local state optimistically; `save` calls `persist` and rolls back on failure.
4. Keep it framework-agnostic (no framer imports here) so plugins can use it too.
5. Use `supabase` from the app's typed client (`@/core/lib/supabase` or wherever the typed client lives — match existing query patterns in `src/modules/people/lib/queries.ts`).

- [x] Task 2.1: Mark Batch 1 tasks complete in plan.md; update `progress.md`
- [x] Task 2.2: **Write failing test** — `useOrderedCollection` reorders locally, marks dirty, persists, and rolls back on failure
  Code: `src/core/lib/__tests__/useOrderedCollection.test.tsx`
- [x] Task 2.3: **Run test** to verify it fails
  Run: `pnpm test -- useOrderedCollection`
  Expected: FAIL
- [x] Task 2.4: Implement `OrderedCollectionDefinition` + `OrderedCollectionService` in `src/core/lib/ordered-collection.ts`
- [x] Task 2.5: Implement `useOrderedCollection` hook in `src/core/lib/useOrderedCollection.ts`
- [x] Task 2.6: Export from `src/core/lib/index.ts`
- [x] Task 2.7: **Run test** to verify it passes
  Run: `pnpm test -- useOrderedCollection`
  Expected: PASS

---

### Batch 3: Mobile-First + A11y + Motion Polish (TDD)

**Context:** You are hardening the primitive for the app's mobile-first principle and the documented motion constraints. Drag tracking must NEVER be gated on `prefers-reduced-motion` (only release animation suppressed — waffle-sidebar lesson). Enter/exit uses CSS keyframes, NOT `AnimatePresence` (React 19 + Ark portal guardrail). Handles are ≥44px. Auto-scroll works inside `Page.Body` scroll containers.

**Files you will touch:**
- `src/core/ui/reorder.tsx` — reduced-motion handling, CSS-keyframe enter/exit, handle sizing
- `src/core/theme/recipes/reorder.ts` — `touchAction`, cursor, focus-visible, active states
- `src/index.css` — CSS keyframe animations for item enter/exit (house pattern: `settings-slide-in-right` precedent)

**Instructions:**
1. Add `useReducedMotion`-equivalent (local `window.matchMedia` hook — do NOT import framer's, per house pattern) to suppress only the release animation.
2. Add CSS keyframes `reorder-item-enter` / `reorder-item-exit` in `src/index.css`; apply via recipe slots (NOT `AnimatePresence`).
3. Ensure `Reorder.Handle` is ≥44px (`boxSize="11"`), has `focus-visible` ring, `aria-label` (e.g. "Reorder item"), and `cursor: grab`/`grabbing`.
4. Verify `touch-action` is set so vertical scroll isn't broken on the list body (handle only, not the whole item — waffle-sidebar lesson).
5. Confirm auto-scroll works when `Reorder.Root` is inside `Page.Body` (framer handles it; just verify no `overflow` clipping).

- [ ] Task 3.1: Mark Batch 2 tasks complete in plan.md; update `progress.md`
- [ ] Task 3.2: **Write failing test** — handle has ≥44px target and `aria-label`; reduced-motion suppresses only release animation
  Code: `src/core/ui/__tests__/reorder-a11y.test.tsx`
- [ ] Task 3.3: **Run test** to verify it fails
  Run: `pnpm test -- reorder-a11y`
  Expected: FAIL
- [ ] Task 3.4: Add CSS keyframes + recipe polish (touch-action, cursors, focus-visible, active states)
- [ ] Task 3.5: Add reduced-motion handling + handle sizing/aria in `reorder.tsx`
- [ ] Task 3.6: **Run test** to verify it passes
  Run: `pnpm test -- reorder-a11y`
  Expected: PASS

---

### Batch 4: Plugin System Integration — `reorder` API (TDD)

**Context:** You are extending the plugin seam so plugins can declare and consume reorderable collections. `PluginAPIContext` (`src/core/plugins/PluginAPI.tsx`) gains a `reorder` API; `HookRegistry` gains `registerOrderedCollection` (with per-plugin tracking, mirroring existing registries). Plugins then use the same `useOrderedCollection` core hook.

**Files you will touch:**
- `src/core/plugins/PluginAPI.tsx` — add `reorder` to `PluginAPIContext` + `createPluginReorderAPI`
- `src/core/plugins/HookRegistry.ts` — add `OrderedCollection` type + `registerOrderedCollection`/`getOrderedCollections`/`clearPluginRegistrations` update
- `src/core/plugins/manifest-schema.ts` — add `orderedCollections?` to manifest schema (optional)
- `src/core/plugins/index.ts` — re-export new types

**Instructions:**
1. `OrderedCollection` type: `{ id: string; definition: OrderedCollectionDefinition; label?: string }`.
2. `createPluginReorderAPI(pluginName)` → `{ register(collection: OrderedCollection): void }`; `register` calls `HookRegistry.registerOrderedCollection(collection, pluginName)`.
3. `registerOrderedCollection` dedupes by `id`, tracks per-plugin (extend `pluginRegistrations` map), exposes `getOrderedCollections()`.
4. Add optional `orderedCollections?: PluginOrderedCollection[]` to `PluginManifest` (Zod schema) — declarative registration path.
5. Plugins consume via `usePluginAPI().reorder.register(...)` + the core `useOrderedCollection` hook (imported from `@/core/lib`).

- [ ] Task 4.1: Mark Batch 3 tasks complete in plan.md; update `progress.md`
- [ ] Task 4.2: **Write failing test** — a plugin registers an ordered collection via the API and it's retrievable + tracked per-plugin
  Code: `src/core/plugins/__tests__/reorder-api.test.tsx`
- [ ] Task 4.3: **Run test** to verify it fails
  Run: `pnpm test -- reorder-api`
  Expected: FAIL
- [ ] Task 4.4: Add `OrderedCollection` type + `registerOrderedCollection`/`getOrderedCollections` to `HookRegistry.ts`
- [ ] Task 4.5: Add `reorder` API to `PluginAPI.tsx` (`createPluginReorderAPI` + context field)
- [ ] Task 4.6: Add optional `orderedCollections` to `manifest-schema.ts` + re-export from `plugins/index.ts`
- [ ] Task 4.7: **Run test** to verify it passes
  Run: `pnpm test -- reorder-api`
  Expected: PASS

---

### Batch 5: People Module Adoption — JourneySettingsManager (TDD)

**Context:** You are replacing the hand-rolled HTML5 `draggable` DnD in `src/modules/people/components/JourneySettingsManager.tsx` with the core `Reorder` + `useOrderedCollection`. It currently maintains `trackOrder`/`categoryOrder`/`stageOrder` id-arrays, `moveItem(ids, draggedId, targetId)`, and persists `sort_order: index`. Keep the same persistence semantics; delete the bespoke DnD code.

**Files you will touch:**
- `src/modules/people/components/JourneySettingsManager.tsx` — replace HTML5 DnD with `Reorder` + `useOrderedCollection`
- `src/modules/people/lib/queries.ts` — add/keep `sort_order` query ordering (already `.order('sort_order')`)

**Instructions:**
1. Replace `draggable`/`onDragStart`/`onDragOver`/`onDrop` with `<Reorder.Root values={...} onReorder={...}>` + `<Reorder.Item>` + `<Reorder.Handle>`.
2. Wire each collection (tracks, categories, stages) through `useOrderedCollection` with `definition` scoped by parent id (e.g. `{ journey_id }`).
3. Keep `saveJourney*` persistence calls; route through `useOrderedCollection.save()`.
4. Delete `moveItem` + bespoke DnD handlers once replaced.
5. Verify mobile: handle-only drag, list body still scrolls.

- [ ] Task 5.1: Mark Batch 4 tasks complete in plan.md; update `progress.md`
- [ ] Task 5.2: **Write failing test** — journey stage reorder persists `sort_order` via the core hook
  Code: `src/modules/people/__tests__/journey-reorder.test.tsx`
- [ ] Task 5.3: **Run test** to verify it fails
  Run: `pnpm test -- journey-reorder`
  Expected: FAIL
- [ ] Task 5.4: Replace tracks/categories/stages DnD with `Reorder` + `useOrderedCollection`
- [ ] Task 5.5: Delete bespoke `moveItem`/HTML5 DnD handlers
- [ ] Task 5.6: **Run test** to verify it passes
  Run: `pnpm test -- journey-reorder`
  Expected: PASS
- [ ] Task 5.7: Verify `pnpm typecheck` + `pnpm lint:tokens` clean; manual browser smoke test on `/people` journey settings

---

### Batch 6: Forms Module Adoption — FormBuilderPage (TDD)

**Context:** You are replacing the manual Up/Down buttons in `src/modules/people/pages/FormBuilderPage.tsx` (`moveField(index, -1/+1)`) with the core `Reorder` + `useOrderedCollection`, mapping draft `sort_order` ↔ `form_fields.sort_order`. Keep the Up/Down buttons as an accessibility fallback (keyboard users) OR remove if the a11y story is solid — decide in review.

**Files you will touch:**
- `src/modules/people/pages/FormBuilderPage.tsx` — replace Up/Down with `Reorder` + `useOrderedCollection`
- `src/modules/people/lib/form-queries.ts` — keep `.order('sort_order')`

**Instructions:**
1. Replace the field list with `<Reorder.Root values={fieldIds} onReorder={...}>` + `<Reorder.Item>` + `<Reorder.Handle>`.
2. Wire through `useOrderedCollection` with `definition` scoped by `form_id`.
3. Keep the Up/Down buttons as a keyboard fallback (recommended) — they call the same `reorder` path.
4. Verify mobile: handle-only drag, form preview still scrolls.

- [ ] Task 6.1: Mark Batch 5 tasks complete in plan.md; update `progress.md`
- [ ] Task 6.2: **Write failing test** — form field reorder persists `sort_order` via the core hook
  Code: `src/modules/people/__tests__/form-reorder.test.tsx`
- [ ] Task 6.3: **Run test** to verify it fails
  Run: `pnpm test -- form-reorder`
  Expected: FAIL
- [ ] Task 6.4: Replace Up/Down field list with `Reorder` + `useOrderedCollection` (keep buttons as fallback)
- [ ] Task 6.5: **Run test** to verify it passes
  Run: `pnpm test -- form-reorder`
  Expected: PASS

---

### Batch 7: Plugin Adoption — Elvanto FieldMappingTable (TDD)

**Context:** You are applying the core reorder feature to the plugin case study: `src/content/plugins/elvanto-sync/settings/components/FieldMappingTable.tsx`. Rows are `MappingRule[]` with an explicit `priority: number`; `saveMappings()` sorts by priority descending and writes the whole array to `settings.setConfig('field_mappings', ...)` (a JSON config blob in `elvanto_sync_config`, NOT a `sort_order` column). Rows are keyed by `index` (unstable) and contain Ark UI `Combobox` (portal-based) controls. This batch validates the pluggable `persist` design and the handle-only drag pattern.

**Files you will touch:**
- `src/content/plugins/elvanto-sync/settings/components/FieldMappingTable.tsx` — add stable ids, wrap rows in `Reorder`, add `Reorder.Handle`, re-derive priority on save
- `src/content/plugins/elvanto-sync/settings/FieldMappingTab.tsx` — no change expected; verify

**Instructions:**
1. Add a stable `id` to `MappingRule` (e.g. `crypto.randomUUID()` on load/create) — `Reorder.Item` needs stable `value`s; `key={index}` must become `key={rule.id}`. (Duplicates exist — two `access_permission`/`admin` rows differ only by `direction` — so a real id is required, not a composite key.)
2. Wrap the `mappings.map(...)` in `<Reorder.Root values={mappingIds} onReorder={...}>`; each `MappingRuleCard` becomes `<Reorder.Item value={rule.id}>` with a `<Reorder.Handle>` at the start of the row.
3. Use handle-only drag (`dragListener={false}` + `dragControls` via `Reorder.Handle`) — rows contain Ark `Combobox` portals; the whole row must NOT be draggable or the inputs become unusable.
4. Do NOT wrap rows in `AnimatePresence` (React 19 + Ark portal guardrail). Enter/exit via CSS keyframes or none.
5. Priority semantics: drag order = priority order. On save, re-derive `priority` from position (e.g. `priority = (count - index) * 10`) so the sync engine's `priority`-based sort keeps working. Keep or remove the `Priority` NumberInput per review.
6. Persistence: use `useOrderedCollection` with a custom `persist` that writes the reordered array (with re-derived priorities) to `settings.setConfig('field_mappings', ...)` — NOT the default `sort_order` column path.
7. Optionally register the collection via `api.reorder.register({ id: 'elvanto:field-mappings', definition: {...} })`.

- [ ] Task 7.1: Mark Batch 6 tasks complete in plan.md; update `progress.md`
- [ ] Task 7.2: **Write failing test** — field mapping rows reorder and persist re-derived priorities
  Code: `src/content/plugins/elvanto-sync/settings/__tests__/field-mapping-reorder.test.tsx`
- [ ] Task 7.3: **Run test** to verify it fails
  Run: `pnpm test -- field-mapping-reorder`
  Expected: FAIL
- [ ] Task 7.4: Add stable `id` to `MappingRule` + key rows by id
- [ ] Task 7.5: Wrap rows in `Reorder.Root`/`Reorder.Item`/`Reorder.Handle` (handle-only drag)
- [ ] Task 7.6: Re-derive `priority` from position on save; wire `useOrderedCollection` with custom `persist`
- [ ] Task 7.7: **Run test** to verify it passes
  Run: `pnpm test -- field-mapping-reorder`
  Expected: PASS
- [ ] Task 7.8: Verify `pnpm typecheck` + `pnpm lint:tokens` clean; browser smoke test on `/settings/integrations/elvanto-sync`

---

### Batch 8: Polish, Docs & Quality Gates

**Context:** You are finalizing. Add a styleguide demo (house pattern: `src/styleguide/pages/demos/`), document the plugin API, and run all quality gates. Also re-check the `src/core/ui/index.ts` barrel is intact (no `park-ui add` was run, but verify).

**Files you will touch:**
- `src/styleguide/pages/demos/` — add a `Reorder` demo (new category module or extend existing)
- `.agents/planning/ui-ux/dragdrop/` — mark plan complete
- `src/core/ui/index.ts` — verify barrel intact

**Instructions:**
1. Add a `Reorder` demo to the styleguide (vertical list + grid + handle-only drag).
2. Document the plugin `reorder` API in the plugin docs (wherever plugin authoring is documented).
3. Run full gates: `pnpm typecheck` (`tsc -b`), `pnpm lint:tokens`, `pnpm test`, `pnpm build`.
4. Verify barrel exports intact; no framer-motion imports leaked into modules/plugins (grep).

- [ ] Task 8.1: Mark Batch 7 tasks complete in plan.md; update `progress.md`
- [ ] Task 8.2: Add `Reorder` styleguide demo
- [ ] Task 8.3: Document plugin `reorder` API
- [ ] Task 8.4: Run `pnpm typecheck` + `pnpm lint:tokens` — clean
- [ ] Task 8.5: Run `pnpm test` — all pass
- [ ] Task 8.6: Run `pnpm build` — clean
- [ ] Task 8.7: Grep modules/plugins for direct `framer-motion` imports — none (core owns the dependency)

---

### Batch 9: Cleanup & Consolidation

**Context:** Remove all test/temp artifacts created during execution and consolidate the planning files down to a single optimized `decision.md` in the hierarchical decision-log format (matching `.agents/planning/ui-ux/decision.md`). The durable record is the decision log; `findings.md`/`plan.md`/`task_plan.md`/`progress.md` are transient execution artifacts.

**Files you will touch:**
- `.agents/planning/ui-ux/dragdrop/` — consolidate to `decision.md` only
- `src/**` + project root — remove temp/test artifacts

**Instructions:**
1. Delete temp/test artifacts: `verify-*.html`, temp `.cjs`/`.mjs` scripts, scratch fixtures, scaffolding-only test files (keep real tests).
2. Grep for temp files (`verify-`, `tmp-`, `scratch`, `debug`) in `src/` + project root; delete.
3. Consolidate planning files into `decision.md` — use the `## Decision Log: decision → Rationale (hierarchical numbered; parent = decision, sub = dependent)` format (mirror `.agents/planning/ui-ux/decision.md`); add reorder decisions as a numbered hierarchy (e.g. `17 Reorder` with `17.1`–`17.x` sub-decisions), folding in key findings + plan scope.
4. Delete `findings.md`, `plan.md`, `task_plan.md`, `progress.md` after consolidation.
5. Verify `pnpm typecheck` + `pnpm lint:tokens` + `pnpm test` + `pnpm build` clean after artifact removal.

- [ ] Task 9.1: Mark Batch 8 tasks complete in plan.md; update `progress.md`
- [ ] Task 9.2: Delete temp/test artifacts (verify-*.html, temp scripts, scratch fixtures)
- [ ] Task 9.3: Consolidate planning files into optimized `decision.md` (hierarchical decision-log format)
- [ ] Task 9.4: Delete `findings.md`, `plan.md`, `task_plan.md`, `progress.md`
- [ ] Task 9.5: Run full gates (`tsc -b`, `lint:tokens`, `test`, `build`) — clean
- [ ] Task 9.6: Final commit + push `feature/core-reorder`

---

## Git Strategy

- **Branch:** `feature/core-reorder` from `main`
- **Commit points:** after each batch, conventional messages:
  - Batch 1: `feat(core): add Reorder compound component`
  - Batch 2: `feat(core): add useOrderedCollection + OrderedCollectionService`
  - Batch 3: `feat(core): mobile-first + a11y + motion polish for Reorder`
  - Batch 4: `feat(plugins): add reorder API + registerOrderedCollection`
  - Batch 5: `feat(people): adopt Reorder in JourneySettingsManager`
  - Batch 6: `feat(people): adopt Reorder in FormBuilderPage`
  - Batch 7: `feat(plugins): adopt Reorder in Elvanto FieldMappingTable`
  - Batch 8: `chore: styleguide demo + docs + quality gates`
  - Batch 9: `chore: cleanup temp artifacts + consolidate planning to decision.md`
- **Push:** after all batches complete.

## Quality Gates (per batch)
- [ ] `pnpm test -- <batch>` passes (TDD: failing test first)
- [ ] `pnpm typecheck` (`tsc -b`) clean
- [ ] `pnpm lint:tokens` clean
- [ ] No `AnimatePresence` around Ark portals
- [ ] No direct `framer-motion` imports outside `src/core`
- [ ] `src/core/ui/index.ts` barrel intact