/**
 * Shared Sync Types — Common types used by both browser and Edge Function sync logic
 */

export interface ElvantoPerson {
  id: string
  date_added: string
  date_modified: string
  category_id: string
  firstname: string
  preferred_name: string | null
  middle_name: string | null
  lastname: string
  email: string | null
  phone: string | null
  mobile: string | null
  admin: number
  archived: number
  contact: number
  volunteer: number
  status: string
  username: string | null
  last_login: string | null
  country: string | null
  timezone: string | null
  picture: string | null
  family_id: number
  family_relationship: string
  birthday: string | null
  anniversary: string | null
  gender: string | null
  marital_status: string | null
  school_grade: string | null
  security_code: string | null
  receipt_name: string | null
  giving_number: string | null
  deceased: number
  development_child: number
  special_needs_child: number
  locations: { location: Array<{ id: string; name: string }> } | null
  custom_fields: Record<string, string>
  home_address: string | null
  home_address2: string | null
  home_city: string | null
  home_state: string | null
  home_postcode: string | null
  home_country: string | null
  mailing_address: string | null
  mailing_address2: string | null
  mailing_city: string | null
  mailing_state: string | null
  mailing_postcode: string | null
  mailing_country: string | null
  departments: string | null
  service_types: string | null
  demographics: string | null
  access_permissions: string | null
  reports_to: string | null
}

export interface ElvantoPeopleResponse {
  generated_in: string
  status: string
  people: {
    on_this_page: number
    page: number
    per_page: number
    total: number
    person: ElvantoPerson[]
  }
}

export interface SyncResult {
  success: boolean
  itemsProcessed: number
  itemsFailed: number
  errors: string[]
  lastDateModified: string | null
}

export interface ElvantoCategory {
  id: string
  name: string
}

export interface ElvantoDemographic {
  name: string
}

export interface ElvantoLocation {
  id: string
  name: string
}

export interface JourneyTrack {
  id: string
  name: string
  elvanto_location_id: string | null
}

export interface JourneyStage {
  id: string
  slug: string
  label: string
}

export interface LocationTrackPairing {
  elvanto_location_id: string
  journey_track_id: string
  follow_elvanto: boolean
}

export interface TrackIds {
  sundayServices: string
  campusTracks: Map<string, string>
}