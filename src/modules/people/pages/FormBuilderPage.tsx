import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Checkbox, Field, Fieldset, Heading, Input, PageHeader, Switch, Text, Textarea } from '@/core/ui'
import { createForm, getFormById, MAPPABLE_PERSON_FIELDS, updateForm } from '../lib/form-queries'
import { getTags } from '../lib/queries'
import type { FormDraft, FormFieldDraft } from '../lib/form-queries'
import type { FormFieldOption, FormFieldType, FormSubmitAction, Tag } from '../lib/types'

const FIELD_TYPES: FormFieldType[] = ['text', 'email', 'phone', 'number', 'select', 'multi_select', 'checkbox', 'textarea', 'date']
const SUBMIT_ACTIONS: FormSubmitAction[] = ['none', 'create_person', 'update_person', 'add_to_tag']

const emptyField = (): FormFieldDraft => ({
  id: crypto.randomUUID(),
  field_type: 'text',
  label: '',
  placeholder: '',
  options: null,
  required: false,
  maps_to_field: null,
  sort_order: 0,
})

const emptyDraft = (): FormDraft => ({
  name: '',
  description: '',
  is_public: false,
  submit_action: 'none',
  submit_target: null,
  settings: {},
  fields: [],
})

export default function FormBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<FormDraft>(emptyDraft)
  const [tags, setTags] = useState<Tag[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

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

  if (!loaded) return <Text>Loading form...</Text>

  const setField = (fieldId: string, patch: Partial<FormFieldDraft>) => {
    setDraft((current) => ({
      ...current,
      fields: current.fields.map((field) => (field.id === fieldId ? { ...field, ...patch } : field)),
    }))
  }

  const moveField = (index: number, direction: -1 | 1) => {
    setDraft((current) => {
      const fields = [...current.fields]
      const target = index + direction
      if (target < 0 || target >= fields.length) return current
      ;[fields[index], fields[target]] = [fields[target], fields[index]]
      return { ...current, fields }
    })
  }

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

  return (
    <>
      <PageHeader>
        <Heading>{id ? 'Edit form' : 'New form'}</Heading>
        <Button onClick={() => navigate('/people/forms')}>Back</Button>
      </PageHeader>
      <main>
        {message && <Text>{message}</Text>}
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
          <select value={draft.submit_action} onChange={(event) => setDraft({ ...draft, submit_action: event.target.value as FormSubmitAction })}>
            {SUBMIT_ACTIONS.map((action) => <option key={action} value={action}>{action}</option>)}
          </select>
        </Field.Root>
        {draft.submit_action === 'add_to_tag' && (
          <Field.Root>
            <Field.Label>Tag to add</Field.Label>
            <select value={(draft.submit_target as { tag_id?: string } | null)?.tag_id ?? ''} onChange={(event) => setDraft({ ...draft, submit_target: event.target.value ? { tag_id: event.target.value } : null })}>
              <option value="">Select a tag</option>
              {tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
            </select>
          </Field.Root>
        )}
        <Field.Root>
          <Field.Label>Thank-you message</Field.Label>
          <Input value={draft.settings.thank_you_message ?? ''} onChange={(event) => setDraft({ ...draft, settings: { ...draft.settings, thank_you_message: event.target.value } })} placeholder="Thanks for submitting!" />
        </Field.Root>

        <Heading>Fields</Heading>
        {draft.fields.length === 0 && <Text color="fg.muted">No fields yet. Add one below.</Text>}
        {draft.fields.map((field, index) => (
          <Fieldset.Root key={field.id}>
            <Fieldset.Legend>Field {index + 1}</Fieldset.Legend>
            <Field.Root>
              <Field.Label>Type</Field.Label>
              <select value={field.field_type} onChange={(event) => setField(field.id, { field_type: event.target.value as FormFieldType })}>
                {FIELD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </Field.Root>
            <Field.Root>
              <Field.Label>Label</Field.Label>
              <Input value={field.label} onChange={(event) => setField(field.id, { label: event.target.value })} />
            </Field.Root>
            <Field.Root>
              <Field.Label>Placeholder</Field.Label>
              <Input value={field.placeholder} onChange={(event) => setField(field.id, { placeholder: event.target.value })} />
            </Field.Root>
            {(field.field_type === 'select' || field.field_type === 'multi_select') && (
              <Field.Root>
                <Field.Label>Options (one per line)</Field.Label>
                <Textarea value={(field.options ?? []).map((option) => option.value).join('\n')} onChange={(event) => setField(field.id, { options: event.target.value.split('\n').filter((line) => line.trim()).map((line) => ({ label: line.trim(), value: line.trim() })) })} />
              </Field.Root>
            )}
            <Field.Root>
              <Field.Label>Maps to person field</Field.Label>
              <select value={field.maps_to_field ?? ''} onChange={(event) => setField(field.id, { maps_to_field: event.target.value || null })}>
                <option value="">None</option>
                {MAPPABLE_PERSON_FIELDS.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </Field.Root>
            <Checkbox.Root checked={field.required} onCheckedChange={(details) => setField(field.id, { required: details.checked === true })}>
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>Required</Checkbox.Label>
            </Checkbox.Root>
            <Button variant="outline" onClick={() => moveField(index, -1)}>Up</Button>
            <Button variant="outline" onClick={() => moveField(index, 1)}>Down</Button>
            <Button variant="outline" onClick={() => setDraft((current) => ({ ...current, fields: current.fields.filter((item) => item.id !== field.id) }))}>Remove</Button>
          </Fieldset.Root>
        ))}
        <Button onClick={() => setDraft((current) => ({ ...current, fields: [...current.fields, emptyField()] }))}>Add field</Button>
        <Button onClick={() => void save()} disabled={saving}>{saving ? 'Saving...' : 'Save form'}</Button>
      </main>
    </>
  )
}