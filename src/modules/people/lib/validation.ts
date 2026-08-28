import { z } from 'zod'

export const personFormSchema = z.object({
  firstname: z.string().trim().min(1, 'First name is required.'),
  lastname: z.string().trim().min(1, 'Last name is required.'),
  preferred_name: z.string().nullable(),
  middle_name: z.string().nullable(),
  email: z.union([z.string().email('Enter a valid email address.'), z.literal(''), z.null()]),
  date_of_birth: z.union([z.string().date('Enter a valid date of birth.'), z.literal(''), z.null()]).refine((date) => !date || date <= new Date().toISOString().slice(0, 10), 'Date of birth cannot be in the future.'),
  demographic: z.enum(['adult', 'youth', 'child']),
  gender: z.enum(['male', 'female']).nullable(),
  marital_status: z.enum(['single', 'engaged', 'married', 'partner', 'widowed', 'divorced', 'separated']).nullable(),
  school_name: z.string().nullable(),
  kindy_start_year: z.number().int().nullable(),
  school_email_permission: z.enum(['yes', 'no']).nullable(),
  household_id: z.string().uuid().nullable(),
  journey: z.record(z.string(), z.string()).refine((journey) => Object.keys(journey).length > 0, 'Assign at least one journey track.'),
})

export type PersonFormValue = z.infer<typeof personFormSchema>