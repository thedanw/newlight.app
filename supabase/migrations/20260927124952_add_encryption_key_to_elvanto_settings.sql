-- Add missing encryption_key_encrypted column to elvanto_settings
-- This column was in the original migration but appears to be missing from the remote database

ALTER TABLE public.elvanto_settings 
ADD COLUMN IF NOT EXISTS encryption_key_encrypted text NOT NULL DEFAULT '';

-- Update existing rows to have a placeholder value (will be replaced when settings are saved)
UPDATE public.elvanto_settings 
SET encryption_key_encrypted = '' 
WHERE encryption_key_encrypted IS NULL OR encryption_key_encrypted = '';

-- Make the column NOT NULL after populating
ALTER TABLE public.elvanto_settings 
ALTER COLUMN encryption_key_encrypted SET NOT NULL;