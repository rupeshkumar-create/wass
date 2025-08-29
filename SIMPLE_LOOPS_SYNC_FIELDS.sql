-- Simple Loops sync fields addition
-- Copy and paste these commands one by one into Supabase SQL Editor

-- Add Loops sync fields to nominees table
ALTER TABLE public.nominees ADD COLUMN IF NOT EXISTS loops_contact_id TEXT;
ALTER TABLE public.nominees ADD COLUMN IF NOT EXISTS loops_synced_at TIMESTAMPTZ;

-- Add Loops sync fields to nominators table  
ALTER TABLE public.nominators ADD COLUMN IF NOT EXISTS loops_contact_id TEXT;
ALTER TABLE public.nominators ADD COLUMN IF NOT EXISTS loops_synced_at TIMESTAMPTZ;

-- Add Loops sync fields to voters table
ALTER TABLE public.voters ADD COLUMN IF NOT EXISTS loops_contact_id TEXT;
ALTER TABLE public.voters ADD COLUMN IF NOT EXISTS loops_synced_at TIMESTAMPTZ;

-- Create indexes for efficient Loops sync queries
CREATE INDEX IF NOT EXISTS idx_nominees_loops_contact_id ON public.nominees(loops_contact_id);
CREATE INDEX IF NOT EXISTS idx_nominees_loops_synced_at ON public.nominees(loops_synced_at);

CREATE INDEX IF NOT EXISTS idx_nominators_loops_contact_id ON public.nominators(loops_contact_id);
CREATE INDEX IF NOT EXISTS idx_nominators_loops_synced_at ON public.nominators(loops_synced_at);

CREATE INDEX IF NOT EXISTS idx_voters_loops_contact_id ON public.voters(loops_contact_id);
CREATE INDEX IF NOT EXISTS idx_voters_loops_synced_at ON public.voters(loops_synced_at);