import { describe, it, expect } from 'vitest'
import { deriveProfilePermissions } from './profile-permissions'

describe('deriveProfilePermissions', () => {
  describe('admin operator viewing another person', () => {
    const result = deriveProfilePermissions('admin', false)

    it('isAdmin is true', () => {
      expect(result.isAdmin).toBe(true)
    })

    it('canEdit is true (admin can edit any profile)', () => {
      expect(result.canEdit).toBe(true)
    })

    it('canManageTags is true', () => {
      expect(result.canManageTags).toBe(true)
    })

    it('canManageJourney is true', () => {
      expect(result.canManageJourney).toBe(true)
    })

    it('canManageGuardians is true', () => {
      expect(result.canManageGuardians).toBe(true)
    })

    it('canEditChildSafety is true', () => {
      expect(result.canEditChildSafety).toBe(true)
    })

    it('canEditAdminFields is true', () => {
      expect(result.canEditAdminFields).toBe(true)
    })

    it('canDelete is true (admin viewing another person)', () => {
      expect(result.canDelete).toBe(true)
    })
  })

  describe('super_admin operator viewing another person', () => {
    const result = deriveProfilePermissions('super_admin', false)

    it('isAdmin is true', () => {
      expect(result.isAdmin).toBe(true)
    })

    it('canDelete is true', () => {
      expect(result.canDelete).toBe(true)
    })
  })

  describe('self-view (user viewing own profile)', () => {
    const result = deriveProfilePermissions('team_leaders', true)

    it('isSelf is true', () => {
      expect(result.isSelf).toBe(true)
    })

    it('isAdmin is false', () => {
      expect(result.isAdmin).toBe(false)
    })

    it('canEdit is true (self can edit their own profile)', () => {
      expect(result.canEdit).toBe(true)
    })

    it('canManageTags is false (only admin)', () => {
      expect(result.canManageTags).toBe(false)
    })

    it('canManageJourney is false (only admin)', () => {
      expect(result.canManageJourney).toBe(false)
    })

    it('canManageGuardians is false (only admin)', () => {
      expect(result.canManageGuardians).toBe(false)
    })

    it('canEditChildSafety is false (admin only)', () => {
      expect(result.canEditChildSafety).toBe(false)
    })

    it('canEditAdminFields is false (admin only)', () => {
      expect(result.canEditAdminFields).toBe(false)
    })

    it('canDelete is false (cannot delete self)', () => {
      expect(result.canDelete).toBe(false)
    })
  })

  describe('non-admin, non-self viewer', () => {
    const result = deriveProfilePermissions('member_area', false)

    it('isAdmin is false', () => {
      expect(result.isAdmin).toBe(false)
    })

    it('canEdit is false (not admin, not self)', () => {
      expect(result.canEdit).toBe(false)
    })

    it('canManageTags is false', () => {
      expect(result.canManageTags).toBe(false)
    })

    it('canManageJourney is false', () => {
      expect(result.canManageJourney).toBe(false)
    })

    it('canManageGuardians is false', () => {
      expect(result.canManageGuardians).toBe(false)
    })

    it('canEditChildSafety is false', () => {
      expect(result.canEditChildSafety).toBe(false)
    })

    it('canEditAdminFields is false', () => {
      expect(result.canEditAdminFields).toBe(false)
    })

    it('canDelete is false', () => {
      expect(result.canDelete).toBe(false)
    })
  })

  describe('public permission viewer', () => {
    const result = deriveProfilePermissions('public', false)

    it('everything is false', () => {
      expect(result.isAdmin).toBe(false)
      expect(result.canEdit).toBe(false)
      expect(result.canManageTags).toBe(false)
      expect(result.canManageJourney).toBe(false)
      expect(result.canManageGuardians).toBe(false)
      expect(result.canEditChildSafety).toBe(false)
      expect(result.canEditAdminFields).toBe(false)
      expect(result.canDelete).toBe(false)
    })
  })

  describe('null operator permission (unknown)', () => {
    const result = deriveProfilePermissions(null, false)

    it('all flags are false (deny by default)', () => {
      expect(result.isAdmin).toBe(false)
      expect(result.canEdit).toBe(false)
      expect(result.canManageTags).toBe(false)
      expect(result.canManageJourney).toBe(false)
      expect(result.canManageGuardians).toBe(false)
      expect(result.canEditChildSafety).toBe(false)
      expect(result.canEditAdminFields).toBe(false)
      expect(result.canDelete).toBe(false)
    })
  })
})
