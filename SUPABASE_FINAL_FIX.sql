-- FINAL SUPABASE FIX - Run this step by step
-- Copy and paste each section one at a time in Supabase SQL Editor

-- ========================================
-- STEP 1: Add additional_votes column (REQUIRED FOR ADMIN PANEL)
-- ========================================
ALTER TABLE public.nominations 
ADD COLUMN IF NOT EXISTS additional_votes INTEGER DEFAULT 0;

UPDATE public.nominations 
SET additional_votes = 0 
WHERE additional_votes IS NULL;

-- ========================================
-- STEP 2: Update nominee live URLs
-- ========================================
UPDATE public.nominees 
SET live_url = 'https://worldstaffingawards.com/nominee/' || id::text
WHERE live_url IS NULL OR live_url = '' OR live_url NOT LIKE 'https://worldstaffingawards.com/nominee/%';

-- ========================================
-- STEP 3: Create live URL function
-- ========================================
CREATE OR REPLACE FUNCTION ensure_nominee_live_url()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.live_url IS NULL OR NEW.live_url = '' OR NEW.live_url NOT LIKE 'https://worldstaffingawards.com/nominee/%' THEN
    NEW.live_url = 'https://worldstaffingawards.com/nominee/' || NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 4: Create trigger
-- ========================================
DROP TRIGGER IF EXISTS trigger_nominees_live_url_auto ON public.nominees;
CREATE TRIGGER trigger_nominees_live_url_auto
  BEFORE INSERT OR UPDATE ON public.nominees
  FOR EACH ROW EXECUTE FUNCTION ensure_nominee_live_url();

-- ========================================
-- STEP 5: Drop existing function (FIXES THE ERROR)
-- ========================================
DROP FUNCTION IF EXISTS get_nominee_by_identifier(text);

-- ========================================
-- STEP 6: Recreate public_nominees view
-- ========================================
DROP VIEW IF EXISTS public.top_nominees_by_category CASCADE;
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
-- STEP 7: Create NEW lookup function
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
    pn.nomination_id::text = identifier
    OR pn.nominee_id::text = identifier
    OR pn.live_url LIKE '%/' || identifier
    OR LOWER(REPLACE(REPLACE(pn.display_name, ' ', '-'), '''', '')) = LOWER(identifier)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 8: Create indexes for performance
-- ========================================
CREATE INDEX IF NOT EXISTS idx_nominees_live_url ON public.nominees(live_url);
CREATE INDEX IF NOT EXISTS idx_nominees_type ON public.nominees(type);
CREATE INDEX IF NOT EXISTS idx_nominations_additional_votes ON public.nominations(additional_votes);
CREATE INDEX IF NOT EXISTS idx_votes_nomination_id ON public.votes(nomination_id);

-- ========================================
-- STEP 9: Verification
-- ========================================
SELECT 'SETUP COMPLETED SUCCESSFULLY!' as status,
       'Admin panel vote updates and nominee page routing should now work' as message;