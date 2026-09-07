const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Validate the login identifier (email). Returns an error message or null. */
export function validateIdentifier(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Email is required.'
  if (!EMAIL_RE.test(trimmed)) return 'Enter a valid email address.'
  return null
}