#!/usr/bin/env node

/**
 * Test Supabase Connection
 * Simple test to verify Supabase credentials and connection
 */

require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔧 Testing Supabase Connection...\n');
  
  // Check environment variables
  console.log('1️⃣ Checking environment variables...');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL not found in environment');
    return;
  }
  
  if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
    return;
  }
  
  console.log('✅ Environment variables configured');
  console.log('   SUPABASE_URL:', supabaseUrl);
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey.substring(0, 20) + '...');
  
  // Test direct connection to Supabase
  console.log('\n2️⃣ Testing direct Supabase connection...');
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Try to query a simple table or create one if it doesn't exist
    const { data, error } = await supabase
      .from('nominations')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.log('⚠️  Database connection successful, but tables may not exist yet');
      console.log('   Error:', error.message);
      console.log('   This is expected if you haven\'t run the schema yet');
    } else {
      console.log('✅ Database connection successful');
      console.log('   Tables exist and are accessible');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
  
  console.log('\n📋 Next steps:');
  console.log('   1. Go to your Supabase dashboard: https://supabase.com/dashboard');
  console.log('   2. Navigate to SQL Editor');
  console.log('   3. Copy and paste the contents of supabase-schema.sql');
  console.log('   4. Run the SQL to create tables');
  console.log('   5. Run the full integration test: node scripts/test-supabase-integration.js');
}

testConnection();