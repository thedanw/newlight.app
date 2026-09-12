import { describe, expect, it } from 'vitest'
import { formFieldDraftSchema } from '../schema'
import { createDefaultField, getAllFieldTypes, getFieldSpec } from '../fieldTypes'
import type { FormFieldType } from '@/modules/people/lib/types'

const EXPECTED_TYPES: FormFieldType[] = [
  'title', 'text', 'email', 'phone', 'number', 'textarea', 'date',
  'select', 'checkbox', 'radio', 'multi_select', 'scale', 'nps', 'column_container',
]

describe('fieldTypes registry (Batch 8)', () => {
  it('registers all 14 field types in palette order', () => {
    expect(getAllFieldTypes()).toEqual(EXPECTED_TYPES)
  })

  it('looks up specs by type', () => {
    expect(getFieldSpec('email')?.label).toBe('Email')
    expect(getFieldSpec('column_container')?.nestable).toBe(false)
    expect(getFieldSpec('text')?.supportsPlaceholder).toBe(true)
    expect(getFieldSpec('number')?.supportsMinMax).toBe(true)
    expect(getFieldSpec('select')?.supportsOptions).toBe(true)
  })

  it('returns undefined for unknown types', () => {
    expect(getFieldSpec('matrix' as FormFieldType)).toBeUndefined()
  })

  it('creates defaults with spec label + sort order', () => {
    const field = createDefaultField({ field_type: 'text' }, 3)
    expect(field.label).toBe('Untitled question')
    expect(field.sort_order).toBe(3)
    expect(field.id).toBeTruthy()
    expect(field.column_span).toBe(12)
    expect(field.parent_id).toBeNull()
  })

  it('applies caller overrides over spec defaults', () => {
    const field = createDefaultField({ field_type: 'email', label: 'Work email', required: true })
    expect(field.label).toBe('Work email')
    expect(field.required).toBe(true)
    expect(field.maps_to_field).toBe('email')
  })

  it('seeds option-based types with two starter options', () => {
    for (const t of ['select', 'radio', 'multi_select'] as const) {
      const field = createDefaultField({ field_type: t })
      expect(field.options).toHaveLength(2)
    }
  })

  it('seeds scale/nps ranges', () => {
    expect(createDefaultField({ field_type: 'scale' })).toMatchObject({ min_value: 1, max_value: 10 })
    expect(createDefaultField({ field_type: 'nps' })).toMatchObject({ min_value: 0, max_value: 10 })
  })

  it('throws on unknown field type', () => {
    expect(() => createDefaultField({ field_type: 'matrix' as FormFieldType })).toThrow('Unknown field type')
  })

  it('every factory default validates against the Batch 7 Zod schema', () => {
    for (const type of getAllFieldTypes()) {
      const field = createDefaultField({ field_type: type })
      expect(formFieldDraftSchema.safeParse(field).success, type).toBe(true)
    }
  })

  it('only column_container is non-nestable', () => {
    const nonNestable = getAllFieldTypes().filter((t) => !getFieldSpec(t)?.nestable)
    expect(nonNestable).toEqual(['column_container'])
  })
})
