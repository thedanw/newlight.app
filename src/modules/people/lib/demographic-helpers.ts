import type { Demographic } from './types'

/** profile_type of the demographic matching the person's slug; 'adult' as safe default (today's behaviour). */
export function resolveProfileType(demographics: Demographic[], slug: string): Demographic['profile_type'] {
  const match = demographics.find((d) => d.slug === slug)
  if (match) return match.profile_type
  return 'adult'
}
