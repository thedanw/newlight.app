# Task Plan: Core Drag-and-Drop Ordering (Reorder)

**Branch:** `feature/core-reorder`
**Created:** 2026-09-08

## Phase 1: Brainstorm (decision.md)
- [x] Research libraries (motion.dev via jina.ai, installed deps, framer-motion probe)
- [x] Map plugin system + HookRegistry + settings schema + people/forms ordering seams
- [x] Write `decision.md` (decision log #1–10)
- [x] Write `findings.md`

## Phase 2: Plan (plan.md)
- [x] Write `plan.md` (7 batches, TDD, git strategy, quality gates)
- [ ] User review of plan scope/approach

## Phase 3: Execute (per batch)
- [x] Batch 1: Core `Reorder` compound component (TDD)
- [x] Batch 2: `useOrderedCollection` + `OrderedCollectionService` (TDD)
- [x] Batch 3: Mobile-first + a11y + motion polish (TDD)
- [x] Batch 4: Plugin `reorder` API + `registerOrderedCollection` (TDD)
- [x] Batch 5: JourneySettingsManager adoption (TDD)
- [x] Batch 6: FormBuilderPage adoption (TDD)
- [x] Batch 7: Elvanto FieldMappingTable adoption (TDD) — plugin case study
- [x] Batch 8: Polish, docs, quality gates (demo + plugin API doc done; gates green except user's in-flight `journey-reorder`/`ProfileSections` work)
- [ ] Batch 9: Cleanup temp artifacts + consolidate planning to decision.md

## Phase 4: Review
- [ ] Full gates: `tsc -b`, `lint:tokens`, `test`, `build`
- [ ] Browser smoke test (mobile viewport) on journey + forms reorder
- [ ] Push `feature/core-reorder`