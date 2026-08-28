export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type TableDefinition<Row extends Record<string, unknown>, Insert extends Record<string, unknown> = Partial<Row>, Update extends Record<string, unknown> = Partial<Row>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

type PersonRow = {
  id: string
  elvanto_id: string | null
  auth_user_id: string | null
  household_id: string | null
  deleted_at: string | null
  firstname: string
  preferred_name: string | null
  middle_name: string | null
  lastname: string
  email: string | null
  demographic: Database['public']['Enums']['demographic']
  gender: Database['public']['Enums']['gender'] | null
  date_of_birth: string | null
  anniversary: string | null
  marital_status: Database['public']['Enums']['marital_status'] | null
  kindy_start_year: number | null
  school_name: string | null
  school_email_permission: Database['public']['Enums']['yes_no'] | null
  mobile: string | null
  access_permission: Database['public']['Enums']['access_permission']
  journey: Record<string, string>
  custom_fields: Json | null
  safe_ministry_leader_type: Database['public']['Enums']['safe_ministry_leader_type'] | null
  safe_ministry_notes: string | null
  safe_ministry_start_date: string | null
  wwcc_number: string | null
  wwcc_expiry_date: string | null
  wwcc_verification_date: string | null
  wwcc_verification_made_by: string | null
  wwcc_verification_outcome: string | null
  wwcc_exemption: Json | null
  smt_certificate_no: string | null
  smt_completion_date: string | null
  smt_last_type: Database['public']['Enums']['smt_type'] | null
  smc_exemption: boolean | null
  smc_reviewer: string | null
  smc_result_date: string | null
  smc_result: Database['public']['Enums']['smc_result'] | null
  medical_anaphylaxis_allergy: string | null
  medical_other_behavioral: string | null
  medical_regular_medication: string | null
  consent_external_photo: Database['public']['Enums']['yes_no'] | null
  consent_internal_photo: Database['public']['Enums']['yes_no'] | null
  consent_biscuit_under5: Database['public']['Enums']['yes_no'] | null
  consent_girl_guide_offsite: Database['public']['Enums']['yes_no'] | null
  date_professed: string | null
  legacy_date_added: string | null
  legacy_member_id: string | null
  picture_url: string | null
  _synced_at: string
  _source_modified: string
}

type HouseholdRow = {
  id: string
  elvanto_family_id: number | null
  name: string | null
  deleted_at: string | null
  _synced_at: string
}

type AddressRow = {
  id: string
  household_id: string
  kind: Database['public']['Enums']['address_kind']
  line1: string | null
  line2: string | null
  suburb: string | null
  state: string | null
  postcode: string | null
  _synced_at: string
}

type ContactChannelRow = {
  id: string
  person_id: string
  type: Database['public']['Enums']['phone_type']
  value: string
  is_primary: boolean
  _synced_at: string
}

type TagRow = { id: string; name: string; category: Database['public']['Enums']['tag_category'] }
type PeopleTagRow = { person_id: string; tag_id: string }
type JourneyTrackRow = { id: string; category_id: string | null; name: string; sort_order: number; deleted_at: string | null }
type JourneyTrackCategoryRow = { id: string; parent_id: string | null; name: string; sort_order: number }
type JourneyStageRow = { slug: string; label: string; color: string | null; sort_order: number; is_terminal: boolean }
type PeopleAuditRow = {
  id: string
  person_id: string
  field_changed: string
  old_value: Json | null
  new_value: Json | null
  change_reason: Database['public']['Enums']['audit_change_reason']
  changed_by: string | null
  changed_at: string
}
type SavedListRow = {
  id: string
  name: string
  owner_id: string
  conditions: Json
  is_shared: boolean
  created_at: string
  updated_at: string
}
type FormRow = {
  id: string
  name: string
  description: string | null
  owner_id: string
  is_public: boolean
  submit_action: Database['public']['Enums']['form_submit_action']
  submit_target: Json | null
  settings: Json
  created_at: string
  updated_at: string
}
type FormFieldRow = {
  id: string
  form_id: string
  field_type: Database['public']['Enums']['form_field_type']
  label: string
  placeholder: string | null
  options: Json | null
  required: boolean
  maps_to_field: string | null
  sort_order: number
}
type FormSubmissionRow = {
  id: string
  form_id: string
  person_id: string | null
  answers: Json
  created_at: string
}

type PlatformSettingsRow = {
  id: string
  key: string
  environment: string
  value: Json
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      people: TableDefinition<PersonRow>
      households: TableDefinition<HouseholdRow>
      addresses: TableDefinition<AddressRow>
      contact_channels: TableDefinition<ContactChannelRow>
      tags: TableDefinition<TagRow>
      journey_tracks: TableDefinition<JourneyTrackRow>
      journey_track_categories: TableDefinition<JourneyTrackCategoryRow>
      journey_stages: TableDefinition<JourneyStageRow>
      people_audit: TableDefinition<PeopleAuditRow>
      people_tags: TableDefinition<PeopleTagRow>
      saved_lists: TableDefinition<SavedListRow>
      forms: TableDefinition<FormRow>
      form_fields: TableDefinition<FormFieldRow>
      form_submissions: TableDefinition<FormSubmissionRow>
      platform_settings: TableDefinition<PlatformSettingsRow>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      demographic: 'adult' | 'youth' | 'child'
      gender: 'male' | 'female'
      marital_status: 'single' | 'engaged' | 'married' | 'partner' | 'widowed' | 'divorced' | 'separated'
      access_permission: 'public' | 'member_area' | 'team_leaders' | 'admin' | 'super_admin'
      relationship_type: 'primary_contact' | 'spouse' | 'partner' | 'child' | 'sibling' | 'grandfather' | 'grandmother' | 'other' | 'guardian' | 'carer'
      phone_type: 'home' | 'mobile' | 'work' | 'other'
      address_kind: 'home' | 'postal'
      yes_no: 'yes' | 'no'
      tag_category: 'location' | 'journey_track' | 'demographic' | 'status' | 'custom'
      safe_ministry_leader_type: 'adults_leader' | 'junior_leader' | 'not_active' | 'under_13_assistant' | 'visiting_leader'
      smt_type: 'essentials' | 'junior' | 'refresher'
      smc_result: 'age_13_17_application_approved' | 'over_18_application_approved'
      audit_change_reason: 'manual' | 'auto_progression' | 'gdpr_request' | 'migration' | 'sync'
      form_submit_action: 'create_person' | 'update_person' | 'add_to_tag' | 'none'
      form_field_type: 'text' | 'email' | 'phone' | 'number' | 'select' | 'multi_select' | 'checkbox' | 'textarea' | 'date'
    }
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
