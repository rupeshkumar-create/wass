-- World Staffing Awards 2026 - Fix DB Schema + View
-- Run this in Supabase SQL Editor

BEGIN;

-- 1) Column for the new section
ALTER TABLE nominations 
  ADD COLUMN IF NOT EXISTS why_vote_for_me TEXT 
  CHECK (char_length(why_vote_for_me) <= 1000);

-- 2) Recreate public view to include image and "why"
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
  COALESCE(vc.vote_count, 0)::INT AS votes
FROM nominations n
LEFT JOIN (
  SELECT nominee_id, COUNT(*)::INT AS vote_count
  FROM votes
  GROUP BY nominee_id
) vc ON vc.nominee_id = n.id
WHERE n.status = 'approved';

COMMIT;