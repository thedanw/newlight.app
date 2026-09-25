import { supabase } from '@/core/lib/supabase'
import type { Database, Json } from '@/core/lib/database.types'
import type { EmailAudienceType, EmailConsentCategory, EmailRecipient } from './types'

type Demographic = Database['public']['Enums']['demographic']
type AccessPermission = Database['public']['Enums']['access_permission']

type AudienceResolver = (ref: string) => Promise<EmailRecipient[]>

const presetResolvers = new Map<string, AudienceResolver>()

export function registerEmailPreset(id: string, resolver: AudienceResolver): void {
  presetResolvers.set(id, resolver)
}

export function getPresets(): string[] {
  return [...presetResolvers.keys()]
}

/**
 * Resolve a saved list to a set of email recipients.
 *
 * Reads the list's JSON conditions and queries the people table accordingly,
 * returning distinct email recipients (deduplicated by lowercase email).
 * People without an email address are skipped.
 */
export async function resolveSavedList(listId: string): Promise<EmailRecipient[]> {
  const { data: list, error: listError } = await supabase
    .from('saved_lists')
    .select('conditions')
    .eq('id', listId)
    .maybeSingle()

  if (listError) throw listError
  if (!list) throw new Error(`Saved list not found: ${listId}`)

  const conditions = list.conditions as {
    demographic?: Demographic
    accessPermission?: AccessPermission
    journeyTrackId?: string
    journeyStage?: string
    tagId?: string
  }

  let query = supabase.from('people').select('id,email,firstname,preferred_name,lastname')

  if (conditions.demographic) query = query.eq('demographic', conditions.demographic)
  if (conditions.accessPermission) query = query.eq('access_permission', conditions.accessPermission)
  if (conditions.tagId) {
    const tagged = await supabase.from('people_tags').select('person_id').eq('tag_id', conditions.tagId)
    if (tagged.error) throw tagged.error
    const personIds = (tagged.data ?? []).map((row) => row.person_id)
    if (!personIds.length) return []
    query = query.in('id', personIds)
  }
  if (conditions.journeyTrackId && conditions.journeyStage) {
    query = query.contains('journey', { [conditions.journeyTrackId]: conditions.journeyStage })
  }

  const { data: people, error } = await query.is('deleted_at', null)
  if (error) throw error

  return dedupeRecipients(
    (people ?? [])
      .filter((person) => person.email)
      .map((person) => ({
        email: person.email!,
        name: person.preferred_name
          ? `${person.preferred_name} ${person.lastname}`
          : `${person.firstname} ${person.lastname}`,
        person_id: person.id,
      })),
  )
}

/**
 * Resolve an explicit list of person IDs to email recipients.
 */
export async function resolvePeople(peopleIds: string[]): Promise<EmailRecipient[]> {
  if (peopleIds.length === 0) return []

  const { data: people, error } = await supabase
    .from('people')
    .select('id,email,firstname,preferred_name,lastname')
    .in('id', peopleIds)
    .is('deleted_at', null)

  if (error) throw error

  return dedupeRecipients(
    (people ?? [])
      .filter((person) => person.email)
      .map((person) => ({
        email: person.email!,
        name: person.preferred_name
          ? `${person.preferred_name} ${person.lastname}`
          : `${person.firstname} ${person.lastname}`,
        person_id: person.id,
      })),
  )
}

/**
 * Resolve a registered preset to email recipients.
 */
export async function resolvePreset(presetId: string): Promise<EmailRecipient[]> {
  const resolver = presetResolvers.get(presetId)
  if (!resolver) throw new Error(`Unknown email preset: ${presetId}`)
  return resolver(presetId)
}

/**
 * Resolve an audience specification to email recipients.
 */
export async function resolveAudience(audience: {
  type: EmailAudienceType
  ref?: string
  peopleIds?: string[]
}): Promise<EmailRecipient[]> {
  switch (audience.type) {
    case 'saved_list':
      if (!audience.ref) throw new Error('saved_list audience requires a ref')
      return resolveSavedList(audience.ref)
    case 'explicit':
      if (!audience.peopleIds) throw new Error('explicit audience requires peopleIds')
      return resolvePeople(audience.peopleIds)
    case 'preset':
      if (!audience.ref) throw new Error('preset audience requires a ref')
      return resolvePreset(audience.ref)
    default:
      throw new Error(`Unknown audience type: ${audience.type as string}`)
  }
}

/**
 * Filter recipients by consent for a given category.
 *
 * Fetches `people.email` and `people.consent_<category>` for each recipient.
 * Recipients whose consent is not 'yes' or who have no email are skipped.
 */
export async function filterByConsent(
  recipients: EmailRecipient[],
  consentCategory: EmailConsentCategory,
): Promise<EmailRecipient[]> {
  if (recipients.length === 0) return []

  const consentColumn = `consent_${consentCategory}` as const
  const emails = recipients.map((r) => r.email.toLowerCase())

  const { data: people, error } = await supabase
    .from('people')
    .select(`email, ${consentColumn}`)
    .in('email', emails)
    .is('deleted_at', null)
    .returns<
      Array<{
        email: string
        [k: string]: Json | null
      }>
    >()

  if (error) throw error

  const consentSet = new Set(
    (people ?? [])
      .filter((person) => person[consentColumn] === 'yes')
      .map((person) => person.email.toLowerCase()),
  )

  return recipients.filter((r) => consentSet.has(r.email.toLowerCase()))
}

/**
 * Deduplicate recipients by lowercase email, preserving first occurrence order.
 */
export function dedupeRecipients(recipients: EmailRecipient[]): EmailRecipient[] {
  const seen = new Set<string>()
  const result: EmailRecipient[] = []
  for (const recipient of recipients) {
    const key = recipient.email.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      result.push(recipient)
    }
  }
  return result
}
