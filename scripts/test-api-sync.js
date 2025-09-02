#!/usr/bin/env node

/**
 * API Sync Test - Tests sync through API endpoints
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const fetch = globalThis.fetch;

console.log('🧪 API Sync Test');
console.log('================');

const BASE_URL = 'http://localhost:3000';

async function testApiSync() {
  try {
    console.log('📋 Testing Nomination API with Sync...');
    
    const timestamp = Date.now();
    
    // Test nomination submission
    const nominationData = {
      category: 'Top Recruiter',
      nominator: {
        name: 'Test API Nominator',
        email: `test.api.nominator.${timestamp}@example.com`,
        phone: '+1234567890',
        linkedin: 'https://www.linkedin.com/in/test-api-nominator'
      },
      nominee: {
        name: 'Test API Nominee',
        email: `test.api.nominee.${timestamp}@example.com`,
        title: 'Senior Recruiter at Test Company',
        country: 'United States',
        linkedin: 'https://www.linkedin.com/in/test-api-nominee',
        whyVoteForMe: 'Test nominee for API sync verification',
        imageUrl: 'https://example.com/test-image.jpg'
      }
    };

    console.log('🔄 Submitting nomination...');
    const nominationResponse = await fetch(`${BASE_URL}/api/nominations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nominationData)
    });

    if (!nominationResponse.ok) {
      const error = await nominationResponse.text();
      throw new Error(`Nomination failed: ${nominationResponse.status} - ${error}`);
    }

    const nominationResult = await nominationResponse.json();
    console.log('✅ Nomination submitted:', nominationResult.id);

    // Wait for sync
    console.log('⏳ Waiting for nominator sync...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Approve nomination to trigger nominee sync
    console.log('🔄 Approving nomination...');
    const approvalResponse = await fetch(`${BASE_URL}/api/nominations`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: nominationResult.id,
        status: 'approved'
      })
    });

    if (!approvalResponse.ok) {
      const error = await approvalResponse.text();
      throw new Error(`Approval failed: ${approvalResponse.status} - ${error}`);
    }

    const approvalResult = await approvalResponse.json();
    console.log('✅ Nomination approved');

    // Wait for nominee sync
    console.log('⏳ Waiting for nominee sync...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test vote submission
    console.log('📋 Testing Vote API with Sync...');
    
    const voteData = {
      nomineeId: nominationResult.id,
      category: 'Top Recruiter',
      voter: {
        firstName: 'Test',
        lastName: 'API Voter',
        email: `test.api.voter.${timestamp}@example.com`,
        phone: '+1234567891',
        linkedin: 'https://www.linkedin.com/in/test-api-voter'
      }
    };

    console.log('🔄 Submitting vote...');
    const voteResponse = await fetch(`${BASE_URL}/api/votes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(voteData)
    });

    if (!voteResponse.ok) {
      const error = await voteResponse.text();
      throw new Error(`Vote failed: ${voteResponse.status} - ${error}`);
    }

    const voteResult = await voteResponse.json();
    console.log('✅ Vote submitted, total votes:', voteResult.total);

    // Wait for voter sync
    console.log('⏳ Waiting for voter sync...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n🎉 All API sync tests completed!');
    console.log('✅ Nomination flow with nominator sync');
    console.log('✅ Approval flow with nominee sync');
    console.log('✅ Vote flow with voter sync');
    
    console.log('\n📋 Test Contacts Created:');
    console.log(`   Nominator: ${nominationData.nominator.email}`);
    console.log(`   Nominee: ${nominationData.nominee.email}`);
    console.log(`   Voter: ${voteData.voter.email}`);
    
    console.log('\n🔍 Manual Verification:');
    console.log('1. Check HubSpot → Contacts → Search for test emails');
    console.log('2. Check Loops → Contacts → Search for test emails');
    console.log('3. Verify all properties and segments are correctly set');

  } catch (error) {
    console.error('❌ API sync test failed:', error);
    process.exit(1);
  }
}

testApiSync();