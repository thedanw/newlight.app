import { supabase } from '@/core/lib/supabase'
import type { Json } from '@/core/lib/database.types'
import type { Form, FormField, FormFieldOption, FormFieldType, FormSubmission, FormSubmitAction, FormSubmissionWithPerson, FormWithFields, Person } from './types'

/** People columns a form field may map to. */
export const MAPPABLE_PERSON_FIELDS = [
  'firstname',
  'lastname',
  'preferred_name',
  'middle_name',
  'email',
  'mobile',
  'date_of_birth',
  'gender',
  'marital_status',
  'school_name',
  'demographic',
] as const

export type FormFieldDraft = {
  id: string
  field_type: FormFieldType
  label: string
  placeholder: string
  options: FormFieldOption[] | null
  required: boolean
  maps_to_field: string | null
  sort_order: number
}

export type FormDraft = {
  name: string
  description: string
  is_public: boolean
  submit_action: FormSubmitAction
  submit_target: Json | null
  settings: { thank_you_message?: string }
  fields: FormFieldDraft[]
}

export async function getForms(): Promise<Form[]> {
  const { data, error } = await supabase.from('forms').select('*').order('name')
  if (error) throw error
  return data ?? []
}

export async function getFormById(id: string): Promise<FormWithFields | null> {
  const { data: form, error: formError } = await supabase.from('forms').select('*').eq('id', id).maybeSingle()
  if (formError) throw formError
  if (!form) return null
  const { data: fields, error: fieldsError } = await supabase.from('form_fields').select('*').eq('form_id', id).order('sort_order')
  if (fieldsError) throw fieldsError
  return { ...form, fields: fields ?? [] }
}

async function upsertFormFields(formId: string, drafts: FormFieldDraft[]): Promise<FormField[]> {
  const { error: deleteError } = await supabase.from('form_fields').delete().eq('form_id', formId)
  if (deleteError) throw deleteError
  if (drafts.length === 0) return []
  const rows = drafts.map((draft, index) => ({
    id: crypto.randomUUID(),
    form_id: formId,
    field_type: draft.field_type,
    label: draft.label.trim(),
    placeholder: draft.placeholder.trim() || null,
    options: draft.options && draft.options.length > 0 ? draft.options : null,
    required: draft.required,
    maps_to_field: draft.maps_to_field || null,
    sort_order: index,
  }))
  const { data, error } = await supabase.from('form_fields').insert(rows).select('*').order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function createForm(input: FormDraft): Promise<FormWithFields> {
  const { data: userResult, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!userResult.user) throw new Error('You must be signed in to create a form.')
  const now = new Date().toISOString()
  const formId = crypto.randomUUID()
  const { data: form, error: formError } = await supabase
    .from('forms')
    .insert({
      id: formId,
      name: input.name.trim(),
      description: input.description.trim() || null,
      owner_id: userResult.user.id,
      is_public: input.is_public,
      submit_action: input.submit_action,
      submit_target: input.submit_target,
      settings: input.settings,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single()
  if (formError) throw formError
  const fields = await upsertFormFields(formId, input.fields)
  return { ...form, fields }
}

export async function updateForm(id: string, input: FormDraft): Promise<FormWithFields> {
  const { data: form, error: formError } = await supabase
    .from('forms')
    .update({
      name: input.name.trim(),
      description: input.description.trim() || null,
      is_public: input.is_public,
      submit_action: input.submit_action,
      submit_target: input.submit_target,
      settings: input.settings,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()
  if (formError) throw formError
  const fields = await upsertFormFields(id, input.fields)
  return { ...form, fields }
}

export async function deleteForm(id: string): Promise<void> {
  const { error } = await supabase.from('forms').delete().eq('id', id)
  if (error) throw error
}

export async function getFormSubmissions(formId: string): Promise<FormSubmissionWithPerson[]> {
  const { data, error } = await supabase
    .from('form_submissions')
    .select('*, person:people(id, firstname, lastname)')
    .eq('form_id', formId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as FormSubmissionWithPerson[]
}

export async function getFormSubmissionCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('form_submissions').select('form_id')
  if (error) throw error
  const counts: Record<string, number> = {}
  for (const row of data ?? []) counts[row.form_id] = (counts[row.form_id] ?? 0) + 1
  return counts
}

export async function submitForm(formId: string, answers: Record<string, unknown>): Promise<FormSubmission> {
  const form = await getFormById(formId)
  if (!form) throw new Error('Form not found.')
  if (!form.is_public) throw new Error('This form is not accepting submissions.')

  for (const field of form.fields) {
    if (field.required) {
      const value = answers[field.id]
      const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
      if (empty) throw new Error(`"${field.label}" is required.`)
    }
  }

  const personPatch: Record<string, unknown> = {}
  for (const field of form.fields) {
    if (field.maps_to_field && answers[field.id] !== undefined && answers[field.id] !== null && answers[field.id] !== '') {
      personPatch[field.maps_to_field] = answers[field.id]
    }
  }

  let personId: string | null = null

  if (form.submit_action === 'create_person' || form.submit_action === 'add_to_tag') {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('people')
      .insert({
        ...personPatch,
        id: crypto.randomUUID(),
        access_permission: 'member_area',
        custom_fields: null,
        deleted_at: null,
        elvanto_id: null,
        auth_user_id: null,
        mobile: typeof personPatch.mobile === 'string' ? personPatch.mobile : null,
        picture_url: null,
        _synced_at: now,
        _source_modified: now,
      })
      .select('id')
      .single()
    if (error) throw error
    personId = data.id
  } else if (form.submit_action === 'update_person') {
    const email = personPatch.email as string | undefined
    if (email) {
      const { data, error } = await supabase.from('people').select('id').eq('email', email).maybeSingle()
      if (error) throw error
      if (data) {
        const { error: updateError } = await supabase.from('people').update(personPatch as Partial<Person>).eq('id', data.id)
        if (updateError) throw updateError
        personId = data.id
      }
    }
  }

  if (form.submit_action === 'add_to_tag' && personId) {
    const tagId = (form.submit_target as { tag_id?: string } | null)?.tag_id
    if (tagId) {
      const { error } = await supabase
        .from('people_tags')
        .upsert({ person_id: personId, tag_id: tagId }, { onConflict: 'person_id,tag_id' })
      if (error) throw error
    }
  }

  const { data, error } = await supabase
    .from('form_submissions')
    .insert({ id: crypto.randomUUID(), form_id: formId, person_id: personId, answers: answers as Json })
    .select('*')
    .single()
  if (error) throw error
  return data
}