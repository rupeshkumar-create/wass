-- COMPREHENSIVE WSA FIXES - Voter Tags, Live URLs, and Schema Updates
-- Run this in Supabase SQL Editor to fix all issues permanently

-- 1. ADD WSA TAG FIELDS TO VOTERS TABLE
ALTER TABLE public.voters 
ADD COLUMN IF NOT EXISTS wsa_tags TEXT DEFAULT 'WSA 2026 Voters',
ADD COLUMN IF NOT EXISTS wsa_contact_tag TEXT DEFAULT 'WSA 2026 Voters',
ADD COLUMN IF NOT EXISTS wsa_role TEXT DEFAULT 'Voter',
ADD COLUMN IF NOT EXISTS wsa_year TEXT DEFAULT '2026',
ADD COLUMN IF NOT EXISTS wsa_source TEXT DEFAULT 'World Staffing Awards',
ADD COLUMN IF NOT EXISTS wsa_voter_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS wsa_last_vote_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS wsa_voted_for TEXT,
ADD COLUMN IF NOT EXISTS wsa_vote_category TEXT,
ADD COLUMN IF NOT EXISTS hubspot_contact_id TEXT,
ADD COLUMN IF NOT EXISTS hubspot_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS loops_contact_id TEXT,
ADD COLUMN IF NOT EXISTS loops_synced_at TIMESTAMPTZ;

-- 2. ADD WSA TAG FIELDS TO NOMINATORS TABLE
ALTER TABLE public.nominators 
ADD COLUMN IF NOT EXISTS wsa_tags TEXT DEFAULT 'WSA2026 Nominator',
ADD COLUMN IF NOT EXISTS wsa_contact_tag TEXT DEFAULT 'WSA2026 Nominator',
ADD COLUMN IF NOT EXISTS wsa_role TEXT DEFAULT 'Nominator',
ADD COLUMN IF NOT EXISTS wsa_year TEXT DEFAULT '2026',
ADD COLUMN IF NOT EXISTS wsa_source TEXT DEFAULT 'World Staffing Awards',
ADD COLUMN IF NOT EXISTS hubspot_contact_id TEXT,
ADD COLUMN IF NOT EXISTS hubspot_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS loops_contact_id TEXT,
ADD COLUMN IF NOT EXISTS loops_synced_at TIMESTAMPTZ;

-- 3. ADD WSA TAG FIELDS TO NOMINEES TABLE
ALTER TABLE public.nominees 
ADD COLUMN IF NOT EXISTS wsa_tags TEXT DEFAULT 'WSA 2026 Nominees',
ADD COLUMN IF NOT EXISTS wsa_contact_tag TEXT DEFAULT 'WSA 2026 Nominees',
ADD COLUMN IF NOT EXISTS wsa_role TEXT DEFAULT 'Nominee',
ADD COLUMN IF NOT EXISTS wsa_year TEXT DEFAULT '2026',
ADD COLUMN IF NOT EXISTS wsa_source TEXT DEFAULT 'World Staffing Awards',
ADD COLUMN IF NOT EXISTS hubspot_contact_id TEXT,
ADD COLUMN IF NOT EXISTS hubspot_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS loops_contact_id TEXT,
ADD COLUMN IF NOT EXISTS loops_synced_at TIMESTAMPTZ;

-- 4. ENSURE LIVE_URL CONSISTENCY - Update all existing nominations with proper live URLs
UPDATE public.nominations 
SET live_url = CASE 
  WHEN live_url IS NULL OR live_url = '' THEN 
    'https://worldstaffingawards.com/nominee/' || id::text
  ELSE live_url
END
WHERE live_url IS NULL OR live_url = '';

-- 5. UPDATE EXISTING VOTERS WITH WSA TAGS
UPDATE public.voters 
SET 
  wsa_tags = 'WSA 2026 Voters',
  wsa_contact_tag = 'WSA 2026 Voters',
  wsa_role = 'Voter',
  wsa_year = '2026',
  wsa_source = 'World Staffing Awards',
  wsa_voter_status = 'active'
WHERE wsa_tags IS NULL;

-- 6. UPDATE EXISTING NOMINATORS WITH WSA TAGS
UPDATE public.nominators 
SET 
  wsa_tags = 'WSA2026 Nominator',
  wsa_contact_tag = 'WSA2026 Nominator',
  wsa_role = 'Nominator',
  wsa_year = '2026',
  wsa_source = 'World Staffing Awards'
WHERE wsa_tags IS NULL;

-- 7. UPDATE EXISTING NOMINEES WITH WSA TAGS
UPDATE public.nominees 
SET 
  wsa_tags = 'WSA 2026 Nominees',
  wsa_contact_tag = 'WSA 2026 Nominees',
  wsa_role = 'Nominee',
  wsa_year = '2026',
  wsa_source = 'World Staffing Awards'
WHERE wsa_tags IS NULL;

-- 8. CREATE FUNCTION TO AUTO-SET WSA TAGS ON INSERT
CREATE OR REPLACE FUNCTION set_wsa_tags_on_insert()
RETURNS TRIGGER AS $
BEGIN
  -- Set WSA tags based on table
  IF TG_TABLE_NAME = 'voters' THEN
    NEW.wsa_tags = 'WSA 2026 Voters';
    NEW.wsa_contact_tag = 'WSA 2026 Voters';
    NEW.wsa_role = 'Voter';
  ELSIF TG_TABLE_NAME = 'nominators' THEN
    NEW.wsa_tags = 'WSA2026 Nominator';
    NEW.wsa_contact_tag = 'WSA2026 Nominator';
    NEW.wsa_role = 'Nominator';
  ELSIF TG_TABLE_NAME = 'nominees' THEN
    NEW.wsa_tags = 'WSA 2026 Nominees';
    NEW.wsa_contact_tag = 'WSA 2026 Nominees';
    NEW.wsa_role = 'Nominee';
  END IF;
  
  -- Set common WSA fields
  NEW.wsa_year = '2026';
  NEW.wsa_source = 'World Staffing Awards';
  
  -- Set voter-specific fields
  IF TG_TABLE_NAME = 'voters' THEN
    NEW.wsa_voter_status = 'active';
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- 9. CREATE TRIGGERS FOR AUTO-SETTING WSA TAGS
DROP TRIGGER IF EXISTS trigger_voters_wsa_tags ON public.voters;
CREATE TRIGGER trigger_voters_wsa_tags
  BEFORE INSERT ON public.voters
  FOR EACH ROW EXECUTE FUNCTION set_wsa_tags_on_insert();

DROP TRIGGER IF EXISTS trigger_nominators_wsa_tags ON public.nominators;
CREATE TRIGGER trigger_nominators_wsa_tags
  BEFORE INSERT ON public.nominators
  FOR EACH ROW EXECUTE FUNCTION set_wsa_tags_on_insert();

DROP TRIGGER IF EXISTS trigger_nominees_wsa_tags ON public.nominees;
CREATE TRIGGER trigger_nominees_wsa_tags
  BEFORE INSERT ON public.nominees
  FOR EACH ROW EXECUTE FUNCTION set_wsa_tags_on_insert();

-- 10. CREATE FUNCTION TO AUTO-GENERATE LIVE URLs
CREATE OR REPLACE FUNCTION set_live_url_on_nomination()
RETURNS TRIGGER AS $
BEGIN
  -- Auto-generate live URL if not provided
  IF NEW.live_url IS NULL OR NEW.live_url = '' THEN
    NEW.live_url = 'https://worldstaffingawards.com/nominee/' || NEW.id::text;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- 11. CREATE TRIGGER FOR AUTO-GENERATING LIVE URLs
DROP TRIGGER IF EXISTS trigger_nominations_live_url ON public.nominations;
CREATE TRIGGER trigger_nominations_live_url
  BEFORE INSERT OR UPDATE ON public.nominations
  FOR EACH ROW EXECUTE FUNCTION set_live_url_on_nomination();

-- 12. UPDATE PUBLIC_NOMINEES VIEW TO INCLUDE WSA TAGS AND CONSISTENT LIVE URLS
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
  -- Ensure consistent live URL format
  COALESCE(
    NULLIF(ne.live_url, ''), 
    'https://worldstaffingawards.com/nominee/' || nom.id::text
  ) AS live_url,
  nom.votes,
  nom.created_at,
  nom.approved_at,
  -- Include WSA tag information
  ne.wsa_tags,
  ne.wsa_contact_tag,
  ne.wsa_role,
  ne.wsa_year,
  ne.hubspot_contact_id,
  ne.loops_contact_id
FROM public.nominations nom
JOIN public.nominees ne ON nom.nominee_id = ne.id
WHERE nom.state = 'approved'
ORDER BY nom.votes DESC, nom.approved_at DESC;

-- 13. CREATE COMPREHENSIVE VOTER SYNC VIEW
CREATE OR REPLACE VIEW public.voter_sync_status AS
SELECT
  v.id,
  v.email,
  v.firstname,
  v.lastname,
  v.linkedin,
  v.company,
  v.job_title,
  v.country,
  v.wsa_tags,
  v.wsa_contact_tag,
  v.wsa_role,
  v.wsa_year,
  v.wsa_source,
  v.wsa_voter_status,
  v.wsa_last_vote_date,
  v.wsa_voted_for,
  v.wsa_vote_category,
  v.hubspot_contact_id,
  v.hubspot_synced_at,
  v.loops_contact_id,
  v.loops_synced_at,
  v.created_at,
  v.updated_at,
  -- Sync status indicators
  CASE 
    WHEN v.hubspot_contact_id IS NOT NULL THEN 'synced'
    ELSE 'pending'
  END AS hubspot_sync_status,
  CASE 
    WHEN v.loops_contact_id IS NOT NULL THEN 'synced'
    ELSE 'pending'
  END AS loops_sync_status,
  -- Vote count for this voter
  COUNT(vo.id) as total_votes
FROM public.voters v
LEFT JOIN public.votes vo ON v.id = vo.voter_id
GROUP BY v.id, v.email, v.firstname, v.lastname, v.linkedin, v.company, v.job_title, 
         v.country, v.wsa_tags, v.wsa_contact_tag, v.wsa_role, v.wsa_year, v.wsa_source,
         v.wsa_voter_status, v.wsa_last_vote_date, v.wsa_voted_for, v.wsa_vote_category,
         v.hubspot_contact_id, v.hubspot_synced_at, v.loops_contact_id, v.loops_synced_at,
         v.created_at, v.updated_at
ORDER BY v.created_at DESC;

-- 14. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_voters_wsa_tags ON public.voters(wsa_contact_tag);
CREATE INDEX IF NOT EXISTS idx_voters_hubspot_id ON public.voters(hubspot_contact_id);
CREATE INDEX IF NOT EXISTS idx_voters_loops_id ON public.voters(loops_contact_id);
CREATE INDEX IF NOT EXISTS idx_nominators_wsa_tags ON public.nominators(wsa_contact_tag);
CREATE INDEX IF NOT EXISTS idx_nominees_wsa_tags ON public.nominees(wsa_contact_tag);
CREATE INDEX IF NOT EXISTS idx_nominations_live_url ON public.nominations(live_url);

-- 15. GRANT PERMISSIONS (if needed)
-- GRANT SELECT, INSERT, UPDATE ON public.voters TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON public.nominators TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON public.nominees TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON public.nominations TO authenticated;

-- VERIFICATION QUERIES (run these to check the fixes)
-- SELECT 'Voters with WSA tags' as check_type, COUNT(*) as count FROM public.voters WHERE wsa_contact_tag = 'WSA 2026 Voters';
-- SELECT 'Nominators with WSA tags' as check_type, COUNT(*) as count FROM public.nominators WHERE wsa_contact_tag = 'WSA2026 Nominator';
-- SELECT 'Nominees with WSA tags' as check_type, COUNT(*) as count FROM public.nominees WHERE wsa_contact_tag = 'WSA 2026 Nominees';
-- SELECT 'Nominations with live URLs' as check_type, COUNT(*) as count FROM public.nominations WHERE live_url IS NOT NULL AND live_url != '';

COMMENT ON TABLE public.voters IS 'Voters table with WSA tagging support for HubSpot and Loops sync';
COMMENT ON TABLE public.nominators IS 'Nominators table with WSA tagging support for HubSpot and Loops sync';
COMMENT ON TABLE public.nominees IS 'Nominees table with WSA tagging support for HubSpot and Loops sync';
COMMENT ON VIEW public.voter_sync_status IS 'Comprehensive view of voter sync status across HubSpot and Loops';

-- SUCCESS MESSAGE
SELECT 'WSA COMPREHENSIVE FIXES APPLIED SUCCESSFULLY!' as status,
       'All tables updated with WSA tags, live URLs fixed, triggers created' as details;