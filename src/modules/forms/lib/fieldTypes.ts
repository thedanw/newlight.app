import type { FormFieldDraft } from './queries'
import type { FormFieldType } from './types'

export interface FormFieldSpec {
  type: FormFieldType
  label: string
  icon: string
  defaultLabel: string
  supportsPlaceholder: boolean
  supportsOptions: boolean
  supportsMinMax: boolean
  nestable: boolean
  defaults: Omit<Partial<FormFieldDraft>, 'field_type'>
}

export interface NewFieldOverrides {
  label?: string
  placeholder?: string
  options?: { label: string; value: string }[] | null
  required?: boolean
  maps_to_field?: string | null
  min_value?: number | null
  max_value?: number | null
  column_span?: number
  parent_id?: string | null
}

const FIELD_TYPE_SPECS: FormFieldSpec[] = [
  {
    type: 'title',
    label: 'Title',
    icon: 'Heading1',
    defaultLabel: 'Form title',
    supportsPlaceholder: false,
    supportsOptions: false,
    supportsMinMax: false,
    nestable: true,
    defaults: { required: false },
  },
  {
    type: 'text',
    label: 'Short text',
    icon: 'Type',
    defaultLabel: 'Untitled question',
    supportsPlaceholder: true,
    supportsOptions: false,
    supportsMinMax: false,
    nestable: true,
    defaults: { placeholder: '', required: false },
  },
  {
    type: 'email',
    label: 'Email',
    icon: 'Mail',
    defaultLabel: 'Email address',
    supportsPlaceholder: true,
    supportsOptions: false,
    supportsMinMax: false,
    nestable: true,
    defaults: { placeholder: 'you@example.com', required: false, maps_to_field: 'email' },
  },
  {
    type: 'phone',
    label: 'Phone',
    icon: 'Phone',
    defaultLabel: 'Phone number',
    supportsPlaceholder: true,
    supportsOptions: false,
    supportsMinMax: false,
    nestable: true,
    defaults: { placeholder: '', required: false, maps_to_field: 'mobile' },
  },
  {
    type: 'number',
    label: 'Number',
    icon: 'Hash',
    defaultLabel: 'Untitled question',
    supportsPlaceholder: true,
    supportsOptions: false,
    supportsMinMax: true,
    nestable: true,
    defaults: { placeholder: '', required: false, maps_to_field: null },
  },
  {
    type: 'textarea',
    label: 'Long text',
    icon: 'AlignLeft',
    defaultLabel: 'Untitled question',
    supportsPlaceholder: true,
    supportsOptions: false,
    supportsMinMax: false,
    nestable: true,
    defaults: { placeholder: '', required: false },
  },
  {
    type: 'date',
    label: 'Date',
    icon: 'Calendar',
    defaultLabel: 'Pick a date',
    supportsPlaceholder: false,
    supportsOptions: false,
    supportsMinMax: false,
    nestable: true,
    defaults: { required: false },
  },
  {
    type: 'select',
    label: 'Dropdown',
    icon: 'ChevronDown',
    defaultLabel: 'Untitled question',
    supportsPlaceholder: true,
    supportsOptions: true,
    supportsMinMax: false,
    nestable: true,
    defaults: {
      placeholder: 'Select an option',
      required: false,
      options: [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
      ],
    },
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: 'CheckSquare',
    defaultLabel: 'Untitled question',
    supportsPlaceholder: false,
    supportsOptions: false,
    supportsMinMax: false,
    nestable: true,
    defaults: { required: false },
  },
  {
    type: 'radio',
    label: 'Multiple choice',
    icon: 'CircleDot',
    defaultLabel: 'Untitled question',
    supportsPlaceholder: false,
    supportsOptions: true,
    supportsMinMax: false,
    nestable: true,
    defaults: {
      required: false,
      options: [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
      ],
    },
  },
  {
    type: 'multi_select',
    label: 'Checkboxes',
    icon: 'ListChecks',
    defaultLabel: 'Untitled question',
    supportsPlaceholder: false,
    supportsOptions: true,
    supportsMinMax: false,
    nestable: true,
    defaults: {
      required: false,
      options: [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
      ],
    },
  },
  {
    type: 'scale',
    label: 'Scale',
    icon: 'SlidersHorizontal',
    defaultLabel: 'Untitled question',
    supportsPlaceholder: false,
    supportsOptions: false,
    supportsMinMax: true,
    nestable: true,
    defaults: { required: false, min_value: 1, max_value: 10 },
  },
  {
    type: 'nps',
    label: 'NPS',
    icon: 'BarChart3',
    defaultLabel: 'How likely are you to recommend us?',
    supportsPlaceholder: false,
    supportsOptions: false,
    supportsMinMax: true,
    nestable: true,
    defaults: { required: false, min_value: 0, max_value: 10 },
  },
  {
    type: 'column_container',
    label: 'Columns',
    icon: 'Columns',
    defaultLabel: 'Column layout',
    supportsPlaceholder: false,
    supportsOptions: false,
    supportsMinMax: false,
    nestable: false,
    defaults: {},
  },
]

const SPEC_BY_TYPE: ReadonlyMap<FormFieldType, FormFieldSpec> = new Map(
  FIELD_TYPE_SPECS.map((spec) => [spec.type, spec]),
)

export function getFieldSpec(type: FormFieldType): FormFieldSpec | undefined {
  return SPEC_BY_TYPE.get(type)
}

export function getAllFieldTypes(): FormFieldType[] {
  return FIELD_TYPE_SPECS.map((spec) => spec.type)
}

export interface CreateFieldInput extends NewFieldOverrides {
  field_type: FormFieldType
}

export function createDefaultField(input: CreateFieldInput, sortOrder = 0): FormFieldDraft {
  const spec = getFieldSpec(input.field_type)
  if (!spec) throw new Error(`Unknown field type: ${input.field_type}`)
  const { field_type: _ignored, ...overrides } = input
  return {
    id: crypto.randomUUID(),
    sort_order: sortOrder,
    placeholder: '',
    required: false,
    options: null,
    maps_to_field: null,
    min_value: null,
    max_value: null,
    column_span: 12,
    parent_id: null,
    ...spec.defaults,
    ...overrides,
    field_type: spec.type,
    label: overrides.label ?? spec.defaultLabel,
  }
}
