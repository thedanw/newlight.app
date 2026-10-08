import { describe, expect, it, vi } from 'vitest'

vi.mock('@/core/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  }
})

import { supabase } from '@/core/lib/supabase'
import { deleteJourneyStage } from './queries'
import type { JourneyStage } from './types'

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>

const contactStage: JourneyStage = { id: 'stage-contact', slug: 'contact', label: 'Contact', color: null, sort_order: 1, is_terminal: false }
const guestStage: JourneyStage = { id: 'stage-guest', slug: 'guest', label: 'Guest', color: null, sort_order: 2, is_terminal: false }
const customStage: JourneyStage = { id: 'stage-custom', slug: 'my-custom-stage', label: 'Custom', color: null, sort_order: 3, is_terminal: false }
const archivedStage: JourneyStage = { id: 'stage-archived', slug: 'archived', label: 'Archived', color: null, sort_order: 5, is_terminal: true }

function mockDeleteResult(error: unknown = null) {
  mockFrom.mockReturnValue({
    delete: () => ({
      eq: () => ({ error }),
    }),
  })
}

describe('deleteJourneyStage', () => {
  it('refuses to delete a stage whose slug is contact (protected)', async () => {
    mockDeleteResult()
    await expect(deleteJourneyStage('stage-contact', [contactStage, customStage])).rejects.toThrow('Seeded journey stages cannot be deleted.')
  })

  it('refuses to delete a stage whose slug is archived (protected)', async () => {
    mockDeleteResult()
    await expect(deleteJourneyStage('stage-archived', [contactStage, customStage, archivedStage])).rejects.toThrow('Seeded journey stages cannot be deleted.')
  })

  it('allows deletion of a custom stage by slug', async () => {
    mockDeleteResult(null)
    await expect(deleteJourneyStage('stage-custom', [contactStage, customStage])).resolves.toBeUndefined()
  })

  it('allows deletion when the stage is not in the provided list (no slug info)', async () => {
    mockDeleteResult(null)
    await expect(deleteJourneyStage('unknown-id', [contactStage])).resolves.toBeUndefined()
  })
})
