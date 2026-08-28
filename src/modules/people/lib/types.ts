import type { Tables } from '@/core/lib/database.types'

export type Person = Tables<'people'>
export type Household = Tables<'households'>
export type Address = Tables<'addresses'>
export type ContactChannel = Tables<'contact_channels'>
export type Tag = Tables<'tags'>
export type PeopleTag = Tables<'people_tags'>
export type SavedList = Tables<'saved_lists'>
export type Form = Tables<'forms'>
export type FormField = Tables<'form_fields'>
export type FormSubmission = Tables<'form_submissions'>
export type FormFieldType = FormField['field_type']
export type FormSubmitAction = Form['submit_action']
export type JourneyTrack = Tables<'journey_tracks'>
export type JourneyTrackCategory = Tables<'journey_track_categories'>
export type JourneyStage = Tables<'journey_stages'>

export type PersonWithJourney = Person & {
  household: Household | null
}

export type HouseholdDetails = Household & {
  address: Address | null
  members: Person[]
}

export type JourneyGrid = {
  tracks: JourneyTrack[]
  stages: JourneyStage[]
  people: Person[]
  tagsByPerson: Record<string, Tag[]>
}

export type PeopleListOptions = {
  limit?: number
  offset?: number
  demographic?: Person['demographic']
  accessPermission?: Person['access_permission']
  journeyTrackId?: string
  journeyStage?: string
  tagId?: string
}

export type FormFieldOption = { label: string; value: string }

export type FormWithFields = Form & {
  fields: FormField[]
}

export type FormSubmissionWithPerson = FormSubmission & {
  person: Pick<Person, 'id' | 'firstname' | 'lastname'> | null
}
