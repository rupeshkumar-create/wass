-- Simple Live URL Fix - Execute these commands one by one

-- Step 1: Add live_url column to nominations table if it doesn't exist
ALTER TABLE public.nominations 
ADD COLUMN IF NOT EXISTS live_url TEXT;

-- Step 2: Drop existing admin_nominations view if it exists
DROP VIEW IF EXISTS public.admin_nominations;

-- Step 3: Create new admin_nominations view with live_url support
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
  n.live_url as nominee_live_url,  -- CRITICAL: Include live_url
  
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
  
  -- Computed nominee fields
  CASE 
    WHEN ne.type = 'person' THEN TRIM(CONCAT(COALESCE(ne.firstname, ''), ' ', COALESCE(ne.lastname, '')))
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

-- Step 4: Grant permissions
GRANT SELECT ON public.admin_nominations TO authenticated;
GRANT SELECT ON public.admin_nominations TO anon;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_nominations_live_url ON public.nominations(live_url);
CREATE INDEX IF NOT EXISTS idx_nominations_state_live_url ON public.nominations(state, live_url);