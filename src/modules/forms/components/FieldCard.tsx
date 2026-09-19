import { Box, Stack } from 'styled-system/jsx'
import { Field, Heading, Input, Text } from '@/core/ui'
import { SortableItem } from '@/core/dragndrop'
import { GripVertical } from 'lucide-react'
import { ColumnContainer } from './ColumnContainer'
import { getFieldSpec } from '../lib/fieldTypes'
import type { FormDraft, FormFieldDraft } from '../lib/queries'

interface FieldCardProps {
  field: FormFieldDraft
  index: number
  draft: FormDraft
  setField: (fieldId: string, patch: Partial<FormFieldDraft>) => void
}

function fieldToDragItem(field: FormFieldDraft) {
  const spec = getFieldSpec(field.field_type)
  return {
    id: field.id,
    label: field.label || spec?.defaultLabel || field.field_type,
    data: { field_type: field.field_type, parent_id: field.parent_id ?? undefined },
  }
}

export function FieldCard({ field, index, draft, setField }: FieldCardProps) {
  const spec = getFieldSpec(field.field_type)
  const childFields = draft.fields.filter((child) => child.parent_id === field.id)

  return (
    <SortableItem item={fieldToDragItem(field)} index={index}>
      {({ handleRef, isDragging, isDragSource, isDropTarget }) => (
        <Box
          data-field-card={field.id}
          data-field-type={field.field_type}
          data-dragging={isDragging ? 'true' : 'false'}
          data-drag-source={isDragSource ? 'true' : undefined}
          data-drop-target={isDropTarget ? 'true' : undefined}
          borderWidth="1px"
          borderStyle="solid"
          borderColor={isDragging ? 'var(--colors-border-emphasized)' : 'var(--colors-border)'}
          borderRadius="l2"
          p="3"
        >
          <Stack flexDirection="row" alignItems="center" gap="2" mb="2">
            <button
              ref={handleRef}
              aria-label={`Reorder ${field.label || spec?.defaultLabel}`}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                flexShrink: 0,
                border: 'none',
                background: 'transparent',
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none',
              }}
            >
              <GripVertical size={16} aria-hidden="true" />
            </button>
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
              <Field.Root>
                <Field.Label>Label</Field.Label>
                <Input value={field.label} onChange={(event) => setField(field.id, { label: event.target.value })} />
              </Field.Root>
            )}
          </Stack>
        </Box>
      )}
    </SortableItem>
  )
}