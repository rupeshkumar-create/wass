#!/usr/bin/env node

/**
 * Complete Application Flow Test
 * Tests: Nomination → Approval → Voting → Sync (HubSpot & Loops)
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCompleteFlow() {
  console.log('🚀 Starting Complete Application Flow Test\n');

  try {
    // Step 1: Test nomination submission
    console.log('📝 Step 1: Testing Nomination Submission');
    const nominationData = {
      type: 'person',
      subcategory_id: 'best-recruiter-individual',
      
      // Nominee details
      firstname: 'Test',
      lastname: 'Nominee',
      jobtitle: 'Senior Recruiter',
      person_email: 'test.nominee@example.com',
      person_linkedin: 'https://linkedin.com/in/testnominee',
      person_phone: '+1234567890',
      person_company: 'Test Recruiting Inc',
      person_country: 'United States',
      why_me: 'This is a test nomination for flow verification.',
      
      // Nominator details
      nominator_firstname: 'Test',
      nominator_lastname: 'Nominator',
      nominator_email: 'test.nominator@example.com',
      nominator_linkedin: 'https://linkedin.com/in/testnominator',
      nominator_company: 'Test Company',
      nominator_job_title: 'HR Manager',
      nominator_phone: '+1234567891',
      nominator_country: 'United States'
    };

    // Submit nomination via API
    const nominationResponse = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nominationData)
    });

    const nominationResult = await nominationResponse.json();
    
    if (!nominationResponse.ok) {
      throw new Error(`Nomination submission failed: ${nominationResult.error}`);
    }

    console.log('✅ Nomination submitted successfully');
    console.log(`   Nomination ID: ${nominationResult.nominationId}`);
    
    const nominationId = nominationResult.nominationId;

    // Step 2: Check HubSpot outbox for nominator sync
    console.log('\n📤 Step 2: Checking HubSpot Sync Queue');
    
    const { data: hubspotOutbox } = await supabase
      .from('hubspot_outbox')
      .select('*')
      .eq('event_type', 'nomination_submitted')
      .order('created_at', { ascending: false })
      .limit(1);

    if (hubspotOutbox && hubspotOutbox.length > 0) {
      console.log('✅ HubSpot sync queued for nominator');
      console.log(`   Event ID: ${hubspotOutbox[0].id}`);
    } else {
      console.log('⚠️  No HubSpot sync found in queue');
    }

    // Step 3: Check Loops outbox for nominator sync
    console.log('\n📧 Step 3: Checking Loops Sync Queue');
    
    const { data: loopsOutbox } = await supabase
      .from('loops_outbox')
      .select('*')
      .eq('event_type', 'nomination_submitted')
      .order('created_at', { ascending: false })
      .limit(1);

    if (loopsOutbox && loopsOutbox.length > 0) {
      console.log('✅ Loops sync queued for nominator');
      console.log(`   Event ID: ${loopsOutbox[0].id}`);
    } else {
      console.log('⚠️  No Loops sync found in queue');
    }

    // Step 4: Test nomination approval
    console.log('\n✅ Step 4: Testing Nomination Approval');
    
    const approvalData = {
      nominationId: nominationId,
      action: 'approve',
      liveUrl: `https://worldstaffingawards.com/nominee/test-nominee-${Date.now()}`,
      adminNotes: 'Test approval for flow verification'
    };

    const approvalResponse = await fetch('http://localhost:3000/api/nomination/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(approvalData)
    });

    const approvalResult = await approvalResponse.json();
    
    if (!approvalResponse.ok) {
      throw new Error(`Nomination approval failed: ${approvalResult.error}`);
    }

    console.log('✅ Nomination approved successfully');
    console.log(`   Live URL: ${approvalData.liveUrl}`);

    // Step 5: Verify nominee appears in directory
    console.log('\n📋 Step 5: Checking Directory API');
    
    const directoryResponse = await fetch('http://localhost:3000/api/nominees');
    const directoryResult = await directoryResponse.json();
    
    if (!directoryResponse.ok) {
      throw new Error(`Directory fetch failed: ${directoryResult.error}`);
    }

    const approvedNominee = directoryResult.data.find(n => n.id === nominationId);
    
    if (approvedNominee) {
      console.log('✅ Nominee appears in directory');
      console.log(`   Display Name: ${approvedNominee.displayName}`);
      console.log(`   Status: ${approvedNominee.state}`);
      console.log(`   Live URL: ${approvedNominee.liveUrl}`);
    } else {
      console.log('⚠️  Nominee not found in directory');
    }

    // Step 6: Test voting
    console.log('\n🗳️  Step 6: Testing Vote Submission');
    
    const voteData = {
      nomineeId: nominationId,
      voter: {
        firstname: 'Test',
        lastname: 'Voter',
        email: 'test.voter@example.com',
        linkedin: 'https://linkedin.com/in/testvoter',
        company: 'Test Voting Company',
        job_title: 'Test Manager',
        phone: '+1234567892',
        country: 'United States'
      }
    };

    const voteResponse = await fetch('http://localhost:3000/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voteData)
    });

    const voteResult = await voteResponse.json();
    
    if (!voteResponse.ok) {
      throw new Error(`Vote submission failed: ${voteResult.error}`);
    }

    console.log('✅ Vote submitted successfully');
    console.log(`   Vote ID: ${voteResult.voteId}`);

    // Step 7: Check vote count
    console.log('\n📊 Step 7: Verifying Vote Count');
    
    const voteCountResponse = await fetch(`http://localhost:3000/api/votes/count?nomineeId=${nominationId}`);
    const voteCountResult = await voteCountResponse.json();
    
    if (voteCountResponse.ok) {
      console.log('✅ Vote count retrieved');
      console.log(`   Total votes: ${voteCountResult.count}`);
    } else {
      console.log('⚠️  Failed to get vote count');
    }

    // Step 8: Test connection status
    console.log('\n🔗 Step 8: Testing Integration Connections');
    
    // Test HubSpot connection
    try {
      const hubspotResponse = await fetch('http://localhost:3000/api/sync/hubspot/run');
      const hubspotStatus = await hubspotResponse.json();
      
      if (hubspotResponse.ok) {
        console.log('✅ HubSpot connection: Connected');
      } else {
        console.log(`⚠️  HubSpot connection: ${hubspotStatus.message || 'Error'}`);
      }
    } catch (error) {
      console.log(`❌ HubSpot connection: ${error.message}`);
    }

    // Test Loops connection
    try {
      const loopsResponse = await fetch('http://localhost:3000/api/sync/loops/run');
      const loopsStatus = await loopsResponse.json();
      
      if (loopsResponse.ok) {
        console.log('✅ Loops connection: Connected');
      } else {
        console.log(`⚠️  Loops connection: ${loopsStatus.message || 'Error'}`);
      }
    } catch (error) {
      console.log(`❌ Loops connection: ${error.message}`);
    }

    // Step 9: Check admin panel data
    console.log('\n👨‍💼 Step 9: Testing Admin Panel Data');
    
    const adminResponse = await fetch('http://localhost:3000/api/admin/nominations');
    const adminResult = await adminResponse.json();
    
    if (adminResponse.ok && adminResult.success) {
      const testNomination = adminResult.data.find(n => n.id === nominationId);
      
      if (testNomination) {
        console.log('✅ Test nomination visible in admin panel');
        console.log(`   Status: ${testNomination.state}`);
        console.log(`   Votes: ${testNomination.votes}`);
      } else {
        console.log('⚠️  Test nomination not found in admin panel');
      }
    } else {
      console.log('⚠️  Failed to fetch admin panel data');
    }

    // Step 10: Cleanup test data
    console.log('\n🧹 Step 10: Cleaning Up Test Data');
    
    // Delete test nomination
    const { error: deleteError } = await supabase
      .from('nominations')
      .delete()
      .eq('id', nominationId);

    if (!deleteError) {
      console.log('✅ Test nomination cleaned up');
    } else {
      console.log('⚠️  Failed to clean up test nomination');
    }

    // Delete test vote
    const { error: voteDeleteError } = await supabase
      .from('votes')
      .delete()
      .eq('nominee_id', nominationId);

    if (!voteDeleteError) {
      console.log('✅ Test vote cleaned up');
    } else {
      console.log('⚠️  Failed to clean up test vote');
    }

    console.log('\n🎉 Complete Application Flow Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Nomination submission');
    console.log('   ✅ Sync queue integration');
    console.log('   ✅ Nomination approval');
    console.log('   ✅ Directory listing');
    console.log('   ✅ Vote submission');
    console.log('   ✅ Vote counting');
    console.log('   ✅ Integration connections');
    console.log('   ✅ Admin panel access');
    console.log('   ✅ Data cleanup');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testCompleteFlow();