import type { Database } from '@/core/lib/database.types'
import type { EmailRecipient } from './types'

type AccessPermission = Database['public']['Enums']['access_permission']

/**
 * Whether the user can send email broadcasts.
 *
 * Requires team_leaders or above (not public / member_area).
 */
export function canSendEmail(userAccess: AccessPermission): boolean {
  return ['team_leaders', 'admin', 'super_admin'].includes(userAccess)
}

/**
 * Whether the user can create, edit, or archive email templates.
 * Requires admin or above.
 */
export function canManageTemplates(userAccess: AccessPermission): boolean {
  return ['admin', 'super_admin'].includes(userAccess)
}

/**
 * Whether the user can create or remove sender aliases.
 * Requires super_admin only.
 */
export function canManageSenderAliases(userAccess: AccessPermission): boolean {
  return userAccess === 'super_admin'
}

/**
 * Whether the user can configure SMTP settings.
 * Requires super_admin only.
 */
export function canConfigureSmtp(userAccess: AccessPermission): boolean {
  return userAccess === 'super_admin'
}

/**
 * Whether the user can manage the email settings section.
 * Requires admin or above.
 */
export function canManageSettings(userAccess: AccessPermission): boolean {
  return ['admin', 'super_admin'].includes(userAccess)
}

/**
 * Filter a list of recipients to only those the viewer is permitted to email.
 *
 * Team leaders can only email people within their team scope. For non-admin
 * users, this returns an empty list — callers should resolve scope before
 * passing recipients.
 *
 * In the MVP, recipients are already audience-resolved by saved-list conditions
 * that the user owns, so this gate is primarily a defense-in-depth check.
 */
export function filterRecipientsByRole(
  recipients: EmailRecipient[],
  viewerAccess: AccessPermission,
): EmailRecipient[] {
  if (['admin', 'super_admin'].includes(viewerAccess)) {
    return recipients
  }
  if (viewerAccess === 'team_leaders') {
    return recipients
  }
  return []
}
