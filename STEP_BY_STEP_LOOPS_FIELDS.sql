-- Step-by-step Loops sync fields
-- Run each command separately in Supabase SQL Editor

-- Step 1: Add loops_contact_id to nominees
ALTER TABLE public.nominees ADD COLUMN IF NOT EXISTS loops_contact_id TEXT;

-- Step 2: Add loops_synced_at to nominees  
ALTER TABLE public.nominees ADD COLUMN IF NOT EXISTS loops_synced_at TIMESTAMPTZ;

-- Step 3: Add loops_contact_id to nominators
ALTER TABLE public.nominators ADD COLUMN IF NOT EXISTS loops_contact_id TEXT;

-- Step 4: Add loops_synced_at to nominators
ALTER TABLE public.nominators ADD COLUMN IF NOT EXISTS loops_synced_at TIMESTAMPTZ;

-- Step 5: Add loops_contact_id to voters
ALTER TABLE public.voters ADD COLUMN IF NOT EXISTS loops_contact_id TEXT;

-- Step 6: Add loops_synced_at to voters
ALTER TABLE public.voters ADD COLUMN IF NOT EXISTS loops_synced_at TIMESTAMPTZ;