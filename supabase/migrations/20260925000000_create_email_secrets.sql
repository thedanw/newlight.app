-- Email secret storage (A+D).
--
-- SMTP password / Resend API key are entered by super_admins in the Email
-- Settings UI. They are encrypted server-side (AES-GCM) inside the edge
-- functions and persisted here. The tables are readable/writable only by the
-- service_role — authenticated users can never select them directly (the key
-- and the ciphertext are co-located at rest, but both are gated by RLS to
-- service_role, so no signed-in browser can read them). Encryption/decryption
-- runs exclusively in edge functions, never in the browser bundle.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- email_encryption_keys
-- Single 256-bit AES-GCM key, auto-provisioned by the edge function on first
-- use. service_role (edge functions) reads/writes; authenticated is denied.
-- ---------------------------------------------------------------------------
create table if not exists public.email_encryption_keys (
  name      text primary key,
  key_bytes bytea not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- email_secrets
-- name = secret identifier (e.g. 'smtp_pass', 'resend_api_key').
-- value_encrypted + nonce are AES-GCM outputs, produced and consumed only by
-- the edge functions (service_role).
-- ---------------------------------------------------------------------------
create table if not exists public.email_secrets (
  name            text primary key,
  value_encrypted bytea not null,
  nonce           bytea not null,
  created_by      uuid references people(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS: authenticated users cannot touch these tables directly. Edge functions
-- act as the service_role, which is granted full access below.
-- ---------------------------------------------------------------------------
alter table public.email_encryption_keys enable row level security;
alter table public.email_secrets enable row level security;

create policy "Authenticated: no access (use edge function)"
  on public.email_encryption_keys for all to authenticated
  using (false) with check (false);

create policy "Authenticated: no access (use edge function)"
  on public.email_secrets for all to authenticated
  using (false) with check (false);

-- service_role (edge functions) keeps full access; anon gets nothing.
grant all on public.email_encryption_keys, public.email_secrets to service_role;
revoke all on public.email_encryption_keys, public.email_secrets from anon;
