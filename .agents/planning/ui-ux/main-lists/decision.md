# Decision: MainList Component System (Global)

## What & Why
A reusable list component system (MainList, MainList.Toolbar, MainList.Row, MainList.Row.Select, MainList.Row.Button, MainList.Row.Toolbar, MainList.Toolbar.MassManage, MainList.RowHeader, MainList.Rows, MainList.Footer) that provides consistent interactive list UX across modules with search, row actions, selection, bulk operations, and animated transitions.

## Who
Module developers building dashboards and list views (Forms, People, future modules).

## Constraints
- React 19, Panda CSS, Park UI (Ark UI), TypeScript strict
- Must use `@/core/ui` barrel as sole UI import point
- CSS-only animations (no Framer Motion)
- Slot-based content pattern for MainList.Row.Content
- Explicit header configuration
- Pagination inside MainList.Root

## Non-Goals
- Virtualized/windowed lists (not needed for current data volumes)
- Drag-to-reorder rows (separate concern)
- Server-side sorting/filtering (handled by module queries)

## Assumptions
- Modules will compose MainList with their own row content
- Selection state clears on navigation away
- Search is instant (onChange) with manual search button
- Delete uses Park UI Dialog confirmation

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)

1. **MainList as composable component system (not monolithic table)**
   - Rationale: Modules need flexible row content; table layout too rigid for cards/expandable rows
2. **MainList.Root owns layout: PAD horizontal, GAP vertical, flex gaps**
   - Rationale: Consistent spacing via design tokens (src/core/theme/spacing-contract.ts)
3. **MainList.Toolbar at top inside MainList.Root with Primary/Secondary/MassManage slots**
   - Rationale: Self-contained list component; modules don't need Page.HeaderBottom for list actions
4. **MainList.Toolbar.PrimaryActions: top/left, size md buttons**
   - Rationale: Standard primary action placement (New, Import, etc.)
5. **MainList.Toolbar.SecondaryActions: top/right, size md buttons**
   - Rationale: Standard secondary action placement (Filters, Export, View toggle)
6. **MainList.Toolbar.MassManage: bottom/left, max-height 0 → auto animated, under PrimaryActions**
   - Rationale: Appears only when rows selected; stacked under primary keeps layout stable
7. **MassManage includes [X] close button → deselects all, collapses select columns**
   - Rationale: Clear escape hatch; consistent with row toolbar close pattern
8. **MassManage for Forms: Delete only (configurable per module)**
   - Rationale: MVP scope; other modules add their own bulk actions
9. **MainList.Rows: container for all repeated MainList.Row components**
   - Rationale: Semantic wrapper for styling, virtualization hook point
10. **MainList.RowHeader: explicit header configuration array [{key, label, width?}]**
    - Rationale: Predictable, type-safe, supports column width control
11. **MainList.Row: expandable content with overlay backdrop**
    - Rationale: Click outside closes toolbar; expandable row pushes content down
12. **MainList.Row.Select: max-width 0 → auto animated, all rows animate together**
    - Rationale: Visual consistency; selection column appears/disappears as unit
13. **MainList.Row.Select tied to MassManage: selection enables bulk actions**
    - Rationale: Standard selection → bulk action pattern
14. **MainList.Row.Button: customizable icon/action slot (right-aligned in row)**
    - Rationale: Modules define their own row actions (Manage, More, etc.)
15. **MainList.Row.Toolbar: max-height 0 → auto animated, populated by row button click**
    - Rationale: Progressive disclosure; keeps row compact until needed
16. **Row toolbar for Forms: [View] [Edit] [Duplicate] [Delete] [Select] [X]**
    - Rationale: Complete CRUD + selection entry point
17. **Row toolbar [Duplicate]/[Delete] → Park UI Dialog confirmation**
    - Rationale: Destructive actions require explicit confirmation
18. **Row toolbar [Select] → closes toolbar, expands Select column, selects row**
    - Rationale: Seamless transition from single-row actions to bulk mode
19. **Row toolbar [X] → collapses toolbar, restores Manage button**
    - Rationale: Symmetric open/close; returns to default state
20. **MainList.Row click action: per-list assignable, applied to clicked row**
    - Rationale: Default navigate to view; modules configure once
21. **Row click and View button: same behavior (navigate to view)**
    - Rationale: Redundancy for discoverability; consistent outcome
22. **Duplicate action: navigate to edit of new copy**
    - Rationale: Immediate continuation of workflow
23. **Search: instant onChange + manual SearchInput button (Park UI)**
    - Rationale: Responsive feel; button provides explicit affordance
24. **Delete confirmation: Park UI Dialog with form name**
    - Rationale: Clear, accessible, consistent with design system
25. **Selection clears on navigation away**
    - Rationale: Simple mental model; no stale state surprises
26. **Edit button: navigate to builder page (/forms/:id/edit)**
    - Rationale: Full builder UX needs dedicated route
27. **Row toolbar animation: CSS transitions (max-height)**
    - Rationale: Zero deps; performant; sufficient for height animation
28. **MassManage: Select All (all matching search) + Select Visible (current page)**
    - Rationale: Power users need both; distinguishes filtered set vs viewport
29. **MainList.Footer: inside MainList.Root with pagination**
    - Rationale: Self-contained; modules don't manage pagination separately
30. **MainList.Row.Content: slot pattern (primary, secondary, meta)**
    - Rationale: Structured content enables consistent alignment, responsive behavior

## Decision Gap Log
(none — all gaps resolved)