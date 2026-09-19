import { supabase } from '@/core/lib/supabase'
import type { Json } from '@/core/lib/database.types'
import type { HouseholdDetails, JourneyGrid, JourneyStage, JourneyTrack, JourneyTrackCategory, PeopleListOptions, Person, PersonPublic, PersonRelationship, PersonWithJourney, Tag } from './types'

const DEFAULT_PAGE_SIZE = 50

export type PersonInput = Pick<Person, 'firstname' | 'lastname' | 'demographic' | 'preferred_name' | 'middle_name' | 'email' | 'date_of_birth' | 'gender' | 'marital_status' | 'school_name' | 'kindy_start_year' | 'school_email_permission' | 'household_id' | 'journey'> & Partial<Pick<Person, 'access_permission' | 'date_professed' | 'legacy_date_added' | 'legacy_member_id'>>

export async function getCurrentOperatorPermission(): Promise<Person['access_permission'] | null> {
  const { data: userResult, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!userResult.user) return null
  const { data, error } = await supabase.from('people').select('access_permission').eq('auth_user_id', userResult.user.id).maybeSingle()
  if (error) throw error
  if (data?.access_permission) return data.access_permission

  const email = userResult.user.email
  if (!email) return null
  const byEmail = await supabase.from('people').select('access_permission').eq('email', email)
  if (byEmail.error) throw byEmail.error
  return byEmail.data?.[0]?.access_permission ?? null
}

export async function createPerson(input: PersonInput): Promise<Person> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('people')
    .insert({
      ...input,
      id: crypto.randomUUID(),
      access_permission: 'member_area',
      custom_fields: null,
      deleted_at: null,
      elvanto_id: null,
      auth_user_id: null,
      mobile: null,
      picture_url: null,
      _synced_at: now,
      _source_modified: now,
    })
    .select('*')
    .single()
  if (error) throw error
  await Promise.all([
    writePeopleAudit(data.id, 'demographic', null, data.demographic),
    writePeopleAudit(data.id, 'journey_track', null, data.journey),
  ])
  return data
}

export async function updatePerson(id: string, input: Partial<PersonInput>): Promise<Person> {
  const previous = await getPersonById(id)
  if (!previous) throw new Error('Person not found')
  const { data, error } = await supabase
    .from('people')
    .update({ ...input, _source_modified: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  const auditWrites = []
  if (input.demographic !== undefined && input.demographic !== previous.demographic) {
    auditWrites.push(writePeopleAudit(id, 'demographic', previous.demographic, data.demographic))
  }
  if (input.journey !== undefined && JSON.stringify(input.journey) !== JSON.stringify(previous.journey)) {
    auditWrites.push(writePeopleAudit(id, 'journey_track', previous.journey, data.journey))
  }
  await Promise.all(auditWrites)
  return data
}

export async function writePeopleAudit(personId: string, fieldChanged: string, oldValue: Json | null, newValue: Json | null) {
  const { error } = await supabase.from('people_audit').insert({
    id: crypto.randomUUID(),
    person_id: personId,
    field_changed: fieldChanged,
    old_value: oldValue,
    new_value: newValue,
    change_reason: 'manual',
    changed_by: null,
    changed_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function getHouseholds(): Promise<NonNullable<HouseholdDetails>[]> {
  const { data, error } = await supabase.from('households').select('*').is('deleted_at', null).order('name')
  if (error) throw error
  return (data ?? []).map((household) => ({ ...household, address: null, members: [] }))
}

export async function createHousehold(name: string): Promise<NonNullable<HouseholdDetails>> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('households')
    .insert({ id: crypto.randomUUID(), name: name.trim(), elvanto_family_id: null, deleted_at: null, _synced_at: now })
    .select('*')
    .single()
  if (error) throw error
  return { ...data, address: null, members: [] }
}

export async function saveHouseholdAddress(householdId: string, address: { line1: string | null; line2: string | null; suburb: string | null; state: string | null; postcode: string | null }): Promise<NonNullable<HouseholdDetails>['address']> {
  const existing = await supabase.from('addresses').select('id').eq('household_id', householdId).eq('kind', 'home').maybeSingle()
  if (existing.error) throw existing.error
  const values = { ...address, household_id: householdId, kind: 'home' as const, _synced_at: new Date().toISOString() }
  const query = existing.data
    ? supabase.from('addresses').update(values).eq('id', existing.data.id)
    : supabase.from('addresses').insert({ ...values, id: crypto.randomUUID() })
  const { data, error } = await query.select('*').single()
  if (error) throw error
  return data
}

export async function getPeopleList(options: PeopleListOptions = {}): Promise<PersonWithJourney[]> {
  let query = supabase
    .from('people')
    .select('*')
    .is('deleted_at', null)
    .order('lastname', { ascending: true })
    .order('firstname', { ascending: true })
    .range(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? DEFAULT_PAGE_SIZE) - 1)

  if (options.demographic) query = query.eq('demographic', options.demographic)
  if (options.accessPermission) query = query.eq('access_permission', options.accessPermission)
  if (options.tagId) {
    const tagged = await supabase.from('people_tags').select('person_id').eq('tag_id', options.tagId)
    if (tagged.error) throw tagged.error
    const personIds = (tagged.data ?? []).map((row) => row.person_id)
    if (!personIds.length) return []
    query = query.in('id', personIds)
  }
  if (options.journeyTrackId && options.journeyStage) {
    query = query.contains('journey', { [options.journeyTrackId]: options.journeyStage })
  }

  const { data, error } = await query
  if (error) throw error

  const people = data ?? []
  const householdIds = [...new Set(people.flatMap((person) => person.household_id ? [person.household_id] : []))]
  if (householdIds.length === 0) return people.map((person) => ({ ...person, household: null }))

  const { data: households, error: householdError } = await supabase
    .from('households')
    .select('*')
    .in('id', householdIds)
  if (householdError) throw householdError

  const householdById = new Map((households ?? []).map((household) => [household.id, household]))
  return people.map((person) => ({ ...person, household: person.household_id ? householdById.get(person.household_id) ?? null : null }))
}

export async function getPersonById(id: string): Promise<Person | null> {
  const { data, error } = await supabase.from('people').select('*').eq('id', id).is('deleted_at', null).maybeSingle()
  if (error) throw error
  return data
}

export async function getPublicPersonById(id: string): Promise<PersonPublic | null> {
  const { data, error } = await supabase.from('people_public').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function getPublicPeopleList(options: PeopleListOptions = {}): Promise<PersonPublic[]> {
  let query = supabase
    .from('people_public')
    .select('*')
    .order('firstname', { ascending: true })
    .range(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? DEFAULT_PAGE_SIZE) - 1)

  if (options.demographic) query = query.eq('demographic', options.demographic)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getHouseholdById(id: string): Promise<HouseholdDetails | null> {
  const [householdResult, addressResult, membersResult] = await Promise.all([
    supabase.from('households').select('*').eq('id', id).is('deleted_at', null).maybeSingle(),
    supabase.from('addresses').select('*').eq('household_id', id).eq('kind', 'home').maybeSingle(),
    supabase.from('people').select('*').eq('household_id', id).is('deleted_at', null).order('lastname'),
  ])
  if (householdResult.error) throw householdResult.error
  if (addressResult.error) throw addressResult.error
  if (membersResult.error) throw membersResult.error
  if (!householdResult.data) return null
  return { ...householdResult.data, address: addressResult.data, members: membersResult.data ?? [] }
}

export async function getJourneyGrid(): Promise<JourneyGrid> {
  const [tracksResult, stagesResult, peopleResult, tagsResult] = await Promise.all([
    supabase.from('journey_tracks').select('*').is('deleted_at', null).order('sort_order'),
    supabase.from('journey_stages').select('*').order('sort_order'),
    supabase.from('people').select('*').is('deleted_at', null).order('lastname'),
    supabase.from('people_tags').select('person_id, tag_id'),
  ])
  if (tracksResult.error) throw tracksResult.error
  if (stagesResult.error) throw stagesResult.error
  if (peopleResult.error) throw peopleResult.error
  if (tagsResult.error) throw tagsResult.error
  const tagIds = [...new Set((tagsResult.data ?? []).map((row) => row.tag_id))]
  const tags = tagIds.length ? await supabase.from('tags').select('*').in('id', tagIds) : { data: [], error: null }
  if (tags.error) throw tags.error
  const tagById = new Map((tags.data ?? []).map((tag) => [tag.id, tag]))
  const tagsByPerson: Record<string, Tag[]> = {}
  for (const row of tagsResult.data ?? []) {
    const tag = tagById.get(row.tag_id)
    if (tag) (tagsByPerson[row.person_id] ??= []).push(tag)
  }
  return { tracks: tracksResult.data ?? [], stages: stagesResult.data ?? [], people: peopleResult.data ?? [], tagsByPerson }
}

export async function updatePersonJourney(id: string, journey: Person['journey']): Promise<Person> {
  return updatePerson(id, { journey })
}

export async function getJourneyTracks(): Promise<JourneyGrid['tracks']> {
  const { data, error } = await supabase.from('journey_tracks').select('*').is('deleted_at', null).order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function getJourneyStages(): Promise<JourneyGrid['stages']> {
  const { data, error } = await supabase.from('journey_stages').select('*').order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function getJourneyCategories(): Promise<JourneyTrackCategory[]> {
  const { data, error } = await supabase.from('journey_track_categories').select('*').order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function getJourneySettings(): Promise<{ tracks: JourneyTrack[]; categories: JourneyTrackCategory[]; stages: JourneyStage[] }> {
  const [tracks, categories, stages] = await Promise.all([
    supabase.from('journey_tracks').select('*').is('deleted_at', null).order('sort_order'),
    supabase.from('journey_track_categories').select('*').order('sort_order'),
    supabase.from('journey_stages').select('*').order('sort_order'),
  ])
  if (tracks.error) throw tracks.error
  if (categories.error) throw categories.error
  if (stages.error) throw stages.error
  return { tracks: tracks.data ?? [], categories: categories.data ?? [], stages: stages.data ?? [] }
}

export async function saveJourneyTrack(track: Pick<JourneyTrack, 'id' | 'name' | 'category_id' | 'sort_order'>): Promise<JourneyTrack> {
  if (!track.name.trim()) throw new Error('Track name is required.')
  const { data, error } = await supabase.from('journey_tracks').upsert({ ...track, deleted_at: null }).select('*').single()
  if (error) throw error
  return data
}

export async function createJourneyTrack(name: string, categoryId: string | null, sortOrder: number): Promise<JourneyTrack> {
  return saveJourneyTrack({ id: crypto.randomUUID(), name: name.trim(), category_id: categoryId, sort_order: sortOrder })
}

export async function saveJourneyCategory(category: JourneyTrackCategory): Promise<JourneyTrackCategory> {
  if (!category.name.trim()) throw new Error('Category name is required.')
  if (category.parent_id === category.id) throw new Error('A category cannot be its own parent.')
  const { data, error } = await supabase.from('journey_track_categories').upsert(category).select('*').single()
  if (error) throw error
  return data
}

export async function createJourneyCategory(name: string, parentId: string | null, sortOrder: number): Promise<JourneyTrackCategory> {
  return saveJourneyCategory({ id: crypto.randomUUID(), name: name.trim(), parent_id: parentId, sort_order: sortOrder })
}

export async function saveJourneyStage(stage: JourneyStage): Promise<JourneyStage> {
  if (!stage.slug.trim() || !stage.label.trim()) throw new Error('Stage slug and label are required.')
  const { data, error } = await supabase.from('journey_stages').upsert(stage).select('*').single()
  if (error) throw error
  return data
}

export async function createJourneyStage(slug: string, label: string, sortOrder: number): Promise<JourneyStage> {
  return saveJourneyStage({ id: crypto.randomUUID(), slug: slug.trim(), label: label.trim(), color: null, sort_order: sortOrder, is_terminal: false })
}

const seededJourneyStageIds = new Set([
  'a1b2c3d4-0000-4000-8000-000000000001', // contact
  'a1b2c3d4-0000-4000-8000-000000000002', // guest
  'a1b2c3d4-0000-4000-8000-000000000003', // linked
  'a1b2c3d4-0000-4000-8000-000000000004', // regular
  'a1b2c3d4-0000-4000-8000-000000000005', // archived
  'a1b2c3d4-0000-4000-8000-000000000006', // deleted_privacy_data
])

export async function deleteJourneyStage(stageId: string): Promise<void> {
  if (seededJourneyStageIds.has(stageId)) throw new Error('Seeded journey stages cannot be deleted.')
  const { error } = await supabase.from('journey_stages').delete().eq('id', stageId)
  if (error) throw error
}

export async function deleteJourneyCategory(categoryId: string, migrationTargetId: string | null): Promise<void> {
  if (!migrationTargetId) {
    const { count, error: countError } = await supabase.from('journey_tracks').select('id', { count: 'exact', head: true }).eq('category_id', categoryId).is('deleted_at', null)
    if (countError) throw countError
    if ((count ?? 0) > 0) throw new Error('Category has tracks. Choose a migration target or move tracks first.')
  }
  const { error } = await supabase.from('journey_track_categories').delete().eq('id', categoryId)
  if (error) throw error
}

export async function deleteJourneyTrack(trackId: string, migrationTargetId: string): Promise<void> {
  if (!migrationTargetId || migrationTargetId === trackId) throw new Error('Choose a different migration target track.')
  const { count, error: countError } = await supabase.from('journey_tracks').select('id', { count: 'exact', head: true }).is('deleted_at', null)
  if (countError) throw countError
  if ((count ?? 0) <= 1) throw new Error('The last active journey track cannot be deleted.')
  const { data: people, error: peopleError } = await supabase.from('people').select('id, journey').is('deleted_at', null)
  if (peopleError) throw peopleError
  const updates = (people ?? []).filter((person) => person.journey[trackId]).map((person) => {
    const journey = { ...person.journey, [migrationTargetId]: person.journey[trackId] }
    delete journey[trackId]
    return supabase.from('people').update({ journey, _source_modified: new Date().toISOString() }).eq('id', person.id)
  })
  await Promise.all(updates)
  const { error } = await supabase.from('journey_tracks').update({ deleted_at: new Date().toISOString() }).eq('id', trackId)
  if (error) throw error
}

export async function getTags(): Promise<Tag[]> {
  const { data, error } = await supabase.from('tags').select('*').order('category').order('name')
  if (error) throw error
  return data ?? []
}

export type SavedListConditions = Pick<PeopleListOptions, 'demographic' | 'accessPermission' | 'journeyTrackId' | 'journeyStage' | 'tagId'>

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('You must be signed in to manage saved lists.')
  return data.user.id
}

export async function getSavedLists(): Promise<import('./types').SavedList[]> {
  const userId = await currentUserId()
  const { data, error } = await supabase.from('saved_lists').select('*').or(`owner_id.eq.${userId},is_shared.eq.true`).order('name')
  if (error) throw error
  return data ?? []
}

export async function getSavedListById(id: string): Promise<import('./types').SavedList | null> {
  const userId = await currentUserId()
  const { data, error } = await supabase
    .from('saved_lists')
    .select('*')
    .eq('id', id)
    .or(`owner_id.eq.${userId},is_shared.eq.true`)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createSavedList(name: string, conditions: SavedListConditions, isShared = false): Promise<import('./types').SavedList> {
  const trimmedName = name.trim()
  if (!trimmedName) throw new Error('Saved list name is required.')
  const { data, error } = await supabase.from('saved_lists').insert({ id: crypto.randomUUID(), name: trimmedName, owner_id: await currentUserId(), conditions, is_shared: isShared }).select('*').single()
  if (error) throw error
  return data
}

export async function updateSavedList(id: string, input: { name?: string; is_shared?: boolean }): Promise<import('./types').SavedList> {
  const patch: { name?: string; is_shared?: boolean } = {}
  if (input.name !== undefined) {
    const trimmedName = input.name.trim()
    if (!trimmedName) throw new Error('Saved list name is required.')
    patch.name = trimmedName
  }
  if (input.is_shared !== undefined) patch.is_shared = input.is_shared
  const { data, error } = await supabase.from('saved_lists').update(patch).eq('id', id).eq('owner_id', await currentUserId()).select('*').single()
  if (error) throw error
  return data
}

export async function deleteSavedList(id: string): Promise<void> {
  const { error } = await supabase.from('saved_lists').delete().eq('id', id).eq('owner_id', await currentUserId())
  if (error) throw error
}

export async function createTag(name: string, category: Tag['category'] = 'custom'): Promise<Tag> {
  if (!name.trim()) throw new Error('Tag name is required.')
  const { data, error } = await supabase.from('tags').insert({ id: crypto.randomUUID(), name: name.trim(), category }).select('*').single()
  if (error) throw error
  return data
}

export async function updateTag(id: string, input: Pick<Tag, 'name' | 'category'>): Promise<Tag> {
  if (!input.name.trim()) throw new Error('Tag name is required.')
  const { data, error } = await supabase.from('tags').update({ name: input.name.trim(), category: input.category }).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function deleteTag(id: string): Promise<void> {
  const { error } = await supabase.from('tags').delete().eq('id', id)
  if (error) throw error
}

export async function getPersonTags(personId: string): Promise<Tag[]> {
  const { data, error } = await supabase.from('people_tags').select('tag_id').eq('person_id', personId)
  if (error) throw error
  const ids = (data ?? []).map((row) => row.tag_id)
  if (!ids.length) return []
  const tags = await supabase.from('tags').select('*').in('id', ids)
  if (tags.error) throw tags.error
  return tags.data ?? []
}

export async function setPersonTags(personId: string, tagIds: string[]): Promise<void> {
  const existing = await supabase.from('people_tags').select('tag_id').eq('person_id', personId)
  if (existing.error) throw existing.error
  const currentIds = new Set((existing.data ?? []).map((row) => row.tag_id))
  const nextIds = new Set(tagIds)
  const removals = [...currentIds].filter((tagId) => !nextIds.has(tagId))
  if (removals.length) {
    const { error } = await supabase.from('people_tags').delete().eq('person_id', personId).in('tag_id', removals)
    if (error) throw error
  }
  const additions = [...nextIds].filter((tagId) => !currentIds.has(tagId)).map((tag_id) => ({ person_id: personId, tag_id }))
  if (additions.length) {
    const { error } = await supabase.from('people_tags').insert(additions)
    if (error) throw error
  }
}

/**
 * ── Omni search ─────────────────────────────────────────────────────────────────
 * The dashboard SearchInput searches people across every identifying field:
 * first/middle/last/preferred name, email, phone, and tag names. Query terms are
 * AND'd together so "Jane Bloggs" matches firstname=Jane + lastname=Bloggs in
 * either order, and a single typo'd term still hits via pg_trgm trigram
 * similarity. Fuzzy matching + relevance ranking live in the `search_people`
 * RPC (supabase/migrations/20260908130000_create_people_search.sql); if that
 * migration has not been applied we fall back to a multi-token ILIKE filter so
 * combination search keeps working.
 */

/** Fields used when building the plain-ILIKE fallback filter. */
const SEARCHABLE_NAME_FIELDS = ['firstname', 'preferred_name', 'middle_name', 'lastname', 'email'] as const

/**
 * Session-level guard for the `search_people` RPC.
 *
 * The first search of a page load always tries the RPC (it *is* the search —
 * there is deliberately no separate availability probe request). If the RPC
 * turns out to be missing/broken (PostgREST PGRST202 or Postgres 42883), we
 * remember that for the rest of the session so the keyboard doesn't spam a
 * 404 per keystroke, and use the plain ILIKE fallback instead. A page reload
 * resets the guard, so a freshly-deployed RPC lights up automatically.
 */
let searchRpcBrokenThisSession = false

/** @internal — exposed for tests. */
export function __resetPeopleSearchRpcCache(): void {
  searchRpcBrokenThisSession = false
}

function isSearchRpcBrokenThisSession(): boolean {
  return searchRpcBrokenThisSession
}

function markSearchRpcBrokenThisSession(): void {
  searchRpcBrokenThisSession = true
}

/** PostgREST/Postgres errors that mean "this function cannot be called here". */
function isSearchRpcUnavailableError(error: unknown): boolean {
  const candidate = error as { code?: unknown; message?: unknown } | null
  if (!candidate) return false
  const code = typeof candidate.code === 'string' ? candidate.code : ''
  const message = typeof candidate.message === 'string' ? candidate.message : ''
  return (
    code === 'PGRST202' ||
    code === '42883' ||
    /could not find the function/i.test(message) ||
    /does not exist/i.test(message)
  )
}

/** Lowercase, whitespace-split search tokens with LIKE wildcards neutralised. */
export function normalizeSearchTokens(searchTerm: string): string[] {
  return searchTerm
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/[%_\\]/g, ''))
    .filter((token) => token.length > 0)
    .slice(0, 4)
}

/**
 * Build the value for `.or(...)` so that every token matches at least one
 * searchable field, AND every token matches somewhere:
 *
 *   and(or(f1,t1 … f5,t1), or(f1,t2 … f5,t2), …)
 *
 * Each token is its own `or(...)` group over the fields (any field can
 * satisfy the token — e.g. email alone is enough), and the groups are AND'd
 * together. That is what makes "first last" combinations work while still
 * matching a single distinctive field. Returns null when there is nothing to
 * search for.
 */
export function buildPeopleSearchFilter(tokens: string[]): string | null {
  if (!tokens.length) return null
  const groups = tokens.map((token) => {
    const pattern = `%${token}%`
    const fields = SEARCHABLE_NAME_FIELDS.map((field) => `${field}.ilike.${pattern}`).join(',')
    return `or(${fields})`
  })
  return `and(${groups.join(',')})`
}

export async function searchPeople(searchTerm: string, limit = DEFAULT_PAGE_SIZE): Promise<Person[]> {
  const normalizedTerm = searchTerm.trim()
  if (!normalizedTerm) return []

  // Preferred path: the fuzzy + ranked omni search RPC. The first search of
  // a page load always tries it; if it turns out to be missing or broken
  // (PGRST202 / 42883), the session guard kicks in and later keystrokes use
  // the plain ILIKE fallback instead of spamming a 404.
  if (!isSearchRpcBrokenThisSession()) {
    try {
      // Keep this a genuine method call: `supabase.rpc` internally references
      // `this.rest`, so capturing the method into an alias (e.g.
      // "const f = supabase.rpc; f(...)") drops `this` and throws in strict
      // mode. Cast the client object and call `.rpc(...)` as a member instead.
      const rpcResult = await (supabase as unknown as SearchPeopleRpcClient).rpc('search_people', {
        search_query: normalizedTerm,
        max_results: limit,
      })
      if (!rpcResult.error) return rpcResult.data ?? []
      // Function missing or broken — remember for this session, then fall back.
      if (isSearchRpcUnavailableError(rpcResult.error)) markSearchRpcBrokenThisSession()
    } catch {
      // Transient network/channel error: use the fallback for this call only;
      // the next search may retry the RPC.
    }
  }

  const filter = buildPeopleSearchFilter(normalizeSearchTokens(normalizedTerm))
  if (!filter) return []
  try {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .is('deleted_at', null)
      .or(filter)
      .order('lastname')
      .order('firstname')
      .limit(limit)
    if (error) throw error
    return data ?? []
  } catch (error) {
    // Search must never take the whole page down: surface a hard failure in
    // the console and show an empty result set instead of throwing.
    console.error('People search fallback failed', error)
    return []
  }
}

type SearchPeopleRpcClient = {
  rpc: (functionName: string, args: { search_query: string; max_results: number }) => Promise<{ data: Person[] | null; error: unknown }>
}

export async function getPersonGuardians(personId: string): Promise<Person[]> {
  const { data: relationships, error: relError } = await supabase
    .from('people_relationships')
    .select('related_person_id')
    .eq('person_id', personId)
    .eq('relationship_type', 'guardian')
  if (relError) throw relError
  const ids = (relationships ?? []).map((row) => row.related_person_id)
  if (!ids.length) return []
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .in('id', ids)
    .is('deleted_at', null)
  if (error) throw error
  return data ?? []
}

export async function createPersonRelationship(input: { person_id: string; related_person_id: string; relationship_type: PersonRelationship['relationship_type']; is_primary_guardian?: boolean | null }): Promise<PersonRelationship> {
  if (input.person_id === input.related_person_id) {
    throw new Error('A person cannot be their own guardian.')
  }
  const { data, error } = await supabase
    .from('people_relationships')
    .insert({
      id: crypto.randomUUID(),
      person_id: input.person_id,
      related_person_id: input.related_person_id,
      relationship_type: input.relationship_type,
      is_primary_guardian: input.is_primary_guardian ?? null,
      _synced_at: new Date().toISOString(),
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function createContactOnlyParent(firstname: string, lastname: string): Promise<Person> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('people')
    .insert({
      id: crypto.randomUUID(),
      firstname,
      lastname,
      demographic: 'adult',
      access_permission: 'member_area',
      custom_fields: null,
      deleted_at: null,
      elvanto_id: null,
      auth_user_id: null,
      mobile: null,
      picture_url: null,
      _synced_at: now,
      _source_modified: now,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}
