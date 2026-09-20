import { describe, expect, it } from 'vitest'
import { isSettingsTileVisible, isSuperAdminPermission } from './permissions'

type Person = Parameters<typeof isSettingsTileVisible>[0]

function personWith(permission: string | null): Person {
  return { access_permission: permission } as unknown as Person
}

describe('isSuperAdminPermission', () => {
  it('is true only for super_admin', () => {
    expect(isSuperAdminPermission('super_admin')).toBe(true)
  })

  it('is false for every other tier and null/undefined', () => {
    for (const p of ['public', 'member_area', 'team_leaders', 'admin', null, undefined]) {
      expect(isSuperAdminPermission(p as never)).toBe(false)
    }
  })
})

describe('isSettingsTileVisible (fail closed)', () => {
  it('hidden for a plain member', () => {
    expect(isSettingsTileVisible(personWith('member_area'), false)).toBe(false)
  })

  it('hidden for an admin (settings are super-admin only)', () => {
    expect(isSettingsTileVisible(personWith('admin'), false)).toBe(false)
  })

  it('hidden for signed-out visitors (no person)', () => {
    expect(isSettingsTileVisible(null, false)).toBe(false)
  })

  it('hidden while the profile is still loading, even for a super admin', () => {
    expect(isSettingsTileVisible(personWith('super_admin'), true)).toBe(false)
  })

  it('visible for a resolved super admin', () => {
    expect(isSettingsTileVisible(personWith('super_admin'), false)).toBe(true)
  })
})
