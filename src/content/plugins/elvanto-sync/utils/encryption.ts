/**
 * Encryption Utility — AES-GCM encryption for sensitive data
 * Uses Web Crypto API (available in browser and Edge Functions)
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits for GCM

/**
 * Get encryption key from environment
 * In production: ELVANTO_ENCRYPTION_KEY (32-byte base64)
 * In development: fallback to a derived key (NOT SECURE - dev only)
 */
function getEncryptionKey(): CryptoKey | Promise<CryptoKey> {
  const envKey = import.meta.env.VITE_ELVANTO_ENCRYPTION_KEY || 
                 (typeof process !== 'undefined' ? process.env.ELVANTO_ENCRYPTION_KEY : undefined)
  
  if (envKey) {
    // Import the base64-encoded key
    const keyData = base64ToArrayBuffer(envKey)
    return crypto.subtle.importKey(
      'raw',
      keyData,
      { name: ALGORITHM },
      false,
      ['encrypt', 'decrypt']
    )
  }
  
  // DEVELOPMENT ONLY - derive from a fixed string (NOT SECURE)
  if (import.meta.env.DEV) {
    const devKey = 'dev-key-elvanto-sync-plugin-change-in-production'
    const keyData = new TextEncoder().encode(devKey.padEnd(32, '0').slice(0, 32))
    return crypto.subtle.importKey(
      'raw',
      keyData,
      { name: ALGORITHM },
      false,
      ['encrypt', 'decrypt']
    )
  }
  
  throw new Error('ELVANTO_ENCRYPTION_KEY environment variable not set')
}

/**
 * Encrypt plaintext string
 * Returns base64(iv + ciphertext + authTag)
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoded = new TextEncoder().encode(plaintext)
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  )
  
  // Combine iv + ciphertext (which includes authTag at the end for AES-GCM)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  
  return arrayBufferToBase64(combined)
}

/**
 * Decrypt ciphertext string
 * Expects base64(iv + ciphertext + authTag)
 */
export async function decrypt(ciphertextB64: string): Promise<string> {
  const key = await getEncryptionKey()
  const combined = base64ToArrayBuffer(ciphertextB64)
  
  if (combined.byteLength < IV_LENGTH) {
    throw new Error('Invalid ciphertext: too short')
  }
  
  const iv = combined.slice(0, IV_LENGTH)
  const ciphertext = combined.slice(IV_LENGTH)
  
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  )
  
  return new TextDecoder().decode(decrypted)
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Generate a new 32-byte encryption key (base64)
 * Run this once to generate ELVANTO_ENCRYPTION_KEY for production
 */
export async function generateEncryptionKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  )
  
  const exported = await crypto.subtle.exportKey('raw', key)
  return arrayBufferToBase64(exported)
}