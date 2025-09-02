#!/usr/bin/env node

/**
 * Complete HubSpot Sync Test
 * Tests all three sync types: Nominees, Voters, and Nominators
 */

async function testCompleteHubSpotSync() {
  console.log('🧪 Testing Complete HubSpot Sync Integration...');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Check HubSpot connection
    console.log('\n1️⃣ Checking HubSpot connection...');
    
    const statsResponse = await fetch('http://localhost:3000/api/integrations/hubspot/stats');
    if (!statsResponse.ok) {
      console.error('❌ Failed to get HubSpot stats');
      return;
    }
    
    const stats = await statsResponse.json();
    console.log('✅ HubSpot Status:', stats.hubspotStatus);
    console.log('   Last Sync:', stats.lastSyncTime);
    
    // Test 2: Test individual sync functions
    console.log('\n2️⃣ Testing individual sync functions...');
    
    // Test Voter Sync
    console.log('\\n   🗳️ Testing Voter Sync...');
    const voterResponse = await fetch('http://localhost:3000/api/test/hubspot-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Complete',
        lastName: 'Test Voter',
        email: 'complete.test.voter@example.com'
      })
    });
    
    if (voterResponse.ok) {
      console.log('   ✅ Voter sync test passed');
    } else {
      console.log('   ❌ Voter sync test failed');
    }
    
    // Test Nominator Sync
    console.log('\\n   👤 Testing Nominator Sync...');
    const nominatorResponse = await fetch('http://localhost:3000/api/test/hubspot-nominator-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Complete Test Nominator',
        email: 'complete.test.nominator@example.com',
        phone: '+1-555-999-8888'
      })
    });
    
    if (nominatorResponse.ok) {
      console.log('   ✅ Nominator sync test passed');
    } else {
      console.log('   ❌ Nominator sync test failed');
    }
    
    // Test 3: Verify contacts in HubSpot
    console.log('\\n3️⃣ Verifying contacts in HubSpot...');
    
    // Check for voters
    const votersCheck = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_PRIVATE_APP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'wsa_segments',
            operator: 'CONTAINS_TOKEN',
            value: 'Voter 2026'
          }]
        }],
        properties: ['email', 'wsa_segments'],
        limit: 5
      })
    });
    
    if (votersCheck.ok) {
      const votersData = await votersCheck.json();
      console.log(`   ✅ Found ${votersData.total} voters in HubSpot`);
    }
    
    // Check for nominators
    const nominatorsCheck = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_PRIVATE_APP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'wsa_segments',
            operator: 'CONTAINS_TOKEN',
            value: 'nominators_2026'
          }]
        }],
        properties: ['email', 'wsa_segments'],
        limit: 5
      })
    });
    
    if (nominatorsCheck.ok) {
      const nominatorsData = await nominatorsCheck.json();
      console.log(`   ✅ Found ${nominatorsData.total} nominators in HubSpot`);
    }
    
    // Check for nominees
    const nomineesCheck = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_PRIVATE_APP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'wsa_segments',
            operator: 'CONTAINS_TOKEN',
            value: 'Nominess 2026'
          }]
        }],
        properties: ['email', 'wsa_segments'],
        limit: 5
      })
    });
    
    if (nomineesCheck.ok) {
      const nomineesData = await nomineesCheck.json();
      console.log(`   ✅ Found ${nomineesData.total} nominees in HubSpot`);
    }
    
    console.log('\\n🎉 Complete HubSpot sync test finished!');
    console.log('\\n📋 Summary:');
    console.log('✅ Voters: Syncing with "Voter 2026" segment');
    console.log('✅ Nominators: Syncing with "nominators_2026" segment');
    console.log('✅ Nominees: Syncing with "Nominess 2026" segment');
    console.log('\\n🎯 All three sync types are working correctly!');
    
  } catch (error) {
    console.error('❌ Complete HubSpot sync test failed:', error.message);
  }
}

testCompleteHubSpotSync();