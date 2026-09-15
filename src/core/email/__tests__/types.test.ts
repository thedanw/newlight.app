import { describe, expect, expectTypeOf, it } from 'vitest'
import type {
  EmailAudienceType,
  EmailConsentCategory,
  EmailEditorJson,
  EmailRecipient,
  EmailRecipientRow,
  EmailRecipientStatus,
  EmailSend,
  EmailSendStatus,
  EmailSenderAlias,
  EmailTemplate,
  EmailTemplateStatus,
  EmailTransport,
  EmailUnsubscribe,
  SendEmailInput,
  SendEmailResult,
} from '../lib/types'

describe('core email types', () => {
  it('preserves the existing send contract', () => {
    expectTypeOf<EmailRecipient>().toMatchTypeOf<{
      email: string
      name?: string | null
    }>()
    expectTypeOf<{
      email: string
      name?: string | null
    }>().toMatchTypeOf<EmailRecipient>()
    expectTypeOf<SendEmailInput>().toMatchTypeOf<{
      to: EmailRecipient[]
      subject: string
      body: string
      from?: string
    }>()
    expectTypeOf<{
      to: EmailRecipient[]
      subject: string
      body: string
      from?: string
    }>().toMatchTypeOf<SendEmailInput>()
    expectTypeOf<SendEmailResult>().toMatchTypeOf<{
      messageId: string | null
      acceptedCount: number
    }>()
    expectTypeOf<{
      messageId: string | null
      acceptedCount: number
    }>().toMatchTypeOf<SendEmailResult>()
  })

  it('defines bounded email states', () => {
    expectTypeOf<EmailTemplateStatus>().toMatchTypeOf<'draft' | 'published' | 'archived'>()
    expectTypeOf<'draft' | 'published' | 'archived'>().toMatchTypeOf<EmailTemplateStatus>()
    expectTypeOf<EmailSendStatus>().toMatchTypeOf<
      'queued' | 'sending' | 'sent' | 'failed' | 'partial' | 'suppressed'
    >()
    expectTypeOf<
      'queued' | 'sending' | 'sent' | 'failed' | 'partial' | 'suppressed'
    >().toMatchTypeOf<EmailSendStatus>()
    expectTypeOf<EmailRecipientStatus>().toMatchTypeOf<
      'queued' | 'sent' | 'failed' | 'suppressed' | 'skipped'
    >()
    expectTypeOf<
      'queued' | 'sent' | 'failed' | 'suppressed' | 'skipped'
    >().toMatchTypeOf<EmailRecipientStatus>()
    expectTypeOf<EmailTransport>().toMatchTypeOf<'smtp' | 'resend' | 'noop'>()
    expectTypeOf<'smtp' | 'resend' | 'noop'>().toMatchTypeOf<EmailTransport>()
    expectTypeOf<EmailConsentCategory>().toMatchTypeOf<'broadcasts' | 'team_updates'>()
    expectTypeOf<'broadcasts' | 'team_updates'>().toMatchTypeOf<EmailConsentCategory>()
    expectTypeOf<EmailAudienceType>().toMatchTypeOf<'saved_list' | 'explicit' | 'preset'>()
    expectTypeOf<'saved_list' | 'explicit' | 'preset'>().toMatchTypeOf<EmailAudienceType>()
  })

  it('accepts a complete template', () => {
    const template = {
      id: 'template-1',
      name: 'Welcome',
      subject: 'Welcome',
      html_content: '<p>Welcome</p>',
      editor_json: { cells: [] },
      status: 'draft',
      from_email: 'team@example.org',
      from_name: 'New Light',
      created_by: null,
      created_at: '2026-09-13T00:00:00.000Z',
      updated_at: '2026-09-13T00:00:00.000Z',
    } satisfies EmailTemplate

    expect(template).toBeDefined()
    expectTypeOf<EmailEditorJson>().toMatchTypeOf<EmailTemplate['editor_json']>()
    expectTypeOf<EmailTemplate['editor_json']>().toMatchTypeOf<EmailEditorJson>()
  })

  it('accepts a complete send and recipient outcome', () => {
    const send = {
      id: 'send-1',
      template_id: 'template-1',
      subject: 'Welcome',
      body: '<p>Welcome</p>',
      from_email: 'team@example.org',
      from_name: 'New Light',
      consent_category: 'broadcasts',
      audience_type: 'saved_list',
      audience_ref: 'list-1',
      recipient_count: 1,
      accepted_count: 1,
      status: 'sent',
      provider: 'smtp',
      provider_message_id: 'message-1',
      error_message: null,
      sent_at: '2026-09-13T00:00:00.000Z',
      created_by: 'user-1',
      created_at: '2026-09-13T00:00:00.000Z',
      updated_at: '2026-09-13T00:00:00.000Z',
    } satisfies EmailSend

    const recipient = {
      id: 'recipient-1',
      send_id: send.id,
      person_id: 'person-1',
      email: 'person@example.org',
      name: 'Example Person',
      status: 'sent',
      provider_message_id: 'message-1',
      error_message: null,
      sent_at: '2026-09-13T00:00:00.000Z',
      created_at: '2026-09-13T00:00:00.000Z',
    } satisfies EmailRecipientRow

    expect(send).toBeDefined()
    expect(recipient).toBeDefined()
    expectTypeOf<EmailSend['status']>().toMatchTypeOf<EmailSendStatus>()
    expectTypeOf<EmailSendStatus>().toMatchTypeOf<EmailSend['status']>()
    expectTypeOf<EmailRecipientRow['status']>().toMatchTypeOf<EmailRecipientStatus>()
    expectTypeOf<EmailRecipientStatus>().toMatchTypeOf<EmailRecipientRow['status']>()
  })

  it('keeps unsubscribe data opaque', () => {
    const unsubscribe = {
      id: 'unsubscribe-1',
      email_hash: 'hash-1',
      token_hash: 'token-hash-1',
      send_id: null,
      reason: null,
      unsubscribed_at: '2026-09-13T00:00:00.000Z',
    } satisfies EmailUnsubscribe

    const alias = {
      id: 'alias-1',
      email: 'sender@example.org',
      name: 'New Light Team',
      is_default: true,
      created_by: 'user-1',
      created_at: '2026-09-13T00:00:00.000Z',
    } satisfies EmailSenderAlias

    expect(unsubscribe).toBeDefined()
    expect(alias).toBeDefined()
    expectTypeOf<EmailUnsubscribe['email_hash']>().toMatchTypeOf<string>()
    expectTypeOf<string>().toMatchTypeOf<EmailUnsubscribe['email_hash']>()
    expectTypeOf<EmailSenderAlias['is_default']>().toMatchTypeOf<boolean>()
    expectTypeOf<boolean>().toMatchTypeOf<EmailSenderAlias['is_default']>()
  })
})
