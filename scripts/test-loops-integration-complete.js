#!/usr/bin/env node

/**
 * Comprehensive Loops Integration Test
 * Tests the complete workflow:
 * 1. Form submission → Nominator sync with "Nominator 2026" tag
 * 2. Admin approval → Nominee sync with "Nominess" tag + Nominator update to "Nominator Live"
 * 3. Vote casting → Voter sync with "Voters 2026" tag
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testLoopsIntegration() {
  console.log('🧪 COMPREHENSIVE LOOPS INTEGRATION TEST');
  console.log('=====================================');
  
  // Check configuration
  console.log('\n1. Configuration Check');
  console.log('----------------------');
  console.log('LOOPS_API_KEY:', process.env.LOOPS_API_KEY ? '✅ Configured' : '❌ Missing');
  console.log('LOOPS_SYNC_ENABLED:', process.env.LOOPS_SYNC_ENABLED);
  
  if (!process.env.LOOPS_API_KEY) {
    console.error('❌ LOOPS_API_KEY is required');
    return;
  }

  // Test Loops connection
  console.log('\n2. Testing Loops Connection');
  console.log('---------------------------');
  try {
    // Test with a simple contact creation to verify API key
    const testContact = {
      email: 'test-connection@example.com',
      firstName: 'Test',
      lastName: 'Connection',
      source: 'API Test'
    };
    
    const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testContact)
    });
    
    if (response.ok || response.status === 409) { // 409 means contact already exists, which is fine
      console.log('✅ Loops API connection successful');
    } else {
      const errorText = await response.text();
      console.error('❌ Loops API connection failed:', response.status, response.statusText);
      console.error('   Error details:', errorText);
      return;
    }
  } catch (error) {
    console.error('❌ Loops API connection error:', error.message);
    return;
  }

  // Test data
  const testData = {
    nominator: {
      firstname: 'John',
      lastname: 'Doe',
      email: 'john.doe.loops.test@example.com',
      linkedin: 'https://linkedin.com/in/johndoe',
      company: 'Test Company',
      jobTitle: 'Test Manager',
      phone: '+1234567890',
      country: 'United States'
    },
    nominee: {
      firstname: 'Jane',
      lastname: 'Smith',
      email: 'jane.smith.loops.test@example.com',
      linkedin: 'https://linkedin.com/in/janesmith',
      jobtitle: 'Senior Developer',
      company: 'Tech Corp',
      phone: '+1987654321',
      country: 'Canada',
      headshotUrl: 'https://example.com/headshot.jpg',
      whyMe: 'Excellent developer with 10+ years experience',
      bio: 'Experienced developer',
      achievements: 'Multiple awards'
    },
    voter: {
      firstname: 'Bob',
      lastname: 'Wilson',
      email: 'bob.wilson.loops.test@example.com',
      linkedin: 'https://linkedin.com/in/bobwilson',
      company: 'Voting Corp',
      jobTitle: 'Voter Manager',
      country: 'United Kingdom'
    },
    subcategoryId: 'test-category-loops',
    categoryGroupId: 'test-group-loops'
  };

  // Step 1: Test nomination submission (should sync nominator)
  console.log('\n3. Testing Nomination Submission');
  console.log('--------------------------------');
  
  const nominationPayload = {
    nominator: testData.nominator,
    nominee: testData.nominee,
    type: 'person',
    subcategoryId: testData.subcategoryId,
    categoryGroupId: testData.categoryGroupId
  };

  try {
    const submitResponse = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nominationPayload)
    });

    if (submitResponse.ok) {
      const submitResult = await submitResponse.json();
      console.log('✅ Nomination submitted successfully');
      console.log('   Nomination ID:', submitResult.nominationId);
      console.log('   Nominator Loops sync:', submitResult.loopsSync?.nominatorSynced ? '✅' : '❌');
      
      testData.nominationId = submitResult.nominationId;
      testData.nominatorId = submitResult.nominatorId;
      testData.nomineeId = submitResult.nomineeId;
    } else {
      const error = await submitResponse.text();
      console.error('❌ Nomination submission failed:', error);
      return;
    }
  } catch (error) {
    console.error('❌ Nomination submission error:', error.message);
    return;
  }

  // Wait a moment for async processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 2: Test nomination approval (should sync nominee and update nominator)
  console.log('\n4. Testing Nomination Approval');
  console.log('------------------------------');
  
  const liveUrl = `https://worldstaffingawards.com/nominee/${testData.nominationId}`;
  
  try {
    const approveResponse = await fetch('http://localhost:3000/api/nomination/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nominationId: testData.nominationId,
        action: 'approve',
        liveUrl: liveUrl,
        adminNotes: 'Approved for Loops testing'
      })
    });

    if (approveResponse.ok) {
      const approveResult = await approveResponse.json();
      console.log('✅ Nomination approved successfully');
      console.log('   Live URL:', approveResult.liveUrl);
      console.log('   State:', approveResult.state);
    } else {
      const error = await approveResponse.text();
      console.error('❌ Nomination approval failed:', error);
      return;
    }
  } catch (error) {
    console.error('❌ Nomination approval error:', error.message);
    return;
  }

  // Wait a moment for async processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3: Test vote casting (should sync voter)
  console.log('\n5. Testing Vote Casting');
  console.log('-----------------------');
  
  const votePayload = {
    ...testData.voter,
    subcategoryId: testData.subcategoryId,
    votedForDisplayName: `${testData.nominee.firstname} ${testData.nominee.lastname}`
  };

  try {
    const voteResponse = await fetch('http://localhost:3000/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(votePayload)
    });

    if (voteResponse.ok) {
      const voteResult = await voteResponse.json();
      console.log('✅ Vote cast successfully');
      console.log('   Vote ID:', voteResult.voteId);
      console.log('   New vote count:', voteResult.newVoteCount);
    } else {
      const error = await voteResponse.text();
      console.error('❌ Vote casting failed:', error);
      return;
    }
  } catch (error) {
    console.error('❌ Vote casting error:', error.message);
    return;
  }

  // Wait a moment for async processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 4: Check Loops outbox status
  console.log('\n6. Checking Loops Outbox');
  console.log('------------------------');
  
  try {
    const { data: outboxItems, error } = await supabase
      .from('loops_outbox')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    console.log(`📋 Found ${outboxItems.length} recent Loops outbox items:`);
    outboxItems.forEach(item => {
      console.log(`   ${item.event_type}: ${item.status} (${item.attempt_count} attempts)`);
      if (item.last_error) {
        console.log(`     Error: ${item.last_error}`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to check Loops outbox:', error.message);
  }

  // Step 5: Test manual sync endpoint
  console.log('\n7. Testing Manual Loops Sync');
  console.log('----------------------------');
  
  try {
    const syncResponse = await fetch('http://localhost:3000/api/sync/loops/run', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    });

    if (syncResponse.ok) {
      const syncResult = await syncResponse.json();
      console.log('✅ Manual sync completed');
      console.log('   Processed:', syncResult.processed);
      console.log('   Errors:', syncResult.errors);
      console.log('   Total:', syncResult.total);
    } else {
      const error = await syncResponse.text();
      console.error('❌ Manual sync failed:', error);
    }
  } catch (error) {
    console.error('❌ Manual sync error:', error.message);
  }

  // Step 6: Check sync status
  console.log('\n8. Checking Loops Sync Status');
  console.log('-----------------------------');
  
  try {
    const statusResponse = await fetch('http://localhost:3000/api/sync/loops/run');
    
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('✅ Loops sync status:');
      console.log('   Enabled:', status.enabled);
      console.log('   Connection:', status.connection);
      console.log('   API Key configured:', status.apiKeyConfigured);
      console.log('   Outbox stats:', JSON.stringify(status.outboxStats, null, 2));
    } else {
      console.error('❌ Failed to get sync status');
    }
  } catch (error) {
    console.error('❌ Sync status error:', error.message);
  }

  // Step 7: Verify contacts in Loops (optional manual verification)
  console.log('\n9. Manual Verification Steps');
  console.log('----------------------------');
  console.log('🔍 To verify the integration worked correctly, check your Loops dashboard for:');
  console.log('');
  console.log('📧 Nominator Contact:');
  console.log(`   Email: ${testData.nominator.email}`);
  console.log('   Expected user groups: "Nominator" → "Nominator Live"');
  console.log('   Should have nominee live URL after approval');
  console.log('');
  console.log('📧 Nominee Contact:');
  console.log(`   Email: ${testData.nominee.email}`);
  console.log('   Expected user groups: "Nominess"');
  console.log('   Should have live URL after approval');
  console.log('');
  console.log('📧 Voter Contact:');
  console.log(`   Email: ${testData.voter.email}`);
  console.log('   Expected user groups: "Voters"');
  console.log('   Should have voting information');

  console.log('\n🎉 LOOPS INTEGRATION TEST COMPLETED!');
  console.log('====================================');
  console.log('');
  console.log('✅ What should have happened:');
  console.log('   1. Nominator synced with "Nominator" user group on submission');
  console.log('   2. Nominee synced with "Nominess" user group on approval');
  console.log('   3. Nominator updated to "Nominator Live" user group with nominee link');
  console.log('   4. Voter synced with "Voters" user group on vote');
  console.log('');
  console.log('🔍 Check your Loops dashboard to verify all contacts were created with correct user groups!');
}

// Run the test
testLoopsIntegration().catch(console.error);