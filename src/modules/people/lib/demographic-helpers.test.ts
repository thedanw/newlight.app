import { describe, expect, it } from 'vitest'
import { resolveProfileType } from './demographic-helpers'

describe('resolveProfileType', () => {
  it('returns profile_type of the matching demographic', () => {
    const demos = [
      { id: 'd1', name: 'Adult', slug: 'adult', profile_type: 'adult' as const, icon_type: '', icon_name: null, sort_order: 0, deleted_at: null },
      { id: 'd2', name: 'Youth', slug: 'youth', profile_type: 'youth' as const, icon_type: '', icon_name: null, sort_order: 1, deleted_at: null },
    ]
    expect(resolveProfileType(demos, 'adult')).toBe('adult')
    expect(resolveProfileType(demos, 'youth')).toBe('youth')
  })

  it('falls back to adult for unknown slug (safe default = today behaviour)', () => {
    const demos = [
      { id: 'd1', name: 'Adult', slug: 'adult', profile_type: 'adult' as const, icon_type: '', icon_name: null, sort_order: 0, deleted_at: null },
    ]
    expect(resolveProfileType(demos, 'teen')).toBe('adult')
    expect(resolveProfileType(demos, 'ghost')).toBe('adult')
  })

  it('returns adult when the demographics list is empty', () => {
    expect(resolveProfileType([], 'anything')).toBe('adult')
  })
})
