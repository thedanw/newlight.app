import { supabase } from '@/core/lib/supabase'
import type { EmailTransport, SendEmailInput, SendEmailResult } from './types'

export interface EmailProvider {
  send(input: SendEmailInput): Promise<SendEmailResult>
}

export class NoopProvider implements EmailProvider {
  async send(input: SendEmailInput): Promise<SendEmailResult> {
    return {
      messageId: null,
      acceptedCount: input.to.length,
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
}

export interface EmailProviderConfig {
  transport: EmailTransport
  supabaseUrl?: string
}

let activeProvider: EmailProvider | null = null

export function createEmailProvider(config: EmailProviderConfig): EmailProvider {
  switch (config.transport) {
    case 'smtp':
      return new EdgeFunctionProvider(config.supabaseUrl ?? import.meta.env.VITE_SUPABASE_URL ?? '')
    case 'noop':
      return new NoopProvider()
    default:
      throw new Error(`Unsupported email transport: ${config.transport}`)
  }
}

export function getConfig(): EmailProviderConfig {
  return {
    transport: (import.meta.env.VITE_EMAIL_TRANSPORT as EmailTransport) ?? 'noop',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  }
}

export function getProvider(): EmailProvider {
  if (!activeProvider) {
    const config = getConfig()
    activeProvider = createEmailProvider(config)
  }
  return activeProvider
}

export function setProvider(provider: EmailProvider): void {
  activeProvider = provider
}

export function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  return getProvider().send(input)
}
