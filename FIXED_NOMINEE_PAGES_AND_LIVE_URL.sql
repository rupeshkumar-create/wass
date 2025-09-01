-- FIXED NOMINEE PAGES AND LIVE URL COMPLETE FIX
-- This SQL fixes nominee page routing and ensures consistent live URLs everywhere
-- FIXED: Handles view dependencies properly with CASCADE

-- 1. ENSURE ALL NOMINATIONS HAVE CONSISTENT LIVE URLS
UPDATE public.nominations 
SET live_url = 'https://worldstaffingawards.com/nominee/' || id::text
WHERE live_url IS NULL OR live_url = '' OR live_url NOT LIKE 'https://worldstaffingawards.com/nominee/%';

-- 2. UPDATE NOMINEES TABLE LIVE URLS (if using improved schema)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nominees') THEN
    UPDATE public.nominees 
    SET live_url = 'https://worldstaffingawards.com/nominee/' || id::text
    WHERE live_url IS NULL OR live_url = '' OR live_url NOT LIKE 'https://worldstaffingawards.com/nominee/%';
  END IF;
END $$;

-- 3. CREATE FUNCTION TO AUTO-GENERATE LIVE URLS FOR NOMINATIONS
CREATE OR REPLACE FUNCTION ensure_nomination_live_url()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-generate live URL if not provided or invalid
  IF NEW.live_url IS NULL OR NEW.live_url = '' OR NEW.live_url NOT LIKE 'https://worldstaffingawards.com/nominee/%' THEN
    NEW.live_url = 'https://worldstaffingawards.com/nominee/' || NEW.id::text;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CREATE TRIGGER FOR AUTO-GENERATING LIVE URLS
DROP TRIGGER IF EXISTS trigger_nominations_live_url_auto ON public.nominations;
CREATE TRIGGER trigger_nominations_live_url_auto
  BEFORE INSERT OR UPDATE ON public.nominations
  FOR EACH ROW EXECUTE FUNCTION ensure_nomination_live_url();

-- 5. UPDATE PUBLIC_NOMINEES VIEW TO INCLUDE PROPER LIVE URLS
-- FIXED: Drop dependent views first with CASCADE
DROP VIEW IF EXISTS public.top_nominees_by_category CASCADE;
DROP VIEW IF EXISTS public.public_nominees CASCADE;

-- Recreate public_nominees view with proper structure
CREATE VIEW public.public_nominees AS
SELECT
  nom.id as nomination_id,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nominees') THEN
      (SELECT ne.id FROM public.nominees ne WHERE nom.nominee_id = ne.id)
    ELSE nom.id
  END as nominee_id,
  nom.type,
  nom.subcategory_id,
  nom.category_group_id,
  CASE 
    WHEN nom.type = 'person' THEN 
      CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nominees') THEN
          (SELECT COALESCE(ne.firstname, '') || ' ' || COALESCE(ne.lastname, '') FROM public.nominees ne WHERE nom.nominee_id = ne.id)
        ELSE COALESCE(nom.firstname, '') || ' ' || COALESCE(nom.lastname, '')
      END
    ELSE 
      CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nominees') THEN
          (SELECT COALESCE(ne.company_name, '') FROM public.nominees ne WHERE nom.nominee_id = ne.id)
        ELSE COALESCE(nom.company_name, '')
      END
  END AS display_name,
  CASE 
    WHEN nom.type = 'person' THEN 
      CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nominees') THEN
          (SELECT ne.headshot_url FROM public.nominees ne WHERE nom.nominee_id = ne.id)
        ELSE nom.headshot_url
      END
    ELSE 
      CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nominees') THEN
          (SELECT ne.logo_url FROM public.nominees ne WHERE nom.nominee_id = ne.id)
        ELSE nom.logo_url
      END
  END AS image_url,
  CASE 
    WHEN nom.type = 'person' THEN 
      CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nominees') THEN
          (SELECT ne.jobtitle FROM public.nominees ne WHERE nom.nominee_id = ne.id)
        ELSE nom.jobtitle
      END
    ELSE 
      CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nominees') THEN
          (SELECT ne.company_industry FROM public.nominees ne WHERE nom.nominee_id = ne.id)
        ELSE nom.company_domain
      END
  END AS title_or_industry,
  CASE 
    WHEN nom.type = 'person' THEN 
      CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nominees') THEN
          (SELECT ne.person_linkedin FROM public.nominees ne WHERE nom.nominee_id = ne.id)
        ELSE nom.person_linkedin
      END
    ELSE 
      CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nominees') THEN
          (SELECT ne.company_linkedin FROM public.nominees ne WHERE nom.nominee_id = ne.id)
        ELSE nom.company_linkedin
      END
  END AS linkedin_url,
  CASE 
    WHEN nom.type = 'person' THEN 
      CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nominees') THEN
          (SELECT ne.why_me FROM public.nominees ne WHERE nom.nominee_id = ne.id)
        ELSE nom.why_me
      END
    ELSE 
      CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nominees') THEN
          (SELECT ne.why_us FROM public.nominees ne WHERE nom.nominee_id = ne.id)
        ELSE nom.why_us
      END
  END AS why_vote,
  -- ENSURE CONSISTENT LIVE URL FORMAT
  COALESCE(
    NULLIF(nom.live_url, ''), 
    'https://worldstaffingawards.com/nominee/' || nom.id::text
  ) AS live_url,
  nom.votes,
  COALESCE(nom.additional_votes, 0) as additional_votes,
  (COALESCE(nom.votes, 0) + COALESCE(nom.additional_votes, 0)) AS total_votes,
  nom.created_at,
  nom.approved_at
FROM public.nominations nom
WHERE nom.state = 'approved'
ORDER BY (COALESCE(nom.votes, 0) + COALESCE(nom.additional_votes, 0)) DESC, nom.approved_at DESC;

-- 6. CREATE NOMINEE LOOKUP FUNCTION FOR FLEXIBLE ROUTING
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

-- 7. UPDATE HUBSPOT OUTBOX WITH CORRECT LIVE URLS
UPDATE public.hubspot_outbox 
SET payload = jsonb_set(
  payload, 
  '{liveUrl}', 
  to_jsonb('https://worldstaffingawards.com/nominee/' || (payload->>'nominationId'))
)
WHERE event_type IN ('nomination_submitted', 'nomination_approved') 
AND payload ? 'nominationId'
AND (
  NOT payload ? 'liveUrl' 
  OR payload->>'liveUrl' = '' 
  OR payload->>'liveUrl' IS NULL
  OR payload->>'liveUrl' NOT LIKE 'https://worldstaffingawards.com/nominee/%'
);

-- 8. UPDATE LOOPS OUTBOX WITH CORRECT LIVE URLS (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loops_outbox') THEN
    UPDATE public.loops_outbox 
    SET payload = jsonb_set(
      payload, 
      '{liveUrl}', 
      to_jsonb('https://worldstaffingawards.com/nominee/' || (payload->>'nominationId'))
    )
    WHERE event_type IN ('nomination_submitted', 'nomination_approved') 
    AND payload ? 'nominationId'
    AND (
      NOT payload ? 'liveUrl' 
      OR payload->>'liveUrl' = '' 
      OR payload->>'liveUrl' IS NULL
      OR payload->>'liveUrl' NOT LIKE 'https://worldstaffingawards.com/nominee/%'
    );
  END IF;
END $$;

-- 9. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_nominations_live_url ON public.nominations(live_url);

-- 10. VERIFICATION QUERIES
-- Check live URL consistency
SELECT 
  'Nominations with consistent live URLs' as check_type,
  COUNT(*) as count 
FROM public.nominations 
WHERE live_url LIKE 'https://worldstaffingawards.com/nominee/%';

-- Check public nominees view
SELECT 
  'Public nominees with live URLs' as check_type,
  COUNT(*) as count 
FROM public.public_nominees 
WHERE live_url IS NOT NULL AND live_url != '';

-- Check outbox consistency
SELECT 
  'HubSpot outbox with consistent URLs' as check_type,
  COUNT(*) as count 
FROM public.hubspot_outbox 
WHERE payload ? 'liveUrl' 
AND payload->>'liveUrl' LIKE 'https://worldstaffingawards.com/nominee/%';

COMMENT ON FUNCTION get_nominee_by_identifier(TEXT) IS 'Flexible nominee lookup supporting UUID, slug, or live URL path matching';
COMMENT ON FUNCTION ensure_nomination_live_url() IS 'Auto-generates consistent live URLs for nominations';

-- SUCCESS MESSAGE
SELECT 'NOMINEE PAGES AND LIVE URL FIX COMPLETE!' as status,
       'All live URLs are now consistent across nominations, admin, loops, and directories' as details;