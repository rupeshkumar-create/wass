-- Fix Supabase Schema - Add Missing Columns
-- Run this in your Supabase SQL Editor

-- First, let's check what columns exist in the nominations table
-- You can run this query to see current columns:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'nominations';

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add nominee_first_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nominations' AND column_name = 'nominee_first_name') THEN
        ALTER TABLE nominations ADD COLUMN nominee_first_name TEXT;
    END IF;
    
    -- Add nominee_last_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nominations' AND column_name = 'nominee_last_name') THEN
        ALTER TABLE nominations ADD COLUMN nominee_last_name TEXT;
    END IF;
    
    -- Add nominator_linkedin if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nominations' AND column_name = 'nominator_linkedin') THEN
        ALTER TABLE nominations ADD COLUMN nominator_linkedin TEXT;
    END IF;
END $$;

-- Update the public_nominees view to include all expected columns
CREATE OR REPLACE VIEW public_nominees AS
SELECT 
  n.id,
  n.category,
  n.type,
  n.nominee_name,
  n.nominee_title,
  n.nominee_first_name,
  n.nominee_last_name,
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

-- Grant necessary permissions
GRANT SELECT ON public_nominees TO anon, authenticated;

-- Create indexes for new columns if they were added
CREATE INDEX IF NOT EXISTS nominations_nominee_first_name_idx ON nominations (nominee_first_name);
CREATE INDEX IF NOT EXISTS nominations_nominee_last_name_idx ON nominations (nominee_last_name);
CREATE INDEX IF NOT EXISTS nominations_nominator_linkedin_idx ON nominations (nominator_linkedin);

-- Verify the view works
SELECT 'Schema update completed successfully' as status;