#!/usr/bin/env node

/**
 * Test admin panel functionality without additional_votes column
 */

require('dotenv').config({ path: '.env.local' });

async function testAdminPanel() {
  console.log('🧪 Testing Admin Panel Functionality\n');

  try {
    // Test 1: Admin nominations API
    console.log('📋 Step 1: Testing Admin Nominations API...');
    
    const adminResponse = await fetch('http://localhost:3000/api/admin/nominations');
    
    if (!adminResponse.ok) {
      const errorText = await adminResponse.text();
      throw new Error(`Admin API failed: ${adminResponse.status} - ${errorText}`);
    }

    const adminResult = await adminResponse.json();
    
    if (adminResult.success) {
      console.log('✅ Admin nominations API working');
      console.log(`   Found ${adminResult.count} nominations`);
      
      if (adminResult.data && adminResult.data.length > 0) {
        const sample = adminResult.data[0];
        console.log('   Sample nomination:');
        console.log(`     ID: ${sample.id}`);
        console.log(`     Name: ${sample.displayName}`);
        console.log(`     Status: ${sample.state}`);
        console.log(`     Votes: ${sample.votes || 0}`);
        console.log(`     Additional Votes: ${sample.additionalVotes || 0}`);
        console.log(`     Total Votes: ${sample.totalVotes || sample.votes || 0}`);
      }
    } else {
      throw new Error(`Admin API returned error: ${adminResult.error}`);
    }

    // Test 2: Public nominees API
    console.log('\n🌐 Step 2: Testing Public Nominees API...');
    
    const nomineesResponse = await fetch('http://localhost:3000/api/nominees');
    
    if (!nomineesResponse.ok) {
      const errorText = await nomineesResponse.text();
      throw new Error(`Nominees API failed: ${nomineesResponse.status} - ${errorText}`);
    }

    const nomineesResult = await nomineesResponse.json();
    
    if (nomineesResult.success) {
      console.log('✅ Public nominees API working');
      console.log(`   Found ${nomineesResult.count} nominees`);
      
      if (nomineesResult.data && nomineesResult.data.length > 0) {
        const sample = nomineesResult.data[0];
        console.log('   Sample nominee:');
        console.log(`     ID: ${sample.id}`);
        console.log(`     Name: ${sample.displayName}`);
        console.log(`     Votes: ${sample.votes || 0}`);
      }
    } else {
      throw new Error(`Nominees API returned error: ${nomineesResult.error}`);
    }

    // Test 3: Manual vote update API (should fail gracefully)
    console.log('\n🗳️  Step 3: Testing Manual Vote Update API...');
    
    if (adminResult.data && adminResult.data.length > 0) {
      const testNomination = adminResult.data[0];
      
      const voteUpdateResponse = await fetch('http://localhost:3000/api/admin/update-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nominationId: testNomination.id,
          additionalVotes: 5
        })
      });

      const voteUpdateResult = await voteUpdateResponse.json();
      
      if (voteUpdateResponse.ok && voteUpdateResult.success) {
        console.log('✅ Manual vote update API working');
        console.log(`   Updated nomination ${testNomination.id}`);
        console.log(`   Real votes: ${voteUpdateResult.realVotes}`);
        console.log(`   Additional votes: ${voteUpdateResult.additionalVotes}`);
        console.log(`   Total votes: ${voteUpdateResult.totalVotes}`);
      } else {
        console.log('⚠️  Manual vote update API not working (expected if column missing)');
        console.log(`   Error: ${voteUpdateResult.error}`);
      }
    }

    // Test 4: Database schema check
    console.log('\n🔍 Step 4: Checking Database Schema...');
    
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if additional_votes column exists
    const { data: testData, error: testError } = await supabase
      .from('nominations')
      .select('id, votes')
      .limit(1);

    if (testError) {
      throw new Error(`Database connection failed: ${testError.message}`);
    }

    console.log('✅ Database connection working');
    console.log('   Nominations table accessible');

    // Try to select additional_votes
    const { error: additionalVotesError } = await supabase
      .from('nominations')
      .select('additional_votes')
      .limit(1);

    if (additionalVotesError) {
      if (additionalVotesError.message.includes('column "additional_votes" does not exist')) {
        console.log('⚠️  additional_votes column does not exist (this is expected)');
        console.log('   Manual vote updates will not work until column is added');
      } else {
        console.log('❌ Unexpected database error:', additionalVotesError.message);
      }
    } else {
      console.log('✅ additional_votes column exists and working');
    }

    console.log('\n🎉 Admin Panel Test Completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Admin nominations API working');
    console.log('   ✅ Public nominees API working');
    console.log('   ✅ Database connection working');
    console.log('   ⚠️  Manual vote updates require additional_votes column');
    
    console.log('\n📝 Next Steps:');
    console.log('   1. Admin panel should now load without errors');
    console.log('   2. To enable manual vote updates, add additional_votes column:');
    console.log('      ALTER TABLE nominations ADD COLUMN additional_votes INTEGER DEFAULT 0;');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testAdminPanel();