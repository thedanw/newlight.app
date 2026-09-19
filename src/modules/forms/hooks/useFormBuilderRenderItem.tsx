import { createElement, useCallback, useMemo } from 'react'
import { FieldCard } from '../components/FieldCard'
import type { FormDraft, FormFieldDraft } from '../lib/queries'
import type { DragItem } from '@/core/dragndrop'

interface UseFormBuilderRenderItemOptions {
  rootFields: FormFieldDraft[]
  draft: FormDraft
  setField: (fieldId: string, patch: Partial<FormFieldDraft>) => void
}

export function useFormBuilderRenderItem({
  rootFields,
  draft,
  setField,
}: UseFormBuilderRenderItemOptions) {
  const fieldsById = useMemo(
    () => new Map(rootFields.map((field) => [field.id, field])),
    [rootFields],
  )

  return useCallback(
    (item: DragItem, index: number) => {
      const field = fieldsById.get(String(item.id))
      if (!field) return null
      return createElement(FieldCard, { key: field.id, field, index, draft, setField })
    },
    [fieldsById, draft, setField],
  )
}