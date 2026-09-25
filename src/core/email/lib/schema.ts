import { z } from 'zod'

/**
 * Core email shared schemas.
 *
 * These schemas validate data entering and leaving the email core utility.
 * They are used on both the client (form validation) and within the Edge
 * Function (request/response validation) and stay in sync with the hand-
 * maintained types in `types.ts` and `src/core/lib/database.types.ts`.
 */

const isoDatetimeSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/)

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const emailTemplateStatusSchema = z.enum(['draft', 'published', 'archived'])
export const emailSendStatusSchema = z.enum([
  'queued',
  'sending',
  'sent',
  'failed',
  'partial',
  'suppressed',
])
export const emailRecipientStatusSchema = z.enum([
  'queued',
  'sent',
  'failed',
  'suppressed',
  'skipped',
])
export const emailTransportSchema = z.enum(['smtp', 'resend', 'noop'])
export const emailConsentCategorySchema = z.enum(['broadcasts', 'team_updates'])
export const emailAudienceTypeSchema = z.enum(['saved_list', 'explicit', 'preset'])
export const yesNoSchema = z.enum(['yes', 'no'])

// ---------------------------------------------------------------------------
// Compatibility — mirrors the existing src/core/lib/email.ts contract
// ---------------------------------------------------------------------------

export const emailRecipientSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable().optional(),
  person_id: z.string().uuid().nullable().optional(),
})

export const sendEmailInputSchema = z.object({
  to: z.array(emailRecipientSchema).min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  from: z.string().email().optional(),
  consentCategory: emailConsentCategorySchema.optional(),
})

export const sendEmailResultSchema = z.object({
  messageId: z.string().nullable(),
  acceptedCount: z.number().int().nonnegative(),
  sendId: z.string().uuid().optional(),
})

export const trackedSendRecipientSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable().optional(),
  person_id: z.string().uuid().nullable().optional(),
  consent_category: emailConsentCategorySchema,
})

export const emailSendRequestSchema = z.object({
  sendId: z.string().uuid(),
  recipients: z.array(trackedSendRecipientSchema).min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  from: z.string().email(),
  consentCategory: emailConsentCategorySchema,
})

// ---------------------------------------------------------------------------
// Core tables
// ---------------------------------------------------------------------------

export const emailTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  subject: z.string().min(1),
  html_content: z.string(),
  editor_json: z.record(z.string(), z.unknown()).nullable(),
  status: emailTemplateStatusSchema,
  from_email: z.string().email(),
  from_name: z.string().min(1),
  created_by: z.string().uuid().nullable(),
  created_at: isoDatetimeSchema,
  updated_at: isoDatetimeSchema,
})

export const emailSendSchema = z.object({
  id: z.string().uuid(),
  template_id: z.string().uuid().nullable(),
  subject: z.string(),
  body: z.string(),
  from_email: z.string().email(),
  from_name: z.string().min(1),
  consent_category: emailConsentCategorySchema,
  audience_type: emailAudienceTypeSchema,
  audience_ref: z.string().nullable(),
  recipient_count: z.number().int().nonnegative(),
  accepted_count: z.number().int().nonnegative(),
  status: emailSendStatusSchema,
  provider: emailTransportSchema.nullable(),
  provider_message_id: z.string().nullable(),
  error_message: z.string().nullable(),
  sent_at: isoDatetimeSchema.nullable(),
  created_by: z.string().uuid().nullable(),
  created_at: isoDatetimeSchema,
  updated_at: isoDatetimeSchema,
})

export const emailRecipientRowSchema = z.object({
  id: z.string().uuid(),
  send_id: z.string().uuid(),
  person_id: z.string().uuid().nullable(),
  email: z.string().email(),
  name: z.string().nullable(),
  status: emailRecipientStatusSchema,
  provider_message_id: z.string().nullable(),
  error_message: z.string().nullable(),
  sent_at: isoDatetimeSchema.nullable(),
  created_at: isoDatetimeSchema,
})

export const emailUnsubscribeSchema = z.object({
  id: z.string().uuid(),
  email_hash: z.string().min(1),
  token_hash: z.string().min(1),
  send_id: z.string().uuid().nullable(),
  reason: z.string().nullable(),
  unsubscribed_at: isoDatetimeSchema,
})

export const emailSenderAliasSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  is_default: z.boolean(),
  created_by: z.string().uuid().nullable(),
  created_at: isoDatetimeSchema,
})

// ---------------------------------------------------------------------------
// Insert / Update input schemas (partial on PK + timestamps)
// ---------------------------------------------------------------------------

export const emailTemplateInsertSchema = emailTemplateSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const emailTemplateUpdateSchema = emailTemplateInsertSchema.partial()

export const emailSendInsertSchema = emailSendSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const emailSenderAliasInsertSchema = emailSenderAliasSchema.omit({
  id: true,
  created_at: true,
})

// ---------------------------------------------------------------------------
// Audience resolution input
// ---------------------------------------------------------------------------

export const emailAudienceSpecSchema = z.object({
  type: emailAudienceTypeSchema,
  ref: z.string().nullable().optional(),
  peopleIds: z.array(z.string().uuid()).optional(),
})

// ---------------------------------------------------------------------------
// Email editor settings
// ---------------------------------------------------------------------------

export const emailEditorThemeSchema = z.enum(['light', 'dark', 'auto'])

export const emailEditorConfigSchema = z.object({
  theme: emailEditorThemeSchema,
  licenseKey: z.string(),
  showBlocksPanel: z.boolean(),
  showLayersPanel: z.boolean(),
  showStylesPanel: z.boolean(),
  defaultTemplate: z.string(),
})

export const emailSettingsSchema = z.object({
  transport: emailTransportSchema,
  smtp: z.object({
    host: z.string(),
    port: z.number().int(),
    username: z.string(),
    password: z.string(),
    secure: z.boolean(),
  }),
  resend: z.object({
    apiKey: z.string(),
    fromEmail: z.string().email(),
  }),
  defaults: z.object({
    fromEmail: z.string().email(),
    fromName: z.string(),
    replyToEmail: z.string().email(),
    replyToName: z.string(),
  }),
  branding: z.object({
    logoUrl: z.string().nullable(),
    primaryColor: z.string(),
    footerText: z.string(),
    includeUnsubscribeFooter: z.boolean(),
  }),
  editor: emailEditorConfigSchema,
})
