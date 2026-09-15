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

describe('email sending logic (Batch 5)', () => {
  describe('hashEmail', () => {
    it('produces a consistent SHA-256 hash', async () => {
      const { hashEmail } = await import('../lib/sending')
      const h1 = await hashEmail('User@Example.org')
      const h2 = await hashEmail('user@example.org')
      expect(h1).toBe(h2)
      expect(h1).toHaveLength(64)
    })

    it('produces different hashes for different emails', async () => {
      const { hashEmail } = await import('../lib/sending')
      const h1 = await hashEmail('a@example.org')
      const h2 = await hashEmail('b@example.org')
      expect(h1).not.toBe(h2)
    })
  })

  describe('isSuppressed', () => {
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

      const { isSuppressed } = await import('../lib/sending')
      const result = await isSuppressed('user@example.org')
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

      const { isSuppressed } = await import('../lib/sending')
      const result = await isSuppressed('user@example.org')
      expect(result).toBe(false)
    })

    it('throws on supabase error', async () => {
      const supabase = await getMockSupabase()
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } } as any),
      }
      supabase.from.mockReturnValue(chain)

      const { isSuppressed } = await import('../lib/sending')
      await expect(isSuppressed('user@example.org')).rejects.toThrow('DB error')
    })
  })

  describe('hasConsent', () => {
    it('returns true when consent is yes', async () => {
      const supabase = await getMockSupabase()
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { consent_broadcasts: 'yes' },
          error: null,
        }),
      }
      supabase.from.mockReturnValue(chain)

      const { hasConsent } = await import('../lib/sending')
      const result = await hasConsent('person-1', 'broadcasts')
      expect(result).toBe(true)
      expect(chain.select).toHaveBeenCalledWith('consent_broadcasts')
    })

    it('returns false when consent is no', async () => {
      const supabase = await getMockSupabase()
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { consent_team_updates: 'no' },
          error: null,
        }),
      }
      supabase.from.mockReturnValue(chain)

      const { hasConsent } = await import('../lib/sending')
      const result = await hasConsent('person-1', 'team_updates')
      expect(result).toBe(false)
    })

    it('returns false when consent is null', async () => {
      const supabase = await getMockSupabase()
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { consent_broadcasts: null },
          error: null,
        }),
      }
      supabase.from.mockReturnValue(chain)

      const { hasConsent } = await import('../lib/sending')
      const result = await hasConsent('person-1', 'broadcasts')
      expect(result).toBe(false)
    })

    it('selects the correct consent column for team_updates', async () => {
      const supabase = await getMockSupabase()
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      supabase.from.mockReturnValue(chain)

      const { hasConsent } = await import('../lib/sending')
      await hasConsent('person-1', 'team_updates')
      expect(chain.select).toHaveBeenCalledWith('consent_team_updates')
    })
  })

  describe('rollupSendStatus', () => {
    it('returns sent when all recipients are sent', async () => {
      const { rollupSendStatus } = await import('../lib/sending')
      expect(rollupSendStatus(['sent', 'sent', 'sent'])).toBe('sent')
    })

    it('returns failed when all recipients failed', async () => {
      const { rollupSendStatus } = await import('../lib/sending')
      expect(rollupSendStatus(['failed', 'failed'])).toBe('failed')
    })

    it('returns partial when mix of sent and failed', async () => {
      const { rollupSendStatus } = await import('../lib/sending')
      expect(rollupSendStatus(['sent', 'failed'])).toBe('partial')
    })

    it('returns partial when mix of sent and suppressed', async () => {
      const { rollupSendStatus } = await import('../lib/sending')
      expect(rollupSendStatus(['sent', 'suppressed'])).toBe('partial')
    })

    it('returns suppressed when all are suppressed or skipped', async () => {
      const { rollupSendStatus } = await import('../lib/sending')
      expect(rollupSendStatus(['suppressed', 'skipped'])).toBe('suppressed')
    })

    it('returns partial when mix of failed and suppressed (no sent)', async () => {
      const { rollupSendStatus } = await import('../lib/sending')
      expect(rollupSendStatus(['failed', 'suppressed'])).toBe('partial')
    })

    it('returns suppressed for empty list', async () => {
      const { rollupSendStatus } = await import('../lib/sending')
      expect(rollupSendStatus([])).toBe('suppressed')
    })
  })

  describe('computeSendSummary', () => {
    it('counts accepted recipients and computes status', async () => {
      const { computeSendSummary } = await import('../lib/sending')
      const rows = [
        { status: 'sent' },
        { status: 'sent' },
        { status: 'failed' },
      ] as any[]
      const result = computeSendSummary(rows)
      expect(result.acceptedCount).toBe(2)
      expect(result.status).toBe('partial')
    })

    it('returns sent status when all succeed', async () => {
      const { computeSendSummary } = await import('../lib/sending')
      const rows = [{ status: 'sent' }, { status: 'sent' }] as any[]
      const result = computeSendSummary(rows)
      expect(result.acceptedCount).toBe(2)
      expect(result.status).toBe('sent')
    })
  })

  describe('isSendInProgress', () => {
    it('returns true for queued', async () => {
      const { isSendInProgress } = await import('../lib/sending')
      expect(isSendInProgress('queued')).toBe(true)
    })

    it('returns true for sending', async () => {
      const { isSendInProgress } = await import('../lib/sending')
      expect(isSendInProgress('sending')).toBe(true)
    })

    it('returns false for sent', async () => {
      const { isSendInProgress } = await import('../lib/sending')
      expect(isSendInProgress('sent')).toBe(false)
    })

    it('returns false for failed', async () => {
      const { isSendInProgress } = await import('../lib/sending')
      expect(isSendInProgress('failed')).toBe(false)
    })
  })
})
