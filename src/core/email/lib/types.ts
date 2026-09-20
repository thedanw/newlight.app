import type { Json } from '@/core/lib/database.types'

export type EmailRecipient = {
  email: string
  name?: string | null
}

export type SendEmailInput = {
  to: EmailRecipient[]
  subject: string
  body: string
  from?: string
}

export type SendEmailResult = {
  messageId: string | null
  acceptedCount: number
}

export type EmailTemplateStatus = 'draft' | 'published' | 'archived'
export type EmailSendStatus = 'queued' | 'sending' | 'sent' | 'failed' | 'partial' | 'suppressed'
export type EmailRecipientStatus = 'queued' | 'sent' | 'failed' | 'suppressed' | 'skipped'
export type EmailTransport = 'smtp' | 'resend' | 'noop'
export type EmailConsentCategory = 'broadcasts' | 'team_updates'
export type EmailAudienceType = 'saved_list' | 'explicit' | 'preset'
export type EmailEditorJson = Json

export type EmailSmtpConfig = {
  host: string
  port: number
  username: string
  password: string
  secure: boolean
}

export type EmailResendConfig = {
  apiKey: string
  fromEmail: string
}

export type EmailDefaults = {
  fromEmail: string
  fromName: string
  replyToEmail: string
  replyToName: string
}

export type EmailBranding = {
  logoUrl: string | null
  primaryColor: string
  footerText: string
  includeUnsubscribeFooter: boolean
}

export type EmailSettings = {
  transport: EmailTransport
  smtp: EmailSmtpConfig
  resend: EmailResendConfig
  defaults: EmailDefaults
  branding: EmailBranding
}

export type EmailTemplate = {
  id: string
  name: string
  subject: string
  html_content: string
  editor_json: EmailEditorJson
  status: EmailTemplateStatus
  from_email: string
  from_name: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export type EmailSend = {
  id: string
  template_id: string | null
  subject: string
  body: string
  from_email: string
  from_name: string
  consent_category: EmailConsentCategory
  audience_type: EmailAudienceType
  audience_ref: string | null
  recipient_count: number
  accepted_count: number
  status: EmailSendStatus
  provider: EmailTransport | null
  provider_message_id: string | null
  error_message: string | null
  sent_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type EmailRecipientRow = {
  id: string
  send_id: string
  person_id: string | null
  email: string
  name: string | null
  status: EmailRecipientStatus
  provider_message_id: string | null
  error_message: string | null
  sent_at: string | null
  created_at: string
}

export type EmailUnsubscribe = {
  id: string
  email_hash: string
  token_hash: string
  send_id: string | null
  reason: string | null
  unsubscribed_at: string
}

export type EmailSenderAlias = {
  id: string
  email: string
  name: string
  is_default: boolean
  created_by: string | null
  created_at: string
}
