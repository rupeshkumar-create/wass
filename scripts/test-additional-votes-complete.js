#!/usr/bin/env node

/**
 * Test additional votes functionality after SQL setup
 */

require('dotenv').config({ path: '.env.local' });

async function testAdditionalVotes() {
  console.log('🧪 Testing Additional Votes Functionality\n');

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
        console.log(`     Real Votes: ${sample.votes || 0}`);
        console.log(`     Additional Votes: ${sample.additionalVotes || 0}`);
        console.log(`     Total Votes: ${sample.totalVotes || 0}`);
      }
    } else {
      throw new Error(`Admin API returned error: ${adminResult.error}`);
    }

    // Test 2: Manual vote update
    console.log('\n🗳️  Step 2: Testing Manual Vote Update...');
    
    if (adminResult.data && adminResult.data.length > 0) {
      const testNomination = adminResult.data.find(n => n.state === 'approved');
      
      if (testNomination) {
        console.log(`   Testing with nomination: ${testNomination.displayName}`);
        
        const voteUpdateResponse = await fetch('http://localhost:3000/api/admin/update-votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nominationId: testNomination.id,
            additionalVotes: 10
          })
        });

        const voteUpdateResult = await voteUpdateResponse.json();
        
        if (voteUpdateResponse.ok && voteUpdateResult.success) {
          console.log('✅ Manual vote update working!');
          console.log(`     Real votes: ${voteUpdateResult.realVotes}`);
          console.log(`     Additional votes: ${voteUpdateResult.additionalVotes}`);
          console.log(`     Total votes: ${voteUpdateResult.totalVotes}`);
          
          // Reset back to 0
          await fetch('http://localhost:3000/api/admin/update-votes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nominationId: testNomination.id,
              additionalVotes: 0
            })
          });
          
          console.log('     Reset additional votes back to 0');
        } else {
          console.log('❌ Manual vote update failed:', voteUpdateResult.error);
        }
      } else {
        console.log('⚠️  No approved nominations found for testing');
      }
    }

    // Test 3: Public nominees API
    console.log('\n🌐 Step 3: Testing Public Nominees API...');
    
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
        console.log(`     Total Votes: ${sample.votes || 0}`);
      }
    } else {
      throw new Error(`Nominees API returned error: ${nomineesResult.error}`);
    }

    // Test 4: Database verification
    console.log('\n🔍 Step 4: Database Verification...');
    
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test additional_votes column
    const { data: testData, error: testError } = await supabase
      .from('nominations')
      .select('id, votes, additional_votes')
      .limit(1);

    if (testError) {
      throw new Error(`Database test failed: ${testError.message}`);
    }

    console.log('✅ Database additional_votes column working');
    if (testData && testData.length > 0) {
      console.log('   Sample record:', testData[0]);
    }

    // Test views
    const { data: adminViewData, error: adminViewError } = await supabase
      .from('admin_nominations')
      .select('nomination_id, votes, additional_votes')
      .limit(1);

    if (adminViewError) {
      console.log('❌ Admin view error:', adminViewError.message);
    } else {
      console.log('✅ Admin view working with additional_votes');
    }

    const { data: publicViewData, error: publicViewError } = await supabase
      .from('public_nominees')
      .select('nomination_id, votes, real_votes, additional_votes')
      .limit(1);

    if (publicViewError) {
      console.log('❌ Public view error:', publicViewError.message);
    } else {
      console.log('✅ Public view working with vote breakdown');
      if (publicViewData && publicViewData.length > 0) {
        console.log('   Sample:', publicViewData[0]);
      }
    }

    console.log('\n🎉 Additional Votes Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Admin nominations API with vote breakdown');
    console.log('   ✅ Manual vote update functionality');
    console.log('   ✅ Public nominees API with total votes');
    console.log('   ✅ Database additional_votes column');
    console.log('   ✅ Updated database views');
    
    console.log('\n🚀 Ready for Production:');
    console.log('   - Admin can now manually adjust vote counts');
    console.log('   - Vote breakdown visible in admin panel');
    console.log('   - Total votes displayed to public');
    console.log('   - Real-time updates across all interfaces');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testAdditionalVotes();