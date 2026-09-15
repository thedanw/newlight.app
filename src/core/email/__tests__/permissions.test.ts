import { describe, expect, it } from 'vitest'
import {
  canConfigureSmtp,
  canManageSenderAliases,
  canManageSettings,
  canManageTemplates,
  canSendEmail,
  filterRecipientsByRole,
} from '../lib/permissions'

describe('email permissions (Batch 4)', () => {
  describe('canSendEmail', () => {
    it('allows team_leaders', () => {
      expect(canSendEmail('team_leaders')).toBe(true)
    })

    it('allows admin', () => {
      expect(canSendEmail('admin')).toBe(true)
    })

    it('allows super_admin', () => {
      expect(canSendEmail('super_admin')).toBe(true)
    })

    it('denies public', () => {
      expect(canSendEmail('public')).toBe(false)
    })

    it('denies member_area', () => {
      expect(canSendEmail('member_area')).toBe(false)
    })
  })

  describe('canManageTemplates', () => {
    it('allows admin', () => {
      expect(canManageTemplates('admin')).toBe(true)
    })

    it('allows super_admin', () => {
      expect(canManageTemplates('super_admin')).toBe(true)
    })

    it('denies team_leaders', () => {
      expect(canManageTemplates('team_leaders')).toBe(false)
    })

    it('denies public', () => {
      expect(canManageTemplates('public')).toBe(false)
    })

    it('denies member_area', () => {
      expect(canManageTemplates('member_area')).toBe(false)
    })
  })

  describe('canManageSenderAliases', () => {
    it('allows super_admin only', () => {
      expect(canManageSenderAliases('super_admin')).toBe(true)
    })

    it('denies admin', () => {
      expect(canManageSenderAliases('admin')).toBe(false)
    })

    it('denies team_leaders', () => {
      expect(canManageSenderAliases('team_leaders')).toBe(false)
    })
  })

  describe('canConfigureSmtp', () => {
    it('allows super_admin only', () => {
      expect(canConfigureSmtp('super_admin')).toBe(true)
    })

    it('denies admin', () => {
      expect(canConfigureSmtp('admin')).toBe(false)
    })

    it('denies team_leaders', () => {
      expect(canConfigureSmtp('team_leaders')).toBe(false)
    })
  })

  describe('canManageSettings', () => {
    it('allows admin', () => {
      expect(canManageSettings('admin')).toBe(true)
    })

    it('allows super_admin', () => {
      expect(canManageSettings('super_admin')).toBe(true)
    })

    it('denies team_leaders', () => {
      expect(canManageSettings('team_leaders')).toBe(false)
    })

    it('denies public', () => {
      expect(canManageSettings('public')).toBe(false)
    })
  })

  describe('filterRecipientsByRole', () => {
    const recipients = [
      { email: 'a@example.org', name: 'A' },
      { email: 'b@example.org', name: 'B' },
    ]

    it('returns all recipients for admin', () => {
      expect(filterRecipientsByRole(recipients, 'admin')).toHaveLength(2)
    })

    it('returns all recipients for super_admin', () => {
      expect(filterRecipientsByRole(recipients, 'super_admin')).toHaveLength(2)
    })

    it('returns all recipients for team_leaders (audience-resolved)', () => {
      expect(filterRecipientsByRole(recipients, 'team_leaders')).toHaveLength(2)
    })

    it('returns empty for member_area', () => {
      expect(filterRecipientsByRole(recipients, 'member_area')).toEqual([])
    })

    it('returns empty for public', () => {
      expect(filterRecipientsByRole(recipients, 'public')).toEqual([])
    })
  })
})
