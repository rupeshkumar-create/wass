#!/usr/bin/env node

/**
 * Complete Sync Verification Test
 * Tests the full nomination and voting flow with actual sync verification
 */

const https = require('https');
const http = require('http');

// Load environment variables
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

console.log('🔄 Complete Sync Verification Test\n');

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsed,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData,
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test complete nomination and approval flow
async function testCompleteNominationFlow() {
  console.log('1. Testing Complete Nomination Flow...');
  
  const timestamp = Date.now();
  const testData = {
    nominator: {
      name: 'John Test Nominator',
      email: `test.nominator.${timestamp}@example.com`,
      linkedin: 'https://www.linkedin.com/in/john-test-nominator'
    },
    nominee: {
      name: 'Jane Test Nominee',
      email: `test.nominee.${timestamp}@example.com`,
      linkedin: 'https://www.linkedin.com/in/jane-test-nominee'
    }
  };
  
  try {
    // Submit nomination
    console.log('   📤 Submitting nomination...');
    const nominationData = {
      category: 'Top Recruiter',
      nominator: testData.nominator,
      nominee: {
        ...testData.nominee,
        title: 'Senior Recruiter',
        country: 'United States',
        imageUrl: 'https://via.placeholder.com/400x400.png?text=Test+Nominee',
        whyVoteForMe: 'Test nomination for sync verification'
      }
    };
    
    const submitResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/nominations',
      method: 'POST',
      protocol: 'http:',
      headers: {
        'Content-Type': 'application/json',
      },
    }, nominationData);
    
    if (submitResponse.statusCode !== 200 || !submitResponse.data.success) {
      console.log('   ❌ Nomination submission failed');
      console.log(`   📄 Error: ${JSON.stringify(submitResponse.data, null, 2)}`);
      return { success: false };
    }
    
    console.log('   ✅ Nomination submitted successfully');
    const nominationId = submitResponse.data.id;
    
    // Wait for nominator sync
    console.log('   ⏳ Waiting for nominator sync...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Approve nomination
    console.log('   📤 Approving nomination...');
    const approvalResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/nominations',
      method: 'PATCH',
      protocol: 'http:',
      headers: {
        'Content-Type': 'application/json',
      },
    }, {
      id: nominationId,
      status: 'approved'
    });
    
    if (approvalResponse.statusCode !== 200 || !approvalResponse.data.success) {
      console.log('   ❌ Nomination approval failed');
      return { success: false };
    }
    
    console.log('   ✅ Nomination approved successfully');
    
    // Wait for nominee sync
    console.log('   ⏳ Waiting for nominee sync...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      success: true,
      nominationId,
      testData
    };
    
  } catch (error) {
    console.log(`   ❌ Nomination flow error: ${error.message}`);
    return { success: false };
  }
}

// Test vote flow
async function testVoteFlow(nominationId, testData) {
  console.log('\n2. Testing Vote Flow...');
  
  const timestamp = Date.now();
  const voterData = {
    firstName: 'Bob',
    lastName: 'Test Voter',
    email: `test.voter.${timestamp}@example.com`,
    linkedin: 'https://linkedin.com/in/bob-test-voter'
  };
  
  try {
    const voteData = {
      nomineeId: nominationId,
      category: 'Top Recruiter',
      voter: voterData
    };
    
    console.log('   📤 Submitting vote...');
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/votes',
      method: 'POST',
      protocol: 'http:',
      headers: {
        'Content-Type': 'application/json',
      },
    }, voteData);
    
    if (response.statusCode !== 200 || !response.data.success) {
      console.log('   ❌ Vote submission failed');
      console.log(`   📄 Error: ${JSON.stringify(response.data, null, 2)}`);
      return { success: false };
    }
    
    console.log('   ✅ Vote submitted successfully');
    console.log(`   📊 Total votes: ${response.data.total}`);
    
    // Wait for voter sync
    console.log('   ⏳ Waiting for voter sync...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      success: true,
      voterData
    };
    
  } catch (error) {
    console.log(`   ❌ Vote flow error: ${error.message}`);
    return { success: false };
  }
}

// Verify HubSpot contacts
async function verifyHubSpotSync(testData, voterData) {
  console.log('\n3. Verifying HubSpot Sync...');
  
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  const contacts = [
    { email: testData.nominator.email, type: 'Nominator', expectedSegment: 'nominators_2026' },
    { email: testData.nominee.email, type: 'Nominee', expectedSegment: 'Nominess 2026' },
    { email: voterData.email, type: 'Voter', expectedSegment: 'Voter 2026' }
  ];
  
  let allVerified = true;
  
  for (const contact of contacts) {
    try {
      console.log(`   🔍 Checking ${contact.type}: ${contact.email}`);
      
      const options = {
        hostname: 'api.hubapi.com',
        port: 443,
        path: `/crm/v3/objects/contacts/${encodeURIComponent(contact.email)}?idProperty=email&properties=email,firstname,lastname,wsa_segments,wsa_year,wsa_linkedin_url,wsa_category`,
        method: 'GET',
        protocol: 'https:',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };
      
      const response = await makeRequest(options);
      
      if (response.statusCode === 200) {
        const props = response.data.properties;
        console.log(`      ✅ Found in HubSpot`);
        console.log(`      👤 Name: ${props.firstname} ${props.lastname}`);
        console.log(`      📅 WSA Year: ${props.wsa_year || 'Not set'}`);
        console.log(`      🏷️  WSA Segments: ${props.wsa_segments || 'Not set'}`);
        console.log(`      🔗 LinkedIn: ${props.wsa_linkedin_url || 'Not set'}`);
        console.log(`      📂 Category: ${props.wsa_category || 'Not set'}`);
        
        // Verify expected segment
        if (props.wsa_segments && props.wsa_segments.includes(contact.expectedSegment)) {
          console.log(`      ✅ Correct segment: ${contact.expectedSegment}`);
        } else {
          console.log(`      ❌ Missing expected segment: ${contact.expectedSegment}`);
          allVerified = false;
        }
      } else if (response.statusCode === 404) {
        console.log(`      ❌ Not found in HubSpot`);
        allVerified = false;
      } else {
        console.log(`      ❌ HubSpot error: ${response.statusCode}`);
        allVerified = false;
      }
    } catch (error) {
      console.log(`      ❌ Error checking ${contact.type}: ${error.message}`);
      allVerified = false;
    }
  }
  
  return allVerified;
}

// Verify Loops contacts
async function verifyLoopsSync(testData, voterData) {
  console.log('\n4. Verifying Loops Sync...');
  
  const token = process.env.LOOPS_API_KEY;
  const contacts = [
    { email: testData.nominator.email, type: 'Nominator', expectedGroup: 'Nominator 2026' },
    { email: testData.nominee.email, type: 'Nominee', expectedGroup: 'Nominees 2026' },
    { email: voterData.email, type: 'Voter', expectedGroup: 'Voter 2026' }
  ];
  
  let allVerified = true;
  
  for (const contact of contacts) {
    try {
      console.log(`   🔍 Checking ${contact.type}: ${contact.email}`);
      
      const options = {
        hostname: 'app.loops.so',
        port: 443,
        path: '/api/v1/contacts/find',
        method: 'POST',
        protocol: 'https:',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };
      
      const response = await makeRequest(options, { email: contact.email });
      
      if (response.statusCode === 200 && response.data && response.data.length > 0) {
        const contactData = response.data[0];
        console.log(`      ✅ Found in Loops`);
        console.log(`      👤 Name: ${contactData.firstName} ${contactData.lastName}`);
        console.log(`      🏷️  User Group: ${contactData.userGroup || 'Not set'}`);
        console.log(`      📅 Source: ${contactData.source || 'Not set'}`);
        
        // Verify expected user group
        if (contactData.userGroup === contact.expectedGroup) {
          console.log(`      ✅ Correct user group: ${contact.expectedGroup}`);
        } else {
          console.log(`      ❌ Expected user group: ${contact.expectedGroup}, got: ${contactData.userGroup}`);
          allVerified = false;
        }
      } else {
        console.log(`      ❌ Not found in Loops`);
        allVerified = false;
      }
    } catch (error) {
      console.log(`      ❌ Error checking ${contact.type}: ${error.message}`);
      allVerified = false;
    }
  }
  
  return allVerified;
}

// Main test execution
async function runCompleteVerification() {
  console.log('🚀 Starting Complete Sync Verification');
  console.log('=====================================\n');
  
  // Check if dev server is running
  try {
    await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/stats',
      method: 'GET',
      protocol: 'http:',
    });
  } catch (error) {
    console.log('❌ Development server not running');
    console.log('Please start with: npm run dev');
    process.exit(1);
  }
  
  // Run complete flow test
  const nominationResult = await testCompleteNominationFlow();
  if (!nominationResult.success) {
    console.log('\n❌ Nomination flow failed - cannot continue with verification');
    process.exit(1);
  }
  
  const voteResult = await testVoteFlow(nominationResult.nominationId, nominationResult.testData);
  if (!voteResult.success) {
    console.log('\n❌ Vote flow failed - cannot continue with verification');
    process.exit(1);
  }
  
  // Verify sync results
  const hubspotVerified = await verifyHubSpotSync(nominationResult.testData, voteResult.voterData);
  const loopsVerified = await verifyLoopsSync(nominationResult.testData, voteResult.voterData);
  
  // Summary
  console.log('\n📊 Complete Sync Verification Results:');
  console.log('=====================================');
  console.log(`✅ Nomination Flow: PASS`);
  console.log(`✅ Vote Flow: PASS`);
  console.log(`${hubspotVerified ? '✅' : '❌'} HubSpot Sync: ${hubspotVerified ? 'PASS' : 'FAIL'}`);
  console.log(`${loopsVerified ? '✅' : '❌'} Loops Sync: ${loopsVerified ? 'PASS' : 'FAIL'}`);
  
  const allPassed = hubspotVerified && loopsVerified;
  
  console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL SYNCS WORKING' : '⚠️  SOME SYNCS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🎉 Integration sync verification successful!');
    console.log('✅ All contacts are properly synced to HubSpot with correct segments');
    console.log('✅ All contacts are properly synced to Loops with correct user groups');
    console.log('✅ Complete nomination and voting flow working');
    
    console.log('\n📋 Test Contacts Created:');
    console.log(`   Nominator: ${nominationResult.testData.nominator.email}`);
    console.log(`   Nominee: ${nominationResult.testData.nominee.email}`);
    console.log(`   Voter: ${voteResult.voterData.email}`);
    
    console.log('\n🔍 Manual Verification:');
    console.log('1. Check HubSpot → Contacts → Search for test emails');
    console.log('2. Check Loops → Contacts → Search for test emails');
    console.log('3. Verify all properties and segments are correctly set');
  } else {
    console.log('\n⚠️  Some sync operations failed.');
    console.log('Please check the detailed results above and:');
    console.log('1. Verify API keys have correct permissions');
    console.log('2. Check network connectivity');
    console.log('3. Review error logs for specific issues');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run the verification
runCompleteVerification().catch(error => {
  console.error('\n💥 Verification test crashed:', error);
  process.exit(1);
});