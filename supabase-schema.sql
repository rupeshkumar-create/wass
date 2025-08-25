-- World Staffing Awards 2026 - Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Enum types
CREATE TYPE wsa_status AS ENUM ('pending','approved','rejected');
CREATE TYPE wsa_type AS ENUM ('person','company');

-- 2. Nominations table
CREATE TABLE IF NOT EXISTS nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  type wsa_type NOT NULL,
  
  -- Nominator (never public)
  nominator_name TEXT NOT NULL,
  nominator_email TEXT NOT NULL,
  nominator_phone TEXT,
  
  -- Public facing nominee fields (email stays private)
  nominee_name TEXT NOT NULL,
  nominee_email TEXT,             -- keep private
  nominee_title TEXT,
  nominee_country TEXT,
  company_name TEXT,
  company_website TEXT,
  company_country TEXT,
  
  -- Canonical LinkedIn for dedupe (person / company)
  linkedin_norm TEXT NOT NULL,
  
  -- Media
  image_url TEXT,                 -- Supabase Storage public URL
  
  -- Routing/visibility
  live_slug TEXT NOT NULL UNIQUE,
  status wsa_status NOT NULL DEFAULT 'pending',
  unique_key TEXT NOT NULL,       -- for compatibility
  moderated_at TIMESTAMPTZ,
  moderated_by TEXT,
  moderator_note TEXT,
  why_vote_for_me TEXT CHECK (char_length(why_vote_for_me) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent duplicates: one nominee per category by LinkedIn
CREATE UNIQUE INDEX IF NOT EXISTS nominations_unique_per_cat 
  ON nominations (lower(category), lower(linkedin_norm));

-- 3. Voters table (for reporting and normalization)
CREATE TABLE IF NOT EXISTS voters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,              -- business email
  linkedin_norm TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraints for voters (using indexes)
CREATE UNIQUE INDEX IF NOT EXISTS voters_email_unique 
  ON voters (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS voters_linkedin_unique 
  ON voters (lower(linkedin_norm));

-- 4. Votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nominee_id UUID NOT NULL REFERENCES nominations(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  voter_id UUID REFERENCES voters(id) ON DELETE SET NULL,
  voter_email TEXT NOT NULL,
  voter_linkedin_norm TEXT NOT NULL,
  ip INET,
  ua TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One-vote rules (both guarantees)
-- A) Only one vote per voter per category (prevents switching nominees)
CREATE UNIQUE INDEX IF NOT EXISTS one_vote_per_category 
  ON votes (lower(voter_linkedin_norm), lower(category));

-- B) Only one vote per voter per nominee (extra guard)
CREATE UNIQUE INDEX IF NOT EXISTS one_vote_per_nominee 
  ON votes (lower(voter_linkedin_norm), nominee_id, lower(category));

-- 5. Performance indexes
CREATE INDEX IF NOT EXISTS votes_nominee_idx ON votes (nominee_id);
CREATE INDEX IF NOT EXISTS nominations_status_cat_idx ON nominations (status, category);
CREATE INDEX IF NOT EXISTS nominations_created_at_idx ON nominations (created_at DESC);
CREATE INDEX IF NOT EXISTS nominations_slug_idx ON nominations (live_slug);

-- 6. Public-safe view (no emails) for front-end reads
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
  n.why_vote_for_me,                                   -- <- NEW
  COALESCE(vc.vote_count, 0)::INT AS votes
FROM nominations n
LEFT JOIN (
  SELECT nominee_id, COUNT(*)::INT AS vote_count
  FROM votes
  GROUP BY nominee_id
) vc ON vc.nominee_id = n.id
WHERE n.status = 'approved';

-- 7. Row Level Security (RLS) policies
ALTER TABLE nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voters ENABLE ROW LEVEL SECURITY;

-- Public: can only read approved nominations
CREATE POLICY public_read_approved ON nominations 
  FOR SELECT USING (status = 'approved');

-- Only service role can insert/update/delete nominations
CREATE POLICY srv_write_nominations ON nominations 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Votes: no public select (privacy); only service_role can write
CREATE POLICY srv_write_votes ON votes 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Voters table: only service_role read/write
CREATE POLICY srv_write_voters ON voters 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8. Vote casting function (server-side guard)
CREATE OR REPLACE FUNCTION cast_vote(
  p_nominee UUID,
  p_category TEXT,
  p_first TEXT,
  p_last TEXT,
  p_email TEXT,
  p_linkedin_norm TEXT,
  p_ip INET,
  p_ua TEXT
) RETURNS TABLE(success BOOLEAN, total INT, message TEXT) 
LANGUAGE plpgsql AS $$
DECLARE 
  v_voter UUID;
  v_total INT;
  v_nominee_status wsa_status;
BEGIN
  -- Check if nominee exists and is approved
  SELECT status INTO v_nominee_status 
  FROM nominations 
  WHERE id = p_nominee AND category = p_category;
  
  IF v_nominee_status IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Nominee not found';
  END IF;
  
  IF v_nominee_status != 'approved' THEN
    RETURN QUERY SELECT false, 0, 'Nominee not available for voting';
  END IF;

  -- Upsert voter
  INSERT INTO voters (first_name, last_name, email, linkedin_norm)
  VALUES (p_first, p_last, p_email, p_linkedin_norm)
  ON CONFLICT (lower(email)) DO UPDATE SET 
    linkedin_norm = EXCLUDED.linkedin_norm,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name
  RETURNING id INTO v_voter;

  -- Insert vote (unique indexes enforce one-vote policy)
  INSERT INTO votes (nominee_id, category, voter_id, voter_email, voter_linkedin_norm, ip, ua)
  VALUES (p_nominee, p_category, v_voter, p_email, p_linkedin_norm, p_ip, p_ua);

  SELECT COUNT(*) INTO v_total FROM votes WHERE nominee_id = p_nominee;
  RETURN QUERY SELECT true, v_total, 'Vote cast successfully';

EXCEPTION
  WHEN unique_violation THEN
    -- Check which constraint was violated
    IF SQLERRM LIKE '%one_vote_per_category%' THEN
      RETURN QUERY SELECT false, 0, 'ALREADY_VOTED_IN_CATEGORY';
    ELSE
      RETURN QUERY SELECT false, 0, 'ALREADY_VOTED_FOR_THIS_NOMINEE';
    END IF;
END;
$$;