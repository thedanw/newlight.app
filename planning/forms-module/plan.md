# Form Builder Module -- Implementation Plan

## Goal: Build drag-and-drop form builder with multi-column + conditional logic
Extending existing FormBuilderPage. Uses dnd-kit v3 infra + Ark UI + Panda CSS + Supabase.

## Approach: A (Extend In-Place)
Refactor FormBuilderPage, add ColumnContainer type, conditional logic engine, hybrid logic UX.
Keeps existing route, CRUD queries, page scaffolding, and field editing patterns.

## UX Decisions (Locked)
1. Single-panel canvas (palette top, canvas below, inline card editing -- Google Forms style)
2. Column Container field type (CSS grid wrapper with drag-drop children)
3. Hybrid conditional logic (inline "Show when..." per field card + central Logic tab)
4. Auto-save 500ms debounce + manual Save button + last-saved timestamp indicator
5. Fill UX (A): preview tab in builder + mobile-first public /forms/:id sharing one renderer

---

## Batch 7: Schema Migration + DB Types
- Read existing migration pattern from 20260828100000_create_forms.sql
- Write new migration: ALTER form_fields ADD min_value, max_value, column_span, parent_id
- Write new migration: CREATE TABLE form_field_conditions (id, form_id, field_id, source_field_id, operator, value, effect)
- Update src/core/lib/database.types.ts with new columns + table
- Update FormFieldDraft in src/modules/people/lib/form-queries.ts
- Add FormFieldCondition type to src/modules/people/lib/types.ts
- TDD: Zod schema tests for extended fields + conditions (src/modules/people/form-builder/forms-schema.ts + __tests__/forms-schema.test.ts — 11 tests passing)
- Verify: pnpm vitest run src/modules/people/form-builder/__tests__/forms-schema.test.ts (11 passed) + tsc --noEmit clean
- Commit (forms-module files only; currently on feat/people-module with unrelated dragndrop changes — selective add)

## Batch 7 Complete — 2026-09-12
- Migration 20260909000000: pg_enum DO-block for 5 new field-type values (txn-safe), DO-guarded condition enums, 4 new form_fields columns, form_field_conditions table + indexes + grants
- DB types, FormFieldDraft, condition types, FIELD_TYPES all extended
- Zod schemas + 11 tests; vitest + tsc clean
- Errors: none
- Commit: cfe1d1b `feat(forms): batch 7 schema migration + DB types + Zod tests` (selective add — unrelated dragndrop work left uncommitted in tree)

## Batch 8: Field Type Registry + Tests
- Create src/modules/people/form-builder/fieldTypes.ts
- FormFieldSpec: { type, label, icon, defaultField, propertiesComponent, formComponent }
- 14 field specs: title, text, email, phone, number, textarea, date, select, checkbox, radio, multi_select, scale, nps, column_container
- Default field factory + lookup function
- TDD: registry tests (lookup, defaults, validation)
- Verify + commit

## Batch 9: Conditional Logic Engine + Tests
- Create src/modules/people/form-builder/formLogic.ts
- evaluateCondition(condition, answers), isVisible(), isRequired()
- 5 operators (equals, not_equals, greater_than, less_than, contains) x 3 effects (show, hide, require)
- TDD: 20+ test cases (all operators x effects, edge cases)
- Pure functions, no framework deps
- Verify + commit

## Batch 10: DnD Reorder + Column Container
- Refactor FormBuilderPage: SortableList replaces button reorder
- ColumnContainer component (CSS grid via Panda CSS)
- DraggableHandle on each field card
- DroppableZone for column drop targets
- Nested reorder (fields inside containers)
- Update reorderFields for nested structure
- TDD: reorder test, column drag-drop test
- Verify + commit

## Batch 11: Properties Panel + Hybrid Logic UI
- Extend field card editing (min/max, columnSpan controls)
- "Show when..." inline condition creator per card
- LogicTab component (central condition manager)
- Wire to logic engine + form state
- Ark UI controls (Select, Checkbox, Input)
- TDD: condition add/remove, LogicTab rendering
- Verify + commit

## Batch 12: Auto-Save + Supabase Integration
- Auto-save with 500ms debounce (React + Supabase)
- "Last saved: X ago" timestamp indicator
- Extend createForm/updateForm/upsertFormFields for new schema columns
- form_field_conditions CRUD on save
- Shared fill renderer (UX-A): preview tab in builder + public /forms/:id page, one component
- Extend submitForm for condition evaluation at submit time
- TDD: debounce test, integration with new schema
- Verify: pnpm test && pnpm lint && pnpm build
- Commit

## Batch 13: Integration Tests + E2E
- Integration: Full workflow (add -- reorder -- column -- condition -- save)
- E2E: Form submission with conditional visibility
- Verify: pnpm test (full suite)
- Commit

## Batch 14: Polish & Documentation
- Fix lint warnings
- README docs for form builder
- Update findings.md
- Final pnpm lint && pnpm build
- Push

## Git
- Branch: feat/forms-module (create from feat/people-module; currently ON feat/people-module with unrelated dragndrop changes — do NOT commit those with forms work)
- 8 commits (1 per batch, selective `git add` of forms paths only)
- Push after final batch