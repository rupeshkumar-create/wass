#!/usr/bin/env node

/**
 * Direct Sync Test - Tests sync functions directly
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Direct Sync Test');
console.log('==================');

async function testDirectSync() {
  try {
    // Import the sync functions
    const { syncNominator, syncVoter, syncNomination } = await import('../src/lib/hubspot-wsa.ts');
    const { loopsService } = await import('../src/lib/loops.ts');

    console.log('📋 Testing HubSpot Direct Sync...');
    
    // Test nominator sync
    console.log('🔄 Testing nominator sync...');
    await syncNominator({
      name: 'Test Direct Nominator',
      email: `test.direct.nominator.${Date.now()}@example.com`,
      phone: '+1234567890',
      linkedin: 'https://www.linkedin.com/in/test-direct-nominator'
    });
    console.log('✅ Nominator sync successful');

    // Test voter sync
    console.log('🔄 Testing voter sync...');
    await syncVoter(
      {
        firstName: 'Test',
        lastName: 'Direct Voter',
        email: `test.direct.voter.${Date.now()}@example.com`,
        phone: '+1234567891',
        linkedin: 'https://www.linkedin.com/in/test-direct-voter'
      },
      {
        category: 'Top Recruiter',
        nomineeName: 'Test Nominee',
        nomineeSlug: 'test-nominee'
      }
    );
    console.log('✅ Voter sync successful');

    console.log('📋 Testing Loops Direct Sync...');
    
    // Test nominator sync to Loops
    console.log('🔄 Testing nominator sync to Loops...');
    await loopsService.syncNominator({
      name: 'Test Direct Nominator Loops',
      email: `test.direct.nominator.loops.${Date.now()}@example.com`,
      phone: '+1234567892',
      linkedin: 'https://www.linkedin.com/in/test-direct-nominator-loops'
    });
    console.log('✅ Nominator Loops sync successful');

    // Test voter sync to Loops
    console.log('🔄 Testing voter sync to Loops...');
    await loopsService.syncVoter({
      email: `test.direct.voter.loops.${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'Direct Voter Loops'
    });
    console.log('✅ Voter Loops sync successful');

    // Test nominee sync to Loops
    console.log('🔄 Testing nominee sync to Loops...');
    await loopsService.syncNominee({
      email: `test.direct.nominee.loops.${Date.now()}@example.com`,
      name: 'Test Direct Nominee Loops',
      category: 'Top Recruiter',
      type: 'person',
      linkedin: 'https://www.linkedin.com/in/test-direct-nominee-loops'
    });
    console.log('✅ Nominee Loops sync successful');

    console.log('\n🎉 All direct sync tests passed!');
    console.log('✅ HubSpot sync functions working');
    console.log('✅ Loops sync functions working');

  } catch (error) {
    console.error('❌ Direct sync test failed:', error);
    process.exit(1);
  }
}

testDirectSync();