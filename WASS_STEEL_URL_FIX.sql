-- WASS-STEEL URL FIX - Update all URLs to use wass-steel.vercel.app
-- Run this in Supabase SQL Editor

-- 1. Update all nominees with correct production URLs
UPDATE public.nominees 
SET live_url = 'https://wass-steel.vercel.app/nominee/' || id::text;

-- 2. Update the trigger function to use correct production URL
CREATE OR REPLACE FUNCTION ensure_nominee_live_url()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-generate live URL with correct production domain
  IF NEW.live_url IS NULL OR NEW.live_url = '' OR NEW.live_url NOT LIKE 'https://wass-steel.vercel.app/nominee/%' THEN
    NEW.live_url = 'https://wass-steel.vercel.app/nominee/' || NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Update public_nominees view to use correct production URLs
DROP VIEW IF EXISTS public.public_nominees CASCADE;

CREATE VIEW public.public_nominees AS
SELECT
  nom.id as nomination_id,
  ne.id as nominee_id,
  ne.type,
  nom.subcategory_id,
  nom.category_group_id,
  CASE 
    WHEN ne.type = 'person' THEN 
      COALESCE(ne.firstname, '') || ' ' || COALESCE(ne.lastname, '')
    ELSE 
      COALESCE(ne.company_name, '')
  END AS display_name,
  CASE 
    WHEN ne.type = 'person' THEN ne.headshot_url
    ELSE ne.logo_url
  END AS image_url,
  CASE 
    WHEN ne.type = 'person' THEN ne.jobtitle
    ELSE ne.company_industry
  END AS title_or_industry,
  CASE 
    WHEN ne.type = 'person' THEN ne.person_linkedin
    ELSE ne.company_linkedin
  END AS linkedin_url,
  CASE 
    WHEN ne.type = 'person' THEN ne.why_me
    ELSE ne.why_us
  END AS why_vote,
  -- ENSURE CORRECT PRODUCTION LIVE URL FORMAT
  COALESCE(
    NULLIF(ne.live_url, ''), 
    'https://wass-steel.vercel.app/nominee/' || ne.id::text
  ) AS live_url,
  nom.votes,
  COALESCE(nom.additional_votes, 0) as additional_votes,
  (COALESCE(nom.votes, 0) + COALESCE(nom.additional_votes, 0)) AS total_votes,
  nom.created_at,
  nom.approved_at
FROM public.nominations nom
JOIN public.nominees ne ON nom.nominee_id = ne.id
WHERE nom.state = 'approved'
ORDER BY (COALESCE(nom.votes, 0) + COALESCE(nom.additional_votes, 0)) DESC, nom.approved_at DESC;

-- 4. Update HubSpot outbox with correct production URLs
UPDATE public.hubspot_outbox 
SET payload = jsonb_set(
  payload, 
  '{liveUrl}', 
  to_jsonb('https://wass-steel.vercel.app/nominee/' || (payload->>'nomineeId'))
)
WHERE event_type IN ('nomination_submitted', 'nomination_approved') 
AND payload ? 'nomineeId';

-- 5. Update Loops outbox with correct production URLs (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loops_outbox') THEN
    UPDATE public.loops_outbox 
    SET payload = jsonb_set(
      payload, 
      '{liveUrl}', 
      to_jsonb('https://wass-steel.vercel.app/nominee/' || (payload->>'nomineeId'))
    )
    WHERE event_type IN ('nomination_submitted', 'nomination_approved') 
    AND payload ? 'nomineeId';
  END IF;
END $$;

-- 6. Verification
SELECT 
  'wass-steel.vercel.app URLs updated' as status,
  COUNT(*) as total_nominees,
  COUNT(CASE WHEN live_url LIKE 'https://wass-steel.vercel.app/nominee/%' THEN 1 END) as correct_urls
FROM public.nominees;

-- 7. Sample URLs check
SELECT 
  'Sample URLs' as check_type,
  id,
  live_url
FROM public.nominees 
LIMIT 5;

SELECT 'WASS-STEEL URL FIX COMPLETED!' as message;