-- Execute this SQL in your Supabase SQL Editor to fix data consistency

-- 1. Drop existing views if they exist
DROP VIEW IF EXISTS public.public_nominees CASCADE;
DROP VIEW IF EXISTS public.admin_nominations CASCADE;

-- 2. Create public_nominees view with combined votes
CREATE VIEW public.public_nominees AS
SELECT 
  n.id as nomination_id,
  n.nominee_id,
  n.subcategory_id,
  n.state,
  n.created_at,
  n.live_url,
  
  -- Combined vote counts (real + additional)
  COALESCE(vote_counts.vote_count, 0) + COALESCE(n.additional_votes, 0) as votes,
  
  -- Nominee details
  ne.type,
  ne.firstname,
  ne.lastname,
  ne.company_name,
  
  -- Display name
  CASE 
    WHEN ne.type = 'person' THEN CONCAT(COALESCE(ne.firstname, ''), ' ', COALESCE(ne.lastname, ''))
    ELSE COALESCE(ne.company_name, '')
  END as display_name

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

-- 3. Create admin_nominations view with same vote logic
CREATE VIEW public.admin_nominations AS
SELECT 
  n.id as nomination_id,
  n.state,
  n.subcategory_id,
  n.created_at,
  n.nominee_id,
  n.live_url as nominee_live_url,
  
  -- Same vote calculation as public view
  COALESCE(vote_counts.vote_count, 0) as votes,
  COALESCE(n.additional_votes, 0) as additional_votes,
  
  -- Nominee details
  ne.type as nominee_type,
  ne.firstname as nominee_firstname,
  ne.lastname as nominee_lastname,
  ne.company_name as nominee_company_name,
  
  -- Display name (same logic as public view)
  CASE 
    WHEN ne.type = 'person' THEN CONCAT(COALESCE(ne.firstname, ''), ' ', COALESCE(ne.lastname, ''))
    ELSE COALESCE(ne.company_name, '')
  END as nominee_display_name

FROM nominations n
JOIN nominees ne ON n.nominee_id = ne.id
LEFT JOIN (
  SELECT 
    nomination_id,
    COUNT(*) as vote_count
  FROM votes 
  GROUP BY nomination_id
) vote_counts ON n.id = vote_counts.nomination_id;

-- 4. Test the views
SELECT 'Views created successfully!' as status;