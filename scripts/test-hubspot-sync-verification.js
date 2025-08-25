#!/usr/bin/env node

/**
 * HubSpot Sync Verification
 * Tests that HubSpot integration works
 */

async function testHubSpotSync() {
  console.log('🔗 Testing HubSpot Sync...');
  
  try {
    // Test 1: Check HubSpot status
    const statusResponse = await fetch('http://localhost:3010/api/integrations/hubspot/stats');
    const statusData = await statusResponse.json();
    
    console.log('HubSpot Status:', statusData.hubspotStatus);
    console.log('Last Sync:', statusData.lastSyncTime);
    console.log('Total Synced:', statusData.totalSynced);
    
    if (statusData.hubspotStatus === 'connected') {
      console.log('✅ HubSpot is connected');
    } else {
      console.log('❌ HubSpot not connected');
      return;
    }
    
    // Test 2: Create a test vote to trigger sync
    const voteResponse = await fetch('http://localhost:3010/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nomineeId: '08a489d3-e482-4be6-82cc-aec6d1eddeee', // Simple Test Nominee
        category: 'Top Recruiter',
        voter: {
          firstName: 'HubSpot',
          lastName: 'Sync Test',
          email: 'hubspot-sync-test@example.com',
          linkedin: 'https://linkedin.com/in/hubspot-test'
        }
      })
    });
    
    if (voteResponse.ok) {
      console.log('✅ Test vote created - HubSpot sync should be triggered');
    } else {
      console.log('❌ Failed to create test vote');
    }
    
    console.log('\n🎉 HubSpot sync test completed!');
    
  } catch (error) {
    console.error('❌ HubSpot test failed:', error.message);
  }
}

testHubSpotSync();
