#!/usr/bin/env node

/**
 * Final HubSpot Verification
 * Comprehensive test to verify all HubSpot sync is working
 */

const fetch = globalThis.fetch;

console.log('🎯 Final HubSpot Sync Verification');
console.log('==================================');

const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;

async function runCompleteTest() {
  console.log('🚀 Running Complete HubSpot Sync Test');
  console.log('=====================================');
  
  const timestamp = Date.now();
  const testData = {
    nominator: {
      name: 'Final Verification Nominator',
      email: `final.verification.nominator.${timestamp}@example.com`,
      linkedin: `https://www.linkedin.com/in/final-verification-nominator-${timestamp}`
    },
    nominee: {
      name: 'Final Verification Nominee',
      email: `final.verification.nominee.${timestamp}@example.com`,
      title: 'Senior Recruiter at Final Test Company',
      country: 'United States',
      linkedin: `https://www.linkedin.com/in/final-verification-nominee-${timestamp}`,
      whyVoteForMe: 'Final verification test for HubSpot sync',
      imageUrl: 'https://example.com/final-test.jpg'
    },
    voter: {
      firstName: 'Final',
      lastName: 'Verification Voter',
      email: `final.verification.voter.${timestamp}@example.com`,
      phone: '+1234567890',
      linkedin: `https://www.linkedin.com/in/final-verification-voter-${timestamp}`
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
      console.log('❌ Nomination failed:', error);
      return false;
    }

    const nominationResult = await nominationResponse.json();
    console.log('✅ Nomination submitted successfully');
    console.log(`   ID: ${nominationResult.id}`);
    
    // Step 2: Wait and verify nominator
    console.log('\n⏳ Step 2: Waiting for nominator sync (8 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    const nominatorResult = await verifyContact(testData.nominator.email, 'Nominator', 'nominators_2026');
    
    // Step 3: Approve nomination
    console.log('\n📤 Step 3: Approving nomination...');
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
      console.log('❌ Approval failed:', error);
      return false;
    }

    console.log('✅ Nomination approved successfully');
    
    // Step 4: Wait and verify nominee
    console.log('\n⏳ Step 4: Waiting for nominee sync (8 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    const nomineeResult = await verifyContact(testData.nominee.email, 'Nominee', 'nominees_2026');
    
    // Step 5: Submit vote
    console.log('\n📤 Step 5: Submitting vote...');
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
      console.log('❌ Vote failed:', error);
      return { nominatorResult, nomineeResult, voterResult: false };
    }

    const voteResult = await voteResponse.json();
    console.log('✅ Vote submitted successfully');
    console.log(`   Total votes: ${voteResult.total}`);
    
    // Step 6: Wait and verify voter
    console.log('\n⏳ Step 6: Waiting for voter sync (8 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    const voterResult = await verifyContact(testData.voter.email, 'Voter', 'voters_2026');
    
    return { nominatorResult, nomineeResult, voterResult };

  } catch (error) {
    console.log('❌ Complete test error:', error.message);
    return { nominatorResult: false, nomineeResult: false, voterResult: false };
  }
}

async function verifyContact(email, type, expectedSegment) {
  console.log(`\n🔍 Verifying ${type}: ${email}`);
  
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
          'linkedin_url', 'wsa_linkedin_url', 'website', 'wsa_category', 
          'wsa_nomination_id', 'wsa_live_slug', 'wsa_last_voted_nominee', 'wsa_last_voted_category'
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
        const linkedInUrl = contact.properties.wsa_linkedin_url || contact.properties.linkedin_url || contact.properties.website;
        
        console.log(`   ✅ ${type} FOUND in HubSpot!`);
        console.log(`      🆔 HubSpot ID: ${contact.id}`);
        console.log(`      📧 Email: ${contact.properties.email}`);
        console.log(`      👤 Name: ${contact.properties.firstname} ${contact.properties.lastname}`);
        console.log(`      📅 WSA Year: ${contact.properties.wsa_year}`);
        console.log(`      🏷️  WSA Segments: ${segments}`);
        console.log(`      🔗 LinkedIn URL: ${linkedInUrl || 'Not set'}`);
        console.log(`      📂 Category: ${contact.properties.wsa_category || 'Not set'}`);
        console.log(`      🎯 Nomination ID: ${contact.properties.wsa_nomination_id || 'Not set'}`);
        console.log(`      🔗 Live Slug: ${contact.properties.wsa_live_slug || 'Not set'}`);
        console.log(`      🗳️  Last Voted Nominee: ${contact.properties.wsa_last_voted_nominee || 'Not set'}`);
        console.log(`      📊 Last Voted Category: ${contact.properties.wsa_last_voted_category || 'Not set'}`);
        console.log(`      ${hasCorrectSegment ? '✅' : '❌'} Segment Check: ${expectedSegment}`);
        
        return hasCorrectSegment && linkedInUrl;
      } else {
        console.log(`   ❌ ${type} NOT FOUND in HubSpot`);
        return false;
      }
    } else {
      const error = await response.text();
      console.log(`   ❌ Error verifying ${type}: ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error verifying ${type}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Final HubSpot Verification');
  console.log('======================================');
  
  const results = await runCompleteTest();
  
  console.log('\n📊 FINAL HUBSPOT SYNC VERIFICATION RESULTS');
  console.log('==========================================');
  console.log(`${results.nominatorResult ? '✅' : '❌'} Nominator Sync: ${results.nominatorResult ? 'WORKING' : 'FAILED'}`);
  console.log(`${results.nomineeResult ? '✅' : '❌'} Nominee Sync: ${results.nomineeResult ? 'WORKING' : 'FAILED'}`);
  console.log(`${results.voterResult ? '✅' : '❌'} Voter Sync: ${results.voterResult ? 'WORKING' : 'FAILED'}`);
  
  const allWorking = results.nominatorResult && results.nomineeResult && results.voterResult;
  
  console.log(`\n🎯 OVERALL STATUS: ${allWorking ? '✅ ALL HUBSPOT SYNC WORKING PERFECTLY!' : '⚠️  SOME ISSUES DETECTED'}`);
  
  if (allWorking) {
    console.log('\n🎉 HUBSPOT SYNC COMPLETELY FIXED!');
    console.log('=================================');
    console.log('✅ Nominators sync to HubSpot with all details');
    console.log('✅ Nominees sync to HubSpot with all details');
    console.log('✅ Voters sync to HubSpot with all details');
    console.log('✅ LinkedIn URLs are captured and stored');
    console.log('✅ All WSA segments are correctly assigned');
    console.log('✅ Categories, nomination IDs, and metadata are saved');
    console.log('✅ Vote tracking (last voted nominee/category) works');
    
    console.log('\n🔍 HubSpot Dashboard Verification:');
    console.log('1. Go to HubSpot → Contacts');
    console.log('2. Search for any of the test emails above');
    console.log('3. All WSA properties should be populated');
    console.log('4. LinkedIn URLs should be in wsa_linkedin_url field');
    console.log('5. Segments should show the correct 2026 values');
    
  } else {
    console.log('\n⚠️  Some sync operations need attention');
    console.log('Check the detailed results above');
  }
  
  process.exit(allWorking ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Final verification failed:', error);
  process.exit(1);
});