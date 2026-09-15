import { supabase } from '@/core/lib/supabase'
import type { Database } from '@/core/lib/database.types'
import type { EmailConsentCategory, EmailRecipientStatus, EmailSendStatus } from './types'

type EmailRecipientRow = Database['public']['Tables']['email_recipients']['Row']

/**
 * SHA-256 hash of a lowercase email address, matching the Edge Function
 * suppression lookup in `email_unsubscribes.email_hash`.
 *
 * Uses the Web Crypto API available in both browser and Edge Runtime.
 */
export async function hashEmail(email: string): Promise<string> {
  const data = new TextEncoder().encode(email.toLowerCase())
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Check if an email address is suppressed (has an unsubscribe record).
 */
export async function isSuppressed(email: string, supabaseClient = supabase): Promise<boolean> {
  const emailHash = await hashEmail(email)
  const { data, error } = await supabaseClient
    .from('email_unsubscribes')
    .select('email_hash')
    .eq('email_hash', emailHash)
    .maybeSingle()

  if (error) throw error
  return data !== null
}

/**
 * Check if a person has given consent for a specific email category.
 */
export async function hasConsent(
  personId: string,
  consentCategory: EmailConsentCategory,
  supabaseClient = supabase,
): Promise<boolean> {
  const consentColumn = `consent_${consentCategory}`
  const { data, error } = await supabaseClient
    .from('people')
    .select(consentColumn)
    .eq('id', personId)
    .maybeSingle()

  if (error) throw error
  const record = data as Record<string, string | null> | null
  return record?.[consentColumn] === 'yes'
}

/**
 * Compute the overall send status from individual recipient statuses.
 *
 * Rules:
 * - all 'sent' → 'sent'
 * - all 'suppressed'/'skipped' → 'suppressed'
 * - mix of 'sent' + failures → 'partial'
 * - all 'failed' → 'failed'
 * - mix with none sent → 'failed' if some failed, 'partial' otherwise
 */
export function rollupSendStatus(recipientStatuses: EmailRecipientStatus[]): EmailSendStatus {
  if (recipientStatuses.length === 0) return 'suppressed'

  const counts = recipientStatuses.reduce(
    (acc, s) => {
      acc[s] = (acc[s] ?? 0) + 1
      return acc
    },
    {} as Record<EmailRecipientStatus, number>,
  )

  const sent = counts.sent ?? 0
  const failed = counts.failed ?? 0
  const suppressed = (counts.suppressed ?? 0) + (counts.skipped ?? 0)

  if (sent === recipientStatuses.length) return 'sent'
  if (sent > 0 && (failed > 0 || suppressed > 0)) return 'partial'
  if (failed > 0 && sent === 0) return failed === recipientStatuses.length ? 'failed' : 'partial'
  if (suppressed === recipientStatuses.length) return 'suppressed'
  return 'partial'
}

/**
 * Compute the SendEmailResult-style summary from recipient outcomes.
 */
export function computeSendSummary(recipientRows: EmailRecipientRow[]): {
  acceptedCount: number
  status: EmailSendStatus
} {
  const statuses = recipientRows.map((r) => r.status)
  const acceptedCount = statuses.filter((s) => s === 'sent').length
  return {
    acceptedCount,
    status: rollupSendStatus(statuses),
  }
}

/**
 * Check if a send record exists and is not already in a terminal state.
 */
export function isSendInProgress(status: EmailSendStatus): boolean {
  return ['queued', 'sending'].includes(status)
}
