#!/usr/bin/env node

/**
 * Debug database schema issues
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

async function debugDatabaseSchema() {
  console.log('🔍 DEBUGGING DATABASE SCHEMA\n');

  try {
    // Check nominations table structure
    console.log('1. Checking nominations table structure...');
    
    const { data: nominations, error: nomError } = await supabase
      .from('nominations')
      .select('*')
      .limit(1);

    if (nomError) {
      console.error('❌ Error querying nominations:', nomError);
      return;
    }

    if (nominations.length > 0) {
      console.log('✅ Nominations table columns:');
      Object.keys(nominations[0]).forEach(col => {
        console.log(`   • ${col}: ${typeof nominations[0][col]}`);
      });
    } else {
      console.log('⚠️  Nominations table is empty');
    }

    // Check if type column exists by trying to select it specifically
    console.log('\n2. Testing for type column...');
    try {
      const { data, error } = await supabase
        .from('nominations')
        .select('type')
        .limit(1);
      
      if (error) {
        console.log('❌ Type column missing:', error.message);
      } else {
        console.log('✅ Type column exists');
      }
    } catch (error) {
      console.log('❌ Type column test failed:', error.message);
    }

    // Check nominators table
    console.log('\n3. Checking nominators table...');
    const { data: nominators, error: nominatorError } = await supabase
      .from('nominators')
      .select('*')
      .limit(1);

    if (nominatorError) {
      console.error('❌ Error querying nominators:', nominatorError);
    } else {
      console.log(`✅ Nominators table: ${nominators.length} records`);
      if (nominators.length > 0) {
        console.log('   Columns:', Object.keys(nominators[0]).join(', '));
      }
    }

    // Check voters table
    console.log('\n4. Checking voters table...');
    const { data: voters, error: voterError } = await supabase
      .from('voters')
      .select('*')
      .limit(1);

    if (voterError) {
      console.error('❌ Error querying voters:', voterError);
    } else {
      console.log(`✅ Voters table: ${voters.length} records`);
      if (voters.length > 0) {
        console.log('   Columns:', Object.keys(voters[0]).join(', '));
      }
    }

    // Generate SQL to fix the schema
    console.log('\n5. SCHEMA FIX RECOMMENDATIONS:');
    console.log('================================');
    
    console.log('Run this SQL in your Supabase SQL Editor:');
    console.log(`
-- Add missing type column to nominations table
ALTER TABLE public.nominations 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('person','company'));

-- Update existing records to have a type based on data
UPDATE public.nominations 
SET type = CASE 
  WHEN firstname IS NOT NULL OR lastname IS NOT NULL THEN 'person'
  WHEN company_name IS NOT NULL THEN 'company'
  ELSE 'person'
END
WHERE type IS NULL;

-- Make type column NOT NULL after updating
ALTER TABLE public.nominations 
ALTER COLUMN type SET NOT NULL;

-- Add any other missing columns
ALTER TABLE public.nominations 
ADD COLUMN IF NOT EXISTS category_group_id TEXT,
ADD COLUMN IF NOT EXISTS subcategory_id TEXT;

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_nominations_type ON public.nominations(type);
CREATE INDEX IF NOT EXISTS idx_nominations_state ON public.nominations(state);
CREATE INDEX IF NOT EXISTS idx_nominations_subcategory ON public.nominations(subcategory_id);
`);

  } catch (error) {
    console.error('❌ Schema debug failed:', error);
  }
}

debugDatabaseSchema();