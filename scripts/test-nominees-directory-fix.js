#!/usr/bin/env node

/**
 * Test Nominees Directory Fix
 * Verifies that nominees show proper names instead of "Unknown"
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNomineesAPI() {
  console.log('🧪 Testing Nominees API...\n');

  try {
    // Test 1: Check public_nominees view directly
    console.log('1️⃣ Testing public_nominees view...');
    const { data: viewData, error: viewError } = await supabase
      .from('public_nominees')
      .select('*')
      .limit(5);

    if (viewError) {
      console.error('❌ View error:', viewError.message);
      return false;
    }

    console.log(`✅ Found ${viewData.length} nominees in view`);
    if (viewData.length > 0) {
      const sample = viewData[0];
      console.log('📋 Sample from view:');
      console.log(`   - Display Name: ${sample.display_name}`);
      console.log(`   - Type: ${sample.type}`);
      console.log(`   - Image: ${sample.image_url || 'N/A'}`);
    }

    // Test 2: Test API endpoint
    console.log('\n2️⃣ Testing /api/nominees endpoint...');
    const response = await fetch('http://localhost:3004/api/nominees');
    
    if (!response.ok) {
      console.error(`❌ API failed: ${response.status}`);
      const errorText = await response.text();
      console.error('Error:', errorText);
      return false;
    }

    const result = await response.json();
    if (!result.success) {
      console.error('❌ API error:', result.error);
      return false;
    }

    console.log(`✅ API returned ${result.data.length} nominees`);
    if (result.data.length > 0) {
      const sample = result.data[0];
      console.log('📋 Sample from API:');
      console.log(`   - Name: ${sample.name}`);
      console.log(`   - Display Name: ${sample.displayName}`);
      console.log(`   - Type: ${sample.type}`);
      console.log(`   - Votes: ${sample.votes}`);
      console.log(`   - Image: ${sample.imageUrl || 'N/A'}`);
    }

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Nominees Directory Fix\n');
  
  const success = await testNomineesAPI();
  
  if (success) {
    console.log('\n✅ Nominees API is working correctly!');
    console.log('🌐 Check: http://localhost:3004/directory');
  } else {
    console.log('\n❌ Nominees API has issues');
  }
}

main().catch(console.error);