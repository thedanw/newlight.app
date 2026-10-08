import { describe, expect, it } from 'vitest'
import { slugify } from './slug'

describe('slugify', () => {
  it('lowercases and hyphenates a label', () => {
    expect(slugify('Not Started')).toBe('not-started')
  })

  it('trims and strips leading/trailing hyphens', () => {
    expect(slugify('  Young Families!! ')).toBe('young-families')
  })

  it('collapses runs of non-alphanumerics into one hyphen', () => {
    expect(slugify('Young   Adults & Kids')).toBe('young-adults-kids')
  })

  it('returns an empty string for a blank label', () => {
    expect(slugify('   ')).toBe('')
  })
})
