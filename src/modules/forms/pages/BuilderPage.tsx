import { useEffect, useState, useMemo, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Card,
  Checkbox,
  Field,
  Heading,
  Input,
  Page,
  Select,
  Switch,
  Text,
  Textarea,
  useRegisterPageActions,
} from '@/core/ui'
import { Box, Stack } from 'styled-system/jsx'
import { Users, GripVertical } from 'lucide-react'
import { createListCollection } from '@ark-ui/react'
import { DragDropProvider } from '@/core/dragndrop'
import { useSortableList } from '@/core/dragndrop/hooks/useSortableList'
import { createForm, getFormById, MAPPABLE_PERSON_FIELDS, updateForm } from '../lib/queries'
import { getTags } from '../../people/lib/queries'
import { PageSkeleton } from '../../people/components/PageSkeleton'
import { ColumnContainer } from '../components/ColumnContainer'
import { createDefaultField, getFieldSpec } from '../lib/fieldTypes'
import type { FormDraft, FormFieldDraft } from '../lib/queries'
import type { FormFieldOption, FormFieldType, FormSubmitAction, Tag } from '../lib/types'
import type { DragItem } from '@/core/dragndrop'

const FIELD_TYPES: FormFieldType[] = [
  'text', 'email', 'phone', 'number', 'select', 'multi_select', 'checkbox',
  'textarea', 'date', 'title', 'radio', 'scale', 'nps', 'column_container',
]
const SUBMIT_ACTIONS: FormSubmitAction[] = ['none', 'create_person', 'update_person', 'add_to_tag']
const PALETTE_TYPES: FormFieldType[] = FIELD_TYPES

const emptyDraft = (): FormDraft => ({
  name: '',
  description: '',
  is_public: false,
  submit_action: 'none',
  submit_target: null,
  settings: {},
  fields: [],
})

/** Convert a field draft to a DragItem for SortableList. */
function fieldToDragItem(field: FormFieldDraft): DragItem {
  const spec = getFieldSpec(field.field_type)
  return {
    id: field.id,
    label: field.label || spec?.defaultLabel || field.field_type,
    data: { field_type: field.field_type, parent_id: field.parent_id ?? undefined },
  }
}

function renderFieldCardItem(
  field: FormFieldDraft,
  index: number,
  isDragging: boolean,
  draft: FormDraft,
  setField: (fieldId: string, patch: Partial<FormFieldDraft>) => void,
  removeField: (fieldId: string) => void
) {
  return renderFieldCard(field, index, isDragging, draft, setField, removeField)
}

export default function FormBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<FormDraft>(emptyDraft)
  const [tags, setTags] = useState<Tag[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const fieldTypeCollection = useMemo(() => createListCollection({
    items: FIELD_TYPES.map((type) => ({ label: type, value: type }))
  }), [])

  const submitActionCollection = useMemo(() => createListCollection({
    items: SUBMIT_ACTIONS.map((action) => ({ label: action, value: action }))
  }), [])

  const mappableObjectFieldsCollection = useMemo(() => createListCollection({
    items: [{ label: 'None', value: '' }, ...MAPPABLE_PERSON_FIELDS.map((name) => ({ label: name, value: name }))]
  }), [])

  const tagCollection = useMemo(() => createListCollection({
    items: [{ label: 'Select a tag', value: '' }, ...tags.map((tag) => ({ label: tag.name, value: tag.id }))]
  }), [tags])

  // Root-level fields (parent_id IS NULL) shown in the main SortableList.
  const rootFields = useMemo(
    () => draft.fields.filter((field) => !field.parent_id),
    [draft.fields],
  )

  useEffect(() => {
    getTags().then(setTags).catch(() => undefined)
    if (!id) {
      setLoaded(true)
      return
    }
    getFormById(id)
      .then((form) => {
        if (form) {
          setDraft({
            name: form.name,
            description: form.description ?? '',
            is_public: form.is_public,
            submit_action: form.submit_action,
            submit_target: form.submit_target,
            settings: (form.settings as { thank_you_message?: string }) ?? {},
            fields: form.fields.map((field) => ({
              id: field.id,
              field_type: field.field_type,
              label: field.label,
              placeholder: field.placeholder ?? '',
              options: (field.options as FormFieldOption[] | null) ?? null,
              required: field.required,
              maps_to_field: field.maps_to_field,
              sort_order: field.sort_order,
              min_value: field.min_value ?? null,
              max_value: field.max_value ?? null,
              column_span: field.column_span ?? 12,
              parent_id: field.parent_id ?? null,
            })),
          })
        }
        setLoaded(true)
      })
      .catch((reason: unknown) => {
        setMessage(reason instanceof Error ? reason.message : 'Unable to load form.')
        setLoaded(true)
      })
  }, [id])

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      if (id) await updateForm(id, draft)
      else await createForm(draft)
      navigate('/people/forms')
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to save form.')
      setSaving(false)
    }
  }

  useRegisterPageActions({
    cancel: () => navigate('/people/forms'),
    apply: save,
    isSaving: saving,
    isDirty: true,
    applyLabel: 'Save form',
  })

  if (!loaded) return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title="New form" />
      </Page.Header>
      <Page.Body><PageSkeleton /></Page.Body>
    </Page.Main>
  )

  const setField = (fieldId: string, patch: Partial<FormFieldDraft>) => {
    setDraft((current) => ({
      ...current,
      fields: current.fields.map((field) => (field.id === fieldId ? { ...field, ...patch } : field)),
    }))
  }

  /**
   * Reorder handler for the root SortableList (Batch 10).
   * Replaces the old button-based `moveField`. Accepts the new id order and
   * re-numbers sort_order; column_container children keep their nested order.
   */
  const reorderFields = (nextIds: string[]) => {
    setDraft((current) => {
      const byId = new Map(current.fields.map((field) => [field.id, field]))
      const fields = nextIds
        .map((fieldId) => byId.get(fieldId))
        .filter((field): field is FormFieldDraft => Boolean(field))
        .map((field, index) => ({ ...field, sort_order: index }))
      const movedIds = new Set(nextIds)
      const children = current.fields.filter((f) => !movedIds.has(f.id))
      return { ...current, fields: [...fields, ...children] }
    })
  }

  const addField = (type: FormFieldType) => {
    const newField = createDefaultField({ field_type: type }, draft.fields.length)
    setDraft((current) => ({
      ...current,
      fields: [...current.fields, newField],
    }))
  }

  const removeField = (fieldId: string) => {
    setDraft((current) => ({
      ...current,
      fields: current.fields
        .filter((field) => field.id !== fieldId)
        .filter((field) => field.parent_id !== fieldId),
    }))
  }

  const headingTitle = id ? 'Edit form' : 'New form'

  // Convert root fields to DragItem for useSortableList
  const dragItems = useMemo(() =>
    rootFields.map(fieldToDragItem),
    [rootFields]
  )

  // Use the new useSortableList hook (v8+ pattern)
  const { items: sortableItems, sensors, handleDragStart, handleDragMove, handleDragOver, handleDragEnd, getItemProps } = useSortableList({
    items: dragItems,
    onReorder: (reorderedItems) => reorderFields(reorderedItems.map((item) => item.id)),
  })

  return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title={headingTitle} />
      </Page.Header>
      <Page.Body>
        <Stack gap="6">
          <Stack flexDirection="row" gap="2">
            <Button variant="outline" onClick={() => navigate('/people/forms')}>Back</Button>
          </Stack>
          {message && <Text color="error">{message}</Text>}

          {/* Form Settings */}
          <Card.Root>
            <Card.Header>
              <Card.Title>Form Settings</Card.Title>
            </Card.Header>
            <Card.Body>
              <Stack gap="4">
                <Field.Root>
                  <Field.Label>Form name</Field.Label>
                  <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Description</Field.Label>
                  <Textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
                </Field.Root>
                <Switch.Root checked={draft.is_public} onCheckedChange={(details) => setDraft({ ...draft, is_public: details.checked })}>
                  <Switch.HiddenInput />
                  <Switch.Control><Switch.Thumb /></Switch.Control>
                  <Switch.Label>Public (anyone with the link can submit)</Switch.Label>
                </Switch.Root>
                <Field.Root>
                  <Field.Label>Submit action</Field.Label>
                  <Select.Root collection={submitActionCollection} value={[draft.submit_action]} onValueChange={(details) => setDraft({ ...draft, submit_action: details.value[0] as FormSubmitAction })}>
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Select action" />
                        <Select.Indicator />
                      </Select.Trigger>
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content>
                        {submitActionCollection.items.map((item) => (
                          <Select.Item key={item.value} item={item}>
                            <Select.ItemText>{item.label}</Select.ItemText>
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </Field.Root>
                {draft.submit_action === 'add_to_tag' && (
                  <Field.Root>
                    <Field.Label>Tag to add</Field.Label>
                    <Select.Root collection={tagCollection} value={[(draft.submit_target as { tag_id?: string } | null)?.tag_id ?? '']} onValueChange={(details) => setDraft({ ...draft, submit_target: details.value[0] ? { tag_id: details.value[0] } : null })}>
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder="Select a tag" />
                          <Select.Indicator />
                        </Select.Trigger>
                      </Select.Control>
                      <Select.Positioner>
                        <Select.Content>
                          {tagCollection.items.map((item) => (
                            <Select.Item key={item.value} item={item}>
                              <Select.ItemText>{item.label}</Select.ItemText>
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Select.Root>
                  </Field.Root>
                )}
                <Field.Root>
                  <Field.Label>Thank-you message</Field.Label>
                  <Input value={draft.settings.thank_you_message ?? ''} onChange={(event) => setDraft({ ...draft, settings: { ...draft.settings, thank_you_message: event.target.value } })} placeholder="Thanks for submitting!" />
                </Field.Root>
              </Stack>
            </Card.Body>
          </Card.Root>

          {/* Field Palette */}
          <Card.Root>
            <Card.Header>
              <Card.Title>Fields</Card.Title>
            </Card.Header>
            <Card.Body>
              <DragDropProvider>
                <Stack gap="4">
                  <Text>Drag a field type below onto the canvas:</Text>
                  <Box data-field-palette display="flex" flexWrap="wrap" gap="2">
                    {PALETTE_TYPES.map((type) => {
                      const spec = getFieldSpec(type)
                      return (
                        <Button
                          key={type}
                          variant="outline"
                          size="sm"
                          data-palette-type={type}
                          onClick={() => addField(type)}
                        >
                          {spec?.label ?? type}
                        </Button>
                      )
                    })}
                  </Box>
                </Stack>
              </DragDropProvider>
            </Card.Body>
          </Card.Root>

          {/* Field Canvas — SortableList replaces button reorder (Batch 10) */}
          <Card.Root>
            <Card.Header>
              <Card.Title>Canvas</Card.Title>
            </Card.Header>
            <Card.Body>
              <DragDropProvider
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <Stack gap="4">
                  {draft.fields.length === 0 && <Text color="fg.muted">No fields yet. Add one from the palette above.</Text>}
                  {sortableItems.map((item, index) => {
                    const field = rootFields[index]
                    if (!field) return null
                    const { ref, handleRef, isDragging, isDragSource } = getItemProps(item, index)
                    const spec = getFieldSpec(field.field_type)
                    const childFields = draft.fields.filter((child) => child.parent_id === field.id)
                    return (
                      <Box
                        key={field.id}
                        ref={ref}
                        data-field-card={field.id}
                        data-field-type={field.field_type}
                        data-dragging={isDragging ? 'true' : 'false'}
                        data-drag-source={isDragSource ? 'true' : 'false'}
                        borderWidth="1px"
                        borderStyle="solid"
                        borderColor={isDragging ? 'var(--colors-border-emphasized)' : 'var(--colors-border)'}
                        borderRadius="l2"
                        p="3"
                      >
                        <Stack gap="2">
                          <Stack flexDirection="row" alignItems="center" gap="2" mb="2">
                            <button
                              ref={handleRef}
                              type="button"
                              aria-label="Reorder item"
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
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <circle cx="9" cy="5" r="1" />
                                <circle cx="9" cy="12" r="1" />
                                <circle cx="9" cy="19" r="1" />
                                <circle cx="15" cy="5" r="1" />
                                <circle cx="15" cy="12" r="1" />
                                <circle cx="15" cy="19" r="1" />
                              </svg>
                            </button>
                            <Heading textStyle="sm" fontWeight="medium">{field.label || spec?.defaultLabel}</Heading>
                            <Text textStyle="xs" color="fg.muted">({field.field_type})</Text>
                          </Stack>

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
                  })}
                </Stack>
              </DragDropProvider>
            </Card.Body>
          </Card.Root>
        </Stack>
      </Page.Body>
    </Page.Main>
  )
}