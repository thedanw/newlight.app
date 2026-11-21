/**
 * Elvanto API Endpoints — 47 typed endpoints from ELVANTO_API_REFERENCE.md
 * Organized by category with request/response types
 */

import type { ElvantoClient, ElvantoListResponse } from './client'

// ============================================
// Common Types
// ============================================

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
  status: 'active' | 'suspended'
  username: string | null
  last_login: string | null
  country: string | null
  timezone: string | null
  picture: string | null
  family_id: number
  family_relationship: string
  birthday: string | null
  anniversary: string | null
  gender: 'Male' | 'Female' | null
  marital_status: string | null
  school_grade: string | null
  security_code: string | null
  receipt_name: string | null
  giving_number: string | null
  deceased: number
  development_child: number
  special_needs_child: number
  locations?: { location: Array<{ id: string; name: string }> }
  custom_fields?: Record<string, string>
  // Opt-in fields
  home_address?: string
  home_address2?: string
  home_city?: string
  home_state?: string
  home_postcode?: string
  home_country?: string
  mailing_address?: string
  mailing_address2?: string
  mailing_city?: string
  mailing_state?: string
  mailing_postcode?: string
  mailing_country?: string
  departments?: string
  service_types?: string
  demographics?: string
  access_permissions?: string
  reports_to?: string
  family?: Array<any>
}

export interface ElvantoCategory {
  id: string
  name: string
  color: string | null
}

export interface ElvantoCustomField {
  id: string
  name: string
  type: string
  values?: Array<{ id: string; name: string }>
}

export interface ElvantoLocation {
  id: string
  name: string
}

export interface ElvantoGroup {
  id: string
  date_added: string
  date_modified: string
  name: string
  status: 'active' | 'suspended'
  description: string | null
  logo: string | null
  picture: string | null
  meeting_address: string | null
  meeting_city: string | null
  meeting_state: string | null
  meeting_postcode: string | null
  meeting_country: string | null
  meeting_start_date: string | null
  meeting_end_date: string | null
  meeting_start_time: string | null
  meeting_end_time: string | null
  meeting_day: string | null
  meeting_time: string | null
  meeting_frequency: any
  people?: Array<{
    id: string
    firstname: string
    preferred_name: string
    lastname: string
    email: string
    mobile: string
    phone: string
    picture: string
    position: 'Leader' | 'Assistant Leader'
  }>
}

export interface ElvantoPeopleFlow {
  id: string
  name: string
  status: string
  access: string
  admins: string[]
  locations: string[]
  demographics: string[]
  steps: ElvantoPeopleFlowStep[]
}

export interface ElvantoPeopleFlowStep {
  id: string
  priority: string
  name: string
  description: string
  instructions: string
  notifications: string
  entry_point: string
  step_due: { type: string; days: number } | null
  admins: Array<{ id: string; role: string }>
  steps: ElvantoPeopleFlowStep[]
}

export interface ElvantoPeopleFlowStepMember {
  flow_step_member_id: string
  id: string
  member_firstname: string
  preferred_name: string
  middle_name: string | null
  lastname: string
  date_added: string
  assigned_admin_id: string | null
  status: 'complete' | 'notstarted' | 'pending' | 'inprogress'
  completed_date: string | null
  completed_member: string
  due_date: string
}

export interface ElvantoService {
  id: string
  status: number
  date_added: string
  date_modified: string
  name: string
  series_name: string | null
  date: string
  description: string | null
  service_type: { id: string; name: string } | null
  location: { id: string; name: string } | null
  service_times?: Array<{
    id: string
    date_added: string
    date_modified: string
    name: string
    starts: string
    ends: string
  }>
  plans?: Record<string, any>
  volunteers?: Array<any>
  songs?: Array<any>
  files?: Array<any>
  notes?: Array<any>
}

export interface ElvantoSong {
  id: string
  status: number
  date_added: string
  date_modified: string
  title: string
  permalink: string
  number: string
  item: number
  learn: number
  allow_downloads: number
  artist: string | null
  album: string | null
  notes: string | null
  categories: Array<{ id: string; name: string }>
  locations: Array<{ id: string; name: string }>
}

export interface ElvantoArrangement {
  id: string
  song_id: string
  date_added: string
  date_modified: string
  name: string
  copyright: string | null
  sequence: string[]
  minutes: number | null
  seconds: number | null
  bpm: number | null
  key_male: string | null
  key_female: string | null
  lyrics: string | null
  chord_chart_key: string | null
  chord_chart: string | null
}

export interface ElvantoSongKey {
  id: string
  arrangement_id: string
  date_added: string
  date_modified: string
  name: string
  key_starting: string
  key_ending: string | null
  keys_alternate: Array<{ key_starting: string; name: string }>
}

export interface ElvantoCalendar {
  id: string
  name: string
  color: string | null
  members: string
  published: string
}

export interface ElvantoCalendarEvent {
  id: string
  calendar_id: string
  name: string
  status: 'public' | 'private' | 'draft'
  start_date: string
  end_date: string
  all_day: number
  where: string | null
  description: string | null
  admin_notes: string | null
  url: string | null
  color: string | null
  picture: string | null
  interval: string | null
  organizer: string
  register_url: string | null
  register_form: string | null
  who_can_attend: string
  show_guest_list: string
  repeat: string | null
  repeat_frequency: number | null
  repeat_on: string | null
  repeat_occurrences: number | null
  repeat_end_date: string | null
  locations: Array<{ id: string; name: string }>
  assets: string | Array<any>
}

export interface ElvantoTransaction {
  id: string
  person_id: string
  person_first_name: string
  person_last_name: string
  person_email: string | null
  transaction_date: string
  transaction_datetime: string | null
  transaction_method: string
  check_number: string | null
  batch_id: string | null
  batch: { id: string; number: number; name: string } | null
  transaction_total: string
  amounts: Array<{
    id: string
    category_id: string
    category_name: string
    total: string
    tax_deductible: number
    memo: string | null
    external_notes: string
  }>
  created_by_id: string | null
  created_by_first_name: string | null
  created_by_last_name: string | null
  created_at: string
  updated_by_id: string | null
  updated_by_first_name: string | null
  updated_by_last_name: string | null
  updated_at: string
}

export interface ElvantoFinancialCategory {
  id: string
  name: string
  status: number
  tax_deductible: string
}

export interface ElvantoBatch {
  id: string
  number: number
  name: string
}

// ============================================
// Endpoint Functions
// ============================================

/**
 * Create typed endpoint functions for a client
 */
export function createEndpoints(client: ElvantoClient) {
  return {
    // ============================================
    // PEOPLE (9 endpoints)
    // ============================================
    
    people: {
      /**
       * people/getAll — Paginated list of people
       */
      getAll: (params: {
        page?: number
        page_size?: number
        category_id?: string | string[]
        suspended?: 'yes' | 'no'
        contact?: 'yes' | 'no'
        archived?: 'yes' | 'no'
        fields?: string[]
      } = {}) => client.request<ElvantoListResponse<ElvantoPerson>>('people/getAll', params),
      
      /**
       * people/search — Search people with date_modified filter
       */
      search: (params: {
        search: Record<string, any>
        fields?: string[]
        page?: number
        page_size?: number
      }) => client.request<ElvantoListResponse<ElvantoPerson>>('people/search', params),
      
      /**
       * people/getInfo — Get single person by ID
       */
      getInfo: (id: string, fields?: string[]) => 
        client.getById<ElvantoPerson>('people/getInfo', id, fields),
      
      /**
       * people/create — Create new person
       */
      create: (params: {
        firstname: string
        lastname: string
        preferred_name?: string
        email?: string
        phone?: string
        mobile?: string
        category_id?: string
        archived?: number
        contact?: number
        volunteer?: number
        status?: 'active' | 'suspended'
        username?: string
        password?: string
        family_id?: number | 'new'
        family_relationship?: string
        fields?: {
          gender?: 'Male' | 'Female'
          birthday?: string
          anniversary?: string
          marital_status?: string
          access_permissions?: string
        }
      }) => client.request<{ id: string; family_id: number }>('people/create', params),
      
      /**
       * people/edit — Edit existing person
       */
      edit: (params: {
        id: string
        firstname?: string
        lastname?: string
        preferred_name?: string
        email?: string
        phone?: string
        mobile?: string
        category_id?: string
        archived?: number
        contact?: number
        volunteer?: number
        status?: 'active' | 'suspended'
        username?: string
        password?: string
        family_id?: number | ''
        family_relationship?: string
        fields?: {
          gender?: 'Male' | 'Female'
          birthday?: string
          anniversary?: string
          marital_status?: string
          access_permissions?: string
        }
      }) => client.request<{ id: string; family_id: number }>('people/edit', params),
      
      /**
       * people/remove — Delete person (hard delete)
       */
      remove: (id: string) => client.request<{ id: string }>('people/remove', { id }),
      
      /**
       * people/currentUser — Get current OAuth user
       */
      currentUser: () => client.request<{ person: ElvantoPerson }>('people/currentUser', {}),
      
      /**
       * people/categories/getAll — Get all people categories
       */
      categories: {
        getAll: () => client.request<{ categories: { category: ElvantoCategory[] } }>('people/categories/getAll', {}),
      },
      
      /**
       * people/customFields/getAll — Get custom field definitions
       */
      customFields: {
        getAll: () => client.request<{ custom_fields: { custom_field: ElvantoCustomField[] } }>('people/customFields/getAll', {}),
      },
    },

    // ============================================
    // LOCATIONS (1 endpoint)
    // ============================================

    locations: {
      /**
       * locations/getAll — Get all locations
       */
      getAll: () => client.request<{ locations: { location: ElvantoLocation[] } }>('locations/getAll', {}),
    },
    
    // ============================================
    // GROUPS (7 endpoints)
    // ============================================
    
    groups: {
      /**
       * groups/getAll — Paginated list of groups
       */
      getAll: (params: {
        page?: number
        page_size?: number
        category_id?: string
        suspended?: 'yes' | 'no'
        fields?: string[]
      } = {}) => client.request<ElvantoListResponse<ElvantoGroup>>('groups/getAll', params),
      
      /**
       * groups/getInfo — Get single group by ID
       */
      getInfo: (id: string, fields?: string[]) => 
        client.getById<ElvantoGroup>('groups/getInfo', id, fields),
      
      /**
       * groups/create — Create new group
       */
      create: (params: {
        name: string
        status?: 'active' | 'suspended'
        description?: string
        meeting_address?: string
        meeting_city?: string
        meeting_state?: string
        meeting_postcode?: string
        meeting_country?: string
        meeting_start_date?: string
        meeting_end_date?: string
        meeting_start_time?: string
        meeting_end_time?: string
        meeting_day?: string
        meeting_frequency?: any
        fields?: string[]
      }) => client.request<{ id: string }>('groups/create', params),
      
      /**
       * groups/edit — Edit existing group
       */
      edit: (params: {
        id: string
        name?: string
        status?: 'active' | 'suspended'
        description?: string
        meeting_address?: string
        meeting_city?: string
        meeting_state?: string
        meeting_postcode?: string
        meeting_country?: string
        meeting_start_date?: string
        meeting_end_date?: string
        meeting_start_time?: string
        meeting_end_time?: string
        meeting_day?: string
        meeting_frequency?: any
        fields?: string[]
      }) => client.request<{ id: string }>('groups/edit', params),
      
      /**
       * groups/remove — Delete group
       */
      remove: (id: string) => client.request<{ person: { id: string } }>('groups/remove', { id }),
      
      /**
       * groups/addPerson — Add person to group
       */
      addPerson: (params: {
        id: string
        person_id: string
        position?: 'Leader' | 'Assistant Leader'
      }) => client.request<{ id: string; person_id: string }>('groups/addPerson', params),
      
      /**
       * groups/removePerson — Remove person from group
       */
      removePerson: (params: {
        id: string
        person_id: string
      }) => client.request<{ id: string; person_id: string }>('groups/removePerson', params),
    },
    
    // ============================================
    // PEOPLE FLOWS (4 endpoints)
    // ============================================
    
    peopleFlows: {
      /**
       * peopleFlows/getAll — Get all flows with nested steps
       */
      getAll: () => client.request<{ people_flows: { people_flow: ElvantoPeopleFlow[] } }>('peopleFlows/getAll', {}),
      
      /**
       * peopleFlows/steps/getAll — Get steps for a flow
       */
      steps: {
        getAll: (flow_id: string) => client.request<{ people_flow_steps: { people_flow_step: ElvantoPeopleFlowStep[] } }>('peopleFlows/steps/getAll', { flow_id }),
        
        /**
         * peopleFlows/steps/people — Get members of a step
         */
        people: (params: {
          step_id: string
          status?: 'complete' | 'notstarted' | 'pending' | 'inprogress'
          assigned?: string
        }) => client.request<{ people_flow_step_members: { people_flow_step_member: ElvantoPeopleFlowStepMember[] } }>('peopleFlows/steps/people', params),
        
        /**
         * peopleFlows/steps/addPerson — Add person to step
         */
        addPerson: (params: {
          step_id: string
          person_id: string
          assign_to?: string
        }) => client.request<{ step_person: string }>('peopleFlows/steps/addPerson', params),
      },
    },
    
    // ============================================
    // SERVICES (2 endpoints) — READ ONLY
    // ============================================
    
    services: {
      /**
       * services/getAll — Paginated list of services
       */
      getAll: (params: {
        page?: number
        page_size?: number
        all?: 'yes' | 'no'
        start?: string
        end?: string
        status?: 'published' | 'draft'
        service_types?: string
        fields?: string[]
      } = {}) => client.request<ElvantoListResponse<ElvantoService>>('services/getAll', params),
      
      /**
       * services/getInfo — Get single service by ID
       */
      getInfo: (id: string, fields?: string[]) => 
        client.getById<ElvantoService>('services/getInfo', id, fields),
    },
    
    // ============================================
    // SONGS (13 endpoints)
    // ============================================
    
    songs: {
      /**
       * songs/getAll — Paginated list of songs
       */
      getAll: (params: {
        page?: number
        page_size?: number
        title?: string
        artist?: string
        lyrics?: string
        files?: 'yes' | 'no'
      } = {}) => client.request<ElvantoListResponse<ElvantoSong>>('songs/getAll', params),
      
      /**
       * songs/getInfo — Get single song by ID
       */
      getInfo: (id: string, files?: 'yes' | 'no') => 
        client.getById<ElvantoSong>('songs/getInfo', id, files ? ['files'] : undefined),
      
      /**
       * songs/create — Create new song with arrangements
       */
      create: (params: {
        title: string
        arrangements: Array<{
          name: string
          keys?: Array<{ name: string; key_starting: string }>
          copyright?: string
          sequence?: string[]
          minutes?: number
          seconds?: number
          bpm?: number
          chord_chart_key?: string
          chord_chart?: string
        }>
        status?: number
        number?: string
        item?: number
        learn?: number
        allow_downloads?: number
        artist?: string
        album?: string
        notes?: string
      }) => client.request<{ id: string; arrangements: Array<{ id: string }> }>('songs/create', params),
      
      /**
       * songs/edit — Edit song
       */
      edit: (params: {
        id: string
        title?: string
        status?: number
        number?: string
        item?: number
        learn?: number
        allow_downloads?: number
      }) => client.request<{ id: string }>('songs/edit', params),
      
      /**
       * songs/categories/getAll — Get song categories
       */
      categories: {
        getAll: () => client.request<{ categories: { category: Array<{ id: string; name: string }> } }>('songs/categories/getAll', {}),
      },
      
      /**
       * songs/arrangements/create — Create arrangement for song
       */
      arrangements: {
        create: (params: {
          song_id: string
          name: string
          copyright?: string
          sequence?: string[]
          minutes?: number
          seconds?: number
          bpm?: number
          key_male?: string
          key_female?: string
          lyrics?: string
          chord_chart_key?: string
          chord_chart?: string
          keys?: Array<{ name: string; key_starting: string }>
        }) => client.request<{ id: string; keys: Array<{ id: string; name: string }> }>('songs/arrangements/create', params),
        
        /**
         * songs/arrangements/edit — Edit arrangement
         */
        edit: (params: {
          id: string
          name?: string
          copyright?: string
          sequence?: string[]
          minutes?: number
          seconds?: number
          bpm?: number
          key_male?: string
          key_female?: string
          lyrics?: string
          chord_chart_key?: string
          chord_chart?: string
          keys?: Array<{ name: string; key_starting: string }>
        }) => client.request<{ id: string }>('songs/arrangements/edit', params),
        
        /**
         * songs/arrangements/getAll — Get arrangements for song
         */
        getAll: (params: {
          song_id: string
          page?: number
          page_size?: number
          chord_chart_key?: string
          files?: 'yes' | 'no'
        }) => client.request<ElvantoListResponse<ElvantoArrangement>>('songs/arrangements/getAll', params),
        
        /**
         * songs/arrangements/getInfo — Get single arrangement
         */
        getInfo: (id: string, params?: { chord_chart_key?: string; files?: 'yes' | 'no' }) => 
          client.getById<ElvantoArrangement>('songs/arrangements/getInfo', id, params ? [params.chord_chart_key, params.files].filter(Boolean) as string[] : undefined),
      },
      
      /**
       * songs/keys/create — Create key for arrangement
       */
      keys: {
        create: (params: {
          arrangement_id: string
          name: string
          key_starting: string
          key_ending?: string
          keys_alternate?: Array<{ key_starting: string; name: string }>
        }) => client.request<{ id: string }>('songs/keys/create', params),
        
        /**
         * songs/keys/edit — Edit key
         */
        edit: (params: {
          id: string
          key_starting: string
          name?: string
          key_ending?: string
          keys_alternate?: Array<{ key: string; name: string }>
        }) => client.request<{ id: string }>('songs/keys/edit', params),
        
        /**
         * songs/keys/getAll — Get keys for arrangement
         */
        getAll: (params: {
          arrangement_id: string
          page?: number
          page_size?: number
          files?: 'yes' | 'no'
        }) => client.request<ElvantoListResponse<ElvantoSongKey>>('songs/keys/getAll', params),
        
        /**
         * songs/keys/getInfo — Get single key
         */
        getInfo: (id: string, files?: 'yes' | 'no') => 
          client.getById<ElvantoSongKey>('songs/keys/getInfo', id, files ? ['files'] : undefined),
      },
    },
    
    // ============================================
    // CALENDAR (5 endpoints)
    // ============================================
    
    calendar: {
      /**
       * calendar/getAll — Get all calendars
       */
      getAll: () => client.request<{ calendars: { calendar: ElvantoCalendar[] } }>('calendar/getAll', {}),
      
      events: {
        /**
         * calendar/events/getAll — Paginated list of events
         */
        getAll: (params: {
          page?: number
          page_size?: number
          start: string
          end: string
          calendar_id?: string
        }) => client.request<ElvantoListResponse<ElvantoCalendarEvent>>('calendar/events/getAll', params),
        
        /**
         * calendar/events/getInfo — Get single event
         */
        getInfo: (id: string) => client.getById<ElvantoCalendarEvent>('calendar/events/getInfo', id),
        
        /**
         * calendar/events/create — Create event
         */
        create: (params: {
          name: string
          calendar_id: string
          start_date: string
          end_date: string
          status?: 'public' | 'private' | 'draft'
          all_day?: number
          where?: string
          description?: string
          url?: string
          color?: string
          picture?: string
          organizer: string
          register_url?: string
          register_form?: string
          who_can_attend?: string
          show_guest_list?: 'yes' | 'no'
          repeat?: string
          repeat_frequency?: number
          repeat_on?: string
          repeat_occurrences?: number
          repeat_end_date?: string
          locations?: Array<{ id: string; name: string }>
          assets?: string | Array<any>
        }) => client.request<{ id: string }>('calendar/events/create', params),
        
        /**
         * calendar/events/edit — Edit event
         */
        edit: (params: {
          id: string
          name?: string
          calendar_id?: string
          start_date?: string
          end_date?: string
          status?: 'public' | 'private' | 'draft'
          all_day?: number
          where?: string
          description?: string
          url?: string
          color?: string
          picture?: string
          organizer?: string
          register_url?: string
          register_form?: string
          who_can_attend?: string
          show_guest_list?: 'yes' | 'no'
          repeat?: string
          repeat_frequency?: number
          repeat_on?: string
          repeat_occurrences?: number
          repeat_end_date?: string
          locations_replace?: Array<{ id: string; name: string }>
          locations_remove?: Array<{ id: string; name: string }>
          assets_replace?: string | Array<any>
          assets_remove?: string | Array<any>
        }) => client.request<{ id: string }>('calendar/events/edit', params),
        
        /**
         * calendar/events/remove — Delete event
         */
        remove: (id: string) => client.request<{ id: string }>('calendar/events/remove', { id }),
      },
    },
    
    // ============================================
    // FINANCIAL (7 endpoints)
    // ============================================
    
    financial: {
      transactions: {
        /**
         * financial/transactions/getAll — Paginated list of transactions
         */
        getAll: (params: {
          page?: number
          page_size?: number
          start: string
          end: string
          category_id?: string
          person_id?: string
        }) => client.request<ElvantoListResponse<ElvantoTransaction>>('financial/transactions/getAll', params),
        
        /**
         * financial/transactions/getInfo — Get single transaction
         */
        getInfo: (id: string) => client.getById<ElvantoTransaction>('financial/transactions/getInfo', id),
        
        /**
         * financial/transactions/create — Create transaction
         */
        create: (params: {
          person_id: string
          transaction_date: string
          transaction_method: string
          transaction_total: string
          amounts: Array<{
            category_id: string
            total: string
            tax_deductible?: number
            memo?: string
            external_notes?: string
          }>
          batch_id?: string
        }) => client.request<{ id: string }>('financial/transactions/create', params),
        
        /**
         * financial/transactions/edit — Edit transaction
         */
        edit: (params: {
          id: string
          person_id?: string
          transaction_date?: string
          transaction_method?: string
          transaction_total?: string
          amounts?: Array<{
            category_id: string
            total: string
            tax_deductible?: number
            memo?: string
            external_notes?: string
          }>
          batch_id?: string
        }) => client.request<{ id: string }>('financial/transactions/edit', params),
        
        /**
         * financial/transactions/remove — Delete transaction
         */
        remove: (id: string) => client.request<{ id: string }>('financial/transactions/remove', { id }),
      },
      
      categories: {
        /**
         * financial/categories/getAll — Get financial categories
         */
        getAll: () => client.request<{ categories: { category: ElvantoFinancialCategory[] } }>('financial/categories/getAll', {}),
        
        /**
         * financial/categories/create — Create financial category (CREATE ONLY)
         */
        create: (params: {
          name: string
          status?: number
          tax_deductible?: 'yes' | 'no'
        }) => client.request<{ id: string }>('financial/categories/create', params),
      },
    },
  }
}

// ============================================
// Export all types and factory
// ============================================

export type Endpoints = ReturnType<typeof createEndpoints>

export { ElvantoClient } from './client'
export type { ElvantoClientOptions, ElvantoResponse, ElvantoError, PaginationParams, ElvantoListResponse } from './client'