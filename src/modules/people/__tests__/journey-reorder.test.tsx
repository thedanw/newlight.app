import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { JourneySettingsManager } from '../components/JourneySettingsManager'

const { mockUseOrderedCollection, mockSaveJourneyStage } = vi.hoisted(() => ({
  mockUseOrderedCollection: vi.fn(),
  mockSaveJourneyStage: vi.fn(),
}))

// Stable reference so the component's data-sync effects do not loop.
const journeyData = {
  tracks: [],
  categories: [],
  stages: [
    { slug: 'new', label: 'New', color: null, sort_order: 0, is_terminal: false },
    { slug: 'active', label: 'Active', color: null, sort_order: 1, is_terminal: false },
  ],
}

vi.mock('@/core/lib', () => ({
  useOrderedCollection: (options: unknown) => mockUseOrderedCollection(options),
}))

vi.mock('../lib/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/queries')>()
  return { ...actual, saveJourneyStage: mockSaveJourneyStage }
})

vi.mock('../lib/settings-hooks', () => ({
  useJourneySettings: () => ({ data: journeyData, loading: false, error: null }),
}))

describe('JourneySettingsManager reorder integration', () => {
  beforeEach(() => {
    mockUseOrderedCollection.mockReset()
    mockSaveJourneyStage.mockReset()
    mockSaveJourneyStage.mockResolvedValue({
      slug: 'x',
      label: 'x',
      color: null,
      sort_order: 0,
      is_terminal: false,
    })
    mockUseOrderedCollection.mockReturnValue({
      items: [],
      reorder: vi.fn(),
      isDirty: false,
      save: vi.fn().mockResolvedValue(true),
      reset: vi.fn(),
      error: null,
    })
  })

  it('wires journey stages through useOrderedCollection with a slug primary key', () => {
    render(<JourneySettingsManager />)
    const stageCall = mockUseOrderedCollection.mock.calls.find(
      ([opts]) => opts.definition.collectionId === 'journey:stages',
    )
    expect(stageCall).toBeDefined()
    if (!stageCall) throw new Error('Expected a journey:stages useOrderedCollection call')
    expect(stageCall[0].definition.table).toBe('journey_stages')
    expect(stageCall[0].definition.primaryKey).toBe('slug')
  })

  it('persists reordered stage sort_order via the core hook', async () => {
    render(<JourneySettingsManager />)
    const stageCall = mockUseOrderedCollection.mock.calls.find(
      ([opts]) => opts.definition.collectionId === 'journey:stages',
    )
    if (!stageCall) throw new Error('Expected a journey:stages useOrderedCollection call')
    const { persist } = stageCall[0]
    const ok = await persist(['active', 'new'])
    expect(ok).toBe(true)
    expect(mockSaveJourneyStage).toHaveBeenCalledTimes(2)
    expect(mockSaveJourneyStage).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'active', sort_order: 0 }),
    )
    expect(mockSaveJourneyStage).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'new', sort_order: 1 }),
    )
  })
})