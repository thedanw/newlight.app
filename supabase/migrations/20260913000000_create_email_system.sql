-- Core email system: templates, sends, recipients, suppression, sender aliases.
-- Adds consent columns to people table.
-- Batch 2 / Phase 1 of the email core utility.

-- Ensure pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- ===========================================================================
-- Types
-- ===========================================================================

create type email_template_status as enum ('draft', 'published', 'archived');
create type email_send_status as enum ('queued', 'sending', 'sent', 'failed', 'partial', 'suppressed');
create type email_recipient_status as enum ('queued', 'sent', 'failed', 'suppressed', 'skipped');
create type email_consent_category as enum ('broadcasts', 'team_updates');
create type email_audience_type as enum ('saved_list', 'explicit', 'preset');

-- ===========================================================================
-- Tables
-- ===========================================================================

create table email_templates (
  id uuid primary key default gen_random_uuid(),
  name varchar not null,
  subject varchar,
  html_content text,
  editor_json jsonb,
  status email_template_status not null default 'draft',
  from_email varchar,
  from_name varchar,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table email_sends (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references email_templates (id) on delete set null,
  subject varchar not null,
  body text not null,
  from_email varchar not null,
  from_name varchar,
  consent_category email_consent_category not null,
  audience_type email_audience_type not null,
  audience_ref varchar,
  recipient_count integer not null default 0,
  accepted_count integer not null default 0,
  status email_send_status not null default 'queued',
  provider varchar,
  provider_message_id varchar,
  error_message text,
  sent_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table email_recipients (
  id uuid primary key default gen_random_uuid(),
  send_id uuid not null references email_sends (id) on delete cascade,
  person_id uuid references people (id) on delete set null,
  email varchar not null,
  name varchar,
  status email_recipient_status not null default 'queued',
  provider_message_id varchar,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table email_unsubscribes (
  id uuid primary key default gen_random_uuid(),
  email_hash varchar not null,
  token_hash varchar not null unique,
  send_id uuid references email_sends (id) on delete set null,
  reason text,
  unsubscribed_at timestamptz not null default now()
);

create table email_sender_aliases (
  id uuid primary key default gen_random_uuid(),
  email varchar not null,
  name varchar not null,
  is_default boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ===========================================================================
-- Indexes
-- ===========================================================================

create index email_sends_created_by_idx on email_sends (created_by);
create index email_sends_status_idx on email_sends (status);
create index email_sends_sent_at_idx on email_sends (sent_at desc);
create index email_recipients_send_id_idx on email_recipients (send_id);
create index email_recipients_status_idx on email_recipients (status);
create index email_recipients_person_id_idx on email_recipients (person_id);
create index email_unsubscribes_email_hash_idx on email_unsubscribes (email_hash);
create index email_unsubscribes_token_hash_idx on email_unsubscribes (token_hash);
create index email_sender_aliases_email_idx on email_sender_aliases (email);
create index email_sender_aliases_is_default_idx on email_sender_aliases (is_default);

-- ===========================================================================
-- Consent columns on people
-- ===========================================================================

alter table people
  add column if not exists consent_broadcasts yes_no,
  add column if not exists consent_team_updates yes_no;

-- ===========================================================================
-- RLS (idempotent)
-- ===========================================================================

-- Templates
alter table email_templates enable row level security;
drop policy if exists "Authenticated can manage templates" on email_templates;
create policy "Authenticated can manage templates"
  on email_templates for all to authenticated using (true);

-- Sends
alter table email_sends enable row level security;
drop policy if exists "Authenticated can manage sends" on email_sends;
create policy "Authenticated can manage sends"
  on email_sends for all to authenticated using (true);

-- Recipients
alter table email_recipients enable row level security;
drop policy if exists "Authenticated can manage recipients" on email_recipients;
create policy "Authenticated can manage recipients"
  on email_recipients for all to authenticated using (true);

-- Unsubscribes — insert/select for authenticated (admin/sending), no public policy here
alter table email_unsubscribes enable row level security;
drop policy if exists "Authenticated can manage unsubscribes" on email_unsubscribes;
create policy "Authenticated can manage unsubscribes"
  on email_unsubscribes for all to authenticated using (true);

-- Sender aliases
alter table email_sender_aliases enable row level security;
drop policy if exists "Authenticated can manage aliases" on email_sender_aliases;
create policy "Authenticated can manage aliases"
  on email_sender_aliases for all to authenticated using (true);

-- ===========================================================================
-- Grants
-- ===========================================================================

grant select, insert, update, delete on email_templates to authenticated;
grant select, insert, update, delete on email_sends to authenticated;
grant select, insert, update, delete on email_recipients to authenticated;
grant select, insert, update, delete on email_unsubscribes to authenticated;
grant select, insert, update, delete on email_sender_aliases to authenticated;

-- service_role needs grants to bypass RLS in the Edge Function
grant select, insert, update, delete on email_templates to service_role;
grant select, insert, update, delete on email_sends to service_role;
grant select, insert, update, delete on email_recipients to service_role;
grant select, insert, update, delete on email_unsubscribes to service_role;
grant select, insert, update, delete on email_sender_aliases to service_role;

-- Allow service_role to read consent + email + people data for send filtering
grant select on people to service_role;
grant select on people_relationships to service_role;
grant select on households to service_role;
