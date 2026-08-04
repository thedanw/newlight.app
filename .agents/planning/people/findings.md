# Findings: People Module - New Light Anglican Church CRM

> **Research context only — resolved decisions live in `decision.md`.**

## Module Context
- **Baseline module** — always enabled, foundation for all other modules
- **Australian Anglican church context** — WWCC, Safe Ministry, conditional fields by demographic
- **Household-centric** — people belong to households (families)
- **Contact-first** — communication channels are first-class
- **Extensible** — JSONB `custom_fields` for church-specific data
- **Module-ready** — stable IDs, RLS policies, audit trail for other modules

---

## Core Tables

### ENUMS (PostgreSQL enum types for data integrity)
```sql
create type demographic_type as enum ('adult', 'youth', 'child');
create type marital_status as enum ('single', 'engaged', 'married', 'partner', 'widowed', 'divorced', 'separated');
create type school_year as enum ('preschool', 'kindy', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
create type school_email_permission as enum ('yes', 'no');
create type consent_status as enum ('yes', 'no');
create type safe_ministry_leader_type as enum ('adults_leader', 'junior_leader', 'not_active', 'under_13_assistant', 'visiting_leader');
create type wwcc_verification_outcome as enum ('cleared');
create type wwcc_exemption_type as enum ('support_role', 'volunteer_parent_of_attending_child');
create type smt_type as enum ('essentials', 'junior', 'refresher');
create type smc_result as enum ('age_13_17_approved', 'over_18_approved');
create type access_permission as enum ('member_area', 'group_team_leaders', 'admin');
create type gender_type as enum ('male', 'female', 'other', 'prefer_not_to_say');
create type phone_type as enum ('mobile', 'home', 'work');

-- Journey Stages (columns in ministry journey grid) - UNIVERSAL
create type journey_stage_slug as enum (
  'contact',           -- First contact made
  'guest',             -- Attended once/trial
  'linked',            -- Connected, exploring
  'regular',           -- Committed regular
  'archived',          -- Terminal: no longer engaged
  'deleted_privacy_data'  -- Terminal: GDPR/privacy scrub (error entries only)
);
```

### 1. HOUSEHOLDS
```sql
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address_id uuid references addresses(id),
  primary_contact_id uuid,
  notes text,
  custom_fields jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);
```

### 2. ADDRESSES
```sql
create table addresses (
  id uuid primary key default gen_random_uuid(),
  line1 text not null,
  line2 text,
  suburb text not null,
  state text not null,
  postcode text not null,
  country text not null default 'Australia',
  type text not null default 'home',
  latitude double precision,
  longitude double precision,
  created_at timestamptz default now()
);
```

### 3. PEOPLE (core entity with all specified fields)
```sql
create table people (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id),
  household_id uuid not null references households(id),
  
  -- Personal Details
  first_name text not null,
  preferred_name text,
  last_name text not null,
  
  -- Demographics
  demographic demographic_type not null default 'adult',
  gender gender_type,
  date_of_birth date,
  marital_status marital_status,           -- visible if adult
  school text,                             -- visible if not adult
  school_year school_year,                 -- visible if not adult (stored as graduating year 12 calc)
  school_email_permission school_email_permission,  -- visible if youth
  school_email text,                       -- visible if youth + permission = yes
  
  -- Address
  address_id uuid references addresses(id),
  
  -- Contact (only visible if adult)
  email text,
  phone_number text,
  mobile_number text,
  
  -- Medical
  anaphylaxis_allergy_medical text,
  other_medical_behavioral text,
  regular_medication text,
  
  -- Consents
  external_photo_consent consent_status,
  internal_photo_consent consent_status,
  youth_school_email_permission consent_status,
  biscuit_permission_under5 consent_status,  -- visible if child under 5
  girl_guide_offsite_permission consent_status,
  
  -- Child Safety Accreditation (visible if youth or adult)
  safe_ministry_leader_type safe_ministry_leader_type,
  safe_ministry_notes text,
  safe_ministry_start_date text,           -- text area per requirements
  
  -- WWCC (Working With Children Check)
  wwcc_number text,
  wwcc_expiry_date date,
  wwcc_verification_date date,
  wwcc_verification_made_by uuid references auth.users(id),
  wwcc_verification_outcome wwcc_verification_outcome,
  wwcc_exemption wwcc_exemption_type[],
  
  -- Safe Ministry Training (SMT)
  smt_certificate_no text,
  smt_completion_date date,
  last_smt_type smt_type,
  
  -- Safe Ministry Check (SMC)
  smc_exemption boolean default false,
  smc_reviewer uuid references auth.users(id),
  smc_result_date date,
  smc_result smc_result,
  
  -- Admin (visible to admins only)
  access_permissions access_permission[],
  date_professed date,
  legacy_date_added date,
  legacy_member_id text,
  
  -- Metadata
  avatar_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

-- Ministries (rows in journey grid) - admin customizable
create table ministries (
  id uuid primary key default gen_random_uuid(),
  name text not null,                    -- 'Playgroup', 'Youth', 'Sunday 10am'
  slug text not null unique,             -- 'playgroup', 'youth', 'sunday_10am'
  description text,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Journey Stages (columns in grid) - UNIVERSAL across all ministries
create table journey_stages (
  id uuid primary key default gen_random_uuid(),
  slug journey_stage_slug not null unique,
  name text not null,
  display_order integer not null,
  color text not null,
  is_terminal boolean default false,
  created_at timestamptz default now()
);

-- Default stages (seeded)
insert into journey_stages (slug, name, display_order, color, is_terminal) values
  ('contact', 'Contact', 1, '#3B82F6', false),
  ('guest', 'Guest', 2, '#8B5CF6', false),
  ('linked', 'Linked', 3, '#F59E0B', false),
  ('regular', 'Regular', 4, '#10B981', false),
  ('archived', 'Archived', 5, '#6B7280', true),
  ('deleted_privacy_data', 'Deleted (Privacy)', 6, '#EF4444', true);

-- Person's journey: ONE stage per ministry (enforced by PK)
create table people_ministry_journey (
  person_id uuid not null references people(id) on delete cascade,
  ministry_id uuid not null references ministries(id) on delete cascade,
  stage_slug journey_stage_slug not null default 'contact',
  entered_at timestamptz default now(),
  entered_by uuid references auth.users(id),
  notes text,
  primary key (person_id, ministry_id)   -- ONE column per row
);

-- Unified audit trail
create table people_audit (
  id bigserial primary key,
  person_id uuid not null references people(id),
  ministry_id uuid references ministries(id),  -- NULL for GDPR deletion
  field_changed text not null,                -- 'ministry_journey' | 'gdpr_deletion'
  old_stage journey_stage_slug,
  new_stage journey_stage_slug,
  changed_by uuid references auth.users(id),
  changed_at timestamptz default now(),
  change_reason text                          -- 'manual', 'auto_progression', 'gdpr_request'
);

create index idx_people_audit_person on people_audit(person_id);
create index idx_people_audit_ministry on people_audit(ministry_id);
```

### 4. PEOPLE RELATIONSHIPS (parent/guardian linking for children/youth)
```sql
create table people_relationships (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people(id) on delete cascade,
  related_person_id uuid not null references people(id) on delete cascade,
  relationship_type text not null,         -- 'parent', 'guardian', 'spouse', 'child', 'emergency_contact', 'other'
  is_primary boolean default false,
  notes text,
  created_at timestamptz default now(),
  unique (person_id, related_person_id, relationship_type)
);
```

### 5. TAGS (for customisable locations/ministries)
```sql
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  color text,
  category text,                           -- 'location', 'ministry', 'demographic', 'status', 'custom'
  created_at timestamptz default now()
);

create table people_tags (
  person_id uuid not null references people(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  assigned_at timestamptz default now(),
  assigned_by uuid references auth.users(id),
  primary key (person_id, tag_id)
);
```

### 6. USER ROLES (RBAC)
```sql
create table user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'staff', 'volunteer_leader', 'volunteer', 'viewer')),
  module_permissions jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## Conditional Field Visibility Logic (Frontend)

| Field | Visible When |
|-------|--------------|
| `marital_status` | `demographic = 'adult'` |
| `school`, `school_year` | `demographic in ('child', 'youth')` |
| `school_email_permission`, `school_email` | `demographic = 'youth'` |
| `email`, `phone_number`, `mobile_number` | `demographic = 'adult'` |
| `biscuit_permission_under5` | `demographic = 'child' AND age < 5` |
| `safe_ministry_*` | `demographic in ('youth', 'adult')` |
| `wwcc_*`, `smt_*`, `smc_*` | `demographic in ('youth', 'adult')` |
| `access_permissions`, `date_professed`, `legacy_*` | `user_role = 'admin'` |
| Parent/guardian fields | `demographic in ('child', 'youth')` |

---

## Indexes & RLS

```sql
-- Indexes
create index idx_people_household on people(household_id);
create index idx_people_demographic on people(demographic);
create index idx_people_auth_user on people(auth_user_id);
create index idx_people_name_search on people using gin (
  to_tsvector('english', first_name || ' ' || last_name || ' ' || coalesce(preferred_name, ''))
);
create index idx_relationships_child on people_relationships(person_id) where relationship_type in ('parent', 'guardian');
create index idx_relationships_parent on people_relationships(related_person_id) where relationship_type in ('parent', 'guardian');

-- Journey grid indexes
create index idx_people_journey_person on people_ministry_journey(person_id);
create index idx_people_journey_ministry on people_ministry_journey(ministry_id);
create index idx_people_journey_stage on people_ministry_journey(stage_slug);

-- Audit indexes
create index idx_people_audit_person on people_audit(person_id);
create index idx_people_audit_ministry on people_audit(ministry_id);

-- RLS: Household-based access + admin override
alter table people enable row level security;
create policy "Household members see each other" on people
  for select using (
    household_id in (select household_id from people where auth_user_id = auth.uid())
  );
create policy "Admins see all" on people
  for select using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );
create policy "Users update own profile" on people
  for update using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

-- Journey grid RLS
alter table people_ministry_journey enable row level security;
create policy "Household members see journeys" on people_ministry_journey
  for select using (
    person_id in (select id from people where household_id in (
      select household_id from people where auth_user_id = auth.uid()
    ))
  );
create policy "Admins manage all journeys" on people_ministry_journey
  for all using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- Ministries RLS (read for all authenticated, write for admin)
alter table ministries enable row level security;
create policy "Authenticated read ministries" on ministries
  for select to authenticated using (true);
create policy "Admin write ministries" on ministries
  for all using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- Journey stages RLS (read for all)
alter table journey_stages enable row level security;
create policy "Authenticated read stages" on journey_stages
  for select to authenticated using (true);

-- Audit RLS (admin only)
alter table people_audit enable row level security;
create policy "Admin read audit" on people_audit
  for select using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );
```

---

## Module API (for Groups, Services, Calendar)

```typescript
// src/lib/modules/people/index.ts
export * from './types';
export { peopleApi } from './server/api';
export { usePeople, usePerson, useHousehold, useGuardians } from './hooks';
export { PersonCard, PersonAvatar, PersonSearch, HouseholdSelector, GuardianPicker } from './components';

// Key cross-module queries
export const peopleApi = {
  getById: (id: string) => ...,
  getByIds: (ids: string[]) => ...,
  getByHousehold: (householdId: string) => ...,
  getGuardians: (childId: string) => ...,           // For child/youth modules
  getByDemographic: (demo: Demographic) => ...,
  getByMinistry: (ministrySlug: string) => ...,     // For ministry-based groups
  getWithValidWWCC: () => ...,                      // For volunteer rosters
  getWithSafeMinistry: () => ...,                   // For leadership roles
  getJourneyGrid: (personId: string) => ...,        // Full ministry journey grid
  search: (query: string) => ...,
};
```

---

## Open Questions (People Module)

> Tracked in `decision.md` (Decision Gap Log). Research context only.

1. Table architecture — single `people` table vs vertical partitioning
2. Journey grid UI — grid rendering, inline stage editing, bulk actions
3. Data migration — `people_category` + `locations[]` → `people_ministry_journey`
4. Performance — large households, search, pagination
5. Role alignment — `user_roles` values vs base 5-level platform roles