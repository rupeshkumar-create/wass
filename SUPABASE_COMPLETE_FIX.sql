-- COMPLETE SUPABASE FIX FOR LIVE URLs AND ADMIN VOTE UPDATES
-- Run this entire script in your Supabase SQL Editor

-- ========================================
-- 1. ADD MISSING ENVIRONMENT VARIABLE COLUMN
-- ========================================

-- Add additional_votes column to nominations table if it doesn't exist
ALTER TABLE public.nominations 
ADD COLUMN IF NOT EXISTS additional_votes INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.nominations.additional_votes IS 'Manual additional votes added by admin, added to real votes for total display';

-- Update any existing nominations to have 0 additional votes if NULL
UPDATE public.nominations 
SET additional_votes = 0 
WHERE additional_votes IS NULL;

-- ========================================
-- 2. ENSURE ALL NOMINEES HAVE CONSISTENT LIVE URLS
-- ========================================

-- Update nominees live URLs to use consistent format
UPDATE public.nominees 
SET live_url = 'https://worldstaffingawards.com/nominee/' || id::text
WHERE live_url IS NULL OR live_url = '' OR live_url NOT LIKE 'https://worldstaffingawards.com/nominee/%';

-- ========================================
-- 3. CREATE FUNCTION TO AUTO-GENERATE LIVE URLS FOR NOMINEES
-- ========================================

CREATE OR REPLACE FUNCTION ensure_nominee_live_url()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-generate live URL if not provided or invalid
  IF NEW.live_url IS NULL OR NEW.live_url = '' OR NEW.live_url NOT LIKE 'https://worldstaffingawards.com/nominee/%' THEN
    NEW.live_url = 'https://worldstaffingawards.com/nominee/' || NEW.id::text;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 4. CREATE TRIGGER FOR AUTO-GENERATING LIVE URLS ON NOMINEES
-- ========================================

DROP TRIGGER IF EXISTS trigger_nominees_live_url_auto ON public.nominees;
CREATE TRIGGER trigger_nominees_live_url_auto
  BEFORE INSERT OR UPDATE ON public.nominees
  FOR EACH ROW EXECUTE FUNCTION ensure_nominee_live_url();

-- ========================================
-- 5. UPDATE PUBLIC_NOMINEES VIEW TO INCLUDE PROPER LIVE URLS
-- ========================================

-- Drop dependent views first with CASCADE
DROP VIEW IF EXISTS public.top_nominees_by_category CASCADE;
DROP VIEW IF EXISTS public.public_nominees CASCADE;

-- Recreate public_nominees view with proper structure using nominees table
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
  -- ENSURE CONSISTENT LIVE URL FORMAT
  COALESCE(
    NULLIF(ne.live_url, ''), 
    'https://worldstaffingawards.com/nominee/' || ne.id::text
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

-- ========================================
-- 6. CREATE NOMINEE LOOKUP FUNCTION FOR FLEXIBLE ROUTING
-- ========================================

CREATE OR REPLACE FUNCTION get_nominee_by_identifier(identifier TEXT)
RETURNS TABLE (
  nomination_id UUID,
  nominee_id UUID,
  type TEXT,
  subcategory_id TEXT,
  category_group_id TEXT,
  display_name TEXT,
  image_url TEXT,
  title_or_industry TEXT,
  linkedin_url TEXT,
  why_vote TEXT,
  live_url TEXT,
  votes INTEGER,
  additional_votes INTEGER,
  total_votes INTEGER,
  created_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pn.nomination_id,
    pn.nominee_id,
    pn.type,
    pn.subcategory_id,
    pn.category_group_id,
    pn.display_name,
    pn.image_url,
    pn.title_or_industry,
    pn.linkedin_url,
    pn.why_vote,
    pn.live_url,
    pn.votes,
    pn.additional_votes,
    pn.total_votes,
    pn.created_at,
    pn.approved_at
  FROM public.public_nominees pn
  WHERE 
    -- Match by nomination ID (UUID)
    pn.nomination_id::text = identifier
    OR
    -- Match by nominee ID (UUID)  
    pn.nominee_id::text = identifier
    OR
    -- Match by live URL path
    pn.live_url LIKE '%/' || identifier
    OR
    -- Match by display name slug
    LOWER(REPLACE(REPLACE(pn.display_name, ' ', '-'), '''', '')) = LOWER(identifier)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. UPDATE HUBSPOT OUTBOX WITH CORRECT LIVE URLS
-- ========================================

UPDATE public.hubspot_outbox 
SET payload = jsonb_set(
  payload, 
  '{liveUrl}', 
  to_jsonb('https://worldstaffingawards.com/nominee/' || (payload->>'nomineeId'))
)
WHERE event_type IN ('nomination_submitted', 'nomination_approved') 
AND payload ? 'nomineeId'
AND (
  NOT payload ? 'liveUrl' 
  OR payload->>'liveUrl' = '' 
  OR payload->>'liveUrl' IS NULL
  OR payload->>'liveUrl' NOT LIKE 'https://worldstaffingawards.com/nominee/%'
);

-- ========================================
-- 8. UPDATE LOOPS OUTBOX WITH CORRECT LIVE URLS (if exists)
-- ========================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loops_outbox') THEN
    UPDATE public.loops_outbox 
    SET payload = jsonb_set(
      payload, 
      '{liveUrl}', 
      to_jsonb('https://worldstaffingawards.com/nominee/' || (payload->>'nomineeId'))
    )
    WHERE event_type IN ('nomination_submitted', 'nomination_approved') 
    AND payload ? 'nomineeId'
    AND (
      NOT payload ? 'liveUrl' 
      OR payload->>'liveUrl' = '' 
      OR payload->>'liveUrl' IS NULL
      OR payload->>'liveUrl' NOT LIKE 'https://worldstaffingawards.com/nominee/%'
    );
  END IF;
END $$;

-- ========================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_nominees_live_url ON public.nominees(live_url);
CREATE INDEX IF NOT EXISTS idx_nominees_type ON public.nominees(type);
CREATE INDEX IF NOT EXISTS idx_nominations_additional_votes ON public.nominations(additional_votes);
CREATE INDEX IF NOT EXISTS idx_votes_nomination_id ON public.votes(nomination_id);

-- ========================================
-- 10. VERIFICATION QUERIES
-- ========================================

-- Check additional_votes column
SELECT 
  'Nominations with additional_votes column' as check_type,
  COUNT(*) as total_nominations,
  COUNT(additional_votes) as nominations_with_additional_votes,
  SUM(COALESCE(additional_votes, 0)) as total_additional_votes
FROM public.nominations;

-- Check live URL consistency
SELECT 
  'Nominees with consistent live URLs' as check_type,
  COUNT(*) as count 
FROM public.nominees 
WHERE live_url LIKE 'https://worldstaffingawards.com/nominee/%';

-- Check public nominees view
SELECT 
  'Public nominees with live URLs' as check_type,
  COUNT(*) as count 
FROM public.public_nominees 
WHERE live_url IS NOT NULL AND live_url != '';

-- Check votes table structure
SELECT 
  'Votes table structure check' as check_type,
  COUNT(*) as total_votes,
  COUNT(DISTINCT nomination_id) as unique_nominations_with_votes
FROM public.votes;

-- Check outbox consistency
SELECT 
  'HubSpot outbox with consistent URLs' as check_type,
  COUNT(*) as count 
FROM public.hubspot_outbox 
WHERE payload ? 'liveUrl' 
AND payload->>'liveUrl' LIKE 'https://worldstaffingawards.com/nominee/%';

-- ========================================
-- 11. COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON FUNCTION get_nominee_by_identifier(TEXT) IS 'Flexible nominee lookup supporting UUID, slug, or live URL path matching';
COMMENT ON FUNCTION ensure_nominee_live_url() IS 'Auto-generates consistent live URLs for nominees';
COMMENT ON VIEW public.public_nominees IS 'Public view of approved nominations with proper live URLs and vote totals';

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

SELECT 'COMPLETE SUPABASE FIX APPLIED SUCCESSFULLY!' as status,
       'Live URLs and admin vote updates should now work correctly' as details;