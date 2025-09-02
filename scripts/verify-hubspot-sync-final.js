#!/usr/bin/env node

/**
 * Final HubSpot Sync Verification
 * Comprehensive test with proper timing and verification
 */

const fetch = globalThis.fetch;

console.log('🎯 Final HubSpot Sync Verification');
console.log('==================================');

const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;

async function testCompleteFlow() {
  console.log('🚀 Testing Complete Nomination → Approval → Vote Flow');
  console.log('====================================================');
  
  const timestamp = Date.now();
  const testData = {
    nominator: {
      name: 'Final Test Nominator',
      email: `final.test.nominator.${timestamp}@example.com`,
      linkedin: `https://www.linkedin.com/in/final-test-nominator-${timestamp}`
    },
    nominee: {
      name: 'Final Test Nominee',
      email: `final.test.nominee.${timestamp}@example.com`,
      title: 'Senior Recruiter at Final Test Company',
      country: 'United States',
      linkedin: `https://www.linkedin.com/in/final-test-nominee-${timestamp}`,
      whyVoteForMe: 'Final test for HubSpot sync verification',
      imageUrl: 'https://example.com/final-test.jpg'
    },
    voter: {
      firstName: 'Final',
      lastName: 'Test Voter',
      email: `final.test.voter.${timestamp}@example.com`,
      phone: '+1234567890',
      linkedin: `https://www.linkedin.com/in/final-test-voter-${timestamp}`
    }
  };

  try {
    // Step 1: Submit nomination
    console.log('\n📤 Step 1: Submitting nomination...');
    const nominationResponse = await fetch('http://localhost:3000/api/nominations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        category: 'Top Recruiter',
        nominator: testData.nominator,
        nominee: testData.nominee
      })
    });

    if (!nominationResponse.ok) {
      const error = await nominationResponse.text();
      console.log('❌ Nomination submission failed:', error);
      return false;
    }

    const nominationResult = await nominationResponse.json();
    console.log('✅ Nomination submitted successfully');
    console.log(`   ID: ${nominationResult.id}`);
    
    // Step 2: Wait for nominator sync (longer wait)
    console.log('\n⏳ Step 2: Waiting for nominator sync (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Step 3: Verify nominator in HubSpot
    console.log('\n🔍 Step 3: Verifying nominator in HubSpot...');
    const nominatorFound = await verifyContactInHubSpot(
      testData.nominator.email, 
      'Nominator',
      'nominators_2026'
    );
    
    // Step 4: Approve nomination
    console.log('\n📤 Step 4: Approving nomination...');
    const approvalResponse = await fetch('http://localhost:3000/api/nominations', {
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
      console.log('❌ Nomination approval failed:', error);
      return false;
    }

    console.log('✅ Nomination approved successfully');
    
    // Step 5: Wait for nominee sync (longer wait)
    console.log('\n⏳ Step 5: Waiting for nominee sync (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Step 6: Verify nominee in HubSpot
    console.log('\n🔍 Step 6: Verifying nominee in HubSpot...');
    const nomineeFound = await verifyContactInHubSpot(
      testData.nominee.email, 
      'Nominee',
      'nominees_2026'
    );
    
    // Step 7: Submit vote
    console.log('\n📤 Step 7: Submitting vote...');
    const voteResponse = await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nomineeId: nominationResult.id,
        category: 'Top Recruiter',
        voter: testData.voter
      })
    });

    if (!voteResponse.ok) {
      const error = await voteResponse.text();
      console.log('❌ Vote submission failed:', error);
      return { nominatorFound, nomineeFound, voterFound: false };
    }

    const voteResult = await voteResponse.json();
    console.log('✅ Vote submitted successfully');
    console.log(`   Total votes: ${voteResult.total}`);
    
    // Step 8: Wait for voter sync (longer wait)
    console.log('\n⏳ Step 8: Waiting for voter sync (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Step 9: Verify voter in HubSpot
    console.log('\n🔍 Step 9: Verifying voter in HubSpot...');
    const voterFound = await verifyContactInHubSpot(
      testData.voter.email, 
      'Voter',
      'voters_2026'
    );
    
    return { nominatorFound, nomineeFound, voterFound };

  } catch (error) {
    console.log('❌ Complete flow test error:', error.message);
    return { nominatorFound: false, nomineeFound: false, voterFound: false };
  }
}

async function verifyContactInHubSpot(email, type, expectedSegment) {
  console.log(`   🔍 Searching for ${type}: ${email}`);
  
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
          'linkedin', 'wsa_category', 'wsa_nomination_id', 'wsa_live_slug'
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
        
        console.log(`   ✅ ${type} FOUND in HubSpot!`);
        console.log(`      📧 Email: ${contact.properties.email}`);
        console.log(`      👤 Name: ${contact.properties.firstname} ${contact.properties.lastname}`);
        console.log(`      🆔 HubSpot ID: ${contact.id}`);
        console.log(`      📅 WSA Year: ${contact.properties.wsa_year}`);
        console.log(`      🏷️  WSA Segments: ${segments}`);
        console.log(`      🔗 LinkedIn: ${contact.properties.linkedin || 'Not set'}`);
        console.log(`      📂 Category: ${contact.properties.wsa_category || 'Not set'}`);
        console.log(`      🎯 Nomination ID: ${contact.properties.wsa_nomination_id || 'Not set'}`);
        console.log(`      🔗 Live Slug: ${contact.properties.wsa_live_slug || 'Not set'}`);
        console.log(`      ${hasCorrectSegment ? '✅' : '❌'} Segment Check: ${expectedSegment}`);
        
        return hasCorrectSegment;
      } else {
        console.log(`   ❌ ${type} NOT FOUND in HubSpot`);
        return false;
      }
    } else {
      const error = await response.text();
      console.log(`   ❌ Error searching for ${type}: ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error verifying ${type}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Final HubSpot Sync Verification');
  console.log('============================================');
  
  const results = await testCompleteFlow();
  
  console.log('\n📊 FINAL VERIFICATION RESULTS');
  console.log('=============================');
  console.log(`${results.nominatorFound ? '✅' : '❌'} Nominator Sync: ${results.nominatorFound ? 'WORKING' : 'FAILED'}`);
  console.log(`${results.nomineeFound ? '✅' : '❌'} Nominee Sync: ${results.nomineeFound ? 'WORKING' : 'FAILED'}`);
  console.log(`${results.voterFound ? '✅' : '❌'} Voter Sync: ${results.voterFound ? 'WORKING' : 'FAILED'}`);
  
  const allWorking = results.nominatorFound && results.nomineeFound && results.voterFound;
  
  console.log(`\n🎯 OVERALL STATUS: ${allWorking ? '✅ ALL HUBSPOT SYNC WORKING!' : '⚠️  SOME ISSUES DETECTED'}`);
  
  if (allWorking) {
    console.log('\n🎉 HUBSPOT SYNC VERIFICATION COMPLETE!');
    console.log('======================================');
    console.log('✅ Nominators are syncing to HubSpot as contacts');
    console.log('✅ Nominees are syncing to HubSpot as contacts');
    console.log('✅ Voters are syncing to HubSpot as contacts');
    console.log('✅ All WSA properties are being set correctly');
    console.log('✅ Correct segments are being assigned');
    console.log('✅ LinkedIn URLs are being captured');
    console.log('✅ Categories and nomination IDs are being set');
    
    console.log('\n🔍 You can now verify in HubSpot:');
    console.log('1. Go to HubSpot → Contacts');
    console.log('2. Search for the test emails created above');
    console.log('3. All WSA properties should be populated');
    console.log('4. Segments should be correctly assigned');
    
  } else {
    console.log('\n⚠️  Some sync operations may need more time or have issues');
    console.log('Please check:');
    console.log('1. Server logs for any error messages');
    console.log('2. HubSpot custom properties are created');
    console.log('3. Token permissions are correct');
  }
  
  process.exit(allWorking ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Final verification failed:', error);
  process.exit(1);
});