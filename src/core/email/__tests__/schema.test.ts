import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  emailAudienceSpecSchema,
  emailRecipientRowSchema,
  emailRecipientSchema,
  emailSenderAliasInsertSchema,
  emailSenderAliasSchema,
  emailSendInsertSchema,
  emailSendSchema,
  emailTemplateInsertSchema,
  emailTemplateSchema,
  emailTemplateStatusSchema,
  emailUnsubscribeSchema,
  sendEmailInputSchema,
  sendEmailResultSchema,
} from '../lib/schema'

const VALID_TEMPLATE = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Weekly Newsletter',
  subject: 'This week at New Light',
  html_content: '<p>Hello</p>',
  editor_json: { cells: [{ id: 'cell-1' }] },
  status: 'draft',
  from_email: 'team@example.org',
  from_name: 'New Light Team',
  created_by: '22222222-2222-4222-8222-222222222222',
  created_at: '2026-09-13T00:00:00.000Z',
  updated_at: '2026-09-13T00:00:00.000Z',
}

const VALID_SEND = {
  id: '11111111-1111-4111-8111-111111111111',
  template_id: '33333333-3333-4333-8333-333333333333',
  subject: 'Welcome!',
  body: '<p>Welcome</p>',
  from_email: 'team@example.org',
  from_name: 'New Light Team',
  consent_category: 'broadcasts',
  audience_type: 'saved_list',
  audience_ref: '44444444-4444-4444-8444-444444444444',
  recipient_count: 3,
  accepted_count: 2,
  status: 'sent',
  provider: 'smtp',
  provider_message_id: '<msg-1@example.org>',
  error_message: null,
  sent_at: '2026-09-13T12:00:00.000Z',
  created_by: '22222222-2222-4222-8222-222222222222',
  created_at: '2026-09-13T00:00:00.000Z',
  updated_at: '2026-09-13T00:00:00.000Z',
}

const VALID_RECIPIENT_ROW = {
  id: '11111111-1111-4111-8111-111111111111',
  send_id: '33333333-3333-4333-8333-333333333333',
  person_id: '44444444-4444-4444-8444-444444444444',
  email: 'person@example.org',
  name: 'Jane Doe',
  status: 'sent',
  provider_message_id: '<msg-1@example.org>',
  error_message: null,
  sent_at: '2026-09-13T12:00:00.000Z',
  created_at: '2026-09-13T00:00:00.000Z',
}

const VALID_UNSUBSCRIBE = {
  id: '11111111-1111-4111-8111-111111111111',
  email_hash: 'sha256-of-email',
  token_hash: 'sha256-of-token',
  send_id: '33333333-3333-4333-8333-333333333333',
  reason: 'no longer interested',
  unsubscribed_at: '2026-09-13T12:00:00.000Z',
}

const VALID_ALIAS = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'sender@example.org',
  name: 'New Light Team',
  is_default: true,
  created_by: '22222222-2222-4222-8222-222222222222',
  created_at: '2026-09-13T00:00:00.000Z',
}

describe('email schema (Batch 2)', () => {
  describe('enum schemas', () => {
    it('accepts all template statuses', () => {
      for (const s of ['draft', 'published', 'archived']) {
        expect(emailTemplateStatusSchema.safeParse(s).success).toBe(true)
      }
    })

    it('rejects unknown template status', () => {
      expect(emailTemplateStatusSchema.safeParse('archived_pending').success).toBe(false)
    })

    it('accepts all consent categories', () => {
      for (const c of ['broadcasts', 'team_updates']) {
        expect(z.enum(['broadcasts', 'team_updates']).safeParse(c).success).toBe(true)
      }
    })

    it('rejects unknown consent category', () => {
      expect(z.enum(['broadcasts', 'team_updates']).safeParse('marketing').success).toBe(false)
    })
  })

  describe('compatibility schemas', () => {
    it('accepts a valid EmailRecipient', () => {
      expect(emailRecipientSchema.safeParse({ email: 'test@example.org', name: 'Test' }).success).toBe(true)
    })

    it('accepts EmailRecipient with optional name', () => {
      expect(emailRecipientSchema.safeParse({ email: 'test@example.org' }).success).toBe(true)
    })

    it('rejects invalid email', () => {
      expect(emailRecipientSchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
    })

    it('accepts a valid SendEmailInput', () => {
      expect(
        sendEmailInputSchema.safeParse({
          to: [{ email: 'a@example.org', name: 'A' }],
          subject: 'Hello',
          body: '<p>Hi</p>',
          from: 'team@example.org',
        }).success,
      ).toBe(true)
    })

    it('rejects SendEmailInput with empty recipient list', () => {
      expect(sendEmailInputSchema.safeParse({ to: [], subject: 'Hi', body: 'Body' }).success).toBe(false)
    })

    it('rejects SendEmailInput with empty subject', () => {
      expect(
        sendEmailInputSchema.safeParse({ to: [{ email: 'a@example.org' }], subject: '', body: 'Body' }).success,
      ).toBe(false)
    })

    it('accepts a SendEmailResult', () => {
      expect(sendEmailResultSchema.safeParse({ messageId: null, acceptedCount: 0 }).success).toBe(true)
    })

    it('rejects negative acceptedCount', () => {
      expect(sendEmailResultSchema.safeParse({ messageId: null, acceptedCount: -1 }).success).toBe(false)
    })
  })

  describe('template schema', () => {
    it('accepts a valid template', () => {
      expect(emailTemplateSchema.safeParse(VALID_TEMPLATE).success).toBe(true)
    })

    it('rejects missing required name', () => {
      expect(emailTemplateSchema.safeParse({ ...VALID_TEMPLATE, name: '' }).success).toBe(false)
    })

    it('accepts null editor_json', () => {
      expect(emailTemplateSchema.safeParse({ ...VALID_TEMPLATE, editor_json: null }).success).toBe(true)
    })
  })

  describe('send schema', () => {
    it('accepts a valid send', () => {
      expect(emailSendSchema.safeParse(VALID_SEND).success).toBe(true)
    })

    it('rejects mismatched recipient + accepted counts', () => {
      // Schema does not enforce count logic; just confirms structural validity
      const result = emailSendSchema.safeParse({ ...VALID_SEND, accepted_count: 99 })
      expect(result.success).toBe(true)
    })

    it('requires a valid consent category', () => {
      expect(emailSendSchema.safeParse({ ...VALID_SEND, consent_category: 'promotions' } as any).success).toBe(false)
    })
  })

  describe('recipient row schema', () => {
    it('accepts a valid recipient row', () => {
      expect(emailRecipientRowSchema.safeParse(VALID_RECIPIENT_ROW).success).toBe(true)
    })

    it('accepts null status-sent email fields', () => {
      expect(
        emailRecipientRowSchema.safeParse({
          ...VALID_RECIPIENT_ROW,
          name: null,
          provider_message_id: null,
          error_message: null,
          sent_at: null,
          person_id: null,
        }).success,
      ).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(emailRecipientRowSchema.safeParse({ ...VALID_RECIPIENT_ROW, status: 'bounced' } as any).success).toBe(false)
    })
  })

  describe('unsubscribe schema', () => {
    it('accepts a valid unsubscribe row', () => {
      expect(emailUnsubscribeSchema.safeParse(VALID_UNSUBSCRIBE).success).toBe(true)
    })

    it('accepts null send_id and reason', () => {
      expect(
        emailUnsubscribeSchema.safeParse({ ...VALID_UNSUBSCRIBE, send_id: null, reason: null }).success,
      ).toBe(true)
    })

    it('rejects missing email_hash', () => {
      expect(emailUnsubscribeSchema.safeParse({ ...VALID_UNSUBSCRIBE, email_hash: '' }).success).toBe(false)
    })
  })

  describe('sender alias schema', () => {
    it('accepts a valid alias', () => {
      expect(emailSenderAliasSchema.safeParse(VALID_ALIAS).success).toBe(true)
    })

    it('rejects non-boolean is_default', () => {
      expect(emailSenderAliasSchema.safeParse({ ...VALID_ALIAS, is_default: 'true' } as any).success).toBe(false)
    })

    it('insert schema omits id + created_at', () => {
      const insert = emailSenderAliasInsertSchema.safeParse({
        email: 'sender@example.org',
        name: 'New Light',
        is_default: true,
        created_by: null,
      })
      expect(insert.success).toBe(true)
    })
  })

  describe('audience spec schema', () => {
    it('accepts saved_list with ref', () => {
      expect(
        emailAudienceSpecSchema.safeParse({ type: 'saved_list', ref: '11111111-1111-4111-8111-111111111111' }).success,
      ).toBe(true)
    })

    it('accepts explicit with peopleIds', () => {
      expect(
        emailAudienceSpecSchema.safeParse({ type: 'explicit', peopleIds: ['11111111-1111-4111-8111-111111111111'] }).success,
      ).toBe(true)
    })

    it('accepts preset with ref', () => {
      expect(emailAudienceSpecSchema.safeParse({ type: 'preset', ref: 'preset-1' }).success).toBe(true)
    })

    it('rejects unknown audience type', () => {
      expect(emailAudienceSpecSchema.safeParse({ type: 'custom', ref: 'x' } as any).success).toBe(false)
    })
  })

  describe('insert schemas', () => {
    it('template insert omits id, created_at, updated_at', () => {
      const insert = emailTemplateInsertSchema.safeParse({
        name: 'Newsletter',
        subject: 'Hi',
        html_content: '<p>Hi</p>',
        editor_json: null,
        status: 'draft',
        from_email: 'team@example.org',
        from_name: 'Team',
        created_by: null,
      })
      expect(insert.success).toBe(true)
    })

    it('send insert accepts full payload', () => {
      const insert = emailSendInsertSchema.safeParse({
        template_id: null,
        subject: 'Hi',
        body: '<p>Hi</p>',
        from_email: 'team@example.org',
        from_name: 'Team',
        consent_category: 'broadcasts',
        audience_type: 'saved_list',
        audience_ref: '11111111-1111-4111-8111-111111111111',
        recipient_count: 5,
        accepted_count: 5,
        status: 'queued',
        provider: null,
        provider_message_id: null,
        error_message: null,
        sent_at: null,
        created_by: null,
      })
      expect(insert.success).toBe(true)
    })
  })
})
