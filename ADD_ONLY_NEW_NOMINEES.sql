-- Add Only New Nominees (Skip Existing Nominators)
-- Run this in your Supabase SQL Editor

-- Add only new person nominees (with unique emails)
INSERT INTO public.nominees (type, firstname, lastname, person_email, person_linkedin, jobtitle, headshot_url, why_me, live_url) VALUES
('person', 'Jessica', 'Martinez', 'jessica.martinez@newexample.com', 'https://linkedin.com/in/jessicamartinez', 'Senior Executive Recruiter', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face', 'Exceptional track record in executive recruitment with over 8 years of experience.', 'https://jessicamartinez.example.com'),
('person', 'Robert', 'Thompson', 'robert.thompson@newexample.com', 'https://linkedin.com/in/robertthompson', 'VP of Talent Acquisition', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face', 'Innovative leader in talent acquisition technology.', 'https://robertthompson.example.com'),
('person', 'Lisa', 'Anderson', 'lisa.anderson@newexample.com', 'https://linkedin.com/in/lisaanderson', 'Chief People Officer', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face', 'Transformational people leader with expertise in building inclusive teams.', 'https://lisaanderson.example.com'),
('person', 'James', 'Wilson', 'james.wilson@newexample.com', 'https://linkedin.com/in/jameswilson', 'Director of Recruitment', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face', 'Rising star in recruitment with innovative approaches.', 'https://jameswilson.example.com'),
('person', 'Maria', 'Rodriguez', 'maria.rodriguez@newexample.com', 'https://linkedin.com/in/mariarodriguez', 'Senior Talent Partner', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face', 'Expert in diversity and inclusion recruiting.', 'https://mariarodriguez.example.com');

-- Add company nominees (with unique names)
INSERT INTO public.nominees (type, company_name, company_website, company_linkedin, company_industry, logo_url, why_us, live_url) VALUES
('company', 'TalentFlow Solutions Inc', 'https://talentflow.com', 'https://linkedin.com/company/talentflow', 'Recruitment Technology', 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop', 'Leading recruitment technology company transforming how businesses find and hire top talent.', 'https://talentflow.com'),
('company', 'Global Staffing Partners Ltd', 'https://globalstaffing.com', 'https://linkedin.com/company/globalstaffing', 'Staffing Services', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop', 'International staffing firm with presence in 25 countries.', 'https://globalstaffing.com'),
('company', 'NextGen Recruitment Agency', 'https://nextgenrecruitment.com', 'https://linkedin.com/company/nextgenrecruitment', 'Digital Recruitment', 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=400&fit=crop', 'Innovative recruitment agency leveraging cutting-edge technology.', 'https://nextgenrecruitment.com'),
('company', 'Elite Executive Search Firm', 'https://eliteexecutive.com', 'https://linkedin.com/company/eliteexecutive', 'Executive Search', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=400&fit=crop', 'Boutique executive search firm specializing in C-suite placements.', 'https://eliteexecutive.com');

-- Create nominations using existing nominators
-- Get the first available nominator
WITH first_nominator AS (
  SELECT id FROM public.nominators LIMIT 1
),
-- Get the newly added person nominees
new_person_nominees AS (
  SELECT id, firstname FROM public.nominees 
  WHERE type = 'person' AND person_email LIKE '%@newexample.com'
),
-- Get the newly added company nominees  
new_company_nominees AS (
  SELECT id, company_name FROM public.nominees 
  WHERE type = 'company' AND company_name LIKE '%Inc' OR company_name LIKE '%Ltd' OR company_name LIKE '%Agency' OR company_name LIKE '%Firm'
)
-- Insert nominations for new person nominees
INSERT INTO public.nominations (nominator_id, nominee_id, category_group_id, subcategory_id, state, votes)
SELECT 
  f.id as nominator_id,
  p.id as nominee_id,
  'role-specific-excellence' as category_group_id,
  CASE 
    WHEN p.firstname = 'Jessica' THEN 'top-recruiter'
    WHEN p.firstname = 'Robert' THEN 'top-executive-leader'
    WHEN p.firstname = 'Lisa' THEN 'top-executive-leader'
    WHEN p.firstname = 'James' THEN 'rising-star-under-30'
    WHEN p.firstname = 'Maria' THEN 'top-staffing-influencer'
  END as subcategory_id,
  'approved' as state,
  floor(random() * 10 + 1)::int as votes
FROM first_nominator f, new_person_nominees p

UNION ALL

-- Insert nominations for new company nominees
SELECT 
  f.id as nominator_id,
  c.id as nominee_id,
  'innovation-technology' as category_group_id,
  CASE 
    WHEN c.company_name LIKE '%TalentFlow%' THEN 'top-ai-driven-staffing-platform'
    WHEN c.company_name LIKE '%Global%' THEN 'fastest-growing-staffing-firm'
    WHEN c.company_name LIKE '%NextGen%' THEN 'top-digital-experience-for-clients'
    WHEN c.company_name LIKE '%Elite%' THEN 'best-recruitment-agency'
  END as subcategory_id,
  'approved' as state,
  floor(random() * 15 + 5)::int as votes
FROM first_nominator f, new_company_nominees c;

-- Show all available nominees now
SELECT 
  nomination_id,
  display_name,
  type,
  subcategory_id,
  votes,
  'http://localhost:3000/nominee/' || nomination_id as test_url
FROM public.public_nominees
ORDER BY created_at DESC;