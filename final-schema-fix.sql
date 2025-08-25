-- WSA 2026 - FINAL SCHEMA FIX
-- This script will definitively fix all column issues
-- Run this in your Supabase SQL Editor

BEGIN;

-- Step 1: Drop all dependent objects to avoid conflicts
DROP FUNCTION IF EXISTS public.get_nominee_by_slug(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_podium() CASCADE;
DROP VIEW IF EXISTS public.public_nominees CASCADE;

-- Step 2: Check what columns actually exist in nominations table
-- (You can uncomment this to see current structure)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'nominations' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- Step 3: Add ALL missing columns that the API expects
-- This is idempotent - won't fail if columns already exist
ALTER TABLE public.nominations 
ADD COLUMN IF NOT EXISTS nominee_title TEXT,
ADD COLUMN IF NOT EXISTS nominee_country TEXT,
ADD COLUMN IF NOT EXISTS nominee_first_name TEXT,
ADD COLUMN IF NOT EXISTS nominee_last_name TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS company_country TEXT,
ADD COLUMN IF NOT EXISTS nominee_linkedin_norm TEXT,
ADD COLUMN IF NOT EXISTS linkedin_norm TEXT,
ADD COLUMN IF NOT EXISTS why_vote_for_me TEXT,
ADD COLUMN IF NOT EXISTS nominator_linkedin TEXT,
ADD COLUMN IF NOT EXISTS nominator_first_name TEXT,
ADD COLUMN IF NOT EXISTS nominator_last_name TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS live_url TEXT;

-- Step 4: Backfill data from existing columns where possible
UPDATE public.nominations SET
  -- Map nominee_company to company_name if company_name is null
  company_name = COALESCE(company_name, nominee_company),
  
  -- Map nominee_linkedin to linkedin_norm if linkedin_norm is null
  linkedin_norm = COALESCE(linkedin_norm, nominee_linkedin_norm, nominee_linkedin),
  nominee_linkedin_norm = COALESCE(nominee_linkedin_norm, linkedin_norm, nominee_linkedin),
  
  -- Split nominee_name into first/last if they're null
  nominee_first_name = COALESCE(nominee_first_name, 
    CASE WHEN position(' ' in nominee_name) > 0 
         THEN split_part(nominee_name, ' ', 1)
         ELSE nominee_name END),
  nominee_last_name = COALESCE(nominee_last_name,
    CASE WHEN position(' ' in nominee_name) > 0 
         THEN substring(nominee_name from position(' ' in nominee_name) + 1)
         ELSE '' END),
         
  -- Split nominator_name into first/last if they're null
  nominator_first_name = COALESCE(nominator_first_name,
    CASE WHEN position(' ' in nominator_name) > 0 
         THEN split_part(nominator_name, ' ', 1)
         ELSE nominator_name END),
  nominator_last_name = COALESCE(nominator_last_name,
    CASE WHEN position(' ' in nominator_name) > 0 
         THEN substring(nominator_name from position(' ' in nominator_name) + 1)
         ELSE '' END),
         
  -- Set approved_at for approved nominations
  approved_at = COALESCE(approved_at, 
    CASE WHEN status = 'approved' THEN COALESCE(moderated_at, created_at) END),
    
  -- Set live_url from live_slug
  live_url = COALESCE(live_url, 
    CASE WHEN live_slug IS NOT NULL THEN '/nominee/' || live_slug END)
WHERE 
  company_name IS NULL OR 
  linkedin_norm IS NULL OR 
  nominee_first_name IS NULL OR 
  nominator_first_name IS NULL OR 
  approved_at IS NULL OR 
  live_url IS NULL;

-- Step 5: Create the public_nominees view with ALL expected columns
CREATE VIEW public.public_nominees AS
SELECT 
  n.id,
  n.category,
  n.type,
  n.nominee_name,
  n.nominee_title,
  n.nominee_first_name,
  n.nominee_last_name,
  n.nominee_country,
  n.company_name,
  n.company_website,
  n.company_country,
  n.linkedin_norm,
  n.image_url,
  n.live_slug,
  n.status,
  n.created_at,
  n.why_vote_for_me,
  COALESCE(vc.vote_count, 0)::INT AS votes
FROM public.nominations n
LEFT JOIN (
  SELECT nominee_id, COUNT(*)::INT AS vote_count
  FROM public.votes 
  GROUP BY nominee_id
) vc ON vc.nominee_id = n.id
WHERE n.status = 'approved'
ORDER BY vc.vote_count DESC NULLS LAST, n.created_at ASC;

-- Step 6: Grant permissions
GRANT SELECT ON public.public_nominees TO anon, authenticated;

-- Step 7: Recreate helper functions
CREATE FUNCTION public.get_nominee_by_slug(p_slug text)
RETURNS TABLE(
  id uuid,
  category text,
  type text,
  nominee_name text,
  nominee_title text,
  nominee_first_name text,
  nominee_last_name text,
  nominee_country text,
  company_name text,
  company_website text,
  company_country text,
  linkedin_norm text,
  image_url text,
  live_slug text,
  status text,
  created_at timestamptz,
  why_vote_for_me text,
  votes int
) 
LANGUAGE sql STABLE AS $$
  SELECT 
    pn.id, pn.category, pn.type, pn.nominee_name, pn.nominee_title,
    pn.nominee_first_name, pn.nominee_last_name, pn.nominee_country,
    pn.company_name, pn.company_website, pn.company_country,
    pn.linkedin_norm, pn.image_url, pn.live_slug, pn.status,
    pn.created_at, pn.why_vote_for_me, pn.votes
  FROM public.public_nominees pn
  WHERE pn.live_slug = p_slug
$$;

CREATE FUNCTION public.get_podium()
RETURNS TABLE(
  category text,
  position_rank int,
  nominee_id uuid,
  nominee_name text,
  company_name text,
  image_url text,
  live_slug text,
  votes int
) 
LANGUAGE sql STABLE AS $$
  WITH ranked AS (
    SELECT 
      pn.category,
      pn.id AS nominee_id,
      pn.nominee_name,
      pn.company_name,
      pn.image_url,
      pn.live_slug,
      pn.votes,
      ROW_NUMBER() OVER (
        PARTITION BY pn.category 
        ORDER BY pn.votes DESC, pn.created_at ASC
      ) AS rn
    FROM public.public_nominees pn
  )
  SELECT 
    r.category, 
    r.rn::int AS position_rank, 
    r.nominee_id, 
    r.nominee_name, 
    r.company_name, 
    r.image_url, 
    r.live_slug, 
    r.votes
  FROM ranked r
  WHERE r.rn <= 3
  ORDER BY r.category, r.rn
$$;

-- Step 8: Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_nominations_nominee_title ON public.nominations(nominee_title);
CREATE INDEX IF NOT EXISTS idx_nominations_company_name ON public.nominations(company_name);
CREATE INDEX IF NOT EXISTS idx_nominations_linkedin_norm ON public.nominations(linkedin_norm);
CREATE INDEX IF NOT EXISTS idx_nominations_approved_at ON public.nominations(approved_at);

COMMIT;

-- Step 9: Verify the fix worked
SELECT 'Schema fix completed successfully!' as status;

-- Test the view
SELECT COUNT(*) as total_nominees FROM public.public_nominees;

-- Show sample data structure
SELECT 
  id, category, type, nominee_name, nominee_title, company_name, votes
FROM public.public_nominees 
LIMIT 3;