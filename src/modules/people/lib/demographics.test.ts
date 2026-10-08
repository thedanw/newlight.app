import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/core/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  }
})

import { supabase } from '@/core/lib/supabase'
import { getDemographics } from './queries'

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>

/** Mock the `from().select().is().order()` chain used by getDemographics. */
const listChain = (data: unknown[], error: unknown = null) => ({
  select: () => ({
    is: () => ({
      order: () => ({ data, error }),
    }),
  }),
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getDemographics', () => {
  it('returns active rows ordered by sort_order (filters deleted_at)', async () => {
    const rows = [
      { id: 'd2', name: 'Youth', slug: 'youth', profile_type: 'youth', icon_type: 'lucide', icon_name: 'GraduationCap', sort_order: 1, deleted_at: null },
      { id: 'd1', name: 'Adult', slug: 'adult', profile_type: 'adult', icon_type: 'lucide', icon_name: 'User', sort_order: 0, deleted_at: null },
    ]
    mockFrom.mockReturnValueOnce(listChain(rows))

    const result = await getDemographics()

    expect(mockFrom).toHaveBeenCalledWith('demographics')
    expect(result).toEqual(rows)
  })

  it('throws when the query fails', async () => {
    mockFrom.mockReturnValueOnce(listChain([], new Error('boom')))
    await expect(getDemographics()).rejects.toThrow('boom')
  })
})
