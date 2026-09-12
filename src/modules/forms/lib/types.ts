/**
 * Forms-module type re-exports.
 *
 * Shared domain types (Form, FormField, FormSubmission, FormFieldCondition, …)
 * live in the people module's lib/types.ts. This file re-exports the forms-relevant
 * surface so `src/modules/forms/` never imports from `@/modules/people/lib/types`
 * directly — only through this barrel. Keep in sync with people/lib/types.ts.
 */
export type {
  Form,
  FormField,
  FormFieldCondition,
  FormFieldOption,
  FormFieldType,
  FormSubmitAction,
  FormSubmission,
  FormSubmissionWithPerson,
  FormWithFields,
} from '@/modules/people/lib/types'

export type { FormConditionOperator, FormConditionEffect } from '@/modules/people/lib/types'
