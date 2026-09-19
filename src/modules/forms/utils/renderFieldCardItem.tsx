import { createElement } from 'react'
import { FieldCard } from '../components/FieldCard'
import type { FormDraft, FormFieldDraft } from '../lib/queries'
import type { DragItem } from '@/core/dragndrop'

interface RenderFieldCardItemOptions {
  rootFields: FormFieldDraft[]
  draft: FormDraft
  setField: (fieldId: string, patch: Partial<FormFieldDraft>) => void
}

export function createRenderFieldCardItem({
  rootFields,
  draft,
  setField,
}: RenderFieldCardItemOptions) {
  const fieldsById = new Map(rootFields.map((field) => [field.id, field]))

  return (item: DragItem, index: number) => {
    const field = fieldsById.get(String(item.id))
    if (!field) return null
    return createElement(FieldCard, { key: field.id, field, index, draft, setField })
  }
}