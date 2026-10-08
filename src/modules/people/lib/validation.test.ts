import { describe, expect, it } from 'vitest'
import { personFormSchema } from './validation'

const validForm = {
  firstname: 'Jane',
  lastname: 'Doe',
  preferred_name: null,
  middle_name: null,
  email: null,
  date_of_birth: '',
  demographic: 'adult',
  gender: null,
  marital_status: null,
  school_name: null,
  kindy_start_year: null,
  school_email_permission: null,
  household_id: null,
  journey: { 'track-1': 'stage-1' },
}

describe('personFormSchema demographic', () => {
  it('accepts the seeded slugs', () => {
    for (const slug of ['adult', 'youth', 'child']) {
      expect(personFormSchema.safeParse({ ...validForm, demographic: slug }).success).toBe(true)
    }
  })

  it('accepts a custom demographic slug', () => {
    expect(personFormSchema.safeParse({ ...validForm, demographic: 'young-adult' }).success).toBe(true)
  })

  it('rejects an empty demographic with a clear message', () => {
    const result = personFormSchema.safeParse({ ...validForm, demographic: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === 'Demographic is required.')).toBe(true)
    }
  })

  it('rejects a missing demographic', () => {
    const { demographic: _demographic, ...rest } = validForm
    expect(personFormSchema.safeParse(rest).success).toBe(false)
  })
})
