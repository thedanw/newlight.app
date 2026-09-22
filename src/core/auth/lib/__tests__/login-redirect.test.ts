import { describe, expect, it } from 'vitest'
import { getPostLoginTarget } from '../login-redirect'

describe('getPostLoginTarget', () => {
  it('returns /people when there is no stashed origin', () => {
    expect(getPostLoginTarget(null)).toBe('/people')
    expect(getPostLoginTarget(undefined)).toBe('/people')
    expect(getPostLoginTarget({})).toBe('/people')
  })

  it('returns the stashed origin path so deep links survive login', () => {
    expect(getPostLoginTarget({ from: '/settings/integrations/elvanto-sync' })).toBe(
      '/settings/integrations/elvanto-sync',
    )
    expect(getPostLoginTarget({ from: '/people/0f120a77-b02e-4b15-ae6e-1afe0a4f7119' })).toBe(
      '/people/0f120a77-b02e-4b15-ae6e-1afe0a4f7119',
    )
  })

  it('rejects open-redirect payloads', () => {
    expect(getPostLoginTarget({ from: 'https://evil.example' })).toBe('/people')
    expect(getPostLoginTarget({ from: '//evil.example' })).toBe('/people')
    expect(getPostLoginTarget({ from: 'javascript:alert(1)' })).toBe('/people')
    expect(getPostLoginTarget({ from: 42 })).toBe('/people')
  })
})
