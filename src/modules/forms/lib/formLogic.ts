import type { FormConditionEffect, FormConditionOperator, FormFieldCondition } from './types'

export type FormAnswers = Record<string, string | number | boolean | null>

export interface ConditionEvaluation {
  /** Whether the condition's comparison matches the current answers */
  matches: boolean
  /** The effect to apply when matches is true */
  effect: FormConditionEffect
  /** The field this condition targets */
  fieldId: string
}

/** Compare a source field's answer against a condition's value using the operator. */
export function evaluateCondition(
  condition: Pick<FormFieldCondition, 'operator' | 'value' | 'effect' | 'field_id' | 'source_field_id'>,
  answers: FormAnswers,
): ConditionEvaluation {
  const raw = answers[condition.source_field_id]
  const matches = compare(condition.operator, raw, condition.value)
  return { matches, effect: condition.effect, fieldId: condition.field_id }
}

function compare(operator: FormConditionOperator, raw: FormAnswers[string], target: string): boolean {
  if (raw === null || raw === undefined) return false

  const rawStr = String(raw)
  const targetNum = Number(target)
  const rawNum = Number(rawStr)

  switch (operator) {
    case 'equals':
      return rawStr === target
    case 'not_equals':
      return rawStr !== target
    case 'greater_than':
      return !Number.isNaN(targetNum) && !Number.isNaN(rawNum) && rawNum > targetNum
    case 'less_than':
      return !Number.isNaN(targetNum) && !Number.isNaN(rawNum) && rawNum < targetNum
    case 'contains':
      return rawStr.toLowerCase().includes(target.toLowerCase())
    default:
      return false
  }
}

/** A field is visible when no "hide" condition matches and no parent is hidden. */
export function isVisible(
  fieldId: string,
  conditions: Array<Pick<FormFieldCondition, 'operator' | 'value' | 'effect' | 'field_id' | 'source_field_id'>>,
  answers: FormAnswers,
): boolean {
  return conditions
    .filter((c) => c.field_id === fieldId)
    .every((c) => {
      const result = evaluateCondition(c, answers)
      if (result.matches) {
        return c.effect !== 'hide'
      }
      return true
    })
}

/** A field is required when its own required flag is set OR a "require" condition matches. */
export function isRequired(
  fieldId: string,
  conditions: Array<Pick<FormFieldCondition, 'operator' | 'value' | 'effect' | 'field_id' | 'source_field_id'>>,
  answers: FormAnswers,
): boolean {
  return conditions
    .filter((c) => c.field_id === fieldId)
    .some((c) => {
      const result = evaluateCondition(c, answers)
      return result.matches && c.effect === 'require'
    })
}
