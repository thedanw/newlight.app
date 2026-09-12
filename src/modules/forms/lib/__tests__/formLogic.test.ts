import { describe, expect, it } from 'vitest'
import { evaluateCondition, isRequired, isVisible } from '../formLogic'
import type { FormFieldCondition } from '../types'

const cond = (
  fieldId: string,
  sourceFieldId: string,
  operator: FormFieldCondition['operator'],
  value: string,
  effect: FormFieldCondition['effect'] = 'show',
): Pick<FormFieldCondition, 'operator' | 'value' | 'effect' | 'field_id' | 'source_field_id'> => ({
  field_id: fieldId,
  source_field_id: sourceFieldId,
  operator,
  value,
  effect,
})

describe('evaluateCondition (Batch 9)', () => {
  it('equals: matches string', () => {
    expect(evaluateCondition(cond('f1', 'src', 'equals', 'yes'), { src: 'yes' }).matches).toBe(true)
  })

  it('equals: no match on different string', () => {
    expect(evaluateCondition(cond('f1', 'src', 'equals', 'yes'), { src: 'no' }).matches).toBe(false)
  })

  it('equals: numeric string equality', () => {
    expect(evaluateCondition(cond('f1', 'src', 'equals', '5'), { src: 5 }).matches).toBe(true)
  })

  it('not_equals: true when different', () => {
    expect(evaluateCondition(cond('f1', 'src', 'not_equals', 'yes'), { src: 'no' }).matches).toBe(true)
  })

  it('not_equals: false when same', () => {
    expect(evaluateCondition(cond('f1', 'src', 'not_equals', 'yes'), { src: 'yes' }).matches).toBe(false)
  })

  it('greater_than: numeric comparison', () => {
    expect(evaluateCondition(cond('f1', 'src', 'greater_than', '5'), { src: 10 }).matches).toBe(true)
    expect(evaluateCondition(cond('f1', 'src', 'greater_than', '5'), { src: 3 }).matches).toBe(false)
  })

  it('greater_than: string numeric comparison', () => {
    expect(evaluateCondition(cond('f1', 'src', 'greater_than', '5'), { src: '10' }).matches).toBe(true)
  })

  it('less_than: numeric comparison', () => {
    expect(evaluateCondition(cond('f1', 'src', 'less_than', '10'), { src: 5 }).matches).toBe(true)
    expect(evaluateCondition(cond('f1', 'src', 'less_than', '10'), { src: 15 }).matches).toBe(false)
  })

  it('contains: substring match (case-insensitive)', () => {
    expect(evaluateCondition(cond('f1', 'src', 'contains', 'hello'), { src: 'Hello world' }).matches).toBe(true)
    expect(evaluateCondition(cond('f1', 'src', 'contains', 'xyz'), { src: 'hello world' }).matches).toBe(false)
  })

  it('returns false when source answer is null', () => {
    expect(evaluateCondition(cond('f1', 'src', 'equals', 'yes'), { src: null }).matches).toBe(false)
  })

  it('returns false when source answer is missing', () => {
    expect(evaluateCondition(cond('f1', 'src', 'equals', 'yes'), {}).matches).toBe(false)
  })
})

describe('isVisible (Batch 9)', () => {
  it('visible when no conditions target the field', () => {
    expect(isVisible('f1', [], {})).toBe(true)
  })

  it('visible when show condition does NOT match', () => {
    const conditions = [cond('f1', 'src', 'equals', 'yes', 'show')]
    expect(isVisible('f1', conditions, { src: 'no' })).toBe(true)
  })

  it('visible when show condition matches', () => {
    const conditions = [cond('f1', 'src', 'equals', 'yes', 'show')]
    expect(isVisible('f1', conditions, { src: 'yes' })).toBe(true)
  })

  it('hidden when hide condition matches', () => {
    const conditions = [cond('f1', 'src', 'equals', 'yes', 'hide')]
    expect(isVisible('f1', conditions, { src: 'yes' })).toBe(false)
  })

  it('visible when hide condition does NOT match', () => {
    const conditions = [cond('f1', 'src', 'equals', 'yes', 'hide')]
    expect(isVisible('f1', conditions, { src: 'no' })).toBe(true)
  })

  it('hidden when any matching hide exists among multiple', () => {
    const conditions = [
      cond('f1', 'src', 'equals', 'yes', 'show'),
      cond('f1', 'src2', 'equals', 'on', 'hide'),
    ]
    expect(isVisible('f1', conditions, { src: 'yes', src2: 'on' })).toBe(false)
  })
})

describe('isRequired (Batch 9)', () => {
  it('not required when no conditions target the field', () => {
    expect(isRequired('f1', [], {})).toBe(false)
  })

  it('required when require condition matches', () => {
    const conditions = [cond('f1', 'src', 'equals', 'yes', 'require')]
    expect(isRequired('f1', conditions, { src: 'yes' })).toBe(true)
  })

  it('not required when require condition does NOT match', () => {
    const conditions = [cond('f1', 'src', 'equals', 'yes', 'require')]
    expect(isRequired('f1', conditions, { src: 'no' })).toBe(false)
  })

  it('not required when matching condition has show effect (not require)', () => {
    const conditions = [cond('f1', 'src', 'equals', 'yes', 'show')]
    expect(isRequired('f1', conditions, { src: 'yes' })).toBe(false)
  })

  it('required when at least one matching require exists among multiple', () => {
    const conditions = [
      cond('f1', 'src', 'equals', 'yes', 'show'),
      cond('f1', 'src2', 'greater_than', '0', 'require'),
    ]
    expect(isRequired('f1', conditions, { src: 'yes', src2: 5 })).toBe(true)
  })

  it('cascades with numeric conditions (greater_than)', () => {
    const conditions = [cond('f1', 'src', 'greater_than', '18', 'require')]
    expect(isRequired('f1', conditions, { src: 25 })).toBe(true)
    expect(isRequired('f1', conditions, { src: 10 })).toBe(false)
  })
})
