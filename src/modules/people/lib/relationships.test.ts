import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getPersonGuardians, createPersonRelationship, createContactOnlyParent } from './queries'

const mockPerson = (id: string, firstname: string, lastname: string) => ({
  id,
  firstname,
  lastname,
  demographic: 'adult' as const,
  access_permission: 'member_area' as const,
  journey: {},
  _synced_at: new Date().toISOString(),
  _source_modified: new Date().toISOString(),
})

vi.mock('@/core/lib/supabase', () => {
  const mockFrom = vi.fn()
  return {
    supabase: {
      from: mockFrom,
    },
  }
})

import { supabase } from '@/core/lib/supabase'
const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getPersonGuardians', () => {
  it('returns guardians for a person', async () => {
    const personId = 'person-1'
    const guardian1 = mockPerson('guardian-1', 'Alice', 'Smith')
    const guardian2 = mockPerson('guardian-2', 'Bob', 'Smith')

    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          eq: () => ({ data: [{ related_person_id: guardian1.id }, { related_person_id: guardian2.id }], error: null }),
        }),
      }),
    }).mockReturnValueOnce({
      select: () => ({
        in: () => ({
          is: () => ({ data: [guardian1, guardian2], error: null }),
        }),
      }),
    })

    const result = await getPersonGuardians(personId)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(guardian1.id)
    expect(result[1].id).toBe(guardian2.id)
  })

  it('returns empty array when no guardians', async () => {
    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          eq: () => ({ data: [], error: null }),
        }),
      }),
    })

    const result = await getPersonGuardians('person-1')
    expect(result).toHaveLength(0)
  })
})

describe('createPersonRelationship', () => {
  it('creates a guardian relationship', async () => {
    const relationship = {
      id: 'rel-1',
      person_id: 'person-1',
      related_person_id: 'person-2',
      relationship_type: 'guardian' as const,
      is_primary_guardian: true,
      _synced_at: new Date().toISOString(),
    }

    mockFrom.mockReturnValueOnce({
      insert: () => ({
        select: () => ({
          single: () => ({ data: relationship, error: null }),
        }),
      }),
    })

    const result = await createPersonRelationship({
      person_id: 'person-1',
      related_person_id: 'person-2',
      relationship_type: 'guardian',
      is_primary_guardian: true,
    })

    expect(result).toEqual(relationship)
  })

  it('throws when person is their own guardian', async () => {
    await expect(
      createPersonRelationship({
        person_id: 'person-1',
        related_person_id: 'person-1',
        relationship_type: 'guardian',
      })
    ).rejects.toThrow('A person cannot be their own guardian.')
  })
})

describe('createContactOnlyParent', () => {
  it('creates a new adult contact person', async () => {
    const newPerson = mockPerson('new-person-1', 'Jane', 'Doe')
    mockFrom.mockReturnValueOnce({
      insert: () => ({
        select: () => ({
          single: () => ({ data: newPerson, error: null }),
        }),
      }),
    })

    const result = await createContactOnlyParent('Jane', 'Doe')
    expect(result).toEqual(newPerson)
    expect(result.demographic).toBe('adult')
    expect(result.access_permission).toBe('member_area')
  })
})
