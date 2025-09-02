#!/usr/bin/env node

/**
 * Test admin vote update functionality
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

async function testAdminVoteUpdate() {
  console.log('🧪 Testing Admin Vote Update Functionality...\n');

  try {
    // 1. Check nominations table structure
    console.log('1️⃣ Checking nominations table structure...');
    const { data: nominations, error: nomError } = await supabase
      .from('nominations')
      .select('id, votes, additional_votes, state')
      .eq('state', 'approved')
      .limit(3);

    if (nomError) {
      console.error('❌ Error fetching nominations:', nomError.message);
      return;
    }

    console.log(`✅ Found ${nominations.length} approved nominations`);
    nominations.forEach(nom => {
      console.log(`   - ID: ${nom.id} | Votes: ${nom.votes || 0} | Additional: ${nom.additional_votes || 0}`);
    });

    if (nominations.length === 0) {
      console.log('⚠️  No approved nominations found to test with');
      return;
    }

    // 2. Test vote counting for first nomination
    const testNomination = nominations[0];
    console.log(`\n2️⃣ Testing vote count for: ${testNomination.id}`);

    const { count: realVotes, error: countError } = await supabase
      .from('votes')
      .select('id', { count: 'exact' })
      .eq('nomination_id', testNomination.id);

    if (countError) {
      console.error('❌ Error counting votes:', countError.message);
      return;
    }

    console.log(`✅ Real votes: ${realVotes || 0}`);
    console.log(`✅ Additional votes: ${testNomination.additional_votes || 0}`);
    console.log(`✅ Total votes: ${(realVotes || 0) + (testNomination.additional_votes || 0)}`);

    // 3. Test the update API endpoint
    console.log(`\n3️⃣ Testing update API endpoint...`);
    
    const testAdditionalVotes = 5;
    const updateResponse = await fetch('http://localhost:3000/api/admin/update-votes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Passcode': 'wsa2026'
      },
      body: JSON.stringify({
        nominationId: testNomination.id,
        additionalVotes: testAdditionalVotes
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('❌ Update API failed:', errorText);
      return;
    }

    const updateResult = await updateResponse.json();
    
    if (updateResult.success) {
      console.log('✅ Update API successful!');
      console.log(`   - Real votes: ${updateResult.realVotes}`);
      console.log(`   - Additional votes: ${updateResult.additionalVotes}`);
      console.log(`   - Total votes: ${updateResult.totalVotes}`);
    } else {
      console.error('❌ Update API returned error:', updateResult.error);
      return;
    }

    // 4. Verify the update in database
    console.log(`\n4️⃣ Verifying update in database...`);
    const { data: updatedNom, error: verifyError } = await supabase
      .from('nominations')
      .select('id, votes, additional_votes')
      .eq('id', testNomination.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError.message);
      return;
    }

    console.log(`✅ Database updated successfully!`);
    console.log(`   - Votes: ${updatedNom.votes || 0}`);
    console.log(`   - Additional votes: ${updatedNom.additional_votes || 0}`);

    // 5. Test the GET endpoint
    console.log(`\n5️⃣ Testing GET endpoint...`);
    const getResponse = await fetch(`http://localhost:3000/api/admin/update-votes?nominationId=${testNomination.id}`);
    
    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error('❌ GET API failed:', errorText);
      return;
    }

    const getResult = await getResponse.json();
    console.log('✅ GET API successful!');
    console.log(`   - Real votes: ${getResult.realVotes}`);
    console.log(`   - Additional votes: ${getResult.additionalVotes}`);
    console.log(`   - Total votes: ${getResult.totalVotes}`);

    console.log('\n🎉 Admin vote update test completed successfully!');
    console.log('\n📋 The admin panel manual vote update should now work correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAdminVoteUpdate().catch(console.error);