import { describe, it, expect } from 'vitest'
import { getInitials, getDisplayName } from './name'

describe('getInitials', () => {
  it('returns first+last initials from person', () => {
    expect(getInitials({ firstname: 'John', lastname: 'Doe' })).toBe('JD')
  })

  it('handles single name', () => {
    expect(getInitials({ firstname: 'John' })).toBe('J')
  })

  it('falls back to user_metadata', () => {
    expect(getInitials({ user_metadata: { first_name: 'Jane', last_name: 'Smith' } })).toBe('JS')
  })

  it('falls back to email local part', () => {
    expect(getInitials({ email: 'john.doe@example.com' })).toBe('JO')
  })

  it('returns empty string when nothing available', () => {
    expect(getInitials({})).toBe('')
  })

  it('handles null fields', () => {
    expect(getInitials({ firstname: null, lastname: null, email: null })).toBe('')
  })
})

describe('getDisplayName', () => {
  it('prefers preferred_name over firstname', () => {
    expect(getDisplayName({ preferred_name: 'Johnny', firstname: 'John' })).toBe('Johnny')
  })

  it('falls back to firstname', () => {
    expect(getDisplayName({ firstname: 'John' })).toBe('John')
  })

  it('falls back to user_metadata first_name', () => {
    expect(getDisplayName({ user_metadata: { first_name: 'Jane' } })).toBe('Jane')
  })

  it('falls back to email local part', () => {
    expect(getDisplayName({ email: 'jane@example.com' })).toBe('jane')
  })

  it('returns Account when nothing available', () => {
    expect(getDisplayName({})).toBe('Account')
  })
})