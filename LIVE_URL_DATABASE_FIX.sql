-- Live URL Database Fix
-- Ensures proper live URL storage and admin view

-- 1. Ensure live_url column exists in nominations table
ALTER TABLE public.nominations 
ADD COLUMN IF NOT EXISTS live_url TEXT;

-- 2. Drop existing admin_nominations view if it exists, then create new one
DROP VIEW IF EXISTS public.admin_nominations;

-- Create admin_nominations view for comprehensive admin data
CREATE VIEW public.admin_nominations AS
SELECT 
  -- Nomination fields
  n.id as nomination_id,
  n.state,
  n.votes,
  n.subcategory_id,
  n.category_group_id,
  n.admin_notes,
  n.rejection_reason,
  n.created_at,
  n.updated_at,
  n.approved_at,
  n.approved_by,
  
  -- Nominee fields
  ne.id as nominee_id,
  ne.type as nominee_type,
  ne.firstname as nominee_firstname,
  ne.lastname as nominee_lastname,
  ne.person_email as nominee_person_email,
  ne.person_linkedin as nominee_person_linkedin,
  ne.person_phone as nominee_person_phone,
  ne.jobtitle as nominee_jobtitle,
  ne.person_company as nominee_person_company,
  ne.person_country as nominee_person_country,
  ne.headshot_url as nominee_headshot_url,
  ne.why_me as nominee_why_me,
  ne.company_name as nominee_company_name,
  ne.company_website as nominee_company_website,
  ne.company_linkedin as nominee_company_linkedin,
  ne.company_email as nominee_company_email,
  ne.company_phone as nominee_company_phone,
  ne.company_country as nominee_company_country,
  ne.logo_url as nominee_logo_url,
  ne.why_us as nominee_why_us,
  
  -- CRITICAL: Include live_url from nominations table
  n.live_url as nominee_live_url,
  
  -- Computed nominee fields
  CASE 
    WHEN ne.type = 'person' THEN CONCAT(COALESCE(ne.firstname, ''), ' ', COALESCE(ne.lastname, ''))
    ELSE COALESCE(ne.company_name, '')
  END as nominee_display_name,
  
  CASE 
    WHEN ne.type = 'person' THEN ne.headshot_url
    ELSE ne.logo_url
  END as nominee_image_url,
  
  CASE 
    WHEN ne.type = 'person' THEN ne.person_email
    ELSE ne.company_email
  END as nominee_email,
  
  CASE 
    WHEN ne.type = 'person' THEN ne.person_phone
    ELSE ne.company_phone
  END as nominee_phone,
  
  -- Nominator fields
  nr.id as nominator_id,
  nr.email as nominator_email,
  nr.firstname as nominator_firstname,
  nr.lastname as nominator_lastname,
  nr.linkedin as nominator_linkedin,
  nr.company as nominator_company,
  nr.job_title as nominator_job_title,
  nr.phone as nominator_phone,
  nr.country as nominator_country

FROM public.nominations n
LEFT JOIN public.nominees ne ON n.nominee_id = ne.id
LEFT JOIN public.nominators nr ON n.nominator_id = nr.id;

-- 3. Update existing approved nominations without live URLs
UPDATE public.nominations 
SET live_url = CONCAT(
  'https://worldstaffingawards.com/nominee/',
  LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        CASE 
          WHEN type = 'person' THEN CONCAT(COALESCE(firstname, ''), ' ', COALESCE(lastname, ''))
          ELSE COALESCE(company_name, '')
        END,
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  )
)
WHERE state = 'approved' 
  AND live_url IS NULL
  AND (
    (type = 'person' AND (firstname IS NOT NULL OR lastname IS NOT NULL))
    OR (type = 'company' AND company_name IS NOT NULL)
  );

-- 4. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_nominations_live_url ON public.nominations(live_url);
CREATE INDEX IF NOT EXISTS idx_nominations_state_live_url ON public.nominations(state, live_url);

-- 5. Grant necessary permissions
GRANT SELECT ON public.admin_nominations TO authenticated;
GRANT SELECT ON public.admin_nominations TO anon;