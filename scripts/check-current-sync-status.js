#!/usr/bin/env node

/**
 * Check Current Sync Status
 * Verify what's in the outbox and test basic HubSpot connectivity
 */

require('dotenv').config({ path: '.env.local' });

async function checkCurrentSyncStatus() {
  console.log('🔍 Checking Current HubSpot Sync Status...\n');
  
  // Test 1: Check Supabase outbox
  console.log('1️⃣ Checking Supabase outbox...');
  
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  
  try {
    const { data: outboxItems, error } = await supabase
      .from('hubspot_outbox')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log('❌ Supabase error:', error.message);
    } else {
      console.log(`✅ Found ${outboxItems.length} items in outbox`);
      
      const statusCounts = {};
      outboxItems.forEach(item => {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
      });
      
      console.log('   Status breakdown:', statusCounts);
      
      if (outboxItems.length > 0) {
        console.log('   Recent items:');
        outboxItems.slice(0, 3).forEach((item, i) => {
          console.log(`     ${i + 1}. ${item.event_type} - ${item.status} (${item.created_at})`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Supabase connection error:', error.message);
  }
  
  // Test 2: Test HubSpot API directly
  console.log('\n2️⃣ Testing HubSpot API directly...');
  
  const token = process.env.HUBSPOT_TOKEN;
  
  if (!token) {
    console.log('❌ HUBSPOT_TOKEN not found');
    return;
  }
  
  try {
    // Test basic contact creation
    const testContact = {
      properties: {
        email: `sync-test-${Date.now()}@example.com`,
        firstname: 'SyncTest',
        lastname: 'User',
        company: 'Test Company'
      }
    };
    
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testContact)
    });
    
    if (response.ok) {
      const contact = await response.json();
      console.log('✅ HubSpot API working - created contact:', contact.id);
    } else {
      const error = await response.json();
      console.log('❌ HubSpot API error:', error);
    }
  } catch (error) {
    console.log('❌ HubSpot API connection error:', error.message);
  }
  
  // Test 3: Test our vote sync endpoint (we know this works)
  console.log('\n3️⃣ Testing vote sync endpoint...');
  
  try {
    const votePayload = {
      voter: {
        email: `status-test-voter-${Date.now()}@example.com`,
        firstName: 'StatusTest',
        lastName: 'Voter',
        company: 'Status Test Company',
        linkedin: 'https://linkedin.com/in/status-test-voter'
      },
      nominee: {
        id: 'status-test-nominee-id',
        name: 'StatusTest Nominee',
        type: 'person',
        linkedin: 'https://linkedin.com/in/status-test-nominee'
      },
      category: 'status-test-category',
      subcategoryId: 'status-test-subcategory'
    };
    
    const response = await fetch('http://localhost:3000/api/sync/hubspot/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(votePayload)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Vote sync endpoint working');
      console.log(`   Created voter contact: ${result.voterContact?.id}`);
    } else {
      const error = await response.json();
      console.log('❌ Vote sync endpoint error:', error);
    }
  } catch (error) {
    console.log('❌ Vote sync endpoint connection error:', error.message);
  }
  
  // Test 4: Check recent nominations
  console.log('\n4️⃣ Checking recent nominations...');
  
  try {
    const { data: nominations, error } = await supabase
      .from('nominations')
      .select('id, status, votes, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.log('❌ Nominations query error:', error.message);
    } else {
      console.log(`✅ Found ${nominations.length} recent nominations`);
      nominations.forEach((nom, i) => {
        console.log(`   ${i + 1}. ${nom.id} - ${nom.status} (${nom.votes} votes)`);
      });
    }
  } catch (error) {
    console.log('❌ Nominations check error:', error.message);
  }
  
  console.log('\n📊 Summary:');
  console.log('   - Check outbox items and their status');
  console.log('   - Verify HubSpot API connectivity');
  console.log('   - Test working vote sync endpoint');
  console.log('   - Review recent nomination activity');
  
  console.log('\n💡 Next Steps:');
  console.log('   - If outbox has pending items, they need processing');
  console.log('   - Vote sync is working, focus on that flow');
  console.log('   - Nomination sync may need pipeline fixes');
}

checkCurrentSyncStatus();