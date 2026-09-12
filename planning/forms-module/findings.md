# Findings: Forms Module

## Stack Confirmation
- React 19.1.0, Vite 7.0.0, TypeScript 5.8.3, @dnd-kit/react@0.5.0 (v3 API)
- Panda CSS + Ark UI (@ark-ui/react), Zod, Supabase client + serverless
- lucide-react for icons

## dnd-kit v3 API (critical)
Imports: `useDraggable`/`useDroppable` from `@dnd-kit/react`, `useSortable` from `@dnd-kit/react/sortable`
Provider: `DragDropProvider` from `@dnd-kit/react` (not `@dnd-kit/core`)
Event API: `event.operation.source` / `event.operation.target` (not `event.active` / `event.over`)
Sensors: `PointerSensor.configure(options)` from `@dnd-kit/dom`
Helpers: `move` from `@dnd-kit/helpers`

Reusable components already built:
- `SortableList` — reorderable list with DnD
- `DraggableHandle` — drag handle wrapper
- `DroppableZone` — drop target wrapper
- `SortableTree` / `TreeNode` — tree-based nesting
- `DragDropProvider` — context wrapper with sensors, drag overlay, screen-reader announcements

## Existing People Module Form Infrastructure
Database tables: `forms`, `form_fields`, `form_submissions`
Current field types: text, email, phone, number, select, multi_select, checkbox, textarea, date
Current FormFieldRow: id, form_id, field_type, label, placeholder, options (JSON), required, maps_to_field, sort_order
FormBuilderPage already exists with: field editor cards (type/label/placeholder/options/required/maps_to_field), up/down/remove buttons, add field, Zod validation, Supabase CRUD
FormDraft type already exists in form-queries.ts
submitForm() function already handles validation + person creation/update + tag assignment

## Survey-React Architecture (gold standard to model after)
Data model: Survey → Questions[] + LogicRules[]
LogicRule: { sourceField, operator (equals/not_equals/greater/less/contains), value, action (show/hide/require), targetField }
10 field types: short_text, long_text, single_choice, multiple_choice, scale, nps, date, email, number, matrix
Separate logic evaluation engine (evaluateRule, isFieldVisible, isFieldRequired)
Form status: draft/published/closed, form-level settings (colors, covers, thank_you)

## Library Adoption Assessment
- fs-form-builder: INCOMPATIBLE (dnd-kit v6 vs your v3, React 18, Tailwind only, no conditional logic)
- survey-react: INCOMPATIBLE (native HTML5 DnD, Tailwind, PT-BR i18n, Zustand) but EXCELLENT architecture to replicate
- formix: INCOMPATIBLE (Next.js, non-existent dnd-kit package versions)
- SurveyJS: INCOMPATIBLE (dnd-kit v6 or no DnD, React 18 Tailwind)
- RJSF/JSON Forms: INCOMPATIBLE (no visual builder, schema-driven only)
- Recommendation: BUILD NATIVELY using your existing dnd-kit v3 infra + survey-react's data model as blueprint

## Architecture: Form Field Registry Pattern (from survey-react adaptation)
Each field type has 4 layers:
1. **Construct** — default field config object
2. **Designer Component** — how the field appears in the builder canvas (drag handle, inline edit, delete)
3. **Properties Component** — inline property controls on the field card (label, placeholder, options, required, min/max, column span)
4. **Form Component** — how the field renders in form preview/submission (using Ark UI)

## File Structure (proposed)
```
src/modules/people/form-builder/
  fieldTypes.ts              -- 14 field type specs + FormFieldSpec interface
  formLogic.ts               -- Pure functions: evaluateCondition, isVisible, isRequired
  types.ts                   -- Builder-specific types (BuilderField, LogicRule, etc.)
  components/
    FieldPalette.tsx         -- Top panel: draggable field type tiles
    FieldCanvas.tsx          -- Main: SortableList of fields with ColumnContainer nesting
    FieldCard.tsx            -- Individual field card with DraggableHandle + inline props
    ColumnContainer.tsx      -- CSS grid wrapper with nested DroppableZone
    LogicTab.tsx             -- Central condition rule manager
    ConditionInline.tsx      -- Per-field "Show when..." quick-add toggle
  __tests__/
    fieldTypes.test.ts
    formLogic.test.ts
    FieldBuilder.test.tsx
```

## Fill UX Decision (UX-A, locked)
- Builder gets a Preview tab + standalone mobile-first public fill page at /forms/:id
- Both share one renderer component (Ark UI + Panda CSS) with conditional visibility + validation
- Enforced in Batch 12 (shared renderer) + Batch 13 (E2E on public route)

## dnd-kit v3 Integration Patterns (known)
- SortableList: `items` (array of {id, label}), `onReorder(id[])`, `renderItem(item, index, isDragging)`
- DraggableHandle: wraps DraggableHandle for sortable items
- DroppableZone: wraps useDroppable for drop targets
- DragDropProvider: wraps entire canvas with sensors + drag overlay
- Key difference from v6: event is `event.operation.source/target`, not `event.active.over`