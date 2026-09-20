import { describe, expect, it } from 'vitest'
import { canChangePassword, canEditRole, canSendMagicLink, isAccessCardVisible } from './account-access-permissions'
describe('account access gating', () => {
  it('owner always sees card + password', () => {
    expect(isAccessCardVisible('member_area', true)).toBe(true)
    expect(canChangePassword('member_area', true)).toBe(true)
  })
  it('member viewing others sees nothing extra', () => {
    expect(isAccessCardVisible('member_area', false)).toBe(false)
    expect(canSendMagicLink('member_area')).toBe(false)
    expect(canEditRole('member_area')).toBe(false)
  })
  it('team leader gets magic link only', () => {
    expect(isAccessCardVisible('team_leaders', false)).toBe(true)
    expect(canSendMagicLink('team_leaders')).toBe(true)
    expect(canChangePassword('team_leaders', false)).toBe(false)
    expect(canEditRole('team_leaders')).toBe(false)
  })
  it('admin gets password + magic + role', () => {
    expect(canChangePassword('admin', false)).toBe(true)
    expect(canSendMagicLink('admin')).toBe(true)
    expect(canEditRole('admin')).toBe(true)
  })
  it('super admin also qualifies everywhere', () => {
    expect(isAccessCardVisible('super_admin', false)).toBe(true)
    expect(canChangePassword('super_admin', false)).toBe(true)
    expect(canSendMagicLink('super_admin')).toBe(true)
    expect(canEditRole('super_admin')).toBe(true)
  })
})
