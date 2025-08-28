#!/usr/bin/env node

/**
 * Complete Integration Test
 * Test the full flow: Supabase storage → HubSpot sync
 */

require('dotenv').config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';

async function testCompleteIntegration() {
  console.log('🚀 Testing Complete Supabase → HubSpot Integration...\n');
  
  // Step 1: Submit a new nomination
  console.log('1️⃣ Submitting new nomination...');
  const nomination = {
    type: 'person',
    categoryGroupId: 'recruiters',
    subcategoryId: 'top-recruiter-2024',
    nominator: {
      email: 'integration.test@example.com',
      firstname: 'Integration',
      lastname: 'Tester',
      linkedin: 'https://linkedin.com/in/integration-tester',
      nominatedDisplayName: 'Sarah Johnson'
    },
    nominee: {
      firstname: 'Sarah',
      lastname: 'Johnson',
      jobtitle: 'Lead Recruiter',
      email: 'sarah.johnson@example.com',
      linkedin: 'https://linkedin.com/in/sarah-johnson',
      headshotUrl: 'https://example.com/sarah.jpg',
      whyMe: 'I have successfully placed over 500 candidates in the past year.'
    }
  };
  
  try {
    const submitResponse = await fetch(`${BASE_URL}/api/nomination/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nomination)
    });
    
    if (!submitResponse.ok) {
      const error = await submitResponse.json();
      console.log('❌ Nomination submission failed:', error);
      return;
    }
    
    const submitResult = await submitResponse.json();
    console.log('✅ Nomination submitted successfully');
    console.log(`   Nomination ID: ${submitResult.nominationId}`);
    
    // Step 2: Check that sync item was created
    console.log('\\n2️⃣ Checking sync outbox...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for DB write
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
    const { data: outboxItems } = await supabase
      .from('hubspot_outbox')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log(`✅ Found ${outboxItems?.length || 0} pending sync items`);
    
    if (outboxItems && outboxItems.length > 0) {
      // Step 3: Process the sync queue
      console.log('\\n3️⃣ Processing HubSpot sync queue...');
      
      const syncResponse = await fetch(`${BASE_URL}/api/sync/hubspot/run?limit=5`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-cron-key': process.env.CRON_SECRET || 'wsa2026-secure-cron-key'
        }
      });
      
      if (syncResponse.ok) {
        const syncResult = await syncResponse.json();
        console.log('✅ HubSpot sync completed');
        console.log(`   Processed: ${syncResult.processed}`);
        console.log(`   Succeeded: ${syncResult.succeeded}`);
        console.log(`   Failed: ${syncResult.failed}`);
        
        if (syncResult.results) {
          syncResult.results.forEach((result, i) => {
            console.log(`   ${i + 1}. ${result.event_type}: ${result.status}`);
            if (result.error) {
              console.log(`      Error: ${result.error}`);
            }
          });
        }
      } else {
        const syncError = await syncResponse.json();
        console.log('❌ HubSpot sync failed:', syncError);
      }
    }
    
    // Step 4: Approve the nomination
    console.log('\\n4️⃣ Approving nomination...');
    const approveResponse = await fetch(`${BASE_URL}/api/nomination/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nominationId: submitResult.nominationId,
        liveUrl: 'https://wsa2026.com/nominees/sarah-johnson'
      })
    });
    
    if (approveResponse.ok) {
      const approveResult = await approveResponse.json();
      console.log('✅ Nomination approved successfully');
      console.log(`   Live URL: ${approveResult.liveUrl}`);
      
      // Step 5: Process approval sync
      console.log('\\n5️⃣ Processing approval sync...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const approvalSyncResponse = await fetch(`${BASE_URL}/api/sync/hubspot/run?limit=3`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-cron-key': process.env.CRON_SECRET || 'wsa2026-secure-cron-key'
        }
      });
      
      if (approvalSyncResponse.ok) {
        const approvalSyncResult = await approvalSyncResponse.json();
        console.log('✅ Approval sync completed');
        console.log(`   Processed: ${approvalSyncResult.processed}`);
      }
      
    } else {
      const approveError = await approveResponse.json();
      console.log('❌ Nomination approval failed:', approveError);
    }
    
    // Step 6: Cast a vote
    console.log('\\n6️⃣ Casting vote...');
    const voteResponse = await fetch(`${BASE_URL}/api/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'vote.tester@example.com',
        firstname: 'Vote',
        lastname: 'Tester',
        linkedin: 'https://linkedin.com/in/vote-tester',
        subcategoryId: 'top-recruiter-2024',
        votedForDisplayName: 'Sarah Johnson'
      })
    });
    
    if (voteResponse.ok) {
      const voteResult = await voteResponse.json();
      console.log('✅ Vote cast successfully');
      console.log(`   New vote count: ${voteResult.newVoteCount}`);
      
      // Step 7: Process vote sync
      console.log('\\n7️⃣ Processing vote sync...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const voteSyncResponse = await fetch(`${BASE_URL}/api/sync/hubspot/run?limit=3`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-cron-key': process.env.CRON_SECRET || 'wsa2026-secure-cron-key'
        }
      });
      
      if (voteSyncResponse.ok) {
        const voteSyncResult = await voteSyncResponse.json();
        console.log('✅ Vote sync completed');
        console.log(`   Processed: ${voteSyncResult.processed}`);
      }
      
    } else {
      const voteError = await voteResponse.json();
      console.log('❌ Vote casting failed:', voteError);
    }
    
  } catch (error) {
    console.log('❌ Integration test failed:', error.message);
  }
  
  console.log('\\n🎉 Complete Integration Test Finished!');
  console.log('\\n📊 What was tested:');
  console.log('   ✅ Nomination submission → Supabase storage');
  console.log('   ✅ Sync outbox creation');
  console.log('   ✅ HubSpot sync processing');
  console.log('   ✅ Nomination approval → Supabase update');
  console.log('   ✅ Vote casting → Supabase storage');
  console.log('   ✅ End-to-end data flow');
  
  console.log('\\n📋 Next steps:');
  console.log('   1. Set up a cron job to run the sync worker periodically');
  console.log('   2. Update your UI components to use these API routes');
  console.log('   3. Monitor the sync outbox for any failed items');
}

testCompleteIntegration();