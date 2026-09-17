# Progress: dnd-kit v8+ Upgrade

## Status: Planning Complete

### Completed
- [x] Analyzed current v2 (0.5.0) implementation
- [x] Identified parser bug root cause (renderItem + same-file JSX)
- [x] Researched v8+ official patterns
- [x] Created comprehensive plan: `dnd-kit-v8-upgrade-plan.md`
- [x] Created findings document: `findings.md`
- [x] Created executable plan: `plan.md` with evolving context statements

### Next: Execute Phase 1 (Batch 1.1 - Package Upgrade)

---

## Execution Order

1. **Phase 1**: Package upgrade + modern hooks
2. **Phase 2**: Core component refactor (SortableTree, SortableList, TreeNode, utils, sensors, provider)
3. **Phase 3**: Consumer updates (JourneySettingsManager, SortableStageColumns, dnd-tree, BuilderPage)
4. **Phase 4**: Cleanup (delete obsolete files, update tests)
5. **Phase 5**: Quality gates (test, typecheck, lint, build, manual verification)
6. **Phase 6**: Documentation & archival (decision.md, archive planning files)

---

## Key Constraints

- **Parser bug**: No function returning JSX in same file as component using it in JSX
- **TDD**: Write failing test first for each batch
- **Quality gates**: pnpm test, typecheck, lint, build must pass after each phase
- **Atomic commits**: One commit per batch completion