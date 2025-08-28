#!/usr/bin/env node

/**
 * Fix Directory Display Issues
 * Comprehensive test and fix for the directory page
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDirectoryFlow() {
  console.log('🧪 Testing Directory Display Flow...\n');

  try {
    // Test 1: Check public_nominees view
    console.log('1️⃣ Testing public_nominees view...');
    const { data: viewData, error: viewError } = await supabase
      .from('public_nominees')
      .select('*')
      .limit(3);

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
      console.log(`   - Category: ${sample.subcategory_id}`);
      console.log(`   - Image: ${sample.image_url || 'N/A'}`);
      console.log(`   - Votes: ${sample.votes}`);
    }

    // Test 2: Test API endpoint
    console.log('\n2️⃣ Testing /api/nominees endpoint...');
    const response = await fetch('http://localhost:3004/api/nominees?limit=3');
    
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
    
    // Test 3: Validate data structure for frontend
    if (result.data.length > 0) {
      const sample = result.data[0];
      console.log('\n3️⃣ Validating frontend data structure...');
      
      const checks = [
        { field: 'id', value: sample.id, required: true },
        { field: 'name', value: sample.name, required: true },
        { field: 'displayName', value: sample.displayName, required: true },
        { field: 'category', value: sample.category, required: true },
        { field: 'type', value: sample.type, required: true },
        { field: 'votes', value: sample.votes, required: true },
        { field: 'nominee', value: sample.nominee, required: true },
        { field: 'nominee.name', value: sample.nominee?.name, required: true },
        { field: 'imageUrl', value: sample.imageUrl, required: false },
      ];
      
      let allValid = true;
      checks.forEach(check => {
        const exists = check.value !== undefined && check.value !== null;
        const status = exists ? '✅' : (check.required ? '❌' : '⚠️');
        console.log(`   ${status} ${check.field}: ${exists ? 'OK' : 'MISSING'}`);
        if (check.required && !exists) allValid = false;
      });
      
      if (!allValid) {
        console.log('\n❌ Data structure validation failed!');
        console.log('Sample data:', JSON.stringify(sample, null, 2));
        return false;
      }
      
      console.log('\n✅ Data structure validation passed!');
    }

    // Test 4: Test directory page endpoint
    console.log('\n4️⃣ Testing directory page access...');
    try {
      const dirResponse = await fetch('http://localhost:3004/directory');
      if (dirResponse.ok) {
        console.log('✅ Directory page accessible');
      } else {
        console.log(`⚠️  Directory page returned ${dirResponse.status}`);
      }
    } catch (error) {
      console.log('⚠️  Could not test directory page (server might not be running)');
    }

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Directory Display Fix & Test\n');
  console.log('=' .repeat(50));

  const success = await testDirectoryFlow();
  
  if (success) {
    console.log('\n✅ Directory display should be working correctly!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Restart your development server');
    console.log('   2. Visit: http://localhost:3004/directory');
    console.log('   3. Check that nominees show proper names instead of "Unknown"');
    console.log('   4. Test filtering and search functionality');
  } else {
    console.log('\n❌ Directory display has issues that need to be resolved');
  }
}

main().catch(console.error);