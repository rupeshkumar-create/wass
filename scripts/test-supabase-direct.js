#!/usr/bin/env node

/**
 * Direct Supabase Test
 * Test Supabase connection using direct HTTP calls
 */

require('dotenv').config({ path: '.env.local' });

async function testDirect() {
  console.log('🌐 Direct Supabase HTTP Test...\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('🔗 Testing URL:', supabaseUrl);
  console.log('🔑 Using Service Role Key:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'MISSING');
  
  // Test 1: Basic REST API health check
  console.log('\n1️⃣ Testing Supabase REST API health...');
  try {
    const healthUrl = `${supabaseUrl}/rest/v1/`;
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);
    
    if (response.ok) {
      console.log('   ✅ Supabase REST API is accessible');
    } else {
      console.log('   ❌ Supabase REST API returned error');
      const errorText = await response.text();
      console.log('   Error:', errorText);
    }
    
  } catch (error) {
    console.log('   ❌ Failed to reach Supabase:', error.message);
    console.log('   💡 This could be a network issue or incorrect URL');
  }
  
  // Test 2: Try to query a table (should fail if tables don't exist)
  console.log('\n2️⃣ Testing table query...');
  try {
    const tableUrl = `${supabaseUrl}/rest/v1/nominations?select=count`;
    const response = await fetch(tableUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });
    
    console.log('   Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Nominations table exists and is accessible');
      console.log('   📊 Data:', data);
    } else {
      const errorText = await response.text();
      console.log('   ❌ Table query failed:', errorText);
      
      if (errorText.includes('relation') && errorText.includes('does not exist')) {
        console.log('   💡 This confirms the tables need to be created');
      } else if (errorText.includes('permission denied')) {
        console.log('   💡 This suggests a permissions issue with the service role key');
      }
    }
    
  } catch (error) {
    console.log('   ❌ Table query error:', error.message);
  }
  
  // Test 3: Check if we can access the Supabase project info
  console.log('\n3️⃣ Testing project access...');
  try {
    // Try to access the OpenAPI spec (this should work if credentials are correct)
    const specUrl = `${supabaseUrl}/rest/v1/`;
    const response = await fetch(specUrl, {
      method: 'OPTIONS',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    console.log('   Status:', response.status);
    
    if (response.status === 200 || response.status === 204) {
      console.log('   ✅ Project access confirmed');
    } else {
      console.log('   ❌ Project access issue');
    }
    
  } catch (error) {
    console.log('   ❌ Project access error:', error.message);
  }
  
  console.log('\n📋 Diagnosis:');
  console.log('   If all tests fail with "fetch failed":');
  console.log('   - Check your internet connection');
  console.log('   - Verify the Supabase project URL is correct');
  console.log('   - Make sure the Supabase project is active');
  console.log('');
  console.log('   If you get "relation does not exist":');
  console.log('   - The connection works but tables need to be created');
  console.log('   - Go to Supabase dashboard and run the schema');
  console.log('');
  console.log('   If you get "permission denied":');
  console.log('   - Check that the service role key is correct');
  console.log('   - Verify RLS policies allow service role access');
}

testDirect();