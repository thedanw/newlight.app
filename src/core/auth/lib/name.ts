/**
 * NameSource — person row fields + auth user fallbacks used to derive
 * display name and initials for the account tile / profile.
 */
export interface NameSource {
  firstname?: string | null
  lastname?: string | null
  preferred_name?: string | null
  user_metadata?: Record<string, unknown> | null
  email?: string | null
}

function metaString(meta: Record<string, unknown> | null | undefined, key: string): string | undefined {
  const value = meta?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function emailLocal(email: string | null | undefined): string {
  return email?.split('@')[0]?.trim() ?? ''
}

/** Initials from first+last name; falls back to user_metadata then email local part. */
export function getInitials(source: NameSource): string {
  const first = source.firstname?.trim() || metaString(source.user_metadata, 'first_name')
  const last = source.lastname?.trim() || metaString(source.user_metadata, 'last_name')
  if (first && last) return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
  if (first) return first.charAt(0).toUpperCase()
  if (last) return last.charAt(0).toUpperCase()
  return emailLocal(source.email).slice(0, 2).toUpperCase()
}

/** Display name: preferred_name ?? firstname; falls back to user_metadata then email local part. */
export function getDisplayName(source: NameSource): string {
  const preferred = source.preferred_name?.trim()
  if (preferred) return preferred
  const first = source.firstname?.trim()
  if (first) return first
  const metaFirst = metaString(source.user_metadata, 'first_name')
  if (metaFirst) return metaFirst
  const local = emailLocal(source.email)
  return local || 'Account'
}