-- Simple Test Data Creation (No Conflict Handling)
-- Run this in your Supabase SQL Editor

-- Add a few more nominators
INSERT INTO public.nominators (email, firstname, lastname, linkedin, company, job_title, country) VALUES
('sarah.johnson@techcorp.com', 'Sarah', 'Johnson', 'https://linkedin.com/in/sarahjohnson', 'TechCorp Solutions', 'Head of Talent', 'USA'),
('michael.chen@globalhr.com', 'Michael', 'Chen', 'https://linkedin.com/in/michaelchen', 'Global HR Partners', 'Senior Recruitment Manager', 'UK');

-- Add a few more person nominees
INSERT INTO public.nominees (type, firstname, lastname, person_email, person_linkedin, jobtitle, headshot_url, why_me, live_url) VALUES
('person', 'Jessica', 'Martinez', 'jessica.martinez@example.com', 'https://linkedin.com/in/jessicamartinez', 'Senior Executive Recruiter', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face', 'Exceptional track record in executive recruitment with over 8 years of experience.', 'https://jessicamartinez.example.com'),
('person', 'Robert', 'Thompson', 'robert.thompson@example.com', 'https://linkedin.com/in/robertthompson', 'VP of Talent Acquisition', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face', 'Innovative leader in talent acquisition technology.', 'https://robertthompson.example.com'),
('person', 'Lisa', 'Anderson', 'lisa.anderson@example.com', 'https://linkedin.com/in/lisaanderson', 'Chief People Officer', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face', 'Transformational people leader with expertise in building inclusive teams.', 'https://lisaanderson.example.com');

-- Add a few company nominees
INSERT INTO public.nominees (type, company_name, company_website, company_linkedin, company_industry, logo_url, why_us, live_url) VALUES
('company', 'TalentFlow Solutions', 'https://talentflow.com', 'https://linkedin.com/company/talentflow', 'Recruitment Technology', 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop', 'Leading recruitment technology company transforming how businesses find and hire top talent.', 'https://talentflow.com'),
('company', 'Global Staffing Partners', 'https://globalstaffing.com', 'https://linkedin.com/company/globalstaffing', 'Staffing Services', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop', 'International staffing firm with presence in 25 countries.', 'https://globalstaffing.com');

-- Create nominations for the new nominees
-- Get the nominator ID for Sarah Johnson
WITH sarah_nominator AS (
  SELECT id FROM public.nominators WHERE email = 'sarah.johnson@techcorp.com' LIMIT 1
),
-- Get person nominees
person_nominees AS (
  SELECT id, firstname FROM public.nominees 
  WHERE type = 'person' AND firstname IN ('Jessica', 'Robert', 'Lisa')
),
-- Get company nominees  
company_nominees AS (
  SELECT id, company_name FROM public.nominees 
  WHERE type = 'company' AND company_name IN ('TalentFlow Solutions', 'Global Staffing Partners')
)
-- Insert nominations for persons
INSERT INTO public.nominations (nominator_id, nominee_id, category_group_id, subcategory_id, state, votes)
SELECT 
  s.id as nominator_id,
  p.id as nominee_id,
  'role-specific-excellence' as category_group_id,
  CASE 
    WHEN p.firstname = 'Jessica' THEN 'top-recruiter'
    WHEN p.firstname = 'Robert' THEN 'top-executive-leader'
    WHEN p.firstname = 'Lisa' THEN 'top-executive-leader'
  END as subcategory_id,
  'approved' as state,
  floor(random() * 10 + 1)::int as votes
FROM sarah_nominator s, person_nominees p

UNION ALL

-- Insert nominations for companies
SELECT 
  s.id as nominator_id,
  c.id as nominee_id,
  'innovation-technology' as category_group_id,
  CASE 
    WHEN c.company_name = 'TalentFlow Solutions' THEN 'top-ai-driven-staffing-platform'
    WHEN c.company_name = 'Global Staffing Partners' THEN 'fastest-growing-staffing-firm'
  END as subcategory_id,
  'approved' as state,
  floor(random() * 15 + 5)::int as votes
FROM sarah_nominator s, company_nominees c;

-- Show the results
SELECT 
  nomination_id,
  display_name,
  type,
  subcategory_id,
  votes,
  'http://localhost:3000/nominee/' || nomination_id as test_url
FROM public.public_nominees
ORDER BY created_at DESC
LIMIT 10;