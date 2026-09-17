import { useCallback } from 'react'
import { renderFieldCard } from './FieldCard'
import type { FormDraft, FormFieldDraft } from '../lib/queries'
import type { DragItem } from '@/core/dragndrop'

interface UseFormBuilderRenderItemOptions {
  rootFields: FormFieldDraft[]
  draft: FormDraft
  setField: (fieldId: string, patch: Partial<FormFieldDraft>) => void
  removeField: (fieldId: string) => void
}

export function useFormBuilderRenderItem({
  rootFields,
  draft,
  setField,
  removeField,
}: UseFormBuilderRenderItemOptions) {
  return useCallback((item: DragItem, index: number, isDragging: boolean) => {
    const field = rootFields[index]
    if (!field) return null
    return renderFieldCard(field, index, isDragging, draft, setField, removeField)
  }, [rootFields, draft, setField, removeField])
}