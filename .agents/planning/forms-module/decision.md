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
