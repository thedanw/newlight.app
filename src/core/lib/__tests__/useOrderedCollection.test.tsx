import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useOrderedCollection } from '../useOrderedCollection'
import { orderedCollectionService } from '../ordered-collection'

const { mockUpdate, mockEq } = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockEq: vi.fn(),
}))

vi.mock('@/core/lib/supabase', () => ({
  supabase: {
    from: () => ({ update: mockUpdate }),
  },
}))

describe('useOrderedCollection', () => {
  const definition = { collectionId: 'stages', table: 'journey_stages' }
  const initial = ['a', 'b', 'c']

  function setup(persist = vi.fn().mockResolvedValue(true)) {
    return renderHook(() =>
      useOrderedCollection({
        definition,
        load: vi.fn().mockResolvedValue(initial),
        persist,
      }),
    )
  }

  it('loads initial items', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.items).toEqual(initial))
    expect(result.current.isDirty).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('reorders locally and marks dirty', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.items).toEqual(initial))
    act(() => result.current.reorder(['b', 'a', 'c']))
    expect(result.current.items).toEqual(['b', 'a', 'c'])
    expect(result.current.isDirty).toBe(true)
  })

  it('persists on save and clears dirty', async () => {
    const persist = vi.fn().mockResolvedValue(true)
    const { result } = setup(persist)
    await waitFor(() => expect(result.current.items).toEqual(initial))
    act(() => result.current.reorder(['b', 'a', 'c']))
    let saved = false
    await act(async () => {
      saved = await result.current.save()
    })
    expect(saved).toBe(true)
    expect(persist).toHaveBeenCalledWith(['b', 'a', 'c'])
    expect(result.current.isDirty).toBe(false)
  })

  it('rolls back on persist failure', async () => {
    const persist = vi.fn().mockResolvedValue(false)
    const { result } = setup(persist)
    await waitFor(() => expect(result.current.items).toEqual(initial))
    act(() => result.current.reorder(['b', 'a', 'c']))
    let saved = true
    await act(async () => {
      saved = await result.current.save()
    })
    expect(saved).toBe(false)
    expect(result.current.items).toEqual(initial)
    expect(result.current.isDirty).toBe(false)
    expect(result.current.error).not.toBeNull()
  })

  it('reset restores the original order', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.items).toEqual(initial))
    act(() => result.current.reorder(['b', 'a', 'c']))
    act(() => result.current.reset())
    expect(result.current.items).toEqual(initial)
    expect(result.current.isDirty).toBe(false)
  })
})

describe('orderedCollectionService', () => {
  beforeEach(() => {
    mockUpdate.mockClear()
    mockEq.mockClear()
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ error: null })
  })

  it('persists sort_order per row with scope', async () => {
    const ok = await orderedCollectionService.persist(
      { collectionId: 'tracks', table: 'journey_tracks', scope: { category_id: 'c1' } },
      ['a', 'b', 'c'],
    )
    expect(ok).toBe(true)
    expect(mockUpdate).toHaveBeenCalledTimes(3)
    expect(mockUpdate).toHaveBeenCalledWith({ sort_order: 0, category_id: 'c1' })
    expect(mockUpdate).toHaveBeenCalledWith({ sort_order: 1, category_id: 'c1' })
    expect(mockUpdate).toHaveBeenCalledWith({ sort_order: 2, category_id: 'c1' })
    expect(mockEq).toHaveBeenNthCalledWith(1, 'id', 'a')
    expect(mockEq).toHaveBeenNthCalledWith(2, 'id', 'b')
    expect(mockEq).toHaveBeenNthCalledWith(3, 'id', 'c')
  })

  it('returns false when an update fails', async () => {
    mockEq.mockResolvedValueOnce({ error: new Error('boom') })
    const ok = await orderedCollectionService.persist(
      { collectionId: 'tracks', table: 'journey_tracks' },
      ['a', 'b'],
    )
    expect(ok).toBe(false)
  })
})