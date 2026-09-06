import { describe, it, expect } from 'vitest'
import { getAccountTileState } from './tile-state'

describe('getAccountTileState', () => {
  it('returns account when user is signed in', () => {
    expect(getAccountTileState({ id: 'user-1' })).toBe('account')
  })

  it('returns login when user is null', () => {
    expect(getAccountTileState(null)).toBe('login')
  })

  it('returns login when user is undefined', () => {
    expect(getAccountTileState(undefined)).toBe('login')
  })
})