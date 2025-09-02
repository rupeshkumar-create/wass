-- Create More Test Data for Individual Nominee Pages (FIXED VERSION)
-- Run this in your Supabase SQL Editor

-- First, let's check what constraints exist and add them if needed
DO $$
BEGIN
  -- Check if unique constraint on nominators email exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'idx_nominators_email'
  ) THEN
    -- Create unique index if it doesn't exist
    CREATE UNIQUE INDEX IF NOT EXISTS idx_nominators_email ON public.nominators(lower(email));
  END IF;
END $$;

-- Add more nominators (using INSERT with WHERE NOT EXISTS to avoid duplicates)
INSERT INTO public.nominators (email, firstname, lastname, linkedin, company, job_title, country)
SELECT * FROM (VALUES
  ('sarah.johnson@techcorp.com', 'Sarah', 'Johnson', 'https://linkedin.com/in/sarahjohnson', 'TechCorp Solutions', 'Head of Talent', 'USA'),
  ('michael.chen@globalhr.com', 'Michael', 'Chen', 'https://linkedin.com/in/michaelchen', 'Global HR Partners', 'Senior Recruitment Manager', 'UK'),
  ('emma.williams@startupinc.com', 'Emma', 'Williams', 'https://linkedin.com/in/emmawilliams', 'StartupInc', 'People Operations Lead', 'Canada'),
  ('david.brown@recruitpro.au', 'David', 'Brown', 'https://linkedin.com/in/davidbrown', 'RecruitPro Australia', 'Director of Recruitment', 'Australia'),
  ('lisa.garcia@hrexcellence.com', 'Lisa', 'Garcia', 'https://linkedin.com/in/lisagarcia', 'HR Excellence', 'VP of People', 'Spain')
) AS new_nominators(email, firstname, lastname, linkedin, company, job_title, country)
WHERE NOT EXISTS (
  SELECT 1 FROM public.nominators WHERE public.nominators.email = new_nominators.email
);

-- Add more person nominees
INSERT INTO public.nominees (type, firstname, lastname, person_email, person_linkedin, jobtitle, headshot_url, why_me, live_url)
SELECT * FROM (VALUES
  ('person', 'Jessica', 'Martinez', 'jessica.martinez@example.com', 'https://linkedin.com/in/jessicamartinez', 'Senior Executive Recruiter', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face', 'Exceptional track record in executive recruitment with over 8 years of experience placing C-level executives in Fortune 500 companies.', 'https://jessicamartinez.example.com'),
  ('person', 'Robert', 'Thompson', 'robert.thompson@example.com', 'https://linkedin.com/in/robertthompson', 'VP of Talent Acquisition', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face', 'Innovative leader in talent acquisition technology, revolutionizing how companies find and hire top talent.', 'https://robertthompson.example.com'),
  ('person', 'Lisa', 'Anderson', 'lisa.anderson@example.com', 'https://linkedin.com/in/lisaanderson', 'Chief People Officer', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face', 'Transformational people leader with expertise in building inclusive, high-performance teams across global organizations.', 'https://lisaanderson.example.com'),
  ('person', 'James', 'Wilson', 'james.wilson@example.com', 'https://linkedin.com/in/jameswilson', 'Director of Recruitment', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face', 'Rising star in recruitment with innovative approaches to candidate experience and employer branding.', 'https://jameswilson.example.com'),
  ('person', 'Maria', 'Rodriguez', 'maria.rodriguez@example.com', 'https://linkedin.com/in/mariarodriguez', 'Senior Talent Partner', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face', 'Expert in diversity and inclusion recruiting, helping organizations build more representative and inclusive teams.', 'https://mariarodriguez.example.com'),
  ('person', 'Alex', 'Kim', 'alex.kim@example.com', 'https://linkedin.com/in/alexkim', 'Head of Global Recruitment', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face', 'International recruitment expert with experience scaling teams across 15+ countries and multiple industries.', 'https://alexkim.example.com')
) AS new_nominees(type, firstname, lastname, person_email, person_linkedin, jobtitle, headshot_url, why_me, live_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.nominees WHERE public.nominees.person_email = new_nominees.person_email
);

-- Add more company nominees
INSERT INTO public.nominees (type, company_name, company_website, company_linkedin, company_industry, logo_url, why_us, live_url)
SELECT * FROM (VALUES
  ('company', 'TalentFlow Solutions', 'https://talentflow.com', 'https://linkedin.com/company/talentflow', 'Recruitment Technology', 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop', 'Leading recruitment technology company transforming how businesses find, engage, and hire top talent through AI-powered solutions.', 'https://talentflow.com'),
  ('company', 'Global Staffing Partners', 'https://globalstaffing.com', 'https://linkedin.com/company/globalstaffing', 'Staffing Services', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop', 'International staffing firm with presence in 25 countries, specializing in executive search and permanent placement.', 'https://globalstaffing.com'),
  ('company', 'NextGen Recruitment', 'https://nextgenrecruitment.com', 'https://linkedin.com/company/nextgenrecruitment', 'Digital Recruitment', 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=400&fit=crop', 'Innovative recruitment agency leveraging cutting-edge technology and data analytics to deliver exceptional hiring outcomes.', 'https://nextgenrecruitment.com'),
  ('company', 'Elite Executive Search', 'https://eliteexecutive.com', 'https://linkedin.com/company/eliteexecutive', 'Executive Search', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=400&fit=crop', 'Boutique executive search firm specializing in C-suite and senior leadership placements across Fortune 1000 companies.', 'https://eliteexecutive.com'),
  ('company', 'TechTalent Hub', 'https://techtalenthub.com', 'https://linkedin.com/company/techtalenthub', 'Tech Recruitment', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=400&fit=crop', 'Specialized technology recruitment firm connecting top engineering and product talent with innovative startups and scale-ups.', 'https://techtalenthub.com')
) AS new_companies(type, company_name, company_website, company_linkedin, company_industry, logo_url, why_us, live_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.nominees WHERE public.nominees.company_name = new_companies.company_name
);

-- Create nominations for person nominees
INSERT INTO public.nominations (nominator_id, nominee_id, category_group_id, subcategory_id, state, votes)
SELECT 
  n.id as nominator_id,
  ne.id as nominee_id,
  'role-specific-excellence' as category_group_id,
  CASE 
    WHEN ne.firstname = 'Jessica' THEN 'top-recruiter'
    WHEN ne.firstname = 'Robert' THEN 'top-executive-leader'
    WHEN ne.firstname = 'Lisa' THEN 'top-executive-leader'
    WHEN ne.firstname = 'James' THEN 'rising-star-under-30'
    WHEN ne.firstname = 'Maria' THEN 'top-staffing-influencer'
    WHEN ne.firstname = 'Alex' THEN 'top-global-recruiter'
    ELSE 'top-recruiter'
  END as subcategory_id,
  'approved' as state,
  floor(random() * 15 + 1)::int as votes
FROM public.nominators n, public.nominees ne
WHERE ne.type = 'person' 
  AND ne.firstname IN ('Jessica', 'Robert', 'Lisa', 'James', 'Maria', 'Alex')
  AND n.email = 'sarah.johnson@techcorp.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.nominations 
    WHERE nominee_id = ne.id AND subcategory_id = CASE 
      WHEN ne.firstname = 'Jessica' THEN 'top-recruiter'
      WHEN ne.firstname = 'Robert' THEN 'top-executive-leader'
      WHEN ne.firstname = 'Lisa' THEN 'top-executive-leader'
      WHEN ne.firstname = 'James' THEN 'rising-star-under-30'
      WHEN ne.firstname = 'Maria' THEN 'top-staffing-influencer'
      WHEN ne.firstname = 'Alex' THEN 'top-global-recruiter'
      ELSE 'top-recruiter'
    END
  );

-- Create nominations for company nominees
INSERT INTO public.nominations (nominator_id, nominee_id, category_group_id, subcategory_id, state, votes)
SELECT 
  n.id as nominator_id,
  ne.id as nominee_id,
  CASE 
    WHEN ne.company_name LIKE '%Technology%' OR ne.company_name LIKE '%Tech%' THEN 'innovation-technology'
    WHEN ne.company_name LIKE '%Global%' OR ne.company_name LIKE '%Executive%' THEN 'growth-performance'
    ELSE 'culture-impact'
  END as category_group_id,
  CASE 
    WHEN ne.company_name = 'TalentFlow Solutions' THEN 'top-ai-driven-staffing-platform'
    WHEN ne.company_name = 'Global Staffing Partners' THEN 'fastest-growing-staffing-firm'
    WHEN ne.company_name = 'NextGen Recruitment' THEN 'top-digital-experience-for-clients'
    WHEN ne.company_name = 'Elite Executive Search' THEN 'best-recruitment-agency'
    WHEN ne.company_name = 'TechTalent Hub' THEN 'top-ai-driven-staffing-platform'
    ELSE 'best-candidate-experience'
  END as subcategory_id,
  'approved' as state,
  floor(random() * 20 + 5)::int as votes
FROM public.nominators n, public.nominees ne
WHERE ne.type = 'company' 
  AND ne.company_name IN ('TalentFlow Solutions', 'Global Staffing Partners', 'NextGen Recruitment', 'Elite Executive Search', 'TechTalent Hub')
  AND n.email = 'michael.chen@globalhr.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.nominations 
    WHERE nominee_id = ne.id
  );

-- Verify the data was created
SELECT 
  'Total Nominations' as metric,
  COUNT(*) as count
FROM public.nominations
UNION ALL
SELECT 
  'Approved Nominations' as metric,
  COUNT(*) as count
FROM public.nominations
WHERE state = 'approved'
UNION ALL
SELECT 
  'Public Nominees Available' as metric,
  COUNT(*) as count
FROM public.public_nominees;

-- Show sample of created nominees for testing
SELECT 
  nomination_id,
  display_name,
  type,
  subcategory_id,
  votes,
  'http://localhost:3000/nominee/' || nomination_id as test_url
FROM public.public_nominees
ORDER BY votes DESC
LIMIT 15;