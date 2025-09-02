-- Add LinkedIn URL field for nominators
-- Run this in your Supabase SQL Editor

ALTER TABLE nominations 
ADD COLUMN IF NOT EXISTS nominator_linkedin TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS nominations_nominator_linkedin_idx 
ON nominations (nominator_linkedin);

-- Update the public_nominees view to include nominator LinkedIn
DROP VIEW IF EXISTS public_nominees;

CREATE OR REPLACE VIEW public_nominees AS
SELECT 
  n.id,
  n.category,
  n.type,
  n.nominee_name,
  n.nominee_title,
  n.nominee_country,
  n.company_name,
  n.company_website,
  n.company_country,
  n.linkedin_norm,
  n.image_url,
  n.live_slug,
  n.status,
  n.created_at,
  n.why_vote_for_me,
  n.nominator_linkedin,  -- Add nominator LinkedIn to view
  COALESCE(vc.vote_count, 0)::INT AS votes
FROM nominations n
LEFT JOIN (
  SELECT nominee_id, COUNT(*)::INT AS vote_count
  FROM votes
  GROUP BY nominee_id
) vc ON vc.nominee_id = n.id
WHERE n.status = 'approved';