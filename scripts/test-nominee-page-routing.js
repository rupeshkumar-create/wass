#!/usr/bin/env node

/**
 * Test nominee page routing with different URL formats
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testNomineePageRouting() {
  console.log('🧪 Testing Nominee Page Routing...\n');

  try {
    // Get some test nominees
    const { data: nominees, error } = await supabase
      .from('public_nominees')
      .select('nomination_id, nominee_id, display_name, live_url, type')
      .limit(3);

    if (error) {
      console.error('❌ Error fetching nominees:', error.message);
      return;
    }

    console.log(`✅ Found ${nominees.length} nominees to test\n`);

    for (const nominee of nominees) {
      console.log(`🔍 Testing: ${nominee.display_name} (${nominee.type})`);
      console.log(`   Live URL: ${nominee.live_url}`);
      
      // Extract the ID from the live URL
      const urlId = nominee.live_url.replace('https://worldstaffingawards.com/nominee/', '');
      console.log(`   URL ID: ${urlId}`);
      
      // Test different routing scenarios
      const testCases = [
        { label: 'Nominee ID', value: nominee.nominee_id },
        { label: 'Nomination ID', value: nominee.nomination_id },
        { label: 'URL ID', value: urlId },
        { label: 'Name Slug', value: nominee.display_name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') }
      ];

      for (const testCase of testCases) {
        try {
          const { data: result, error: lookupError } = await supabase
            .rpc('get_nominee_by_identifier', { identifier: testCase.value });

          if (lookupError) {
            console.log(`   ❌ ${testCase.label}: ${lookupError.message}`);
          } else if (result && result.length > 0) {
            console.log(`   ✅ ${testCase.label}: Found ${result[0].display_name}`);
          } else {
            console.log(`   ⚠️  ${testCase.label}: No results`);
          }
        } catch (err) {
          console.log(`   ❌ ${testCase.label}: ${err.message}`);
        }
      }
      
      console.log('');
    }

    // Test the expected URL format
    console.log('🌐 Testing expected URL formats:');
    for (const nominee of nominees) {
      const expectedUrl = `https://worldstaffingawards.com/nominee/${nominee.nominee_id}`;
      const actualUrl = nominee.live_url;
      
      if (expectedUrl === actualUrl) {
        console.log(`   ✅ ${nominee.display_name}: URL format correct`);
      } else {
        console.log(`   ❌ ${nominee.display_name}: URL mismatch`);
        console.log(`      Expected: ${expectedUrl}`);
        console.log(`      Actual:   ${actualUrl}`);
      }
    }

    console.log('\n🎉 Nominee page routing test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testNomineePageRouting().catch(console.error);