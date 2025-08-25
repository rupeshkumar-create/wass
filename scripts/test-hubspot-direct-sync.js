#!/usr/bin/env node

/**
 * Direct HubSpot Sync Test
 * Tests the HubSpot sync functions directly without going through the API
 */

// We need to use dynamic import since this is a .js file calling TypeScript modules
async function testDirectHubSpotSync() {
  console.log('🔧 Testing HubSpot Sync Functions Directly...');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Test syncVoter function
    console.log('\n1️⃣ Testing syncVoter function...');
    
    // Import the WSA HubSpot module
    const { syncVoter } = await import('../src/lib/hubspot-wsa.ts');
    
    await syncVoter(
      {
        firstName: 'Direct',
        lastName: 'Test Voter',
        email: 'direct.test.voter@example.com',
        phone: '+1-555-123-4567',
        linkedin: 'https://linkedin.com/in/direct-test-voter'
      },
      {
        category: 'Top Recruiter',
        nomineeName: 'Test Nominee',
        nomineeSlug: 'test-nominee'
      }
    );
    
    console.log('✅ syncVoter completed successfully');
    
    // Test 2: Test syncNominator function
    console.log('\n2️⃣ Testing syncNominator function...');
    
    const { syncNominator } = await import('../src/lib/hubspot-wsa.ts');
    
    await syncNominator({
      name: 'Direct Test Nominator',
      email: 'direct.test.nominator@example.com',
      phone: '+1-555-987-6543',
      linkedin: 'https://linkedin.com/in/direct-test-nominator'
    });
    
    console.log('✅ syncNominator completed successfully');
    
    // Test 3: Test basic HubSpot connection
    console.log('\n3️⃣ Testing HubSpot connection...');
    
    const { testHubSpotIntegration } = await import('../src/lib/hubspot-wsa.ts');
    
    const testResult = await testHubSpotIntegration();
    
    if (testResult.success) {
      console.log('✅ HubSpot integration test passed');
    } else {
      console.log('❌ HubSpot integration test failed:');
      testResult.results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`   ${status} ${result.test}${result.error ? ': ' + result.error : ''}`);
      });
    }
    
    console.log('\n🎉 Direct HubSpot sync test completed!');
    console.log('\n📋 Check your HubSpot contacts for:');
    console.log('- direct.test.voter@example.com (should be tagged as Voters 2026)');
    console.log('- direct.test.nominator@example.com (should be tagged as Voters 2026)');
    console.log('- Test contacts from integration test');
    
  } catch (error) {
    console.error('❌ Direct sync test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDirectHubSpotSync();