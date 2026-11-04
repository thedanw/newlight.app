# Plan: Rename MainList.Header to MainList.Head

**Goal:** Rename the MainList.Header component to MainList.Head, including all file renames, class name updates, and reference replacements.

**Approach:** 
- Rename component file and export
- Update all JSX/TSX references to use `<MainList.Head>`
- Rename component class from `MainListHeader` to `MainListHead`
- Update all class name references (BEM style, CSS, SCSS)
- Update test files and documentation
- Ensure all imports are updated
- Maintain TDD cycle for all coding tasks

**Branch:** `feature/main-list-head-rename` (from `main`)

## Scope
- In: 
  - Component file rename (`main-list-row-header.tsx` → `main-list-head.tsx`)
  - Component class rename (`MainListHeader` → `MainListHead`)
  - All JSX/TSX references to `<MainList.Header>` → `<MainList.Head>`
  - All class name references (BEM style, CSS, SCSS)
  - Test files and documentation updates
- Out:
  - Changes to unrelated components or features
  - Non-essential refactoring beyond the rename scope

## Action Items

## Batch 1 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries

## Batch 1 Context
- Goal: Rename MainList.Header to MainList.Head
- This Batch: Create initial component file and update component structure
- Prev: N/A (first batch)
- Key: findings.md#component-rename

- [ ] Create planning directory structure (already done)
- [ ] Initialize `findings.md` to track research and decisions
- [x] Create `main-list-head.tsx` file with initial component structure
- [ ] **Commit:** `chore: initialize main-list-head rename plan`

## Batch 2 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
### Batch 2: Component Rename
- [ ] Rename `src/core/ui/main-list/main-list-row-header.tsx` → `src/core/ui/main-list/main-list-head.tsx`
- [ ] Update component export from `MainListHeader` to `MainListHead`
- [ ] Update all imports of `MainListHeader` to `MainListHead`
- [ ] **Commit:** `feat: rename MainList.Header to MainList.Head`

## Batch 2 Context
- Goal: Rename MainList.Header to MainList.Head
- This Batch: Create initial component file and update component structure
- Prev: Batch 1 completed component structure setup
- Key: findings.md#component-rename

### Batch 2: Component Rename
- [ ] Rename `src/core/ui/main-list/main-list-row-header.tsx` → `src/core/ui/main-list/main-list-head.tsx`
- [ ] Update component export from `MainListHeader` to `MainListHead`
- [ ] Update all imports of `MainListHeader` to `MainListHead`
- [ ] **Commit:** `feat: rename MainList.Header to MainList.Head`

## Batch 3 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries

## Batch 3 Context
- Goal: Rename MainList.Header to MainList.Head
- This Batch: Update all class name references and CSS class names
- Prev: Batch 2 completed component rename
- Key: findings.md#class-name-updates

### Batch 3: Class Name Updates
- [ ] Rename `main-list-header` → `main-list-head`
- [ ] Rename `main-list__header` → `main-list__head`
- [ ] Rename `main-list-row-header` → `main-list-head` (in class names)
- [ ] Update CSS/SCSS class names in corresponding files
- [ ] Update module CSS files (e.g., `core/ui/main-list/*.module.css`)
- [ ] **Commit:** `chore: update class names for MainList.Head`

## Batch 4 Start: Sync
- [ ] Mark completed tasks in `plan.md` (update checkboxes/status)
- [ ] Read `findings.md` for key discoveries
### Batch 4: Test Updates
- [ ] Rename test file `main-list-row-header.test.tsx` → `main-list-head.test.tsx`
- [ ] Update test file imports and references to `MainListHead`
- [ ] Ensure all tests pass after rename
- [ ] **Commit:** `test: update tests for MainList.Head`

## Batch 4 Context
- Goal: Rename MainList.Header to MainList.Head
- This Batch: Update test files and ensure all tests pass after rename
- Prev: Batch 3 completed class name updates
- Key: findings.md#test-updates

### Batch 4: Test Updates
- [ ] Rename test file `main-list-row-header.test.tsx` → `main-list-head.test.tsx`
- [ ] Update test file imports and references to `MainListHead`
- [ ] Ensure all tests pass after rename
- [ ] **Commit:** `test: update tests for MainList.Head`

## Batch 5: Documentation Updates
- [ ] Update `README.md` to reflect component rename
- [ ] Update any other documentation files (e.g., `UX-AUDIT-SUMMARY.md`, `components.json`)
- [ ] **Commit:** `docs: update documentation for MainList.Head`

### Batch 6: Final Verification
- [ ] Run all tests to verify functionality
- [ ] Run lint and type checks
- [ ] Verify build succeeds
- [ ] **Commit:** `chore: final verification and cleanup`

## Validation
- [ ] All tests pass
- [ ] Lint clean (no warnings)
- [ ] Build succeeds
- [ ] No hardcoded references to `MainListHeader` or `main-list-header`
- [ ] All class names updated consistently

## Open Questions
- [ ] Are there any additional files or references outside the current scope that need updating?
- [ ] Should we include any deprecation warnings or migration notes in documentation?

## Git Summary
- Branch: `feature/main-list-head-rename`
- Commits: 6 conventional commits (one per batch)
- Status: clean after final verification