import { Box, Heading, Stack, Text } from 'styled-system/jsx'
import { Dragndrop, Field, Input } from '@/core/ui'
import { GripVertical } from 'lucide-react'
import { ColumnContainer } from './ColumnContainer'
import { fieldToDragItem, getFieldSpec } from '../lib/fieldTypes'
import type { FormDraft, FormFieldDraft } from '../lib/queries'

interface FieldCardProps {
  field: FormFieldDraft
  index: number
  isDragging: boolean
  draft: FormDraft
  setField: (fieldId: string, patch: Partial<FormFieldDraft>) => void
  removeField: (fieldId: string) => void
}

export function FieldCard({ field, index, isDragging, draft, setField, removeField }: FieldCardProps) {
  const spec = getFieldSpec(field.field_type)
  const childFields = draft.fields.filter((child) => child.parent_id === field.id)

  return (
    <Box
      key={field.id}
      data-field-card={field.id}
      data-field-type={field.field_type}
      data-dragging={isDragging ? 'true' : 'false'}
      borderWidth="1px"
      borderStyle="solid"
      borderColor={isDragging ? 'var(--colors-border-emphasized)' : 'var(--colors-border)'}
      borderRadius="l2"
      p="3"
    >
      <Stack flexDirection="row" alignItems="center" gap="2" mb="2">
        <Dragndrop.DraggableHandle item={fieldToDragItem(field)} />
        <Heading textStyle="sm" fontWeight="medium">{field.label || spec?.defaultLabel}</Heading>
        <Text textStyle="xs" color="fg.muted">({field.field_type})</Text>
      </Stack>

      <Stack gap="2">
        {field.field_type === 'column_container' ? (
          <ColumnContainer container={field}>
            {childFields.map((child) => (
              <Box
                key={child.id}
                data-column-child={child.id}
                gridColumn={`span ${child.column_span}`}
                borderWidth="1px"
                borderStyle="dashed"
                borderColor="var(--colors-border)"
                borderRadius="l1"
                p="2"
              >
                <Stack flexDirection="row" alignItems="center" gap="1">
                  <GripVertical size={14} aria-hidden="true" />
                  <Text textStyle="sm">{child.label || getFieldSpec(child.field_type)?.defaultLabel}</Text>
                </Stack>
              </Box>
            ))}
          </ColumnContainer>
        ) : (
          <>
            <Field.Root>
              <Field.Label>Label</Field.Label>
              <Input value={field.label} onChange={(event) => setField(field.id, { label: event.target.value })} />
            </Field.Root>
          </>
        )}
      </Stack>
    </Box>
  )
}

export function renderFieldCard(
  field: FormFieldDraft,
  index: number,
  isDragging: boolean,
  draft: FormDraft,
  setField: (fieldId: string, patch: Partial<FormFieldDraft>) => void,
  removeField: (fieldId: string) => void
) {
  return <FieldCard field={field} index={index} isDragging={isDragging} draft={draft} setField={setField} removeField={removeField} />
}