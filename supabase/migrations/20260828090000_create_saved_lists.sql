create table saved_lists (
  id uuid primary key,
  name varchar not null,
  owner_id uuid not null,
  conditions jsonb not null default '{}'::jsonb,
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saved_lists_owner_id_idx on saved_lists (owner_id);