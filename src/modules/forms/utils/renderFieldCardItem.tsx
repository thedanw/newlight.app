import React from 'react'
import { Box, Heading, Stack, Text } from 'styled-system/jsx'
import { Dragndrop, Field, Input } from '@/core/ui'
import { GripVertical } from 'lucide-react'
import { ColumnContainer } from './ColumnContainer'
import { fieldToDragItem, getFieldSpec } from '../lib/fieldTypes'
import type { FormDraft, FormFieldDraft } from '../lib/queries'
import type { DragItem } from '@/core/dragndrop'

interface RenderFieldCardItemOptions {
  rootFields: FormFieldDraft[]
  draft: FormDraft
  setField: (fieldId: string, patch: Partial<FormFieldDraft>) => void
  removeField: (fieldId: string) => void
}

export function createRenderFieldCardItem({
  rootFields,
  draft,
  setField,
  removeField,
}: RenderFieldCardItemOptions) {
  return (item: DragItem, index: number, isDragging: boolean) => {
    const field = rootFields[index]
    if (!field) return null
    const spec = getFieldSpec(field.field_type)
    const childFields = draft.fields.filter((child) => child.parent_id === field.id)

    return React.createElement(
      Box,
      {
        key: field.id,
        'data-field-card': field.id,
        'data-field-type': field.field_type,
        'data-dragging': isDragging ? 'true' : 'false',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: isDragging ? 'var(--colors-border-emphasized)' : 'var(--colors-border)',
        borderRadius: 'l2',
        p: '3',
      },
      React.createElement(
        Stack,
        { gap: '2' },
        React.createElement(
          Stack,
          { flexDirection: 'row', alignItems: 'center', gap: '2', mb: '2' },
          React.createElement(Dragndrop.DraggableHandle, { item: fieldToDragItem(field) }),
          React.createElement(Heading, { textStyle: 'sm', fontWeight: 'medium' }, field.label || spec?.defaultLabel),
          React.createElement(Text, { textStyle: 'xs', color: 'fg.muted' }, `(${field.field_type})`)
        ),
        field.field_type === 'column_container'
          ? React.createElement(
              ColumnContainer,
              { container: field },
              childFields.map((child) =>
                React.createElement(
                  Box,
                  {
                    key: child.id,
                    'data-column-child': child.id,
                    gridColumn: `span ${child.column_span}`,
                    borderWidth: '1px',
                    borderStyle: 'dashed',
                    borderColor: 'var(--colors-border)',
                    borderRadius: 'l1',
                    p: '2',
                  },
                  React.createElement(
                    Stack,
                    { flexDirection: 'row', alignItems: 'center', gap: '1' },
                    React.createElement(GripVertical, { size: 14, 'aria-hidden': 'true' }),
                    React.createElement(Text, { textStyle: 'sm' }, child.label || getFieldSpec(child.field_type)?.defaultLabel)
                  )
                )
              )
            )
          : React.createElement(
              React.Fragment,
              null,
              React.createElement(
                Field.Root,
                null,
                React.createElement(Field.Label, null, 'Label'),
                React.createElement(Input, {
                  value: field.label,
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) => setField(field.id, { label: event.target.value }),
                })
              )
            )
      )
    )
  }
}