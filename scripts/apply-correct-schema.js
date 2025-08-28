#!/usr/bin/env node

/**
 * Apply the correct database schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyCorrectSchema() {
  console.log('🔧 APPLYING CORRECT DATABASE SCHEMA\n');

  try {
    // First, let's see what tables exist
    console.log('1. Checking existing tables...');
    
    const tables = ['nominations', 'nominators', 'voters'];
    const existingTables = [];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(0);
        
        if (!error) {
          existingTables.push(table);
          console.log(`✅ Table ${table} exists`);
        }
      } catch (error) {
        console.log(`❌ Table ${table} missing or inaccessible`);
      }
    }

    // Check the structure of nominations table
    console.log('\n2. Checking nominations table structure...');
    
    try {
      // Try to get the first record to see the structure
      const { data, error } = await supabase
        .from('nominations')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('❌ Cannot query nominations table:', error.message);
      } else {
        console.log('✅ Nominations table is queryable');
        if (data.length > 0) {
          console.log('   Columns:', Object.keys(data[0]).join(', '));
        } else {
          console.log('   Table is empty, cannot determine structure');
        }
      }
    } catch (error) {
      console.log('❌ Error querying nominations:', error.message);
    }

    // Since we can't execute SQL directly, let's create a comprehensive SQL script
    console.log('\n3. Generating SQL script to fix schema...');
    
    const sqlScript = `
-- WSA 2026 Database Schema Fix
-- Run this entire script in your Supabase SQL Editor

-- Drop existing tables if they have wrong structure
DROP TABLE IF EXISTS public.hubspot_outbox CASCADE;
DROP TABLE IF EXISTS public.voters CASCADE;
DROP TABLE IF EXISTS public.nominators CASCADE;
DROP TABLE IF EXISTS public.nominations CASCADE;
DROP VIEW IF EXISTS public.public_nominees CASCADE;

-- Create nominations table with correct structure
CREATE TABLE public.nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('person','company')),
  category_group_id TEXT NOT NULL,
  subcategory_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'submitted' CHECK (state IN ('submitted','approved','rejected')),
  
  -- person fields
  firstname TEXT,
  lastname TEXT,
  jobtitle TEXT,
  person_email TEXT,
  person_linkedin TEXT,
  headshot_url TEXT,
  why_me TEXT,
  
  -- company fields
  company_name TEXT,
  company_domain TEXT,
  company_website TEXT,
  company_linkedin TEXT,
  logo_url TEXT,
  why_us TEXT,
  
  -- shared
  live_url TEXT,
  votes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create nominators table
CREATE TABLE public.nominators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  linkedin TEXT,
  nominated_display_name TEXT NOT NULL,
  category_group_id TEXT NOT NULL,
  subcategory_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create voters table
CREATE TABLE public.voters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  linkedin TEXT NOT NULL,
  subcategory_id TEXT NOT NULL,
  voted_for_display_name TEXT NOT NULL,
  vote_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create hubspot_outbox table
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

-- Create indexes
CREATE INDEX idx_nominations_subcat ON public.nominations(subcategory_id);
CREATE INDEX idx_nominations_state ON public.nominations(state);
CREATE INDEX idx_nominations_type ON public.nominations(type);
CREATE UNIQUE INDEX uniq_nominator_email_subcat ON public.nominators (lower(email), subcategory_id);
CREATE UNIQUE INDEX uniq_vote_email_subcat ON public.voters (lower(email), subcategory_id);
CREATE INDEX idx_outbox_status_created ON public.hubspot_outbox(status, created_at);

-- Create public view
CREATE VIEW public.public_nominees AS
SELECT
  id,
  type,
  subcategory_id,
  CASE 
    WHEN type='person' THEN COALESCE(firstname,'') || ' ' || COALESCE(lastname,'')
    ELSE COALESCE(company_name,'')
  END AS display_name,
  COALESCE(live_url,'') AS live_url,
  votes
FROM public.nominations
WHERE state='approved';

-- Create update trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; 
$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER set_updated_at_nominations 
  BEFORE UPDATE ON public.nominations
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_updated_at_nominators 
  BEFORE UPDATE ON public.nominators
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_updated_at_outbox 
  BEFORE UPDATE ON public.hubspot_outbox
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Enable RLS
ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubspot_outbox ENABLE ROW LEVEL SECURITY;

-- Insert sample data for testing
INSERT INTO public.nominations (
  type, category_group_id, subcategory_id, state,
  firstname, lastname, jobtitle, person_email, person_linkedin,
  headshot_url, why_me, votes
) VALUES (
  'person', 'individual-awards', 'top-recruiter', 'approved',
  'John', 'Doe', 'Senior Recruiter', 'john.doe@example.com', 'https://linkedin.com/in/johndoe',
  'https://example.com/headshot.jpg', 'Exceptional recruiting skills and leadership', 5
);

INSERT INTO public.nominations (
  type, category_group_id, subcategory_id, state,
  company_name, company_website, company_linkedin,
  logo_url, why_us, votes
) VALUES (
  'company', 'company-awards', 'best-staffing-firm', 'approved',
  'TechStaff Solutions', 'https://techstaff.com', 'https://linkedin.com/company/techstaff',
  'https://example.com/logo.jpg', 'Leading innovation in staffing technology', 8
);
`;

    console.log('✅ SQL script generated');
    console.log('\n🔧 MANUAL ACTION REQUIRED:');
    console.log('==========================================');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the SQL script below');
    console.log('4. Execute the script');
    console.log('5. Run the test again');
    console.log('\n📋 SQL SCRIPT:');
    console.log('==========================================');
    console.log(sqlScript);

    // Save the SQL script to a file
    const fs = require('fs');
    fs.writeFileSync('fix-schema.sql', sqlScript);
    console.log('\n💾 SQL script saved to: fix-schema.sql');

    return false; // Manual action required

  } catch (error) {
    console.error('❌ Schema application failed:', error);
    return false;
  }
}

applyCorrectSchema();