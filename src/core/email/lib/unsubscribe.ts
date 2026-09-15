import { supabase } from '@/core/lib/supabase'
import { hashEmail } from './sending'

/**
 * Generate a random unsubscribe token (opaque, not derived from email).
 * Uses 256 bits of entropy from the Web Crypto API, base64url encoded.
 */
export function generateUnsubscribeToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes)
}

/**
 * Hash a token for storage using SHA-256.
 * The raw token is never stored; only this hash is persisted.
 */
export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Create an unsubscribe link for a given email.
 *
 * The `sendId` is optional — when provided, the unsubscribe is scoped to a
 * specific send. When omitted, the unsubscribe applies globally.
 */
export function createUnsubscribeLink(email: string, sendId?: string): string {
  const token = generateUnsubscribeToken()
  const params = new URLSearchParams({
    email: btoa(email.toLowerCase()),
    token,
  })
  if (sendId) params.set('sendId', sendId)
  return `/email/unsubscribe?${params.toString()}`
}

/**
 * Verify an unsubscribe token against stored hashes.
 *
 * Returns `{ email, sendId }` if the token is valid, or `null` if it has
 * expired or doesn't match any stored record.
 *
 * In the MVP, tokens do not expire. The raw token is compared against the
 * `token_hash` column (SHA-256 of the raw token).
 */
export async function verifyUnsubscribeToken(token: string): Promise<{ email: string; sendId: string | null } | null> {
  const tokenHash = await hashToken(token)

  const { data, error } = await supabase
    .from('email_unsubscribes')
    .select('email_hash,send_id')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    email: data.email_hash,
    sendId: data.send_id,
  }
}

/**
 * Record an unsubscribe for an email address.
 *
 * Computes the email hash, stores the token hash, and optionally associates
 * the unsubscribe with a specific send. Idempotent: if the token hash already
 * exists (due to the UNIQUE constraint on `token_hash`), the insert is treated
 * as a no-op.
 */
export async function recordUnsubscribe(
  email: string,
  token: string,
  sendId: string | null = null,
  reason: string | null = null,
): Promise<boolean> {
  const emailHash = await hashEmail(email)
  const tokenHash = await hashToken(token)

  const { error } = await supabase.from('email_unsubscribes').insert({
    id: crypto.randomUUID(),
    email_hash: emailHash,
    token_hash: tokenHash,
    send_id: sendId,
    reason,
    unsubscribed_at: new Date().toISOString(),
  })

  if (error) {
    const pgError = error as { code?: string }
    if (pgError.code === '23505') return true
    throw error
  }
  return true
}

function base64UrlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Check if an email is currently suppressed (has an unsubscribe record).
 */
export async function isEmailSuppressed(email: string): Promise<boolean> {
  const emailHash = await hashEmail(email)
  const { data, error } = await supabase
    .from('email_unsubscribes')
    .select('email_hash')
    .eq('email_hash', emailHash)
    .maybeSingle()

  if (error) throw error
  return data !== null
}
