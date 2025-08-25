#!/usr/bin/env node

/**
 * Integration Endpoints Test
 * Tests the actual API endpoints to verify sync functionality
 */

const https = require('https');
const http = require('http');

// Load environment variables
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Integration Endpoints Test\n');

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

// Test environment variables
function testEnvironmentVariables() {
  console.log('1. Testing Environment Variables...');
  
  const requiredVars = {
    'HUBSPOT_PRIVATE_APP_TOKEN': process.env.HUBSPOT_PRIVATE_APP_TOKEN,
    'HUBSPOT_CLIENT_SECRET': process.env.HUBSPOT_CLIENT_SECRET,
    'LOOPS_API_KEY': process.env.LOOPS_API_KEY,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY
  };
  
  let allConfigured = true;
  
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (value && value !== 'your_loops_key' && value !== 'your-supabase-key') {
      console.log(`   ✅ ${key}: Configured`);
    } else {
      console.log(`   ❌ ${key}: Missing or not configured`);
      allConfigured = false;
    }
  });
  
  return allConfigured;
}

// Test HubSpot API directly
async function testHubSpotAPI() {
  console.log('\n2. Testing HubSpot API...');
  
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) {
    console.log('   ❌ HubSpot token not found');
    return false;
  }
  
  try {
    const options = {
      hostname: 'api.hubapi.com',
      port: 443,
      path: '/crm/v3/objects/contacts?limit=1',
      method: 'GET',
      protocol: 'https:',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('   ✅ HubSpot API connection successful');
      console.log(`   📊 Found ${response.data.results ? response.data.results.length : 0} contacts`);
      return true;
    } else {
      console.log(`   ❌ HubSpot API failed: ${response.statusCode}`);
      console.log(`   📄 Error: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ HubSpot API error: ${error.message}`);
    return false;
  }
}

// Test Loops API via our integration endpoint (more reliable)
async function testLoopsAPI() {
  console.log('\n3. Testing Loops API (via integration)...');
  
  const token = process.env.LOOPS_API_KEY;
  if (!token) {
    console.log('   ❌ Loops token not found');
    return false;
  }
  
  try {
    // Test via our integration endpoint instead of direct API
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/dev/loops-test',
      method: 'POST',
      protocol: 'http:',
      headers: {
        'Content-Type': 'application/json',
      },
    }, {
      action: 'find-contact',
      email: 'nonexistent@test.com'
    });
    
    if (response.statusCode === 200) {
      console.log('   ✅ Loops API connection successful (via integration)');
      return true;
    } else {
      console.log(`   ❌ Loops API failed: ${response.statusCode}`);
      console.log(`   📄 Error: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Loops API error: ${error.message}`);
    return false;
  }
}

// Test development server
async function testDevServer() {
  console.log('\n4. Testing Development Server...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/stats',
      method: 'GET',
      protocol: 'http:',
    });
    
    if (response.statusCode === 200) {
      console.log('   ✅ Development server is running');
      return true;
    } else {
      console.log(`   ❌ Development server error: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Development server not running');
    console.log('   💡 Please start with: npm run dev');
    return false;
  }
}

// Test Loops integration endpoint
async function testLoopsIntegrationEndpoint() {
  console.log('\n5. Testing Loops Integration Endpoint...');
  
  try {
    // Test the Loops test endpoint
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/dev/loops-test',
      method: 'GET',
      protocol: 'http:',
    });
    
    if (response.statusCode === 200) {
      console.log('   ✅ Loops integration endpoint accessible');
      console.log(`   🔑 Loops enabled: ${response.data.loopsEnabled}`);
      console.log(`   🔑 API key configured: ${response.data.apiKeyConfigured}`);
      
      // Test actual sync
      const timestamp = Date.now();
      const syncResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/dev/loops-test',
        method: 'POST',
        protocol: 'http:',
        headers: {
          'Content-Type': 'application/json',
        },
      }, {
        action: 'sync-nominator',
        email: `test.nominator.${timestamp}@example.com`,
        name: 'Test Integration Nominator'
      });
      
      if (syncResponse.statusCode === 200 && syncResponse.data.success) {
        console.log('   ✅ Nominator sync test successful');
        
        // Test list addition
        const listResponse = await makeRequest({
          hostname: 'localhost',
          port: 3000,
          path: '/api/dev/loops-test',
          method: 'POST',
          protocol: 'http:',
          headers: {
            'Content-Type': 'application/json',
          },
        }, {
          action: 'test-all-lists',
          email: `test.lists.${timestamp}@example.com`
        });
        
        if (listResponse.statusCode === 200 && listResponse.data.success) {
          console.log('   ✅ List management test successful');
          const results = listResponse.data.result.listTests;
          results.forEach(result => {
            console.log(`      ${result.success ? '✅' : '❌'} ${result.list} list: ${result.success ? 'ADDED' : result.error}`);
          });
        }
        
        return true;
      } else {
        console.log('   ❌ Sync test failed');
        return false;
      }
    } else {
      console.log(`   ❌ Loops integration endpoint failed: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Loops integration test error: ${error.message}`);
    return false;
  }
}

// Test actual nomination flow
async function testNominationFlow() {
  console.log('\n6. Testing Nomination Flow...');
  
  try {
    const timestamp = Date.now();
    const nominationData = {
      category: 'Top Recruiter',
      nominator: {
        name: 'Test Integration Nominator',
        email: `integration.nominator.${timestamp}@example.com`,
        linkedin: 'https://linkedin.com/in/test-integration-nominator'
      },
      nominee: {
        name: 'Test Integration Nominee',
        email: `integration.nominee.${timestamp}@example.com`,
        linkedin: 'https://linkedin.com/in/test-integration-nominee',
        title: 'Senior Recruiter',
        country: 'United States',
        imageUrl: 'https://via.placeholder.com/400x400.png?text=Test+Nominee',
        whyVoteForMe: 'Integration test nomination'
      }
    };
    
    console.log('   📤 Submitting test nomination...');
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/nominations',
      method: 'POST',
      protocol: 'http:',
      headers: {
        'Content-Type': 'application/json',
      },
    }, nominationData);
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('   ✅ Nomination submitted successfully');
      console.log(`   📋 Nomination ID: ${response.data.id}`);
      
      // Wait for sync to complete
      console.log('   ⏳ Waiting for sync to complete...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test approval
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
        id: response.data.id,
        status: 'approved'
      });
      
      if (approvalResponse.statusCode === 200 && approvalResponse.data.success) {
        console.log('   ✅ Nomination approved successfully');
        
        // Wait for nominee sync
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
          success: true,
          nominationId: response.data.id,
          nominatorEmail: nominationData.nominator.email,
          nomineeEmail: nominationData.nominee.email
        };
      } else {
        console.log('   ❌ Nomination approval failed');
        return { success: false };
      }
    } else {
      console.log('   ❌ Nomination submission failed');
      console.log(`   📄 Error: ${JSON.stringify(response.data, null, 2)}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ Nomination flow error: ${error.message}`);
    return { success: false };
  }
}

// Test vote flow
async function testVoteFlow(nominationId, nomineeEmail) {
  console.log('\n7. Testing Vote Flow...');
  
  try {
    const timestamp = Date.now();
    const voteData = {
      nomineeId: nominationId,
      category: 'Top Recruiter',
      voter: {
        firstName: 'Test',
        lastName: 'Integration Voter',
        email: `integration.voter.${timestamp}@example.com`,
        linkedin: 'https://linkedin.com/in/test-integration-voter'
      }
    };
    
    console.log('   📤 Submitting test vote...');
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
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('   ✅ Vote submitted successfully');
      console.log(`   📊 Total votes: ${response.data.total}`);
      
      // Wait for sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        voterEmail: voteData.voter.email
      };
    } else {
      console.log('   ❌ Vote submission failed');
      console.log(`   📄 Error: ${JSON.stringify(response.data, null, 2)}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ Vote flow error: ${error.message}`);
    return { success: false };
  }
}

// Main test execution
async function runIntegrationTest() {
  console.log('🚀 Starting Integration Endpoints Test');
  console.log('=====================================\n');
  
  const results = [];
  
  // Run basic tests
  results.push(testEnvironmentVariables());
  results.push(await testHubSpotAPI());
  results.push(await testLoopsAPI());
  results.push(await testDevServer());
  
  if (results[3]) { // If dev server is running
    results.push(await testLoopsIntegrationEndpoint());
    
    // Test full flow
    const nominationResult = await testNominationFlow();
    results.push(nominationResult.success);
    
    if (nominationResult.success) {
      const voteResult = await testVoteFlow(nominationResult.nominationId, nominationResult.nomineeEmail);
      results.push(voteResult.success);
      
      if (voteResult.success) {
        console.log('\n📋 Test Data Created:');
        console.log(`   Nominator: ${nominationResult.nominatorEmail}`);
        console.log(`   Nominee: ${nominationResult.nomineeEmail}`);
        console.log(`   Voter: ${voteResult.voterEmail}`);
        console.log('\n💡 Check HubSpot and Loops dashboards to verify sync!');
      }
    }
  }
  
  // Summary
  const passedTests = results.filter(Boolean).length;
  const totalTests = results.length;
  
  console.log('\n📊 Integration Test Results:');
  console.log('============================');
  console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All integration tests passed!');
    console.log('✅ Environment variables configured');
    console.log('✅ HubSpot API connection working');
    console.log('✅ Loops API connection working');
    console.log('✅ Development server running');
    console.log('✅ Integration endpoints working');
    console.log('✅ Nomination flow working');
    console.log('✅ Vote flow working');
    console.log('\n🔍 Next Steps:');
    console.log('1. Check HubSpot contacts for test data');
    console.log('2. Check Loops contacts and lists');
    console.log('3. Verify all properties and segments are set');
  } else {
    console.log('\n⚠️  Some integration tests failed.');
    console.log('Please check the errors above and:');
    console.log('1. Ensure development server is running: npm run dev');
    console.log('2. Verify all environment variables are set');
    console.log('3. Check API key permissions');
  }
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run the test
runIntegrationTest().catch(error => {
  console.error('\n💥 Integration test crashed:', error);
  process.exit(1);
});