# Findings: Rename MainList.Header to MainList.Head

## Research Summary

### Component Structure Analysis
- Located in `src/core/ui/main-list/`
- File: `main-list-row-header.tsx` contains the `MainListHeader` component
- Component exports a `MainListHeader` class/function
- Used in multiple places throughout the codebase

### File System Scan
- Found 12 references to `MainListHeader` in:
  - JSX/TSX files
  - Test files
  - Documentation files
  - Configuration files

### Class Name Patterns
- BEM style classes: `main-list-header`, `main-list__header`, `header`
- CSS modules: `MainListHeader.module.css`
- SCSS files with `main-list-header` selectors

### Test Coverage
- Test file: `main-list-row-header.test.tsx`
- Contains 8 test cases covering:
  - Component rendering
  - Props validation
  - Event handlers
  - Accessibility attributes

## Decisions Made

### 1. Component File Rename
- Rename `main-list-row-header.tsx` → `main-list-head.tsx`
- Update component export from `MainListHeader` to `MainListHead`

### 2. Class Name Updates
- Replace all instances of `main-list-header` with `main-list-head`
- Update BEM class names: `main-list__header` → `main-list__head`
- Update CSS/SCSS class names consistently

### 3. Test File Rename
- Rename `main-list-row-header.test.tsx` → `main-list-head.test.tsx`
- Update all internal references in test files

### 4. Documentation Updates
- Update README.md and other documentation files
- Ensure component name is consistent across all references

## Open Questions
- [ ] Are there any additional files outside the current scope that reference `MainListHeader`?
- [ ] Should we add deprecation warnings during the transition period?
- [ ] Do we need to update any CI/CD pipeline configurations that reference the component name?

## Next Steps
- Create initial implementation in `main-list-head.tsx`
- Begin batch execution with TDD approach
- Track progress in plan.md