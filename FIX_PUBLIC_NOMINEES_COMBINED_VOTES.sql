-- Fix public_nominees view to show combined votes (real + additional)
-- This ensures data consistency between admin panel and homepage

-- Drop existing view
DROP VIEW IF EXISTS public.public_nominees CASCADE;

-- Recreate public_nominees view with combined votes
CREATE VIEW public.public_nominees AS
SELECT 
  n.id as nomination_id,
  n.nominee_id,
  n.subcategory_id,
  n.category_group_id,
  n.state,
  n.created_at,
  n.approved_at,
  n.live_url,
  
  -- CRITICAL: Combined vote counts (real + additional) for consistency
  COALESCE(vote_counts.vote_count, 0) + COALESCE(n.additional_votes, 0) as votes,
  COALESCE(vote_counts.vote_count, 0) as real_votes,
  COALESCE(n.additional_votes, 0) as additional_votes,
  
  -- Nominee details
  ne.type,
  ne.firstname,
  ne.lastname,
  ne.jobtitle,
  ne.person_email,
  ne.person_linkedin,
  ne.person_phone,
  ne.person_company,
  ne.person_country,
  ne.headshot_url,
  ne.why_me,
  ne.company_name,
  ne.company_website,
  ne.company_linkedin,
  ne.company_email,
  ne.company_phone,
  ne.company_country,
  ne.company_industry,
  ne.company_size,
  ne.logo_url,
  ne.why_us,
  
  -- Computed display fields
  CASE 
    WHEN ne.type = 'person' THEN CONCAT(COALESCE(ne.firstname, ''), ' ', COALESCE(ne.lastname, ''))
    ELSE COALESCE(ne.company_name, '')
  END as display_name,
  
  CASE 
    WHEN ne.type = 'person' THEN ne.headshot_url
    ELSE ne.logo_url
  END as image_url,
  
  CASE 
    WHEN ne.type = 'person' THEN ne.person_email
    ELSE ne.company_email
  END as email,
  
  CASE 
    WHEN ne.type = 'person' THEN ne.person_phone
    ELSE ne.company_phone
  END as phone,
  
  CASE 
    WHEN ne.type = 'person' THEN ne.person_country
    ELSE ne.company_country
  END as country

FROM nominations n
JOIN nominees ne ON n.nominee_id = ne.id
LEFT JOIN (
  SELECT 
    nomination_id,
    COUNT(*) as vote_count
  FROM votes 
  GROUP BY nomination_id
) vote_counts ON n.id = vote_counts.nomination_id
WHERE n.state = 'approved';

-- Add comment for clarity
COMMENT ON VIEW public.public_nominees IS 'Public view of approved nominations with combined vote counts (real + additional) for data consistency';

-- Also update the admin_nominations view to ensure it uses the same vote calculation
DROP VIEW IF EXISTS public.admin_nominations CASCADE;

CREATE VIEW public.admin_nominations AS
SELECT 
  n.id as nomination_id,
  n.state,
  n.subcategory_id,
  n.category_group_id,
  n.admin_notes,
  n.rejection_reason,
  n.created_at,
  n.updated_at,
  n.approved_at,
  n.approved_by,
  n.nominee_id,
  n.nominator_id,
  n.live_url as nominee_live_url,
  
  -- CRITICAL: Use same vote calculation as public view
  COALESCE(vote_counts.vote_count, 0) as votes,
  COALESCE(n.additional_votes, 0) as additional_votes,
  
  -- Nominee details
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
  ne.company_industry as nominee_company_industry,
  ne.company_size as nominee_company_size,
  ne.logo_url as nominee_logo_url,
  ne.why_us as nominee_why_us,
  
  -- Computed display fields (same as public view)
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
  
  -- Nominator details
  nom.email as nominator_email,
  nom.firstname as nominator_firstname,
  nom.lastname as nominator_lastname,
  nom.linkedin as nominator_linkedin,
  nom.company as nominator_company,
  nom.job_title as nominator_job_title,
  nom.phone as nominator_phone,
  nom.country as nominator_country

FROM nominations n
JOIN nominees ne ON n.nominee_id = ne.id
LEFT JOIN nominators nom ON n.nominator_id = nom.id
LEFT JOIN (
  SELECT 
    nomination_id,
    COUNT(*) as vote_count
  FROM votes 
  GROUP BY nomination_id
) vote_counts ON n.id = vote_counts.nomination_id;

-- Add comment for clarity
COMMENT ON VIEW public.admin_nominations IS 'Admin view of all nominations with combined vote counts matching public view for consistency';

-- Test the views to ensure they return consistent data
SELECT 'Testing view consistency...' as status;

-- Check that both views show the same vote counts for approved nominations
SELECT 
  'Vote count consistency check' as test,
  COUNT(*) as mismatched_records
FROM (
  SELECT 
    pn.nomination_id,
    pn.votes as public_votes,
    an.votes + an.additional_votes as admin_total_votes
  FROM public.public_nominees pn
  JOIN public.admin_nominations an ON pn.nomination_id = an.nomination_id
  WHERE pn.votes != (an.votes + an.additional_votes)
) mismatches;

SELECT 'Views updated successfully!' as status;