#!/usr/bin/env node

/**
 * Detailed Supabase Test
 * Test each component step by step to identify issues
 */

require('dotenv').config({ path: '.env.local' });

async function testDetailed() {
  console.log('🔍 Detailed Supabase Test...\n');
  
  // Test 1: Environment variables
  console.log('1️⃣ Environment Variables:');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('   SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  // Test 2: Direct Supabase client creation
  console.log('\n2️⃣ Creating Supabase Client:');
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('   ✅ Client created successfully');
    
    // Test 3: Simple query to test connection
    console.log('\n3️⃣ Testing Database Connection:');
    
    try {
      // Try to query the nominations table
      const { data, error, count } = await supabase
        .from('nominations')
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.log('   ❌ Query failed:', error.message);
        console.log('   💡 This usually means tables don\'t exist yet');
        
        // Test if we can at least connect to the database
        console.log('\n4️⃣ Testing Basic Connection:');
        const { data: basicData, error: basicError } = await supabase
          .rpc('version');
        
        if (basicError) {
          console.log('   ❌ Basic connection failed:', basicError.message);
        } else {
          console.log('   ✅ Basic connection works');
          console.log('   💡 Database exists but tables need to be created');
        }
        
      } else {
        console.log('   ✅ Database query successful');
        console.log('   📊 Nominations table exists with', count, 'records');
        
        if (data && data.length > 0) {
          console.log('   📝 Sample record:', JSON.stringify(data[0], null, 2));
        }
      }
      
    } catch (queryError) {
      console.log('   ❌ Query error:', queryError.message);
    }
    
  } catch (clientError) {
    console.log('   ❌ Client creation failed:', clientError.message);
  }
  
  // Test 4: API endpoint test
  console.log('\n5️⃣ Testing API Endpoint:');
  try {
    const response = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'person',
        categoryGroupId: 'test',
        subcategoryId: 'test',
        nominator: {
          email: 'test@example.com',
          firstname: 'Test',
          lastname: 'User',
          nominatedDisplayName: 'Test Nominee'
        },
        nominee: {
          firstname: 'Test',
          lastname: 'Nominee',
          jobtitle: 'Test Job',
          whyMe: 'Test reason'
        }
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('   ✅ API endpoint working');
      console.log('   📝 Response:', result);
    } else {
      console.log('   ❌ API endpoint failed');
      console.log('   📝 Error:', result);
      
      if (result.error && result.error.includes('relation') && result.error.includes('does not exist')) {
        console.log('   💡 This confirms tables need to be created');
      }
    }
    
  } catch (apiError) {
    console.log('   ❌ API test failed:', apiError.message);
    console.log('   💡 Make sure development server is running: npm run dev');
  }
  
  console.log('\n📋 Summary:');
  console.log('   If you see "relation does not exist" errors, you need to:');
  console.log('   1. Go to https://supabase.com/dashboard');
  console.log('   2. Select your project');
  console.log('   3. Go to SQL Editor');
  console.log('   4. Copy and paste ALL contents from supabase-schema.sql');
  console.log('   5. Click Run to create the tables');
  console.log('   6. Run this test again');
}

testDetailed();