import { z } from 'zod'

/** Extended field types added by the Forms module (Batch 7). */
export const extendedFormFieldTypeSchema = z.enum([
  'text',
  'email',
  'phone',
  'number',
  'select',
  'multi_select',
  'checkbox',
  'textarea',
  'date',
  'title',
  'radio',
  'scale',
  'nps',
  'column_container',
])

export const formFieldOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
})

/** Mirrors FormFieldDraft in form-queries.ts (Batch 7 columns included). */
export const formFieldDraftSchema = z
  .object({
    id: z.string().uuid(),
    field_type: extendedFormFieldTypeSchema,
    label: z.string(),
    placeholder: z.string(),
    options: z.array(formFieldOptionSchema).nullable(),
    required: z.boolean(),
    maps_to_field: z.string().nullable(),
    sort_order: z.number().int().min(0),
    min_value: z.number().int().nullable(),
    max_value: z.number().int().nullable(),
    column_span: z.number().int().min(1).max(12),
    parent_id: z.string().uuid().nullable(),
  })
  .refine((field) => field.min_value === null || field.max_value === null || field.min_value <= field.max_value, {
    message: 'min_value must be <= max_value.',
    path: ['min_value'],
  })

export const formConditionOperatorSchema = z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains'])

export const formConditionEffectSchema = z.enum(['show', 'hide', 'require'])

/** Mirrors the form_field_conditions table (Batch 7). */
export const formFieldConditionSchema = z.object({
  id: z.string().uuid(),
  form_id: z.string().uuid(),
  field_id: z.string().uuid(),
  source_field_id: z.string().uuid(),
  operator: formConditionOperatorSchema,
  value: z.string().min(1),
  effect: formConditionEffectSchema,
})

export type ExtendedFormFieldType = z.infer<typeof extendedFormFieldTypeSchema>
export type FormFieldDraftValue = z.infer<typeof formFieldDraftSchema>
export type FormFieldConditionValue = z.infer<typeof formFieldConditionSchema>
