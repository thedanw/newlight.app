-- Forms: admin-created data collection forms with public submission.
-- Batch 11 of the People module.

create type form_submit_action as enum ('create_person', 'update_person', 'add_to_tag', 'none');

create type form_field_type as enum ('text', 'email', 'phone', 'number', 'select', 'multi_select', 'checkbox', 'textarea', 'date');

create table forms (
  id uuid primary key,
  name varchar not null,
  description text,
  owner_id uuid not null,
  is_public boolean not null default false,
  submit_action form_submit_action not null default 'none',
  submit_target jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index forms_owner_id_idx on forms (owner_id);

create table form_fields (
  id uuid primary key,
  form_id uuid not null references forms (id) on delete cascade,
  field_type form_field_type not null,
  label varchar not null,
  placeholder varchar,
  options jsonb,
  required boolean not null default false,
  maps_to_field varchar,
  sort_order integer not null default 0
);

create index form_fields_form_id_idx on form_fields (form_id);

create table form_submissions (
  id uuid primary key,
  form_id uuid not null references forms (id) on delete cascade,
  person_id uuid references people (id) on delete set null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index form_submissions_form_id_idx on form_submissions (form_id);