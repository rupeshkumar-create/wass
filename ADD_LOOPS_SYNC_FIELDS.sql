-- Add Loops sync fields to existing tables
-- Run this in Supabase SQL Editor to add Loops integration fields

-- Add Loops sync fields to nominees table
ALTER TABLE public.nominees 
ADD COLUMN IF NOT EXISTS loops_contact_id TEXT,
ADD COLUMN IF NOT EXISTS loops_synced_at TIMESTAMPTZ;

-- Add Loops sync fields to nominators table  
ALTER TABLE public.nominators
ADD COLUMN IF NOT EXISTS loops_contact_id TEXT,
ADD COLUMN IF NOT EXISTS loops_synced_at TIMESTAMPTZ;

-- Add Loops sync fields to voters table
ALTER TABLE public.voters
ADD COLUMN IF NOT EXISTS loops_contact_id TEXT,
ADD COLUMN IF NOT EXISTS loops_synced_at TIMESTAMPTZ;

-- Create indexes for efficient Loops sync queries
CREATE INDEX IF NOT EXISTS idx_nominees_loops_contact_id ON public.nominees(loops_contact_id);
CREATE INDEX IF NOT EXISTS idx_nominees_loops_synced_at ON public.nominees(loops_synced_at);

CREATE INDEX IF NOT EXISTS idx_nominators_loops_contact_id ON public.nominators(loops_contact_id);
CREATE INDEX IF NOT EXISTS idx_nominators_loops_synced_at ON public.nominators(loops_synced_at);

CREATE INDEX IF NOT EXISTS idx_voters_loops_contact_id ON public.voters(loops_contact_id);
CREATE INDEX IF NOT EXISTS idx_voters_loops_synced_at ON public.voters(loops_synced_at);

-- Success message
-- Loops sync fields added successfully!
-- Added loops_contact_id and loops_synced_at to nominees, nominators, and voters tables