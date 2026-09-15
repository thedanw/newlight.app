import { describe, expect, it, vi } from 'vitest'
import type { SendEmailInput, SendEmailResult } from '../lib/types'
import { EdgeFunctionProvider, NoopProvider, createEmailProvider } from '../lib/client'

vi.mock('@/core/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

const VALID_INPUT: SendEmailInput = {
  to: [
    { email: 'recipient1@example.org', name: 'First' },
    { email: 'recipient2@example.org', name: 'Second' },
  ],
  subject: 'Welcome',
  body: '<p>Hello</p>',
  from: 'team@example.org',
}

describe('email client (Batch 3)', () => {
  describe('NoopProvider', () => {
    it('returns acceptedCount equal to recipient count', async () => {
      const provider = new NoopProvider()
      const result = await provider.send(VALID_INPUT)
      expect(result.acceptedCount).toBe(2)
      expect(result.messageId).toBeNull()
    })

    it('returns zero accepted for empty input', async () => {
      const provider = new NoopProvider()
      const result = await provider.send({ to: [], subject: 'Hi', body: 'Body' })
      expect(result.acceptedCount).toBe(0)
    })
  })

  describe('EdgeFunctionProvider', () => {
    it('invokes email-send function with the input body', async () => {
      const { supabase } = await import('@/core/lib/supabase')
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { messageId: '<abc@example.org>', acceptedCount: 2 },
        error: null,
      })

      const provider = new EdgeFunctionProvider('https://test.supabase.co')
      const result = await provider.send(VALID_INPUT)

      expect(supabase.functions.invoke).toHaveBeenCalledWith('email-send', {
        body: VALID_INPUT,
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result.messageId).toBe('<abc@example.org>')
      expect(result.acceptedCount).toBe(2)
    })

    it('falls back to input length when acceptedCount missing', async () => {
      const { supabase } = await import('@/core/lib/supabase')
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { messageId: null },
        error: null,
      })

      const provider = new EdgeFunctionProvider('https://test.supabase.co')
      const result: SendEmailResult = await provider.send(VALID_INPUT)
      expect(result.acceptedCount).toBe(2)
      expect(result.messageId).toBeNull()
    })

    it('throws when function returns an error', async () => {
      const { supabase } = await import('@/core/lib/supabase')
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: null,
        error: { message: 'SMTP auth failed' } as any,
      })

      const provider = new EdgeFunctionProvider('https://test.supabase.co')
      await expect(provider.send(VALID_INPUT)).rejects.toThrow('SMTP auth failed')
    })
  })

  describe('createEmailProvider', () => {
    it('returns NoopProvider for noop transport', () => {
      expect(createEmailProvider({ transport: 'noop' })).toBeInstanceOf(NoopProvider)
    })

    it('returns EdgeFunctionProvider for smtp transport', () => {
      const provider = createEmailProvider({ transport: 'smtp', supabaseUrl: 'https://test.co' })
      expect(provider).toBeInstanceOf(EdgeFunctionProvider)
    })

    it('throws for unknown transport', () => {
      expect(() => createEmailProvider({ transport: 'unknown' as any })).toThrow('Unsupported email transport')
    })
  })
})
