/**
 * Core email service contract.
 *
 * The People module (and other modules) send email through this single,
 * app-wide service. The concrete provider (SMTP via Edge Function, Resend,
 * noop, etc.) is wired in `src/core/email/lib/client.ts` and selected via the
 * `VITE_EMAIL_TRANSPORT` environment variable. Modules only depend on this
 * typed surface.
 *
 * Delegates `sendEmail` to the new core email client. Re-exports types from
 * `src/core/email/lib/types` so existing imports remain unchanged.
 */

export type { EmailRecipient, SendEmailInput, SendEmailResult } from '@/core/email/lib/types'

import { sendEmail as coreSendEmail } from '@/core/email/lib/client'

/**
 * Send an email through the core platform email service.
 *
 * Delegates to the provider selected by `VITE_EMAIL_TRANSPORT` (default: `noop`).
 * @throws Error if the provider throws or the Edge Function returns an error.
 */
export const sendEmail = coreSendEmail
