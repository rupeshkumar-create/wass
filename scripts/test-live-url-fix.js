#!/usr/bin/env node

/**
 * Test script to verify the live URL fix works correctly
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

async function testLiveUrlFix() {
  console.log('🧪 Testing Live URL Fix...\n');

  try {
    // 1. Check if nominees table exists and has live URLs
    console.log('1️⃣ Checking nominees table structure...');
    const { data: nominees, error: nomineesError } = await supabase
      .from('nominees')
      .select('id, type, firstname, lastname, company_name, live_url')
      .limit(5);

    if (nomineesError) {
      console.error('❌ Error checking nominees:', nomineesError.message);
      return;
    }

    console.log(`✅ Found ${nominees.length} nominees`);
    nominees.forEach(nominee => {
      console.log(`   - ${nominee.type}: ${nominee.firstname || nominee.company_name} | Live URL: ${nominee.live_url || 'MISSING'}`);
    });

    // 2. Test the public_nominees view
    console.log('\n2️⃣ Testing public_nominees view...');
    const { data: publicNominees, error: viewError } = await supabase
      .from('public_nominees')
      .select('nomination_id, nominee_id, type, display_name, live_url')
      .limit(5);

    if (viewError) {
      console.error('❌ Error checking public_nominees view:', viewError.message);
      return;
    }

    console.log(`✅ Found ${publicNominees.length} public nominees`);
    publicNominees.forEach(nominee => {
      console.log(`   - ${nominee.type}: ${nominee.display_name} | Live URL: ${nominee.live_url || 'MISSING'}`);
    });

    // 3. Test the get_nominee_by_identifier function
    if (publicNominees.length > 0) {
      const testNominee = publicNominees[0];
      console.log(`\n3️⃣ Testing get_nominee_by_identifier function with: ${testNominee.nominee_id}`);
      
      const { data: lookupResult, error: lookupError } = await supabase
        .rpc('get_nominee_by_identifier', { identifier: testNominee.nominee_id });

      if (lookupError) {
        console.error('❌ Error testing lookup function:', lookupError.message);
        return;
      }

      if (lookupResult && lookupResult.length > 0) {
        console.log('✅ Lookup function works!');
        console.log(`   - Found: ${lookupResult[0].display_name}`);
        console.log(`   - Live URL: ${lookupResult[0].live_url}`);
      } else {
        console.log('❌ Lookup function returned no results');
      }
    }

    // 4. Test URL generation pattern
    console.log('\n4️⃣ Testing URL generation pattern...');
    const expectedPattern = 'https://worldstaffingawards.com/nominee/';
    const validUrls = publicNominees.filter(n => n.live_url && n.live_url.startsWith(expectedPattern));
    
    console.log(`✅ ${validUrls.length}/${publicNominees.length} nominees have correct URL pattern`);
    
    if (validUrls.length !== publicNominees.length) {
      console.log('⚠️  Some nominees have incorrect URL patterns:');
      publicNominees.filter(n => !n.live_url || !n.live_url.startsWith(expectedPattern))
        .forEach(n => console.log(`   - ${n.display_name}: ${n.live_url || 'NULL'}`));
    }

    console.log('\n🎉 Live URL fix test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testLiveUrlFix().catch(console.error);