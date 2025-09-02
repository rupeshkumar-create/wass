-- WSA 2026 Improved Supabase Database Schema
-- This schema properly separates Nominators, Nominees, and Voters with complete data

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.hubspot_outbox CASCADE;
DROP TABLE IF EXISTS public.voters CASCADE;
DROP TABLE IF EXISTS public.nominators CASCADE;
DROP TABLE IF EXISTS public.nominations CASCADE;
DROP VIEW IF EXISTS public.public_nominees CASCADE;

-- NOMINATORS: People who submit nominations
CREATE TABLE public.nominators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  linkedin TEXT,
  company TEXT,
  job_title TEXT,
  phone TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_nominators_email ON public.nominators(lower(email));
CREATE INDEX idx_nominators_created ON public.nominators(created_at);

-- NOMINEES: People or companies being nominated
CREATE TABLE public.nominees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('person','company')),
  
  -- Person fields
  firstname TEXT,
  lastname TEXT,
  person_email TEXT,
  person_linkedin TEXT,
  person_phone TEXT,
  jobtitle TEXT,
  person_company TEXT,
  person_country TEXT,
  headshot_url TEXT,
  why_me TEXT,
  
  -- Company fields
  company_name TEXT,
  company_domain TEXT,
  company_website TEXT,
  company_linkedin TEXT,
  company_phone TEXT,
  company_country TEXT,
  company_size TEXT,
  company_industry TEXT,
  logo_url TEXT,
  why_us TEXT,
  
  -- Shared fields
  live_url TEXT,
  bio TEXT,
  achievements TEXT,
  social_media JSONB, -- For additional social links
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT nominee_person_required CHECK (
    type != 'person' OR (firstname IS NOT NULL AND lastname IS NOT NULL AND headshot_url IS NOT NULL)
  ),
  CONSTRAINT nominee_company_required CHECK (
    type != 'company' OR (company_name IS NOT NULL AND logo_url IS NOT NULL)
  )
);

CREATE INDEX idx_nominees_type ON public.nominees(type);
CREATE INDEX idx_nominees_created ON public.nominees(created_at);

-- NOMINATIONS: Links nominators to nominees in specific categories
CREATE TABLE public.nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nominator_id UUID NOT NULL REFERENCES public.nominators(id) ON DELETE CASCADE,
  nominee_id UUID NOT NULL REFERENCES public.nominees(id) ON DELETE CASCADE,
  category_group_id TEXT NOT NULL,
  subcategory_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'submitted' CHECK (state IN ('submitted','approved','rejected')),
  votes INT NOT NULL DEFAULT 0,
  admin_notes TEXT,
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nominations_nominator ON public.nominations(nominator_id);
CREATE INDEX idx_nominations_nominee ON public.nominations(nominee_id);
CREATE INDEX idx_nominations_subcategory ON public.nominations(subcategory_id);
CREATE INDEX idx_nominations_state ON public.nominations(state);
CREATE UNIQUE INDEX idx_nominations_unique ON public.nominations(nominee_id, subcategory_id);

-- VOTERS: People who vote for nominees
CREATE TABLE public.voters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  linkedin TEXT NOT NULL,
  company TEXT,
  job_title TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_voters_email ON public.voters(lower(email));
CREATE INDEX idx_voters_created ON public.voters(created_at);

-- VOTES: Individual votes cast by voters
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID NOT NULL REFERENCES public.voters(id) ON DELETE CASCADE,
  nomination_id UUID NOT NULL REFERENCES public.nominations(id) ON DELETE CASCADE,
  subcategory_id TEXT NOT NULL,
  vote_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_votes_voter ON public.votes(voter_id);
CREATE INDEX idx_votes_nomination ON public.votes(nomination_id);
CREATE INDEX idx_votes_subcategory ON public.votes(subcategory_id);
CREATE INDEX idx_votes_timestamp ON public.votes(vote_timestamp);
CREATE UNIQUE INDEX idx_votes_unique ON public.votes(voter_id, subcategory_id);

-- HUBSPOT_OUTBOX: Queue for HubSpot sync
CREATE TABLE public.hubspot_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('nomination_submitted','nomination_approved','vote_cast')),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','dead')),
  attempt_count INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outbox_status_created ON public.hubspot_outbox(status, created_at);

-- VIEWS for easy data access

-- Public nominees view (approved nominations only)
CREATE VIEW public.public_nominees AS
SELECT
  nom.id as nomination_id,
  ne.id as nominee_id,
  ne.type,
  nom.subcategory_id,
  nom.category_group_id,
  CASE 
    WHEN ne.type = 'person' THEN COALESCE(ne.firstname, '') || ' ' || COALESCE(ne.lastname, '')
    ELSE COALESCE(ne.company_name, '')
  END AS display_name,
  CASE 
    WHEN ne.type = 'person' THEN ne.headshot_url
    ELSE ne.logo_url
  END AS image_url,
  CASE 
    WHEN ne.type = 'person' THEN ne.jobtitle
    ELSE ne.company_industry
  END AS title_or_industry,
  CASE 
    WHEN ne.type = 'person' THEN ne.person_linkedin
    ELSE ne.company_linkedin
  END AS linkedin_url,
  CASE 
    WHEN ne.type = 'person' THEN ne.why_me
    ELSE ne.why_us
  END AS why_vote,
  ne.live_url,
  nom.votes,
  nom.created_at,
  nom.approved_at
FROM public.nominations nom
JOIN public.nominees ne ON nom.nominee_id = ne.id
WHERE nom.state = 'approved'
ORDER BY nom.votes DESC, nom.approved_at DESC;

-- Admin nominations view (all nominations with nominator info)
CREATE VIEW public.admin_nominations AS
SELECT
  nom.id as nomination_id,
  nom.state,
  nom.votes,
  nom.subcategory_id,
  nom.category_group_id,
  nom.admin_notes,
  nom.rejection_reason,
  nom.created_at,
  nom.updated_at,
  nom.approved_at,
  nom.approved_by,
  
  -- Nominee data
  ne.id as nominee_id,
  ne.type as nominee_type,
  ne.firstname as nominee_firstname,
  ne.lastname as nominee_lastname,
  ne.person_email as nominee_email,
  ne.person_linkedin as nominee_linkedin,
  ne.jobtitle as nominee_jobtitle,
  ne.headshot_url,
  ne.why_me,
  ne.company_name,
  ne.company_website,
  ne.company_linkedin,
  ne.logo_url,
  ne.why_us,
  ne.live_url,
  
  CASE 
    WHEN ne.type = 'person' THEN COALESCE(ne.firstname, '') || ' ' || COALESCE(ne.lastname, '')
    ELSE COALESCE(ne.company_name, '')
  END AS nominee_display_name,
  
  CASE 
    WHEN ne.type = 'person' THEN ne.headshot_url
    ELSE ne.logo_url
  END AS nominee_image_url,
  
  -- Nominator data
  nr.id as nominator_id,
  nr.email as nominator_email,
  nr.firstname as nominator_firstname,
  nr.lastname as nominator_lastname,
  nr.linkedin as nominator_linkedin,
  nr.company as nominator_company,
  nr.job_title as nominator_job_title
  
FROM public.nominations nom
JOIN public.nominees ne ON nom.nominee_id = ne.id
JOIN public.nominators nr ON nom.nominator_id = nr.id
ORDER BY nom.created_at DESC;

-- Voting statistics view
CREATE VIEW public.voting_stats AS
SELECT
  nom.subcategory_id,
  nom.category_group_id,
  COUNT(v.id) as total_votes,
  COUNT(DISTINCT v.voter_id) as unique_voters,
  MAX(v.vote_timestamp) as latest_vote,
  MIN(v.vote_timestamp) as first_vote
FROM public.nominations nom
LEFT JOIN public.votes v ON nom.id = v.nomination_id
WHERE nom.state = 'approved'
GROUP BY nom.subcategory_id, nom.category_group_id;

-- FUNCTIONS

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_nomination_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.nominations 
    SET votes = votes + 1, updated_at = NOW()
    WHERE id = NEW.nomination_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.nominations 
    SET votes = votes - 1, updated_at = NOW()
    WHERE id = OLD.nomination_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to set updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS

-- Vote count triggers
DROP TRIGGER IF EXISTS trigger_update_vote_count_insert ON public.votes;
CREATE TRIGGER trigger_update_vote_count_insert
  AFTER INSERT ON public.votes
  FOR EACH ROW EXECUTE FUNCTION update_nomination_vote_count();

DROP TRIGGER IF EXISTS trigger_update_vote_count_delete ON public.votes;
CREATE TRIGGER trigger_update_vote_count_delete
  AFTER DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION update_nomination_vote_count();

-- Updated_at triggers
DROP TRIGGER IF EXISTS trigger_nominators_updated_at ON public.nominators;
CREATE TRIGGER trigger_nominators_updated_at
  BEFORE UPDATE ON public.nominators
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_nominees_updated_at ON public.nominees;
CREATE TRIGGER trigger_nominees_updated_at
  BEFORE UPDATE ON public.nominees
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_nominations_updated_at ON public.nominations;
CREATE TRIGGER trigger_nominations_updated_at
  BEFORE UPDATE ON public.nominations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_voters_updated_at ON public.voters;
CREATE TRIGGER trigger_voters_updated_at
  BEFORE UPDATE ON public.voters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_outbox_updated_at ON public.hubspot_outbox;
CREATE TRIGGER trigger_outbox_updated_at
  BEFORE UPDATE ON public.hubspot_outbox
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable RLS (Service Role key bypasses this)
ALTER TABLE public.nominators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubspot_outbox ENABLE ROW LEVEL SECURITY;

-- Sample data for testing (optional)
-- INSERT INTO public.nominators (email, firstname, lastname, linkedin, company, job_title, country) VALUES
-- ('john.doe@example.com', 'John', 'Doe', 'https://linkedin.com/in/johndoe', 'Tech Corp', 'CEO', 'USA');

-- INSERT INTO public.nominees (type, firstname, lastname, person_email, person_linkedin, jobtitle, headshot_url, why_me) VALUES
-- ('person', 'Jane', 'Smith', 'jane.smith@example.com', 'https://linkedin.com/in/janesmith', 'Senior Developer', 'https://example.com/headshot.jpg', 'Exceptional technical skills and leadership');

-- INSERT INTO public.nominations (nominator_id, nominee_id, category_group_id, subcategory_id, state) VALUES
-- ((SELECT id FROM public.nominators WHERE email = 'john.doe@example.com'), 
--  (SELECT id FROM public.nominees WHERE person_email = 'jane.smith@example.com'), 
--  'individual-awards', 'top-recruiter', 'approved');