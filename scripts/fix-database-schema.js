#!/usr/bin/env node

/**
 * Fix database schema automatically
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

async function fixDatabaseSchema() {
  console.log('🔧 FIXING DATABASE SCHEMA\n');

  try {
    // Step 1: Add missing columns to nominations table
    console.log('1. Adding missing columns to nominations table...');
    
    const schemaUpdates = [
      `ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS type TEXT;`,
      `ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS category_group_id TEXT;`,
      `ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS subcategory_id TEXT;`,
    ];

    for (const sql of schemaUpdates) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
          console.log(`⚠️  SQL execution may have failed: ${error.message}`);
        }
      } catch (error) {
        console.log(`⚠️  Direct SQL not available, will use alternative method`);
        break;
      }
    }

    // Step 2: Since direct SQL might not work, let's use a different approach
    // Insert a test record to ensure the table has the right structure
    console.log('2. Testing table structure with sample data...');
    
    const testRecord = {
      type: 'person',
      category_group_id: 'test-category',
      subcategory_id: 'test-subcategory',
      state: 'submitted',
      firstname: 'Test',
      lastname: 'User',
      headshot_url: 'https://example.com/test.jpg',
      why_me: 'Test nomination',
      votes: 0
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('nominations')
      .insert(testRecord)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Insert failed, schema needs manual fix:', insertError.message);
      console.log('\n🔧 MANUAL SCHEMA FIX REQUIRED:');
      console.log('Please run this SQL in your Supabase SQL Editor:');
      console.log(`
-- Fix nominations table schema
ALTER TABLE public.nominations 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('person','company')),
ADD COLUMN IF NOT EXISTS category_group_id TEXT,
ADD COLUMN IF NOT EXISTS subcategory_id TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nominations_type ON public.nominations(type);
CREATE INDEX IF NOT EXISTS idx_nominations_state ON public.nominations(state);
CREATE INDEX IF NOT EXISTS idx_nominations_subcategory ON public.nominations(subcategory_id);

-- Update any existing records
UPDATE public.nominations 
SET type = CASE 
  WHEN firstname IS NOT NULL OR lastname IS NOT NULL THEN 'person'
  WHEN company_name IS NOT NULL THEN 'company'
  ELSE 'person'
END
WHERE type IS NULL;
`);
      return false;
    }

    console.log('✅ Test record inserted successfully');
    
    // Clean up test record
    await supabase
      .from('nominations')
      .delete()
      .eq('id', insertResult.id);
    
    console.log('✅ Test record cleaned up');

    // Step 3: Verify the schema is now correct
    console.log('3. Verifying schema...');
    
    const { data: schemaTest, error: schemaError } = await supabase
      .from('nominations')
      .select('type, category_group_id, subcategory_id, state')
      .limit(1);

    if (schemaError) {
      console.log('❌ Schema verification failed:', schemaError.message);
      return false;
    }

    console.log('✅ Schema verification passed');

    // Step 4: Test API endpoints
    console.log('4. Testing API endpoints...');
    
    const endpoints = [
      '/api/admin/nominations',
      '/api/stats'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:3002${endpoint}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (response.ok) {
          console.log(`✅ ${endpoint}: Working`);
        } else {
          console.log(`❌ ${endpoint}: Status ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: Network error`);
      }
    }

    console.log('\n🎉 Database schema fix completed!');
    return true;

  } catch (error) {
    console.error('❌ Schema fix failed:', error);
    return false;
  }
}

fixDatabaseSchema();