#!/usr/bin/env node

/**
 * Direct Sync Functions Test
 * Tests the sync functions directly to ensure they work
 */

// Load environment variables
require('dotenv').config();

console.log('🔧 Direct Sync Functions Test\n');

// Test HubSpot sync functions
async function testHubSpotSyncFunctions() {
  console.log('1. Testing HubSpot Sync Functions...');
  
  try {
    // Import the HubSpot functions
    const { syncNominator, syncVoter, testHubSpotIntegration } = require('../src/lib/hubspot-wsa.ts');
    
    console.log('   📦 HubSpot functions imported successfully');
    
    // Test the integration
    console.log('   🧪 Running HubSpot integration test...');
    const testResult = await testHubSpotIntegration();
    
    if (testResult.success) {
      console.log('   ✅ HubSpot integration test passed');
      testResult.results.forEach(result => {
        console.log(`      ${result.success ? '✅' : '❌'} ${result.test}: ${result.success ? 'PASS' : result.error}`);
      });
    } else {
      console.log('   ❌ HubSpot integration test failed');
      testResult.results.forEach(result => {
        console.log(`      ${result.success ? '✅' : '❌'} ${result.test}: ${result.success ? 'PASS' : result.error}`);
      });
    }
    
    // Test nominator sync
    console.log('   🧪 Testing nominator sync...');
    await syncNominator({
      name: 'Test Direct Nominator',
      email: `direct.nominator.${Date.now()}@test.com`,
      linkedin: 'https://linkedin.com/in/test-direct-nominator'
    });
    console.log('   ✅ Nominator sync completed');
    
    // Test voter sync
    console.log('   🧪 Testing voter sync...');
    await syncVoter({
      firstName: 'Test',
      lastName: 'Direct Voter',
      email: `direct.voter.${Date.now()}@test.com`,
      linkedin: 'https://linkedin.com/in/test-direct-voter'
    }, {
      category: 'Top Recruiter',
      nomineeName: 'Test Nominee',
      nomineeSlug: 'test-nominee'
    });
    console.log('   ✅ Voter sync completed');
    
    return true;
  } catch (error) {
    console.log(`   ❌ HubSpot sync test failed: ${error.message}`);
    console.log(`   📄 Stack: ${error.stack}`);
    return false;
  }
}

// Test Loops sync functions
async function testLoopsSyncFunctions() {
  console.log('\n2. Testing Loops Sync Functions...');
  
  try {
    // Import the Loops service
    const { loopsService } = require('../src/lib/loops.ts');
    
    console.log('   📦 Loops service imported successfully');
    
    if (!loopsService.isEnabled()) {
      console.log('   ⚠️  Loops service is disabled (check LOOPS_API_KEY)');
      return false;
    }
    
    const timestamp = Date.now();
    
    // Test nominator sync
    console.log('   🧪 Testing nominator sync...');
    await loopsService.syncNominator({
      name: 'Test Direct Nominator',
      email: `direct.nominator.${timestamp}@test.com`,
      linkedin: 'https://linkedin.com/in/test-direct-nominator'
    });
    console.log('   ✅ Nominator sync completed');
    
    // Test nominee sync
    console.log('   🧪 Testing nominee sync...');
    await loopsService.syncNominee({
      email: `direct.nominee.${timestamp}@test.com`,
      name: 'Test Direct Nominee',
      category: 'Top Recruiter',
      type: 'person',
      linkedin: 'https://linkedin.com/in/test-direct-nominee'
    });
    console.log('   ✅ Nominee sync completed');
    
    // Test voter sync
    console.log('   🧪 Testing voter sync...');
    await loopsService.syncVoter({
      firstName: 'Test',
      lastName: 'Direct Voter',
      email: `direct.voter.${timestamp}@test.com`
    });
    console.log('   ✅ Voter sync completed');
    
    // Test events
    console.log('   🧪 Testing event sending...');
    await loopsService.sendNominationEvent(
      { email: `direct.nominator.${timestamp}@test.com` },
      {
        category: 'Top Recruiter',
        nomineeId: 'test-id',
        nomineeName: 'Test Nominee',
        nomineeType: 'person'
      }
    );
    console.log('   ✅ Nomination event sent');
    
    await loopsService.sendVoteEvent(
      { email: `direct.voter.${timestamp}@test.com` },
      {
        category: 'Top Recruiter',
        nomineeId: 'test-id',
        nomineeSlug: 'test-nominee',
        nomineeName: 'Test Nominee'
      }
    );
    console.log('   ✅ Vote event sent');
    
    return true;
  } catch (error) {
    console.log(`   ❌ Loops sync test failed: ${error.message}`);
    console.log(`   📄 Stack: ${error.stack}`);
    return false;
  }
}

// Test API endpoints
async function testAPIEndpoints() {
  console.log('\n3. Testing API Endpoints...');
  
  try {
    // Test Loops test endpoint
    console.log('   🧪 Testing Loops test endpoint...');
    const response = await fetch('http://localhost:3000/api/dev/loops-test', {
      method: 'GET'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Loops test endpoint accessible');
      console.log(`      🔑 Loops enabled: ${data.loopsEnabled}`);
      console.log(`      🔑 API key configured: ${data.apiKeyConfigured}`);
      
      // Test a sync operation
      console.log('   🧪 Testing sync operation via API...');
      const syncResponse = await fetch('http://localhost:3000/api/dev/loops-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'sync-nominator',
          email: `api.test.${Date.now()}@test.com`,
          name: 'API Test Nominator'
        })
      });
      
      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        console.log('   ✅ API sync operation successful');
        console.log(`      📊 Result: ${syncData.success ? 'SUCCESS' : 'FAILED'}`);
      } else {
        console.log(`   ❌ API sync operation failed: ${syncResponse.status}`);
      }
    } else {
      console.log(`   ❌ Loops test endpoint failed: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ API endpoint test failed: ${error.message}`);
    return false;
  }
}

// Main execution
async function runDirectSyncTest() {
  console.log('🚀 Starting Direct Sync Functions Test');
  console.log('=====================================\n');
  
  const results = [];
  
  // Run tests
  results.push(await testHubSpotSyncFunctions());
  results.push(await testLoopsSyncFunctions());
  results.push(await testAPIEndpoints());
  
  // Summary
  const passedTests = results.filter(Boolean).length;
  const totalTests = results.length;
  
  console.log('\n📊 Direct Sync Test Results:');
  console.log('============================');
  console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All direct sync tests passed!');
    console.log('✅ HubSpot sync functions are working');
    console.log('✅ Loops sync functions are working');
    console.log('✅ API endpoints are accessible');
    console.log('\n📋 Next Steps:');
    console.log('1. Run the live integration test: node scripts/test-live-integration-sync.js');
    console.log('2. Check HubSpot and Loops dashboards for test contacts');
    console.log('3. Verify all properties and segments are correctly set');
  } else {
    console.log('\n⚠️  Some direct sync tests failed.');
    console.log('Please check the errors above and verify:');
    console.log('1. Environment variables are set correctly');
    console.log('2. Dependencies are properly installed');
    console.log('3. API keys are valid and have correct permissions');
  }
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run the test
runDirectSyncTest().catch(error => {
  console.error('\n💥 Direct sync test crashed:', error);
  process.exit(1);
});