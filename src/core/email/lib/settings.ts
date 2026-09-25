import { supabase } from '@/core/lib/supabase'
import type { EmailSettings } from './types'

const EMAIL_SETTINGS_KEY = 'email-settings'
const APP_SETTINGS_ENV = import.meta.env.VITE_APP_ENV ?? 'production'

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  transport: 'smtp',
  smtp: {
    host: '',
    port: 587,
    username: '',
    password: '',
    secure: true,
  },
  resend: {
    apiKey: '',
    fromEmail: '',
  },
  defaults: {
    fromEmail: '',
    fromName: '',
    replyToEmail: '',
    replyToName: '',
  },
  branding: {
    logoUrl: null,
    primaryColor: '#3b82f6',
    footerText: '',
    includeUnsubscribeFooter: true,
  },
  editor: {
    theme: 'light',
    licenseKey: 'DEV_LICENSE_KEY',
    showBlocksPanel: true,
    showLayersPanel: true,
    showStylesPanel: true,
    defaultTemplate:
      '<mjml><mj-body><mj-section><mj-column><mj-text>Edit your text here...</mj-text></mj-column></mj-section></mj-body></mjml>',
  },
}

export async function getEmailSettings(): Promise<EmailSettings | null> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', EMAIL_SETTINGS_KEY)
    .eq('environment', APP_SETTINGS_ENV)
    .maybeSingle()

  if (error || !data) return null
  return data.value as unknown as EmailSettings
}

export async function saveEmailSettings(settings: EmailSettings): Promise<void> {
  // Credentials must never be persisted to `platform_settings`: that table is
  // readable by super_admins only, but SMTP passwords / Resend API keys are
  // stored in the service-role-only `email_secrets` table via the
  // `email-secrets` edge function (encrypted server-side with AES-256-GCM),
  // never in the browser-readable `platform_settings` value. So we strip them
  // from the settings payload before upserting.
  const { password, username, ...smtpSafe } = settings.smtp
  const { apiKey, ...resendSafe } = settings.resend

  const safeSettings: EmailSettings = {
    ...settings,
    smtp: { ...smtpSafe, username: username ?? '', password: '' },
    resend: { ...resendSafe, apiKey: '' },
  }

  const { error } = await supabase.from('platform_settings').upsert(
    {
      id: crypto.randomUUID(),
      key: EMAIL_SETTINGS_KEY,
      environment: APP_SETTINGS_ENV,
      value: safeSettings,
    },
    { onConflict: 'key,environment' },
  )
  if (error) throw error
}

type EmailSecretName = 'smtp_pass' | 'resend_api_key'

export async function saveEmailSecret(name: EmailSecretName, value: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('email-secrets', {
    body: { action: 'upsert', name, value },
    headers: { 'Content-Type': 'application/json' },
  })
  if (error) throw error
  if (!data?.success) throw new Error(data?.error ?? 'Failed to save email secret')
}

export async function hasEmailSecret(name: EmailSecretName): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('email-secrets', {
    body: { action: 'has', name },
    headers: { 'Content-Type': 'application/json' },
  })
  if (error) throw error
  return Boolean(data?.hasSecret)
}

