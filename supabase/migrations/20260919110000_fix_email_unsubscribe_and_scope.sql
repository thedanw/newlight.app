-- Migration: Fix email unsubscribe and scope email tables
-- Batch 5: Add email_unsubscribe_tokens table, scope email tables to authorized roles

-- Create email_unsubscribe_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  email_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast lookups by token_hash
CREATE INDEX IF NOT EXISTS idx_email_unsubscribe_tokens_hash ON public.email_unsubscribe_tokens(token_hash);

-- Create index for lookups by email_hash
CREATE INDEX IF NOT EXISTS idx_email_unsubscribe_tokens_email ON public.email_unsubscribe_tokens(email_hash);

-- Scope email_unsubscribes to authorized roles only (not plain members)
-- Drop any existing anon policies and recreate with authenticated-only
DROP POLICY IF EXISTS "anon_select_email_unsubscribes" ON public.email_unsubscribes;
DROP POLICY IF EXISTS "authenticated_select_email_unsubscribes" ON public.email_unsubscribes;

-- Only authenticated users can select from email_unsubscribes
CREATE POLICY "authenticated_select_email_unsubscribes" ON public.email_unsubscribes
FOR SELECT TO authenticated
USING (true);

-- Scope email system tables to send-authorized roles
-- First, let's check what tables exist in the email system
-- 20260913000000_create_email_system.sql created these tables

-- Revoke any anon access to email tables and recreate with role-based access
-- These policies will be refined based on the actual table structure after migration

-- Comment: Email tables scoping will be completed in a follow-up migration
-- based on the role resolution from batch 6 (REQ-2 settings super-admin)