-- WSA 2026 Supabase Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- NOMINATIONS: person/company nominees
CREATE TABLE IF NOT EXISTS public.nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('person','company')),
  category_group_id TEXT NOT NULL,
  subcategory_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'submitted' CHECK (state IN ('submitted','approved','rejected')),
  
  -- person fields
  firstname TEXT,
  lastname TEXT,
  jobtitle TEXT,
  person_email TEXT,
  person_linkedin TEXT,
  headshot_url TEXT, -- Required for person nominations, enforced at application level
  why_me TEXT,
  
  -- company fields
  company_name TEXT,
  company_domain TEXT,
  company_website TEXT,
  company_linkedin TEXT,
  logo_url TEXT,
  why_us TEXT,
  
  -- shared
  live_url TEXT,
  votes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nominations_subcat ON public.nominations(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_nominations_state ON public.nominations(state);

-- NOMINATORS: one per email+subcategory (status moves to approved when nominee is approved)
CREATE TABLE IF NOT EXISTS public.nominators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  linkedin TEXT,
  nominated_display_name TEXT NOT NULL,
  category_group_id TEXT NOT NULL,
  subcategory_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_nominator_email_subcat ON public.nominators (lower(email), subcategory_id);

-- VOTERS: one vote per email+subcategory
CREATE TABLE IF NOT EXISTS public.voters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  linkedin TEXT NOT NULL,
  subcategory_id TEXT NOT NULL,
  voted_for_display_name TEXT NOT NULL,
  vote_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_vote_email_subcat ON public.voters (lower(email), subcategory_id);

-- OUTBOX: durable queue for later HubSpot sync (no external calls in this task)
CREATE TABLE IF NOT EXISTS public.hubspot_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('nomination_submitted','nomination_approved','vote_cast')),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','dead')),
  attempt_count INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbox_status_created ON public.hubspot_outbox(status, created_at);

-- Optional: public view for directory (approved only)
CREATE OR REPLACE VIEW public.public_nominees AS
SELECT
  id,
  type,
  subcategory_id,
  CASE 
    WHEN type='person' THEN COALESCE(firstname,'') || ' ' || COALESCE(lastname,'')
    ELSE COALESCE(company_name,'')
  END AS display_name,
  COALESCE(live_url,'') AS live_url,
  votes
FROM public.nominations
WHERE state='approved';

-- Triggers to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; 
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_nominations ON public.nominations;
CREATE TRIGGER set_updated_at_nominations 
  BEFORE UPDATE ON public.nominations
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_nominators ON public.nominators;
CREATE TRIGGER set_updated_at_nominators 
  BEFORE UPDATE ON public.nominators
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_outbox ON public.hubspot_outbox;
CREATE TRIGGER set_updated_at_outbox 
  BEFORE UPDATE ON public.hubspot_outbox
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Enable RLS (Service Role key bypasses this)
ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubspot_outbox ENABLE ROW LEVEL SECURITY;