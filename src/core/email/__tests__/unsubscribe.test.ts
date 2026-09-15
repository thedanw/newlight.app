import { describe, expect, it, vi } from 'vitest'

vi.mock('@/core/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

type MockSupabase = { from: ReturnType<typeof vi.fn> }

async function getMockSupabase(): Promise<MockSupabase> {
  return (await import('@/core/lib/supabase')).supabase as unknown as MockSupabase
}

describe('unsubscribe utilities (Batch 6)', () => {
  describe('generateUnsubscribeToken', () => {
    it('generates a non-empty string token', async () => {
      const { generateUnsubscribeToken } = await import('../lib/unsubscribe')
      const token = generateUnsubscribeToken()
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(20)
    })

    it('generates unique tokens on each call', async () => {
      const { generateUnsubscribeToken } = await import('../lib/unsubscribe')
      const t1 = generateUnsubscribeToken()
      const t2 = generateUnsubscribeToken()
      expect(t1).not.toBe(t2)
    })
  })

  describe('hashToken / hashEmail', () => {
    it('hashToken produces consistent SHA-256 hashes', async () => {
      const { hashToken } = await import('../lib/unsubscribe')
      const h1 = await hashToken('token-abc')
      const h2 = await hashToken('token-abc')
      expect(h1).toBe(h2)
      expect(h1).toHaveLength(64)
    })

    it('hashEmail lowercases before hashing', async () => {
      const { hashEmail } = await import('../lib/sending')
      const h1 = await hashEmail('User@Example.org')
      const h2 = await hashEmail('user@example.org')
      expect(h1).toBe(h2)
    })

    it('different inputs produce different hashes', async () => {
      const { hashToken } = await import('../lib/unsubscribe')
      const h1 = await hashToken('token-a')
      const h2 = await hashToken('token-b')
      expect(h1).not.toBe(h2)
    })
  })

  describe('createUnsubscribeLink', () => {
    it('creates a link with token and email', async () => {
      const { createUnsubscribeLink } = await import('../lib/unsubscribe')
      const link = createUnsubscribeLink('user@example.org', 'send-1')
      expect(link).toContain('/email/unsubscribe?')
      expect(link).toContain('token=')
      expect(link).toContain('sendId=send-1')
    })

    it('creates a link without sendId when not provided', async () => {
      const { createUnsubscribeLink } = await import('../lib/unsubscribe')
      const link = createUnsubscribeLink('user@example.org')
      expect(link).toContain('/email/unsubscribe?')
      expect(link).not.toContain('sendId=')
    })
  })

  describe('verifyUnsubscribeToken', () => {
    it('returns null when token hash not found', async () => {
      const supabase = await getMockSupabase()
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      supabase.from.mockReturnValue(chain)

      const { verifyUnsubscribeToken } = await import('../lib/unsubscribe')
      const result = await verifyUnsubscribeToken('some-token')
      expect(result).toBeNull()
    })

    it('returns email and sendId when token hash matches', async () => {
      const supabase = await getMockSupabase()
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { email_hash: 'hash123@example.org', send_id: 'send-1' },
          error: null,
        }),
      }
      supabase.from.mockReturnValue(chain)

      const { verifyUnsubscribeToken } = await import('../lib/unsubscribe')
      const result = await verifyUnsubscribeToken('some-token')
      expect(result).toEqual({ email: 'hash123@example.org', sendId: 'send-1' })
    })

    it('throws on supabase error', async () => {
      const supabase = await getMockSupabase()
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } } as any),
      }
      supabase.from.mockReturnValue(chain)

      const { verifyUnsubscribeToken } = await import('../lib/unsubscribe')
      await expect(verifyUnsubscribeToken('token')).rejects.toThrow('DB error')
    })
  })

  describe('recordUnsubscribe', () => {
    it('inserts a new unsubscribe record', async () => {
      const supabase = await getMockSupabase()
      const chain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      supabase.from.mockReturnValue(chain)

      const { recordUnsubscribe } = await import('../lib/unsubscribe')
      const result = await recordUnsubscribe('user@example.org', 'token-abc', 'send-1', 'not interested')

      expect(supabase.from).toHaveBeenCalledWith('email_unsubscribes')
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          email_hash: expect.any(String),
          token_hash: expect.any(String),
          send_id: 'send-1',
          reason: 'not interested',
        }),
      )
      expect(result).toBe(true)
    })

    it('allows null sendId for global unsubscribe', async () => {
      const supabase = await getMockSupabase()
      const chain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      supabase.from.mockReturnValue(chain)

      const { recordUnsubscribe } = await import('../lib/unsubscribe')
      await recordUnsubscribe('user@example.org', 'token-abc')

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ send_id: null, reason: null }),
      )
    })

    it('returns true on duplicate key conflict (23505)', async () => {
      const supabase = await getMockSupabase()
      const chain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate key' } as any }),
      }
      supabase.from.mockReturnValue(chain)

      const { recordUnsubscribe } = await import('../lib/unsubscribe')
      const result = await recordUnsubscribe('user@example.org', 'token-abc')
      expect(result).toBe(true)
    })

    it('throws on other supabase errors', async () => {
      const supabase = await getMockSupabase()
      const chain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } } as any),
      }
      supabase.from.mockReturnValue(chain)

      const { recordUnsubscribe } = await import('../lib/unsubscribe')
      await expect(recordUnsubscribe('user@example.org', 'token-abc', null, null)).rejects.toThrow('DB error')
    })
  })

  describe('isEmailSuppressed', () => {
    it('returns true when unsubscribe record exists', async () => {
      const supabase = await getMockSupabase()
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { email_hash: 'abc123' },
          error: null,
        }),
      }
      supabase.from.mockReturnValue(chain)

      const { isEmailSuppressed } = await import('../lib/unsubscribe')
      const result = await isEmailSuppressed('user@example.org')
      expect(result).toBe(true)
    })

    it('returns false when no unsubscribe record', async () => {
      const supabase = await getMockSupabase()
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      supabase.from.mockReturnValue(chain)

      const { isEmailSuppressed } = await import('../lib/unsubscribe')
      const result = await isEmailSuppressed('user@example.org')
      expect(result).toBe(false)
    })
  })
})
