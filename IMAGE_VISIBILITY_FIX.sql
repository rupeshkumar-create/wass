-- Fix Image Visibility Issues
-- Run this in your Supabase SQL Editor to ensure images are properly exposed

-- 1. Drop and recreate public_nominees view with proper image handling
DROP VIEW IF EXISTS public.public_nominees CASCADE;
CREATE VIEW public.public_nominees AS
SELECT
  nom.id as nomination_id,
  ne.id as nominee_id,
  ne.type,
  nom.subcategory_id,
  nom.category_group_id,
  
  -- Display name
  CASE 
    WHEN ne.type = 'person' THEN TRIM(COALESCE(ne.firstname, '') || ' ' || COALESCE(ne.lastname, ''))
    ELSE COALESCE(ne.company_name, '')
  END AS display_name,
  
  -- Image URL - FIXED to handle both person and company images
  CASE 
    WHEN ne.type = 'person' AND ne.headshot_url IS NOT NULL AND ne.headshot_url != '' THEN ne.headshot_url
    WHEN ne.type = 'company' AND ne.logo_url IS NOT NULL AND ne.logo_url != '' THEN ne.logo_url
    ELSE NULL
  END AS image_url,
  
  -- Title or Industry
  CASE 
    WHEN ne.type = 'person' THEN ne.jobtitle
    ELSE ne.company_industry
  END AS title_or_industry,
  
  -- LinkedIn URL
  CASE 
    WHEN ne.type = 'person' THEN ne.person_linkedin
    ELSE ne.company_linkedin
  END AS linkedin_url,
  
  -- Why vote text
  CASE 
    WHEN ne.type = 'person' THEN ne.why_me
    ELSE ne.why_us
  END AS why_vote,
  
  -- Email
  CASE 
    WHEN ne.type = 'person' THEN ne.person_email
    ELSE ne.company_email
  END AS email,
  
  -- Phone
  CASE 
    WHEN ne.type = 'person' THEN ne.person_phone
    ELSE ne.company_phone
  END AS phone,
  
  -- Country
  CASE 
    WHEN ne.type = 'person' THEN ne.person_country
    ELSE ne.company_country
  END AS country,
  
  -- Website
  CASE 
    WHEN ne.type = 'person' THEN nom.live_url
    ELSE COALESCE(ne.company_website, nom.live_url)
  END AS website,
  
  -- All individual fields for detailed access
  ne.firstname,
  ne.lastname,
  ne.person_email,
  ne.person_linkedin,
  ne.person_phone,
  ne.jobtitle,
  ne.person_company,
  ne.person_country,
  ne.headshot_url,
  ne.why_me,
  ne.company_name,
  ne.company_domain,
  ne.company_website,
  ne.company_linkedin,
  ne.company_email,
  ne.company_phone,
  ne.company_country,
  ne.company_size,
  ne.company_industry,
  ne.logo_url,
  ne.why_us,
  ne.live_url,
  ne.bio,
  ne.achievements,
  ne.social_media,
  
  -- Vote counts - FIXED to include additional votes
  COALESCE(vote_counts.vote_count, 0) + COALESCE(nom.additional_votes, 0) as votes,
  COALESCE(vote_counts.vote_count, 0) as real_votes,
  COALESCE(nom.additional_votes, 0) as additional_votes,
  
  nom.created_at,
  nom.approved_at,
  nom.live_url
FROM public.nominations nom
JOIN public.nominees ne ON nom.nominee_id = ne.id
LEFT JOIN (
  SELECT 
    nomination_id,
    COUNT(*) as vote_count
  FROM votes 
  GROUP BY nomination_id
) vote_counts ON nom.id = vote_counts.nomination_id
WHERE nom.state = 'approved'
ORDER BY (COALESCE(vote_counts.vote_count, 0) + COALESCE(nom.additional_votes, 0)) DESC, nom.approved_at DESC;

-- 2. Update admin_nominations view with proper image handling
DROP VIEW IF EXISTS public.admin_nominations CASCADE;
CREATE VIEW public.admin_nominations AS
SELECT
  nom.id as nomination_id,
  nom.state,
  COALESCE(vote_counts.vote_count, 0) as votes,
  COALESCE(nom.additional_votes, 0) as additional_votes,
  nom.subcategory_id,
  nom.category_group_id,
  nom.admin_notes,
  nom.rejection_reason,
  nom.created_at,
  nom.updated_at,
  nom.approved_at,
  nom.approved_by,
  
  -- Nominee data (ALL FIELDS)
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
  ne.company_domain as nominee_company_domain,
  ne.company_website as nominee_company_website,
  ne.company_linkedin as nominee_company_linkedin,
  ne.company_email as nominee_company_email,
  ne.company_phone as nominee_company_phone,
  ne.company_country as nominee_company_country,
  ne.company_size as nominee_company_size,
  ne.company_industry as nominee_company_industry,
  ne.logo_url as nominee_logo_url,
  ne.why_us as nominee_why_us,
  ne.live_url as nominee_live_url,
  ne.bio as nominee_bio,
  ne.achievements as nominee_achievements,
  ne.social_media as nominee_social_media,
  
  -- Computed fields - FIXED image URL logic
  CASE 
    WHEN ne.type = 'person' THEN TRIM(COALESCE(ne.firstname, '') || ' ' || COALESCE(ne.lastname, ''))
    ELSE COALESCE(ne.company_name, '')
  END AS nominee_display_name,
  
  CASE 
    WHEN ne.type = 'person' AND ne.headshot_url IS NOT NULL AND ne.headshot_url != '' THEN ne.headshot_url
    WHEN ne.type = 'company' AND ne.logo_url IS NOT NULL AND ne.logo_url != '' THEN ne.logo_url
    ELSE NULL
  END AS nominee_image_url,
  
  CASE 
    WHEN ne.type = 'person' THEN ne.person_email
    ELSE ne.company_email
  END AS nominee_email,
  
  CASE 
    WHEN ne.type = 'person' THEN ne.person_phone
    ELSE ne.company_phone
  END AS nominee_phone,
  
  -- Nominator data (ALL FIELDS)
  nr.id as nominator_id,
  nr.email as nominator_email,
  nr.firstname as nominator_firstname,
  nr.lastname as nominator_lastname,
  nr.linkedin as nominator_linkedin,
  nr.company as nominator_company,
  nr.job_title as nominator_job_title,
  nr.phone as nominator_phone,
  nr.country as nominator_country
  
FROM public.nominations nom
JOIN public.nominees ne ON nom.nominee_id = ne.id
JOIN public.nominators nr ON nom.nominator_id = nr.id
LEFT JOIN (
  SELECT 
    nomination_id,
    COUNT(*) as vote_count
  FROM votes 
  GROUP BY nomination_id
) vote_counts ON nom.id = vote_counts.nomination_id
ORDER BY nom.created_at DESC;

-- 3. Grant proper permissions
GRANT SELECT ON public.public_nominees TO anon;
GRANT SELECT ON public.public_nominees TO authenticated;
GRANT SELECT ON public.admin_nominations TO service_role;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_nominees_headshot_url ON public.nominees(headshot_url) WHERE headshot_url IS NOT NULL AND headshot_url != '';
CREATE INDEX IF NOT EXISTS idx_nominees_logo_url ON public.nominees(logo_url) WHERE logo_url IS NOT NULL AND logo_url != '';

-- 5. Test query to verify images are being returned
DO $ 
DECLARE
  image_count INTEGER;
  total_count INTEGER;
BEGIN
  -- Count nominees with images
  SELECT COUNT(*) INTO image_count 
  FROM public.public_nominees 
  WHERE image_url IS NOT NULL AND image_url != '';
  
  -- Count total nominees
  SELECT COUNT(*) INTO total_count 
  FROM public.public_nominees;
  
  RAISE NOTICE 'Image visibility fix applied successfully!';
  RAISE NOTICE 'Total nominees: %', total_count;
  RAISE NOTICE 'Nominees with images: %', image_count;
  RAISE NOTICE 'Nominees without images: %', (total_count - image_count);
END $;