import { sendEmail, type EmailRecipient, type SendEmailInput, type SendEmailResult } from '@/core/lib/email'
import { supabase } from '@/core/lib/supabase'
import { getPeopleList, getSavedListById } from './queries'
import type { Person } from './types'

/**
 * Resolve a saved list to a set of email recipients.
 *
 * Applies the list's stored filter conditions to the People directory and
 * returns the distinct email addresses of matching people. People without an
 * email address are skipped.
 */
export async function getEmailRecipients(listId: string): Promise<EmailRecipient[]> {
  const list = await getSavedListById(listId)
  if (!list) throw new Error('Saved list not found.')

  const conditions = list.conditions as {
    demographic?: Person['demographic']
    accessPermission?: Person['access_permission']
    journeyTrackId?: string
    journeyStage?: string
    tagId?: string
  }

  const people = await getPeopleList({
    demographic: conditions.demographic,
    accessPermission: conditions.accessPermission,
    journeyTrackId: conditions.journeyTrackId,
    journeyStage: conditions.journeyStage,
    tagId: conditions.tagId,
    limit: 10000,
    offset: 0,
  })

  const recipients = new Map<string, EmailRecipient>()
  for (const person of people) {
    const email = person.email?.trim()
    if (!email) continue
    const name = person.preferred_name
      ? `${person.preferred_name} ${person.lastname}`
      : `${person.firstname} ${person.lastname}`
    recipients.set(email.toLowerCase(), { email, name })
  }
  return [...recipients.values()]
}

/**
 * Send an email to a set of people and record an audit entry for each
 * recipient so the send is traceable.
 */
export async function sendPeopleEmail(
  recipients: EmailRecipient[],
  subject: string,
  body: string,
): Promise<SendEmailResult> {
  const trimmedSubject = subject.trim()
  if (!trimmedSubject) throw new Error('Email subject is required.')
  if (!body.trim()) throw new Error('Email body is required.')
  if (recipients.length === 0) throw new Error('No recipients with an email address were found.')

  const input: SendEmailInput = { to: recipients, subject: trimmedSubject, body }
  const result = await sendEmail(input)

  await logEmailActivity(recipients, trimmedSubject, result.acceptedCount)
  return result
}

/**
 * Record a sent email in `people_audit` for each recipient person so the
 * send is traceable from the person profile.
 */
async function logEmailActivity(recipients: EmailRecipient[], subject: string, acceptedCount: number): Promise<void> {
  const emails = recipients.map((recipient) => recipient.email.toLowerCase())
  if (emails.length === 0) return

  const { data: people, error } = await supabase
    .from('people')
    .select('id, email')
    .in('email', emails)
    .is('deleted_at', null)
  if (error) throw error

  const writes = (people ?? []).map((person) =>
    supabase.from('people_audit').insert({
      id: crypto.randomUUID(),
      person_id: person.id,
      field_changed: 'email_sent',
      old_value: null,
      new_value: {
        subject,
        recipient_count: acceptedCount,
        sent_at: new Date().toISOString(),
      },
      change_reason: 'manual',
      changed_by: null,
      changed_at: new Date().toISOString(),
    }),
  )
  await Promise.all(writes)
}

/**
 * Chat integration hook — placeholder for the future core chat module.
 *
 * Returns whether a person is eligible for in-app chat (has an email or
 * mobile and is not a child). Wire this to the core chat module when it
 * becomes available.
 */
export function canChat(person: Pick<Person, 'email' | 'mobile' | 'demographic'>): boolean {
  if (person.demographic === 'child') return false
  return Boolean(person.email?.trim() || person.mobile?.trim())
}
