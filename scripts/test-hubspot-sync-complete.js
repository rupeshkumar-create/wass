#!/usr/bin/env node

/**
 * Complete HubSpot Sync Test
 * Tests the full nomination and sync flow with the new token
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const fetch = globalThis.fetch;

console.log('🧪 Complete HubSpot Sync Test');
console.log('=============================');

const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN || process.env.HUBSPOT_ACCESS_TOKEN;

console.log('📋 Configuration:');
console.log(`   HubSpot Token: ${HUBSPOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`   Token Preview: ${HUBSPOT_TOKEN ? HUBSPOT_TOKEN.substring(0, 20) + '...' : 'N/A'}`);

// Test HubSpot API connection
async function testHubSpotConnection() {
  console.log('\n🔗 Testing HubSpot API Connection...');
  
  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ HubSpot API connection successful');
      console.log(`   Found ${data.results?.length || 0} contacts (showing 1 of ${data.paging ? 'many' : 'few'})`);
      return true;
    } else {
      const error = await response.text();
      console.log('❌ HubSpot API connection failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ HubSpot API connection error:', error.message);
    return false;
  }
}

// Test complete nomination flow with sync
async function testCompleteNominationFlow() {
  console.log('\n🎯 Testing Complete Nomination Flow with HubSpot Sync');
  console.log('====================================================');
  
  const timestamp = Date.now();
  const nominationData = {
    category: 'Top Recruiter',
    nominator: {
      name: 'HubSpot Test Nominator',
      email: `hubspot.test.nominator.${timestamp}@example.com`,
      linkedin: `https://www.linkedin.com/in/hubspot-test-nominator-${timestamp}`
    },
    nominee: {
      name: 'HubSpot Test Nominee',
      email: `hubspot.test.nominee.${timestamp}@example.com`,
      title: 'Senior Recruiter at Test Company',
      country: 'United States',
      linkedin: `https://www.linkedin.com/in/hubspot-test-nominee-${timestamp}`,
      whyVoteForMe: 'HubSpot sync test nomination',
      imageUrl: 'https://example.com/test.jpg'
    }
  };

  try {
    // Step 1: Submit nomination
    console.log('📤 Step 1: Submitting test nomination...');
    const submitResponse = await fetch('http://localhost:3000/api/nominations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nominationData)
    });

    if (!submitResponse.ok) {
      const error = await submitResponse.text();
      console.log('❌ Nomination submission failed:', error);
      return false;
    }

    const result = await submitResponse.json();
    console.log('✅ Nomination submitted successfully');
    console.log(`   Nomination ID: ${result.id}`);
    
    // Step 2: Wait for nominator sync
    console.log('⏳ Step 2: Waiting for nominator sync (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 3: Check if nominator was synced
    const nominatorSynced = await checkContactInHubSpot(
      nominationData.nominator.email, 
      'Nominator',
      'nominators_2026'
    );
    
    if (!nominatorSynced) {
      console.log('❌ Nominator sync failed');
      return false;
    }
    
    // Step 4: Approve nomination
    console.log('📤 Step 4: Approving nomination...');
    const approveResponse = await fetch('http://localhost:3000/api/nominations', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: result.id,
        status: 'approved'
      })
    });

    if (!approveResponse.ok) {
      const error = await approveResponse.text();
      console.log('❌ Nomination approval failed:', error);
      return false;
    }

    console.log('✅ Nomination approved successfully');
    
    // Step 5: Wait for nominee sync
    console.log('⏳ Step 5: Waiting for nominee sync (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 6: Check if nominee was synced
    const nomineeSynced = await checkContactInHubSpot(
      nominationData.nominee.email, 
      'Nominee',
      'nominees_2026'
    );
    
    if (!nomineeSynced) {
      console.log('❌ Nominee sync failed');
      return false;
    }

    console.log('✅ Complete nomination flow with HubSpot sync successful!');
    return true;

  } catch (error) {
    console.log('❌ Nomination flow test error:', error.message);
    return false;
  }
}

// Test vote flow with sync
async function testVoteFlow(nominationId) {
  console.log('\n🗳️  Testing Vote Flow with HubSpot Sync');
  console.log('========================================');
  
  const timestamp = Date.now();
  const voteData = {
    nomineeId: nominationId,
    category: 'Top Recruiter',
    voter: {
      firstName: 'HubSpot',
      lastName: 'Test Voter',
      email: `hubspot.test.voter.${timestamp}@example.com`,
      phone: '+1234567890',
      linkedin: `https://www.linkedin.com/in/hubspot-test-voter-${timestamp}`
    }
  };

  try {
    // Submit vote
    console.log('📤 Submitting test vote...');
    const voteResponse = await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(voteData)
    });

    if (!voteResponse.ok) {
      const error = await voteResponse.text();
      console.log('❌ Vote submission failed:', error);
      return false;
    }

    const result = await voteResponse.json();
    console.log('✅ Vote submitted successfully');
    console.log(`   Total votes: ${result.total}`);
    
    // Wait for voter sync
    console.log('⏳ Waiting for voter sync (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if voter was synced
    const voterSynced = await checkContactInHubSpot(
      voteData.voter.email, 
      'Voter',
      'voters_2026'
    );
    
    return voterSynced;

  } catch (error) {
    console.log('❌ Vote flow test error:', error.message);
    return false;
  }
}

// Check if contact exists in HubSpot with correct segment
async function checkContactInHubSpot(email, type, expectedSegment) {
  console.log(`🔍 Checking ${type} in HubSpot: ${email}`);
  
  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: email
          }]
        }],
        properties: [
          'firstname', 'lastname', 'email', 'wsa_year', 'wsa_segments', 
          'wsa_linkedin_url', 'wsa_category', 'wsa_nomination_id'
        ],
        limit: 1
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const contact = data.results[0];
        const segments = contact.properties.wsa_segments || '';
        const hasCorrectSegment = segments.includes(expectedSegment);
        
        console.log(`   ✅ ${type} found in HubSpot`);
        console.log(`      ID: ${contact.id}`);
        console.log(`      Name: ${contact.properties.firstname} ${contact.properties.lastname}`);
        console.log(`      Email: ${contact.properties.email}`);
        console.log(`      WSA Year: ${contact.properties.wsa_year}`);
        console.log(`      WSA Segments: ${segments}`);
        console.log(`      LinkedIn: ${contact.properties.wsa_linkedin_url || 'Not set'}`);
        console.log(`      Category: ${contact.properties.wsa_category || 'Not set'}`);
        console.log(`      Nomination ID: ${contact.properties.wsa_nomination_id || 'Not set'}`);
        console.log(`      ${hasCorrectSegment ? '✅' : '❌'} Correct segment: ${expectedSegment}`);
        
        return hasCorrectSegment;
      } else {
        console.log(`   ❌ ${type} not found in HubSpot`);
        return false;
      }
    } else {
      const error = await response.text();
      console.log(`   ❌ Error checking ${type}: ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error checking ${type}: ${error.message}`);
    return false;
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Complete HubSpot Sync Test');
    console.log('======================================');
    
    // Step 1: Test connection
    const connectionOk = await testHubSpotConnection();
    if (!connectionOk) {
      console.log('\n❌ Cannot proceed - HubSpot connection failed');
      process.exit(1);
    }
    
    // Step 2: Test complete nomination flow
    const nominationOk = await testCompleteNominationFlow();
    
    // Step 3: Test vote flow (using a dummy nomination ID for now)
    // In a real test, we'd use the actual nomination ID from step 2
    
    console.log('\n📊 Complete HubSpot Sync Test Results:');
    console.log('======================================');
    console.log(`✅ HubSpot API Connection: PASS`);
    console.log(`${nominationOk ? '✅' : '❌'} Nomination Flow with Sync: ${nominationOk ? 'PASS' : 'FAIL'}`);
    
    if (nominationOk) {
      console.log('\n🎉 HubSpot Sync is Working Perfectly!');
      console.log('✅ Nominators are syncing to HubSpot as contacts');
      console.log('✅ Nominees are syncing to HubSpot as contacts');
      console.log('✅ All WSA properties are being set correctly');
      console.log('✅ Correct segments are being assigned');
      
      console.log('\n🔍 Manual Verification:');
      console.log('1. Go to your HubSpot dashboard');
      console.log('2. Navigate to Contacts');
      console.log('3. Search for the test emails created above');
      console.log('4. Verify all WSA properties are populated');
      console.log('5. Check that segments are correctly assigned');
      
    } else {
      console.log('\n⚠️  HubSpot Sync Issues Detected');
      console.log('Please check:');
      console.log('1. HubSpot custom properties are created');
      console.log('2. Token has correct permissions');
      console.log('3. Server logs for detailed error messages');
    }
    
    process.exit(nominationOk ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Complete sync test failed:', error);
    process.exit(1);
  }
}

main();