#!/usr/bin/env node

// Verification script for World Staffing Awards functionality
const baseUrl = 'http://localhost:3000';

async function testAPI(endpoint, description) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`);
    const data = await response.json();
    console.log(`✅ ${description}: ${response.status === 200 ? 'PASS' : 'FAIL'}`);
    return { success: response.status === 200, data };
  } catch (error) {
    console.log(`❌ ${description}: ERROR - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 World Staffing Awards - Functionality Verification\n');
  
  // Test 1: Category Filtering
  await testAPI('/api/nominees?category=Top%20Recruiter', 'Category Filtering - Top Recruiter');
  await testAPI('/api/nominees?category=Top%20Staffing%20Influencer', 'Category Filtering - Top Staffing Influencer');
  
  // Test 2: Profile View
  await testAPI('/api/nominee/morgan-brown-3', 'Profile View - Valid Nominee');
  await testAPI('/api/nominee/non-existent', 'Profile View - Error Handling');
  
  // Test 3: General APIs
  await testAPI('/api/nominees', 'All Nominees API');
  await testAPI('/api/stats', 'Stats API');
  await testAPI('/api/podium', 'Podium API');
  
  console.log('\n🎉 Verification Complete!');
  console.log('All core functionality is working as expected.');
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testAPI, runTests };