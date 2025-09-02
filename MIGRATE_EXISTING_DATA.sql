-- Migration Script: Move existing data to new schema
-- Run this AFTER creating the new schema

-- First, let's check if old nominations table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'nominations_old') THEN
    RAISE NOTICE 'Found old nominations table, starting migration...';
    
    -- Migrate nominators from old data
    INSERT INTO public.nominators (email, firstname, lastname, linkedin, company, job_title, country, created_at)
    SELECT DISTINCT 
      COALESCE(nominator_email, 'unknown@example.com') as email,
      COALESCE(nominator_firstname, 'Unknown') as firstname,
      COALESCE(nominator_lastname, 'User') as lastname,
      nominator_linkedin as linkedin,
      nominator_company as company,
      nominator_job_title as job_title,
      nominator_country as country,
      created_at
    FROM nominations_old
    WHERE nominator_email IS NOT NULL
    ON CONFLICT (email) DO NOTHING;
    
    -- Migrate nominees from old data
    INSERT INTO public.nominees (
      type, firstname, lastname, person_email, person_linkedin, jobtitle, 
      headshot_url, why_me, company_name, company_website, company_linkedin, 
      logo_url, why_us, live_url, created_at
    )
    SELECT DISTINCT
      COALESCE(type, 'person') as type,
      firstname,
      lastname,
      person_email,
      person_linkedin,
      jobtitle,
      headshot_url,
      why_me,
      company_name,
      company_website,
      company_linkedin,
      logo_url,
      why_us,
      live_url,
      created_at
    FROM nominations_old
    WHERE (type = 'person' AND firstname IS NOT NULL) 
       OR (type = 'company' AND company_name IS NOT NULL);
    
    -- Migrate nominations
    INSERT INTO public.nominations (
      nominator_id, nominee_id, category_group_id, subcategory_id, 
      state, votes, admin_notes, approved_at, created_at
    )
    SELECT 
      nr.id as nominator_id,
      ne.id as nominee_id,
      COALESCE(old.category_group_id, 'role-specific-excellence') as category_group_id,
      COALESCE(old.subcategory_id, 'top-recruiter') as subcategory_id,
      CASE 
        WHEN old.state = 'approved' THEN 'approved'
        WHEN old.state = 'rejected' THEN 'rejected'
        ELSE 'submitted'
      END as state,
      COALESCE(old.votes, 0) as votes,
      old.admin_notes,
      old.approved_at,
      old.created_at
    FROM nominations_old old
    JOIN public.nominators nr ON nr.email = old.nominator_email
    JOIN public.nominees ne ON (
      (old.type = 'person' AND ne.firstname = old.firstname AND ne.lastname = old.lastname)
      OR (old.type = 'company' AND ne.company_name = old.company_name)
    )
    WHERE old.nominator_email IS NOT NULL;
    
    RAISE NOTICE 'Migration completed successfully!';
    
  ELSE
    RAISE NOTICE 'No old nominations table found. Creating sample data...';
    
    -- Create sample data for testing
    INSERT INTO public.nominators (email, firstname, lastname, linkedin, company, job_title, country) VALUES
    ('john.doe@example.com', 'John', 'Doe', 'https://linkedin.com/in/johndoe', 'Tech Corp', 'CEO', 'USA'),
    ('jane.smith@example.com', 'Jane', 'Smith', 'https://linkedin.com/in/janesmith', 'HR Solutions', 'Director', 'UK');
    
    INSERT INTO public.nominees (type, firstname, lastname, person_email, person_linkedin, jobtitle, headshot_url, why_me) VALUES
    ('person', 'Amit', 'Kumar', 'amit.kumar@example.com', 'https://linkedin.com/in/amitkumar', 'CEO', 'https://example.com/amit.jpg', 'Exceptional leadership in staffing industry'),
    ('person', 'Sarah', 'Johnson', 'sarah.johnson@example.com', 'https://linkedin.com/in/sarahjohnson', 'Senior Recruiter', 'https://example.com/sarah.jpg', 'Outstanding recruitment performance');
    
    INSERT INTO public.nominations (nominator_id, nominee_id, category_group_id, subcategory_id, state) VALUES
    ((SELECT id FROM public.nominators WHERE email = 'john.doe@example.com'), 
     (SELECT id FROM public.nominees WHERE firstname = 'Amit' AND lastname = 'Kumar'), 
     'role-specific-excellence', 'top-recruiter', 'approved'),
    ((SELECT id FROM public.nominators WHERE email = 'jane.smith@example.com'), 
     (SELECT id FROM public.nominees WHERE firstname = 'Sarah' AND lastname = 'Johnson'), 
     'role-specific-excellence', 'top-recruiter', 'approved');
    
    RAISE NOTICE 'Sample data created successfully!';
  END IF;
END $$;