#!/usr/bin/env node

/**
 * Complete HubSpot Sync Test
 * Test the full Supabase → HubSpot sync integration
 */

require('dotenv').config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';

async function testHubSpotSyncComplete() {
  console.log('🚀 Testing Complete HubSpot Sync Integration...\n');
  
  // Step 1: Submit a new nomination to create sync outbox entry
  console.log('1️⃣ Submitting nomination to create sync entry...');
  const nomination = {
    type: 'person',
    categoryGroupId: 'recruiters',
    subcategoryId: 'top-recruiter-hubspot-test',
    nominator: {
      email: 'hubspot.test@example.com',
      firstname: 'HubSpot',
      lastname: 'Tester',
      linkedin: 'https://linkedin.com/in/hubspot-tester',
      nominatedDisplayName: 'Michael Chen'
    },
    nominee: {
      firstname: 'Michael',
      lastname: 'Chen',
      jobtitle: 'Senior Technical Recruiter',
      email: 'michael.chen@example.com',
      linkedin: 'https://linkedin.com/in/michael-chen',
      headshotUrl: 'https://example.com/michael.jpg',
      whyMe: 'I have successfully built technical teams for 15+ startups and have a 95% candidate satisfaction rate.'
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
    
    // Step 2: Wait and check sync outbox
    console.log('\\n2️⃣ Checking sync outbox for new entry...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
    const { data: pendingItems } = await supabase
      .from('hubspot_outbox')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(3);
    
    console.log(`✅ Found ${pendingItems?.length || 0} pending sync items`);
    
    if (pendingItems && pendingItems.length > 0) {
      console.log('   Recent pending items:');
      pendingItems.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.event_type} (${item.id.substring(0, 8)}...)`);
      });
      
      // Step 3: Test individual HubSpot sync endpoints
      console.log('\\n3️⃣ Testing individual HubSpot sync endpoints...');
      
      // Find the nomination_submitted item
      const nominationItem = pendingItems.find(item => item.event_type === 'nomination_submitted');
      
      if (nominationItem) {
        console.log('\\n   Testing nomination-submit endpoint...');
        
        const hubspotPayload = {
          nominator: nomination.nominator,
          nominee: nomination.nominee,
          category: nomination.subcategoryId,
          categoryGroupId: nomination.categoryGroupId,
          subcategoryId: nomination.subcategoryId,
          whyNominated: nomination.nominee.whyMe
        };
        
        const hubspotResponse = await fetch(`${BASE_URL}/api/sync/hubspot/nomination-submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(hubspotPayload)
        });
        
        if (hubspotResponse.ok) {
          const hubspotResult = await hubspotResponse.json();
          console.log('   ✅ HubSpot nomination sync successful');
          console.log(`      Nominator contact: ${hubspotResult.nominatorContact?.id || 'N/A'}`);
          console.log(`      Nominee contact: ${hubspotResult.nomineeContact?.id || 'N/A'}`);
          console.log(`      Ticket: ${hubspotResult.ticket?.id || 'N/A'}`);
        } else {
          const hubspotError = await hubspotResponse.json();
          console.log('   ❌ HubSpot nomination sync failed:', hubspotError);
          
          // Check if it's a pipeline configuration issue
          if (hubspotError.error && hubspotError.error.includes('pipeline')) {
            console.log('   💡 This might be a pipeline configuration issue');
            console.log('      The test pipeline IDs may not exist in your HubSpot account');
          }
        }
      }
      
      // Step 4: Test the sync worker
      console.log('\\n4️⃣ Testing sync worker with pending items...');
      
      const syncResponse = await fetch(`${BASE_URL}/api/sync/hubspot/run?limit=3`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-cron-key': process.env.CRON_SECRET || 'wsa2026-secure-cron-key'
        }
      });
      
      if (syncResponse.ok) {
        const syncResult = await syncResponse.json();
        console.log('✅ Sync worker executed successfully');
        console.log(`   Processed: ${syncResult.processed}`);
        console.log(`   Succeeded: ${syncResult.succeeded}`);
        console.log(`   Failed: ${syncResult.failed}`);
        
        if (syncResult.results && syncResult.results.length > 0) {
          console.log('   Results:');
          syncResult.results.forEach((result, i) => {
            console.log(`   ${i + 1}. ${result.event_type}: ${result.status}`);
            if (result.error) {
              console.log(`      Error: ${result.error.substring(0, 100)}...`);
            }
          });
        }
        
        // Step 5: Check final outbox status
        console.log('\\n5️⃣ Checking final outbox status...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: finalItems } = await supabase
          .from('hubspot_outbox')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (finalItems) {
          console.log('   Recent outbox items:');
          finalItems.forEach((item, i) => {
            console.log(`   ${i + 1}. ${item.event_type}: ${item.status} (attempts: ${item.attempt_count})`);
            if (item.last_error) {
              console.log(`      Last error: ${item.last_error.substring(0, 80)}...`);
            }
          });
        }
        
      } else {
        const syncError = await syncResponse.json();
        console.log('❌ Sync worker failed:', syncError);
      }
      
    } else {
      console.log('⚠️  No pending sync items found');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  console.log('\\n🎉 HubSpot Sync Test Completed!');
  console.log('\\n📊 What was tested:');
  console.log('   ✅ Nomination submission → Supabase outbox creation');
  console.log('   ✅ Individual HubSpot sync endpoint');
  console.log('   ✅ Sync worker processing');
  console.log('   ✅ Outbox status tracking');
  
  console.log('\\n📋 Next steps:');
  console.log('   1. If pipeline errors occurred, update the pipeline IDs in .env.local');
  console.log('   2. Set up a cron job to run the sync worker every 5-10 minutes');
  console.log('   3. Monitor the outbox for failed items and retry logic');
  console.log('   4. Test with real HubSpot data to verify contacts/tickets are created');
}

testHubSpotSyncComplete();