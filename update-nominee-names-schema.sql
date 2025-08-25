-- Migration: Add firstName and lastName fields for person nominees
-- This allows separate first/last name fields while maintaining backward compatibility

-- Add new columns for person nominees
ALTER TABLE nominations 
ADD COLUMN IF NOT EXISTS nominee_first_name TEXT,
ADD COLUMN IF NOT EXISTS nominee_last_name TEXT;

-- Update existing records to split nominee_name into first/last name
-- This is a one-time migration for existing data
UPDATE nominations 
SET 
  nominee_first_name = CASE 
    WHEN position(' ' in nominee_name) > 0 
    THEN split_part(nominee_name, ' ', 1)
    ELSE nominee_name
  END,
  nominee_last_name = CASE 
    WHEN position(' ' in nominee_name) > 0 
    THEN substring(nominee_name from position(' ' in nominee_name) + 1)
    ELSE ''
  END
WHERE type = 'person' 
  AND (nominee_first_name IS NULL OR nominee_last_name IS NULL);

-- Update the public_nominees view to include the new fields
CREATE OR REPLACE VIEW public_nominees AS
SELECT 
  n.id,
  n.category,
  n.type,
  n.nominee_name,
  n.nominee_first_name,
  n.nominee_last_name,
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

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS nominations_first_name_idx ON nominations (nominee_first_name);
CREATE INDEX IF NOT EXISTS nominations_last_name_idx ON nominations (nominee_last_name);

-- Add a computed column function to maintain backward compatibility
CREATE OR REPLACE FUNCTION get_nominee_full_name(first_name TEXT, last_name TEXT, full_name TEXT)
RETURNS TEXT AS $$
BEGIN
  -- If we have first and last name, use them
  IF first_name IS NOT NULL AND last_name IS NOT NULL THEN
    RETURN trim(first_name || ' ' || last_name);
  END IF;
  
  -- Otherwise, fall back to the full name field
  RETURN full_name;
END;
$$ LANGUAGE plpgsql IMMUTABLE;