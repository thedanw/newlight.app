import { describe, expect, it } from 'vitest'
import {
  extendedFormFieldTypeSchema,
  formConditionEffectSchema,
  formConditionOperatorSchema,
  formFieldConditionSchema,
  formFieldDraftSchema,
} from '../schema'

const validField = {
  id: '11111111-1111-4111-8111-111111111111',
  field_type: 'scale',
  label: 'Satisfaction',
  placeholder: '',
  options: null,
  required: false,
  maps_to_field: null,
  sort_order: 0,
  min_value: 1,
  max_value: 10,
  column_span: 12,
  parent_id: null,
}

const validCondition = {
  id: '22222222-2222-4222-8222-222222222222',
  form_id: '33333333-3333-4333-8333-333333333333',
  field_id: '44444444-4444-4444-8444-444444444444',
  source_field_id: '55555555-5555-4555-8555-555555555555',
  operator: 'equals',
  value: 'yes',
  effect: 'show',
}

describe('forms-schema (Batch 7)', () => {
  it('accepts all 14 extended field types', () => {
    const types = [
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
    ] as const
    for (const field_type of types) {
      expect(extendedFormFieldTypeSchema.safeParse(field_type).success).toBe(true)
    }
  })

  it('rejects unknown field types', () => {
    expect(extendedFormFieldTypeSchema.safeParse('matrix').success).toBe(false)
  })

  it('accepts a valid extended field draft', () => {
    expect(formFieldDraftSchema.safeParse(validField).success).toBe(true)
  })

  it('accepts a nested column child with parent_id', () => {
    const result = formFieldDraftSchema.safeParse({
      ...validField,
      field_type: 'text',
      column_span: 6,
      parent_id: '66666666-6666-4666-8666-666666666666',
    })
    expect(result.success).toBe(true)
  })

  it('rejects column_span outside 1-12', () => {
    expect(formFieldDraftSchema.safeParse({ ...validField, column_span: 0 }).success).toBe(false)
    expect(formFieldDraftSchema.safeParse({ ...validField, column_span: 13 }).success).toBe(false)
  })

  it('rejects min_value greater than max_value', () => {
    const result = formFieldDraftSchema.safeParse({ ...validField, min_value: 10, max_value: 1 })
    expect(result.success).toBe(false)
  })

  it('accepts null min/max (unbounded)', () => {
    const result = formFieldDraftSchema.safeParse({ ...validField, min_value: null, max_value: null })
    expect(result.success).toBe(true)
  })

  it('accepts all 5 condition operators and 3 effects', () => {
    for (const operator of ['equals', 'not_equals', 'greater_than', 'less_than', 'contains'] as const) {
      expect(formConditionOperatorSchema.safeParse(operator).success).toBe(true)
    }
    for (const effect of ['show', 'hide', 'require'] as const) {
      expect(formConditionEffectSchema.safeParse(effect).success).toBe(true)
    }
  })

  it('accepts a valid condition row', () => {
    expect(formFieldConditionSchema.safeParse(validCondition).success).toBe(true)
  })

  it('rejects a condition with empty value', () => {
    expect(formFieldConditionSchema.safeParse({ ...validCondition, value: '' }).success).toBe(false)
  })

  it('rejects a condition with unknown operator', () => {
    expect(formFieldConditionSchema.safeParse({ ...validCondition, operator: 'matches' }).success).toBe(false)
  })
})
