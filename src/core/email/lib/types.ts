import type { Json } from '@/core/lib/database.types'

export type EmailRecipient = {
  email: string
  name?: string | null
  person_id?: string | null
}

export type SendEmailInput = {
  to: EmailRecipient[]
  subject: string
  body: string
  from?: string
  consentCategory?: EmailConsentCategory
}

export type TrackedSendRecipient = {
  email: string
  name?: string | null
  person_id?: string | null
  consent_category: EmailConsentCategory
}

export type TrackedSendEmailInput = {
  sendId: string
  recipients: TrackedSendRecipient[]
  subject: string
  body: string
  from: string
  consentCategory: EmailConsentCategory
}

export type SendEmailResult = {
  messageId: string | null
  acceptedCount: number
  sendId?: string
}

export type EmailTemplateStatus = 'draft' | 'published' | 'archived'
export type EmailSendStatus = 'queued' | 'sending' | 'sent' | 'failed' | 'partial' | 'suppressed'
export type EmailRecipientStatus = 'queued' | 'sent' | 'failed' | 'suppressed' | 'skipped'
export type EmailTransport = 'smtp' | 'resend' | 'noop'
export type EmailConsentCategory = 'broadcasts' | 'team_updates'
export type EmailAudienceType = 'saved_list' | 'explicit' | 'preset'

// Studio SDK Project Data Types
export interface StudioComponent {
  type: string
  tagName?: string
  attributes?: Record<string, string>
  components?: StudioComponent[]
  content?: string
  style?: Record<string, string>
  classes?: string[]
  traits?: Record<string, Json>
}

export interface StudioPage {
  id: string
  name: string
  component: StudioComponent
  styles?: Record<string, string>
}

export interface StudioAsset {
  id: string
  type: string
  src: string
  name?: string
}

export interface StudioSettings {
  [key: string]: Json
}

export interface StudioProject {
  pages: StudioPage[]
  assets: StudioAsset[]
  settings: StudioSettings
  styles?: Record<string, string>
  components?: StudioComponent[]
}

export type EmailEditorJson = StudioProject

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

// Studio SDK Editor Configuration (JSON-compatible for platform_settings)
export type StudioAssetConfig = {
  providers?: string[]
  upload?: boolean
}

export type StudioFontConfig = {
  providers?: string[]
  customFonts?: Array<{ name: string; url: string }>
}

export type StudioComponentConfig = {
  [componentType: string]: {
    model?: Record<string, Json>
    view?: Record<string, Json>
    traits?: Record<string, Json>
  }
}

export type StudioPageConfig = Record<string, Json>

export type EmailEditorTheme = 'light' | 'dark'

export type EmailEditorConfig = {
  licenseKey: string
  project: { type: 'email' }
  assets?: StudioAssetConfig
  fonts?: StudioFontConfig
  components?: StudioComponentConfig
  pages?: StudioPageConfig
  defaultTemplate?: string
  theme?: EmailEditorTheme
}

export type EmailSettings = {
  transport: EmailTransport
  smtp: EmailSmtpConfig
  resend: EmailResendConfig
  defaults: EmailDefaults
  branding: EmailBranding
  editor?: EmailEditorConfig
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
