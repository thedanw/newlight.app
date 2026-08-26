create table people (
  id uuid primary key,
  elvanto_id uuid unique,
  auth_user_id uuid unique,
  household_id uuid references households(id),
  deleted_at timestamptz,

  firstname varchar not null,
  preferred_name varchar,
  middle_name varchar,
  lastname varchar not null,
  email varchar,

  demographic demographic not null default 'adult',
  gender gender,
  date_of_birth date,
  anniversary date,
  marital_status marital_status,
  kindy_start_year integer,
  school_name varchar,
  school_email_permission yes_no,

  mobile varchar,

  access_permission access_permission not null default 'member_area',

  journey jsonb not null,
  custom_fields jsonb,

  safe_ministry_leader_type safe_ministry_leader_type,
  safe_ministry_notes text,
  safe_ministry_start_date date,
  wwcc_number varchar,
  wwcc_expiry_date date,
  wwcc_verification_date date,
  wwcc_verification_made_by varchar,
  wwcc_verification_outcome varchar,
  wwcc_exemption jsonb,
  smt_certificate_no varchar,
  smt_completion_date date,
  smt_last_type smt_type,
  smc_exemption boolean,
  smc_reviewer varchar,
  smc_result_date date,
  smc_result smc_result,

  medical_anaphylaxis_allergy text,
  medical_other_behavioral text,
  medical_regular_medication text,

  consent_external_photo yes_no,
  consent_internal_photo yes_no,
  consent_biscuit_under5 yes_no,
  consent_girl_guide_offsite yes_no,

  date_professed date,
  legacy_date_added timestamptz,
  legacy_member_id varchar,

  country varchar,
  timezone varchar,
  picture_url text,

  elvanto_archived boolean default false,
  elvanto_login_status person_status,
  elvanto_is_contact boolean default false,
  elvanto_volunteer boolean default false,
  elvanto_admin boolean default false,
  elvanto_deceased boolean default false,
  elvanto_category_id uuid,
  elvanto_family_relationship family_relationship,
  elvanto_school_grade varchar,
  elvanto_security_code varchar,
  elvanto_receipt_name varchar,
  elvanto_giving_number varchar,
  elvanto_username varchar,
  elvanto_last_login timestamptz,
  elvanto_locations jsonb,
  elvanto_custom_fields jsonb,

  _synced_at timestamptz not null default now(),
  _source_modified timestamptz not null default now(),

  constraint people_journey_not_empty check (journey <> '{}')
);

create index people_email_idx on people (email);
create index people_lastname_firstname_idx on people (lastname, firstname);
create index people_source_modified_idx on people (_source_modified);
create index people_household_id_idx on people (household_id);
create index people_journey_gin_idx on people using gin (journey);

create table people_relationships (
  id uuid primary key,
  person_id uuid not null references people(id),
  related_person_id uuid not null references people(id),
  relationship_type relationship_type not null,
  is_primary_guardian boolean default false,
  _synced_at timestamptz not null default now(),
  constraint people_relationships_unique unique (person_id, related_person_id, relationship_type)
);

create table tags (
  id uuid primary key,
  name varchar not null,
  category tag_category not null default 'custom'
);

create table people_tags (
  person_id uuid not null references people(id),
  tag_id uuid not null references tags(id),
  primary key (person_id, tag_id)
);
