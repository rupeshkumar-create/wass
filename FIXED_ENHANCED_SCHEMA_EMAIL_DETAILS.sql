-- Enhanced Schema with Complete Email and Contact Details (FIXED)
-- Run this in your Supabase SQL Editor to add missing email fields and update views

-- First, let's check if we need to add any missing columns to existing tables
-- (This is safe to run even if columns already exist)

-- Add missing email and contact fields to nominees table if they don't exist
DO $$ 
BEGIN
    -- Add person_email if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominees' AND column_name = 'person_email') THEN
        ALTER TABLE public.nominees ADD COLUMN person_email TEXT;
    END IF;
    
    -- Add person_phone if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominees' AND column_name = 'person_phone') THEN
        ALTER TABLE public.nominees ADD COLUMN person_phone TEXT;
    END IF;
    
    -- Add company_email if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominees' AND column_name = 'company_email') THEN
        ALTER TABLE public.nominees ADD COLUMN company_email TEXT;
    END IF;
    
    -- Add company_phone if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominees' AND column_name = 'company_phone') THEN
        ALTER TABLE public.nominees ADD COLUMN company_phone TEXT;
    END IF;
    
    -- Add person_country if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominees' AND column_name = 'person_country') THEN
        ALTER TABLE public.nominees ADD COLUMN person_country TEXT;
    END IF;
    
    -- Add company_country if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominees' AND column_name = 'company_country') THEN
        ALTER TABLE public.nominees ADD COLUMN company_country TEXT;
    END IF;
    
    -- Add person_company if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominees' AND column_name = 'person_company') THEN
        ALTER TABLE public.nominees ADD COLUMN person_company TEXT;
    END IF;
END $$;

-- Update the public_nominees view to include email and contact details
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
    WHEN ne.type = 'person' THEN COALESCE(ne.firstname, '') || ' ' || COALESCE(ne.lastname, '')
    ELSE COALESCE(ne.company_name, '')
  END AS display_name,
  
  -- Image URL
  CASE 
    WHEN ne.type = 'person' THEN ne.headshot_url
    ELSE ne.logo_url
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
  
  -- Email (NEW)
  CASE 
    WHEN ne.type = 'person' THEN ne.person_email
    ELSE ne.company_email
  END AS email,
  
  -- Phone (NEW)
  CASE 
    WHEN ne.type = 'person' THEN ne.person_phone
    ELSE ne.company_phone
  END AS phone,
  
  -- Country (NEW)
  CASE 
    WHEN ne.type = 'person' THEN ne.person_country
    ELSE ne.company_country
  END AS country,
  
  -- Website (NEW)
  CASE 
    WHEN ne.type = 'person' THEN ne.live_url
    ELSE COALESCE(ne.company_website, ne.live_url)
  END AS website,
  
  -- Company (for persons) (NEW)
  CASE 
    WHEN ne.type = 'person' THEN ne.person_company
    ELSE NULL
  END AS person_company,
  
  -- Industry (for companies) (NEW)
  CASE 
    WHEN ne.type = 'company' THEN ne.company_industry
    ELSE NULL
  END AS company_industry_display,
  
  -- All individual fields for detailed access
  ne.firstname,
  ne.lastname,
  ne.person_email,
  ne.person_linkedin,
  ne.person_phone,
  ne.jobtitle,
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
  
  nom.votes,
  nom.created_at,
  nom.approved_at
FROM public.nominations nom
JOIN public.nominees ne ON nom.nominee_id = ne.id
WHERE nom.state = 'approved'
ORDER BY nom.votes DESC, nom.approved_at DESC;

-- Update the admin_nominations view to include all email and contact details
DROP VIEW IF EXISTS public.admin_nominations CASCADE;
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
  
  -- Computed fields
  CASE 
    WHEN ne.type = 'person' THEN COALESCE(ne.firstname, '') || ' ' || COALESCE(ne.lastname, '')
    ELSE COALESCE(ne.company_name, '')
  END AS nominee_display_name,
  
  CASE 
    WHEN ne.type = 'person' THEN ne.headshot_url
    ELSE ne.logo_url
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
ORDER BY nom.created_at DESC;

-- Create a detailed voters view for admin access
DROP VIEW IF EXISTS public.admin_voters CASCADE;
CREATE VIEW public.admin_voters AS
SELECT
  v.id as voter_id,
  v.email as voter_email,
  v.firstname as voter_firstname,
  v.lastname as voter_lastname,
  v.linkedin as voter_linkedin,
  v.company as voter_company,
  v.job_title as voter_job_title,
  v.country as voter_country,
  v.created_at as voter_created_at,
  
  -- Vote details
  vt.id as vote_id,
  vt.nomination_id,
  vt.subcategory_id,
  vt.vote_timestamp,
  vt.ip_address,
  vt.user_agent,
  
  -- Nominee details for the vote
  CASE 
    WHEN ne.type = 'person' THEN COALESCE(ne.firstname, '') || ' ' || COALESCE(ne.lastname, '')
    ELSE COALESCE(ne.company_name, '')
  END AS voted_for_nominee,
  
  ne.type as voted_for_type
  
FROM public.voters v
LEFT JOIN public.votes vt ON v.id = vt.voter_id
LEFT JOIN public.nominations nom ON vt.nomination_id = nom.id
LEFT JOIN public.nominees ne ON nom.nominee_id = ne.id
ORDER BY vt.vote_timestamp DESC NULLS LAST, v.created_at DESC;

-- Grant permissions
GRANT SELECT ON public.public_nominees TO anon;
GRANT SELECT ON public.admin_nominations TO service_role;
GRANT SELECT ON public.admin_voters TO service_role;

-- Add indexes for email fields for better performance
CREATE INDEX IF NOT EXISTS idx_nominees_person_email ON public.nominees(person_email) WHERE person_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nominees_company_email ON public.nominees(company_email) WHERE company_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_voters_email_lower ON public.voters(lower(email));
CREATE INDEX IF NOT EXISTS idx_nominators_email_lower ON public.nominators(lower(email));

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'Enhanced schema with email details created successfully!';
  RAISE NOTICE 'Views updated: public_nominees, admin_nominations, admin_voters';
  RAISE NOTICE 'All email and contact fields are now available in APIs';
END $$;