import { supabase } from '@/core/lib/supabase'
import type { Database } from '@/core/lib/database.types'
import type { EmailSend, EmailTemplate } from './types'

type TemplateRow = Database['public']['Tables']['email_templates']['Row']
type AliasRow = Database['public']['Tables']['email_sender_aliases']['Row']

export async function getTemplates(): Promise<EmailTemplate[]> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as EmailTemplate[]
}

export async function getTemplate(id: string): Promise<EmailTemplate | null> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as EmailTemplate | null
}

export async function createTemplate(
  input: Omit<TemplateRow, 'id' | 'created_at' | 'updated_at'>,
): Promise<EmailTemplate> {
  const { data, error } = await supabase
    .from('email_templates')
    .insert({
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...input,
    })
    .select()
    .single()

  if (error) throw error
  return data as unknown as EmailTemplate
}

export async function updateTemplate(
  id: string,
  patch: Partial<Omit<TemplateRow, 'id' | 'created_at' | 'updated_at'>>,
): Promise<EmailTemplate> {
  const { data, error } = await supabase
    .from('email_templates')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as unknown as EmailTemplate
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('email_templates').delete().eq('id', id)
  if (error) throw error
}

export async function getSends(): Promise<EmailSend[]> {
  const { data, error } = await supabase
    .from('email_sends')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as EmailSend[]
}

export async function getSendRecipients(sendId: string) {
  const { data, error } = await supabase
    .from('email_recipients')
    .select('*')
    .eq('send_id', sendId)

  if (error) throw error
  return data ?? []
}

export async function getSenderAliases() {
  const { data, error } = await supabase
    .from('email_sender_aliases')
    .select('*')
    .order('is_default', { ascending: false })

  if (error) throw error
  return (data ?? []) as AliasRow[]
}

export async function createSenderAlias(
  input: Omit<AliasRow, 'id' | 'created_at'>,
): Promise<AliasRow> {
  const { data, error } = await supabase
    .from('email_sender_aliases')
    .insert({
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...input,
    })
    .select()
    .single()

  if (error) throw error
  return data as AliasRow
}
