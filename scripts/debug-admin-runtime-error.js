#!/usr/bin/env node

/**
 * Debug runtime errors in admin panel
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Debugging Admin Runtime Error...\n');

// Test API endpoints directly
async function testAPIEndpoints() {
  try {
    console.log('1. Testing API endpoints directly...');
    
    // Test admin nominations endpoint
    const response = await fetch('http://localhost:3002/api/admin/nominations', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Admin API working: ${data.data?.length || 0} nominations`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Admin API failed: ${errorText}`);
    }

  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
  }

  try {
    // Test stats endpoint
    const statsResponse = await fetch('http://localhost:3002/api/stats', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    console.log(`   Stats Status: ${statsResponse.status}`);
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log(`   ✅ Stats API working`);
    } else {
      console.log(`   ❌ Stats API failed`);
    }

  } catch (error) {
    console.log(`   ❌ Stats network error: ${error.message}`);
  }
}

// Test database connection
async function testDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('\n2. Testing database connection...');
    
    const { data, error } = await supabase
      .from('nominations')
      .select('id, type, state')
      .limit(1);

    if (error) {
      console.log(`   ❌ Database error: ${error.message}`);
    } else {
      console.log(`   ✅ Database connection working`);
    }

  } catch (error) {
    console.log(`   ❌ Database connection failed: ${error.message}`);
  }
}

async function runDebug() {
  await testAPIEndpoints();
  await testDatabase();
  
  console.log('\n3. Common issues to check:');
  console.log('   • Check browser console for JavaScript errors');
  console.log('   • Verify all imports are correct');
  console.log('   • Check if server is running on port 3002');
  console.log('   • Ensure all UI components exist');
  console.log('   • Check for syntax errors in React components');
}

runDebug();