/**
 * Core email service contract.
 *
 * The People module (and other modules) send email through this single,
 * app-wide service. The concrete provider (Resend, Supabase edge function,
 * SMTP, etc.) is wired here once; modules only depend on this typed surface.
 *
 * NOTE: The provider is not yet implemented. `sendEmail` throws a clear
 * "not implemented" error until the real provider is wired in. The People
 * module is fully built against this contract and will work unchanged once
 * the provider lands.
 */

export type EmailRecipient = {
  email: string
  name?: string | null
}

export type SendEmailInput = {
  to: EmailRecipient[]
  subject: string
  /** Plain-text body. Rich-text/markdown rendering is a provider concern. */
  body: string
  /** Optional sender override; falls back to the platform default sender. */
  from?: string
}

export type SendEmailResult = {
  /** Provider message id, if available. */
  messageId: string | null
  /** Number of recipients the provider accepted. */
  acceptedCount: number
}

/**
 * Send an email through the core platform email service.
 *
 * @throws Error if the email provider is not yet configured.
 */
export async function sendEmail(_input: SendEmailInput): Promise<SendEmailResult> {
  throw new Error(
    'The core email service is not yet configured. Wire a provider into src/core/lib/email.ts to enable sending.',
  )
}
