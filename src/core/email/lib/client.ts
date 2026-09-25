import { supabase } from '@/core/lib/supabase'
import { getSupabaseUrl } from '@/core/lib/runtime-config'
import { getEmailSettings } from './settings'
import type {
  EmailConsentCategory,
  EmailTransport,
  SendEmailInput,
  SendEmailResult,
  TrackedSendEmailInput,
} from './types'

export interface EmailProvider {
  send(input: SendEmailInput): Promise<SendEmailResult>
  sendTracked(input: TrackedSendEmailInput): Promise<SendEmailResult>
}

export class NoopProvider implements EmailProvider {
  async send(input: SendEmailInput): Promise<SendEmailResult> {
    return {
      messageId: null,
      acceptedCount: input.to.length,
    }
  }

  async sendTracked(_input: TrackedSendEmailInput): Promise<SendEmailResult> {
    return {
      messageId: null,
      acceptedCount: _input.recipients.length,
    }
  }
}

export class EdgeFunctionProvider implements EmailProvider {
  constructor(_supabaseUrl: string) {}

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const { data, error } = await supabase.functions.invoke('email-send', {
      body: input,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (error) {
      throw new Error(`Email send failed: ${error.message}`)
    }

    return {
      messageId: data?.messageId ?? null,
      acceptedCount: data?.acceptedCount ?? input.to.length,
    }
  }

  async sendTracked(input: TrackedSendEmailInput): Promise<SendEmailResult> {
    const { data, error } = await supabase.functions.invoke('email-send', {
      body: input,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (error) {
      throw new Error(`Email send failed: ${error.message}`)
    }

    return {
      messageId: data?.messageId ?? null,
      acceptedCount: data?.acceptedCount ?? input.recipients.length,
    }
  }
}

export interface EmailProviderConfig {
  transport: EmailTransport
  supabaseUrl?: string
}

let activeConfig: EmailProviderConfig | null = null
let activeProvider: EmailProvider | null = null
let explicitProvider: EmailProvider | null = null

export function createEmailProvider(config: EmailProviderConfig): EmailProvider {
  switch (config.transport) {
    case 'smtp':
      return new EdgeFunctionProvider(getSupabaseUrl())
    case 'resend':
      return new EdgeFunctionProvider(getSupabaseUrl())
    case 'noop':
      return new NoopProvider()
    default:
      throw new Error(`Unsupported email transport: ${config.transport}`)
  }
}

/**
 * Resolve the active email transport.
 *
 * The transport is normally selected in the Email Settings UI and persisted to
 * `platform_settings` (the `email-settings` key). The `VITE_EMAIL_TRANSPORT`
 * environment variable is a legacy fallback only — it is NOT set per-deploy in
 * Cloudflare Pages, so the UI choice is authoritative. If no settings row exists
 * the transport defaults to `noop` (safe for local dev).
 */
export async function getConfig(): Promise<EmailProviderConfig> {
  const settings = await getEmailSettings()
  const transport: EmailTransport =
    settings?.transport ?? (import.meta.env.VITE_EMAIL_TRANSPORT as EmailTransport | undefined) ?? 'noop'
  return {
    transport,
    supabaseUrl: getSupabaseUrl() || undefined,
  }
}

export async function getProvider(): Promise<EmailProvider> {
  if (explicitProvider) return explicitProvider
  if (!activeProvider) {
    activeConfig = await getConfig()
    activeProvider = createEmailProvider(activeConfig)
  }
  return activeProvider
}

export function setProvider(provider: EmailProvider): void {
  explicitProvider = provider
  activeProvider = provider
  activeConfig = null
}

export function resetProviderCache(): void {
  explicitProvider = null
  activeProvider = null
  activeConfig = null
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const provider = await getProvider()
  return provider.send(input)
}

/**
 * Create a tracked send record, then deliver it through the configured
 * provider (Edge Function for SMTP, in-memory for noop).
 *
 * The `sendId` is generated client-side and written as a `queued` row so the
 * Edge Function can transition it `sending -> sent|failed|partial` and so the
 * UI can display delivery progress.
 */
export async function sendEmailWithTracking(
  input: SendEmailInput & { consentCategory?: EmailConsentCategory },
): Promise<SendEmailResult & { sendId: string }> {
  const consentCategory = input.consentCategory ?? 'broadcasts'
  const sendId = crypto.randomUUID()

  const { data: userResult, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  const createdBy = userResult.user?.id ?? null

  const { error: insertError } = await supabase.from('email_sends').insert({
    id: sendId,
    template_id: null,
    subject: input.subject,
    body: input.body,
    from_email: input.from ?? '',
    from_name: null,
    consent_category: consentCategory,
    audience_type: 'explicit',
    audience_ref: null,
    recipient_count: input.to.length,
    accepted_count: 0,
    status: 'queued',
    provider: null,
    created_by: createdBy,
  })
  if (insertError) throw insertError

  const config = await getConfig()
  let acceptedCount: number
  let messageId: string | null = null

  if (config.transport === 'noop') {
    await supabase
      .from('email_sends')
      .update({
        status: 'sent',
        accepted_count: input.to.length,
        provider: 'noop',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sendId)
    acceptedCount = input.to.length
    messageId = null
  } else {
    const provider = await getProvider()
    const result = await provider.sendTracked({
      sendId,
      recipients: input.to.map((r) => ({
        email: r.email,
        name: r.name ?? null,
        person_id: r.person_id ?? null,
        consent_category: consentCategory,
      })),
      subject: input.subject,
      body: input.body,
      from: input.from ?? '',
      consentCategory,
    })
    acceptedCount = result.acceptedCount
    messageId = result.messageId ?? null
  }

  return {
    messageId,
    acceptedCount,
    sendId,
  }
}
