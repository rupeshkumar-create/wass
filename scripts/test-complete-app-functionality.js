#!/usr/bin/env node

/**
 * Complete App Functionality Test
 * Tests all syncing between HubSpot, Loops, and Supabase
 * Verifies the entire nomination workflow
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test configuration
const TEST_EMAIL = 'test-nominee-' + Date.now() + '@example.com';
const TEST_NOMINATOR_EMAIL = 'test-nominator-' + Date.now() + '@example.com';

async function testCompleteAppFunctionality() {
  console.log('🚀 Starting Complete App Functionality Test');
  console.log('=' .repeat(60));
  
  const results = {
    database: { passed: 0, failed: 0, tests: [] },
    hubspot: { passed: 0, failed: 0, tests: [] },
    loops: { passed: 0, failed: 0, tests: [] },
    frontend: { passed: 0, failed: 0, tests: [] },
    integration: { passed: 0, failed: 0, tests: [] }
  };

  try {
    // 1. Test Database Schema and Connectivity
    console.log('\n📊 Testing Database Schema and Connectivity...');
    await testDatabaseSchema(results);
    
    // 2. Test Environment Variables
    console.log('\n🔧 Testing Environment Variables...');
    await testEnvironmentVariables(results);
    
    // 3. Test HubSpot Integration
    console.log('\n🔗 Testing HubSpot Integration...');
    await testHubSpotIntegration(results);
    
    // 4. Test Loops Integration
    console.log('\n🔄 Testing Loops Integration...');
    await testLoopsIntegration(results);
    
    // 5. Test API Endpoints
    console.log('\n🌐 Testing API Endpoints...');
    await testAPIEndpoints(results);
    
    // 6. Test Complete Nomination Flow
    console.log('\n📝 Testing Complete Nomination Flow...');
    await testNominationFlow(results);
    
    // 7. Test Admin Functionality
    console.log('\n👨‍💼 Testing Admin Functionality...');
    await testAdminFunctionality(results);
    
    // 8. Test Voting System
    console.log('\n🗳️ Testing Voting System...');
    await testVotingSystem(results);
    
    // 9. Test Sync Integrations
    console.log('\n🔄 Testing Sync Integrations...');
    await testSyncIntegrations(results);
    
    // Generate Final Report
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL TEST RESULTS');
    console.log('='.repeat(60));
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    Object.keys(results).forEach(category => {
      const { passed, failed, tests } = results[category];
      totalPassed += passed;
      totalFailed += failed;
      
      const status = failed === 0 ? '✅' : '❌';
      console.log(`${status} ${category.toUpperCase()}: ${passed} passed, ${failed} failed`);
      
      if (failed > 0) {
        tests.forEach(test => {
          if (!test.passed) {
            console.log(`   ❌ ${test.name}: ${test.error}`);
          }
        });
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`🎯 OVERALL: ${totalPassed} passed, ${totalFailed} failed`);
    
    if (totalFailed === 0) {
      console.log('🎉 ALL TESTS PASSED! App is fully functional.');
    } else {
      console.log('⚠️  Some tests failed. Check the details above.');
    }
    
    return totalFailed === 0;
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    return false;
  }
}

async function testDatabaseSchema(results) {
  const tests = [
    { name: 'Supabase Connection', test: testSupabaseConnection },
    { name: 'Nominees Table Structure', test: testNomineesTable },
    { name: 'Nominators Table Structure', test: testNominatorsTable },
    { name: 'Nominations Table Structure', test: testNominationsTable },
    { name: 'Loops Sync Fields', test: testLoopsSyncFields },
    { name: 'HubSpot Outbox Table', test: testHubSpotOutbox },
    { name: 'Loops Outbox Table', test: testLoopsOutbox }
  ];
  
  for (const test of tests) {
    try {
      await test.test();
      results.database.passed++;
      results.database.tests.push({ name: test.name, passed: true });
      console.log(`  ✅ ${test.name}`);
    } catch (error) {
      results.database.failed++;
      results.database.tests.push({ name: test.name, passed: false, error: error.message });
      console.log(`  ❌ ${test.name}: ${error.message}`);
    }
  }
}

async function testSupabaseConnection() {
  const { data, error } = await supabase.from('nominees').select('count').limit(1);
  if (error) throw new Error(`Supabase connection failed: ${error.message}`);
}

async function testNomineesTable() {
  const { data, error } = await supabase.from('nominees').select('*').limit(1);
  if (error) throw new Error(`Nominees table error: ${error.message}`);
  
  if (data && data.length > 0) {
    const nominee = data[0];
    const requiredFields = ['id', 'type', 'created_at'];
    for (const field of requiredFields) {
      if (!(field in nominee)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }
}

async function testNominatorsTable() {
  const { data, error } = await supabase.from('nominators').select('*').limit(1);
  if (error) throw new Error(`Nominators table error: ${error.message}`);
}

async function testNominationsTable() {
  const { data, error } = await supabase.from('nominations').select('*').limit(1);
  if (error) throw new Error(`Nominations table error: ${error.message}`);
}

async function testLoopsSyncFields() {
  const { data, error } = await supabase.from('nominees').select('loops_contact_id, loops_synced_at').limit(1);
  if (error) {
    if (error.message.includes('does not exist')) {
      throw new Error('Loops sync fields missing - run the SQL schema update');
    }
    throw new Error(`Loops sync fields error: ${error.message}`);
  }
}

async function testHubSpotOutbox() {
  const { data, error } = await supabase.from('hubspot_outbox').select('*').limit(1);
  if (error) throw new Error(`HubSpot outbox error: ${error.message}`);
}

async function testLoopsOutbox() {
  const { data, error } = await supabase.from('loops_outbox').select('*').limit(1);
  if (error) throw new Error(`Loops outbox error: ${error.message}`);
}

async function testEnvironmentVariables(results) {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'HUBSPOT_ACCESS_TOKEN',
    'LOOPS_API_KEY'
  ];
  
  for (const varName of requiredVars) {
    try {
      if (!process.env[varName]) {
        throw new Error(`Missing environment variable: ${varName}`);
      }
      results.database.passed++;
      results.database.tests.push({ name: `Env Var: ${varName}`, passed: true });
      console.log(`  ✅ ${varName}`);
    } catch (error) {
      results.database.failed++;
      results.database.tests.push({ name: `Env Var: ${varName}`, passed: false, error: error.message });
      console.log(`  ❌ ${varName}: ${error.message}`);
    }
  }
}

async function testHubSpotIntegration(results) {
  const tests = [
    { name: 'HubSpot API Connection', test: testHubSpotConnection },
    { name: 'HubSpot Contact Creation', test: testHubSpotContactCreation },
    { name: 'HubSpot Properties', test: testHubSpotProperties }
  ];
  
  for (const test of tests) {
    try {
      await test.test();
      results.hubspot.passed++;
      results.hubspot.tests.push({ name: test.name, passed: true });
      console.log(`  ✅ ${test.name}`);
    } catch (error) {
      results.hubspot.failed++;
      results.hubspot.tests.push({ name: test.name, passed: false, error: error.message });
      console.log(`  ❌ ${test.name}: ${error.message}`);
    }
  }
}

async function testHubSpotConnection() {
  const token = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_TOKEN;
  const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.status}`);
  }
}

async function testHubSpotContactCreation() {
  const token = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_TOKEN;
  const testContact = {
    properties: {
      email: `test-${Date.now()}@example.com`,
      firstname: 'Test',
      lastname: 'Contact',
      lifecyclestage: 'lead',
      source: 'WSA26'
    }
  };
  
  const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testContact)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HubSpot contact creation failed: ${error}`);
  }
  
  const result = await response.json();
  
  // Clean up test contact
  try {
    await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${result.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (e) {
    // Ignore cleanup errors
  }
}

async function testHubSpotProperties() {
  const token = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_TOKEN;
  const response = await fetch('https://api.hubapi.com/crm/v3/properties/contacts', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error(`HubSpot properties API error: ${response.status}`);
  }
}

async function testLoopsIntegration(results) {
  const tests = [
    { name: 'Loops API Connection', test: testLoopsConnection },
    { name: 'Loops Contact Creation', test: testLoopsContactCreation }
  ];
  
  for (const test of tests) {
    try {
      await test.test();
      results.loops.passed++;
      results.loops.tests.push({ name: test.name, passed: true });
      console.log(`  ✅ ${test.name}`);
    } catch (error) {
      results.loops.failed++;
      results.loops.tests.push({ name: test.name, passed: false, error: error.message });
      console.log(`  ❌ ${test.name}: ${error.message}`);
    }
  }
}

async function testLoopsConnection() {
  const response = await fetch('https://app.loops.so/api/v1/contacts/find?email=nonexistent@example.com', {
    headers: { 'Authorization': `Bearer ${process.env.LOOPS_API_KEY}` }
  });
  
  // 404 is expected for non-existent contact, but API should be accessible
  if (response.status !== 404 && !response.ok) {
    throw new Error(`Loops API error: ${response.status}`);
  }
}

async function testLoopsContactCreation() {
  const testContact = {
    email: `test-loops-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'Contact',
    userGroup: 'nominees',
    source: 'WSA2026'
  };
  
  const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testContact)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Loops contact creation failed: ${error}`);
  }
}

async function testAPIEndpoints(results) {
  const endpoints = [
    { name: 'Test Environment', path: '/api/test-env' },
    { name: 'Nominees API', path: '/api/nominees' },
    { name: 'Stats API', path: '/api/stats' },
    { name: 'Admin Nominations', path: '/api/admin/nominations' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint.path}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      results.frontend.passed++;
      results.frontend.tests.push({ name: endpoint.name, passed: true });
      console.log(`  ✅ ${endpoint.name}`);
    } catch (error) {
      results.frontend.failed++;
      results.frontend.tests.push({ name: endpoint.name, passed: false, error: error.message });
      console.log(`  ❌ ${endpoint.name}: ${error.message}`);
    }
  }
}

async function testNominationFlow(results) {
  try {
    // Test creating a complete nomination
    const nominatorData = {
      email: TEST_NOMINATOR_EMAIL,
      firstname: 'Test',
      lastname: 'Nominator',
      linkedin: 'https://linkedin.com/in/test-nominator',
      company: 'Test Company',
      job_title: 'Test Role'
    };
    
    const { data: nominator, error: nominatorError } = await supabase
      .from('nominators')
      .insert(nominatorData)
      .select()
      .single();
    
    if (nominatorError) throw new Error(`Nominator creation failed: ${nominatorError.message}`);
    
    const nomineeData = {
      type: 'person',
      firstname: 'Test',
      lastname: 'Nominee',
      person_email: TEST_EMAIL,
      person_linkedin: 'https://linkedin.com/in/test-nominee',
      jobtitle: 'Test Position',
      why_me: 'Test nomination reason'
    };
    
    const { data: nominee, error: nomineeError } = await supabase
      .from('nominees')
      .insert(nomineeData)
      .select()
      .single();
    
    if (nomineeError) throw new Error(`Nominee creation failed: ${nomineeError.message}`);
    
    const nominationData = {
      nominator_id: nominator.id,
      nominee_id: nominee.id,
      category_group_id: 'individual-excellence',
      subcategory_id: 'rising-star-under-30',
      state: 'submitted'
    };
    
    const { data: nomination, error: nominationError } = await supabase
      .from('nominations')
      .insert(nominationData)
      .select()
      .single();
    
    if (nominationError) throw new Error(`Nomination creation failed: ${nominationError.message}`);
    
    results.integration.passed++;
    results.integration.tests.push({ name: 'Complete Nomination Flow', passed: true });
    console.log('  ✅ Complete Nomination Flow');
    
    // Clean up test data
    await supabase.from('nominations').delete().eq('id', nomination.id);
    await supabase.from('nominees').delete().eq('id', nominee.id);
    await supabase.from('nominators').delete().eq('id', nominator.id);
    
  } catch (error) {
    results.integration.failed++;
    results.integration.tests.push({ name: 'Complete Nomination Flow', passed: false, error: error.message });
    console.log(`  ❌ Complete Nomination Flow: ${error.message}`);
  }
}

async function testAdminFunctionality(results) {
  try {
    // Test admin nominations view
    const { data, error } = await supabase
      .from('admin_nominations')
      .select('*')
      .limit(5);
    
    if (error) throw new Error(`Admin view error: ${error.message}`);
    
    results.integration.passed++;
    results.integration.tests.push({ name: 'Admin Functionality', passed: true });
    console.log('  ✅ Admin Functionality');
    
  } catch (error) {
    results.integration.failed++;
    results.integration.tests.push({ name: 'Admin Functionality', passed: false, error: error.message });
    console.log(`  ❌ Admin Functionality: ${error.message}`);
  }
}

async function testVotingSystem(results) {
  try {
    // Test voting system components
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .limit(1);
    
    if (votesError) throw new Error(`Votes table error: ${votesError.message}`);
    
    const { data: voters, error: votersError } = await supabase
      .from('voters')
      .select('*')
      .limit(1);
    
    if (votersError) throw new Error(`Voters table error: ${votersError.message}`);
    
    results.integration.passed++;
    results.integration.tests.push({ name: 'Voting System', passed: true });
    console.log('  ✅ Voting System');
    
  } catch (error) {
    results.integration.failed++;
    results.integration.tests.push({ name: 'Voting System', passed: false, error: error.message });
    console.log(`  ❌ Voting System: ${error.message}`);
  }
}

async function testSyncIntegrations(results) {
  const tests = [
    { name: 'HubSpot Sync Endpoint', test: () => testSyncEndpoint('/api/sync/hubspot/run') },
    { name: 'Loops Sync Endpoint', test: () => testSyncEndpoint('/api/sync/loops/run') }
  ];
  
  for (const test of tests) {
    try {
      await test.test();
      results.integration.passed++;
      results.integration.tests.push({ name: test.name, passed: true });
      console.log(`  ✅ ${test.name}`);
    } catch (error) {
      results.integration.failed++;
      results.integration.tests.push({ name: test.name, passed: false, error: error.message });
      console.log(`  ❌ ${test.name}: ${error.message}`);
    }
  }
}

async function testSyncEndpoint(path) {
  const response = await fetch(`http://localhost:3000${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`Sync endpoint error: ${response.status}`);
  }
}

// Run the test
if (require.main === module) {
  testCompleteAppFunctionality()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = { testCompleteAppFunctionality };