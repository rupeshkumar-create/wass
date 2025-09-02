#!/usr/bin/env node

/**
 * Test script to verify new HubSpot credentials
 * Tests connection, basic API calls, and integration functionality
 */

const https = require('https');

// New HubSpot credentials
const NEW_ACCESS_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const NEW_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
const HUBSPOT_BASE_URL = 'https://api.hubapi.com';

console.log('🔄 Testing New HubSpot Credentials...\n');

// Helper function to make HubSpot API requests
function makeHubSpotRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, HUBSPOT_BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${NEW_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    if (data && method !== 'GET') {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
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

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testBasicConnection() {
  console.log('1. Testing Basic API Connection...');
  try {
    const response = await makeHubSpotRequest('/crm/v3/objects/contacts?limit=1');
    
    if (response.statusCode === 200) {
      console.log('   ✅ Basic connection successful');
      console.log(`   📊 Response: ${response.data.results ? response.data.results.length : 0} contacts found`);
      return true;
    } else {
      console.log(`   ❌ Connection failed: HTTP ${response.statusCode}`);
      console.log(`   📄 Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Connection error: ${error.message}`);
    return false;
  }
}

async function testContactCreation() {
  console.log('\n2. Testing Contact Creation...');
  try {
    const testContact = {
      properties: {
        email: `test-wsa-${Date.now()}@example.com`,
        firstname: 'Test',
        lastname: 'WSA User',
        wsa_year: '2026',
      },
    };

    const response = await makeHubSpotRequest('/crm/v3/objects/contacts', 'POST', testContact);
    
    if (response.statusCode === 201) {
      console.log('   ✅ Contact creation successful');
      console.log(`   👤 Created contact ID: ${response.data.id}`);
      return { success: true, contactId: response.data.id };
    } else {
      console.log(`   ❌ Contact creation failed: HTTP ${response.statusCode}`);
      console.log(`   📄 Response: ${JSON.stringify(response.data, null, 2)}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ Contact creation error: ${error.message}`);
    return { success: false };
  }
}

async function testCompanyCreation() {
  console.log('\n3. Testing Company Creation...');
  try {
    const testCompany = {
      properties: {
        name: `Test WSA Company ${Date.now()}`,
        domain: `test-wsa-${Date.now()}.com`,
        wsa_year: '2026',
      },
    };

    const response = await makeHubSpotRequest('/crm/v3/objects/companies', 'POST', testCompany);
    
    if (response.statusCode === 201) {
      console.log('   ✅ Company creation successful');
      console.log(`   🏢 Created company ID: ${response.data.id}`);
      return { success: true, companyId: response.data.id };
    } else {
      console.log(`   ❌ Company creation failed: HTTP ${response.statusCode}`);
      console.log(`   📄 Response: ${JSON.stringify(response.data, null, 2)}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ Company creation error: ${error.message}`);
    return { success: false };
  }
}

async function testContactSearch() {
  console.log('\n4. Testing Contact Search...');
  try {
    const searchPayload = {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'email',
              operator: 'CONTAINS_TOKEN',
              value: 'test-wsa',
            },
          ],
        },
      ],
      limit: 5,
    };

    const response = await makeHubSpotRequest('/crm/v3/objects/contacts/search', 'POST', searchPayload);
    
    if (response.statusCode === 200) {
      console.log('   ✅ Contact search successful');
      console.log(`   🔍 Found ${response.data.results ? response.data.results.length : 0} test contacts`);
      return true;
    } else {
      console.log(`   ❌ Contact search failed: HTTP ${response.statusCode}`);
      console.log(`   📄 Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Contact search error: ${error.message}`);
    return false;
  }
}

async function testRateLimiting() {
  console.log('\n5. Testing Rate Limiting Behavior...');
  try {
    // Make multiple rapid requests to test rate limiting
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(makeHubSpotRequest('/crm/v3/objects/contacts?limit=1'));
    }

    const responses = await Promise.all(promises);
    const successCount = responses.filter(r => r.statusCode === 200).length;
    const rateLimitCount = responses.filter(r => r.statusCode === 429).length;

    console.log(`   ✅ Rate limiting test completed`);
    console.log(`   📊 Successful requests: ${successCount}/5`);
    console.log(`   ⏳ Rate limited requests: ${rateLimitCount}/5`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Rate limiting test error: ${error.message}`);
    return false;
  }
}

async function testCredentialsInfo() {
  console.log('\n6. Testing Credentials Information...');
  try {
    // Test access token info endpoint
    const response = await makeHubSpotRequest('/oauth/v1/access-tokens/' + NEW_ACCESS_TOKEN);
    
    if (response.statusCode === 200) {
      console.log('   ✅ Access token info retrieved');
      console.log(`   🔑 Token type: ${response.data.token_type || 'private_app'}`);
      console.log(`   🏢 Hub ID: ${response.data.hub_id || 'N/A'}`);
      console.log(`   📅 Expires: ${response.data.expires_in ? 'Yes' : 'No expiration'}`);
      return true;
    } else {
      console.log(`   ⚠️  Token info not available (this is normal for private app tokens)`);
      return true; // This is expected for private app tokens
    }
  } catch (error) {
    console.log(`   ⚠️  Token info test skipped: ${error.message}`);
    return true; // This is expected for private app tokens
  }
}

// Main test execution
async function runAllTests() {
  console.log('🚀 HubSpot New Credentials Test Suite');
  console.log('=====================================');
  console.log(`🔑 Access Token: ${NEW_ACCESS_TOKEN.substring(0, 20)}...`);
  console.log(`🔐 Client Secret: ${NEW_CLIENT_SECRET.substring(0, 10)}...`);
  console.log(`🌐 Base URL: ${HUBSPOT_BASE_URL}\n`);

  const results = [];

  // Run all tests
  results.push(await testBasicConnection());
  results.push((await testContactCreation()).success);
  results.push((await testCompanyCreation()).success);
  results.push(await testContactSearch());
  results.push(await testRateLimiting());
  results.push(await testCredentialsInfo());

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const testNames = [
    'Basic API Connection',
    'Contact Creation',
    'Company Creation', 
    'Contact Search',
    'Rate Limiting',
    'Credentials Info'
  ];

  testNames.forEach((name, index) => {
    const status = results[index] ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${name}: ${status}`);
  });

  const passedTests = results.filter(Boolean).length;
  const totalTests = results.length;

  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! New HubSpot credentials are working correctly.');
    console.log('\n📋 Next Steps:');
    console.log('   1. Update your .env file with the new credentials');
    console.log('   2. Update production environment variables');
    console.log('   3. Test a full nomination flow');
    console.log('   4. Test voter sync functionality');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Verify the access token is correct');
    console.log('   2. Check HubSpot app permissions/scopes');
    console.log('   3. Ensure the HubSpot account is active');
    console.log('   4. Check for any API rate limits');
  }

  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run the tests
runAllTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error);
  process.exit(1);
});