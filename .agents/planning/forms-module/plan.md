# Form Builder Module -- Implementation Plan
 > Status: in_progress (executing per 04_executing-plans)

## Goal: Build drag-and-drop form builder with multi-column + conditional logic
Standalone `src/modules/forms/` module (own manifest, routes at `/forms`, lib, pages, components).
Uses dnd-kit v3 infra + Ark UI + Panda CSS + Supabase. Reuses FormBuilderPage patterns.

## Approach: A-revised (Standalone module, migrated — not rewritten)
Form code migrates out of `src/modules/people/` into `src/modules/forms/` (manifest, routes,
public API per repo module conventions: `manifest.ts`, `routes.tsx`, `public.ts`, `lib/`,
`pages/`, `components/`, no module-name prefix in filenames for new files).
Legacy `/people/forms/*` URLs redirect to `/forms/*`. Public fill page `/forms/:formId`
stays outside AppShell in `core/router.tsx`, re-imported from the forms module.
Keeps existing CRUD query logic, page scaffolding, and field editing patterns — moved, not rewritten.

## UX Decisions (Locked)
1. Single-panel canvas (palette top, canvas below, inline card editing -- Google Forms style)
2. Column Container field type (CSS grid wrapper with drag-drop children)
3. Hybrid conditional logic (inline "Show when..." per field card + central Logic tab)
4. Auto-save 500ms debounce + manual Save button + last-saved timestamp indicator
5. Fill UX (A): preview tab in builder + mobile-first public /forms/:id sharing one renderer
6. Standalone module: `src/modules/forms/` with own manifest/routes/API (user decision 2026-09-12); legacy `/people/forms/*` redirects to `/forms/*`

---

## Batch 7: Schema Migration + DB Types
## Batch 7 Start: Sync (retrospective — complete)
- [x] Tasks completed in cfe1d1b (verify checkboxes below match commit)
- [x] Read findings.md#existing-people-form-infrastructure
## Batch 7 Context
- Goal: Standalone `src/modules/forms/` drag-and-drop builder.
- This Batch: Supabase schema + TS types for new field props + conditions (TDD).
- Prev: None — first batch; planning complete.
- Key: findings.md#existing-people-form-infrastructure
- [x] Read existing migration pattern from 20260828100000_create_forms.sql
- [x] Write new migration: ALTER form_fields ADD min_value, max_value, column_span, parent_id
- [x] Write new migration: CREATE TABLE form_field_conditions (id, form_id, field_id, source_field_id, operator, value, effect)
- [x] Update src/core/lib/database.types.ts with new columns + table
- [x] Update FormFieldDraft in src/modules/people/lib/form-queries.ts
- [x] Add FormFieldCondition type to src/modules/people/lib/types.ts
- [x] TDD: Zod schema tests for extended fields + conditions (src/modules/people/form-builder/forms-schema.ts + __tests__/forms-schema.test.ts — 11 tests passing)
- [x] Verify: pnpm vitest run src/modules/people/form-builder/__tests__/forms-schema.test.ts (11 passed) + tsc --noEmit clean
- [x] Commit (forms-module files only; currently on feat/people-module with unrelated dragndrop changes — selective add)

**Batch 7 Complete — 2026-09-12**
- Migration 20260909000000: pg_enum DO-block for 5 new field-type values (txn-safe), DO-guarded condition enums, 4 new form_fields columns, form_field_conditions table + indexes + grants
- DB types, FormFieldDraft, condition types, FIELD_TYPES all extended
- Zod schemas + 11 tests; vitest + tsc clean
- Errors: none
- Commit: cfe1d1b `feat(forms): batch 7 schema migration + DB types + Zod tests` (selective add — unrelated dragndrop work left uncommitted in tree)

## Batch R0: Freeze + triage working tree (do NOT commit mixed state)
## Batch R0 Start: Sync
- [ ] Mark Batch 7 complete in plan.md (done — verify checkboxes match cfe1d1b)
- [ ] Read findings.md#file-structure
## Batch R0 Context
- Goal: Standalone `src/modules/forms/` drag-and-drop builder.
- This Batch: Confirm working tree contains ONLY expected forms files.
- Prev: Batch 7 committed cfe1d1b; Batch 8 half-built uncommitted.
- Key: findings.md#file-structure
- [ ] `git status --short` — confirm ONLY: `src/modules/people/form-builder/fieldTypes.ts` (untracked, broken), `src/modules/people/form-builder/__tests__/fieldTypes.test.ts` (untracked), planning rename (`D planning/...` / `?? .agents/planning/...`).
- [ ] Do NOT `git add -A` — unrelated dragndrop changes stay out of every forms commit.
- [ ] Gate: if `fieldTypes.ts` changed since triage, re-triage before R1.

## Batch R1: Fix Batch 8 syntax error in place
## Batch R1 Start: Sync
- [ ] Mark Batch R0 tasks complete in plan.md
- [ ] Read findings.md#file-structure
## Batch R1 Context
- Goal: Standalone `src/modules/forms/` drag-and-drop builder.
- This Batch: Delete stray `]` in fieldTypes.ts; prove code salvageable.
- Prev: R0 triage confirms clean tree, no mixed commits.
- Key: findings.md#file-structure
- [ ] Read `fieldTypes.ts:90-112` — delete stray `]` at line 111.
- [ ] Verify: `pnpm exec tsc --noEmit` clean.
- [ ] Verify: `pnpm vitest run src/modules/people/form-builder/__tests__` — 21 passing.
- [ ] Do NOT commit — fix verified in place, moved in R2.
- [ ] 3-strike: if tests fail after syntax fix, STOP and report.

## Batch R2: Relocate builder lib to `src/modules/forms/` via `git mv`
## Batch R2 Start: Sync
- [ ] Mark Batch R1 tasks complete in plan.md
- [ ] Read findings.md#file-structure
## Batch R2 Context
- Goal: Standalone `src/modules/forms/` drag-and-drop builder.
- This Batch: History-preserving move of builder lib into forms module.
- Prev: R1 fix verified — 21 tests passing, tsc clean.
- Key: findings.md#file-structure
- [ ] `mkdir -p src/modules/forms/lib/__tests__`
- [ ] `git mv src/modules/people/form-builder/forms-schema.ts src/modules/forms/lib/schema.ts` (rename per naming-convention.md: no module-name prefix)
- [ ] `git mv .../form-builder/__tests__/forms-schema.test.ts src/modules/forms/lib/__tests__/schema.test.ts`
- [ ] `git mv .../form-builder/fieldTypes.ts src/modules/forms/lib/fieldTypes.ts`
- [ ] `git mv .../form-builder/__tests__/fieldTypes.test.ts src/modules/forms/lib/__tests__/fieldTypes.test.ts`
- [ ] Remove empty `src/modules/people/form-builder/` dirs.
- [ ] Fix imports: tests use `../schema`, `../fieldTypes`, `../types`.
- [ ] Verify: `pnpm vitest run src/modules/forms` (21 passing) + `tsc --noEmit` clean.
- [ ] Commit: `feat(forms): relocate builder lib to standalone forms module (R2)`.
- [ ] Gate: `git log --follow -- src/modules/forms/lib/schema.ts` shows Batch 7 history.

## Batch R3: Migrate form domain (lib + pages) to `src/modules/forms/`
## Batch R3 Start: Sync
- [ ] Mark Batch R2 tasks complete in plan.md
- [ ] Read findings.md#file-structure
## Batch R3 Context
- Goal: Standalone `src/modules/forms/` drag-and-drop builder.
- This Batch: Move queries + pages; new types.ts re-exporting from people.
- Prev: R2 relocated builder lib, history preserved via git mv.
- Key: findings.md#file-structure
- [ ] `git mv src/modules/people/lib/form-queries.ts src/modules/forms/lib/queries.ts` (import-path updates only, no rewrites).
- [ ] Do NOT move people `lib/types.ts` (shared file) — create `src/modules/forms/lib/types.ts` re-exporting Form/Field/Submission/Condition types from `@/modules/people/lib/types`.
- [ ] `git mv` pages with renames per naming-convention.md: `FormsListPage.tsx`→`pages/ListPage.tsx`, `FormBuilderPage.tsx`→`pages/BuilderPage.tsx`, `FormSubmissionsPage.tsx`→`pages/SubmissionsPage.tsx`, `FormPublicPage.tsx`→`pages/PublicPage.tsx`.
- [ ] Update imports in moved pages: form-queries→forms queries, form types→forms types; people-domain imports stay pointed at people module.
- [ ] Update `src/core/router.tsx`: public route lazy-imports `@/modules/forms/pages/PublicPage`.
- [ ] Verify: `tsc --noEmit` clean + forms tests green.
- [ ] Commit: `feat(forms): migrate form domain lib+pages from people module (R3)`.

## Batch R4: Wire standalone module shell + redirects
## Batch R4 Start: Sync
- [ ] Mark Batch R3 tasks complete in plan.md
- [ ] Read findings.md#file-structure
## Batch R4 Context
- Goal: Standalone `src/modules/forms/` drag-and-drop builder.
- This Batch: manifest/routes/public/dashboard + /forms registration + legacy redirects.
- Prev: R3 migrated queries + pages, tsc + tests green.
- Key: findings.md#file-structure
- [ ] Create `src/modules/forms/manifest.ts` (id `forms`, icon ClipboardList, number = next free after people=1/example=3 — verify, do NOT collide), `routes.tsx` (index→ListPage, `new`+`:id/edit`→BuilderPage, `:id/submissions`→SubmissionsPage, ModuleBreadcrumbProvider), `public.ts` (manifest + FormsModuleApi), `dashboard.tsx` (thin link list, mirror example pattern).
- [ ] Register in `src/core/router.tsx`: `{ path: 'forms', children: formsRoutes }`.
- [ ] Legacy redirects in `peopleRoutes`: `/people/forms/*` → `/forms/*` via `<Navigate replace>`.
- [ ] Verify: `tsc`, forms tests, `pnpm build` (new route chunk resolves).
- [ ] Commit: `feat(forms): standalone module shell + routes + legacy redirects (R4)`.
- [ ] End gate: `src/modules/people/form-builder/` GONE; people `Form*.{ts,tsx}` GONE; zero forms paths outside `src/modules/forms/`, migration, planning.

## Batch 8: Field Type Registry + Tests (resumed in forms module)
## Batch 8 Start: Sync
- [ ] Mark Batch R4 tasks complete in plan.md
- [ ] Read findings.md#architecture-registry-pattern
## Batch 8 Context
- Goal: Standalone `src/modules/forms/` drag-and-drop builder.
- This Batch: Verify relocated registry + factory; no new code expected.
- Prev: R4 shell wired — /forms routes live, legacy redirects in place.
- Key: findings.md#architecture-registry-pattern
- Registry lives at `src/modules/forms/lib/fieldTypes.ts` (moved in R2, syntax fixed in R1)
- FormFieldSpec: { type, label, icon, defaultField, propertiesComponent, formComponent }
- 14 field specs: title, text, email, phone, number, textarea, date, select, checkbox, radio, multi_select, scale, nps, column_container
- Default field factory + lookup function
- TDD: registry tests (lookup, defaults, validation)
- Verify + commit

## Batch 9: Conditional Logic Engine + Tests
## Batch 9 Start: Sync
- [ ] Mark Batch 8 tasks complete in plan.md
- [ ] Read findings.md#survey-react-architecture
## Batch 9 Context
- Goal: Standalone `src/modules/forms/` drag-and-drop builder.
- This Batch: Pure evaluateCondition/isVisible/isRequired, 5 ops x 3 effects.
- Prev: Batch 8 registry verified in forms module.
- Key: findings.md#survey-react-architecture
- Create src/modules/forms/lib/formLogic.ts
- evaluateCondition(condition, answers), isVisible(), isRequired()
- 5 operators (equals, not_equals, greater_than, less_than, contains) x 3 effects (show, hide, require)
- TDD: 20+ test cases (all operators x effects, edge cases)
- Pure functions, no framework deps
- Verify + commit

## Batch 10: DnD Reorder + Column Container
## Batch 10 Start: Sync
- [ ] Mark Batch 9 tasks complete in plan.md
- [ ] Read findings.md#dnd-kit-v3-api
## Batch 10 Context
- Goal: Standalone `src/modules/forms/` drag-and-drop builder.
- This Batch: SortableList reorder + ColumnContainer grid + nested reorder.
- Prev: Batch 9 logic engine committed (pure, 20+ tests).
- Key: findings.md#dnd-kit-v3-api
- Refactor BuilderPage (`src/modules/forms/pages/BuilderPage.tsx`): SortableList replaces button reorder
- ColumnContainer component (CSS grid via Panda CSS)
- DraggableHandle on each field card
- DroppableZone for column drop targets
- Nested reorder (fields inside containers)
- Update reorderFields for nested structure
- TDD: reorder test, column drag-drop test
- Verify + commit

## Batch 11: Properties Panel + Hybrid Logic UI
## Batch 11 Start: Sync
- [ ] Mark Batch 10 tasks complete in plan.md
- [ ] Read findings.md#survey-react-architecture
## Batch 11 Context
- Goal: Standalone `src/modules/forms/` drag-and-drop builder.
- This Batch: Inline min/max/span controls + Show-when + LogicTab.
- Prev: Batch 10 DnD reorder + columns committed.
- Key: findings.md#survey-react-architecture
- Extend field card editing (min/max, columnSpan controls)
- "Show when..." inline condition creator per card
- LogicTab component (central condition manager)
- Wire to logic engine + form state
- Ark UI controls (Select, Checkbox, Input)
- TDD: condition add/remove, LogicTab rendering
- Verify + commit

## Batch 12: Auto-Save + Supabase Integration
## Batch 12 Start: Sync
- [ ] Mark Batch 11 tasks complete in plan.md
- [ ] Read findings.md#fill-ux-decision
## Batch 12 Context
- Goal: Standalone `src/modules/forms/` drag-and-drop builder.
- This Batch: 500ms debounce autosave + conditions CRUD + shared renderer.
- Prev: Batch 11 properties + logic UI committed.
- Key: findings.md#fill-ux-decision
- Auto-save with 500ms debounce (React + Supabase)
- "Last saved: X ago" timestamp indicator
- Extend createForm/updateForm/upsertFormFields (`src/modules/forms/lib/queries.ts`) for new schema columns
- form_field_conditions CRUD on save
- Shared fill renderer (UX-A): preview tab in builder + public /forms/:id page, one component
- Extend submitForm for condition evaluation at submit time
- TDD: debounce test, integration with new schema
- Verify: pnpm test && pnpm lint && pnpm build
- Commit

## Batch 13: Integration Tests + E2E
## Batch 13 Start: Sync
- [ ] Mark Batch 12 tasks complete in plan.md
- [ ] Read findings.md#fill-ux-decision
## Batch 13 Context
- Goal: Standalone `src/modules/forms/` drag-and-drop builder.
- This Batch: Full workflow integration + conditional-visibility E2E.
- Prev: Batch 12 autosave + renderer committed.
- Key: findings.md#fill-ux-decision
- Integration: Full workflow (add -- reorder -- column -- condition -- save)
- E2E: Form submission with conditional visibility
- Verify: pnpm test (full suite)
- Commit

## Batch 14: Polish & Documentation
## Batch 14 Start: Sync
- [ ] Mark Batch 13 tasks complete in plan.md
- [ ] Read findings.md#file-structure
## Batch 14 Context
- Goal: Standalone `src/modules/forms/` drag-and-drop builder.
- This Batch: Lint, README docs, final build, push.
- Prev: Batch 13 integration tests committed.
- Key: findings.md#file-structure
- Fix lint warnings
- README docs for form builder
- Update findings.md
- Final pnpm lint && pnpm build
- Push

## Git
- Branch: stay on feat/people-module until R4 green, THEN create feat/forms-module from it (forms code isolated under src/modules/forms/ by then — clean branch point)
- Commits: R2, R3, R4 (remediation) + Batches 8–14 (7 commits), all selective `git add` of forms paths only
- Push after final batch