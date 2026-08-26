create table user_roles (
  id uuid primary key,
  role access_permission not null unique,
  description varchar
);

create table module_config (
  module varchar primary key,
  enabled boolean not null default true,
  config jsonb,
  updated_at timestamptz not null default now()
);

create table platform_settings (
  id uuid primary key,
  key varchar not null,
  environment varchar not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  constraint platform_settings_key_environment_unique unique (key, environment)
);

create table households (
  id uuid primary key,
  elvanto_family_id integer unique,
  name varchar,
  deleted_at timestamptz,
  _synced_at timestamptz not null default now()
);

create table addresses (
  id uuid primary key,
  household_id uuid not null references households(id),
  kind address_kind not null default 'home',
  line1 varchar,
  line2 varchar,
  suburb varchar,
  state varchar,
  postcode varchar,
  _synced_at timestamptz not null default now()
);
