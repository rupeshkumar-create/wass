-- Corrected Schema Enhancement for Current Structure
-- This works with your existing nominations table structure
-- Run this in your Supabase SQL Editor

-- Add missing email and contact fields to nominations table (not nominees)
DO $$ 
BEGIN
    -- Add person_phone if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'person_phone') THEN
        ALTER TABLE public.nominations ADD COLUMN person_phone TEXT;
    END IF;
    
    -- Add company_email if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'company_email') THEN
        ALTER TABLE public.nominations ADD COLUMN company_email TEXT;
    END IF;
    
    -- Add company_phone if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'company_phone') THEN
        ALTER TABLE public.nominations ADD COLUMN company_phone TEXT;
    END IF;
    
    -- Add person_country if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'person_country') THEN
        ALTER TABLE public.nominations ADD COLUMN person_country TEXT;
    END IF;
    
    -- Add company_country if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'company_country') THEN
        ALTER TABLE public.nominations ADD COLUMN company_country TEXT;
    END IF;
    
    -- Add person_company if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'person_company') THEN
        ALTER TABLE public.nominations ADD COLUMN person_company TEXT;
    END IF;
    
    -- Add bio if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'bio') THEN
        ALTER TABLE public.nominations ADD COLUMN bio TEXT;
    END IF;
    
    -- Add achievements if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'achievements') THEN
        ALTER TABLE public.nominations ADD COLUMN achievements TEXT;
    END IF;
    
    -- Add social_media if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'social_media') THEN
        ALTER TABLE public.nominations ADD COLUMN social_media TEXT;
    END IF;
    
    -- Add company_size if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'company_size') THEN
        ALTER TABLE public.nominations ADD COLUMN company_size TEXT;
    END IF;
    
    -- Add company_industry if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'company_industry') THEN
        ALTER TABLE public.nominations ADD COLUMN company_industry TEXT;
    END IF;
END $$;

-- Update the existing public_nominees view to include new fields
DROP VIEW IF EXISTS public.public_nominees CASCADE;
CREATE VIEW public.public_nominees AS
SELECT
  id,
  type,
  subcategory_id,
  category_group_id,
  
  -- Display name
  CASE 
    WHEN type = 'person' THEN COALESCE(firstname, '') || ' ' || COALESCE(lastname, '')
    ELSE COALESCE(company_name, '')
  END AS display_name,
  
  -- Image URL
  CASE 
    WHEN type = 'person' THEN headshot_url
    ELSE logo_url
  END AS image_url,
  
  -- Title or Industry
  CASE 
    WHEN type = 'person' THEN jobtitle
    ELSE company_industry
  END AS title_or_industry,
  
  -- LinkedIn URL
  CASE 
    WHEN type = 'person' THEN person_linkedin
    ELSE company_linkedin
  END AS linkedin_url,
  
  -- Why vote text
  CASE 
    WHEN type = 'person' THEN why_me
    ELSE why_us
  END AS why_vote,
  
  -- Email
  CASE 
    WHEN type = 'person' THEN person_email
    ELSE company_email
  END AS email,
  
  -- Phone
  CASE 
    WHEN type = 'person' THEN person_phone
    ELSE company_phone
  END AS phone,
  
  -- Country
  CASE 
    WHEN type = 'person' THEN person_country
    ELSE company_country
  END AS country,
  
  -- Website
  CASE 
    WHEN type = 'person' THEN live_url
    ELSE COALESCE(company_website, live_url)
  END AS website,
  
  -- All individual fields for detailed access
  firstname,
  lastname,
  person_email,
  person_linkedin,
  person_phone,
  jobtitle,
  person_company,
  person_country,
  headshot_url,
  why_me,
  company_name,
  company_domain,
  company_website,
  company_linkedin,
  company_email,
  company_phone,
  company_country,
  company_size,
  company_industry,
  logo_url,
  why_us,
  live_url,
  bio,
  achievements,
  social_media,
  votes,
  created_at,
  updated_at
  
FROM public.nominations
WHERE state = 'approved'
ORDER BY votes DESC, created_at DESC;

-- Create an admin view for complete nomination management
DROP VIEW IF EXISTS public.admin_nominations CASCADE;
CREATE VIEW public.admin_nominations AS
SELECT
  id as nomination_id,
  state,
  votes,
  subcategory_id,
  category_group_id,
  created_at,
  updated_at,
  
  -- Nominee data (ALL FIELDS)
  type as nominee_type,
  firstname as nominee_firstname,
  lastname as nominee_lastname,
  person_email as nominee_person_email,
  person_linkedin as nominee_person_linkedin,
  person_phone as nominee_person_phone,
  jobtitle as nominee_jobtitle,
  person_company as nominee_person_company,
  person_country as nominee_person_country,
  headshot_url as nominee_headshot_url,
  why_me as nominee_why_me,
  company_name as nominee_company_name,
  company_domain as nominee_company_domain,
  company_website as nominee_company_website,
  company_linkedin as nominee_company_linkedin,
  company_email as nominee_company_email,
  company_phone as nominee_company_phone,
  company_country as nominee_company_country,
  company_size as nominee_company_size,
  company_industry as nominee_company_industry,
  logo_url as nominee_logo_url,
  why_us as nominee_why_us,
  live_url as nominee_live_url,
  bio as nominee_bio,
  achievements as nominee_achievements,
  social_media as nominee_social_media,
  
  -- Computed fields
  CASE 
    WHEN type = 'person' THEN COALESCE(firstname, '') || ' ' || COALESCE(lastname, '')
    ELSE COALESCE(company_name, '')
  END AS nominee_display_name,
  
  CASE 
    WHEN type = 'person' THEN headshot_url
    ELSE logo_url
  END AS nominee_image_url,
  
  CASE 
    WHEN type = 'person' THEN person_email
    ELSE company_email
  END AS nominee_email,
  
  CASE 
    WHEN type = 'person' THEN person_phone
    ELSE company_phone
  END AS nominee_phone
  
FROM public.nominations
ORDER BY created_at DESC;

-- Grant permissions
GRANT SELECT ON public.public_nominees TO anon;
GRANT SELECT ON public.admin_nominations TO service_role;

-- Add indexes for email fields for better performance
CREATE INDEX IF NOT EXISTS idx_nominations_person_email ON public.nominations(person_email) WHERE person_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nominations_company_email ON public.nominations(company_email) WHERE company_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_voters_email_lower ON public.voters(lower(email));
CREATE INDEX IF NOT EXISTS idx_nominators_email_lower ON public.nominators(lower(email));

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'Schema enhancement completed successfully!';
  RAISE NOTICE 'Added missing fields to nominations table';
  RAISE NOTICE 'Updated views: public_nominees, admin_nominations';
  RAISE NOTICE 'All email and contact fields are now available';
END $$;