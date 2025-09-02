#!/usr/bin/env node

/**
 * Test script to verify all URLs use wass-steel.vercel.app correctly
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

const EXPECTED_DOMAIN = 'https://wass-steel.vercel.app';

async function testWassSteelUrls() {
  console.log('🧪 Testing wass-steel.vercel.app URLs...\n');

  try {
    // 1. Check nominees table URLs
    console.log('1️⃣ Checking nominees table URLs...');
    const { data: nominees, error: nomineesError } = await supabase
      .from('nominees')
      .select('id, live_url')
      .limit(10);

    if (nomineesError) {
      console.error('❌ Error fetching nominees:', nomineesError.message);
      return;
    }

    console.log(`📋 Sample nominee URLs (${nominees.length} shown):`);
    let correctUrlCount = 0;
    nominees.forEach(nominee => {
      const isCorrect = nominee.live_url && nominee.live_url.startsWith(EXPECTED_DOMAIN);
      console.log(`   ${isCorrect ? '✅' : '❌'} ${nominee.id}: ${nominee.live_url}`);
      if (isCorrect) correctUrlCount++;
    });

    console.log(`📊 ${correctUrlCount}/${nominees.length} URLs use correct domain`);

    // 2. Check public_nominees view
    console.log('\n2️⃣ Checking public_nominees view...');
    const { data: publicNominees, error: publicError } = await supabase
      .from('public_nominees')
      .select('nominee_id, display_name, live_url')
      .limit(5);

    if (publicError) {
      console.error('❌ Error fetching public nominees:', publicError.message);
    } else {
      console.log(`📋 Public nominees URLs (${publicNominees.length} shown):`);
      publicNominees.forEach(nominee => {
        const isCorrect = nominee.live_url && nominee.live_url.startsWith(EXPECTED_DOMAIN);
        console.log(`   ${isCorrect ? '✅' : '❌'} ${nominee.display_name}: ${nominee.live_url}`);
      });
    }

    // 3. Test nominees API
    console.log('\n3️⃣ Testing nominees API...');
    const response = await fetch('http://localhost:3000/api/nominees');
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data && result.data.length > 0) {
        console.log(`📋 API nominees URLs (first 3 shown):`);
        result.data.slice(0, 3).forEach(nominee => {
          const liveUrl = nominee.liveUrl || nominee.live_url;
          const isCorrect = liveUrl && liveUrl.startsWith(EXPECTED_DOMAIN);
          console.log(`   ${isCorrect ? '✅' : '❌'} ${nominee.displayName || nominee.name}: ${liveUrl}`);
        });
      }
    } else {
      console.log('⚠️  Could not test API (server may not be running)');
    }

    // 4. Test podium API
    console.log('\n4️⃣ Testing podium API...');
    const podiumResponse = await fetch('http://localhost:3000/api/podium?category=top-executive-leader');
    
    if (podiumResponse.ok) {
      const podiumResult = await podiumResponse.json();
      if (podiumResult.items && podiumResult.items.length > 0) {
        console.log(`📋 Podium URLs:`);
        podiumResult.items.forEach(item => {
          const isCorrect = item.live_slug && item.live_slug.startsWith(EXPECTED_DOMAIN);
          console.log(`   ${isCorrect ? '✅' : '❌'} ${item.name}: ${item.live_slug}`);
        });
      }
    } else {
      console.log('⚠️  Could not test podium API (server may not be running)');
    }

    // 5. Check HubSpot outbox
    console.log('\n5️⃣ Checking HubSpot outbox URLs...');
    const { data: hubspotEntries, error: hubspotError } = await supabase
      .from('hubspot_outbox')
      .select('id, payload')
      .limit(3);

    if (!hubspotError && hubspotEntries && hubspotEntries.length > 0) {
      console.log(`📋 HubSpot outbox URLs (${hubspotEntries.length} shown):`);
      hubspotEntries.forEach(entry => {
        const liveUrl = entry.payload?.liveUrl;
        const isCorrect = liveUrl && liveUrl.startsWith(EXPECTED_DOMAIN);
        console.log(`   ${isCorrect ? '✅' : '❌'} Entry ${entry.id}: ${liveUrl}`);
      });
    } else {
      console.log('ℹ️  No HubSpot outbox entries found');
    }

    // 6. Check environment variables
    console.log('\n6️⃣ Checking environment variables...');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const isCorrectEnv = appUrl === EXPECTED_DOMAIN;
    console.log(`   ${isCorrectEnv ? '✅' : '❌'} NEXT_PUBLIC_APP_URL: ${appUrl}`);

    // 7. Summary
    console.log('\n📊 Summary:');
    console.log(`   🎯 Expected domain: ${EXPECTED_DOMAIN}`);
    console.log(`   📱 Environment URL: ${appUrl} ${isCorrectEnv ? '✅' : '❌'}`);
    console.log(`   🗄️  Database URLs: ${correctUrlCount}/${nominees.length} correct`);

    if (isCorrectEnv && correctUrlCount === nominees.length) {
      console.log('\n🎉 All URLs are correctly configured for wass-steel.vercel.app!');
      console.log('\n🔗 Test URLs:');
      console.log(`   🏠 Home: ${EXPECTED_DOMAIN}`);
      console.log(`   📁 Directory: ${EXPECTED_DOMAIN}/directory`);
      console.log(`   👤 Admin: ${EXPECTED_DOMAIN}/admin`);
      console.log(`   🏆 Podium: ${EXPECTED_DOMAIN}/api/podium?category=top-executive-leader`);
    } else {
      console.log('\n⚠️  Some URLs need fixing. Run the production URL fix script.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testWassSteelUrls().catch(console.error);