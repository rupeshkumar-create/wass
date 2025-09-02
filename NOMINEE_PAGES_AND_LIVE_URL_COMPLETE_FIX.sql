-- NOMINEE PAGES AND LIVE URL COMPLETE FIX
-- This SQL fixes nominee page routing and ensures consistent live URLs everywhere

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
DROP VIEW IF EXISTS public.public_nominees;
CREATE VIEW public.public_nominees AS
SELECT
  nom.id as nomination_id,
  ne.id as nominee_id,
  ne.type,
  nom.subcategory_id,
  nom.category_group_id,
  CASE 
    WHEN ne.type = 'person' THEN COALESCE(ne.firstname, '') || ' ' || COALESCE(ne.lastname, '')
    ELSE COALESCE(ne.company_name, '')
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
    NULLIF(nom.live_url, ''), 
    'https://worldstaffingawards.com/nominee/' || nom.id::text
  ) AS live_url,
  nom.votes,
  nom.additional_votes,
  (COALESCE(nom.votes, 0) + COALESCE(nom.additional_votes, 0)) AS total_votes,
  nom.created_at,
  nom.approved_at,
  -- Include all nominee fields for complete data access
  ne.firstname,
  ne.lastname,
  ne.person_email,
  ne.person_linkedin,
  ne.person_phone,
  ne.person_company,
  ne.person_country,
  ne.headshot_url,
  ne.why_me,
  ne.company_name,
  ne.company_domain,
  ne.company_website,
  ne.company_linkedin,
  ne.company_phone,
  ne.company_country,
  ne.company_size,
  ne.company_industry,
  ne.logo_url,
  ne.why_us,
  ne.bio,
  ne.achievements,
  ne.social_media,
  -- WSA tag fields
  ne.wsa_tags,
  ne.wsa_contact_tag,
  ne.wsa_role,
  ne.wsa_year,
  ne.hubspot_contact_id,
  ne.loops_contact_id
FROM public.nominations nom
JOIN public.nominees ne ON nom.nominee_id = ne.id
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
  approved_at TIMESTAMPTZ,
  firstname TEXT,
  lastname TEXT,
  person_email TEXT,
  person_linkedin TEXT,
  person_phone TEXT,
  person_company TEXT,
  person_country TEXT,
  headshot_url TEXT,
  why_me TEXT,
  company_name TEXT,
  company_domain TEXT,
  company_website TEXT,
  company_linkedin TEXT,
  company_phone TEXT,
  company_country TEXT,
  company_size TEXT,
  company_industry TEXT,
  logo_url TEXT,
  why_us TEXT,
  bio TEXT,
  achievements TEXT,
  social_media JSONB,
  wsa_tags TEXT,
  wsa_contact_tag TEXT,
  wsa_role TEXT,
  wsa_year TEXT,
  hubspot_contact_id TEXT,
  loops_contact_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.public_nominees pn
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

-- 9. CREATE ADMIN VIEW WITH CONSISTENT LIVE URLS
DROP VIEW IF EXISTS public.admin_nominations;
CREATE VIEW public.admin_nominations AS
SELECT
  nom.id as nomination_id,
  nom.state,
  nom.votes,
  nom.additional_votes,
  (COALESCE(nom.votes, 0) + COALESCE(nom.additional_votes, 0)) AS total_votes,
  nom.subcategory_id,
  nom.category_group_id,
  nom.admin_notes,
  nom.rejection_reason,
  nom.created_at,
  nom.updated_at,
  nom.approved_at,
  nom.approved_by,
  
  -- CONSISTENT LIVE URL
  COALESCE(
    NULLIF(nom.live_url, ''), 
    'https://worldstaffingawards.com/nominee/' || nom.id::text
  ) AS live_url,
  
  -- Nominee data
  ne.id as nominee_id,
  ne.type as nominee_type,
  ne.firstname as nominee_firstname,
  ne.lastname as nominee_lastname,
  ne.person_email as nominee_email,
  ne.person_linkedin as nominee_linkedin,
  ne.jobtitle as nominee_jobtitle,
  ne.headshot_url,
  ne.why_me,
  ne.company_name,
  ne.company_website,
  ne.company_linkedin,
  ne.logo_url,
  ne.why_us,
  
  CASE 
    WHEN ne.type = 'person' THEN COALESCE(ne.firstname, '') || ' ' || COALESCE(ne.lastname, '')
    ELSE COALESCE(ne.company_name, '')
  END AS nominee_display_name,
  
  CASE 
    WHEN ne.type = 'person' THEN ne.headshot_url
    ELSE ne.logo_url
  END AS nominee_image_url,
  
  -- Nominator data
  nr.id as nominator_id,
  nr.email as nominator_email,
  nr.firstname as nominator_firstname,
  nr.lastname as nominator_lastname,
  nr.linkedin as nominator_linkedin,
  nr.company as nominator_company,
  nr.job_title as nominator_job_title
  
FROM public.nominations nom
JOIN public.nominees ne ON nom.nominee_id = ne.id
JOIN public.nominators nr ON nom.nominator_id = nr.id
ORDER BY nom.created_at DESC;

-- 10. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_nominations_live_url ON public.nominations(live_url);
CREATE INDEX IF NOT EXISTS idx_nominees_live_url ON public.nominees(live_url);

-- 11. VERIFICATION QUERIES
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