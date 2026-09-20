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
  const { error } = await supabase.from('platform_settings').upsert(
    {
      id: crypto.randomUUID(),
      key: EMAIL_SETTINGS_KEY,
      environment: APP_SETTINGS_ENV,
      value: settings,
    },
    { onConflict: 'key,environment' },
  )
  if (error) throw error
}
