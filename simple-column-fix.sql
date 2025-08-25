-- Simple Column Fix - Just add missing columns and create basic view
-- Run this in Supabase SQL Editor

BEGIN;

-- Step 1: Add missing columns (safe to run multiple times)
ALTER TABLE public.nominations 
ADD COLUMN IF NOT EXISTS nominee_title TEXT,
ADD COLUMN IF NOT EXISTS nominee_country TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS company_country TEXT,
ADD COLUMN IF NOT EXISTS linkedin_norm TEXT,
ADD COLUMN IF NOT EXISTS why_vote_for_me TEXT;

-- Step 2: Backfill linkedin_norm from existing data
UPDATE public.nominations 
SET linkedin_norm = COALESCE(linkedin_norm, nominee_linkedin_norm, nominee_linkedin)
WHERE linkedin_norm IS NULL AND (nominee_linkedin_norm IS NOT NULL OR nominee_linkedin IS NOT NULL);

-- Step 3: Backfill company_name from nominee_company
UPDATE public.nominations 
SET company_name = nominee_company
WHERE company_name IS NULL AND nominee_company IS NOT NULL;

-- Step 4: Drop and recreate the view with all expected columns
DROP VIEW IF EXISTS public.public_nominees CASCADE;

CREATE VIEW public.public_nominees AS
SELECT 
  n.id,
  n.category,
  n.type,
  n.nominee_name,
  n.nominee_title,
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

-- Step 5: Grant permissions
GRANT SELECT ON public.public_nominees TO anon, authenticated;

COMMIT;

-- Test the view
SELECT 'Simple column fix completed!' as status;
SELECT COUNT(*) as total_nominees FROM public.public_nominees;