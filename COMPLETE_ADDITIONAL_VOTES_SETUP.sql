-- Complete Additional Votes Setup for World Staffing Awards
-- Run this entire script in Supabase SQL Editor

-- Step 1: Add additional_votes column to nominations table
ALTER TABLE nominations 
ADD COLUMN IF NOT EXISTS additional_votes INTEGER DEFAULT 0 NOT NULL;

-- Step 2: Update existing records to have 0 additional votes
UPDATE nominations 
SET additional_votes = 0 
WHERE additional_votes IS NULL;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_nominations_additional_votes ON nominations(additional_votes);

-- Step 4: Add comment to explain the field
COMMENT ON COLUMN nominations.additional_votes IS 'Manual votes added by admin, added to real vote count for total display';

-- Step 5: Update the admin_nominations view to include additional_votes
DROP VIEW IF EXISTS admin_nominations;
CREATE VIEW admin_nominations AS
SELECT 
  n.id as nomination_id,
  n.state,
  COALESCE(vote_counts.vote_count, 0) as votes,
  COALESCE(n.additional_votes, 0) as additional_votes,
  n.subcategory_id,
  n.category_group_id,
  n.admin_notes,
  n.rejection_reason,
  n.created_at,
  n.updated_at,
  n.approved_at,
  n.approved_by,
  n.live_url,
  
  -- Nominee details
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
  
  n.live_url as nominee_live_url,
  
  -- Nominator details
  nr.id as nominator_id,
  nr.email as nominator_email,
  nr.firstname as nominator_firstname,
  nr.lastname as nominator_lastname,
  nr.linkedin as nominator_linkedin,
  nr.company as nominator_company,
  nr.job_title as nominator_job_title,
  nr.phone as nominator_phone,
  nr.country as nominator_country
  
FROM nominations n
LEFT JOIN nominees ne ON n.nominee_id = ne.id
LEFT JOIN nominators nr ON n.nominator_id = nr.id
LEFT JOIN (
  SELECT nominee_id, COUNT(*) as vote_count
  FROM votes
  GROUP BY nominee_id
) vote_counts ON n.nominee_id = vote_counts.nominee_id;

-- Step 6: Update the public_nominees view to include total votes (real + additional)
DROP VIEW IF EXISTS public_nominees;
CREATE VIEW public_nominees AS
SELECT 
  n.id as nomination_id,
  n.nominee_id,
  n.subcategory_id,
  n.category_group_id,
  n.state,
  n.created_at,
  n.approved_at,
  n.live_url,
  
  -- Vote counts (real + additional)
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
  ne.logo_url,
  ne.why_us,
  ne.bio,
  ne.achievements,
  ne.social_media,
  
  -- Computed fields
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
  END as country,
  
  CASE 
    WHEN ne.type = 'person' THEN ne.person_linkedin
    ELSE ne.company_linkedin
  END as linkedin_url,
  
  CASE 
    WHEN ne.type = 'person' THEN ne.company_website
    ELSE ne.company_website
  END as website,
  
  CASE 
    WHEN ne.type = 'person' THEN ne.why_me
    ELSE ne.why_us
  END as why_vote,
  
  CASE 
    WHEN ne.type = 'person' THEN ne.jobtitle
    ELSE ne.company_industry
  END as title_or_industry
  
FROM nominations n
LEFT JOIN nominees ne ON n.nominee_id = ne.id
LEFT JOIN (
  SELECT nominee_id, COUNT(*) as vote_count
  FROM votes
  GROUP BY nominee_id
) vote_counts ON n.nominee_id = vote_counts.nominee_id
WHERE n.state = 'approved';

-- Step 7: Create a view for top nominees by category (for the sidebar)
CREATE OR REPLACE VIEW top_nominees_by_category AS
SELECT 
  subcategory_id,
  nomination_id,
  nominee_id,
  display_name,
  image_url,
  votes,
  real_votes,
  additional_votes,
  type,
  ROW_NUMBER() OVER (PARTITION BY subcategory_id ORDER BY votes DESC, approved_at ASC) as rank
FROM public_nominees
WHERE votes > 0
ORDER BY subcategory_id, rank;

-- Step 8: Grant necessary permissions
GRANT SELECT ON admin_nominations TO authenticated;
GRANT SELECT ON public_nominees TO authenticated;
GRANT SELECT ON top_nominees_by_category TO authenticated;
GRANT SELECT ON top_nominees_by_category TO anon;

-- Step 9: Verify the setup
SELECT 
  'Setup Complete' as status,
  COUNT(*) as total_nominations,
  SUM(CASE WHEN additional_votes > 0 THEN 1 ELSE 0 END) as nominations_with_additional_votes,
  SUM(additional_votes) as total_additional_votes
FROM nominations;