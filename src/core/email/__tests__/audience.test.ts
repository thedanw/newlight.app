import { describe, expect, it, vi } from 'vitest'

vi.mock('@/core/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

function createChain(result: { data: any; error: any } = { data: [], error: null }) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    returns: vi.fn().mockReturnThis(),
  }
  chain.then = vi.fn((resolve: any) => resolve(result))
  return chain
}

type MockSupabase = { from: ReturnType<typeof vi.fn> }

async function getMockSupabase(): Promise<MockSupabase> {
  return (await import('@/core/lib/supabase')).supabase as unknown as MockSupabase
}

describe('email audience (Batch 4)', () => {
  describe('dedupeRecipients', () => {
    it('deduplicates by lowercase email', async () => {
      const { dedupeRecipients } = await import('../lib/audience')
      const result = dedupeRecipients([
        { email: 'Test@Example.org', name: 'A' },
        { email: 'test@example.org', name: 'B' },
      ])
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('A')
    })

    it('preserves order of first occurrence', async () => {
      const { dedupeRecipients } = await import('../lib/audience')
      const result = dedupeRecipients([
        { email: 'A@x.org' },
        { email: 'b@x.org' },
        { email: 'a@x.org' },
      ])
      expect(result.map((r) => r.email)).toEqual(['A@x.org', 'b@x.org'])
    })
  })

  describe('resolveSavedList', () => {
    it('queries people by list conditions and returns recipients', async () => {
      const supabase = await getMockSupabase()
      const peopleChain = createChain({
        data: [
          { email: 'a@example.org', firstname: 'A', preferred_name: null, lastname: 'Doe' },
          { email: 'b@example.org', firstname: 'B', preferred_name: 'B', lastname: 'Smith' },
        ],
        error: null,
      })
      const listChain = createChain({ data: null, error: null })
      listChain.maybeSingle.mockResolvedValue({
        data: { conditions: { demographic: 'adult' } },
        error: null,
      })

      supabase.from.mockImplementation((table: string) => {
        if (table === 'saved_lists') return listChain
        if (table === 'people') return peopleChain
        return createChain()
      })

      const { resolveSavedList } = await import('../lib/audience')
      const result = await resolveSavedList('list-1')

      expect(supabase.from).toHaveBeenCalledWith('saved_lists')
      expect(listChain.eq).toHaveBeenCalledWith('id', 'list-1')
      expect(supabase.from).toHaveBeenCalledWith('people')
      expect(result).toHaveLength(2)
      expect(result[0].email).toBe('a@example.org')
      expect(result[0].name).toBe('A Doe')
      expect(result[1].name).toBe('B Smith')
    })

    it('throws when list not found', async () => {
      const supabase = await getMockSupabase()
      const listChain = createChain()
      listChain.maybeSingle.mockResolvedValue({ data: null, error: null })
      supabase.from.mockReturnValue(listChain)

      const { resolveSavedList } = await import('../lib/audience')
      await expect(resolveSavedList('missing')).rejects.toThrow('Saved list not found')
    })

    it('throws on supabase error', async () => {
      const supabase = await getMockSupabase()
      const listChain = createChain()
      listChain.maybeSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } as any })
      supabase.from.mockReturnValue(listChain)

      const { resolveSavedList } = await import('../lib/audience')
      await expect(resolveSavedList('list-1')).rejects.toThrow('DB error')
    })

    it('returns empty array when no matching people', async () => {
      const supabase = await getMockSupabase()
      const listChain = createChain({ data: { conditions: {} }, error: null })
      listChain.maybeSingle.mockResolvedValue({
        data: { conditions: {} },
        error: null,
      })
      const peopleChain = createChain({ data: [], error: null })
      supabase.from.mockImplementation((table: string) => {
        if (table === 'saved_lists') return listChain
        return peopleChain
      })

      const { resolveSavedList } = await import('../lib/audience')
      const result = await resolveSavedList('list-1')
      expect(result).toEqual([])
    })

    it('filters out people without email', async () => {
      const supabase = await getMockSupabase()
      const listChain = createChain()
      listChain.maybeSingle.mockResolvedValue({
        data: { conditions: {} },
        error: null,
      })
      const peopleChain = createChain({
        data: [
          { email: 'a@example.org', firstname: 'A', preferred_name: null, lastname: 'Doe' },
          { email: null, firstname: 'B', preferred_name: null, lastname: 'Smith' },
        ],
        error: null,
      })
      supabase.from.mockImplementation((table: string) => {
        if (table === 'saved_lists') return listChain
        return peopleChain
      })

      const { resolveSavedList } = await import('../lib/audience')
      const result = await resolveSavedList('list-1')
      expect(result).toHaveLength(1)
    })
  })

  describe('resolvePeople', () => {
    it('returns recipients for given person IDs', async () => {
      const supabase = await getMockSupabase()
      const chain = createChain({
        data: [{ email: 'person@example.org', firstname: 'John', preferred_name: null, lastname: 'Doe' }],
        error: null,
      })
      supabase.from.mockReturnValue(chain)

      const { resolvePeople } = await import('../lib/audience')
      const result = await resolvePeople(['person-1'])

      expect(supabase.from).toHaveBeenCalledWith('people')
      expect(chain.in).toHaveBeenCalledWith('id', ['person-1'])
      expect(result).toHaveLength(1)
      expect(result[0].email).toBe('person@example.org')
      expect(result[0].name).toBe('John Doe')
    })

    it('filters out people without email', async () => {
      const supabase = await getMockSupabase()
      const chain = createChain({
        data: [
          { email: 'a@example.org', firstname: 'A', preferred_name: null, lastname: 'Doe' },
          { email: null, firstname: 'B', preferred_name: null, lastname: 'Smith' },
        ],
        error: null,
      })
      supabase.from.mockReturnValue(chain)

      const { resolvePeople } = await import('../lib/audience')
      const result = await resolvePeople(['person-1', 'person-2'])
      expect(result).toHaveLength(1)
    })

    it('returns empty for empty input', async () => {
      const { resolvePeople } = await import('../lib/audience')
      const result = await resolvePeople([])
      expect(result).toEqual([])
    })
  })

  describe('resolvePreset', () => {
    it('resolves a registered preset', async () => {
      const { registerEmailPreset, resolvePreset } = await import('../lib/audience')
      registerEmailPreset('test-preset', async () => [{ email: 'preset@example.org', name: 'P' }])
      const result = await resolvePreset('test-preset')
      expect(result).toHaveLength(1)
      expect(result[0].email).toBe('preset@example.org')
    })

    it('throws for unknown preset', async () => {
      const { resolvePreset } = await import('../lib/audience')
      await expect(resolvePreset('unknown')).rejects.toThrow('Unknown email preset')
    })
  })

  describe('resolveAudience', () => {
    it('routes saved_list to resolveSavedList', async () => {
      const supabase = await getMockSupabase()
      const listChain = createChain()
      listChain.maybeSingle.mockResolvedValue({ data: null, error: null })
      supabase.from.mockReturnValue(listChain)

      const { resolveAudience } = await import('../lib/audience')
      await expect(resolveAudience({ type: 'saved_list', ref: 'missing' })).rejects.toThrow(
        'Saved list not found',
      )
    })

    it('routes explicit to resolvePeople', async () => {
      const { resolveAudience } = await import('../lib/audience')
      await expect(resolveAudience({ type: 'explicit', peopleIds: [] })).resolves.toEqual([])
    })

    it('throws when saved_list has no ref', async () => {
      const { resolveAudience } = await import('../lib/audience')
      await expect(resolveAudience({ type: 'saved_list' })).rejects.toThrow('requires a ref')
    })

    it('throws when explicit has no peopleIds', async () => {
      const { resolveAudience } = await import('../lib/audience')
      await expect(resolveAudience({ type: 'explicit' })).rejects.toThrow('requires peopleIds')
    })

    it('throws when preset has no ref', async () => {
      const { resolveAudience } = await import('../lib/audience')
      await expect(resolveAudience({ type: 'preset' })).rejects.toThrow('requires a ref')
    })
  })

  describe('filterByConsent', () => {
    it('keeps recipients with yes consent', async () => {
      const supabase = await getMockSupabase()
      const chain = createChain({
        data: [{ email: 'a@example.org', consent_broadcasts: 'yes' }],
        error: null,
      })
      supabase.from.mockReturnValue(chain)

      const { filterByConsent } = await import('../lib/audience')
      const result = await filterByConsent([{ email: 'a@example.org' }], 'broadcasts')
      expect(result).toHaveLength(1)
    })

    it('filters out recipients without yes consent', async () => {
      const supabase = await getMockSupabase()
      const chain = createChain({
        data: [
          { email: 'a@example.org', consent_broadcasts: 'yes' },
          { email: 'b@example.org', consent_broadcasts: 'no' },
          { email: 'c@example.org', consent_broadcasts: null },
        ],
        error: null,
      })
      supabase.from.mockReturnValue(chain)

      const { filterByConsent } = await import('../lib/audience')
      const result = await filterByConsent(
        [
          { email: 'a@example.org' },
          { email: 'b@example.org' },
          { email: 'c@example.org' },
        ],
        'broadcasts',
      )
      expect(result).toHaveLength(1)
      expect(result[0].email).toBe('a@example.org')
    })

    it('returns empty for empty input', async () => {
      const { filterByConsent } = await import('../lib/audience')
      const result = await filterByConsent([], 'broadcasts')
      expect(result).toEqual([])
    })

    it('queries the correct consent column for team_updates', async () => {
      const supabase = await getMockSupabase()
      const chain = createChain({ data: [], error: null })
      supabase.from.mockReturnValue(chain)

      const { filterByConsent } = await import('../lib/audience')
      await filterByConsent([{ email: 'a@example.org' }], 'team_updates')

      expect(chain.select).toHaveBeenCalledWith('email, consent_team_updates')
    })

    it('queries the correct consent column for broadcasts', async () => {
      const supabase = await getMockSupabase()
      const chain = createChain({ data: [], error: null })
      supabase.from.mockReturnValue(chain)

      const { filterByConsent } = await import('../lib/audience')
      await filterByConsent([{ email: 'a@example.org' }], 'broadcasts')

      expect(chain.select).toHaveBeenCalledWith('email, consent_broadcasts')
    })
  })
})
