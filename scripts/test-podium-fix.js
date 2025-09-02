#!/usr/bin/env node

/**
 * Test script to verify podium shows updated votes correctly
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

async function testPodiumFix() {
  console.log('🧪 Testing Podium Fix...\n');

  try {
    // 1. Check nominees with additional votes
    console.log('1️⃣ Checking nominees with additional votes...');
    const { data: nomineesWithAdditional, error: additionalError } = await supabase
      .from('public_nominees')
      .select('nomination_id, nominee_id, display_name, subcategory_id, votes, additional_votes, total_votes')
      .gt('additional_votes', 0)
      .order('total_votes', { ascending: false });

    if (additionalError) {
      console.error('❌ Error checking additional votes:', additionalError.message);
      return;
    }

    console.log(`✅ Found ${nomineesWithAdditional.length} nominees with additional votes:`);
    nomineesWithAdditional.forEach(nominee => {
      console.log(`   - ${nominee.display_name}: Real: ${nominee.votes}, Additional: ${nominee.additional_votes}, Total: ${nominee.total_votes}`);
    });

    // 2. Test podium API for top-executive-leader category
    console.log('\n2️⃣ Testing podium API for top-executive-leader...');
    const response = await fetch('http://localhost:3000/api/podium?category=top-executive-leader');
    
    if (!response.ok) {
      console.error('❌ Podium API failed:', response.status, response.statusText);
      return;
    }

    const podiumData = await response.json();
    console.log('✅ Podium API response:');
    console.log(JSON.stringify(podiumData, null, 2));

    // 3. Check if the nominee with 21 votes is in top position
    if (podiumData.items && podiumData.items.length > 0) {
      const topNominee = podiumData.items[0];
      console.log(`\n🏆 Top nominee: ${topNominee.name} with ${topNominee.votes} votes`);
      
      if (topNominee.votes >= 21) {
        console.log('✅ Podium correctly shows updated votes!');
      } else {
        console.log('❌ Podium may not be showing updated votes correctly');
      }
    }

    // 4. Test all categories to see vote totals
    console.log('\n3️⃣ Testing vote totals across categories...');
    const categories = ['top-recruiter', 'top-executive-leader', 'rising-star-under-30'];
    
    for (const category of categories) {
      const { data: categoryNominees, error: catError } = await supabase
        .from('public_nominees')
        .select('display_name, votes, additional_votes, total_votes')
        .eq('subcategory_id', category)
        .order('total_votes', { ascending: false })
        .limit(3);

      if (!catError && categoryNominees.length > 0) {
        console.log(`\n📊 ${category}:`);
        categoryNominees.forEach((nominee, index) => {
          console.log(`   ${index + 1}. ${nominee.display_name}: ${nominee.total_votes} total votes (${nominee.votes} real + ${nominee.additional_votes || 0} additional)`);
        });
      }
    }

    console.log('\n🎉 Podium fix test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPodiumFix().catch(console.error);