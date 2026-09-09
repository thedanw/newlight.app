import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/core/lib/supabase', () => {
  return {
    supabase: {
      rpc: vi.fn(),
      from: vi.fn(),
    },
  }
})

import { supabase } from '@/core/lib/supabase'
import { buildPeopleSearchFilter, normalizeSearchTokens, searchPeople, __resetPeopleSearchRpcCache } from './queries'

const mockRpc = supabase.rpc as unknown as ReturnType<typeof vi.fn>
const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>

const makePerson = (id: string, firstname: string, lastname: string) => ({
  id,
  firstname,
  lastname,
  demographic: 'adult' as const,
  access_permission: 'member_area' as const,
  journey: {},
  _synced_at: new Date().toISOString(),
  _source_modified: new Date().toISOString(),
})

/** Mock the `from().select().is().or().order().order().limit()` chain. */
const listChain = (data: unknown[], error: unknown = null, onOr: ((filter: string) => void) | null = null) => ({
  select: () => ({
    is: () => ({
      or: (filter: string) => {
        onOr?.(filter)
        return {
          order: () => ({
            order: () => ({
              limit: () => ({ data, error }),
            }),
          }),
        }
      },
    }),
  }),
})

beforeEach(() => {
  vi.clearAllMocks()
  __resetPeopleSearchRpcCache()
})

describe('normalizeSearchTokens', () => {
  it('splits, lowercases and trims terms', () => {
    expect(normalizeSearchTokens('  John   SMITH ')).toEqual(['john', 'smith'])
  })

  it('strips LIKE wildcards from untrusted input', () => {
    expect(normalizeSearchTokens('First %Last%_% \\')).toEqual(['first', 'last'])
  })

  it('caps at four tokens so pathological queries stay cheap', () => {
    expect(normalizeSearchTokens('a b c d e f')).toEqual(['a', 'b', 'c', 'd'])
  })
})

describe('buildPeopleSearchFilter', () => {
  const janeGroup = 'or(firstname.ilike.%jane%,preferred_name.ilike.%jane%,middle_name.ilike.%jane%,lastname.ilike.%jane%,email.ilike.%jane%)'
  const bloggsGroup = 'or(firstname.ilike.%bloggs%,preferred_name.ilike.%bloggs%,middle_name.ilike.%bloggs%,lastname.ilike.%bloggs%,email.ilike.%bloggs%)'

  it('lets ANY field satisfy a single token (or-group inside and)', () => {
    expect(buildPeopleSearchFilter(['jane'])).toBe(`and(${janeGroup})`)
  })

  it('ANDs per-token or-groups so first/last combinations match', () => {
    expect(buildPeopleSearchFilter(['jane', 'bloggs'])).toBe(`and(${janeGroup},${bloggsGroup})`)
  })

  it('returns null when there are no tokens', () => {
    expect(buildPeopleSearchFilter([])).toBeNull()
  })
})

describe('searchPeople', () => {
  it('returns [] for a blank term without querying the database', async () => {
    expect(await searchPeople('   ')).toEqual([])
    expect(mockRpc).not.toHaveBeenCalled()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('uses the search_people RPC for the first real search (no separate probe)', async () => {
    const jane = makePerson('p-1', 'Jane', 'Bloggs')
    mockRpc.mockResolvedValueOnce({ data: [jane], error: null })

    const result = await searchPeople('Jane Bloggs')

    expect(mockRpc).toHaveBeenCalledTimes(1)
    expect(mockRpc).toHaveBeenCalledWith('search_people', { search_query: 'Jane Bloggs', max_results: 50 })
    expect(result).toEqual([jane])
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('enters a session guard after a broken function (42883) so it does not 404 on every keystroke', async () => {
    const jane = makePerson('p-1', 'Jane', 'Bloggs')
    mockRpc.mockReturnValue({ data: null, error: { code: '42883', message: 'function replace(text[], unknown, unknown) does not exist' } })

    const orFilters: string[] = []
    mockFrom.mockReturnValue(listChain([jane], null, (filter) => { orFilters.push(filter) }))

    const first = await searchPeople('Jane Bloggs')
    const second = await searchPeople('Jane Bloggs')

    expect(mockRpc).toHaveBeenCalledTimes(1) // first search only — the second uses the fallback
    expect(orFilters).toHaveLength(2)
    expect(orFilters[0]).toContain('and(or(')
    expect(orFilters[1]).toContain('and(or(')
    expect(first).toEqual([jane])
    expect(second).toEqual([jane])
  })

  it('retries the RPC after a page reload resets the session guard', async () => {
    const jane = makePerson('p-1', 'Jane', 'Bloggs')
    // First session: RPC broken → fallback used.
    mockRpc.mockResolvedValueOnce({ data: null, error: { code: '42883', message: 'function replace(text[], unknown, unknown) does not exist' } })
    mockFrom.mockReturnValueOnce(listChain([jane], null))
    expect(await searchPeople('jane')).toEqual([jane])

    // "Reload": guard resets, and the RPC has since been fixed.
    __resetPeopleSearchRpcCache()
    mockRpc.mockResolvedValueOnce({ data: [jane], error: null })
    const result = await searchPeople('jane')

    expect(mockRpc).toHaveBeenCalledTimes(2)
    expect(result).toEqual([jane])
  })

  it('falls back to the ILIKE filter when the RPC throws (e.g. unbound this)', async () => {
    const jane = makePerson('p-1', 'Jane', 'Bloggs')
    mockRpc.mockRejectedValueOnce(new TypeError("Cannot read properties of undefined (reading 'rest')"))

    let orFilter: string | null = null
    mockFrom.mockReturnValueOnce(listChain([jane], null, (filter) => { orFilter = filter }))

    const result = await searchPeople('Jane Bloggs')

    expect(mockRpc).toHaveBeenCalledTimes(1)
    expect(orFilter).toContain('and(')
    expect(result).toEqual([jane])
  })

  it('degrades to an empty result set when the fallback query itself fails', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { code: 'PGRST202', message: 'Could not find the function search_people' } })
    mockFrom.mockReturnValueOnce(listChain([], new Error('boom')))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await searchPeople('jane')

    expect(result).toEqual([])
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})