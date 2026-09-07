import { describe, it, expect } from 'vitest'
import { validateIdentifier } from './validation'

describe('validateIdentifier', () => {
  it('returns null for a valid email', () => {
    expect(validateIdentifier('john@example.com')).toBeNull()
  })

  it('returns error for empty', () => {
    expect(validateIdentifier('')).toBe('Email is required.')
  })

  it('returns error for whitespace only', () => {
    expect(validateIdentifier('   ')).toBe('Email is required.')
  })

  it('returns error for invalid email', () => {
    expect(validateIdentifier('not-an-email')).toBe('Enter a valid email address.')
  })

  it('trims surrounding whitespace', () => {
    expect(validateIdentifier('  john@example.com  ')).toBeNull()
  })
})