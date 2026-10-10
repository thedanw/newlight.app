# Decision: Forms Module

## Goal
Build a drag-and-drop form builder for newlight.app with multi-column layout and conditional logic, using existing dnd-kit v3 infrastructure + Ark UI + Panda CSS + Supabase.

## What & Why
A responsive, fully-featured form builder that church staff can use to create data collection forms (signups, surveys, registrations) with visual drag-and-drop fields, conditional visibility rules, multi-column layouts, and Supabase-backed persistence — replacing the current button-only reorder FormBuilderPage.

## Who
newlight.app church administrators and staff who build forms to collect member information, event registrations, and community feedback.

## Constraints
- Must use existing @dnd-kit/react@0.5.0 (v3) infrastructure — no v6 migration
- Must use Ark UI primitives (not Radix UI) + Panda CSS (not Tailwind)
- Must integrate with existing Supabase schema (forms, form_fields, form_submissions tables)
- Must be built on Vite 7 + React 19 stack
- Must extend (not replace) existing FormBuilderPage patterns

## Non-Goals
- Real-time collaborative editing (multi-user simultaneously editing same form)
- Form logic for complex calculations or score-based branching
- Mobile touch gesture editing (form builder is desktop-only; form *filling* is mobile-first)
- Embedding forms on non-newlight domains (future scope)
- Third-party form builder library adoption (incompatible dnd-kit versions)

## UX Decisions
1. **Canvas layout**: Single-panel — field palette at top, canvas below, inline property editing on each field card (Google Forms style)
2. **Multi-column**: Column Container field type — a wrapping field that creates a CSS grid; child fields dragged into columns
3. **Conditional logic**: Hybrid — inline "Show when..." quick-add on each field card + a central Logic management tab for complex rule overview
4. **Save model**: Auto-save with 500ms debounce + explicit "Save" button with last-saved timestamp indicator
5. **Fill UX (A)**: Builder preview tab + mobile-first public fill page at /forms/:id sharing one renderer (Ark UI + Panda CSS)

## Assumptions
- Existing people module permissions (admin/team_leaders) apply to form builder access
- Forms table schema can be extended with new columns for multi-column + conditional logic
- Users understand Google Forms-style UX patterns (drag handles, inline editing, field cards)
- 70% test coverage target is sufficient for initial module release

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)
1. **Build natively, don't adopt external library**
   - Rationale: No dnd-kit v3 compatible form builder exists; survey-react architecture replicated instead
2. **Extend existing FormBuilderPage**
   - Rationale: Reuse form-queries.ts, FormDraft type, submitForm() logic, Supabase CRUD patterns
3. **survey-react data model**
   - Rationale: Survey → Questions + LogicRules (normalized, separate condition table)
4. **dnd-kit v3 SortableList**
   - Rationale: Use existing core/dragndrop/ SortableList for field reordering (not native HTML5 DnD)
5. **Ark UI for all UI primitives**
   - Rationale: Button, Field, Select, Checkbox, Switch from @ark-ui/react
6. **Zod for validation**
   - Rationale: Reuse existing zod validation pattern from submitForm
7. **Column Container field type**
   - Rationale: CSS grid via Panda CSS, children are drag-drop sortable
8. **Auto-save**
   - Rationale: Debounced Supabase upsert, optimistic UI updates
9. **Fill UX (A)**
   - Rationale: Preview tab in builder + public /forms/:id page sharing one renderer component
10. **Standalone forms module** (2026-09-12)
    - Rationale: User decision — forms is a business-capability module per planning README
      (Module = feature users interact with), not a people-subfolder; own manifest/routes/API,
      legacy /people/forms/* redirects preserved

## Decision Gap Log
(none — all gaps resolved)

---

# Decision: Forms Module Dashboard Enhancement

## What & Why
Enhance the Forms module dashboard (ListPage) with a searchable, interactive form list using the MainList component system. Replace the current table-based list with enhanced functionality including search, row actions (View, Edit, Duplicate, Delete), row selection for bulk operations, and animated transitions.

## Who
Church administrators and staff managing forms in newlight.app.

## Constraints
- Must use MainList component system from @/core/ui
- Must follow existing Forms module patterns (manifest, routes, queries)
- React 19, Panda CSS, Park UI, TypeScript strict
- Search uses Park UI SearchInput component
- Delete/Duplicate use Park UI Dialog confirmation

## Non-Goals
- Form builder changes
- Submission viewing changes
- Public form URL handling changes
- Backend API changes

## Assumptions
- Existing getForms(), deleteForm(), getFormSubmissionCounts() queries work
- Forms have id, name, description, is_public fields
- Module permissions (admin/team_leaders) control access

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)

1. **Integrate MainList into Forms ListPage (replace Table)**
   - Rationale: MainList provides search, row actions, selection, bulk ops out of the box
2. **Add search to Forms dashboard header using SearchInput (Park UI)**
   - Rationale: Consistent with People dashboard pattern; instant onChange + manual button
3. **Row click → navigate to view mode (/forms/:id/view)**
   - Rationale: Per-list assignable action; view is primary read action
4. **Row toolbar View button → same as row click (navigate to view)**
   - Rationale: Redundancy for discoverability; consistent outcome
5. **Row toolbar Edit button → navigate to /forms/:id/edit**
   - Rationale: Full builder UX needs dedicated route
6. **Row toolbar Duplicate → create copy → navigate to edit of new copy**
   - Rationale: Immediate continuation of workflow
7. **Row toolbar Delete → Park UI Dialog confirmation with form name → delete → refresh list**
   - Rationale: Destructive action requires explicit confirmation
8. **Row toolbar Select → closes toolbar, expands Select column, selects row**
   - Rationale: Seamless transition from single-row actions to bulk mode
9. **Row toolbar X → collapses toolbar, restores Manage button**
   - Rationale: Symmetric open/close; returns to default state
10. **Manage button (Pencil icon) in MainList.Row.Button slot → opens row toolbar**
    - Rationale: Progressive disclosure; keeps row compact until needed
11. **MassManage toolbar: Delete only (for now)**
    - Rationale: MVP scope; other bulk actions can be added later
12. **MassManage Delete → Park UI Dialog confirmation with count → delete selected → refresh**
    - Rationale: Bulk destructive action requires explicit confirmation with scope clarity
13. **MassManage includes Select All (all matching search) + Select Visible (current page)**
    - Rationale: Power users need both; distinguishes filtered set vs viewport
14. **MassManage X button → deselects all, collapses Select column, hides MassManage**
    - Rationale: Clear escape hatch; consistent with row toolbar close pattern
15. **Selection clears on navigation away from ListPage**
    - Rationale: Simple mental model; no stale state surprises
16. **Row toolbar animation: CSS transitions (max-height 0 → auto)**
    - Rationale: Zero deps; performant; sufficient for height animation
17. **Select column animation: CSS transitions (max-width 0 → auto, all rows together)**
    - Rationale: Visual consistency; selection column appears/disappears as unit
18. **MainList.Toolbar.PrimaryActions: New Form button (Plus icon)**
    - Rationale: Standard primary action for list views
19. **MainList.Toolbar.SecondaryActions: Filter/Lists button (SlidersHorizontal icon)**
    - Rationale: Consistent with People dashboard pattern
20. **MainList.Footer: pagination inside MainList.Root**
    - Rationale: Self-contained; ListPage doesn't manage pagination separately
21. **MainList.RowHeader: explicit headers [Name, Visibility, Submissions]**
    - Rationale: Matches current table columns; predictable, type-safe
22. **MainList.Row.Content: slot pattern with primary (name), secondary (description), meta (badge)**
    - Rationale: Structured content enables consistent alignment
23. **Row expandable with overlay backdrop: click outside closes toolbar**
    - Rationale: Accessible escape; prevents stuck open toolbars
24. **Use existing Form type from lib/types (id, name, description, is_public, etc.)**
    - Rationale: Reuse existing types; no schema changes needed

## Decision Gap Log
(none — all gaps resolved)
