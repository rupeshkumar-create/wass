#!/usr/bin/env node

/**
 * Live Integration Sync Test
 * Tests actual sync functionality with HubSpot and Loops
 */

const https = require('https');
const http = require('http');

// Test configuration
const TEST_DATA = {
  nominator: {
    name: 'John Test Nominator',
    email: `test.nominator.${Date.now()}@example.com`,
    linkedin: 'https://linkedin.com/in/john-test-nominator'
  },
  nominee: {
    name: 'Jane Test Nominee',
    email: `test.nominee.${Date.now()}@example.com`,
    linkedin: 'https://linkedin.com/in/jane-test-nominee'
  },
  voter: {
    firstName: 'Bob',
    lastName: 'Test Voter',
    email: `test.voter.${Date.now()}@example.com`,
    linkedin: 'https://linkedin.com/in/bob-test-voter'
  }
};

console.log('🧪 Live Integration Sync Test\n');
console.log('Testing actual sync functionality with HubSpot and Loops...\n');

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

// Test HubSpot API directly
async function testHubSpotDirect() {
  console.log('1. Testing HubSpot API Direct Connection...');
  
  const hubspotToken = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!hubspotToken) {
    console.log('   ❌ HUBSPOT_PRIVATE_APP_TOKEN not found in environment');
    return false;
  }
  
  try {
    // Test basic connection
    const options = {
      hostname: 'api.hubapi.com',
      port: 443,
      path: '/crm/v3/objects/contacts?limit=1',
      method: 'GET',
      protocol: 'https:',
      headers: {
        'Authorization': `Bearer ${hubspotToken}`,
        'Content-Type': 'application/json',
      },
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('   ✅ HubSpot API connection successful');
      return true;
    } else {
      console.log(`   ❌ HubSpot API connection failed: ${response.statusCode}`);
      console.log(`   📄 Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ HubSpot API error: ${error.message}`);
    return false;
  }
}

// Test Loops API directly
async function testLoopsDirect() {
  console.log('\n2. Testing Loops API Direct Connection...');
  
  const loopsKey = process.env.LOOPS_API_KEY;
  if (!loopsKey) {
    console.log('   ❌ LOOPS_API_KEY not found in environment');
    return false;
  }
  
  try {
    // Test with a simple contact find
    const options = {
      hostname: 'app.loops.so',
      port: 443,
      path: '/api/v1/contacts/find',
      method: 'POST',
      protocol: 'https:',
      headers: {
        'Authorization': `Bearer ${loopsKey}`,
        'Content-Type': 'application/json',
      },
    };
    
    const testData = { email: 'nonexistent@test.com' };
    const response = await makeRequest(options, testData);
    
    if (response.statusCode === 200 || response.statusCode === 404) {
      console.log('   ✅ Loops API connection successful');
      return true;
    } else {
      console.log(`   ❌ Loops API connection failed: ${response.statusCode}`);
      console.log(`   📄 Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Loops API error: ${error.message}`);
    return false;
  }
}

// Test nomination submission and sync
async function testNominationSync() {
  console.log('\n3. Testing Nomination Submission & Sync...');
  
  try {
    const nominationData = {
      category: 'top_recruiter',
      nominator: {
        name: TEST_DATA.nominator.name,
        email: TEST_DATA.nominator.email,
        linkedin: TEST_DATA.nominator.linkedin
      },
      nominee: {
        name: TEST_DATA.nominee.name,
        email: TEST_DATA.nominee.email,
        linkedin: TEST_DATA.nominee.linkedin,
        title: 'Senior Recruiter',
        whyVoteForMe: 'Test nomination for integration testing'
      }
    };
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/nominations',
      method: 'POST',
      protocol: 'http:',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    console.log('   📤 Submitting test nomination...');
    const response = await makeRequest(options, nominationData);
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('   ✅ Nomination submitted successfully');
      console.log(`   📋 Nomination ID: ${response.data.id}`);
      console.log(`   🔗 Live URL: ${response.data.liveUrl}`);
      
      // Wait a moment for sync to complete
      console.log('   ⏳ Waiting for sync to complete...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return {
        success: true,
        nominationId: response.data.id,
        liveUrl: response.data.liveUrl
      };
    } else {
      console.log(`   ❌ Nomination submission failed: ${response.statusCode}`);
      console.log(`   📄 Response: ${JSON.stringify(response.data, null, 2)}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ Nomination submission error: ${error.message}`);
    return { success: false };
  }
}

// Test nomination approval and nominee sync
async function testNominationApproval(nominationId) {
  console.log('\n4. Testing Nomination Approval & Nominee Sync...');
  
  try {
    const approvalData = {
      id: nominationId,
      status: 'approved'
    };
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/nominations',
      method: 'PATCH',
      protocol: 'http:',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    console.log('   📤 Approving test nomination...');
    const response = await makeRequest(options, approvalData);
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('   ✅ Nomination approved successfully');
      
      // Wait a moment for sync to complete
      console.log('   ⏳ Waiting for nominee sync to complete...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return { success: true };
    } else {
      console.log(`   ❌ Nomination approval failed: ${response.statusCode}`);
      console.log(`   📄 Response: ${JSON.stringify(response.data, null, 2)}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ Nomination approval error: ${error.message}`);
    return { success: false };
  }
}

// Test vote submission and voter sync
async function testVoteSync(nominationId) {
  console.log('\n5. Testing Vote Submission & Voter Sync...');
  
  try {
    const voteData = {
      nomineeId: nominationId,
      category: 'top_recruiter',
      voter: {
        firstName: TEST_DATA.voter.firstName,
        lastName: TEST_DATA.voter.lastName,
        email: TEST_DATA.voter.email,
        linkedin: TEST_DATA.voter.linkedin
      }
    };
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/votes',
      method: 'POST',
      protocol: 'http:',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    console.log('   📤 Submitting test vote...');
    const response = await makeRequest(options, voteData);
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('   ✅ Vote submitted successfully');
      console.log(`   📊 Total votes: ${response.data.total}`);
      
      // Wait a moment for sync to complete
      console.log('   ⏳ Waiting for voter sync to complete...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return { success: true };
    } else {
      console.log(`   ❌ Vote submission failed: ${response.statusCode}`);
      console.log(`   📄 Response: ${JSON.stringify(response.data, null, 2)}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ Vote submission error: ${error.message}`);
    return { success: false };
  }
}

// Verify HubSpot contacts
async function verifyHubSpotContacts() {
  console.log('\n6. Verifying HubSpot Contacts...');
  
  const hubspotToken = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  const contacts = [
    { email: TEST_DATA.nominator.email, type: 'Nominator', expectedSegment: 'nominators_2026' },
    { email: TEST_DATA.nominee.email, type: 'Nominee', expectedSegment: 'Nominess 2026' },
    { email: TEST_DATA.voter.email, type: 'Voter', expectedSegment: 'Voter 2026' }
  ];
  
  let allFound = true;
  
  for (const contact of contacts) {
    try {
      const options = {
        hostname: 'api.hubapi.com',
        port: 443,
        path: `/crm/v3/objects/contacts/${encodeURIComponent(contact.email)}?idProperty=email&properties=email,firstname,lastname,wsa_segments,wsa_year,wsa_linkedin_url`,
        method: 'GET',
        protocol: 'https:',
        headers: {
          'Authorization': `Bearer ${hubspotToken}`,
          'Content-Type': 'application/json',
        },
      };
      
      const response = await makeRequest(options);
      
      if (response.statusCode === 200) {
        const props = response.data.properties;
        console.log(`   ✅ ${contact.type} found in HubSpot: ${contact.email}`);
        console.log(`      📋 WSA Year: ${props.wsa_year || 'Not set'}`);
        console.log(`      🏷️  WSA Segments: ${props.wsa_segments || 'Not set'}`);
        console.log(`      🔗 LinkedIn: ${props.wsa_linkedin_url || 'Not set'}`);
        
        // Check if expected segment is present
        if (props.wsa_segments && props.wsa_segments.includes(contact.expectedSegment)) {
          console.log(`      ✅ Correct segment assigned: ${contact.expectedSegment}`);
        } else {
          console.log(`      ❌ Expected segment missing: ${contact.expectedSegment}`);
          allFound = false;
        }
      } else {
        console.log(`   ❌ ${contact.type} not found in HubSpot: ${contact.email}`);
        allFound = false;
      }
    } catch (error) {
      console.log(`   ❌ Error checking ${contact.type}: ${error.message}`);
      allFound = false;
    }
  }
  
  return allFound;
}

// Verify Loops contacts and lists
async function verifyLoopsContacts() {
  console.log('\n7. Verifying Loops Contacts & Lists...');
  
  const loopsKey = process.env.LOOPS_API_KEY;
  const contacts = [
    { email: TEST_DATA.nominator.email, type: 'Nominator', expectedGroup: 'Nominator 2026', listId: 'cmegxuqag0jth0h334yy17csd' },
    { email: TEST_DATA.nominee.email, type: 'Nominee', expectedGroup: 'Nominees 2026', listId: 'cmegxubbj0jr60h33ahctgicr' },
    { email: TEST_DATA.voter.email, type: 'Voter', expectedGroup: 'Voter 2026', listId: 'cmegxu1fc0gw70i1d7g35gqb0' }
  ];
  
  let allFound = true;
  
  for (const contact of contacts) {
    try {
      const options = {
        hostname: 'app.loops.so',
        port: 443,
        path: '/api/v1/contacts/find',
        method: 'POST',
        protocol: 'https:',
        headers: {
          'Authorization': `Bearer ${loopsKey}`,
          'Content-Type': 'application/json',
        },
      };
      
      const response = await makeRequest(options, { email: contact.email });
      
      if (response.statusCode === 200 && response.data.length > 0) {
        const contactData = response.data[0];
        console.log(`   ✅ ${contact.type} found in Loops: ${contact.email}`);
        console.log(`      👤 Name: ${contactData.firstName} ${contactData.lastName}`);
        console.log(`      🏷️  User Group: ${contactData.userGroup || 'Not set'}`);
        console.log(`      📅 Source: ${contactData.source || 'Not set'}`);
        
        // Check if expected user group is correct
        if (contactData.userGroup === contact.expectedGroup) {
          console.log(`      ✅ Correct user group assigned: ${contact.expectedGroup}`);
        } else {
          console.log(`      ❌ Expected user group missing: ${contact.expectedGroup}`);
          allFound = false;
        }
      } else {
        console.log(`   ❌ ${contact.type} not found in Loops: ${contact.email}`);
        allFound = false;
      }
    } catch (error) {
      console.log(`   ❌ Error checking ${contact.type}: ${error.message}`);
      allFound = false;
    }
  }
  
  return allFound;
}

// Main test execution
async function runLiveIntegrationTest() {
  console.log('🚀 Starting Live Integration Sync Test');
  console.log('=====================================\n');
  
  // Check if development server is running
  try {
    const healthCheck = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/stats',
      method: 'GET',
      protocol: 'http:',
    });
    
    if (healthCheck.statusCode !== 200) {
      console.log('❌ Development server not running on localhost:3000');
      console.log('Please start the server with: npm run dev');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Development server not running on localhost:3000');
    console.log('Please start the server with: npm run dev');
    process.exit(1);
  }
  
  const results = [];
  
  // Run all tests
  results.push(await testHubSpotDirect());
  results.push(await testLoopsDirect());
  
  const nominationResult = await testNominationSync();
  results.push(nominationResult.success);
  
  if (nominationResult.success) {
    const approvalResult = await testNominationApproval(nominationResult.nominationId);
    results.push(approvalResult.success);
    
    if (approvalResult.success) {
      const voteResult = await testVoteSync(nominationResult.nominationId);
      results.push(voteResult.success);
    }
  }
  
  // Verify contacts in both platforms
  results.push(await verifyHubSpotContacts());
  results.push(await verifyLoopsContacts());
  
  // Summary
  const passedTests = results.filter(Boolean).length;
  const totalTests = results.length;
  
  console.log('\n📊 Live Integration Test Results:');
  console.log('=================================');
  console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All integration tests passed!');
    console.log('✅ HubSpot sync is working correctly');
    console.log('✅ Loops sync is working correctly');
    console.log('✅ All contacts are properly synced with correct details');
    console.log('\n📋 Test Data Used:');
    console.log(`   Nominator: ${TEST_DATA.nominator.email}`);
    console.log(`   Nominee: ${TEST_DATA.nominee.email}`);
    console.log(`   Voter: ${TEST_DATA.voter.email}`);
  } else {
    console.log('\n⚠️  Some integration tests failed.');
    console.log('Please check the errors above and verify:');
    console.log('1. Environment variables are set correctly');
    console.log('2. HubSpot and Loops API keys are valid');
    console.log('3. Development server is running');
    console.log('4. Network connectivity to APIs');
  }
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Load environment variables
require('dotenv').config();

// Run the test
runLiveIntegrationTest().catch(error => {
  console.error('\n💥 Test suite crashed:', error);
  process.exit(1);
});