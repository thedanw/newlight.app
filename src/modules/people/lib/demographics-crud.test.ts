import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/core/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  }
})

import { supabase } from '@/core/lib/supabase'
import { createDemographic, getDemographics, saveDemographic } from './queries'

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>

type Row = Record<string, unknown>

const makeDemographic = (overrides: Partial<Row> = {}): Row => ({
  id: 'd1',
  name: 'Young Adult',
  slug: 'young-adult',
  profile_type: 'adult',
  icon_type: 'lucide',
  icon_name: 'User',
  sort_order: 0,
  deleted_at: null,
  ...overrides,
})

/** Chain for the duplicate-slug probe: from().select('id').eq('slug', s).is('deleted_at', null).maybeSingle() */
const duplicateProbe = (existing: Row | null) => ({
  select: () => ({
    eq: () => ({
      is: () => ({
        maybeSingle: () => Promise.resolve({ data: existing, error: null }),
      }),
    }),
  }),
})

/** Chain for the upsert write: from().upsert(row).select('*').single() */
const upsertChain = (row: Row, error: unknown = null) => ({
  upsert: (payload: Row) => ({
    payload,
    select: () => ({
      single: () => Promise.resolve({ data: row, error }),
    }),
  }),
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createDemographic', () => {
  it('throws when the name is missing', async () => {
    await expect(createDemographic({ name: '   ' })).rejects.toThrow(/name is required/i)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('derives the slug from the name via slugify and inserts the row', async () => {
    const upserts: Row[] = []
    mockFrom.mockImplementationOnce(() => duplicateProbe(null))
    mockFrom.mockImplementationOnce(() => {
      const chain = upsertChain(makeDemographic({ id: 'new-id' }))
      // capture the payload passed to upsert
      const original = chain.upsert
      ;(chain as Row).upsert = (payload: Row) => {
        upserts.push(payload)
        return original(payload)
      }
      return chain
    })

    const result = await createDemographic({ name: 'Young Adult' })

    expect(upserts).toHaveLength(1)
    expect(upserts[0].slug).toBe('young-adult')
    expect(upserts[0].name).toBe('Young Adult')
    expect(upserts[0].profile_type).toBe('adult') // defaults to adult
    expect(result.slug).toBe('young-adult')
  })

  it('rejects a duplicate active slug with a clear error', async () => {
    mockFrom.mockImplementationOnce(() => duplicateProbe(makeDemographic({ id: 'existing' })))

    await expect(createDemographic({ name: 'Young Adult' })).rejects.toThrow(/already exists/i)
    // probe only — never writes
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })
})

describe('saveDemographic', () => {
  it('never rewrites the slug — only name, profile_type and icon fields are sent', async () => {
    const upserts: Row[] = []
    mockFrom.mockImplementationOnce(() => {
      const chain = upsertChain(makeDemographic())
      const original = chain.upsert
      ;(chain as Row).upsert = (payload: Row) => {
        upserts.push(payload)
        return original(payload)
      }
      return chain
    })

    await saveDemographic(makeDemographic({
      id: 'd1',
      slug: 'young-adult',
      name: 'Renamed Group',
      profile_type: 'youth',
      icon_name: 'GraduationCap',
    }) as never)

    expect(upserts).toHaveLength(1)
    expect(upserts[0].slug).toBeUndefined()
    expect(upserts[0].name).toBe('Renamed Group')
    expect(upserts[0].profile_type).toBe('youth')
    expect(upserts[0].icon_name).toBe('GraduationCap')
  })
})

describe('getDemographics (regression)', () => {
  it('still returns active rows ordered by sort_order', async () => {
    mockFrom.mockReturnValueOnce({
      select: () => ({
        is: () => ({
          order: () => Promise.resolve({ data: [makeDemographic()], error: null }),
        }),
      }),
    })

    await expect(getDemographics()).resolves.toEqual([makeDemographic()])
  })
})
